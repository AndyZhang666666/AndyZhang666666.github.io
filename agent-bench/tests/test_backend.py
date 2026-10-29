import concurrent.futures
import copy
import http.cookiejar
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from cases import CASES
from store import Store, Problem, digest
from grading import grade
from server import Server
import model

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'test.sqlite3'
        self.store = Store(self.path)
    def tearDown(self):
        self.tmp.cleanup()
    def pair(self, case='normal', key='request', mode='program'):
        return self.store.pair('owner', dict(case_id=case, request_id=key, mode=mode))
    def prepared(self, case='normal', policy=1):
        record = self.pair(case)[policy]
        record = self.store.program_step(record['run']['id'], 'owner')
        return record
    def confirm(self, r):
        return self.store.action(r['run']['id'], 'owner', 'confirm', {'digest': digest(r['run']['pending'])})
    def drive(self, r, recover=False):
        for _ in range(30):
            if r['run']['state'] == 'running':
                r = self.store.program_step(r['run']['id'], 'owner')
            elif r['run']['state'] == 'awaiting_confirmation':
                r = self.store.action(r['run']['id'], 'owner', 'cancel', {}) if r['run']['case']['id'] == 'cancel' else self.confirm(r)
            elif r['run']['state'] == 'unknown' and recover:
                r = self.store.action(r['run']['id'], 'owner', 'recover', {})
            else:
                return r
        self.fail('unbounded execution')
    def test_all_ten_cases_both_policies(self):
        self.assertEqual(len(CASES), 10)
        for c in CASES:
            for r in self.pair(c['id'], c['id']):
                with self.subTest(case=c['id'], policy=r['run']['policy']):
                    out = self.drive(r, recover=c['id']=='interrupted')
                    self.assertLessEqual(len(out['ticket']['notes']), 1)
                    self.assertEqual(out['evaluation']['metrics']['unauthorized_writes'], 0)
                    expected_fail = r['run']['policy']=='baseline' and c['id'] in ('timeout','transient','conflict')
                    self.assertEqual(out['evaluation']['passed'], not expected_fail)
    def test_runs_are_isolated(self):
        a,b = self.pair()
        self.drive(a)
        self.assertEqual(self.store.record(b['run']['id'])['ticket']['notes'], [])
    def test_pair_request_deduplication_concurrent(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            out = list(pool.map(lambda _: [r['run']['id'] for r in self.pair()], range(6)))
        self.assertTrue(all(ids==out[0] for ids in out))
        with self.assertRaises(Problem) as e:
            self.pair('timeout')
        self.assertEqual(e.exception.code, 'REQUEST_KEY_CONFLICT')
    def test_permission_attempt_and_write_are_separate(self):
        a,b = [self.drive(r) for r in self.pair('permission')]
        self.assertEqual(a['evaluation']['metrics']['unauthorized_attempts'], 1)
        self.assertEqual(b['evaluation']['metrics']['unauthorized_attempts'], 0)
        self.assertEqual(len(a['operations'])+len(b['operations']), 0)
    def test_parameter_validation_and_no_approval(self):
        r = self.prepared()
        args = r['run']['pending']
        with self.store.transaction() as db:
            run=self.store.load(db,r['run']['id'])
            for bad in ({},dict(args,note=''),dict(args,expected_version=True),dict(args,group='总管理员'),dict(args,close=True),dict(args,note='x'*201)):
                self.assertEqual(self.store.tool(db,run,'submit_change',bad)['code'],'INVALID_ARGUMENTS')
            self.assertEqual(self.store.tool(db,run,'submit_change',args)['code'],'APPROVAL_REQUIRED')
            self.assertEqual(self.store.ticket(db,run['id'])['notes'],[])
    def test_duplicate_same_action_and_key_collision(self):
        r=self.confirm(self.prepared('duplicate'))
        rid=r['run']['id'];args=r['run']['pending']
        self.store.program_step(rid,'owner')
        with self.store.transaction() as db:
            run=self.store.load(db,rid)
            self.assertTrue(self.store.tool(db,run,'submit_change',args)['deduplicated'])
            self.assertEqual(self.store.tool(db,run,'submit_change',dict(args,note='另一个动作'))['code'],'OPERATION_KEY_CONFLICT')
            self.assertEqual(len(self.store.ticket(db,rid)['notes']),1)
    def test_cancel_before_and_after_commit(self):
        r=self.prepared('cancel');rid=r['run']['id']
        r=self.store.action(rid,'owner','cancel',{})
        r=self.store.program_step(rid,'owner')
        self.assertEqual(r['ticket']['notes'],[])
        self.assertEqual(r['run']['state'],'cancelled')
        r=self.pair('timeout','timeout')[0];r=self.drive(r);rid=r['run']['id']
        r=self.store.action(rid,'owner','cancel',{})
        self.assertEqual(len(r['ticket']['notes']),1)
        self.assertEqual(r['run']['state'],'cancelled')
    def test_stale_confirmation_and_reapproval(self):
        r=self.prepared('conflict');original=digest(r['run']['pending'])
        r=self.confirm(r);rid=r['run']['id']
        r=self.store.program_step(rid,'owner')
        self.assertEqual(r['ticket']['notes'],[])
        r=self.store.program_step(rid,'owner')
        self.assertEqual(r['run']['state'],'awaiting_confirmation')
        self.assertNotEqual(digest(r['run']['pending']),original)
        with self.assertRaises(Problem):
            self.store.action(rid,'owner','confirm',{'digest':original})
        self.assertTrue(self.drive(r)['evaluation']['passed'])
    def test_restart_and_unknown_recovery(self):
        r=self.confirm(self.prepared('interrupted'));rid=r['run']['id']
        r=self.store.program_step(rid,'owner')
        self.assertEqual(r['run']['state'],'unknown')
        self.store=Store(self.path)
        self.assertEqual(len(self.store.record(rid)['ticket']['notes']),1)
        r=self.store.action(rid,'owner','recover',{})
        self.assertTrue(r['evaluation']['passed'])
        self.assertEqual(len(r['operations']),1)
    def test_unknown_never_silently_excluded_from_metrics(self):
        r=self.drive(self.pair('timeout')[0])
        self.assertFalse(r['evaluation']['passed'])
        self.assertEqual(r['evaluation']['metrics']['tasks'],1)
        self.assertEqual(r['evaluation']['metrics']['run_failures'],1)
        self.assertIsNone(r['evaluation']['metrics']['usage'])
    def test_offline_grade_detects_false_completion(self):
        r=self.drive(self.pair()[0]); self.assertTrue(grade(r)['passed'])
        r['ticket']['notes']=[]
        self.assertFalse(grade(r)['passed'])
        r['ticket']['notes']=['wrong note']
        self.assertFalse(grade(r)['passed'])
    def test_access_control_and_export_minimization(self):
        r=self.pair()[0]
        with self.assertRaises(Problem): self.store.record(r['run']['id'],'other-owner')
        serialized=json.dumps(r)
        self.assertNotIn('messages',r['run'])
        self.assertNotIn('owner',r['run'])
        self.assertNotIn('Authorization',serialized)
    def test_read_retries_are_bounded(self):
        a,b=[self.drive(r) for r in self.pair('unavailable')]
        self.assertEqual(a['run']['reads'],1)
        self.assertEqual(b['run']['reads'],3)
        self.assertEqual(a['ticket']['notes']+b['ticket']['notes'],[])
    def test_permission_rechecked_after_approval(self):
        r=self.confirm(self.prepared());rid=r['run']['id']
        with self.store.transaction() as db:
            run=self.store.load(db,rid);run['case']['role']='viewer';self.store.save(db,run)
        r=self.store.program_step(rid,'owner')
        self.assertEqual(r['run']['state'],'denied');self.assertEqual(r['ticket']['notes'],[])
    def test_approval_cannot_bind_changed_parameters(self):
        r=self.confirm(self.prepared());rid=r['run']['id']
        with self.store.transaction() as db:
            run=self.store.load(db,rid)
            out=self.store.tool(db,run,'submit_change',dict(run['pending'],note='未批准的新内容'))
            self.assertEqual(out['code'],'APPROVAL_REQUIRED')
            self.assertEqual(self.store.ticket(db,rid)['notes'],[])
    def test_operation_identifier_cannot_be_replaced(self):
        r=self.confirm(self.prepared());rid=r['run']['id']
        with self.store.transaction() as db:
            run=self.store.load(db,rid)
            out=self.store.tool(db,run,'submit_change',dict(run['pending'],operation_id='new-id'))
            self.assertEqual(out['code'],'OPERATION_ID_MISMATCH')
            self.assertEqual(self.store.ticket(db,rid)['notes'],[])
    def test_concurrent_steps_do_not_duplicate_effects(self):
        r=self.confirm(self.prepared());rid=r['run']['id']
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(lambda _:self.store.program_step(rid,'owner'),range(6)))
        r=self.store.record(rid)
        self.assertEqual(len(r['operations']),1);self.assertEqual(len(r['ticket']['notes']),1)
    def test_missing_ticket_and_status_are_validated(self):
        r=self.pair()[0]
        with self.store.transaction() as db:
            run=self.store.load(db,r['run']['id'])
            self.assertEqual(self.store.tool(db,run,'query_ticket',{'ticket_id':''})['code'],'INVALID_ARGUMENTS')
            self.assertEqual(self.store.tool(db,run,'query_ticket',{'ticket_id':'T999'})['code'],'NOT_FOUND')
            self.assertEqual(self.store.tool(db,run,'operation_status',{'operation_id':'other-run-op'})['status'],'not_found')
    def test_expected_failure_is_not_counted_as_completed_task(self):
        r=self.drive(self.pair('unavailable')[1])
        self.assertTrue(r['evaluation']['passed'])
        self.assertEqual(r['evaluation']['metrics']['case_passes'],1)
        self.assertEqual(r['evaluation']['metrics']['successes'],0)

class APITests(StoreTests):
    # Reuse fixtures, not inherited test methods, in the API suite below.
    def setUp(self):
        super().setUp()
        self.server=Server(('127.0.0.1',0),self.store,model.ModelClient(url='',key='',model=''))
        self.server.model.url=self.server.model.key=self.server.model.model=''
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.base='http://127.0.0.1:'+str(self.server.server_port)
        self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.request('/api/config')
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();super().tearDown()
    def request(self,path,body=None,headers=None,opener=None):
        h={'Content-Type':'application/json','X-Bench-Request':'1'}
        if headers:h.update(headers)
        req=urllib.request.Request(self.base+path,data=None if body is None else json.dumps(body).encode(),headers=h)
        try:
            with (opener or self.http).open(req,timeout=5) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as e:return e.code,json.load(e)
    def test_api_lifecycle_and_replay_read_only(self):
        code,pair=self.request('/api/pairs',dict(case_id='normal',request_id='api-normal',mode='program'));self.assertEqual(code,201)
        rid=pair[0]['run']['id']
        _,r=self.request('/api/runs/'+rid+'/step',{});self.assertEqual(r['run']['state'],'awaiting_confirmation')
        _,r=self.request('/api/runs/'+rid+'/confirm',{'digest':r['approval_digest']})
        self.request('/api/runs/'+rid+'/step',{})
        _,r=self.request('/api/runs/'+rid+'/step',{});self.assertEqual(r['run']['state'],'succeeded')
        for _ in range(3):_,export=self.request('/api/runs/'+rid+'/export')
        self.assertEqual(len(export['operations']),1)
    def test_api_rejects_cross_origin_host_and_csrf(self):
        for headers in ({'Origin':'https://evil.example'},{'X-Bench-Request':''},{'Host':'evil.example'}):
            self.assertEqual(self.request('/api/pairs',{},headers)[0],403)
    def test_api_validates_payload_and_mode(self):
        for body in ([],{'case_id':[]},dict(case_id='normal',request_id='a',mode='program',role='editor')):
            self.assertEqual(self.request('/api/pairs',body)[0],400)
        self.assertEqual(self.request('/api/pairs',dict(case_id='normal',request_id='a',mode='model'))[0],503)
    def test_api_other_session_and_private_paths(self):
        _,pair=self.request('/api/pairs',dict(case_id='normal',request_id='a',mode='program'))
        other=urllib.request.build_opener()
        self.assertEqual(self.request('/api/runs/'+pair[0]['run']['id'],opener=other)[0],401)
        for p in ('/agent-bench/backend/server.py','/agent-bench/.env','/agent-bench/.local/bench.sqlite3'):
            self.assertEqual(self.request(p)[0],404)

# Avoid counting the same storage tests twice just because API fixtures inherit helpers.
for name in list(StoreTests.__dict__):
    if name.startswith('test_') and name not in APITests.__dict__:
        setattr(APITests,name,None)

class DynamicModel:
    configured=True
    model='stub-for-program-testing-only'
    def complete(self,messages):
        calls=[m for m in messages if m['role']=='tool']
        def call(name,args):
            return {'role':'assistant','content':None,'tool_calls':[{'id':'call-'+str(len(calls)),'type':'function','function':{'name':name,'arguments':json.dumps(args,ensure_ascii=False)}}]}, {'total_tokens':10}
        if not calls:return call('query_ticket',{'ticket_id':'T102'})
        out=json.loads(calls[-1]['content'])
        if 'ticket' in out:
            return call('submit_change',dict(ticket_id='T102',group='售后组',note='已联系客户，等待补充照片',expected_version=out['ticket']['version'],operation_id=messages[1]['content'].split('本次操作标识：')[1]))
        ticket=out['operation']['ticket']
        return {'role':'assistant','content':json.dumps(dict(outcome='succeeded',group=ticket['group'],status=ticket['status'],note_count=len(ticket['notes']),summary='已核实工具回执。'))},None

class ModelTests(StoreTests):
    def test_model_selects_real_tools_and_pauses_for_approval(self):
        r=self.pair(mode='model')[1];rid=r['run']['id'];client=DynamicModel()
        r=model.step(self.store,client,rid,'owner')
        r=model.step(self.store,client,rid,'owner')
        self.assertEqual(r['run']['state'],'awaiting_confirmation');self.assertEqual(r['ticket']['notes'],[])
        r=self.confirm(r)
        r=model.step(self.store,client,rid,'owner')
        r=model.step(self.store,client,rid,'owner')
        self.assertEqual(len(r['operations']),1);self.assertTrue(r['evaluation']['passed'])
        self.assertEqual(r['run']['model_calls'],3)
        self.assertIsNone(r['run']['usage'])
        self.assertEqual(r['run']['usage_samples'],[{'total_tokens':10},{'total_tokens':10},None])
    def test_model_lie_fails_database_grading(self):
        class Liar(DynamicModel):
            def complete(self,messages):return {'role':'assistant','content':json.dumps(dict(outcome='succeeded',group='售后组',status='open',note_count=1,summary='完成'))},None
        r=self.pair(mode='model')[0];r=model.step(self.store,Liar(),r['run']['id'],'owner')
        self.assertFalse(r['evaluation']['passed']);self.assertEqual(r['ticket']['notes'],[])
    def test_model_failure_is_saved_and_counted(self):
        class Broken(DynamicModel):
            def complete(self,messages):raise Problem('MODEL_REQUEST_FAILED','测试故障',502)
        r=self.pair(mode='model')[0];r=model.step(self.store,Broken(),r['run']['id'],'owner')
        # Read again because persistence, not the returned object, is the authority.
        r=self.store.record(r['run']['id'])
        self.assertEqual(r['run']['state'],'failed');self.assertEqual(r['evaluation']['metrics']['tasks'],1)
        self.assertEqual(r['run']['model_calls'],1)
    def test_cancellation_during_model_network_wait(self):
        entered=threading.Event();release=threading.Event()
        class Slow(DynamicModel):
            def complete(self,messages):
                entered.set();release.wait(3)
                return super().complete(messages)
        r=self.pair(mode='model')[0];rid=r['run']['id']
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future=pool.submit(model.step,self.store,Slow(),rid,'owner')
            self.assertTrue(entered.wait(2))
            r=self.store.action(rid,'owner','cancel',{})
            release.set();r=future.result(timeout=3)
        self.assertEqual(r['run']['state'],'cancelled')
        self.assertEqual(r['ticket']['notes'],[])
    def test_model_call_limit_persists_failed_state(self):
        r=self.pair(mode='model')[0];rid=r['run']['id']
        with self.store.transaction() as db:
            run=self.store.load(db,rid);run['model_calls']=12;self.store.save(db,run)
        r=model.step(self.store,DynamicModel(),rid,'owner')
        self.assertEqual(r['run']['state'],'failed')
        self.assertEqual(self.store.record(rid)['run']['state'],'failed')
    def test_provider_adapter_sends_tools_without_leaking_reasoning(self):
        observed=[]
        class Provider(BaseHTTPRequestHandler):
            def log_message(self,*args):pass
            def do_POST(self):
                observed.append(json.loads(self.rfile.read(int(self.headers['Content-Length']))))
                raw=json.dumps({'choices':[{'message':{'content':'{}','reasoning_content':'must not persist'}}],'usage':{'total_tokens':7,'extra':'discard'}}).encode()
                self.send_response(200);self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
        server=ThreadingHTTPServer(('127.0.0.1',0),Provider);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            client=model.ModelClient(url=f'http://127.0.0.1:{server.server_port}/v1/chat/completions',key='test-only-not-a-real-key',model='test-model')
            message,usage=client.complete([{'role':'user','content':'fictional task'}])
            self.assertEqual(len(observed[0]['tools']),3);self.assertNotIn('reasoning_content',message);self.assertEqual(usage,{'total_tokens':7})
        finally:server.shutdown();server.server_close();thread.join()

for name in list(StoreTests.__dict__):
    if name.startswith('test_') and name not in ModelTests.__dict__:setattr(ModelTests,name,None)

if __name__=='__main__':unittest.main(verbosity=2)
