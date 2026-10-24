# 前后台主题维护

前台与 Admin 共用品牌色、文字色和状态色，分别保留适合购物展示与后台操作的背景。Admin 使用完整的浅色工作区，包括原生控件；即使 Payload 保存着深色偏好，也不会把深色图标与浅色面板混用。

## 修改位置

1. `app/theme-tokens.css`：唯一的基础色板。修改 `--gn-plum` 会同步更新前后台主要按钮、强调文字和选中态；`--gn-ink` / `--gn-muted` 控制正文和辅助文字。
2. `app/brand-theme.css`：按用途映射变量。`--brand-*` 用于 Admin，`--store-*` 用于 storefront。例如后台面板引用白色，前台页面引用瓷白；两边共享同一品牌主色。
3. 商品卡片通过 `store-product-card` 类及 `--store-card-*`、`--store-product-*` 变量共用圆角、阴影、字号和间距。

操作按钮统一使用 `ui-button` 加一种用途：`ui-button--primary`（实心主操作）、`ui-button--secondary`（描边次操作）、`ui-button--danger`（删除等危险操作）。同一用途共用颜色、字号、最小高度、圆角、悬停、焦点和禁用态。页面只指定宽度和外边距等布局，不重复定义按钮配色及内边距；Payload 原生按钮也映射到相同规格。行内操作使用 `ui-text-action`，删除加 `ui-text-action--danger`；前台表单、筛选、数量加减和操作面板分别复用 `ui-input`、`ui-filter`、`ui-quantity-control`、`ui-panel`。

新增组件直接引用用途变量，例如 `color: var(--brand-text-primary)` 或 `background: var(--store-card)`。已有旧颜色工具类通过主题兼容规则映射；不要继续新增依赖某个旧十六进制色值的规则。

## 可读性约定

- 正文、表单和表格使用深色文字；辅助文字也保持足够对比度。
- 主要按钮使用莓紫底与白字；当前导航及标签使用浅薰衣草底与深莓紫文字。
- 禁用控件使用独立的背景和文字变量，保持文字可读，不把整个控件一起淡化。
- 键盘焦点使用清晰的莓紫轮廓；成功、错误和警告保留各自语义色。
- 改色后运行 `node --import tsx/esm --test tests/theme-contrast.test.ts`。该检查要求常用文字组合的对比度至少为 4.5:1、输入框边界至少为 3:1；还需查看实际页面，尤其是表格、下拉菜单、禁用态和焦点态。

无需新增环境变量或数据库 migration。
