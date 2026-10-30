# Release evidence

> 首发版本记录。2026-10-30 的逐步回放升级与验收见 [GUIDED-REPLAY.md](GUIDED-REPLAY.md)。


2026-10-29，Asia/Shanghai。推送、接入主分支、部署和线上交互分别核实。

| 阶段 | 结果与证据 |
|---|---|
| 本地完成 | 原生前端、Python API/SQLite、十案例、三个工具、模型适配、审批/去重/恢复、导出和离线重算 |
| 本地程序测试 | 29/29 通过；真实模型调用 0。包括实际关闭并重建 API 服务后原会话恢复未知提交 |
| 本地浏览器 | API 模式 16 项通过；纯静态模式及官网入口 9 项通过 |
| 界面复核 | 独立 impeccable reviewer: ship；实际查看桌面和手机截图 |
| 已推送 | 功能分支 feat/agent-bench，正常 push；发布时远端 SHA 与本地 1a786531586fc078d424a662cbf319bf20bc9ff5 一致 |
| 已接入 main | 35ea8da → 1a78653 非强制快进；发布前 fetch origin/main，没有覆盖任何并行内容 |
| 已部署 | Pages run 40795265479，head 1a786531586fc078d424a662cbf319bf20bc9ff5，completed / success |
| 线上验证 | /agent-bench/ HTTP 200；真实 Chrome 9 项通过，包括十案例、键盘、判据、只读导入/导出、390/768/1280px 和官网入口 |
| 线上内容一致 | index.html、app.js、style.css、examples.json、desktop.png 的 SHA-256 与本地逐字节一致 |
| 发布边界 | docs/SURFACE.md 与 backend/server.py 在 Pages 返回 404；后端源码仍在 GitHub 可复现 |

体验：[Agent 执行评测台](https://andyzhang666666.github.io/agent-bench/)

源码：[agent-bench](https://github.com/AndyZhang666666/AndyZhang666666.github.io/tree/main/agent-bench)

部署：[Pages run](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40795265479)

CI：[发布提交的 Agent Bench checks](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40795265944)，Ubuntu + Python 3.11，backend / offline rescore / JS syntax 步骤均 success。

主要提交：bfa270c（范围与恢复约定）、28ceff1（真实后端与模型工具适配）、ef44f08（公开示例与本地审批界面）、ed17cbb（测试与截图）、bffc549（官网入口与 CI）、1a78653（未知用量处理与界面系统记录）。均为真实开发阶段提交，无空提交、强推或历史改写。

创建 PR 曾被 GitHub 连接器以 403 Resource not accessible by integration 拒绝，未创建 PR、未声称 PR 已合并。随后使用已获授权的正常 Git 快进推送接入 main。此文件及最终测试证据随后通过增量提交补齐；没有更改已验证的公开前端。

线上浏览器原始检查清单：[online-browser-results.json](online-browser-results.json)。本地静态检查：[static-browser-results.json](static-browser-results.json)。

限制：公开为原创程序策略示例，非实时 AI。获授权的本项目模型配置、真实模型记录和安全公网 API 托管均未提供；实际模型联调和线上真实 AI 未验证。未购买服务或读取其他项目密钥。该明确缺失项不以程序测试代替。
