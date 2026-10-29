# 交付与部署记录

2026-10-29（Asia/Shanghai）实际交付。

[体验地址](https://andyzhang666666.github.io/rag-lab/) · [源码](https://github.com/AndyZhang666666/AndyZhang666666.github.io/tree/main/rag-lab) · [完整测试报告](TEST-REPORT.md)

## 分阶段状态

| 阶段 | 实际状态与证据 |
|---|---|
| 本地运行 | 已验证：34 项单测/真实 HTTP API/增量接入检查，25 项 RAG Chrome 操作，12 项既有官网及 Agent Bench 回归 |
| 功能分支推送 | `feat/trustworthy-rag-lab` 正常推送，功能版本 `604ec879894c56cb53c8f2c5f9f37c869fb166bc`；[分支 CI 成功](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40827204533) |
| 主分支接入 | fetch 最新远端后，正常快进 `main` 至同一功能版本；没有强推 |
| GitHub CI | [主分支 RAG Lab checks 成功](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40827382206)，执行实际 HTTP 权限与固定题检查，不调用模型 |
| Pages 部署 | [pages build and deployment 成功](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40827382069)，部署 ID `7405385098`，对应功能 SHA `604ec87` |
| 线上验收 | 13 项真实 Chrome 检查通过、0 个页面脚本异常；[原始记录](../evidence/online-browser-results.json)、[桌面](../evidence/online-desktop.png)、[手机](../evidence/online-mobile.png) |
| 真实模型联调 | 待验证：本项目没有模型配置，没有冒充真实生成的记录 |

[发布 API 原始证据](../evidence/deployment-functional.json) 将源代码推送、主分支、GitHub 检查、Pages 部署分别记录。后续交付证据提交只补充验收脚本、报告和截图，不改变已验收的四个核心前端资源；其字节 SHA-256 在线上记录内。

## 主要真实提交

| 提交 | 内容 |
|---|---|
| `a2f1ebf` | 完整批准 PRD、产品约定与交互边界 |
| `2a09429` | 14 份原创资料、真实 BM25、服务端权限/版本/模型适配器与测试 |
| `1804f79` | 回答优先界面、来源定位、条件切换与运行历史 |
| `c5a7019` | 实际查看手机截图后压缩查询流程、失败恢复检查 |
| `1c3e289` | 增量作品入口和 Pages 发布范围 |
| `88ed3e3` | 合并并保留另一位 Agent 的 Agent Bench |
| `3f89357` | 保护生成器中的并行项目、自定义卡片；合并后回归 |
| `604ec87` | 最终功能检查输出，对应首次成功部署与线上验收 |

这些是实际开发形成的提交，未改写日期，未用空提交造时间线。独立 clone 与功能分支开发；最终整合基线为 `b74a5e4db66bb84be23a51cf191dec6e74b58086`。Agent Bench 整个目录的 Git 树校验与该远端基线一致；其代码、测试、文档和工作流未被本任务改写。

## 运行边界与已知限制

官网是免 Key 的原创示例模式：浏览器真实文本检索与规则摘录，无模型调用、无在线 API，不是历史模型回放。本地 `node server/server.mjs` 可运行真实授权过滤与检索；Responses 模型适配器只在本项目配置完整时调用，不读取其他项目密钥。

公开包不含管理原文，线上已检查后端、原始 corpus、测试、管理运行记录等路径返回 404。GitHub 源码仍公开包含虚构测试资料，不是机密存储或生产鉴权。管理员下拉框不代替服务端独立会话。

仅覆盖虚构设备规则及少量固定词汇；不宣称泛化准确率、真人可用性研究或真实模型抗注入效果。没有安全在线托管、生产账号/租户鉴权、向量检索、PDF、通用知识库后台或多 Agent。没有购买服务。
