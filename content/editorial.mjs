// Resume and project facts live in data.json. This file contains presentation and product analysis.
import {specificStudies} from './specific-studies.mjs';
import {newWorkStudies} from './new-work-studies.mjs';
import {usableStudies} from './usable-studies.mjs';
const L = (zh, en) => ({ zh, en });

export const identity = {
  title: L('我做 AI 应用，也关注它如何进入真实生活与业务。', 'I build AI products for real life and real work.'),
  intro: L('从创作 Agent、效果评测，到生活里的新体验。先判断用户需要什么，再决定哪些步骤交给 AI，以及怎样验证它是否有效。', 'From creative Agents and evaluation to everyday experiments. I start with the user’s task, decide what AI should handle, then define how to tell whether it works.'),
  short: L('AI 产品经理，做 Agent、评测与商业增长。', 'AI product manager working across Agents, evaluation and growth.'),
};

export const directions = [
  { id:'all', label:L('综合推荐','Overview'), order:['trust','taste','bundles','commute'] },
  { id:'ai', label:L('AI / Agent','AI / Agents'), order:['trust','taste','bundles','commute'] },
  { id:'life', label:L('生活与创新','Life & innovation'), order:['taste','commute','trust','bundles'] },
  { id:'growth', label:L('增长与商业化','Growth & monetisation'), order:['bundles','trust','commute','taste'] },
];

export const projects = [
  ['taste','life',L('偏爱实验室','TasteRoom'),L('偏好归因与可撤回记忆','Preference attribution & reversible memory'),'taste'],
  ['suibianju','life',L('随便局','Suibianju'),L('把聚餐中的“随便”变成可确认的条件','Turn “anything is fine” into agreed conditions'),'shared-choice'],
  ['grounded','life',L('有据','Grounded Choice'),L('从相反经验中，找到适合自己的决定','Make a choice with conflicting experiences'),null],
  ['eval','ai',L('Eval Lab','Eval Lab'),L('从评分到有证据的版本评审','From scores to evidence-based review'),'trust'],
  ['filing','ai',L('Filing Eval','Filing Eval'),L('错句与遗漏，分别回到原文核验','Review false claims and omissions separately'),'filing'],
  ['fde','delivery',L('企业 AI 与轻量业务工具','Enterprise AI & business tools'),L('选品、问答、线索与生产记录的流程交付','Workflow delivery for research, support and operations'),'agent-workflow'],
  ['research-agent','delivery',L('个人投研 Agent 与量化研究','Research Agent & quantitative tools'),L('多源研究、盘后复盘与样本外对照','Multi-source research and out-of-sample comparison'),null],
  ['commute','personal',L('通勤方案比较器','Commute Compare'),L('比较自己的路线，校准记录并保存选择','Compare your routes, calibrate records and save a choice'),'commute'],
  ['poker-quiz','personal',L('扑克玩家类型测试','Poker Style Quiz'),L('用十道题描述自己的打法','Describe your playing style in ten questions'),null],
  ['bankroll','personal',L('扑克筹码管理模拟器','Bankroll Simulator'),L('分开看停止、曾经达标与最终达标','Separate stopping, reaching and finishing above target'),null],
  ['poker-ev','personal',L('扑克期望值计算器','Poker EV Calculator'),L('检查假设估错时，决策会不会改变','Check whether a decision survives a mistaken estimate'),null],
  ['growth','growth',L('Growth Experiment Lab','Growth Experiment Lab'),L('把统计证据与上线决策分开','Separate statistical evidence from rollout decisions'),'growth'],
  ['pricing','growth',L('Pricing Model Sim','Pricing Model Sim'),L('同一付费人群口径下比较机制与回本','Compare payment models on a conserved cohort'),'pricing'],
  ['bundle','growth',L('Bundle Lab','Bundle Lab'),L('共购关系之外，核对新增与让利','Account for incremental sales and discounts to existing buyers'),'bundles'],
  ['content','delivery',L('留学咨询内容矩阵','Study-abroad content business'),L('从内容、私域咨询到线索跟进','From content to consultation and lead follow-up'),null],
  ['agent-bench','ai',L('Agent 执行评测台','Agent Execution Bench'),L('超时之后，核对真实状态再决定如何恢复','Reconcile actual state after a timeout before recovering'),'execution'],
  ['rag-lab','ai',L('可信 RAG 实验台','Trustworthy RAG Lab'),L('先限定资料范围与生效版本，再回答','Set source scope and effective versions before answering'),'rag'],
].map(([id,category,name,description,caseId],index)=>({id,category,name,description,caseId,index}));

export const categories = [
  {id:'all',label:L('全部作品','All work')},
  {id:'ai',label:L('AI 与评测','AI & evaluation')},
  {id:'life',label:L('生活与创新','Life & innovation')},
  {id:'growth',label:L('增长与商业化','Growth & monetisation')},
  {id:'delivery',label:L('业务交付','Business delivery')},
  {id:'personal',label:L('个人实验','Personal experiments')},
];

export const studies = [
  {
    id:'trust', project:'eval', related:['filing'],
    name:L('AI 输出如何被信任','When is AI output worth trusting?'),
    title:L('评测之后，还要能复核。','Scores need evidence.'),
    summary:L('把低分、引句和原文放在一起。用独立的人工判断检查裁判，而不是让一个总分替人作决定。','Bring low scores, quotations and source text together. Let people review the judge instead of outsourcing the decision to one score.'),
    image:'showcase/eval.jpg', secondaryImage:'showcase/eval-crop.jpg',
    alt:L('Eval Lab 实际界面：评分维度、原文与人工复核区域','Actual Eval Lab screen showing dimensions, source text and human review'),
    caption:L('Eval Lab · 历史运行回放与逐维复核','Eval Lab · Historical replay and per-dimension review'),
    status:L('历史回放，可选模型接口','Historical replay; optional model connection'),
    watch:L('选一条低分引用，回到原文，再留下自己的复核结论。','Pick a low-scoring quote, locate it in the text, then record your own judgement.'),
    insight:L('能定位到引句，只说明找到了这句话；它是否支持结论，仍然需要判断。','Finding a quotation proves that the words exist, not that they support the judgement.'),
    question:L('当裁判也会判断错，谁来判断这个版本是否值得发布？','When the judge can be wrong too, who decides whether a version is ready?'),
    problem:L('创意文本很难稳定比较，摘要又可能写错事实或漏掉重点。把不同问题压成一个总分，既难以解释，也不利于改进。','Creative text is hard to compare consistently; a summary can add false claims or omit essential facts. One score obscures both the reason and the next action.'),
    role:L('独立设计并实现评审流程、评分说明、引用定位、本机复核和导出；AI 辅助开发。公开版本保留历史输出，未在本轮重新调用模型。','Independently designed and implemented review flows, scoring guidance, citation location, local review and export, with AI-assisted development. Public replay uses saved outputs; this iteration did not run new model evaluations.'),
    choices:[
      [L('只给总分','Show an overall score'),L('比较很快，但低分原因与高风险问题都容易被平均掉。','Quick to compare, but averages can hide both causes and serious failures.')],
      [L('要求解释评分','Ask the judge to explain'),L('解释更丰富，仍可能出现无据的理由或错误引句。','Richer explanations can still contain unsupported reasoning or inaccurate quotes.')],
      [L('证据与复核分开','Separate evidence and review'),L('采用的做法：原始评分保留，人工复核另外记录；意见不一致也能留下来。','Implemented: preserve the original score and store human review separately, including disagreement.')],
    ],
    decisions:[
      {title:L('不让人工意见覆盖历史','Keep the original record'),text:L('按样本、模型和具体运行隔离复核。记录不同意或待补充的依据，导出时同时保留原文、原始结果和人工判断。','Review is scoped to a sample, model and run. Exports retain source text, original results and the reviewer’s reasoning together.')},
      {title:L('事实错误与信息遗漏分开','Separate error from omission'),text:L('Filing Eval 独立检查断言与关键事实覆盖。摘要没有写错，也可能漏掉会改变决定的信息。','Filing Eval reviews claims and coverage separately. A summary can be factually correct yet omit information that changes the decision.')},
      {title:L('没有证据，就保留争议','Leave uncertainty visible'),text:L('引句无法定位时明确提示；复核默认不选结论。历史标签和复核意见不能互相替代。','Unlocated quotes are flagged, and review starts with no selected verdict. Saved labels and human opinions serve different purposes.')},
    ],
    example:L('发布判断示例：即使一个版本的其他维度更高，关键事实写错、安全项触发或证据不足，也应进入复核。这里的均值用于定位问题，不自动签发“可以发布”。这是判断原则，不是新增的一轮模型成绩。','Release-decision example: higher scores elsewhere do not offset a critical factual error, safety flag or insufficient evidence. The mean helps locate problems; it does not authorise release. This is a decision principle, not a new evaluation result.'),
    tradeoff:L('复核比看总分慢。我的取舍是把人的注意力优先放在低分、错误和争议上，而不是要求逐字读完所有输出。','Review costs more time than reading a score. The tradeoff is to direct attention to low scores, errors and disputes rather than requiring an exhaustive read of every output.'),
    proof:L('Eval Lab 的免 Key 回放包含 6 条样本的 18 次历史输出。Filing Eval 展示 28 条构造公告；原始结果、困难集与未运行的候选留出集分开说明。界面与回归已检查，不等于生产准确率已被证明。','Eval Lab replays 18 saved outputs across six samples. Filing Eval contains 28 constructed notices, with original results, hard cases and unrun holdout candidates reported separately. Interface and regression checks do not establish production accuracy.'),
    next:L('先独立复核标签，再冻结规则，用未参与调参的样本比较漏报与误报；记录复核时间和分歧，不用本机构造集成绩代替泛化结论。','Independently review labels, freeze the rules, then test unseen samples for missed errors and false alarms. Measure review time and disagreement rather than treating constructed-set scores as generalisation.'),
    artifact:L('可导入、再次读取的 JSON 复核记录与可读 Markdown 报告；原文、原分与人工意见分别保留。','Importable JSON review records and a readable Markdown report preserving source text, original scores and human review.'),
  },
  {
    id:'taste',project:'taste',related:[],
    name:L('AI 如何理解个人偏好','How should AI learn a preference?'),
    title:L('喜欢这张，不等于喜欢全部。','Find what you liked.'),
    summary:L('一张海报里有字体、留白和色彩。先拆开比较，再由用户决定这条偏爱该记在哪个场景。','A poster mixes type, spacing and colour. Compare one variable at a time, then let the person decide where that preference belongs.'),
    image:'showcase/taste.jpg',secondaryImage:'showcase/taste-crop.jpg',
    alt:L('偏爱实验室实际界面，同内容只改变字体的 A/B 海报对照','Actual TasteRoom experiment comparing two posters with only the font changed'),
    caption:L('偏爱实验室 · 单变量对照与记忆范围','TasteRoom · Single-variable comparison and memory scope'),
    status:L('本地规则模拟，无模型调用','Local-rule simulation; no model calls'),
    watch:L('比较只变一项的两张海报，再选择只在“工作汇报”里记住。','Compare two posters with one change, then choose to remember it only for work presentations.'),
    insight:L('偏爱应该能说明来源，也应该允许人在另一个场景里不一样。','A preference needs a source, and room for the person to choose differently in another context.'),
    question:L('用户说“喜欢”，到底喜欢的是哪一部分？','When a person says “I like it”, which part do they mean?'),
    problem:L('整张海报同时改变多种特征，单次选择无法说明原因。把它直接当成稳定偏好，还可能让工作和日常的需求互相干扰。','A choice between posters with several differences cannot isolate the cause. Treating it as a stable preference can also mix up work and everyday needs.'),
    role:L('独立设计并实现直觉选择、单变量验证、记忆范围、冲突处理、撤回和导出；新增瑞士现代主义、解构主义两种原创构图与海报文案编辑。公开体验用本地规则模拟，展示交互机制。','Independently designed and implemented initial choice, single-variable checks, scoped memory, conflict handling, undo and export, plus original Swiss and deconstructed compositions with editable poster copy. The public experience simulates these mechanisms with local rules.'),
    choices:[
      [L('一次选择，全部记住','Remember every feature'),L('操作最少，但把一次选择的原因推得过远。','Minimal interaction, but infers too much from one choice.')],
      [L('让用户填完参数','Ask for every setting'),L('边界清楚，却把探索审美变成配置表。','Explicit, but turns exploration into a settings form.')],
      [L('先留线索，再拆开验证','Keep clues, then test them'),L('采用的做法：单变量对照、可跳过、确认范围后才写入明确规则。','Implemented: one-variable comparisons, a skip option and explicit scope before a rule is saved.')],
    ],
    decisions:[
      {title:L('选择原因先作为线索','Treat an inferred reason as a clue'),text:L('初次选择只留下待验证线索。拆开对照时保持内容和其余参数不变；两张都不选也不会被记成偏好。','Initial choices create tentative clues. Comparisons hold the content and other settings constant; rejecting both does not create a preference.')},
      {title:L('记忆有范围，也能撤回','Make memory scoped and reversible'),text:L('区分全局、日常审美与工作汇报。明确规则优先于推测，保留依据、冲突提示和撤回入口。','Separate global, everyday and work contexts. Explicit rules take priority over guesses, with sources, conflicts and undo available.')},
      {title:L('换内容，检查是否还成立','Test it on different content'),text:L('同一组参数可以应用到另一套海报内容。用户能带走偏好说明书与 SVG，而不是只能留在对话里。','Apply the settings to different poster content. Export the preference brief and SVG so the result can leave the conversation.')},
    ],
    tradeoff:L('多一次验证会增加操作，但能减少“你怎么又替我记住了”的负担。直接参数入口仍保留，避免用户被迫猜关键词。','An extra check adds friction but reduces the cost of unwanted memory. Direct parameter controls remain available, so people need not guess the right wording.'),
    proof:L('目前证明的是单变量对照、范围授权、冲突纠偏和撤回流程可以操作。没有真实用户研究，也没有证明这些画布参数足以代表一个人的审美。','The implemented flow demonstrates controlled comparison, scoped consent, correction and undo. It does not establish real-user value or that these canvas settings capture someone’s taste.'),
    next:L('让首次使用者在两种不同内容与工作、日常两个场景中完成任务，观察错误归因、撤回和重新表达的次数；比较直接配置与逐步探索的负担。','Ask first-time users to complete tasks across different content and work/everyday contexts. Observe wrong attribution, undo and restatement, and compare exploration with direct configuration.'),
    artifact:L('自定义文案的 SVG / 900×1200 PNG 海报；带来源与场景的偏好说明书单独导出。','A custom-copy SVG or 900×1200 PNG poster, plus a separately exported preference brief with sources and scope.'),
  },
  {
    id:'shared-choice',project:'suibianju',related:['grounded'],
    name:L('AI 如何参与共同决策','How can AI support a shared decision?'),
    title:L('先说清条件，再一起决定。','Conditions before choice.'),
    summary:L('“随便”之后总有人否决。把预算、距离和忌口变成各自可确认的条件；无交集时先预演，不替任何人妥协。','“Anything is fine” often ends in a veto. Make budget, distance and dietary needs explicit; preview voluntary changes when there is no overlap.'),
    image:'shared-decision.jpg',secondaryImage:'shared-preview.jpg',
    alt:L('随便局实际界面，模拟成员条件与共同决定','Actual Suibianju screen with simulated member constraints and a shared decision'),
    caption:L('随便局 · 条件、预演与同版确认','Suibianju · Conditions, preview and shared confirmation'),
    status:L('3–5 位模拟成员，无真实多人','3–5 simulated members; not real multiplayer'),
    watch:L('先查看无交集的原因，再预演一位成员自愿调整预算；比较预演与真正应用的区别。','Inspect why no option fits, then preview a voluntary budget change. Notice the difference between previewing and applying it.'),
    insight:L('推荐一个选项和获得共同同意，是两个不同的任务。','Recommending an option and reaching agreement are different tasks.'),
    question:L('大家是真的没有偏好，还是不方便先把限制说出来？','Do people lack preferences, or is it hard to state their constraints first?'),
    problem:L('聚餐难题不只是候选餐厅少。一个人说“随便”，可能仍有预算或忌口；多数票会把少数人的限制当成可忽略的意见。','The problem is not simply a lack of restaurants. “Anything” can conceal budget or dietary limits, while majority voting may ignore a minority constraint.'),
    role:L('独立设计并实现虚构成员的条件整理、硬约束检查、自愿调整预演、同版确认和公共决定单导出。AI 理解由本地规则模拟，硬约束由程序校验。','Independently designed and implemented simulated member conditions, constraint checks, voluntary-change previews, versioned confirmation and shared decision export. Local rules simulate AI understanding; code validates hard constraints.'),
    choices:[
      [L('直接推荐一家','Recommend one restaurant'),L('很快给出答案，但没有解决否决来自哪里。','Fast, but leaves the reasons for a veto unresolved.')],
      [L('按多数票决定','Use a majority vote'),L('容易结束讨论，却可能忽略少数人的硬限制。','Ends discussion, but can dismiss someone’s hard constraint.')],
      [L('先确认共同可行范围','Establish a feasible overlap'),L('采用的做法：解释冲突，允许本人自愿改条件，最后共同确认同一版本。','Implemented: explain conflicts, allow voluntary changes, then collect agreement on one version.')],
    ],
    decisions:[
      {title:L('硬条件不能被推荐抹掉','Recommendations cannot erase constraints'),text:L('忌口、位置与明确排除条件保留。预算建议只有在本人调整能解锁候选时才出现，仍要由本人应用。','Dietary, location and excluded-option constraints remain. Budget suggestions appear only when a member’s own change unlocks an option, and still require application.')},
      {title:L('预演不等于同意','A preview is not consent'),text:L('预演只显示可能的候选变化，不修改条件或表态。真正应用后，旧版本的接受状态失效。','Preview shows possible changes without modifying constraints or votes. Applying a change invalidates acceptance of the old version.')},
      {title:L('最后带走的是共同决定','Export a shared decision'),text:L('有效模拟成员都接受同一版本后才能形成决定单。公共导出不附带每个人未公开的私人输入。','A decision requires all active simulated members to accept the same version. Public exports omit private inputs that were not shared.')},
    ],
    tradeoff:L('共同确认比多数票慢。这个版本优先保护明确条件与决定权，是否会增加真实聚餐中的社交负担，需要真人任务验证。','Shared confirmation is slower than majority voting. This version prioritises explicit constraints and agency; whether it adds social friction needs real-user testing.'),
    proof:L('当前是可操作的单人模拟，成员与餐厅均虚构。能检查变更、确认与导出的状态关系，尚未验证真实多人使用、权限和真实商家信息。','This is an interactive single-user simulation with fictional people and restaurants. It demonstrates change, consent and export states, not real multiplayer, permissions or merchant coverage.'),
    next:L('找一组真实聚餐参与者，比较现有群聊与条件确认流程，观察限制表达、被迫妥协和决定用时；不只问他们喜不喜欢界面。','Compare the flow with a real group’s existing chat. Observe constraint disclosure, unwanted compromises and time to agreement, rather than asking only whether they like the interface.'),
    artifact:L('同一版本的公共决定单，私人输入不随单公开。','A shared, versioned decision record that omits private inputs.'),
  },
  {
    id:'bundles',project:'bundle',related:['growth','pricing'],
    name:L('产品如何验证商业收益','How do we test the commercial case?'),
    title:L('卖得更多，先算清让利。','More sales come with a cost.'),
    summary:L('经常一起买，只能提出套餐假设。分开计算新增购买与既有顾客领折扣的成本，再决定值不值得试。','Co-purchases suggest a bundle hypothesis. Separate incremental purchases from discounts to existing buyers before deciding what to test.'),
    image:'showcase/bundle.jpg',secondaryImage:'showcase/bundle-crop.jpg',
    alt:L('Bundle Lab 实际收益推演界面，分开核算新增购买和既有让利','Actual Bundle Lab simulation separating incremental purchases and discounts to existing buyers'),
    caption:L('Bundle Lab · 两类人群的收益账本','Bundle Lab · A two-population contribution ledger'),
    status:L('合成订单，参数化推演','Synthetic orders; assumption-driven simulation'),
    watch:L('把新增采纳率调低，观察已有整套购买者的让利如何吃掉增量。','Reduce incremental adoption and see discounts to existing full-basket buyers outweigh the gain.'),
    insight:L('一个相关性很强的套餐，也可能不值得上线。','A strongly associated bundle can still be a poor launch decision.'),
    question:L('原本就会一起买的人，为什么也要拿到折扣？','What does the discount cost when a customer would have bought both anyway?'),
    problem:L('从订单共现直接跳到“做套餐”，容易把相关性当成效果。更高的客单也不等于更高收益，需要核对新增购买、让利、毛利与采纳假设。','Jumping from co-occurrence to a bundle confuses association with impact. Higher order value does not establish better contribution; adoption, margin and discount leakage matter.'),
    role:L('独立设计并实现订单分析、候选发现、两类人群收益推演、假设传递与计划导出。关联 Growth 和 Pricing，用于展示从假设到实验、付费机制比较的分析过程。','Independently designed and implemented order analysis, candidate discovery, a two-population ledger, consistent assumptions and plan export. Growth and Pricing provide related experiment and payment-model tools.'),
    choices:[
      [L('按共购强度排序','Rank by association'),L('能发现候选，但回答不了打折是否值得。','Finds candidates, but cannot show whether a discount pays.')],
      [L('只算多卖出的收入','Count extra revenue only'),L('忽略原本会整套买的顾客也享受折扣。','Misses discounts given to customers who would buy the full basket anyway.')],
      [L('分人群核对增量与让利','Separate gain from discount leakage'),L('采用的做法：同一组假设贯穿收益、平衡点、建议与导出。','Implemented: one set of assumptions drives the ledger, break-even point, advice and export.')],
    ],
    decisions:[
      {title:L('结构差异先提出问题','Use patterns to ask a question'),text:L('多人订单人均商品数少，也可能因为共享大份菜。先核对份量与人数口径，不直接称为凑单流失。','Fewer items per person may reflect shared portions. Check portion size and party-size definitions before blaming a missing bundle.')},
      {title:L('同一账本允许否定建议','Let the ledger reject an idea'),text:L('模型算例：原价 20、套餐价 18，原有平均消费 12；20% 已经买齐、食材成本率 40%、既有顾客全领折扣。未买齐者采纳 50% 时，新增贡献 1.60 减让利 0.40，净增 1.20；采纳 5% 时净增 −0.24。','Model example: list price 20, bundle price 18, original average spend 12; 20% already buy the full basket, cost ratio 40%, all existing buyers redeem. At 50% adoption among incomplete buyers, gain 1.60 minus discount cost 0.40 gives 1.20; at 5%, the result is −0.24.')},
      {title:L('建议之后接验证计划','Follow advice with a test plan'),text:L('Growth 将统计证据、业务最小效应和人工护栏分开；Pricing 用守恒人群检查不同付费机制。工具辅助判断，不自动宣布全量上线。','Growth separates statistical evidence, minimum business effect and manual guardrails. Pricing compares payment mechanisms on conserved cohorts. These support a decision without automatically authorising rollout.')},
    ],
    tradeoff:L('两类人群仍是简化模型，采纳率、重复购买与商家成本都未被真实订单实验校准。多一个小数位不能补上这些信息。','Two populations are still a simplification. Adoption, repeat purchases and merchant costs have not been calibrated against a live experiment; more decimal places do not fix that.'),
    proof:L('有 4,000 条合成订单和可检查的候选、账本与导出。手算及边界用于验证实现；不能把候选毛利为正或模拟结果写成真实增长。','The demo contains 4,000 synthetic orders with inspectable candidates, ledgers and exports. Hand calculations and edge checks verify implementation, not actual growth.'),
    next:L('先核对商品份量和人群口径，再做小流量对照。预先约定贡献毛利、退款和复购的判断条件，区分新购买与原有整套购买的折扣成本。','Validate portion and segment definitions, then run a small controlled test. Predefine contribution, refund and repeat-purchase conditions, separating new purchases from discounts to existing full-basket buyers.'),
    artifact:L('自己的商品与经营假设卡，含每100个覆盖订单的贡献、让利、平衡点和待验证条件，可导出 Markdown / JSON。','A Markdown or JSON assumption card for personal products, with contribution, discount leakage, break-even and validation conditions per 100 covered orders.'),
  },
];

studies.push(...specificStudies,...newWorkStudies,...usableStudies);

// Existing four opinions stay intact. Each now points to a concrete design decision.
export const aiPractices=[
 {study:'rag',text:L('在 RAG 实验台，引用之前先检查日期和资料版本；条件变化后，旧答案必须重新检索。','RAG Lab checks dates and source versions before citations. A change in scope requires a fresh search.'),link:L('看答案的适用条件','See why a source applies')},
 {study:'trust',text:L('Eval 保留裁判原分；人的不同判断另记，不回写成更好看的分数。','Eval retains the original score and records human disagreement separately.'),link:L('看评分之后的复核','See the review after the score')},
 {study:'execution',text:L('Agent 执行台把批准、写入与最终状态分开。超时先查原操作，不把“没收到回执”当成失败。','Agent Bench separates approval, writes and final state. A timeout calls for reconciliation, not an assumption that the write failed.'),link:L('看失败后的恢复机制','See recovery after a timeout')},
 {study:'bundles',text:L('Bundle Lab 把新增贡献与既有顾客让利分开；销量变多，净收益仍可能变少。','Bundle Lab separates new contribution from discounts to existing buyers. More sales may still mean less profit.'),link:L('看收益判断的完整账本','See the full contribution ledger')},
];

export const viewpoints = [
  {title:L('对人的理解，应该允许人修正。','Let people correct AI’s assumptions.'),body:L('在偏爱实验室里，我把一次选择留作线索，确认后才变成有范围的规则。这样多了一步，但人能知道它为什么记住，也能让它忘掉。','In TasteRoom, a choice starts as a clue and becomes a scoped rule only after confirmation. It takes an extra step, but the person can see the source and undo the memory.'),question:L('接下来想验证：多一步确认，是否比反复纠正错误记忆更省力。','Next question: does confirmation cost less effort than repeatedly correcting unwanted memory?'),study:'taste'},
  {title:L('有解释，还要有可核对的依据。','Explanations need evidence.'),body:L('评测工作台保留原始裁判结果，把引句和人工判断分开。引用能定位，不代表推理成立；没有把握时，保留争议比补出一个确定分数更有用。','The review tools keep the original judge output and separate quotations from human judgement. A located quote does not prove the reasoning; uncertainty should remain reviewable.'),question:L('接下来想验证：独立标注与留出样本上的漏报、误报和复核时间。','Next question: missed errors, false alarms and review time against independent labels and holdout samples.'),study:'trust'},
  {title:L('自动化到哪里，要看错了的代价。','Errors set the automation boundary.'),body:L('随便局可以整理条件、预演调整，但不能替一个人放宽忌口，也不能把预演当成同意。创作 Agent 则在开放生成与人工确认之间分配任务。','Suibianju can organise constraints and preview changes, but cannot relax someone’s dietary limits or treat a preview as consent. Creative Agents similarly divide generation from human checkpoints.'),question:L('接下来想验证：哪些确认保护了决定权，哪些只是增加了负担。','Next question: which checkpoints protect agency, and which only add friction?'),study:'shared-choice'},
];

export const workLinks = ['trust','trust','bundles','shared-choice','bundles'];

export const evidenceDims = [
  {id:'agent',name:L('Agent 与工具工作流','Agents & tool workflows'),words:['agent','智能体','工作流','workflow','工具调用','mcp','skill','编排','orchestration'],keys:['agent','knowledge'],projects:['agent-bench','eval','suibianju','research-agent']},
  {id:'eval',name:L('效果评测与质量判断','Evaluation & quality'),words:['评测','评估','eval','evaluation','rubric','judge','幻觉','质量','prompt','提示词'],keys:['production','eval'],projects:['eval','filing']},
  {id:'innovation',name:L('生活场景与产品探索','Everyday scenarios & innovation'),words:['创新','ai native','ai-native','生活','审美','用户洞察','用户研究','用户体验','innovation','user research'],keys:['cockpit','prd'],projects:['taste','suibianju','grounded']},
  {id:'growth',name:L('增长、实验与数据分析','Growth, experiments & analysis'),words:['增长','growth','a/b','ab test','实验','数据分析','sql','留存','retention','转化','conversion','漏斗','funnel'],keys:['subsidy','exposure'],projects:['growth','bundle']},
  {id:'revenue',name:L('订阅与商业化','Subscriptions & monetisation'),words:['商业化','定价','订阅','revenue','pricing','monetization','monetisation','ltv','cac','arpu','付费'],keys:['subscription','revolut'],projects:['pricing','bundle']},
  {id:'delivery',name:L('企业流程与交付','Enterprise workflows & delivery'),words:['fde','企业','交付','b端','to b','tob','saas','crm','erp','客户','enterprise','delivery','知识库','rag'],keys:['enterprise','knowledge'],projects:['rag-lab','agent-bench','fde','filing']},
  {id:'finance',name:L('金融与研究工具','Finance & research tools'),words:['金融','finance','量化','quant','交易','trading','投研','investment','订单流','order flow'],keys:['investment','msc'],projects:['research-agent','filing']},
  {id:'hardware',name:L('硬件与跨端体验','Hardware & cross-device experiences'),words:['硬件','汽车','座舱','hardware','wearable','可穿戴','cross-device'],keys:['cockpit','bachelor'],projects:['commute'],anchor:'education'},
  {id:'overseas',name:L('海外与工作语言','Overseas products & working language'),words:['海外','英语','英文','英语','overseas','english','international','出海'],keys:['subscription','family','english'],projects:['pricing','content']},
];

export const jdSamples = [
  L('负责 AI / Agent 产品从需求到上线，设计工具工作流与人工确认；建立效果评测，分析用户反馈与留存。','Own AI / Agent products from discovery to launch, design tool workflows and human review, establish evaluation and analyse user retention.'),
  L('探索 AI Native 生活产品，关注用户研究、审美与创新体验，能够亲手制作原型并验证产品假设。','Explore AI-native everyday products through user research, aesthetics and innovation; build prototypes and validate product hypotheses.'),
  L('负责增长与商业化，设计 A/B 实验、订阅与定价策略；使用 SQL 分析转化漏斗、留存和 LTV / CAC。','Own growth and monetisation, design A/B tests and subscription pricing, and use SQL to analyse conversion funnels, retention and LTV / CAC.'),
];
