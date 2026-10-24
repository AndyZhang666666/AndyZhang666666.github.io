# Andy Zhang · 个人官网

线上站点：[andyzhang666666.github.io](https://andyzhang666666.github.io/)。当前为根目录静态站点，通过 `main` 的 GitHub Pages 发布，无需构建。

本地运行：在仓库根目录执行 `python3 -m http.server 8794 --bind 127.0.0.1`，打开 http://127.0.0.1:8794/ 。主要内容来自 `data.json`，由 `app.js` 渲染；新增项目保持现有布局、主题与中英文机制。

## 独立生活产品

| 作品 | 产品判断与可体验闭环 | 说明 |
|---|---|---|
| [随便局](https://andyzhang666666.github.io/suibianju/) | 不用多数票覆盖底线；自愿预算建议 → 草稿预演 → 本人确认 → 逐人接受 → 决定单 | [README](suibianju/README.md) · [PRD / 第二轮](suibianju/docs/V2.md) · [更新记录](suibianju/CHANGELOG.md) |
| [TasteRoom · 偏爱实验室](https://andyzhang666666.github.io/tasteroom/) | 喜欢整张不能直接归因到每个参数；单变量对照 → 明确范围 → 场景/内容验证 → 偏好说明书与 SVG | [README](tasteroom/README.md) · [PRD / 第二轮](tasteroom/docs/V2.md) · [更新记录](tasteroom/CHANGELOG.md) |

两者均可免 Key 运行，公开版使用明确标注的本地规则，不调用真实模型。随便局为 3–5 位虚构角色的单人模拟，不是真实协作；偏爱实验室的线索不是人格结论或模型准确率。人物、餐厅和海报活动均为原创虚构样例，没有真实用户效果宣称。

改动与验证：[CHANGELOG.md](CHANGELOG.md) · [随便局 PRD](suibianju/docs/PRD.md) · [部署说明](suibianju/docs/IMPLEMENTATION.md)。

本轮计划与验收：[方案](docs/lifestyle-v2/PLAN.md) · [浏览器验收脚本](docs/lifestyle-v2/test-upgrades.mjs)。原网站格式、主题、交互、履历与其他 Demo 保持不变。
