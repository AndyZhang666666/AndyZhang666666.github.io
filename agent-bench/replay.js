'use strict';
/* Read-only projections of agent-bench-record-v1. Never runs a tool or edits a record. */
(function (root) {
  const terminal = r => !['running', 'awaiting_confirmation'].includes(r.run.state);
  const maxSteps = records => Math.max(0, ...records.map(r => r.events.length));
  const countAt = (record, cursor) => Math.max(0, Math.min(cursor, record.events.length));
  function observed(record, cursor) {
    let ticket = record.initial, evidence = 0, uncertain = false;
    const events = record.events.slice(0, countAt(record, cursor));
    for (const [i, event] of events.entries()) {
      const result = event.result;
      const snapshot = result.operation?.ticket || result.ticket;
      if (snapshot) { ticket = snapshot; evidence = i + 1; uncertain = false; }
      if (['TIMEOUT', 'INTERRUPTED', 'VERSION_CONFLICT'].includes(result.code) || event.name === 'concurrent_update') uncertain = true;
    }
    return { ticket, evidence, uncertain };
  }
  function checkpoint(records, cursor) {
    const visited = records.map(r => r.events[cursor - 1]).filter(Boolean);
    if (visited.some(e => ['TIMEOUT', 'INTERRUPTED'].includes(e.result.code))) return {
      title: '没有回执，可以直接重试吗？',
      body: '此时只知道请求没有返回；是否已经写入，仍需核实。继续一步，查看两种策略各自怎么处理。'
    };
    if (visited.some(e => e.name === 'query_ticket' && e.result.can_edit === false)) return {
      title: '查得到工单，就能修改吗？',
      body: '记录显示当前身份只读。继续查看：基础策略是否发出修改请求，服务端又如何处理。'
    };
    if (visited.some(e => e.result.code === 'VERSION_CONFLICT')) return {
      title: '原来的批准，还有效吗？',
      body: '批准时的工单版本已经变化。继续查看是否重新读取，并为新的参数和版本再次取得确认。'
    };
    if (visited.some(e => e.name === 'preview') && records.some(r => r.events.slice(0, cursor).some(e => e.result.code === 'VERSION_CONFLICT'))) return {
      title: '这里需要新的批准',
      body: '新版本已经读取。下一步展示留档中的再次批准，只读回放不会替你确认或写入工单。'
    };
    if (visited.some(e => e.result.code === 'TEMPORARY_UNAVAILABLE')) return {
      title: '查询失败后，重试到什么时候？',
      body: '比较两条轨道的后续记录：重试需要上限，最终也需要明确说明是否完成。'
    };
    return null;
  }
  function receipt(record, cursor) {
    const events = record.events.slice(0, countAt(record, cursor));
    const event = [...events].reverse().find(e => e.kind === 'tool');
    if (!event) return { title: '尚无工具回执', tone: 'neutral', detail: '工具调用发生后，在这里查看它实际返回了什么。' };
    const r = event.result;
    if (['TIMEOUT', 'INTERRUPTED'].includes(r.code)) return { title: '未收到提交回执', tone: 'warning', detail: r.message };
    if (r.code === 'FORBIDDEN') return { title: '修改请求被拒绝', tone: 'neutral', detail: r.message };
    if (r.code === 'VERSION_CONFLICT') return { title: '旧版本提交被拒绝', tone: 'warning', detail: r.message };
    if (r.deduplicated) return { title: '返回原操作回执', tone: 'good', detail: '重复投递被去重，没有再加一条记录。' };
    if (event.name === 'operation_status' && r.status === 'committed') return { title: '原操作已提交', tone: 'good', detail: '按原操作标识查到持久化回执。' };
    if (event.name === 'submit_change' && r.ok) return { title: '收到提交回执', tone: 'good', detail: '变更与操作回执已一起持久化。' };
    if (event.name === 'query_ticket' && r.ok) return { title: '读取工单 v' + r.ticket.version, tone: 'neutral', detail: r.can_edit ? '当前身份具有修改权限。' : '当前身份只读，没有修改权限。' };
    return { title: r.ok ? '工具返回成功' : '工具返回错误', tone: r.ok ? 'neutral' : 'warning', detail: r.message || r.code || '详见选中事件。' };
  }
  function recap(record) {
    const events = record.events;
    const anomaly = events.find(e => e.result.code || e.name === 'concurrent_update' || (e.name === 'query_ticket' && e.result.can_edit === false));
    const resolution = [...events].reverse().find(e => e.name === 'operation_status' || (e.name === 'submit_change' && e.result.ok));
    return {
      anomaly,
      resolution,
      ticket: record.ticket,
      checks: record.evaluation.checks,
      passed: record.evaluation.passed,
      state: record.run.state,
      reply: record.run.reply?.summary || '这条记录没有最终完成回复。'
    };
  }
  const api = { terminal, maxSteps, countAt, observed, checkpoint, receipt, recap };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AgentReplay = Object.freeze(api);
})(globalThis);
