import { recommend, submit, decision, normalize } from './engine.mjs?v=20261024-v2';

// A proposal is not an action: only known budget-only blockers are negotiable here.
// Dietary restrictions, excluded cuisines and location are never silently relaxed.
export function voluntaryPlans(session, memberId) {
  const result = recommend(session);
  const member = session.members.find(m => m.id === memberId && m.active && m.confirmed);
  if (!result.ready || result.feasible.length || !member || member.conditions.budget === null) return [];
  return result.blocked.filter(r => {
    const target = { ...member.conditions, budget: r.max };
    if (!Number.isFinite(r.max) || r.max <= member.conditions.budget) return false;
    const trial = structuredClone(session);
    submit(trial, memberId, target);
    return recommend(trial).feasible.some(c => c.id === r.id);
  }).map(r => ({ id: `budget:${r.id}:${r.max}`, version: session.version,
    candidateId: r.id, name: r.name, from: member.conditions.budget, to: r.max,
    delta: r.max - member.conditions.budget,
    explanation: '只尝试调整你本人的预算上限；其他已确认硬条件保持不变。' }))
    .sort((a,b) => a.delta - b.delta).slice(0,3);
}

export function prepareVoluntaryDraft(session, memberId, planId, version) {
  if (version !== session.version) throw Error('建议已经过期，请按最新条件重新查看。');
  const plan = voluntaryPlans(session, memberId).find(p => p.id === planId);
  if (!plan) throw Error('此建议已不再适用；没有替你修改任何已确认条件。');
  const member = session.members.find(m => m.id === memberId);
  return normalize({ ...member.draft, budget: plan.to });
}

export function previewConditions(session, memberId, input) {
  const before = recommend(session), trial = structuredClone(session);
  const changed = submit(trial, memberId, input);
  const after = recommend(trial);
  return { version: session.version, changed, ready: after.ready, message: after.message,
    before: before.feasible.map(r => ({ id:r.id, name:r.name })),
    after: after.feasible.map(r => ({ id:r.id, name:r.name })),
    invalidatesVotes: changed && Object.keys(session.votes).length > 0,
    noSideEffect: true };
}

export function informationGaps(session) {
  return recommend(session).blocked.map(r => ({ id:r.id, name:r.name,
    missing:r.reasons.filter(reason => reason.includes('未知')) })).filter(r => r.missing.length);
}

export function buildDecision(session, now = Date.now()) {
  const chosen = decision(session);
  if (!chosen) throw Error('还没有同版本的全员共同确认，不能导出已确定的决定。');
  const price = Number.isFinite(chosen.min) && Number.isFinite(chosen.max)
    ? `人均 ¥${chosen.min}–${chosen.max}` : Number.isFinite(chosen.max) ? `最高人均 ¥${chosen.max}` : '价格待核实';
  return { schema:'suibianju-decision-v1', createdAt:new Date(now).toISOString(), version:session.version,
    candidate:{ name:chosen.name, cuisine:chosen.cuisine, district:chosen.district, price },
    accepted:session.members.filter(m => m.active).length,
    scope:'单人模拟演示；不是实际餐厅、真实多人确认或预订凭证。',
    next:['核实真实人均费用与是否有座位','核对营业时间、无辣及其他餐食要求','最后再向朋友确认出发安排'] };
}

export function decisionText(session) {
  const card = buildDecision(session);
  return ['随便局 · 这餐定了',card.candidate.name,
    `${card.candidate.cuisine || '菜系待核实'} · ${card.candidate.district || '商圈待核实'} · ${card.candidate.price}`,
    `${card.accepted} 位模拟成员已共同确认 · 第 ${card.version} 版`,
    '当前全部已确认硬条件通过；未披露个人原话或按人归因的限制。',
    '', '行动前再核实：',...card.next.map(t => '· '+t),'',card.scope].join('\n');
}
