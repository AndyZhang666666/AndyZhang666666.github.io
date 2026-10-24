# 实施与部署

## 来源核实（2026-10-24）
- 线上：https://andyzhang666666.github.io/
- 仓库：AndyZhang666666/AndyZhang666666.github.io，公开，默认 main。
- 基线 fd5bbd0b1668a3a57e522356ebc398df6854ba39；新克隆工作区干净；线上 index.html 与该基线逐字节一致。
- 公开部署记录显示该 SHA / main / github-pages；根目录静态文件，无构建配置、无项目 AGENTS.md、无 README；已读 CHANGELOG.md 和相关渲染代码。
- 隔离分支 feat/suibianju-demo，不改旧副本。只新增 suibianju/，并定向改项目数据、入口文案与缓存版本，不重构官网。

## 工作阶段
1. 提交短 PRD 和方案。
2. 实现独立 ES module 规则内核、静态界面、本地模拟整理与存储。
3. 添加状态/规则测试，浏览器实测并修复，保存真实截图。
4. 定向接入官网，补 README、部署与验证说明；提交并推送。
5. 验证远端 SHA 后以快进方式更新 main，等待 github-pages 成功，实测线上页面和入口。

## 本地运行
在仓库根目录运行 `python3 -m http.server 8794`，打开 http://localhost:8794/suibianju/ 。无需安装依赖、环境变量、模型 Key。
规则测试：`node --test suibianju/tests/engine.test.mjs`（Node 20+）。浏览器测试见 tests/browser.cjs（需 JavaScript Playwright 和 Chrome；本机 Python 未提供 Playwright，因此使用已提供的 JavaScript 版本）。

## 发布与回滚
沿用 main 根目录 GitHub Pages 发布。部署前确认 origin/main 没有新变更，禁止强推。使用 `git push origin feat/suibianju-demo` 并 `git ls-remote` 核实；在 main 快进本分支后普通 push。公开 deployments/statuses 验证部署 SHA，线上测试核心链路与 390px 布局。

回滚以 `git revert` 撤销官网接入及新增功能提交，普通推送，保留历史。不要 reset 或覆盖并行修改。若保护规则或凭据阻止发布，停留分支并如实报告，不假称上线。

## 设计判断
采用 editorial-greeting 的 1100px 居中平面与变化列宽：成员进度横排，左侧个人条件、右侧候选决策，手机依顺序堆叠。保留官网 frost 背景和系统中文字体；品牌暖色仅用于标记，行动按钮近黑。以“聚餐菜单/席位”作为产品自身的视觉材料，无照片占位、无虚构数据成绩。现有品牌暖纸色是对技能默认禁用奶油暖色的明确品牌例外。

## 发布前并行变更
独立分支推送后发现 main 新增 c2f783d（官网项目整理与 Filing Demo）。合并保留该更新，冲突仅为 app.js/index.html 的缓存版本，统一为 20261024-suibianju-evidence；新增的 iterationUrl 渲染和站点介绍均保留。以 c2f783d 为最新对比基线，data.json 仅新增随便局，所有其他记录与字段完全一致。
