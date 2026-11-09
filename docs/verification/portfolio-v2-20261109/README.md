# V2 浏览器验收证据

日期：2026-11-09。候选服务56071，冻结改版前基线56072。所有图片来自实际浏览器，不是生成设计稿。

- `hero-desktop.jpg` / `baseline-hero-desktop.jpg`：改版与本地冻结基线首页。
- `hero-deep-sea.jpg` / `hero-red-sand.jpg` / `hero-tundra.jpg`：其余三种原主题。
- `hero-mobile-zh.jpg` / `hero-mobile-en.jpg`：390×844中英首页，主作品入口可见。
- `mobile-directory.jpg` / `contact-mobile.jpg`：手机目录、联系区及页脚。
- `poker-expanded-desktop.jpg`：展开后的德州区；覆盖的精确测量见JSON。
- `education-desktop.jpg`：保留的研究主题插图与背景。
- `case-mobile-anchor.jpg`：通勤机制页的手机直达导航避让。
- `review-desktop.jpg`：统一本地审阅入口。
- `responsive-poker.json`：六宽度的扑克排序、列数、背景覆盖及溢出。
- `theme-responsive.json`：四主题×六宽度的布局、作品数量及控件位置。
- `directions.json`：四种精选方向及默认选项。
- `full-tool-landings.json`：四项完整工具的实际落地地址。仅偏爱在本地，其余转到已有公开版本，不代表本轮部署。

测试没有写入完整工具的评测、偏好、订单或通勤选择。手机为浏览器视口，不是实机测试。系统减少动效与隐藏页事件合同另由`scripts/test-motion-policy.mjs`覆盖，不代表系统设置实测或性能测量。
