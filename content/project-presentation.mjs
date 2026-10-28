const L=(zh,en)=>({zh,en});
// Presentation metadata only. Canonical app/source/case URLs remain in data.json.
export const presentations={
 taste:{question:L('喜欢一张海报，能说明喜欢什么吗？','What did you like about that poster?'),decision:L('把构图、字体和留白拆开比较，再确认记忆范围。','Compare design variables before deciding what to remember.'),image:'taste',caption:L('偏爱实验室 · 真实构图与单变量对照','TasteRoom · Real compositions and single-variable comparison')},
 suibianju:{question:L('大家都说随便，为什么还是选不出来？','Why is a group decision still so difficult?'),decision:L('先收集硬条件；没有交集时预演，不替成员让步。','Collect constraints, then preview a change without making it for someone.'),image:'suibianju',caption:L('随便局 · 条件收集与共同候选','Suibianju · Conditions and shared candidates')},
 grounded:{question:L('经验互相矛盾，该相信哪一条？','Which advice applies when experiences conflict?'),decision:L('对照来源、适用条件与自己的约束，再比较方案。','Compare sources, applicability and personal constraints.'),image:'grounded',caption:L('有据 · 经验材料与决策链路','Grounded Choice · Experience sources and decision flow')},
 eval:{question:L('裁判给了低分，依据能经得起复核吗？','Does the evidence support the judge’s low score?'),decision:L('原文、引句和评语放在一起，人工判断另行记录。','Review source, quotation and comment without overwriting the original score.'),image:'eval',caption:L('Eval Lab · 历史评分、引句与人工复核','Eval Lab · Saved scores, quotations and human review')},
 filing:{question:L('摘要没有写错，就足够完整吗？','Can a correct summary still miss something important?'),decision:L('断言错误与关键信息遗漏分别核验，回到原文查证。','Check false claims and missing facts separately against the source.'),image:'filing',caption:L('Filing Eval · 公告原文与断言复核','Filing Eval · Source notice and claim review')},
 fde:{question:L('业务流程里，哪一步值得先交给 AI？','Which part of a business workflow should AI handle first?'),decision:L('从选品、问答与记录等具体任务切入，保留人工确认。','Start with a concrete task and retain human confirmation.')},
 'research-agent':{question:L('一份研究结论，怎样回到它的依据？','Can a research conclusion be traced to its sources?'),decision:L('多源材料、研究记录与样本外对照分开组织。','Keep source material, research records and out-of-sample comparisons distinct.')},
 commute:{question:L('多花一点钱，能换回多少可靠时间？','How much reliable travel time does a higher fare buy?'),decision:L('一起比较耗时、成本和迟到风险，保留输入与结果。','Compare time, cost and lateness risk while preserving assumptions.'),image:'commute',caption:L('通勤方案比较器 · 成本与到达风险','Commute Compare · Cost and arrival risk')},
 growth:{question:L('实验显著，就应该全量上线吗？','Does statistical significance justify a full rollout?'),decision:L('分开看统计证据、业务收益与护栏，再留下决策记录。','Separate statistical evidence, business value and guardrails.'),image:'growth',caption:L('Growth Experiment Lab · 实验结果与上线判断','Growth Experiment Lab · Evidence and rollout decisions')},
 pricing:{question:L('付费机制变了，比较口径还一致吗？','Are payment models being compared on the same cohort?'),decision:L('固定人群口径，核对留存、解锁、成本与回本。','Conserve the cohort while checking retention, unlocks, costs and payback.'),image:'pricing',caption:L('Pricing Model Sim · 同口径机制推演','Pricing Model Sim · Conserved-cohort scenarios')},
 bundle:{question:L('套餐卖得更多，为什么反而少赚了？','Why can a bundle sell more and still earn less?'),decision:L('把新增购买的贡献和既有顾客的让利分开计算。','Separate incremental contribution from discounts to existing buyers.'),image:'bundle',caption:L('Bundle Lab · 两类人群的收益账本','Bundle Lab · Two-population contribution ledger')},
 content:{question:L('内容带来的关注，怎样变成有效咨询？','How does an audience become a qualified consultation?'),decision:L('把内容、私域咨询和线索跟进连成可复盘的流程。','Connect content, consultation and lead follow-up in one reviewable flow.')},
};
export function presentationFor(project){
 const value=presentations[project.id]||{};
 const kind=!project.url?'case':/^https?:/.test(project.url)?'external':'demo';
 return {...value,kind,...(value.image?{thumbnail:`/assets/work/showcase/${value.image}-crop.jpg`,image:`/assets/work/showcase/${value.image}.jpg`}:{})};
}
