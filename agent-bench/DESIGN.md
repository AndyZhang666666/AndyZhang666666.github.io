---
name: Agent 执行评测台
description: 继承个人官网视觉的工单执行比较工作表
colors:
  paper: "#f5f2eb"
  surface: "#fcfbf7"
  ink: "#252722"
  muted: "#62645b"
  line: "#d7d7cc"
  accent: "#b23e24"
  good: "#276747"
  bad: "#a33d29"
  tint: "#e8eee6"
  white: "#fff"
  control-border: "#9c9f91"
  control-hover: "#e6e6dd"
  accent-hover: "#8e301a"
  raw-surface: "#f1f1e9"
  error-surface: "#f6e5dc"
  error-ink: "#7f2b1a"
typography:
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.5
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
  raw:
    fontFamily: 'ui-monospace, "SFMono-Regular", monospace'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "6px"
  result: "12px"
spacing:
  action-gap: "8px"
  control-gap: "12px"
  column-gap: "20px"
  section: "24px"
  desktop-gutter: "32px"
  task-gap: "36px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.control-hover}"
  case-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
    width: "100%"
  result-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.result}"
    padding: "23px"
  approval-panel:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px"
  raw-record:
    backgroundColor: "{colors.raw-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.raw}"
    rounded: "{rounded.control}"
    padding: "12px"
---

# Design System: Agent 执行评测台

## Overview

**Creative North Star: "比较工作表"**

这是现有个人官网内的 Operate 屏，沿用暖纸、墨色和克制的锈色操作。记录范围仅为 `/agent-bench/`；不替换官网身份，也不把本页的执行流程提升为所有页面的组成规则。方向来源是已确认的 `docs/SURFACE.md`；以下数值和状态来自实际 HTML、CSS、JavaScript，截图用于核对其落地。

整体密度接近一张可操作的比较工作表。表单、字段、细分隔线和并排结果承担信息组织；解释与技术记录通过原生 disclosure 展开。不存在另行批准的视觉 comp。

**Key Characteristics:**
- 暖纸页面与略亮的结果面板，墨色文字、细边线。
- 使用继承的系统 UI 字体；标题紧凑，字段值优先于辅助说明。
- 动作、结果状态和待确认区域有各自明确的色彩用途。
- 桌面并排、手机纵排；键盘焦点与可读状态文字直接可见。

## Colors

暖色中性底承载内容，锈色用于操作，绿色和红褐色补充结果语义。规范值见 frontmatter。

### Primary
- **锈色动作（accent）**：观看、确认和恢复操作的填充；也用于焦点外框与最后一条事件圆点。主操作悬停使用 accent-hover。

### Secondary
- **结果绿（good）**：通过状态、通过判据，以及已改变的处理组和新增记录字段。
- **结果红褐（bad）**：失败、结果未知或版本冲突的结束状态，以及未通过判据。错误提示使用独立的 error-surface 与 error-ink。
- **确认浅绿（tint）**：承载待确认参数和确认/取消按钮；不代替状态文字。

### Neutral
- **暖纸（paper）**：页面底色。
- **浅纸面（surface）**：结果容器、原生表单控件与普通按钮。
- **墨色（ink）**：正文、任务和字段值；**辅助墨色（muted）**：策略、来源解释和元信息。
- **分隔线（line）**：任务区域、结果容器与 disclosure 的边界。
- **控件边线（control-border）** 比一般分隔线更深；control-hover 提供普通按钮悬停反馈。
- **白色（white）** 用作锈色按钮文字；raw-surface 用于展开后的原始记录。

**The 文字伴随状态 Rule.** 状态始终保留“已完成”“结果未知”“通过”等文本；颜色是附加编码。

## Typography

**Body Font:** 继承官网的系统 UI 字体栈，覆盖 macOS、中文和 Windows 回退。
**Label/Mono Font:** 仅原始 JSON 记录使用系统等宽栈。

**Character:** 同一 UI 字体组织标题、正文和操作；通过字号、字重与留白区分层级。没有独立的装饰性 display 字体。

### Hierarchy
- **Headline**：页面标题使用 headline；手机降为（24px），保持紧行高与负字距。
- **Title**：区段标题使用 title；结果卡标题为（16px），普通三级标题为（15px）。
- **Body**：正文使用 body；任务文本为（18px），手机为（16px），最长（42em）。开场说明为（16px），手机为（14px）。
- **Label**：来源与策略、事件、字段名和元信息通常为 label；表单标签、disclosure 和判据正文为（13px）。结果状态为（12px、600）；按钮为（550）。
- **Numeric data**：工单字段值为（18px），数字使用 tabular-nums；正文总结为（14px）。
- **Raw**：原始记录使用 raw，保留换行并允许长串断行。

## Layout

页头、主内容和页脚共享居中容器（max-width: 1120px，包含左右内边距）。桌面左右内边距由 desktop-gutter 定义。任务区使用弹性主列加固定初始状态列（265px），列间距为 task-gap；初始状态列左侧有边线和（25px）内边距。两版结果等宽并排，间距为 column-gap。

信息密度以 action-gap、control-gap、column-gap、section 为常用步长，另有源代码实际采用的局部间距；这些值不构成等比通用间距系统。结果卡桌面内边距为（23px），手机为（20px）。任务区上下内边距为（24px），手机为（20px）。判定解释最长（75ch），技术正文最长（82ch）。

唯一宽度断点为（max-width: 700px）：容器左右内边距降为（20px）；任务和结果改为单列，结果间距（14px）；初始状态移除边线并允许换行；来源辅助说明独占一行；策略说明改为单列；页脚改为纵排。案例选择与按钮允许换行，选择字段不保留桌面（260px）的最小宽度。站标的“作品实验”后缀隐藏。

## Elevation & Depth

界面没有 box-shadow。层次来自纸面色差、细边线与内边距；确认参数使用浅绿底嵌入结果卡，不浮出为遮罩或弹窗。键盘焦点为锈色实线外框（3px，offset 4px），不把它解释为阴影层级。

**The 平面工作表 Rule.** 已建成的容器用色面和边线区分层次；后续局部扩展沿用此机制。

## Shapes

结果卡使用 result 圆角；按钮、选择框、确认区、原始记录和错误提示使用 control 圆角。边框通常为（1px solid），任务与技术区以横向分隔线连接文档流。事件标记为小圆点；没有装饰性异形裁切。

## Components

### Buttons

紧凑、实心的主动作配浅纸面次动作。常规按钮最小高度（46px），确认区动作最小高度（44px，8px 12px padding）；手机顶层按钮改为（9px 13px padding）。主次色与圆角见 frontmatter。

悬停使用各自的 hover 颜色；背景过渡为（.15s ease-out）。按下移动（translateY(1px)）。禁用控件透明度（.5），cursor 为 not-allowed；禁用项没有悬停填充变化。导出按钮为下划线文字、透明背景、无边框，保留全局焦点外框。

### Inputs / Fields

案例选择使用原生 select，带可见 label，与按钮共享边线、圆角和最小高度；没有另造菜单弹层。读取案例前禁用，播放或本地操作期间禁用切换。文件导入使用原生 file input，最小高度（44px），最大宽度不超过容器。所有可聚焦元素共用显式焦点外框。

### Cards / Containers

结果卡使用 frontmatter 的 result-card。顶部策略名与状态同行，下一行说明策略，再展示三列工单数据。卡内 summary 为（14px）；桌面空白总结保留（47px）最小高度，手机移除此限制。最近三条事件与可展开判据/工具轨迹在同一卡内，不叠加第二套阴影卡片。

### Approval / Recovery

待确认时展示 approval-panel，列出工单、版本、目标组、记录内容和保持打开的约束，随后提供确认与取消。结果未知时在同一结果区显示“查询原操作并恢复”和停止操作。正在执行时显示停止操作。确认与恢复控件直接位于结果区，技术 disclosure 不包裹它们。

### Status / Timeline

已完成且符合判据的结束状态使用结果绿；失败、未知或版本冲突的结束状态使用结果红褐；等待、播放、执行和待确认等状态保留墨色。判据本身同时呈现文字和通过/未通过颜色。已改变字段的绿色表示数据变化，不能单独推导运行通过。

事件列表以小圆点与缩进排列，最后一项变为墨色文字和锈色圆点，其余为辅助墨色。圆点是 CSS 几何标记；不以符号字体制作通用图标。

### Disclosure / Records

原生 details / summary 承担逐项判据、工具轨迹与技术说明的展开；summary 最小高度（44px），保留浏览器三角标记。raw-record 最大高度（300px）并在内部滚动，长文本可断行；运行 ID 与元信息同样允许断行。

### Navigation

页头以站标与源码链接分列，文字为（14px），站标字重（650）、后缀为常规辅助墨色；页脚以说明和返回链接分列，手机纵排。跳转评测台链接平时位于可视区上方，聚焦后出现在顶部（12px）。没有额外的选中导航或移动抽屉状态。

### Errors / Loading / Motion

案例加载时显示读取文字并禁用控件；读取失败时展示错误色面、明确错误文字与重新加载按钮。结果卡起始显示等待观看和空白数据说明。状态与判定通过 live region 更新，错误通过 alert 公开。

示例逐事件播放间隔为（320ms），导入回放为（200ms）；本地执行刷新间隔为（120ms）。这属于执行反馈节奏，不是装饰动效。prefers-reduced-motion 时取消 CSS transition，回放立即完成；没有进场动画或循环装饰。

## Do's and Don'ts

### Do:
- **Do** 在此 app 扩展中继承暖纸、墨色与锈色动作；从 frontmatter 读取规范值。
- **Do** 为状态、变化字段和判据保留可读文字，并沿用现有语义色的具体用途。
- **Do** 在窄屏保持完整单列内容、可换行操作与明确焦点。
- **Do** 保留原生表单、disclosure 与文件选择行为；将可执行确认和恢复放在结果区。

### Don't:
- **Don't** 用结果绿色将“数据改变”自动表述为“运行通过”。
- **Don't** 把本页的任务、两版策略或工单组成规定为官网其他页面的全局模板。
- **Don't** 将没有出现在此实现里的阴影、图像装饰、图表或新字体当作既有系统。

记录边界：未把整站源码链接所带的箭头字符提升为可复用 glyph 图标系统；未新增或修复视觉缺陷。独立 finish review 判定 ship，无 material fixes；本文件不宣称完整 WCAG 认证。
