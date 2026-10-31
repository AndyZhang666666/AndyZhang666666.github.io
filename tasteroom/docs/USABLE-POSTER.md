# 可带走的海报 · 开发分支

2026-10-31；尚未合并或发布。

- 默认可编辑画布；两次探索可选且不替换已有长期规则。
- 画布、A/B、临时选中使用同一工作区；更新文案、场景或参数使旧对照失效。
- 临时参数、作品导出和长期授权分开。范围确认展示被替换规则，支持撤回。
- 当前有效规则默认可见，完整依据和调用轨迹按需展开。
- 当前 SVG 同时用于可见画布与 SVG / 900×1200 PNG，不夹带私人反馈。
- 现有 v1 记忆兼容；最后画布作为草稿附加保存，不成为偏好规则。存储不可用时仍可操作、导出。

验证：30 项既有及新增核心检查通过；实际浏览器完成自定义文案、A/B 试用、导出 PNG 尺寸核对、范围保存与撤回，以及 1440 / 768 / 390 三种宽度无横向溢出。未调用模型。

```sh
node --test tasteroom/tests/engine.test.mjs tasteroom/tests/experiments.test.mjs tasteroom/tests/directions.test.mjs tasteroom/tests/usable.test.mjs
```
