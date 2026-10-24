# 前后台主题维护

前台与 Admin 共用品牌色、文字色和状态色，分别保留适合购物展示与后台操作的背景。Admin 使用完整的浅色工作区，包括原生控件；即使 Payload 保存着深色偏好，也不会把深色图标与浅色面板混用。

## 修改位置

1. `app/theme-tokens.css`：唯一的基础色板与基础字阶。修改 `--gn-plum` 会同步更新前后台主要按钮、强调文字和选中态；`--gn-font-ui`、`--gn-font-display`、`--gn-type-*` 分别控制界面字、编辑感标题字及导航、正文、卡片和页脚字号/字重。
2. `app/brand-theme.css`：按用途映射变量。`--brand-*` 用于 Admin，`--store-*` 用于 storefront。例如后台面板引用白色，前台页面引用瓷白；两边共享同一品牌主色和字族。
3. 商品卡片通过 `store-product-card` 类及 `--store-card-*`、`--store-product-*` 变量共用圆角、阴影、字号和间距；分类卡片标题与商品标题共用衬线字族和 20px 字号。

Storefront 字体按语义分工：页面主标题、品牌内容标题、商品名和分类名使用 `--gn-font-display`；导航、按钮、页脚正文、筛选器、表单、订单信息及 Admin 操作界面使用 `--gn-font-ui`。字号层级为页标题约 30–36px、卡片标题 20px、正文 16px、控件/导航/页脚 14px、辅助说明 12px；按钮和当前导航使用 600 字重，普通导航与表单标签使用 500。导航字号在桌面端随宽度从 13px 到 14px 调整，移动端沿用横向滚动导航。

操作按钮统一使用 `ui-button` 加一种用途：`ui-button--primary`（实心主操作）、`ui-button--secondary`（描边次操作）、`ui-button--danger`（删除等危险操作）。同一用途共用颜色、字号、最小高度、圆角、悬停、焦点和禁用态。页面只指定宽度和外边距等布局，不重复定义按钮配色及内边距；Payload 原生按钮也映射到相同规格。行内操作使用 `ui-text-action`，删除加 `ui-text-action--danger`；前台表单、筛选、数量加减和操作面板分别复用 `ui-input`、`ui-filter`、`ui-quantity-control`、`ui-panel`。

Storefront 商品列表筛选和详情规格统一复用 `components/StorefrontSelect.jsx`，确保展开选项也能使用导航子菜单的字体、白底弹层、边框、阴影和薰衣草选中态，而不受浏览器原生菜单外观限制。复选框使用 `.ui-filter`，与下拉触发器共用 `--gn-control-*` 字号、控件高度、圆角和留白；勾选后整项高亮。Admin 原生控件和可搜索选择器也使用相同的 `--gn-control-*` 尺寸、品牌色及焦点变量，面板和选中态由各自的 Admin / Storefront 语义变量区分。窄屏商品筛选使用两列布局，极窄屏切换为单列。By Shape / By Length 分类卡片标题复用商品卡片的 `--store-product-title-size` 与衬线字族。

新增组件直接引用用途变量，例如 `color: var(--brand-text-primary)` 或 `background: var(--store-card)`。已有旧颜色工具类通过主题兼容规则映射；不要继续新增依赖某个旧十六进制色值的规则。

## 可读性约定

- 正文、表单和表格使用深色文字；辅助文字也保持足够对比度。
- 主要按钮使用莓紫底与白字；当前导航及标签使用浅薰衣草底与深莓紫文字。
- 禁用控件使用独立的背景和文字变量，保持文字可读，不把整个控件一起淡化。
- 键盘焦点使用清晰的莓紫轮廓；成功、错误和警告保留各自语义色。
- 改色后运行 `node --import tsx/esm --test tests/theme-contrast.test.ts`。该检查要求常用文字组合的对比度至少为 4.5:1、输入框边界至少为 3:1；还需查看实际页面，尤其是表格、下拉菜单、禁用态和焦点态。

无需新增环境变量或数据库 migration。
