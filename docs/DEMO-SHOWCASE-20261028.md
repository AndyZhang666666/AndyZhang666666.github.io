# Demo 展示区改版 · 2026-10-28

本轮在现有官网主版本上增加可试玩的精选区，更新作品卡和截图。没有复制新的官网，没有修改各 Demo 的业务功能。代码先同步至 `feat/demo-showcase-20261027` 待审分支，线上 `main` 暂不替换。

## 访客现在可以做什么

- 首屏的作品入口进入四项精选。关注方向会调整四项顺序，默认展示该方向的第一项；不自动轮播。
- Eval Lab：定位一条真实历史引句，查看原文；不改原始分数，不自动作复核结论。
- 偏爱实验室：同文案切换瑞士现代主义与解构主义。使用产品本身的参数化 SVG 渲染器，不保存偏好；完整工具入口携带所选方向。
- 随便局：预演一位虚构成员将预算从 ¥40 调整为 ¥85 或 ¥110。共同可行选项分别为 0、1、2 个。已确认条件和表态不变，预演不代表共同接受。
- Bundle Lab：原本未买全者的采纳率在 5% / 50% 切换，每个覆盖订单的净增贡献从 −¥0.24 变为 +¥1.20。假设可展开，结果是算例，不是真实经营收益。
- 全部十五项作品保留：九项产品工具、三项交付与研究案例、三项扑克作品。案例没有试玩按钮；外部扑克测试明确跳往外站。
- 九项内部工具提供当前界面的真实截图；局部图可打开完整截图，Escape 关闭并回到原入口。图片失败时仍有文字与完整工具链接。

## 为什么这样实现

旧展示脚本通过“第一个含 http 的项目链接”寻找试玩地址；实际体验链接已是相对路径，可能误选 GitHub 源码。本轮明确区分 `url`（体验）、`github`（源码）、`iterationUrl`（案例），每项新增稳定 `id`，不再按名称或链接文本猜测。

首页每次只增强一个短互动，不装载四套完整应用。全部工具仍通过真实地址打开，不把首页预览状态伪装成已保存的完整会话。精选入口、默认预览及十五项卡片直接写入生成的 HTML，不依赖数据请求才能出现。无 JavaScript 时四个精选链接和作品库仍可访问。

主要入口：`content/showcase.mjs` 生成精选内容；`assets/demo-showcase.mjs` 负责临时交互和截图放大；`content/project-presentation.mjs` 组织展示文案与图像；`assets/project-cards.mjs` 在构建和浏览器间共享卡片渲染。

## 代码与图像来源

| 部分 | 来源 | 本轮处理 |
|---|---|---|
| 历史评测 | `llm-output-eval`，提交 `7cbf20fcfd81767a641b0a830312e6293ea5307a` 的 `src/data/replay.json` | 仅提取 e06 第一次历史运行的结构维度、原文及精确引用位置 |
| 套餐计算 | `bundle-lab`，提交 `55448e1b6c0ea623afd39d3230e1a3332e311f1e` 的 `lib/simulate.js` | 逐字节复用纯函数；不重新写展示公式 |
| 海报 | 本仓库 `tasteroom/directions.js` | 在预览激活后按需导入；仅改临时画布方向 |
| 聚餐 | 本仓库 `suibianju/product.mjs` 的 `previewConditions` | 对固定虚构会话作无副作用预演 |
| 九张实图 | 本机当前应用构建，由隔离浏览器采集 | 提供原视口与字面裁切；没有合成虚构产品界面 |

源文件的提交、地址和 SHA-256 见 `assets/demo-preview/provenance.json`；截图路径、采集时间、视口、裁切和哈希见 `assets/work/showcase/captures.json`。没有读取账户设置、API Key、个人浏览记录或企业资料。

## 复查方法

在仓库根目录运行，Node 22 及以上：

```sh
node scripts/update-content.mjs
node scripts/verify-original.mjs
node scripts/test-showcase.mjs
```

浏览器脚本使用本机已安装的 `playwright` 与 Chrome；如 Playwright 位于共享运行时，可用 `PLAYWRIGHT_MODULE` 指定模块入口。需要先在 `http://127.0.0.1:8811` 启动完整本地预览；也可通过 `SHOWCASE_BASE_URL` 指向等价预览服务。

来源同步和截图更新是独立维护动作，不随普通内容生成重复执行：

```sh
node scripts/sync-showcase-sources.mjs /path/to/demo-source-parent
node scripts/capture-showcase.mjs
```

验证涵盖：生成可重复、原版 27 个 CSS / 效果脚本保持字节一致、十个受保护板块和个人事实不变、来源哈希、四项互动、方向排序、键盘操作、真实入口、无持久写入、无 JavaScript 回退、依赖与图像失败恢复，以及 1440 / 768 / 390px × 四种主题 × 四个预览的布局。

保护基准是上一轮实际发布的 `05f4e98bed60a8a7188aea2423b483c3f6dadc2b`。导航增加精选标签、作品分组和展示区属于本轮批准的修改范围；验收脚本仍严格检查其他内容，没有删掉原版保护检查。

截图与运行报告在本机 `.taste-skill/showcase/`，不提交到公开站点。以上是前端与回归验证，不是用户研究，也没有新增生产效果或模型准确率宣称。
