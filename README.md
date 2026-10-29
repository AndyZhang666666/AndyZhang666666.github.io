# Andy Zhang · 个人官网

2026-10-29 新项目展示更新：默认精选为 **Agent 执行评测台、Eval Lab、偏爱实验室、Bundle Lab**，分别看执行恢复、输出复核、个人偏好与商业收益。「AI / Agent」方向增加 **可信 RAG 实验台**，每个方向仍为四项，Eval 始终保留。作品库保留全部 17 项；新工具使用真实界面封面，新增各自设计过程。[本轮实现与验证](docs/NEW-WORK-SHOWCASE-20261029.md)。

2026-10-29 早期评审记录：四个精选展示独立复核、单变量与授权、条件预演、订单候选与收益账本；更换四张实际结果封面，修正案例归属，AI 观点连接自己的实践。[本轮实现与复查](docs/SHOWCASE-DECISIONS-20261029.md)。开发分支的同步与正式 Pages 发布分别记录。

2026-10-28 官网更新：在「关于我」之后提供四项可操作精选，替换九个工具的真实缩略图，十五项作品按工具、案例、扑克分组；产品原则区连接具体作品，采用同一套玻璃材质与有限动效。正式版本由 `main` 发布；[实现、来源与验证](docs/DEMO-SHOWCASE-20261028.md)。

2026-10-27 官网主版本更新：保留原版布局、主题与动效，精简个人与项目说明，增加四篇产品设计案例，打磨五个 Demo 的操作界面。「关于 AI」保留原版四条判断与来源。开发记录见 [CHANGELOG](CHANGELOG.md)。

线上站点：[andyzhang666666.github.io](https://andyzhang666666.github.io/)。当前为根目录静态站点，通过 `main` 的 GitHub Pages 发布，无需构建。

主要内容来自 `data.json`；精选内容和完整项目卡直接生成在 HTML 中，交互按需增强，其他板块沿用 `app.js`。内容更新可运行 `node scripts/update-content.mjs`；仅本地评审时可加 `--local`。当前机器的完整本地预览使用 `打开本地预览.command`，相关说明见 [LOCAL-REVIEW](LOCAL-REVIEW.md)。本地对照页和辅助脚本保留在源码仓库，不作为公开网站页面发布。

## 产品设计案例

- [Agent 执行与失败恢复](https://andyzhang666666.github.io/cases/execution/)：批准与具体变更绑定，超时查询原操作，依据最终状态判定完成。
- [RAG 依据与适用条件](https://andyzhang666666.github.io/cases/rag/)：先选资料范围与生效版本，再检索、核对引文；条件改变后重新检索。
- [AI 输出如何被信任](https://andyzhang666666.github.io/cases/trust/)：评分、证据定位与独立人工复核。
- [AI 如何理解个人偏好](https://andyzhang666666.github.io/cases/taste/)：单变量比较、授权范围与可撤回记忆。
- [AI 如何参与共同决策](https://andyzhang666666.github.io/cases/shared-choice/)：条件确认、无副作用预演与同版共同接受。
- [套餐值得上线吗](https://andyzhang666666.github.io/cases/bundles/)：分开计算增量贡献与既有顾客让利。

## 独立生活产品

| 作品 | 产品判断与可体验闭环 | 说明 |
|---|---|---|
| [随便局](https://andyzhang666666.github.io/suibianju/) | 不用多数票覆盖底线；自愿预算建议 → 草稿预演 → 本人确认 → 逐人接受 → 决定单 | [README](suibianju/README.md) · [PRD / 第二轮](suibianju/docs/V2.md) · [更新记录](suibianju/CHANGELOG.md) |
| [TasteRoom · 偏爱实验室](https://andyzhang666666.github.io/tasteroom/) | 喜欢整张不能直接归因到每个参数；单变量对照 → 明确范围 → 场景/内容验证 → 偏好说明书与 SVG | [README](tasteroom/README.md) · [PRD / 第二轮](tasteroom/docs/V2.md) · [更新记录](tasteroom/CHANGELOG.md) |

两者均可免 Key 运行，公开版使用明确标注的本地规则，不调用真实模型。随便局为 3–5 位虚构角色的单人模拟，不是真实协作；偏爱实验室的线索不是人格结论或模型准确率。人物、餐厅和海报活动均为原创虚构样例，没有真实用户效果宣称。

改动与验证：[CHANGELOG.md](CHANGELOG.md) · [随便局 PRD](suibianju/docs/PRD.md) · [部署说明](suibianju/docs/IMPLEMENTATION.md)。

本轮计划与验收：[方案](docs/lifestyle-v2/PLAN.md) · [浏览器验收脚本](docs/lifestyle-v2/test-upgrades.mjs)。原网站格式、主题、交互、履历与其他 Demo 保持不变。
