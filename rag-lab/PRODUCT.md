# 可信 RAG 实验台
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
沿用已核实官网的原生 HTML/CSS/ES modules，Node 22+ 标准库 API。无构建依赖、无外部数据库。

## Users
官网访客、面试官；以一分钟「选问题—看回答—打开依据—改条件重跑」为体验目标，尚无真人可用性研究。

## Product Purpose
展示答案来源、可用范围、生效时间以及无法回答的原因。只读问答，不执行借用或审批。

## Capabilities and Constraints
依据用户提供的 2026-10-28 PRD：原创虚构设备规则，真实文本检索；服务端在召回之前限定角色、日期和快照；引用定位与关键事实分开检查。静态官网免 Key 使用原创示例；本地 API 提供真实检索和可配置的模型调用。无安全托管配置，不部署在线 API。不接入生产身份、真实公司资料、上传、PDF、多 Agent 或旧项目。

## Evidence on Hand
原始 PRD 位于 docs/PRD.md。官网来源为 AndyZhang666666/AndyZhang666666.github.io 的 main；本项目独立 clone、功能分支。未发现适用 AGENTS.md。未配置本项目模型，真实生成待验证。

## Accessibility & Inclusion
操作有显式标签，键盘可达、焦点可见；窄屏先回答后来源，保持输入与查询条件；不单靠颜色表达状态。
