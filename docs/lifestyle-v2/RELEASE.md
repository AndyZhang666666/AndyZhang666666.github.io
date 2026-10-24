# 两个生活 Demo · 第二轮交付

2026-10-24。保留原官网，完成两项目的产品闭环、UI/UX、文档与真实分阶段 GitHub 同步。

## 成品

- [随便局](https://andyzhang666666.github.io/suibianju/) · [源码与说明](../../suibianju/README.md)：自愿建议 → 草稿预演 → 本人确认 → 3–5 位模拟成员同版接受 → 公共决定单。
- [偏爱实验室](https://andyzhang666666.github.io/tasteroom/) · [源码与说明](../../tasteroom/README.md)：整图线索 → 单变量对照 → 明确授权范围 → 场景/内容验证 → 偏好说明书与 SVG。
- [个人官网](https://andyzhang666666.github.io/) 已更新已有两张卡片，无重复添加；[GitHub 个人主页](https://github.com/AndyZhang666666) 已补充中英文项目说明。

## 真实提交轨迹

| 阶段 | 提交 |
|---|---|
| 问题判断、范围、状态与完成门槛 | `48bbec5` |
| 随便局的协商、预演、共同决定闭环 | `b78b508` |
| 偏爱实验室的对照、授权与导出 | `4aa70a9` |
| 官网卡片、版本化资源和可复跑验收 | `c2d36b4` |
| GitHub 个人主页中英文说明（profile 仓库） | `302abb1` |
| 线上复验文档 | 本文件所在的后续文档提交 |

正常提交、正常推送，没有强推、倒填日期、假开发活动或假产品指标。两个项目沿用官网仓库下 `suibianju/` 与 `tasteroom/`，没有再造重复仓库。

## 验证结果

- Node 内置测试：**53/53**，随便局 28 项、偏爱实验室 25 项；其中原 34 项均保留。
- 本地与真实线上均通过四套 Chrome 流程：随便局原回归、偏爱实验室原回归、两项目第二轮端到端、官网入口/语言/主题回归。
- 新增闭环实际检查草稿/预演零已确认副作用、过期建议/对照拒绝、三人及五人共同决定、都不选、记忆操作撤回、刷新恢复、仅本次失效与 TXT/Markdown/SVG 文件下载。
- 1440/768/390/360px 无页面横向溢出；没有页面脚本异常。随便局体验页没有外部网络请求；偏爱实验室为 mock。
- 最终冷启动设计检查：随便局 0 FAIL / 0 WARN，偏爱实验室 0 FAIL / 1 WARN。保留的提醒是书刊卡片内部“留白”本身；并非被拉伸的辅助栏。源码 lint 0 FAIL / 0 WARN。实际查看桌面、平板、手机、运行态与导出；详见 [视觉复查](DESIGN-REVIEW.md)。
- 功能与官网发布 SHA `c2d36b45975dd06dc2d63777f73d4bea6fef5fb6` 的 [GitHub Pages 工作流](https://github.com/AndyZhang666666/AndyZhang666666.github.io/actions/runs/40072182590) completed / success。线上文件返回 200 并核对本地；官网仍为 15 个项目。
- 与起点 `789f016` 的解析后 JSON 对比：仅两项目记录有变化，其他项目及学历、履历、个人信息等字段完全相同。

## 复跑

在根目录用任意静态 HTTP 服务运行；项目本身不需要安装依赖：

```sh
node --test suibianju/tests/*.test.mjs tasteroom/tests/*.test.mjs
BASE_URL=http://127.0.0.1:8803 CHROME_CHANNEL=chrome node docs/lifestyle-v2/test-upgrades.mjs
```

浏览器脚本需要 Playwright 和 Chrome。`PLAYWRIGHT_MODULE` 可指向已有包的 `index.mjs`，无需重复安装；`EVIDENCE_DIR` 可指定绝对截图/下载目录。线上复验将 `BASE_URL` 改为官网地址。测试只使用隔离浏览器中的虚构本地数据，不更改线上源文件、不发送消息或下单。

## 明确边界

这是免 Key、能完整体验的作品版本，不是已商用服务。随便局没有真实多用户、权限后端、邀请、商家搜索和订位；偏爱实验室没有真实模型、生图和统计偏好学习。没有真人使用收益、满意度、留存或准确率数据。未做完整 WCAG、Lighthouse、全浏览器或高并发认证；不宣称设计获奖或主观“绝对完美”。
