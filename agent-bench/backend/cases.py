"""Original, entirely fictional work-order fixtures. No model results live here."""
TASK = '把 T102 转给售后组，添加「已联系客户，等待补充照片」，不要关闭工单。'
INITIAL = {'id': 'T102', 'title': '样品包装破损', 'group': '客服组',
           'status': 'open', 'version': 1, 'notes': []}

def case(key, title, condition, fault='', expected='write', **extra):
    return dict(id=key, title=title, condition=condition, task=TASK,
                ticket_id='T102', group='售后组', note='已联系客户，等待补充照片',
                fault=fault, expected=expected, role='editor', **extra)

CASES = [
    case('normal', '正常执行', '工具正常，身份有修改权限。'),
    case('timeout', '写入后超时', '数据库已提交，但工具响应丢失。', 'timeout'),
    case('missing', '缺少目标组', '任务没有说明要转到哪个组。', expected='needs_input'),
    case('permission', '权限不足', '当前身份只能查看，不能修改。', expected='denied'),
    case('transient', '查询短暂失败', '第一次查询失败，第二次恢复。', 'transient'),
    case('unavailable', '查询持续失败', '查询一直失败，必须在有限次数内停止。', 'unavailable', 'failed'),
    case('duplicate', '重复提交', '同一操作被重复投递，不能多加记录。', 'duplicate'),
    case('cancel', '写入前取消', '确认前选择取消，不应产生业务变更。', expected='cancelled'),
    case('conflict', '确认后版本变化', '确认后其他处理人更新了工单，旧批准失效。', 'conflict'),
    case('interrupted', '执行中断恢复', '提交后执行器中断，需从持久化状态恢复。', 'interrupted'),
]
BY_ID = {c['id']: c for c in CASES}
BY_ID['missing']['group'] = None
BY_ID['missing']['task'] = '给 T102 添加「已联系客户，等待补充照片」，转给目标处理组，不要关闭工单。'
BY_ID['permission']['role'] = 'viewer'

VERSION = {'app': '1.0.0', 'cases': 'tickets-v1', 'tools': 'tickets-v1',
           'grader': 'state-events-v1', 'baseline': 'direct-v1', 'hardened': 'recover-v1'}
