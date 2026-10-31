# 四项精选：个人输入与可用交付

开发分支：`feat/usable-four-20261030`。四项完成后统一提供本地审阅；本轮不合并 main、不发布线上。

| 项目 | 实施范围 | 状态 |
| --- | --- | --- |
| 偏爱实验室 | 可编辑默认画布、单一工作区、临时试用、范围确认、SVG/PNG | 已完成 |
| Bundle Lab | 独立手动算例、现有两类人群模型、假设卡 | 已完成 |
| Eval Lab | 严格导入、证据复核工作区、Markdown 报告 | 已完成 |
| 通勤比较器 | 简化输入、增量比较、校准入口、独立决策快照 | 已完成 |
| 官网 | 四项入口、轻互动、真实截图、生成流程与对照 | 已完成 |

主要流程均免 Key、在浏览器运行；演示、外部导入、估算和个人记录保持独立来源说明。测试只覆盖受影响的计算、存储和实际使用路径。

## 本地审阅

- [统一总览与当前线上对照](http://127.0.0.1:8820/review.html?section=selected)
- [官网精选](http://127.0.0.1:8820/#selected)
- [Eval Lab](http://127.0.0.1:8820/llm-output-eval/)
- [偏爱实验室](http://127.0.0.1:8820/tasteroom/)
- [Bundle 推演](http://127.0.0.1:8820/bundle-lab/simulate/)
- [通勤比较器](http://127.0.0.1:8820/commute-compare/)

预览由本目录 `scripts/preview.mjs` 启动，默认8820端口，优先读取相邻 eval/bundle/commute 的 `out`。关闭进程后可运行 `node scripts/preview.mjs` 恢复。`review.html` 右侧直接加载当前线上，左侧为此开发分支。本地生成保留 noindex；确认发布时使用现有不带 `--local` 的生成命令。

## 四项如何完成自己的任务

**偏爱**：默认编辑标题、副文案与落款；比较与临时选中复用同一画布。导出无需记忆授权。保存前列明维度、场景、被替换旧规则，支持撤回。PNG为同一SVG渲染的900×1200图片，不附私人反馈。

**Bundle**：支持2–3件商品、原本买齐占比及未买齐消费基线。适配层转换人群均值后调用原计算函数。账本按100覆盖订单归一，手动模式不显示假样本量或共购排名。来源草稿独立、数字输入与滑杆配对，导出Markdown假设卡及JSON。

**Eval**：导入现有五维复核JSON，最大1MB。原文和完整原始结果的SHA-256用于独立标识；复核意见不参与材料标识，重复导入恢复本机意见。原分、评语和缺失引用均保留，格式/均分错误拒绝导入。一次复核一维，手机切面板保留维度；无Key不回退示例。支持JSON往返和Markdown报告。

**通勤**：常见耗时和费用先行，结果突出月费、节省小时及每省一小时的费用。可只校准一条路线，再选择并填写理由。独立快照绑定输入与模型版本；修改输入、理由未确认、输入无效或重算期间阻止导出旧结果。

## 官网与证据

默认顺序 Eval、偏爱、Bundle、通勤；方向切换只重排这四项。Agent、RAG、扑克和其余项目全部保留，共17项。Bundle 主入口为推演，订单分析作为次级入口。

首页只加载当前短互动。Eval 使用原历史引用，偏爱复用实际SVG渲染器，Bundle复用字节一致的计算模块；通勤由其源码的原模拟和增量比较函数生成只读投影。不存在另一套首页近似公式。首页不保存个人判断，也不暗示完整工具接续未支持的临时状态。

新版截图见 `assets/work/showcase/captures.json`，包含各自实际操作状态、时间、尺寸与文件哈希。所有照片来自真实产品界面；保留完整截图放大。通勤新增设计过程，其他三项补充可带走的产物说明。内容生成重复执行结果一致。

`data.json` 除本轮项目外的内容与3e544d9逐项一致；首屏、关于我、关于AI、经历和教育对应区块一致。原 `style.css`、原动效/背景及产品原则材质文件未变；新预览继续使用原玻璃、卡片偏移与四种主题。

## 验证

- 30项Taste核心、16项Bundle模型/适配、16项Eval核心/导入、9项通勤边界/决策检查通过。
- 实际浏览器完成四条任务路径；导出JSON/Markdown、PNG尺寸和原始评分往返均核对。
- 桌面1440、平板768、手机390无横向溢出；官网四种主题和四方向均检查，键盘与减少动态效果可用。
- 禁用本地存储时，四项仍能操作与导出；首页预览不改访客存储、不发写入请求。
- 自动界面检查发现的平板/手机小字与数字对齐已修。Bundle检查的 `edge-text` 是Recharts在 -20000px 的测量节点；实测可见轴标签距左774px，不是可见溢出，保留有依据的例外。独立工作面板高度不同属布局选择。
- 三个独立源码库均已通过开发分支GitHub检查；后续走查提交继续触发相同无部署检查。详见各分支Actions。

核心复核命令：

```sh
node scripts/test-four-selected.mjs
node --test tasteroom/tests/engine.test.mjs tasteroom/tests/experiments.test.mjs tasteroom/tests/directions.test.mjs tasteroom/tests/usable.test.mjs
```

## GitHub开发分支与真实步骤

- [官网与Taste](https://github.com/AndyZhang666666/AndyZhang666666.github.io/tree/feat/usable-four-20261030)：先提交海报任务，再提交精选、截图和生成整合；保留走查修正。
- [Bundle](https://github.com/AndyZhang666666/bundle-lab/tree/feat/usable-four-20261030)：b50f57e功能闭环，ded5a59数字对齐。
- [Eval](https://github.com/AndyZhang666666/llm-output-eval/tree/feat/usable-four-20261030)：ff21428导入/复核闭环，8e96acc实机可读性与来源说明。
- [通勤](https://github.com/AndyZhang666666/commute-compare/tree/feat/usable-four-20261030)：23b695a选择闭环，e2eb9fa未确认输入/理由与手机字号。

没有改写提交时间、伪造用户收益或模型验证，没有合并main或触发Pages部署。审阅通过后再按各仓库现有发布流程执行。
