# 官网 V2 与四项产品深化合并

2026-11-09，本地合并记录。产品深化开发基点为 `fdf1eb8`；合入已批准并进入远端 main 的 `828fc5938ae9772afc150d920f892d77935f33b7`。本次不推送，不合并到 main，不发布。RAG 与 Taste 模块代码相对 `fdf1eb8` 没有修改。

## 冲突选择

- 保留 V2 Hero纸面层次、手机目录、四主题、动效接管及其减少动态效果/页面隐藏策略。`app.js`、原背景/教育/动效源文件与828基线一致。
- 保留本批 Eval、偏爱、Bundle、RAG 精选顺序、真实预览计算和新产品说明。通勤及其他作品仍在18项作品库。
- 四个产品案例使用 V2 外壳，只替换各自 `<main>`；主题脚本的 DOMContentLoaded 绑定和手机目录保留。新增检查逐字比较外壳与828基线。
- 全站生成器保留 V2 最后增强步骤，也保留本批增量生成。精选脚本有单独的新缓存键，V2增强不把它覆盖为旧键；两种增强仍幂等。
- `review.html` 保留本批四工具总览、Eval新旧路径映射和按需加载线上。预览保留本批公开边界及V2的 `PREVIEW_ROOT`、自检端点、Squid 映射与缺少可选构建时的公开回退。仅 `/scripts/case-reader.js` 放行，修复V2案例主题/语言脚本与全 scripts 拦截的冲突。
- 双击预览与说明统一8860；不启动或停止用户其他服务。
- 预览源清单同步为 Eval `66a13b4551a9cccaeafb7d8ab3a308c808ec99c8`、Bundle `4cab0dc75fa70df970c016b642d294fbb8a33dde`。历史截图记录中的实际来源SHA、工作树状态和时间不改写，合并后完整浏览器截图另由统一服务记录。

## 已执行

| 检查 | 实际结果 |
|---|---|
| `node scripts/test-selected-depth.mjs` | 通过；基线明确为828，验证四顺序、18作品、其他事实、受保护章节/视觉源、V2案例壳、实际图片尺寸和增量生成幂等 |
| `node --test scripts/test-portfolio-v2.mjs scripts/test-motion-policy.mjs` | 10/10通过；上游断言原样保留 |
| `node --check scripts/preview.mjs` / `scripts/update-content.mjs` | 通过 |
| 临时8869本机HTTP验证 | 30项通过：新输出入口、V2公共脚本、PDF资源、私有路径拒绝、HEAD/方法和来源目录；服务验证后停止，不跟随外站回退 |
| `git diff --check` | 通过 |
| 模块保护 | `git diff fdf1eb8 -- rag-lab tasteroom` 为空 |

HTTP具体记录见 [preview-boundaries.json](preview-boundaries.json)。没有调用模型、在线服务或付费接口；HTTP检查不是浏览器或真人可用性验证。初次受限执行因不能绑定本机端口未启动，放行后的同一临时服务检查通过。

## 旧检查的真实结果

不修改旧脚本或历史报告，也不宣称全部旧脚本在新需求下通过：

- `test-presentation-anchors.mjs`：1/3通过。固定“8张旧高点图”的计数以及旧案例全文冻结不再适用于本批四个新案例/截图；新检查改为从当前实际图片核对尺寸，并逐字保护 V2 案例外壳。
- `test-squid-integration.mjs`：1/3通过。原17项作品内容及整页“只允许Squid/V2变化”冻结，与本批已批准四项目描述/精选更新冲突。新检查保护其余作品和个人事实，Squid本身及V2视觉保持。
- 旧 `test-showcase-motion.mjs` 仍硬编码 `execution` 精选，而本批为RAG；本次只读确认未执行该旧浏览器路径。其原文件保留。新的四精选浏览器与最终合并后动效验证由本批统一服务执行。
- 其他旧通勤精选脚本保持原样。它们的旧基线结果继续保留，不修改为新结果。

## CI 按实际需求分层

合并提交为 `57e90bd`。后续CI适配保留全部旧脚本和断言，新增 `scripts/check-portfolio-history.mjs`，从明确的828提交创建临时只读工作副本，原样执行旧精选、个人展示、投屏/高点、Squid、V2和动效检查，结束后只移除自己创建的临时目录。

该脚本本地真实执行通过：旧精选和个人展示两脚本通过，原 Node 检查20/20通过。[history-results.json](history-results.json)仅代表历史基线，不代表新版全旧检查通过。

当前批次单独运行：

- `test-selected-depth.mjs`：四方向、18项目、所有原个人事实、每个非目标项目完全一致；目标四项目也只能修改显式白名单中的描述、方案、结果和展示文字/实际图片尺寸。名称、URL、GitHub、身份、排序及其他元数据不能借此变更。除允许的四卡片/精选区域/两条精选资源缓存键外，整个主页HTML逐字匹配828；四案例的V2壳和主题脚本也逐字保护。
- 原 V2 与 motion-policy10/10通过。
- 当前 Taste 和 RAG 的全部原计算、状态、恢复、验证、模型关闭及真实本机HTTP安全测试104/104通过；没有跳过核心原断言。
- 当前生成只使用 `--selected-only`，并对生成后的HTML、数据、案例、保护报告要求干净差异，不让全站旧生成覆盖当前产品。
- `test-showcase-motion.mjs` 是带旧 execution 精选的真实浏览器流程，本CI不安装浏览器、不模拟成通过；做原文件语法检查，当前视觉动效使用原V2/motion合同和本地浏览器证据分别说明。

`four-selected-development.yml`、`squid-entry.yml`、`rag-lab.yml`加入本批分支触发；其他可能在PR运行的旧展示流程同样改为历史原断言＋当前明确保护。五份修改后的workflow已由系统YAML解析器读取验证；远端Actions尚未触发，不冒充远端已绿。
