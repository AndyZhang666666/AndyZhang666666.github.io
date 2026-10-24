# 部署说明

## 已核实的环境

仓库：`AndyZhang666666/AndyZhang666666.github.io`，公开，默认分支 `main`。2026-10-24 初次拉取起点 fd5bbd0，线上首页哈希与该版本一致；开发期间远端增加 c2f783d（官网及 filing-eval 更新），已将本项目分支 rebase 到它之上并保留全部改动。

公开 GitHub deployments API 记录显示 environment 为 `github-pages`、ref 为 `main`，由 GitHub Pages App 执行。仓库没有自定义 Actions workflow 或构建依赖，根目录是可直接托管的 HTML/CSS/JS。本项目沿用已有发布链路，在根目录新增 `tasteroom/`，无需新建公开仓库或服务。

## 发布

1. 在独立分支完成 PRD、功能、测试与文档，确保本地通过。
2. 发布前 fetch，检查远端 main 的最新提交。若有新变更，先同步并重新验证受影响部分。
3. 推送功能分支；将经过验证的变更合入 main，普通快进或合并，禁止 force push。
4. 用 `git ls-remote` 核对 main 与目标提交一致；检查 Pages deployment 状态和实际 URL。
5. 访问官网卡片两条入口，完成两轮选择、纠偏仲裁、切场景及新内容；检查手机布局。

体验地址：`https://andyzhang666666.github.io/tasteroom/`。源码入口指向同仓库 `tree/main/tasteroom`。部署成功以实际线上响应和体验复验为准，提交或推送成功本身不代表已上线。

## 回退

只 revert 本次项目相关提交，保留其他项目历史；删除卡片前先确认官网数据中该项目条目。服务端文件可作为源码公开，但 `.env`、Key 和 node_modules 不可入库；Pages 不会执行 `server.mjs`。

可选真实模型服务不在本次公开发布范围内，需要后续单独决定服务商、服务端托管、访问控制及预算。
