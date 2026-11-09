# 四项精选接回官网

2026-11-09，本地集成；未推送、合并或发布。沿用官网 `55f3cb4` 主版本，在冻结的TasteRoom提交后追加本批集成。没有建立第五套网站皮肤。

## 这次改了什么

精选仍在“关于我”之后、长篇经历之前，桌面左侧四项、右侧单项预览，手机两行按钮。默认是 Eval → 偏爱 → Bundle → 可信RAG；AI方向是RAG → Eval → 偏爱 → Bundle，生活方向是偏爱 → Eval → RAG → Bundle，增长方向是Bundle → Eval → RAG → 偏爱。方向只重排与选中，四项始终可访问，没有自动轮播。

通勤退出默认四精选，但完整工具、源码、卡片和原案例全部保留。全部18项作品及其原顺序保留，其他项目内容没有被本批覆盖。

首页让人先做一个具体判断：

| 项目 | 短互动 | 完整工具要完成的任务 |
|---|---|---|
| Eval | 定位一条历史引句，留本页临时判断，原始2分不变 | 自有文本人工审阅／导入评价，留下处理项和改稿关系 |
| 偏爱 | 同一文案切六套真实构图，不保存偏好 | 自己的图文、活动信息、三尺寸作品和独立场景记忆 |
| Bundle | 改采纳假设，看新增、让利与原函数算出的平衡点 | 订单基线、三方案对照、验证计划与观察回填 |
| RAG | 改日期／快照，旧答复先待更新，重查后显示对应引用 | 用资料与任务条件组织可核查答复，未知条款留待确认 |

四项说明、相关卡片、设计过程和90秒投屏的高光入口一起更新。完整工具新标签打开；只有偏爱明确传递构图方向，其他预览不声称带入临时判断或输入。

## 使用真实来源

Eval预览仍是原e06历史运行的结构维度，未重新运行模型。Bundle的纯函数按字节从源库固定版本提取，候选仍从原合成订单真实挖掘；本页没有另一套收益公式。来源版本与哈希见 [provenance.json](../assets/demo-preview/provenance.json)。

偏爱直接调用本轮的 `artwork.js`／`directions.js` 渲染器，隔离Room不读写用户存储。RAG按需加载原检索引擎与公开资料，30／14／10天分别来自实际版本检索，不是首页答案映射表。没有预加载四套完整应用，没有整页iframe。

四项默认内容、模式说明和入口存在于生成后的HTML，不依赖JavaScript才能找到工具。资源失败时原链接仍能打开完整工具。

## 真实图库

图库现在使用本轮实际操作过的Chrome截图：

- Eval：原创演示文稿与已保存人工观察，明确显示尚无模型评测。
- 偏爱：自己的演示标题、活动信息与1600×900横版，不授权偏好。
- Bundle：原合成订单基线、账本与本机方案A，不代表真实收益。
- RAG：当前三列工作区的条件、答复及适用来源，原创制度、无模型调用。

原图与缩略图当前采用同一份未编辑的实际视口，不拼接、不生图、不把装饰稿当工具。[captures.json](../assets/work/showcase/captures.json)记录URL、时间、尺寸、状态、源提交和文件哈希；其他项目的截图记录保留。源仓尚有未提交实现时明确标记 `hasUncommittedSourceChanges`，不能把该提交SHA说成整个当前工作区的冻结版本。最终工具统一冻结后可再运行同一脚本刷新证据。

## 保留了什么

首屏、关于我、关于AI、工作、教育、奖项、工具、能力、JD和联系区的原HTML逐字保留。首屏、背景、学术图、毛玻璃、卡片偏移和触感动效代码保持。只在精选样式中补充平衡点可读性、44px链接目标与旧答复状态提示。

TasteRoom在本批集成期间保持冻结；RAG、Eval、Bundle的功能代码没有在这个官网提交里修改。统一预览服务负责映射各项目当前构建，本站入口仍为 `/llm-output-eval/`、`/tasteroom/`、`/bundle-lab/simulate/`、`/rag-lab/`。

## 内容如何再生成

```sh
# 固定源库纯函数和历史摘录，保留版本与哈希
node scripts/sync-showcase-sources.mjs ..
# 在“当前页面”增量更新四精选和其所属卡片／案例
node scripts/update-content.mjs --selected-only
# 当前批次静态、来源与保护检查
node scripts/test-selected-depth.mjs
```

`--selected-only`调用新增的 `update-selected.mjs`，不从旧Git版本重建整站。连续运行得到相同HTML、数据和案例。原全站生成器末尾也接回这一增量步骤，避免旧扩展整合覆盖四精选；本轮只运行增量模式。生成报告记录保护区、18项作品及实际预览源哈希：[generation.json](verification/selected-depth-generation-20261109.json)。

可选真实截图：

```sh
SHOWCASE_BASE_URL=http://127.0.0.1:8866 \
RAG_CAPTURE_BASE=http://127.0.0.1:8861 \
node scripts/capture-selected-depth.mjs
node scripts/update-content.mjs --selected-only
```

各地址只代表本轮本机服务；最终统一入口由集成服务提供。`PLAYWRIGHT_MODULE`可指向已安装Playwright入口，不要求重新装依赖。

## 已执行检查与边界

`test-selected-depth.mjs`通过：四方向顺序、四项明确地址、六套当前渲染、原Bundle模型、真实RAG条件结果、图片哈希、18项作品、所有履历数据及受保护HTML／动效文件、增量生成幂等。

Chrome实际检查通过：[browser-results.json](verification/selected-depth-20261109/browser-results.json)。四个短互动都可操作、不产生写请求、不写偏好；1280／768／390宽度、四种主题与四方向无横向溢出；键盘、减少动态效果、无JS默认内容与全部工具／案例地址通过。实际截图已打开：[桌面](verification/selected-depth-20261109/selected-1280.png)／[平板](verification/selected-depth-20261109/selected-768.png)／[手机](verification/selected-depth-20261109/selected-390.png)。这些只验收首页短互动，不能代替四个完整工具的独立验收。

**旧版与本批检查必须分开。** 原 `test-four-selected.mjs`、`test-personal-art-direction.mjs`、`verify-four-selected-browser.mjs` 等文件保留，没有删断言或改成虚假通过。它们硬编码“第四项是通勤”的旧需求，与本批明确改为RAG的PRD冲突，适用于冻结旧基线，不能声称它们在新版原样全部通过。本批使用新增检查验证新顺序，并另行断言旧通勤入口、其他作品、履历和视觉没有被破坏。

没有调用模型、付费服务、真人研究或生产经营数据。未把自动化检查写成有效任务完成率、模型能力或业务提升；完整工具的最终构建及公开发布还需统一集成审阅。

## English

The current website shell is preserved. Four selected tools now follow the approved Eval/Taste/Bundle/RAG order, with direction-specific ordering, real isolated short interactions, updated descriptions, owned case studies and actual current UI captures. Commute and all18 works remain. Scoped generation is repeatable and does not rebuild the site from an old revision. New checks cover the changed requirement; older scripts hardcoding Commute remain unchanged and must not be reported as passing the new RAG selection. This is local integration only, without model calls or publication.
