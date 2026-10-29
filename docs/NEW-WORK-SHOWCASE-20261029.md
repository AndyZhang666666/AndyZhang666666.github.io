# Agent / RAG 与官网精选更新

本轮继续修改官网主版本，没有新建平行网站。两个工具已在同一仓库中，更新它们的展示、短互动与设计过程，保留全部 17 个作品。

## 为什么这样选

默认推荐要覆盖用户关注的 AI / Agent、创新和增长岗位，也要避免四个位置全是相近的技术实验台。

| 方向 | 展示顺序 |
| --- | --- |
| 综合推荐 | Agent 执行台 → Eval Lab → 偏爱实验室 → Bundle Lab |
| AI / Agent | Agent 执行台 → Eval Lab → 可信 RAG 实验台 → 偏爱实验室 |
| 生活与创新 | 偏爱实验室 → Agent 执行台 → Eval Lab → Bundle Lab |
| 增长与商业化 | Bundle Lab → Eval Lab → Agent 执行台 → 偏爱实验室 |

Eval 每个方向都保留。Agent 展示外部动作与故障恢复；Eval 展示输出质量的证据复核；RAG 展示资料能否适用。它们的判断对象不同。偏爱与 Bundle 则保留个人体验和商业收益的视角。随便局继续保留完整工具、封面和案例页。

## 两个短互动

**Agent：超时后查询原操作。** 首页投影 `agent-bench/samples/examples.json` 中现有的 timeout 程序记录。基础策略停在 unknown，恢复策略核对原操作后完成；两者数据库里都已有一条记录。展开结果不代表重新执行，不产生工具调用或 SQLite 写入。原模型适配器不变，没有新增大模型成绩。

**RAG：改变条件后重新检索。** 复用 `rag-lab/engine.mjs` 和 `public-corpus.json`。原始资料在 2026-06-30 为 30 天、2026-10-28 为 14 天；演示修订快照为 10 天。先把旧答案标记为待更新，显式重新查找后才更新答案、版本与引文。答案不是另写的映射表；没有模型调用，也没有装载本地管理侧资料。公开身份模拟不被描述为生产鉴权。

来源固定到 `6816b6d0d324f3c33acbdd6ae8310d1a0a0e4e66`，依赖哈希在 [来源清单](../assets/demo-preview/new-work-provenance.json)。截图来自实际操作后的产品：来源、操作状态、时间与 SHA-256 见 [截图清单](../assets/work/showcase/captures.json)。

## 内容和视觉

- 新增各自的 `/cases/execution/` 与 `/cases/rag/`，问题、选择、机制、证据、代价与下一步分别说明。
- 作品卡改用真实结果截图，可放大查看完整页面；工具、设计过程与源码分别绑定明确地址。
- 原字体、配色、背景、毛玻璃、指针与滚动材质沿用。新增反馈只用于说明状态变化，减少动态效果设置下不产生空间运动。
- 使用现有原生 HTML / CSS / JS；不引入新框架、不提前加载两套完整应用。
- 修改 `content/` 后运行 `node scripts/update-content.mjs`。后续文案生成继续保留新增作品，不覆盖未来独立扩展。

## 验证

仅检查本轮新增和受影响部分，不重跑付费模型或全部后端。

- `node scripts/test-showcase.mjs`：五个预览候选、每方向四项、Eval 保留、真实结果一致、无持久写入、懒加载、17 个作品入口、10 个案例页、图片与无脚本降级、中英文、键盘；三种屏宽 × 四种主题。
- `node scripts/test-showcase-motion.mjs`：原玻璃材质、指针反馈、有限滚动错层、触屏与减少动态效果。
- `node scripts/verify-original.mjs`：30 份原视觉 / 交互文件、9 个保留章节、四条 AI 观点正文、个人事实、头像、简历、应用运行代码及资料不变。本轮仅调整 RAG 历史集成测试的参照范围；并行主分支的双语文档一并保留，不改变应用运行代码。
- `node --test rag-lab/tests/integration.test.mjs`：增量集成与保留独立项目；历史发布与当前官网分别校验。

本地验证记录保存在 `.taste-skill/new-work-20261029/`；[可公开的验收摘要](verification/new-work-20261029.json)保留实际检查项与来源哈希。正式上线还需确认远端 main、Pages 完成以及公开页面实际交互，不能仅凭 push 成功判断。

设计复查按现有单个展示区进行：保留用户指定的玻璃、阴影与动效，不按整页重构规则替换官网风格；实际打开桌面和手机截图检查了层级、换行与结果区域。

## 发布状态

已正常推送到主分支与原开发分支，未强制覆盖。

- 功能：`3cc7a12`；验收：`632776d`；说明：`c72d632`。
- 合并最新双语文档后发布：`3ffbc9e6e2abb1e668d21773795cfc131e1667ba`，保留 `20b4d5a` 的并行修改。
- [GitHub Pages 部署](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40892174760)：completed / success。
- [RAG 自动检查](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40892177102)：completed / success。
- 公开网站六项轻量发布检查通过，桌面与手机可操作；八份关键资源与当前代码字节一致，17 项作品与新项目入口正常，本地后端及管理资料路径保持 404。未调用模型，也没有写入真实记录。
- 本文后续的说明提交只记录已验证的界面发布，不改变已验收的网站资产。

[查看官网](https://andyzhang666666.github.io/#selected) · [完整验收摘要](verification/new-work-20261029.json)
