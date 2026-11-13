import {evalPublicCoverUrl} from './public-covers.mjs';
// Product description, never career facts or calculated results.
const L=(zh,en)=>({zh,en});
export const productDepthStudies={
 trust:{
  image:evalPublicCoverUrl,secondaryImage:evalPublicCoverUrl,
  caption:L('Eval Lab · 自有文稿、人工审阅与版本关系','Eval Lab · Personal text, manual review and versions'),
  title:L('从一条争议，走到下一版。','From a disputed judgement to the next draft.'),
  summary:L('带自己的创意文本，先人工审阅或导入已有评价。核对依据、留下处理项，把改稿与原稿放在同一条证据链里。','Bring creative text for manual review or import an existing evaluation. Check evidence, track actions and connect the revision to its source.'),
  watch:L('先点首页引用留下临时判断；进入完整工具后，用自己的文本开始人工审阅，再建立一份修改稿。','Locate a homepage quotation and try a temporary verdict; then start a manual review of your own text and create a revision in the full tool.'),
  status:L('历史回放、外部结果与人工审阅分别标明；主要任务免 Key，不产生模型调用','Historical replay, external results and manual review are labelled separately; core tasks need no Key or model call'),
  role:L('独立设计并实现材料用途、人工审阅、严格导入、证据复核、处理项、改稿关系与报告。沿用原五维评分与历史输出；人工意见不改写模型成绩。','Independently designed and implemented purpose declarations, manual review, strict import, evidence checks, actions, revisions and reporting. Original dimensions and historical outputs are retained; human opinions never overwrite model scores.'),
  decisions:[
   {title:L('没有模型，也能完成审阅','Make review useful without a model'),text:L('只带原文即可按五维记录意见、引用和处理项。没有模型结果时明确显示尚无评测，不填零分，不计入裁判一致率。','Review text with five-dimension notes, quotations and actions without a model result. Missing model evaluations stay missing, never zero or part of judge-agreement statistics.')},
   {title:L('判断是否适用，先于比较高低','Check applicability before comparing scores'),text:L('完整短篇与开场片段的用途分别声明；不适用意见属于人工解释层。用途、模型或标准不一致时展示比较限制，原分与均分保持原样。','Declare complete stories and opening excerpts separately. Applicability notes belong to the human layer. Different purposes, models or standards limit comparison without changing original scores or averages.')},
   {title:L('处理完成，不等于问题解决','Finishing an action is not proof of resolution'),text:L('处理项关联维度与来源，新建修改稿时选本次处理的问题。旧稿、旧评价仍可回看，后续审阅才确认是否解决；报告先列未解决项。','Actions link to dimensions and records, then to a new draft. Keep old text and evaluations; later review determines resolution. Reports lead with unresolved work.')},
  ],
  artifact:L('含原文版本、用途、原始评价、人工意见和处理历史的 Markdown／JSON 报告；无模型时为人工审阅报告。','Markdown/JSON with text versions, purpose, original results, human review and actions; reports without model output are labelled manual reviews.'),
  proof:L('历史原文、评分和结果标识保留。本轮对自有材料、人工审阅、导入与改稿路径进行独立验证；具体检查及未测范围见仓库记录，不把界面完成写成模型质量提升。','Historical text, scores and identifiers are retained. Personal-material, manual-review, import and revision paths are verified separately; repository records state checks and limits, without claiming better model quality.'),
 },
 taste:{
  caption:L('偏爱实验室 · 作品工作台、六构图与三尺寸','TasteRoom · Artwork studio, six compositions and three formats'),
  summary:L('用自己的图文做一张海报：六套构图、三种尺寸、两份候选。作品先带走，哪些方向值得下次沿用，再明确授权。','Create a poster from your own image and copy: six layouts, three sizes and two candidates. Export first, then explicitly authorise what to reuse.'),
  watch:L('编辑图文并更新画布，打开构图库比较同一内容的六种排版，留一份候选，再导出PNG。未应用编辑时，明确选择导出当前画布或先更新；场景授权单独确认。','Edit copy and image, apply to the canvas, compare six compositions, keep a candidate and export PNG. Unapplied edits offer an explicit export-current or update-first choice; scene memory requires separate consent.'),
  role:L('独立实现六构图与三尺寸重排、真实活动字段、本机图片与裁切、完整候选、容量修复、方向来源条及可撤回场景记忆。预览、PNG与SVG共用渲染器。','Independently implemented six compositions, three reflowing sizes, event details, local images and cropping, complete candidates, capacity repair, provenance and reversible scene memory. Preview, PNG and SVG share one renderer.'),
  decisions:[
   {title:L('输出尺寸改变，构图就重新组织','Reflow when the output format changes'),text:L('竖版、方形、横版分别计算文字和主图区域；空字段不占位置。过密时保留原文并给修复入口，未解决的遮挡不允许作为成品导出。','Portrait, square and landscape recalculate text and image regions. Empty fields take no space. Dense copy is retained with repair controls; unresolved overlap blocks final export.')},
   {title:L('当前画布为什么长这样','Make the artwork’s provenance visible'),text:L('区分当前场景授权、全局继承和临时改动。恢复场景方向复用原规则，不写新记忆；换内容可检查哪些偏好被沿用。','Distinguish scene consent, inherited global rules and temporary edits. Restoring a scene direction reuses its rule without new memory; new content reveals what carried forward.')},
   {title:L('作品快照与长期偏好各存一份','Separate artwork snapshots from durable preference'),text:L('候选带文案、尺寸、参数与主图引用，恢复前确认替换影响。图片只在本机；导出不附私人反馈，说明书独立且可撤回、重新导入。','Candidates include copy, size, parameters and image reference, with replacement confirmation. Images stay local; exports omit private feedback. Preference briefs remain separate, reversible and importable.')},
  ],
  artifact:L('900×1200、1080×1080或1600×900的PNG／SVG作品、两份本机候选，以及独立的场景偏好说明书。','PNG/SVG artwork at900×1200,1080×1080 or1600×900, two local candidates and a separate scoped preference brief.'),
  proof:L('保留原授权、恢复及存储断言，补充六构图×三尺寸排版与未应用编辑的导出检查；实际操作与截图见仓库验收记录。尚无真人审美准确率或任务完成率声明。','Existing consent, recovery and storage assertions are retained, with added six-by-three layout and unapplied-edit export checks. Repository records contain actual operations and screenshots; no measured taste accuracy or real-user completion rate is claimed.'),
 },
 bundles:{
  caption:L('Bundle Lab · 输入基线、双人群账本与方案快照','Bundle Lab · Baseline, population ledger and scenario snapshots'),
  summary:L('带商品与订单构成建立基线，比较三份套餐方案。看清新增贡献、既有顾客让利与平衡点，再写验证计划、回填观察。','Build a baseline from products and order composition, compare three bundle scenarios, inspect gains, leakage and break-even, then plan a test and record observations.'),
  watch:L('导入模板订单或手工建算例，确认商品参考价；保存A并复制成B，对照账本后带走验证计划。','Import template orders or enter a manual scenario, confirm reference prices, save A and copy B, compare ledgers and export a validation plan.'),
  role:L('独立实现订单CSV预览与参考价确认、基线适配、原双人群账本、三方案、条件地图、验证计划与观察回填。所有收益复用原模型，不增加价格弹性或最优定价预测。','Independently implemented CSV preview and reference-price confirmation, baseline adapters, the original two-population ledger, three scenarios, a condition map, validation planning and observations. All returns reuse the original model without elasticity or optimal-price forecasts.'),
  decisions:[
   {title:L('先说清楚这些订单代表什么','Define what the order baseline represents'),text:L('按订单聚合商品出现关系，多单价先展示再确认参考价；实际覆盖单数与每100单比较单位分开。数量和实付不被偷换成已核对收入。','Aggregate SKU presence by order and confirm a reference price when prices vary. Separate observed covered-order count from the per100 comparison unit. Quantity and paid revenue are not silently inferred.')},
   {title:L('贡献与让利必须一起看','Keep gains and discount leakage together'),text:L('新增毛利、既有让利、增量毛利与平衡采纳率共同呈现。条件地图只预演；三份方案是独立快照，不能随滑杆漂移或把收益相加。','Show new margin, existing-buyer discounts, incremental margin and break-even together. The map only previews; three scenarios are independent snapshots, never drifting with sliders or summed as returns.')},
   {title:L('下一步是试验，不是自动上线','Move toward a test, not automatic rollout'),text:L('带入方案口径、平衡点和待验证项，补充对照、观察时长与护栏。回填率只与假设作描述比较，确认后复制为新工作假设，原方案和计划保留。','Carry scope, break-even and assumptions into a plan with controls, duration and guardrails. Observed rates are descriptive; explicitly copy them to a new assumption while preserving the original plan and scenario.')},
  ],
  artifact:L('Markdown／JSON假设卡：方案差异、选择理由、基线口径、双人群账本、验证计划与已有观察。','Markdown/JSON assumption card with scenario changes, rationale, baseline, population ledger, plan and available observations.'),
 },
 rag:{
  image:'showcase/rag-lab-craft.png',secondaryImage:'showcase/rag-lab-craft.png',
  caption:L('可信 RAG · 就地核对引用，区分采用与插入','Trustworthy RAG · Inspect citations locally; adopt and insert separately'),
  summary:L('对照日期、资料版本和任务条件，组织有依据的答复。内置案例可改条件，自己的资料可本机检索；未知条款留待确认。','Draft an answer against dates, source versions and task facts. Change built-in cases or search personal sources locally; unknown clauses remain unconfirmed.'),
  watch:L('先在首页切换历史日期，检查旧答复如何变为待更新；再到完整工具完成任务或导入自己的资料。','Change the historical date on the homepage and inspect the stale result, then complete a task or import personal sources in the full tool.'),
  status:L('免模型示例／本机自有资料分别标明；真实模型接口默认关闭，未调用上游','Model-free examples and local personal sources are labelled separately; the model interface is disabled by default with no upstream calls'),
  role:L('独立实现资料范围、版本与生效期选择、文本检索、证据定位、事实确认、答复记录与待重查状态；本地API保留会话与范围检查，真实模型另行配置和验证。','Independently implemented source scope, version/effective-date selection, retrieval, evidence location, fact confirmation, answer records and staleness. The local API retains session and scope checks; real models need separate configuration and validation.'),
  decisions:[
   {title:L('检索到，不等于适用','Retrieval does not establish applicability'),text:L('先限定资料、日期与版本，再核对支持当前事项的条件。缺少、冲突或未来条款不被补成确定答案，引用定位只证明文字匹配。','Scope sources, date and version before checking task conditions. Missing, conflicting or future clauses do not become certain answers; citation location proves text matching only.')},
   {title:L('变了条件，就保留旧结论的边界','Retain the conditions behind an old answer'),text:L('答复绑定问题、事实、业务日期与实际引文。日期或资料变化后先标待重查，重新运行后才显示新结果；人工补写与证据原句分开。','Bind each answer to question, facts, date and actual citations. Date/source changes mark it stale before a new run; manual additions remain distinct from quoted evidence.')},
   {title:L('自己的资料，不冒充通用语义理解','Personal sources are not automatic semantic understanding'),text:L('本机导入后先确认资料元数据，真实检索并组织草稿。范围外条款保持原文和人工判断；API默认关闭，不会因缺Key假装生成成功。','Confirm source metadata, retrieve actual text and organise a draft locally. Unsupported clauses remain evidence for human judgement; the API is off by default and missing credentials never produce simulated model success.')},
  ],
  artifact:L('带问题、条件、来源与待确认项的答复单，支持复制、Markdown和JSON工作记录；个人全文只在明确选择时附出。','An answer sheet with question, conditions, sources and unresolved items, available as copy, Markdown and JSON. Personal source text is included only by explicit choice.'),
  tradeoff:L('受控规则便于查证，覆盖范围也更窄。任意资料仍需要人确认含义，真实模型与生产权限要另行验证；公开示例不证明企业知识库效果。','Controlled rules are inspectable but narrower. Arbitrary sources need human interpretation; real models and production permissions require separate validation. Public examples do not establish enterprise performance.'),
 },
};
