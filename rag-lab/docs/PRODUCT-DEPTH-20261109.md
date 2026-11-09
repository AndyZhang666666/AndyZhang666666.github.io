# RAG：把资料变成可核对的答复

2026-11-09开发批次，未公开发布。本文说明当前实现与交互边界，不是生产效果或真人研究报告。原[PRD](PRD.md)、[测试报告](TEST-REPORT.md)、[交互约定](UX-CONTRACT.md)与历史证据保留原样，新增功能的具体证据见本批次报告和 `../evidence/product-depth-20261109/`。

## 1. 要完成的任务

示例路径：选一件事 → 补必要事实 → 找适用资料 → 核对答复和缺口 → 改条件重新查 → 编辑与导出。自己的资料路径：本机导入 → 检查提取文本与版本 → 提问检索 → 选择引文 → 人工组织草稿 → 导出或保存带来源备份。

系统不提交借用、续借、采购或审批。可形成申请草稿不等于已获批准。检索分数、引用匹配和规则检查也不是回答正确率。

## 2. 原题保留，任务单独扩展

原 `public-corpus.json` 的12份公开文档、`corpus/`的两份管理测试文档及旧 `tests/cases.json` 保持各自边界。`scripts/build-public.mjs`仍只生成员工可公开文档；不把管理原文塞进公开JSON。

`task-catalog.mjs`新增12份公开 `TASK-*` 原创补充资料和12项任务。任务把这些资料与原公开语料共同真实检索，未改旧固定语料来配合新功能；补充资料不含 `ADM-*`。所有机构、规则及流程均为虚构。

| 任务 | 需要检查的判断 |
|---|---|
| R01 当前借显示器 | 当前业务日期与原始快照的14天规则 |
| R02 回查历史 | 历史日期对应30天，旧版并非任何时候都不可用 |
| R03 改修订快照 | 10天示例来自对应快照，不改写旧运行 |
| R04 缺续借事实 | 追问领取／到期日期、已续借次数及预约状态 |
| R05 跨版本续借 | 区分原借用和新的续借申请，核对过渡条款 |
| R06 前提满足 | 可提出申请，仍需到期前办理及负责人确认 |
| R07 次数或预约不满足 | 指明当前缺口，保留用户原条件 |
| R08 归还事项 | 按业务日期核对办理地点、配件及登记 |
| R09 损坏与赔偿 | 流程有依据，金额无条款就保持未知 |
| R10 范围之外 | 公开资料不足，不泄露管理原文 |
| R11 同期冲突 | 保留双方差异，不任意挑一条 |
| R12 未覆盖设备 | 不套用相近设备规定 |

另有六个轻入口：借用时长、资料不足、权限限制、规则冲突、相似干扰、注入防御。具体遗失意图包含“丢了／弄丢”，不会因“多久”误答借期；计日方式从原自然日条款取证。它仍是受控设备规则词汇，不是任意语义问答。

## 3. 让范围和依据可见

条件包括示例身份、业务日期与快照；默认日期固定为2026-10-28，历史日期为2026-06-30。条件改变时，旧结果保留自己的日期、版本和引文，先标待重查，点击内联重查才替换。历史记录含简短问题标识，避免多个“资料不足”无法区分。

右侧同时显示采用的实际引文和未采用的相近资料：

- 当前角色可感知的同组旧版、未来生效或其他快照，解释版本／日期原因。
- 已实际召回但未支持本问的展期、留言注入或其他规则，注明为什么不作依据。
- 不把无权访问的管理标题或编号放进排除说明。公开身份下拉不能赋予服务端权限，公开构建不含管理原文。

桌面把条件、答复和来源并置，手机将次级场景入口折叠；当前问题和答复保持可达。保留象牙纸、墨色、朱红强调和等宽数字，短反馈服务于状态变化，不用假等待包装规则计算。

## 4. 个人资料与PDF

### 接受范围

TXT、Markdown和可提取文字的PDF；最多5份，单份2MB、原文件总计8MB、提取文本总计200,000字符。只读本机所选文件或粘贴文本，不接受远程URL、Word／Excel或爬取。

PDF由自托管 `pdfjs-dist@6.5.438` 解析。解析器、Worker、CMaps、标准字体均来自同一固定版本，Apache-2.0许可证和来源哈希随vendor保留，不依赖CDN。完整源码可直接运行；要重新生成资源才执行：

```sh
cd rag-lab
pnpm install --ignore-scripts
node scripts/vendor-pdf.mjs
```

中英文文字提取保留 `[Page N]` 定位；复杂版式的阅读顺序仍需人核对。每一页都检查是否有文字：全部无字则拒绝，部分页面无字会列出页号并保留不完整提示，不能当成完整资料。加密或损坏有专门说明，不索取密码、不破解、不做OCR；可先在本机处理再导入或粘贴文本。

### 确认与检索

文档展示标题、提取原文、制度组、版本、生效与失效日期。日期可未知，但未知不等于适用；文件修改时间不被补作制度日期。未确认元数据或提取缺页的资料仍可被找到，适用性保留待确认，不被已知版本悄悄覆盖掉。

用户逐条核对后，可允许使用受支持设备规则字段。任意其他条款继续作为原文，不自动泛化成可执行制度。查无依据、存在冲突或未知元数据时，答复保留缺口，不伪造确定结论。

## 5. 答复、存储和恢复

草稿由用户编辑；选择的原句单独作为证据。人工补写不因旁边有引用就被认证为有依据。资料、问题、日期或规则确认变化会使运行过期；旧草稿保留并提示核对，重新检索不会暗中验证其内容。导出与当前有效运行绑定，旧条件不能冒充当前产物；草稿沿用和未解决信息保留各自状态。

Markdown答复单与JSON记录包含问题、日期、来源清单、所选引文、草稿和待补事项，默认不附个人文档全文。只有明确勾选包含来源文本，JSON才包含资料与工作状态，能够用于恢复。备份最大10MB，先校验并展示将替换的资料与草稿数量，取消不变；确认后建立新工作区身份，清空旧有效运行，重新检索后才能导出当前答复。

IndexedDB保存当前工作区，最近检索依据保留有限条数。禁用存储或写入失败时可继续页内导入、检索与导出，刷新保留能力会降级。若旧值损坏，先锁自动写入并保留原值，提供原始值下载及明确重建；导入一个新工作区不自动解除旧存储写锁。移除已用资料、清空或替换工作区先说明影响，取消不改变当前工作。

个人资料不混入公开示例，不写入GitHub语料、图库或日志。API属于另一条显式本机接口契约，不代表浏览器个人工作区已经在线同步。

## 6. 本地API契约

以当前 [server/server.mjs](../server/server.mjs) 和 [server/workspaces.mjs](../server/workspaces.mjs) 为准。API仅本机监听，校验Host／Origin。能力和健康查询、员工会话创建不要求已有Bearer；其余接口使用本服务认可的临时员工或独立管理凭据。客户端不能指定角色／owner来扩大范围。

| 方法与路径 | 请求及行为 |
|---|---|
| `GET /api/capabilities` | version2；工作区、任务事实能力；模型配置与启用分开；publicModelService:false |
| `GET /api/health` | 本地服务、配置存在性，不返回密钥 |
| `POST /api/session` | 空对象，创建临时员工会话，不能指定身份 |
| `GET /api/whoami` | 服务端识别的当前角色 |
| `POST /api/run` | 原兼容入口：question、date、snapshot、generation |
| `POST /api/tasks/run` | taskId、facts、question、date、snapshot、generation；facts限borrowed／due／used／booking字符串，当前仅extractive |
| `GET /api/runs/:id/sources?chunkId=...` | 所属会话该次运行实际召回且仍可访问的段落 |
| `GET /api/runs/:id/export` | 所属会话运行的尽力脱敏记录，不导出凭据 |
| `POST /api/workspaces` | 空对象创建会话所属工作区，返回id和version1 |
| `POST /api/workspaces/:id/documents` | title、text及可选policy／version／effectiveFrom／effectiveTo／confirmed；提取文本，不接PDF二进制 |
| `POST /api/workspaces/:id/run` | question、date、confirmedRules、generation；当前只做extractive资料整理 |
| `PUT /api/workspaces/:id/draft` | runId、draft、notes、selected；须绑定当前有效运行，所选id只来自当次召回 |
| `GET /api/workspaces/:id/export` | 当前有效答复单；没有有效运行或条件不一致时不导出旧结果 |
| `DELETE /api/workspaces/:id` | 删除所属工作区 |

工作区ID不是授权。其他会话访问返回不可用，不泄露资料。会话、运行和API工作区都有数量与一小时时效限制，重启清空；浏览器文件限制不等于API允许二进制上传。默认普通JSON体4KiB，documents与draft接口分别有800,000和40,000字节上限；字段、字符、数量和限流还要通过各自验证。工作区最多每会话5个、进程100个。

真实模型默认禁用，客户端不能改变开关。模型配置来自本项目环境，未来明确启用还需 `ENABLE_MODEL_CALLS=1`；仅有Key不等于允许调用。任务和个人工作区当前不启用模型生成。原模型适配器保留超时、输出／响应限制和会话／进程预算；费用额度不是生产托管消费限额。未配置、未启用或失败会明确返回状态，不伪装成功、不自动换成“模型回答”。

## 7. 检查与交付边界

原12固定题、原断言、原14／30／10天和受限资料边界保持；补任务、文件、存储及API检查没有通过删旧用例来制造成功。Node、原浏览器脚本和本轮真实浏览器、PDF及恢复路径的具体证据见批次报告，不在文档中抢先填写仍在汇总的数量。

本轮实际浏览器脚本为 `tests/product-browser.mjs`，旧 `tests/browser.py`和历史记录保留。检查使用原创虚构资料及合成协议返回，不算真实模型记录。自动化通过也不是真人任务完成率或正式安全、无障碍、生产效果认证。

本地主要命令：

```sh
node server/server.mjs
node scripts/build-public.mjs
node --test tests/*.test.mjs
node scripts/evaluate.mjs
# 已有Playwright与Chrome时，另开终端
RAG_URL=http://127.0.0.1:4318/rag-lab/ node tests/product-browser.mjs
```

源码已含vendor，普通启动不要求pnpm安装。GitHub Pages供给前端与必要PDF资源；server、原始corpus、管理测试及本地配置继续排除，本机API也使用静态白名单。未来公开模型托管、供应商、费用与真实效果另行确定。本开发批次未合并或公开发布，分支推送进展见批次报告；官网入口、源码提交、构建、部署和线上验证分别记录，不能把其中一步当作全部完成。

## English scope

This development batch adds twelve conditional tasks and twelve separate public task documents while freezing the original twelve-document corpus and legacy cases. Personal TXT/Markdown/text-PDF workflows parse locally with pinned, vendored PDF.js 6.5.438, page-level extraction warnings and no OCR. Source metadata, user drafts, explicit backup restoration and corrupt-storage write locks preserve the boundary between evidence and judgement. Session-owned APIs expose capabilities, task runs, extracted sources, drafts and exports; model calls are disabled by default. Historical reports remain historical. Exact checks belong to the batch evidence, with no claimed production, model or real-user improvement and no publication yet.
