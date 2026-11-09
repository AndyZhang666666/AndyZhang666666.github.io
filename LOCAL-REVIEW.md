# 官网与四项 Demo · 本地联合审阅

更新日期：2026-11-09。当前开发分支为 `feat/site-product-depth-20261109`，四项产品深化已与用户批准的官网 V2 视觉基线 `828fc59` 合入同一开发版本，尚未合并到 main 或发布。本文件中的“本地”始终指当前仓库，线上按钮直接打开真实 GitHub Pages。

- [统一审阅入口](http://127.0.0.1:8860/review.html)：默认四项精选，可切换官网、完整作品库和四个工具。
- [官网精选](http://127.0.0.1:8860/#selected) · [当前线上](https://andyzhang666666.github.io/)
- Eval 本地使用新文稿工作区；线上对照使用已发布的评测入口。

无法打开时，可双击根目录的 `打开本地预览.command`，或在当前目录运行：

```sh
PREVIEW_PORT=8860 node scripts/preview.mjs
```

服务仅监听本机，`/__preview__` 可确认实际工作目录。不要把旧的8811、56071或其他工作目录的服务当成本批结果，也不要为腾端口停止未核实的其他项目。

四项完整工具映射当前 Eval／Bundle 构建输出及本仓库 Taste／RAG；可选旧工具没有本地构建时才回退公开页面。预览服务仅放行需要的公开资源，RAG个人资料、服务器源码、依赖目录及隐藏文件不公开。案例主题脚本 `/scripts/case-reader.js` 是独立白名单，其余 scripts 仍不可访问。

合并后静态检查与旧检查的需求差异见 [本批合并记录](docs/verification/selected-depth-v2-merge-20261109/README.md)。旧 V2 的审阅、发布准备及截图保留在 [V2记录](docs/PORTFOLIO-V2-20261109.md)和[发布记录](docs/RELEASE-READY-V2-20261109.md)，不冒充本批四个完整工具的最终验收。
