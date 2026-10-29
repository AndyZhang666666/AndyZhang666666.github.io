# Andy Zhang · 产品作品集与独立工具

[打开官网](https://andyzhang666666.github.io/) · [English](README.en.md) · [GitHub 主页](https://github.com/AndyZhang666666) · [项目索引](https://github.com/AndyZhang666666/AndyZhang666666/blob/main/PROJECTS.md)

这里维护我的个人网站，以及与它一起发布的独立产品。工作经历、产品判断、研究主题与可运行 Demo 分开呈现；公开资料与模拟数据均在对应项目说明。

## 从项目进入源码

| 作品 | 主要问题 | 代码与说明 | 在线体验 |
| --- | --- | --- | --- |
| Agent 执行评测台 | 操作超时后，怎样核对实际业务效果？ | [agent-bench](agent-bench/README.md) | [打开](https://andyzhang666666.github.io/agent-bench/) |
| 可信 RAG 实验台 | 当前条件下，哪些资料可以作为依据？ | [rag-lab](rag-lab/README.md) | [打开](https://andyzhang666666.github.io/rag-lab/) |
| 偏爱实验室 | 一次审美选择该记住什么、记在哪里？ | [tasteroom](tasteroom/README.md) | [打开](https://andyzhang666666.github.io/tasteroom/) |
| 随便局 | 没有共同选项时，怎样协商而不替人让步？ | [suibianju](suibianju/README.md) | [打开](https://andyzhang666666.github.io/suibianju/) |

[Eval Lab](https://github.com/AndyZhang666666/llm-output-eval)、[Filing Eval](https://github.com/AndyZhang666666/filing-eval)、[Bundle Lab](https://github.com/AndyZhang666666/bundle-lab)、[Growth](https://github.com/AndyZhang666666/growth-experiment-lab)、[Pricing](https://github.com/AndyZhang666666/pricing-model-sim)等工具在独立仓库维护。官网提供体验入口和发布文件；修改逻辑时以各独立仓库为源，避免两份实现分叉。

## 运行方式

官网主体为静态 HTML / CSS / JavaScript，GitHub Pages 从 `main` 发布。可使用已有的本地预览脚本：

```sh
node scripts/preview.mjs
```

个人网站主版本的内容与卡片由 `data.json` 和 `content/` 组织；`scripts/update-content.mjs` 是现有内容生成流程。涉及生成时，应先检查并行新增项目的保留逻辑，不用旧基线覆盖它们。

Agent 台和 RAG 台各有可选的本地 API，启动、数据范围、模型配置和复现命令见各模块 README。GitHub Pages 的公开页面不运行这些后端，也不会自动调用付费模型。

## 设计与修改记录

官网保留主题切换、动态背景、章节导航和学术主题图。项目卡区分工具、案例和外部链接；真实产品截图可放大，完整工具直接进入独立体验。

[CHANGELOG](CHANGELOG.md)记录实际修改；[Demo 展示设计](docs/DEMO-SHOWCASE-20261028.md)说明展示区的取舍。各模块包含 PRD、实现和验证材料。界面测试、历史输出和真实模型评测分别记录，不互相代替。

各模块与引入素材的使用权限，以对应 LICENSE 和字体声明为准。

<details>
<summary>之前的发布说明与生活产品记录</summary>

# Andy Zhang · 个人官网

2026-10-28 官网更新：在「关于我」之后提供四项可操作精选，替换九个工具的真实缩略图，十五项作品按工具、案例、扑克分组；产品原则区连接具体作品，采用同一套玻璃材质与有限动效。正式版本由 `main` 发布；[实现、来源与验证](docs/DEMO-SHOWCASE-20261028.md)。

2026-10-27 官网主版本更新：保留原版布局、主题与动效，精简个人与项目说明，增加四篇产品设计案例，打磨五个 Demo 的操作界面。「关于 AI」保留原版四条判断与来源。开发记录见 [CHANGELOG](CHANGELOG.md)。

线上站点：[andyzhang666666.github.io](https://andyzhang666666.github.io/)。当前为根目录静态站点，通过 `main` 的 GitHub Pages 发布，无需构建。

主要内容来自 `data.json`；精选内容和完整项目卡直接生成在 HTML 中，交互按需增强，其他板块沿用 `app.js`。内容更新可运行 `node scripts/update-content.mjs`；仅本地评审时可加 `--local`。当前机器的完整本地预览使用 `打开本地预览.command`，相关说明见 [LOCAL-REVIEW](LOCAL-REVIEW.md)。本地对照页和辅助脚本保留在源码仓库，不作为公开网站页面发布。

## 产品设计案例

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

</details>
