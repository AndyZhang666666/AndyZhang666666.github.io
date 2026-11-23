export const work = [
  ['shanhai','山海星辰','Shanhai Xingchen','把复杂的创作流程拆成几步，确定哪些决定要交还给编剧。','Break a creative workflow into stages and decide where the writer should take over.'],
  ['baidu','百度','Baidu','通过使用数据找出用户错过的入口，让有用的功能更容易被发现。','Use behavioral data to spot overlooked entry points and make a useful feature easier to discover.'],
  ['keeta','美团 · Keeta','Meituan · Keeta','按用餐场景拆分需求，再用首单和复购判断补贴花得值不值。','Separate dining occasions and judge an incentive by first orders and repeat purchases.'],
  ['li-auto','理想汽车','Li Auto','结合门店观察和使用记录，把车里的一连串操作收成一次指令。','Combine showroom observations and usage data to turn several cabin controls into one command.'],
  ['revolut','Revolut','Revolut','把会员权益讲清楚，再用对照实验判断用户为什么愿意升级。','Clarify membership benefits and test which changes help people choose an upgrade.']
];

export const tasks = [
 {id:'eval', title:['判断模型打分有没有依据','Check the evidence for a model score'],name:['Eval Lab','Eval Lab'], kind:['历史评测回放','Historical evaluation'],desc:['读一条 2/5 的结构评语，回到被引用的原文，留下自己的判断。','Compare a 2/5 structure score with its quoted passage and record your own judgment.'],url:'/llm-output-eval/?sample=e06&dimension=structure',words:'模型打分 模型评分 模型质量 评估大模型 效果评测 模型评测 评测 评估模型 低分 评语 rubric evaluation eval model_score model_quality'},
 {id:'taste', title:['比较两种设计，再决定用哪种','Compare two designs before choosing one'],name:['偏爱实验室','Taste Lab'],kind:['可操作作品','Interactive work'],desc:['给同一段文字换两种构图。先比较，再决定只用这一次，还是记住偏好。','Try two compositions with the same copy, then choose a one-off layout or a lasting preference.'],url:'/tasteroom/?direction=swiss',words:'用户反馈 收集反馈 用户偏好 设计原型 交互原型 设计方案 两种设计 设计比较 偏爱 构图 海报 排版 审美 layout layouts composition compositions designs design_preference poster'},
 {id:'bundle',title:['判断促销有没有多赚钱','Check whether a promotion earns more'],name:['Bundle Lab','Bundle Lab'],kind:['模拟算例','Simulation'],desc:['改一项采纳假设，同时看新增毛利和给原有顾客的让利。','Change adoption and compare added gross profit with discounts given to existing buyers.'],url:'/bundle-lab/simulate/',words:'促销 毛利 优惠 让利 套餐 折扣 净增量 单位经济 补贴 promotion promotions bundle margin discounts profit incremental_profit'},
 {id:'rag',title:['检查检索结果能不能支撑回答','Check whether retrieved sources support an answer'],name:['可信 RAG 实验台','RAG Lab'],kind:['可操作作品','Interactive work'],desc:['改动生效日期，再检查答案引用的是哪一版条款。','Change the effective date and check which version of a clause supports the answer.'],url:'/rag-lab/',words:'检索 知识库 召回 来源 引用 资料版本 原文 条款 rag retrieval retrieved citation citations sources knowledge_base'},
 {id:'growth',title:['设计实验，验证增量','Design a growth experiment'],name:['增长实验台','Growth Experiment Lab'],kind:['模拟算例','Simulation'],desc:['从实验设计、分流到上线判断，查看指标怎样影响一次实验决定。','Inspect the experiment design, allocation and metrics behind a launch decision.'],url:'/cases/growth/',words:'a/b ab实验 增长实验 因果归因 ab_testing 对照实验 实验设计 增长实验 ab_test experiment experiments'},
 {id:'agent',title:['核对工具执行结果','Verify a tool action'],name:['Agent 执行评测台','Agent Execution Bench'],kind:['可操作作品','Interactive work'],desc:['提交超时后检查工单的最终状态，再决定是否重试。','After a timeout, inspect the final ticket state before retrying.'],url:'/agent-bench/',words:'agent 执行 工具调用 重试 超时 智能体 tool_call timeout retry'},
 {id:'group',title:['把含糊的需求拆成具体条件','Turn a vague need into constraints'],name:['随便局','Group Planner'],kind:['可操作作品','Interactive work'],desc:['调整一位成员的预算，查看哪些选项能同时满足大家的条件。','Adjust one member’s budget and see which options meet everyone’s constraints.'],url:'/suibianju/',words:'定义问题 需求梳理 用户需求 拆解需求 需求分析 约束 整理需求 constraints user_needs requirements_analysis'},
 {id:'pricing',title:['比较定价方案','Compare pricing plans'],name:['定价模拟器','Pricing Model Sim'],kind:['模拟算例','Simulation'],desc:['把定价方案放在同一组假设下比较，查看哪个假设会改变结论。','Compare prices under common assumptions and inspect which assumption changes the decision.'],url:'/cases/pricing/',words:'定价 收费模式 price pricing pricing_strategy'},
 {id:'filing',title:['核对财报里的判断','Review a claim in a financial filing'],name:['Filing Eval','Filing Eval'],kind:['可操作作品','Interactive work'],desc:['打开财报评测案例，回到材料核对结论。','Open a filing case and check the conclusion against its source.'],url:'/cases/filing/',words:'财报 投研 financial_filing filings investment_research'},
 {id:'fde',title:['把业务步骤做成可交付的工具','Deliver a tool for a business workflow'],name:['企业 AI 交付案例','Enterprise AI delivery'],kind:['交付案例','Delivery case'],desc:['看商品资料怎样进入问答流程，以及何时需要人工核实。','Read how product records enter a support workflow and where a person needs to verify them.'],url:'/cases/agent-workflow/',words:'交付 企业流程 fde 选品 企业知识库 delivery enterprise'},
 ...[
 ['keeta','按用餐场景拆分需求','Identify demand by dining occasion','复购 首单 获客 拉新 留存 用户分层 商品推荐 多人份推荐 推荐策略 recommendations acquisition retention repeat_purchase'],
 ['baidu','改善功能入口和用户触达','Improve feature discovery and outreach','触达 入口优化 埋点 漏斗 outreach funnel feature_discovery'],
 ['revolut','设计会员权益与升级引导','Design membership benefits and upgrades','会员 续费 订阅 付费转化 升级权益 subscription membership renewal'],
 ['li-auto','把用户观察带进产品设计','Translate user observation into product design','用户访谈 门店 用户观察 座舱 硬件 user_research cockpit hardware'],
 ['shanhai','安排工作流中的人工确认','Place human decisions in a workflow','编剧 人工确认 人机协作 工作流 workflow human_review']
 ].map(([id,zh,en,words])=>{const row=work.find(w=>w[0]===id);return {id,title:[zh,en],name:row.slice(1,3),desc:row.slice(3),kind:['工作经历','Professional experience'],url:'/#work-'+id,words}})
];
export const methods=[
 ['定义问题','Frame a problem','把每个人的预算、时间和底线写成可比较的条件。','Translate budgets, schedules and constraints into comparable options.','约束清单','Constraint list','随便局','Group Planner','/suibianju/','飞书多维表格 / Figma','Feishu Base / Figma'],
 ['做出原型','Prototype','让用户用同一份内容比较方案，再记录选择。','Compare designs with identical content and capture a choice.','可操作画布','Interactive canvas','偏爱实验室','Taste Lab','/tasteroom/','Figma / JavaScript','Figma / JavaScript'],
 ['复核质量','Review quality','把评分与原文放在一起，逐条复核有争议的判断。','Read a score alongside its source and review disputed judgments.','评测复核报告','Evaluation review','Eval Lab','Eval Lab',tasks[0].url,'Python / JSON','Python / JSON'],
 ['验证收益','Test a return','把关键假设写进账本，检查什么条件下方案才划算。','Put assumptions into a ledger and inspect the break-even point.','套餐假设卡','Bundle assumption card','Bundle Lab','Bundle Lab',tasks[2].url,'Excel / SQL','Excel / SQL']
];
