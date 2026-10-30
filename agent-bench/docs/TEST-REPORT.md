# 验收记录

> 首发版本记录。2026-10-30 的逐步回放升级与验收见 [GUIDED-REPLAY.md](GUIDED-REPLAY.md)。


日期：2026-10-29（Asia/Shanghai）。环境：macOS、Python 3.9.6、独立 headless Google Chrome、Python Playwright 1.55.0。所有数据均为原创虚构工单；真实模型调用 0 次。

## 后端：29 / 29 通过

实际命令：`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s agent-bench/tests -p 'test_*.py' -v`。本次耗时约 4 秒。测试文件：[test_backend.py](../tests/test_backend.py)。

- 工具、规则与持久化：十个案例 × 两种策略；独立工单；参数缺失/类型/长度/非法组；只读身份；批准后权限撤销；审批参数篡改；版本变化后旧批准失效与重新批准。
- 幂等与恢复：6 个并发重复建单请求返回同一对运行；6 个并发执行步骤只写一次；重复投递返回原回执；同操作标识不同参数拒绝；换新标识拒绝；数据库提交后超时与执行器中断后重建 Store 恢复，最多一条记录。
- 取消：提交前无业务效果；提交后停止后续步骤并保留已发生效果；模型网络等待期间取消，后续工具不执行。
- API：真实 loopback HTTP 请求、会话归属、跨站 Origin/Host/同源头校验、请求参数、模式配置、私有路径拒绝；重复 GET/导出不增加写入；实际关闭并重启 API 进程对象后，原会话可读取未知结果并查询原操作恢复。
- 模型适配：动态工具桩确实调用查询和变更工具、暂停等待人工审批；本地 HTTP 假服务验证工具 schema 和用量；丢弃隐藏推理字段；谎报完成无法通过数据库判分；模型失败及调用上限持久化。
- 判分：导出后纯函数重算；篡改最终记录数或内容会失败；未知结果保留在分母；持续故障被正确停止不会被计为“实际完成任务”；部分模型调用缺失用量时，总用量保持未知，逐次已知用量另行保留。

这些是程序和接口测试，**不是模型评测成绩**。工具桩、假服务也不计为真实 AI。

## 浏览器：16 项检查通过

使用已装 `webapp-testing` 的 `with_server.py` 管理实际 API 进程；脚本为 [browser.py](../tests/browser.py)。

实际执行：十个公开示例；键盘运行；原生判据展开；原操作查询事件可查；JSON 导出/导入不触发 POST；无效文件可恢复；390/768/1280px 无横向溢出；暂停继续；本地正常审批与 SQLite 写入；超时恢复；重复投递；版本冲突重新确认；写前取消；刷新恢复中断；手机审批；API 中断保留运行并不降级伪装成示例；无 JavaScript pageerror。脚本把相关断言分为 16 项记录在 [browser-results.json](../screenshots/browser-results.json)。

截图已逐张实际查看：[桌面](../screenshots/desktop.png)、[手机](../screenshots/mobile.png)、[桌面审批](../screenshots/desktop-approval.png)、[手机审批](../screenshots/mobile-approval.png)。截图发现并修复了“待确认被错误说明为回执未知”和提前显示终态判分；换案例时清除旧导入状态。

## 静态模式、官网接入和线上

静态预览与线上验证的最终结果见 [RELEASE.md](RELEASE.md)。官网接入只增量加入项目卡、data.json 对应条目、Pages 排除项及本项目 CI；对原官网 HTML 移除新增卡后逐字相等，原有所有 data.json 字段和项目逐项相等（2026-10-29 接入时远端 main 为 `35ea8dab812227a2a68f6c5a793198f773f2ced3`）。

独立离线重算：`python3 agent-bench/backend/cli.py rescore agent-bench/samples/timeout-hardened.json` → `passed: true`，判分版本 `state-events-v1`。

## 界面复核与限制

按 impeccable 流程实际运行静态检测，得到两条 warning：暖纸色为继承现有官网；initial 的边线/padding 提示经截图核查，桌面有 25px 内距，手机边线已移除。独立 finish review 记录在 [FINISH-REVIEW.md](FINISH-REVIEW.md)。

没有真实模型配置、没有真实模型留档、没有安全公网 API 托管。没有 Windows 实机测试、辅助技术完整矩阵或访客研究；不能据此声称 WCAG 全面合规、生产级可靠或模型能力提升。公开页面默认仅演示，不会将后台不可用冒充当场模型运行。
