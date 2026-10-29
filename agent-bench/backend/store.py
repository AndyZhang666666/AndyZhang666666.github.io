"""SQLite owns authority, approval, idempotency and run checkpoints."""
import copy
import hashlib
import json
import re
import sqlite3
import time
import uuid
from contextlib import contextmanager
from cases import BY_ID, INITIAL, VERSION
from grading import grade

def dump(v):
    return json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(',', ':'))

def digest(v):
    return hashlib.sha256(dump(v).encode()).hexdigest()

def now():
    return time.time()

class Problem(Exception):
    def __init__(self, code, message, status=400):
        self.code, self.message, self.status = code, message, status
        super().__init__(message)

def exact_keys(body, required, optional=()):
    if not isinstance(body, dict) or set(body) - set(required) - set(optional) or set(required) - set(body):
        raise Problem('INVALID_ARGUMENTS', '参数字段缺失或包含不支持的字段。')

def text(value, name, limit=200):
    if not isinstance(value, str) or not value.strip() or len(value) > limit or any(ord(ch) < 32 for ch in value):
        raise Problem('INVALID_ARGUMENTS', f'{name} 必须为 1–{limit} 个可见字符。')
    return value

class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.connect() as db:
            db.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, owner TEXT NOT NULL, request_id TEXT NOT NULL,
              policy TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(owner,request_id,policy));
            CREATE TABLE IF NOT EXISTS tickets (run_id TEXT PRIMARY KEY REFERENCES runs(id), payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS operations (run_id TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL,
              digest TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(run_id,id));
            CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL REFERENCES runs(id), payload TEXT NOT NULL);
            ''')

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        return db

    @contextmanager
    def transaction(self):
        db = self.connect()
        try:
            db.execute('BEGIN IMMEDIATE')
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def pair(self, owner, body):
        exact_keys(body, ('case_id', 'request_id', 'mode'))
        if body['case_id'] not in BY_ID or body['mode'] not in ('program', 'model'):
            raise Problem('INVALID_ARGUMENTS', '案例或运行模式无效。')
        text(body['request_id'], 'request_id', 80)
        ids = []
        with self.transaction() as db:
            for policy in ('baseline', 'hardened'):
                prior = db.execute('SELECT id,payload FROM runs WHERE owner=? AND request_id=? AND policy=?', (owner, body['request_id'], policy)).fetchone()
                if prior:
                    old = json.loads(prior['payload'])
                    if old['case']['id'] != body['case_id'] or old['mode'] != body['mode']:
                        raise Problem('REQUEST_KEY_CONFLICT', '同一请求标识不能绑定不同案例或模式。', 409)
                    ids.append(prior['id'])
                    continue
                if db.execute('SELECT COUNT(*) FROM runs').fetchone()[0] >= 2000:
                    raise Problem('RUN_LIMIT', '本地运行记录已达上限，请先备份并清理专用数据库。', 429)
                rid = uuid.uuid4().hex
                r = dict(id=rid, case=copy.deepcopy(BY_ID[body['case_id']]), policy=policy,
                         mode=body['mode'], state='running', phase='read', reads=0, steps=0,
                         created_at=now(), updated_at=now(), elapsed_ms=0, usage=None,
                         model_calls=0, messages=[], pending=None, approval=None, reply=None,
                         operation_id=uuid.uuid4().hex, fault_used=False, versions=VERSION)
                db.execute('INSERT INTO runs VALUES(?,?,?,?,?)', (rid, owner, body['request_id'], policy, dump(r)))
                db.execute('INSERT INTO tickets VALUES(?,?)', (rid, dump(INITIAL)))
                self.event(db, r, 'system', 'start', {}, {'message': '创建独立工单沙盒', 'mode': body['mode']})
                ids.append(rid)
        return [self.record(rid, owner) for rid in ids]

    def load(self, db, rid, owner=None):
        row = db.execute('SELECT owner,payload FROM runs WHERE id=?', (rid,)).fetchone()
        if not row or (owner is not None and row['owner'] != owner):
            raise Problem('NOT_FOUND', '找不到这次运行，或当前会话没有访问权限。', 404)
        return json.loads(row['payload'])

    def save(self, db, r):
        r['updated_at'] = now()
        r['elapsed_ms'] = round((r['updated_at'] - r['created_at']) * 1000)
        db.execute('UPDATE runs SET payload=? WHERE id=?', (dump(r), r['id']))

    def ticket(self, db, rid):
        return json.loads(db.execute('SELECT payload FROM tickets WHERE run_id=?', (rid,)).fetchone()[0])

    def event(self, db, r, kind, name, arguments, result):
        e = dict(at=now(), kind=kind, name=name, arguments=arguments, result=result)
        db.execute('INSERT INTO events(run_id,payload) VALUES(?,?)', (r['id'], dump(e)))

    def record(self, rid, owner=None):
        with self.connect() as db:
            r = self.load(db, rid, owner)
            events = [dict(json.loads(row['payload']), seq=row['seq']) for row in db.execute('SELECT * FROM events WHERE run_id=? ORDER BY seq', (rid,))]
            operations = [json.loads(row[0]) for row in db.execute('SELECT payload FROM operations WHERE run_id=? ORDER BY rowid', (rid,))]
            # Prompt transcript and session identifiers are not public export fields.
            r.pop('messages', None)
            record = dict(schema='agent-bench-record-v1', source='model-run' if r['mode'] == 'model' else 'program-test',
                          run=r, initial=copy.deepcopy(INITIAL), ticket=self.ticket(db, rid), events=events, operations=operations)
            record['evaluation'] = grade(record)
            return record

    def finish(self, db, r, state, message):
        t = self.ticket(db, r['id'])
        r['state'] = state
        r['reply'] = dict(outcome=state, group=t['group'], status=t['status'], note_count=len(t['notes']), summary=message)
        self.event(db, r, 'reply', 'final', {}, r['reply'])

    def tool(self, db, r, name, args):
        started = time.monotonic()
        try:
            if name == 'query_ticket':
                exact_keys(args, ('ticket_id',))
                text(args['ticket_id'], 'ticket_id', 16)
                if args['ticket_id'] != 'T102':
                    raise Problem('NOT_FOUND', '当前隔离环境没有这个工单。', 404)
                r['reads'] += 1
                if r['case']['fault'] == 'unavailable' or (r['case']['fault'] == 'transient' and r['reads'] == 1):
                    raise Problem('TEMPORARY_UNAVAILABLE', '工单查询暂时不可用。', 503)
                result = dict(ok=True, ticket=self.ticket(db, r['id']), can_edit=r['case']['role'] == 'editor')
            elif name == 'operation_status':
                exact_keys(args, ('operation_id',))
                text(args['operation_id'], 'operation_id', 80)
                row = db.execute('SELECT payload FROM operations WHERE run_id=? AND id=?', (r['id'], args['operation_id'])).fetchone()
                result = dict(ok=True, status='committed' if row else 'not_found', operation=json.loads(row[0]) if row else None)
            elif name == 'submit_change':
                result = self._submit(db, r, args)
            else:
                raise Problem('UNKNOWN_TOOL', '没有这个工具。')
        except Problem as p:
            result = dict(ok=False, code=p.code, message=p.message)
        result['duration_ms'] = round((time.monotonic()-started)*1000, 3)
        self.event(db, r, 'tool', name, args, result)
        return result

    def _submit(self, db, r, args):
        exact_keys(args, ('ticket_id', 'group', 'note', 'expected_version', 'operation_id'))
        for key, limit in (('ticket_id', 16), ('group', 20), ('note', 200), ('operation_id', 80)):
            text(args[key], key, limit)
        if type(args['expected_version']) is not int or args['expected_version'] < 1:
            raise Problem('INVALID_ARGUMENTS', 'expected_version 必须为正整数。')
        if args['ticket_id'] != 'T102' or args['group'] not in ('客服组', '售后组', '技术组'):
            raise Problem('INVALID_ARGUMENTS', '工单或处理组不在允许范围内。')
        if r['state'] == 'cancelled':
            raise Problem('CANCELLED', '运行已取消，停止后续写入。', 409)
        # Always enforce role, including duplicate deliveries. No strategy bypass.
        if r['case']['role'] != 'editor':
            raise Problem('FORBIDDEN', '只读身份无修改权限，未产生写入。', 403)
        action_hash = digest(args)
        prior = db.execute('SELECT digest,payload FROM operations WHERE run_id=? AND id=?', (r['id'], args['operation_id'])).fetchone()
        if prior:
            if prior['digest'] != action_hash:
                raise Problem('OPERATION_KEY_CONFLICT', '此操作标识已绑定其他参数。', 409)
            return dict(ok=True, deduplicated=True, operation=json.loads(prior['payload']))
        if not r.get('approval') or r['approval']['digest'] != action_hash:
            r['pending'] = copy.deepcopy(args)
            r['state'] = 'awaiting_confirmation'
            return dict(ok=False, code='APPROVAL_REQUIRED', message='请核对具体变更后确认。')
        t = self.ticket(db, r['id'])
        if t['version'] != args['expected_version']:
            r['approval'] = None
            raise Problem('VERSION_CONFLICT', '确认后工单已更新，请重新查询并确认。', 409)
        t['group'] = args['group']
        t['notes'].append(args['note'])
        t['version'] += 1
        op = dict(id=args['operation_id'], actor=r['case']['role'], action=args, ticket=copy.deepcopy(t), committed_at=now())
        db.execute('UPDATE tickets SET payload=? WHERE run_id=?', (dump(t), r['id']))
        db.execute('INSERT INTO operations VALUES(?,?,?,?)', (r['id'], args['operation_id'], action_hash, dump(op)))
        r['approval'] = None
        if r['case']['fault'] in ('timeout', 'interrupted') and not r['fault_used']:
            r['fault_used'] = True
            return dict(ok=False, code='TIMEOUT' if r['case']['fault'] == 'timeout' else 'INTERRUPTED', message='没有收到提交回执；结果需查询原操作。')
        return dict(ok=True, deduplicated=False, operation=op)

    def action(self, rid, owner, action, body):
        with self.transaction() as db:
            r = self.load(db, rid, owner)
            if action == 'confirm':
                exact_keys(body, ('digest',))
                if r['state'] != 'awaiting_confirmation' or digest(r['pending']) != body['digest']:
                    raise Problem('STALE_APPROVAL', '当前变更已变化，刷新后重新核对。', 409)
                r['approval'] = dict(digest=body['digest'], at=now())
                r['state'] = 'running'
                self.event(db, r, 'human', 'confirm', r['pending'], {'message': '已批准这组具体参数和版本'})
                if r['case']['fault'] == 'conflict' and not r['fault_used']:
                    t = self.ticket(db, rid)
                    t['version'] += 1
                    t['title'] = '样品包装破损（其他处理人补充信息）'
                    db.execute('UPDATE tickets SET payload=? WHERE run_id=?', (dump(t), rid))
                    r['fault_used'] = True
                    self.event(db, r, 'fault', 'concurrent_update', {}, {'message': '其他处理人更新工单', 'version': t['version']})
                # Model submit was paused before invocation; resume the same call.
            elif action == 'cancel':
                exact_keys(body, ())
                if r['state'] not in ('succeeded', 'cancelled', 'failed', 'denied', 'needs_input'):
                    self.finish(db, r, 'cancelled', '已停止后续步骤；已提交的业务效果保留。')
            elif action == 'recover':
                exact_keys(body, ())
                if r['state'] != 'unknown':
                    raise Problem('NOT_RECOVERABLE', '只有结果未知的运行需要恢复。', 409)
                # Recovery is an operator action available to BOTH policies.
                result = self.tool(db, r, 'operation_status', {'operation_id': r['operation_id']})
                if result['status'] == 'committed':
                    r['reply_origin'] = 'host-recovery'
                    self.finish(db, r, 'succeeded', '已查到原操作提交成功，未重复写入。')
                else:
                    r['state'], r['phase'] = 'running', 'write'
            else:
                raise Problem('NOT_FOUND', '没有这个操作。', 404)
            self.save(db, r)
        return self.record(rid, owner)

    def program_step(self, rid, owner):
        with self.transaction() as db:
            r = self.load(db, rid, owner)
            if r['mode'] != 'program':
                raise Problem('MODE_MISMATCH', '这次运行需要模型执行器。', 409)
            if r['state'] != 'running':
                return self.record(rid, owner)
            r['steps'] += 1
            if r['steps'] > 20:
                self.finish(db, r, 'failed', '执行步骤达到上限。')
            elif r['phase'] == 'read':
                if not r['case']['group'] or not r['case']['ticket_id']:
                    self.finish(db, r, 'needs_input', '缺少工单号或目标组，请补充后创建新的运行。')
                else:
                    out = self.tool(db, r, 'query_ticket', {'ticket_id': r['case']['ticket_id']})
                    if not out['ok']:
                        if r['policy'] == 'baseline' or r['reads'] >= 3:
                            self.finish(db, r, 'failed', '查询失败；已停止，未写入。')
                    elif r['policy'] == 'hardened' and not out['can_edit']:
                        self.finish(db, r, 'denied', '当前身份只读，交给有权限的处理人。')
                    else:
                        r['pending'] = dict(ticket_id='T102', group=r['case']['group'], note=r['case']['note'],
                                            expected_version=out['ticket']['version'], operation_id=r['operation_id'])
                        r['phase'] = 'write'
                        if out['can_edit']:
                            r['state'] = 'awaiting_confirmation'
                            self.event(db, r, 'system', 'preview', r['pending'], {'message': '等待人工确认'})
            elif r['phase'] == 'write':
                out = self.tool(db, r, 'submit_change', r['pending'])
                code = out.get('code')
                if out['ok']:
                    r['phase'] = 'duplicate' if r['case']['fault'] == 'duplicate' else 'verify'
                elif code in ('TIMEOUT', 'INTERRUPTED'):
                    r['phase'] = 'recover'
                    if code == 'INTERRUPTED' or r['policy'] == 'baseline':
                        r['state'] = 'unknown'
                        r['reply'] = None
                elif code == 'VERSION_CONFLICT':
                    if r['policy'] == 'hardened':
                        r['phase'] = 'read'
                    else:
                        self.finish(db, r, 'conflict', '版本冲突；未覆盖其他处理人的更新。')
                elif code == 'FORBIDDEN':
                    self.finish(db, r, 'denied', '服务端拒绝了修改请求，未产生写入。')
                elif code != 'APPROVAL_REQUIRED':
                    self.finish(db, r, 'failed', out['message'])
            elif r['phase'] == 'duplicate':
                self.tool(db, r, 'submit_change', r['pending'])
                r['phase'] = 'verify'
            elif r['phase'] == 'recover':
                out = self.tool(db, r, 'operation_status', {'operation_id': r['operation_id']})
                if out['status'] == 'committed':
                    r['phase'] = 'verify'
                else:
                    r['phase'] = 'write'
            elif r['phase'] == 'verify':
                if r['policy'] == 'hardened':
                    self.tool(db, r, 'query_ticket', {'ticket_id': 'T102'})
                self.finish(db, r, 'succeeded', '已转给目标组，新增一条记录，工单保持打开。')
            self.save(db, r)
        return self.record(rid, owner)
