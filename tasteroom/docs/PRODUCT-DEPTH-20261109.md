# 偏爱实验室：作品完成与偏好复用

2026-11-09，本地开发分支 `feat/taste-product-depth-20261109`。基线为官网 `55f3cb4`；本记录只涉及 `tasteroom/`，没有修改官网全局页面。尚未推送、合并或发布。

## 用户现在能完成什么

默认直接做作品：选场景、写文案、选构图、检查适配、留候选、导出。探索偏爱是另一条可选路径，内容与图片不会因为切换路径而消失。

六种构图继续使用各自的几何结构和原有纸色、墨色、强调色。三种输出不是拉伸旧海报：竖版900×1200、方形1080×1080、横版1600×900分别计算文字列宽、标题位置、主图区域与活动信息位置。例如横版包豪斯使用左图右文，瑞士使用左文右图；日式留白采用更小的主图与文字尺度。原有方向ID、自由参数和六维偏好规则保留。

原有类别、标题、副文案和落款之外，增加可选的日期／时间、地点、行动说明。空字段不占行。展映、招募、产品分享会可作为完整起点；切换起点先确认替换文案与活动信息。旧样例索引没有被改写，旧草稿缺少新字段时显示为空。

可以选择一张本机 JPG、PNG 或 WebP，最大5MB、最多5000万像素。先验证类型、大小和解码，再替换当前图片。适合／填满、水平／垂直焦点调整的是预留主图区域，不是自由拖拽编辑器。SVG、远程链接及伪装成图片的坏文件不会进入画布。

## 作品与授权分开

画布上方说明当前方向来自当前场景授权、全局继承还是临时试用。临时参数、字号或换行会单独标记。方向与本场景已授权方向不一致时，可恢复场景方向：它只以已有规则调用一次画布更新，不新增、替换或扩大记忆。

换内容会按当前场景规则重新整理；尺寸、主图和字号设置保留，供用户检查。规则只覆盖已授权维度，没有把“换了一张作品”当成又一次授权。“试用调整”使用原有本地规则解析，不声称理解任意自然语言。未知输入仍保留原话并给出可用选项。

两个候选是独立作品快照，包含四项文案、新活动信息、尺寸、六个画布参数、字号／换行和主图引用。采用前列明替换影响；采用、移除候选和导出不修改长期规则。缺图片时保留其他内容、提示重新选择或移除，并阻止把缺图画布导出为完整成品。

草稿文字、参数与记忆仍读原 `tasteroom-v1` 存储，新图片进入独立IndexedDB。localStorage不放图片字节，偏好说明书也不附图片。清空本机数据会清除图片库；从当前作品移除主图不会破坏候选中的同一图片。存储不可用时，保留内存中的当前作品，仍可编辑和导出；刷新后的保留能力会明确降级。

## 排版、导出与界面

标题／副文案行数、字号、活动字段宽度、文字与主图／落款区域的关系共同决定容量。超限保留原文，并说明字段或区域；可以平衡换行、缩小字号、调整密度或修改内容。问题没有解决时不能导出成品，草稿仍可保存。

当前画布、方向图库、候选、比较、SVG与PNG共用一个SVG渲染器。PNG使用点击导出时的尺寸与内容，不会因为异步等待时改了画布而改写已生成文件。成品包含实际图片和活动信息，元数据只含作品参数，不含私人反馈或偏好日志。SVG保留文字编辑性，依赖目标设备字体；PNG保留本机渲染字形。

界面保持原有纸面与深绿控件。内容编辑在左，画布与候选在右；手机先显示当前画布。六种图库使用当前同一份内容的真实缩略图，记忆与调用移到可关闭抽屉，Escape返回画布。按钮、输入和选择保持44px目标，减少动态效果下仍可完成所有操作。修复了旧3:4预览外框使横版画布下方出现大块空白的问题。

## 实际检查

原测试文件没有删除或改写。`node --test tasteroom/tests/*.test.mjs` 共47项通过：原41项及本轮6项。包括旧记忆、候选、回滚／重做、范围冲突、报告导入契约和本机假服务。新增检查覆盖18种布局、来源恢复不写记忆、图片URL边界、比较失效、长文保留和刷新后的临时参数标记。

Chrome独立浏览器上下文实际完成以下路径，结果见 [browser-results.json](evidence/product-depth-20261109/browser-results.json)：

- 当前场景授权 → 临时切另一方向 → 恢复；持久记忆逐字一致。
- 自有文案与活动信息 → 本机合成测试图 → 横版／焦点／适合 → 实际下载SVG和1600×900 PNG。
- 刷新恢复图片、尺寸和文案；从候选恢复完整横版作品。
- 同一图文经过六方向×三尺寸，18种组合均可导出。
- 390宽度无横向溢出；记忆抽屉可用Escape关闭。
- 未应用的五行文案不被截断，刷新可恢复；坏SVG文件不替换当前主图。
- 屏蔽localStorage和IndexedDB后，仍可在内存中添加图片、编辑并导出。

实际截图与导出文件均已打开检查：

- [1280首屏](evidence/product-depth-20261109/desktop-first-screen.png)
- [完整横版工作区](evidence/product-depth-20261109/desktop-landscape.png)
- [当前内容的六构图图库](evidence/product-depth-20261109/six-directions.png)
- [390手机](evidence/product-depth-20261109/mobile-portrait.png)
- [手机记忆抽屉](evidence/product-depth-20261109/mobile-memory.png)
- [实际PNG](evidence/product-depth-20261109/export-landscape.png)／[实际SVG](evidence/product-depth-20261109/export-landscape.svg)

测试只使用原创双色合成图，没有上传用户照片、调用模型或消耗付费接口。不是用户研究、跨浏览器或印前校样结论；有效任务完成率仍是待真人试用验证的指标。

## 重跑

```sh
node --test tasteroom/tests/*.test.mjs
PORT=8864 node tasteroom/server.mjs
# 另开终端；需要已安装的Playwright和系统Chrome
TEST_URL=http://127.0.0.1:8864/ node tasteroom/tests/product-browser.mjs
```

`PLAYWRIGHT_MODULE`可指向已有Playwright入口；`EVIDENCE_DIR`可改变截图目录。测试用全新上下文，不清理用户浏览器已有作品。旧 `tests/browser.mjs` 原样保留；本轮任务回归用 `npm run test:product-browser`。

## English scope

This local-only upgrade adds real event details, three reflowing artboard formats, one local raster hero image, complete candidate snapshots and visible preference provenance. Artwork data is separate from durable consent. Restoring the authorised scene direction reuses an existing rule without writing memory. Preview, comparison and PNG/SVG exports share one renderer. Existing tests remain intact;47 checks and isolated real-Chrome tasks pass. Actual1280/390 screenshots and image exports are linked above. No model calls, user-study claims, publication or remote push are included.
