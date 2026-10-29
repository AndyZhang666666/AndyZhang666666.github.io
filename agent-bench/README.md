# Agent 执行评测台

Agent 说“完成了”，不代表工单真的改对了。这个小项目把**工具请求、SQLite 最终状态、故障恢复**放在同一次运行中核对。

[公开体验](https://andyzhang666666.github.io/agent-bench/) · [PRD](docs/PRD.md) · [交互与恢复约定](docs/INTERACTION.md) · [测试报告](docs/TEST-REPORT.md)

公开页面默认是**原创程序策略示例**，无需密钥。它不是实时 AI，也不是模型成绩。一个虚构工单 T102，三个工具，十个案例；不连接企业系统，不外发消息。

## 本地启动

需要 Python 3.9+，后端没有第三方运行依赖。

```sh
cd agent-bench
python3 backend/server.py --port 8877
# 打开 http://127.0.0.1:8877/agent-bench/
```

展开“技术详情与运行边界”，选择“本地程序测试”。两版分别创建隔离工单，真实写入专用 SQLite。核对工单号、处理组、跟进内容及版本后确认；超时后可查询原操作恢复；刷新后点击“恢复上次本地运行”。取消只停止后续步骤，不撤销已提交的效果。

数据默认保存在 `agent-bench/.local/bench.sqlite3`，已忽略，不进入 Git。可通过 `--db /path/to/new.sqlite3` 使用另一个专用数据库。服务仅绑定 127.0.0.1；不要开放到公网。

## 四个可见来源

| 标注 | 工具 / 数据 | 模型 | 证据边界 |
|---|---|---|---|
| 示例演示 | 播放仓库已有记录，不再写入 | 无 | 原创确定性程序执行 SQLite 后生成；不计入模型评测 |
| 本地程序测试 | API 当场执行，SQLite 持久化 | 无 | 检验代码、工具和恢复机制，不代表模型表现 |
| 真实模型运行 | 本地 API 调用模型选择工具并实际执行 | 需本项目配置 | 当前没有配置，未做真实模型联调或评测 |
| 真实记录回放 | 导入模型运行 JSON，只读播放 | 不调用 | 保留文件中的模型、时间与版本；未提供签名认证，不能仅凭标签证明来源 |

程序记录回放仍标注为程序记录。浏览器导入不上传文件；对 JSON 的格式检查不等于真实性认证。

## 可选模型配置

只从启动进程读取 `BENCH_MODEL_URL`、`BENCH_MODEL_NAME`、`BENCH_MODEL_KEY`，见 [.env.example](.env.example)。URL 是完整的 Chat Completions 工具调用接口，HTTPS 必须有效；仅 loopback 测试允许 HTTP。没有默认服务商，没有自动读取 `.env`、其他项目凭据、浏览器认证或 Codex 登录。

在自己的启动终端配置获授权的模型后重启服务，按钮才启用。两版共用同一客户端、模型名称、任务、初始工单、故障、工具和鉴权；仅系统策略提示不同。每轮一个工具调用，最多 12 次模型调用、每次 25 秒，输出上限 800 tokens；每服务会话最多 200 次模型步骤。模型请求失败、格式错误与未知结果保留在任务分母。调用会消耗你所配置模型的额度，本仓库未执行真实模型调用。

适配器只保留工具请求、工具结果和结构化最终回复，丢弃服务商的隐藏推理字段；密钥只在服务端请求头使用。适配器已通过本地假服务和动态工具桩测试，**尚不等于某个真实服务商已兼容**。

## 实现与取舍

`原生前端 → 本地 HTTP API → 执行器 / 模型适配层 → 3 个工具 → SQLite → 状态与事件判分`

- `query_ticket`：查询工单与当前身份权限；故障注入可短暂或持续不可用。
- `submit_change`：处理组与记录一起事务提交。服务端核查身份、参数、审批摘要、当前版本、稳定操作标识。相同标识和参数返回原回执；不同参数拒绝。取消后不接受后续写入。
- `operation_status`：按原标识查询持久化回执，作用域仅限本次运行。

基础程序策略直接执行，遇错停止并报告；加固策略先核权限、有限重试、核实未知结果、版本冲突后重新确认。两版正常和重复投递案例都能通过；服务端安全检查始终相同，没有为了比较而关闭鉴权。程序案例对照不是模型提升实验。

SQLite 的 `BEGIN IMMEDIATE` 将工单更新、操作回执、事件和运行游标放在同一事务。运行创建使用请求标识幂等；写入使用操作标识幂等。确认绑定全部变更参数和版本，不通过换标识盲重试。模型网络调用在事务外进行，取消可在等待期间生效；持久化租约阻止并发模型步骤，异常租约 35 秒后可重试。

接口用独立的 HttpOnly / SameSite=Strict 会话 cookie 隔离记录，校验 Host、Origin、JSON 和同源自定义头，不开放 CORS。每会话每分钟 120 次请求、最多 2000 条运行、8 KB 请求体。身份由服务端案例决定，前端不能传入管理员角色。这里只是单人 loopback 沙盒，没有公网账号、TLS 终止或多租户系统。

## 接口

先 `GET /api/config` 建立本地会话。变更接口须带 `Content-Type: application/json` 与 `X-Bench-Request: 1`。

| 方法与路径 | 请求 / 行为 |
|---|---|
| `POST /api/pairs` | `{case_id, request_id, mode:"program"或"model"}`；返回两次隔离运行，相同请求重复创建返回原记录 |
| `GET /api/runs/:id` | 状态、当前工单、事件、操作和判分；校验会话归属 |
| `POST /api/runs/:id/step` | `{}`；执行一个有上限的步骤，模型自行选择工具 |
| `POST /api/runs/:id/confirm` | `{digest}`；页面返回的具体参数摘要，过期批准返回冲突 |
| `POST /api/runs/:id/cancel` | `{}`；只停止后续步骤，不承诺撤销 |
| `POST /api/runs/:id/recover` | `{}`；查询原操作，再决定是否需要继续 |
| `GET /api/runs/:id/export` | 只读导出；无 cookie、密钥、完整提示 transcript 或隐藏推理 |

状态：`running`、`awaiting_confirmation`、`succeeded`、`failed`、`denied`、`needs_input`、`unknown`、`cancelled`、`conflict`。`succeeded` 是执行器或模型的结束声明；评测仍检查最终数据，模型谎报不会通过。

## 测试和重算

从 `agent-bench/` 目录执行：

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 backend/cli.py rescore path/to/exported-run.json
python3 backend/cli.py examples
```

后一个命令重新执行原创程序案例并生成 `samples/examples.json`；操作标识和实际时间每次不同，不伪造为模型留档。`grade()` 是独立纯函数，可离线重算，版本为 `state-events-v1`。

浏览器测试使用 Python Playwright 与独立 headless Chrome，不使用个人浏览器登录。开发依赖锁定在 `requirements-dev.lock`：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.lock
# 已安装 Google Chrome：
python3 backend/server.py --port 8878
# 另一终端：
.venv/bin/python tests/browser.py --local --out test-artifacts
```

Windows 使用 `.venv\Scripts\python.exe`。本次实测环境是 macOS + Python 3.9 + headless Chrome；未做 Windows 实机验收。浏览器脚本支持 `--base` 对公开静态站验收（不传 `--local`）。

## 指标与限制

每条记录保留任务分母、实际完成数、符合案例预期数、运行失败、越权尝试与实际写入、重复写入、人工接管、工具/模型调用数。持续故障被正确停止，可以“符合案例预期”，但实际完成数仍为 0。用量缺失为 `null` / 未知。总经过时间包含人工等待，示例播放速度不代表真实耗时。

当前缺失：获授权的本项目模型配置、真实模型运行记录、安全公网后端托管。GitHub Pages 只发布静态页面，公开没有实时 AI，没有付费服务，没有生产可靠性或用户研究结论。运行导出来自原创工单，不含真实企业资料；导入的记录可信度由来源负责。本版本不是通用工作流平台。
