# 2026-11-11 RAG任务闭环本地证据

开发分支 `feat/rag-grounding-scope-diff-20261111`；基线 `5d5847c`。本目录被现有 `_config.yml` 的 `rag-lab/evidence` 规则排除，不进入Pages。没有部署或主分支合并。

- `baseline-node-tests.txt`：改动前59/59通过。`baseline-assertions.sha256`：原七个测试文件哈希，最终逐项核对未变。
- `node-tests.txt`：新增独立测试后69/69通过。`evaluate.txt`：原固定12题评估输出，未用模型。
- `browser-result.json`：1280／768／390的新增任务路径与权限隔离结果；各宽度`scope`、`permission`、`grounding`截图。
- `rag-*-warning-answer.md`：错数字仍能导出，提示随草稿带走。`rag-*-employee.json/md`：降级员工后的脱敏输出。
- `preview-boundary.json`：整站预览中新模块200及私有路径404；同样的本地API边界另在新Node测试实际检查。
- `original-browser-regression/browser-result.json`：未修改断言的原浏览器脚本最终在1280／390／768全部通过，包括12任务、损坏／加密／无文字PDF保留旧草稿及备份恢复。`original-browser.sha256`留存原脚本哈希。
- `legacy-initial-comparison.json`与两张`initial-*-390.png`：基线标题y为899.078125，原首屏断言要求小于850；独立减少已有留白56px后当前为843.078125，保持六预设常显、44px触达和16px输入，原断言无需改动。新增独立脚本三种宽度同样全部通过。

本地端口：8877独立API（`model:null`，无模型配置），8878整站预览。只导入合成TXT与仓库原创PDF，无站外请求。数字提示是引文中的文字匹配，不能证明语义正确；范围提醒只覆盖已支持的规则主题。
