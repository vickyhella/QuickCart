# Ginny Nana — Product Studio & Marketing Studio PRD

**Version:** 1.9
**Project:** [vickyhella/QuickCart](https://github.com/vickyhella/QuickCart)  
**Tech Stack:** Next.js + Payload CMS + Neon PostgreSQL + Cloudflare R2

文档入口和各文件状态见 [docs/README.md](./README.md)。

---

## 当前待办与开放讨论

**更新日期：2026-10-21。** 本节是当前唯一待办清单。已完成且有验收记录的事项移除；状态不明的事项列为“待核验”，不默认视为完成。

### 已确认方案，待补齐开发与验收

- [ ] **商品级 Color 筛选**：Color 属于商品级分类 / 筛选属性，不是 Mystery Box 或其他商品的变体维度。由 Categories 管理可选颜色，Product Studio 为商品设置颜色，商品列表按颜色筛选；实现时明确与 Google Merchant Center 商品级 `color` 字段的复用或同步方式。当前 GMC `color` 字段不等于店铺筛选功能。
- [ ] **通用自定义变体组合与完整交易链路**：现有 Length + Shape + Size 组合以及 Mystery Box 的 Size-only 变体已支持创建、保存、发布和前台选择；Mystery Box 允许 Length / Shape 为空。部分通用属性基础也已实现：Categories 可管理自定义维度，变体可保存自定义属性，服务端会校验属性，前台能显示和选择已有属性组合。仍缺少按商品选择变体维度 / 选项并自动生成组合的完整流程，例如 Pack quantity + Size。目标方案参考 WooCommerce / Shopify 的“公共属性 + 商品选项 + 具体变体”模式。
  - 将套装件数命名为 **Pack quantity**，和购物车购买数量分开；只有不同套装是不同售卖规格时，才为它生成变体。
  - Length + Shape 继续按明确勾选的配对生成，不能自动扩成所有排列；Size 和其他已启用选项再与其组合。
  - 变体匹配须包含全部启用的选项。匹配到的现有变体保留 ID、SKU、价格、库存和图片；移除组合时停用旧变体；新组合分配唯一 SKU。
  - 商品前台展示对应选择器；服务端发布、购物车、报价、结账、订单记录、库存扣减及支付失败 / 重试流程均按商品所属的有效变体校验。顾客提交的价格不能作为计价来源。
  - 维度或选项仍被商品使用时，阻止删除并显示关联商品。保存配置或变体如需新增数据结构，先做向后兼容的增量 migration，并在测试环境验证后再部署。
  - 验收覆盖：只有 Size、Pack quantity + Size、Length + Shape + Size；编辑保留已有数据；无效 / 停用 / 缺货组合无法购买；订单准确记录所选组合并正确扣减库存。Mystery Box 的 Size-only 已有代码级测试；仍需补真实前台到订单的端到端验收。

### 暂缓：以后再看

以下事项不属于当前工作，之后有需要再讨论：Supplier 删除 / 归档规则、Instagram 发布能力、媒体库虚拟分组、原图是否改为仅存管理员本地。

### 上线与运营验收（当前状态待核验）

- [ ] **Netlify 域名与 HTTPS**：用户已确认 `www.ginnynana.com` 会跳转到 apex `ginnynana.com`。保留 apex 为主域名；核实 Netlify HTTPS 证书、HTTP 自动跳转到 HTTPS（Force HTTPS），以及 Production `NEXT_PUBLIC_SITE_URL` 使用 `https://ginnynana.com`。
- [ ] 核验 R2 正式、Preview、开发环境隔离；确认本地或 Preview 的上传、替换、删除、重新压缩不会改动生产媒体及引用。
- [ ] 核验 Google Merchant Center Feed、商品诊断、价格 / 库存、图片、落地页和配送设置。
- [ ] 核验 Pinterest 实际发布、图片 / 文案 / 落地页、Variant 参数、发布记录和失败重试。
- [ ] **PayPal 正式收款上线**：配置 Production Live Client ID、Client Secret、Webhook ID 和 `PAYPAL_ENV=live`；确认商户 Live 收款及高级银行卡支付资格，完成 Sandbox 与 Live 支付、取消、失败、Webhook 重试、金额 / 币种及库存验收。修复并验证订单完成、优惠次数和库存更新的非原子事务风险后，才启用真实收款。详见 `docs/paypal-advanced-checkout.md`。
- [ ] 配置并验收订单邮件：Resend 发件域名及 Netlify 环境变量；验证付款确认、发货通知和物流链接。逻辑已实现，未完成正式环境配置前不会发出邮件。
- [ ] 完成商城端到端验收：商品页、购物车、结账、运费与免邮、订单创建及订单确认。

---

## 1. 项目目标

优化现有 QuickCart 电商系统的商品管理体验，并将社交媒体自动发布功能从电商核心系统中拆分。

### 核心原则

- 保留现有 QuickCart 商城前端。
- 保留 Payload CMS 作为商品数据和 API 的核心。
- 不重新搭建电商系统，不迁移商品数据库。
- 新增独立的 Product Studio，专注于快速管理商品。
- 新增独立的 Marketing Studio，管理社交媒体发布。
- 优先使用成熟的开源组件，避免重复开发。
- 保持系统轻量、快速、低成本、易维护。

### 实际使用场景

- 每次新增 1–5 款商品。
- 每款商品通常有 2–5 张图片。
- 一款商品可能提供多个 Length + Shape 组合。
- 每个组合通常提供 XS / S / M / L。
- 商品 Description、SEO、SKU 等尽量自动生成。
- 尽可能减少页面切换、重复填写和手动操作。

**最终目标：上传图片、输入商品名称和价格、选择规格，即可保存商品草稿。未填写完整的商品也可先保存草稿，补齐后再发布。**

---

## 2. 系统架构

### 2.1 Storefront

保留现有 QuickCart / Next.js 商城前端。

负责：

- 商品展示
- 商品搜索与筛选
- 商品名称搜索已实现：全站导航进入 `/search?q=…`，按名称片段匹配已发布商品，分页展示结果；支持空结果、加载及失败提示。
- `/account` 提供独立 Customers 顾客认证、登录 / 退出和本人订单列表；顾客不具备后台权限，Users 只用于管理员。正式数据迁移与密码重设流程状态见专项迁移文档。
- 购物车
- Checkout
- PayPal 支付
- 订单创建
- 商品详情页不向顾客展示后台编辑提示或其他内部管理文案。
- 商品详情页、购物车和 Checkout 均展示当前支持的支付方式。Checkout 保留 PayPal 跳转付款，并在商户账户获准且启用高级银行卡支付时提供 PayPal 托管 Card Fields；卡组织图标仅在启用银行卡支付后展示，表单遵循 SDK 资格判断，不可用时提示使用 PayPal。
- Checkout 展示配送目的国家、按订单规则计算的运费、免邮门槛和配送政策入口；顾客提交订单前可在订单摘要中看到实际运费。
- 顾客可从全站导航栏打开侧边购物车；侧边购物车、购物车页和 Checkout 的运费行显示运费金额及 “(estimated 7-15 business days)”，并提供进入完整购物车及 Checkout 的入口。运费无法预估时应说明将在 Checkout 确认，不阻断购物。
- Checkout 提供 “Add note to your order” 复选框；勾选后显示最多 1000 字的备注输入框，并将备注保存在订单的 `customerNote` 字段。
- PayPal 商户凭据已配置并在账户侧启用高级卡支付后，设置 `PAYPAL_CARD_PAYMENTS_ENABLED=true`；Checkout 加载 PayPal Card Fields，服务端创建订单、按需请求 3D Secure 并核验实际扣款金额及币种。该开关关闭时，商品页和购物车不展示 Visa / Mastercard 标识。环境变量、Webhook 与联调清单见 `docs/paypal-advanced-checkout.md`；缺少凭证时不能视为已通过支付联调。

不因本项目重建商城前端。

移动端首页主视觉中的商品图与标题、介绍、按钮需分区排布，不能互相遮挡；手机端提供常驻可见、可横向滚动的商品导航，便于进入商品列表、按 Length / Shape 筛选、新品、促销和订单状态。

### 2.2 Product Studio

在 Payload Admin 内提供独立 Studio 页面：

`/admin/collections/products/studio`

负责：

- 商品列表
- 商品列表支持按创建时间排序（最新 / 最早）
- 快速新增和编辑商品
- 图片管理
- Variant 管理
- Description / SEO 自动生成
- 商品复制
- 商品发布
- Product Studio 商品标题链接到 Storefront 商品详情页；列表 Action 内提供 Edit / Duplicate / Delete 和多选批量删除。Products Payload 列表使用独立 Action 列提供相同操作，标题不承载隐藏的后台编辑入口；单商品编辑页也提供删除操作。
- 删除商品时，只有确认的关联记录后才执行删除；订单、Pinterest post 等历史记录保留。仅当图片不再被其他商品、Variant、Pinterest post 或媒体商品归属引用时，才同步删除 WebP；其原图仅在没有其他 WebP 引用时一并删除。
- Product Studio 工作区包含 `Product Studio`、`Products`、`Categories`、`Spreadsheet` 四个标签；Spreadsheet 支持分页、筛选、TSV 粘贴与批量字段编辑，并包含后台供应商信息，入口为 `/admin/collections/products/spreadsheet`
- Supplier 列表的 Action 提供 Manage Products，可搜索商品并批量绑定或解除商品级 Supplier 关联；Variant 级关联仍在 Product Studio 中单独管理。
- Categories 标签统一维护 Length 和 Shape 选项，显示每个选项关联的商品；支持新增选项和修改显示名称，删除仍被任意商品 Variant（含停用 Variant）使用的选项时必须阻止并说明关联商品。
- Length + Shape 规格按明确选择的配对生成，避免自动产生未选择的组合

Product Studio 使用现有 Payload API，不直接操作 PostgreSQL 数据表。

商品删除必须二次确认。若商品被订单、Pinterest post 或媒体记录引用，先明确告警并要求再次确认；共享或仍被引用的图片 / 原图必须保留，清理失败不得回滚或误报商品删除失败。

所有管理页面使用同一套 Payload Admin 外框、唯一左侧导航和顶栏。Product Studio 与 Marketing Studio 保留各自已经验证的主体界面和业务逻辑；Spreadsheet 保留原有编辑能力并作为 Product Studio 工作区标签访问；开发阶段不保留旧独立页面或兼容重定向。

左侧导航与 Dashboard 卡片使用相同的分组、项目和顺序：Studio（Product Studio、Marketing Studio）；Store（Users、Contact forms）；Media（Media）；Website（Pages）；Commerce（Orders、Discounts、Store settings）。Product Studio 内通过 `Product Studio`、`Products`、`Categories`、`Spreadsheet` 标签统一进入商品工作台、Payload 商品列表、Length / Shape 分类管理和表格编辑器；Products collection 不单独出现在侧栏。Marketing Studio 使用 `/admin/collections/marketing/studio`，不挂在 Pinterest Posts 下；Media 内含 Media、Media Originals、Image compression、Image names & metadata 四个标签；Store settings 内把 Countries 作为底部配置项展示。Publishing posts、Media Originals、Marketing settings、Product dimensions 等底层 collection/global 保留数据和管理能力，但不再作为重复的独立侧栏分组。

重复功能优先使用已验证的 Product Studio、Marketing Studio 和现有媒体工作流，不复制或重写其商品保存、Pinterest 发布、图片转换与压缩逻辑。Payload Admin 顶栏在用户图标左侧并排提供 Admin home 和 Storefront homepage；所有 Admin 页面共用这两个入口，不重复显示跳转。

Product Studio 的 Supplier information 默认展开。

### 2.3 Marketing Studio

在 Payload Admin 内提供独立管理页面：

`/admin/collections/marketing/studio`

负责：

- Pinterest 自动发布
- Instagram 自动发布
- 内容预览
- 发布排期
- 发布记录
- 失败重试

商品数据继续从 Payload 读取。

可使用 n8n 执行定时任务，不要求第一版独立部署第二套 Next.js 服务。

### 2.4 数据与存储

继续使用：

- Payload CMS
- Neon PostgreSQL
- Cloudflare R2
- 现有 Media / MediaOriginals
- 现有 WebP 转换逻辑

不引入第二套商品数据库或媒体存储。

---

## 3. 开源组件选型

优先评估并复用：

| 组件 | 用途 |
|---|---|
| shadcn/ui | 表单、按钮、抽屉、弹窗 |
| TanStack Table | 商品列表、筛选、分页 |
| react-dropzone | 图片拖拽上传 |
| dnd-kit | 图片排序 |

要求：

- 检查项目是否已有同类依赖，避免重复安装。
- 检查许可证及 Next.js / React 兼容性。
- 优先复用现有组件。
- 不为使用新组件而重构无关代码。
- 暂不引入 Glide Data Grid。
- 不引入新的 CMS 或 PIM。

### 全局视觉系统

- Storefront 首页、Product Studio、Marketing Studio 和 Payload Admin 使用一致的品牌字体与视觉 tokens。
- 字体沿用 Storefront 当前使用的字体栈；颜色、背景、边框、圆角和焦点状态通过全局 CSS 变量统一管理，例如 `--accent` 和 `--highlight`。
- 页面组件引用共享 tokens，不重复硬编码品牌色；修改 token 后，各入口的对应样式同步更新。
- Payload Admin 保留现有布局结构，同时加载品牌 tokens 并覆盖对应主题变量，使其与 Storefront 和 Studio 视觉一致。
- 保证文字与控件对比度、键盘焦点和错误状态清晰可辨。

---

## 4. Product Studio

### 4.1 商品列表

展示：

- 商品缩略图
- 商品名称
- SKU
- 价格
- Variant 数量
- 发布状态
- 更新时间

支持：

- 搜索、筛选、排序
- 服务端分页
- 快速修改基础价格（未覆盖价格的 Variant 跟随更新）
- 发布 / 下架
- 多选商品并批量改为 Draft 或 Published
- Duplicate Product
- Quick Add
- 点击进入商品编辑器

不需要完整的 Excel 式编辑器。

批量状态操作要求：

- 可对已选商品执行批量 Draft / Publish。
- 批量发布时逐个执行与单商品发布相同的服务端校验；有效商品正常发布，不符合条件的商品保持原状态，并返回逐商品失败原因。
- 批量下架将已发布商品改为 Draft，使其从商城和商品 Feed 中移除；不得删除商品或 Variant。

### 4.2 Quick Add

使用单页表单，避免多步骤向导。

页面结构：

1. Images
2. Product Information
3. Length & Shape
4. Variants Preview
5. Advanced Settings（默认折叠）

#### 发布必填字段

- Product Name
- The editor uses GMC terminology: Price is the regular price and is required to publish; optional Sale price must be lower than Price.
- Preserve Payload storage: `price` is the actual selling price and `compareAtPrice` is the optional regular price. A shared adapter maps editor Price / Sale price to these existing fields. Without a sale, store Price in `price` and clear `compareAtPrice`; with a sale, store Sale price in `price` and Price in `compareAtPrice`. No price data migration is required.
- Storefront, cart, checkout and feeds use the same adapter; actual checkout prices remain `variant.price ?? product.price`. Preserve variant overrides and inheritance when editing or duplicating. Emit GMC `sale_price` only when `compareAtPrice` exceeds the actual price, otherwise omit it.
- Product Studio price inputs use the browser's native up/down controls with a $1 step; mouse-wheel price changes are disabled. Apply the same control to regular and sale prices on the product and each variant, independently.
- Mark Product Studio Price with an asterisk because it is required for publishing, while drafts may leave it blank. Show selected sizes and variant preview cards in XS, S, M, L order across all Length + Shape combinations, including after a size is re-enabled; use the same order on product pages. Re-selecting a size enables its variants for the selected combinations.
- When editing a product, restore its featured image, gallery images, and variant image selections whether Payload returns media relations as IDs or populated records.
- 至少一张商品图片
- 至少一个 Length + Shape 组合
- 至少一个 Size

Save Draft 和 Save & Add Another 至少需要 Product Name，其余字段可暂缺；草稿不得出现在商城或商品 Feed。Publish 必须在服务端校验上述字段、价格有效性，以及至少一个已启用且库存大于 0 的 Variant。草稿可先不填写图片和 Variant，补齐后才能发布。

Advanced Settings 可填写可选的供应商货号和进货 URL。整款商品共用的信息填在商品上；不同规格对应不同货号或链接时，填在相应 Variant 上。这些字段不影响草稿保存或发布。

#### 自动生成字段

- Product SKU
- Variant SKU
- Slug
- Description
- SEO Title
- SEO Description
- 默认商品属性
- Variant 价格
- Variant 库存
- Variant 默认图片

#### 保存按钮

- **Save Draft**
- **Save & Add Another**
- **Publish**

新商品默认保存为 Draft。

Publish 必须由用户主动触发，并通过商品数据校验。

编辑已有商品时，点击 Publish 应在一次保存操作中提交表单最新修改、执行发布校验并将商品发布；不要求先单独保存草稿。已保存为 Draft 的商品之后也可直接 Publish。请求失败时保留表单内容，并显示服务端返回的具体错误；若响应不是有效 JSON，也应显示可理解的错误信息，不得只显示 JSON 解析异常。

Save & Add Another 保存当前草稿后，下一张表单沿用分类、Length + Shape 组合和 Size；清空名称、图片、价格、Description / SEO、SKU 和供应商信息。

商品草稿、商品修改或发布保存成功后，Studio 页面右下角显示短暂成功提示；失败时右下角显示 toast，同时在页面保留具体错误详情。较长错误在 toast 中简要提示，避免弹窗被 SQL 或堆栈内容撑满。

保存操作需防止重复提交造成重复商品；编辑已有商品时，不能用表单中的旧库存覆盖期间发生的库存变化。Studio 与 Payload Admin 同时修改同一商品时，保存前提示冲突，避免静默覆盖。

### 4.3 Duplicate Product

复制商品时保留：

- 商品分类和通用属性
- Length + Shape 组合
- Size
- 基础价格
- Variant 价格覆盖值
- 默认库存规则（新 Variant 库存统一从 10 开始）
- Description 模板设置

复制商品时重置：

- 商品名称
- Featured Image
- Gallery
- Variant 专属图片
- Product SKU
- Variant SKU
- Product ID / Variant ID
- Slug
- Description 内容
- SEO Title / SEO Description
- 发布状态（Draft）
- Description / SEO 的 Custom 状态（复制品统一使用 Auto）
- 供应商货号和进货 URL

新名称输入后，自动重新生成 Description、SEO 和 Slug。

复制时保留 Variant 组合和价格覆盖值，但新建 Variant ID / SKU，库存不沿用原商品实时库存。

复制操作不得修改原商品。

---

## 5. Description 与 SEO 自动生成

### 5.1 Description 模板

所有 Press-on Nails 商品默认使用统一的英文 Description 模板。

支持变量：

- `{productName}`
- `{brand}`
- `{productType}`
- `{availableLengthShapeCombinations}`
- `{availableSizes}`
- `{material}`
- `{color}`

没有值的字段应自动省略，不显示空占位符。

### 5.2 默认模板

**{productName}**

Discover {productName} by {brand}, a press-on nail style for your everyday look.

**Available Length & Shape combinations:** {availableLengthShapeCombinations}

**Available sizes:** {availableSizes}

Choose your preferred style and size before adding the product to your cart.

### 5.3 编辑规则

支持两种模式：

- **Auto**：根据商品信息自动生成。
- **Custom**：用户手动修改，保留自定义内容。

Auto 描述模板在 Admin → Studio → Marketing Studio → SEO 标签的 Product description template 中编辑，支持商品名称、品类、Length、Shape、可用规格组合和尺码变量。

- 描述模板及商品自定义描述支持 Markdown（标题、粗体/斜体、列表、链接和表格）；模板编辑器和 Product Studio 提供渲染预览，商品页按 Markdown 渲染。SEO 描述仍作为纯文本元数据处理。

要求：

- 新商品默认使用 Auto。
- 修改名称、Styles、Sizes 时更新 Auto 预览。
- 用户手动修改后切换为 Custom。
- Custom 内容不得被自动覆盖。
- 提供 Regenerate from Template 按钮。
- 重新生成自定义内容前需要确认。
- 修改全局模板后，自动刷新所有明确处于 Auto 模式的商品字段，包括已发布商品；Custom 字段不得覆盖。
- 旧商品若缺少 Auto / Custom 标记，仅当现有内容与旧模板按该商品数据生成的结果完全一致时，才视为 Auto 并刷新；无法确认来源的内容保留。
- 已有手动填写的 Description 视为 Custom 并原样保留；清空后若选择 Auto 才重新生成，不能因字段为空而静默覆盖。

### 5.4 SEO

- SEO Title 和 SEO Description 使用独立模板。
- 默认自动生成，允许手动覆盖。
- 已有手动填写的 SEO 字段原样保留；清空或切换为 Auto 后才按模板生成，分别记录 Title 和 Description 的覆盖状态。
- SEO 模板支持 `{availableLengthShapeCombinations}` 和 `{availableSizes}`：前者从已选择且至少有一个启用 Variant 的 Length + Shape 组合生成可读列表，保留实际组合关系；后者列出至少对应一个启用 Variant 的尺码。
- Length 和 Shape 是独立于商品 Category 的结构化筛选维度；SEO 组合文案由这些维度派生，不增加重复的 Style 字段。
- `{length}` 和 `{shape}` 从同一组已选择的 Length + Shape 组合派生：分别列出去重后的 Length 和 Shape 值，多值以逗号分隔；不得要求用户重复填写。
- `{availableLengthShapeCombinations}` 列出实际的 Length + Shape 配对，例如 `Short Square, Medium Oval`。当文案需要表达具体配对时使用此变量；`{length}` 和 `{shape}` 是便于单独提及分类维度的汇总值。
- 库存暂时为 0 但仍启用的 Variant 不从 SEO 规格列表中移除。
- 没有对应值的变量应省略，不留下空占位符。
- 尽量复用现有 Marketing Settings 中的 SEO 模板逻辑。
- GMC 商品描述应基于真实商品信息，不生成未经确认的材质、功效、配送或包装承诺。

---

## 6. 图片管理

### 6.1 上传

- 支持 HEIC / JPG / PNG / WebP。
- 支持一次上传多张图片。
- 自动转换为 WebP。
- 保留原图用于重新压缩。
- Studio 新增或编辑商品时上传的图片，文件名使用当时表单中的商品名称和 Marketing 文件名模板；Supplier SKU 不进入图片文件名。
- 原图文件名沿用压缩图的名称基底并添加 `-original` 后缀，便于在 R2 中配对管理。
- R2 中替换 WebP 或原图时复用稳定对象 key，不触发部署；替换原图后可从该原图重新生成 WebP，商品图片公共 URL 保持不变。
- 验证记录（2026-10-14）：覆盖 R2 中的 original 后，在后台重新压缩可生成并显示替换后的图片。
- 已有关联图片不因商品改名而自动搬移 R2 对象或修改公共 URL；需要通过明确的媒体替换流程更新，避免断开商品、Variant、Feed 和 Pin 引用。
- WebP Quality 用于新上传和手动重新压缩；保存 Quality 不自动改写存量图片。
- Catalog → Media → Image compression 提供“重新压缩存量图片”操作：显示可处理数量，用户确认后分批从保留原图重新生成 WebP，显示进度与逐项失败原因；商品和 Variant 的媒体引用保持不变。
- 临时图片、没有可用原图的 WebP、动画图片和 SVG 不纳入批量重压缩；非 WebP 且没有原图的静态图片可作为来源，并在重压缩成功后保存原件。
- 支持的静态图片上传始终转换为 WebP；GIF、SVG 等动画或矢量格式保留原格式，不提供关闭 WebP 转换的开关。
- 上传后直接显示缩略图。
- 支持从现有 Media 库搜索、预览并选择已上传图片；选择操作只建立商品关联，不重复上传或复制文件。
- 选择器列出 Media 中所有 WebP 图片记录，不因 `studioTemporary` 标记隐藏；无匹配图片时说明数据来源。R2 中没有 Media 记录的对象及 Media Originals 原图不会作为可选商品图片显示。
- 编辑商品时，图片引用需归一到当前启用的媒体存储并按对象 URL 去重；缺失对象和非 WebP 旧引用从编辑表单排除并提示，保存后解除这些失效关联。短暂的存储网络错误不作为缺失处理。
- 显示单张图片上传进度和错误。
- Studio 商品图片区域提供拖拽上传框；支持将多张图片直接拖入，并复用现有上传、转换和失败清理流程。
- 支持拖拽排序。
- 第一张默认作为 Featured Image。
- 支持手动更换主图。
- 上传失败时清理该次上传产生的 Media、原图及存储文件，不留下不完整记录。
- 取消新商品创建时清理本次上传且未被任何商品引用的图片和原图；不得删除已被其他商品引用的媒体。
- 直接关闭页面等未触发取消操作的情况，由定时清理任务删除超过 24 小时、未关联任何商品或 Variant 的临时图片、原图和存储文件；删除前再次检查引用。
- 保存商品时如部分图片上传失败，明确列出失败项；成功项可保留在表单中继续重试，但不得将失败项当作已保存图片。
- 复用现有媒体存储；上传的媒体实体文件不得留在项目源码目录或 Git 工作区。本地开发使用文件系统存储时，存储目录必须被 Git 忽略。
- 选择已有媒体不应将其标记为临时上传，也不得被新商品取消或临时文件清理任务删除。

复用现有 Media / MediaOriginals 和 R2 存储逻辑。

### 6.2 Variant 图片

- 所有 Variant 默认继承商品主图。
- 不需要为 XS / S / M / L 重复上传图片。
- 只有用户主动指定时，才使用 Variant 专属图片。
- 专属图片优先从商品 Gallery 中选择。
- 更换商品主图后，未自定义图片的 Variant 自动跟随。
- 已自定义图片的 Variant 不受影响。
- 已有 Variant 的手动图片原样保留，不根据其是否等于当前主图推断为继承。
- 用户清除 Variant 专属图片且不重新指定时，该 Variant 改为继承商品主图；之后更换主图也随之更新。
- 从商品 Gallery 移除图片仅解除该商品关联；永久删除 Media / 原图前检查所有商品及 Variant 引用，显示引用警告，并禁止删除仍被引用的文件。

**注意：需检查并调整现有 Payload Hook，避免自动将主图永久写入每个 Variant 的图片字段。**

---

### 6.3 R2 文件组织

- Supplier SKU 属于后台信息，不得写入公开图片文件名或 URL；若需要按 Supplier SKU 分组，应通过后台映射显示，R2 对象 key 保持不含原始供应商信息。
- R2 内的 WebP 与原图使用可配对的稳定命名；通过 R2 覆盖原图后，后台重新压缩流程读取更新后的原图并覆盖原 WebP key。

### 6.4 原图批量清理

- Media 标签提供与 Originals 类似的引用分析及批量删除按钮：仅删除未被商品主图、Gallery、Variant 或 Pinterest（含旧版图片 URL）引用的图片，并清理对应 Original。仍被其他 Media 使用的共享 Original 保留；删除前再次核验引用，显示实际删除、保留及失败数量，并要求不可撤销确认。

- Payload Admin 的 Media Originals 列表支持批量清理原图，并显示 WebP 引用检查结果。
- 系统通过 `sourceOriginal` 找到对应 WebP；若 WebP 被商品主图、Gallery、Variant 或 Pinterest Pin 使用，则将该原图标记为已引用，并显示具体商品或 Pin 名称。Media 记录自身的 `product` 辅助关系不能单独作为引用依据。
- 商品删除清理图片时，同时检查 Pinterest 的 `imageMedia` 和 `imageURL` 引用；仅保存图片 URL 的旧 Pin 仍须保护对应 WebP 及原图，商品名称和图片文件名无需一致。
- 默认仅删除未被使用 WebP 引用的原图；已引用原图保留，并显示关联数量和对象名称。部分被引用时，清理未引用原图并报告保留数量。
- 勾选明确的风险确认后，才允许删除已引用 WebP 对应的原图；确认说明 WebP 和商品展示仍保留，但之后无法从该原图重新压缩。
- 删除只移除原图文件和 Media Originals 记录，并清除对应 WebP 的 `sourceOriginal` 关系；不得删除 WebP、商品、Variant、Pin 或其媒体引用。
- 执行删除时在服务端重新检查引用，逐项报告成功和失败；不提供绕过该检查的 Payload 原图直接删除入口。

## 7. Variant 管理

### 7.1 规格选择

采用：

**Length + Shape 指定组合 → Size → Variants**

例如：

- Short Square
- Short Oval
- Medium Oval

不自动生成未选择的 Medium Square。

已选 Length + Shape 组合是唯一规格来源：系统据此生成 Variants，并自动汇总商品级 Length / Shape 筛选值，供 Storefront 的 By Length / By Shape 页面使用。主页筛选只显示至少有一个启用 Variant 的维度值；停用的 Variant 保留在后台，但不作为当前可选筛选结果。商品 Category（如 Press-on Nails、Nail Care）仍是独立分类字段。

### 7.2 Size

默认选择：

- XS
- S
- M
- L

允许用户取消某些 Size。

### 7.3 自动生成

例如：

3 个 Length + Shape 组合 × 4 个 Sizes = 12 个 Variants。

每个 Variant 包含：

- SKU
- Length
- Shape
- Size
- Price
- Stock
- Enabled
- 可选专属图片
- 可选供应商货号和进货 URL

### 7.4 默认规则

- 新 Variant 默认库存为 **10**。
- 默认启用库存追踪。
- 默认继承商品基础价格。
- 修改基础价格时，未设置价格覆盖值的 Variant 跟随更新；已手动覆盖的价格保持不变，并可恢复继承。
- 默认继承商品主图。
- 支持单独修改价格、库存和图片。
- 支持批量设置库存。
- 库存为 0 的 Variant 保留并显示售罄，不允许购买；至少有一个已启用且有库存的 Variant 才能发布商品，暂不支持预售。

### 7.5 编辑已有 Variant

必须：

- 保留已有 Variant ID。
- 保留已有 SKU。
- 保留已有价格覆盖值。
- 保留已有库存。
- 保留已有专属图片。
- 只新增缺失组合。
- 移除组合前显示确认；已有 Variant 改为停用并保留 ID、SKU、价格、库存和图片，重新选回相同组合时恢复原 Variant。
- 避免破坏已有订单的历史规格信息。

编辑时只提交实际更改的字段；库存更新需检查当前值或版本，避免覆盖购买和其他管理员操作期间的变更。

SKU 由服务端统一生成，确保唯一性，避免不同编辑器生成不一致。

---

## 8. Payload 集成与现有代码复用

### 保留

- `collections/Products.ts`
- `collections/Media.ts`
- `collections/MediaOriginals.ts`
- Payload Admin
- 现有 WebP 转换逻辑
- Neon / R2 配置
- 开发、Preview 和 Production 必须使用独立数据库配置；本地未配置开发数据库时使用 Git 忽略的 SQLite 文件。
- 开发与 Preview 使用独立 R2 bucket/凭据；未配置时本地媒体只写入 Git 忽略的本地媒体目录，不回退使用 Production R2。
- 订单、折扣、支付功能
- GMC / Pinterest Feed 功能

### 商品 Feed

- 商品提供可编辑的 Shipping weight（kg）字段，新商品默认 `0.2 kg`；GMC 和 Pinterest XML Feed 都输出该商品的重量，历史记录为空时按 `0.2 kg` 处理。
- 商品 Feed 标题的规格顺序统一为 Length、Shape、Size，例如 `Silver Moonlight - medium almond XS`；Variant 名称和值的顺序保持一致。
- GMC 的 `product_detail` 只发送 Length 和 Shape；Size 使用标准 `g:size` 字段，避免重复显示。
- Feed URL 每次被请求时返回当前已发布商品数据；Merchant Center 是否自动更新取决于数据源的抓取计划。需要立即更新时，在 GMC 手动触发抓取。
- GMC 中已验证并认领的网站域名必须与 Feed 商品落地页链接域名一致；部署时将 `NEXT_PUBLIC_SITE_URL` 设为该正式商城域名。

### 配送费规则

- Store Settings 的运费配置按 GMC 的顺序提供订单金额条件和运费方式：指定订单金额以上免邮、低于指定订单金额不配送；运费方式为 Free shipping、Flat rate、Price、Weight、Number of items 或 Advanced cost table。
- 不同运费方式只显示所需字段；Flat rate 是可选方式之一，不是必填的全局运费字段。Price、Weight 和 Number of items 使用区间与费用表；重量单位为 kg，按商品单件重量 × 数量计算。历史商品重量为空时按 `0.2 kg` 计算。
- Advanced cost table 可选两个不同维度（价格、重量、件数），每行配置两个维度范围的组合和对应费用；未匹配到费率时结账会提示无法配送，不会静默按零运费下单。
- 订单金额条件按应用折扣后的商品小计计算；低于最低配送金额时禁止结账，达到免邮门槛时运费为零。GMC 运费设置需单独配置，不会与网站自动同步。

### 新增

- `/admin/collections/products/studio`
- 商品列表
- Quick Add
- 商品图片管理界面
- Length + Shape 组合选择器
- Variant 生成及差异更新逻辑
- Description 模板生成服务
- Duplicate Product
- Product Studio 服务端 API

### 改造

- SKU 生成逻辑
- Description / SEO 模板逻辑
- Variant 图片继承逻辑
- Variant 更新时的数据保留逻辑

### 暂时保留

- `ProductBulkEditor.tsx`
- `ProductVariantsSpreadsheetField.tsx`

新 Studio 稳定后再考虑移除旧组件。

### 安全要求

- 复用 Payload 管理员认证。
- 所有写操作在服务端校验权限。
- 不直接写 Payload 数据表。
- 不信任浏览器提交的价格、SKU 或商品关联。
- 批量操作必须有明确的错误反馈。
- 数据结构修改必须有迁移和回滚方案。
- 保存和发布接口应防止重复请求造成重复商品或重复发布。
- 供应商货号和进货 URL 仅供管理员读取和修改；服务端不得在公开商品 API、商城页面、商品 Feed 或顾客订单数据中返回这些字段。

---

## 9. Marketing Studio

### 9.1 目标

将 Pinterest 发布功能从商品管理后台中拆出，并增加 Instagram 自动发布能力。

### 9.2 功能

- 读取 Payload 商品数据。
- 选择商品和图片。
- 自动生成可编辑的发布文案。
- 每条 Pin 默认链接到对应的商城商品详情页；选择 Variant 时保留 Variant 参数。用户显式填写的落地页链接应保留。
- 内容预览。
- 设置发布时间。
- 查看发布状态和历史。
- 失败重试。
- 防止重复发布。

### 9.3 技术方案

- 管理界面：`/admin/collections/marketing/studio`
- 商品数据：Payload API
- 定时执行：优先评估现有定时任务与 n8n
- 发布记录：独立的发布计划及执行状态

### 9.4 迁移要求

- 优先复用现有 Pinterest 发布逻辑。
- 新系统验证成功后，再关闭旧定时任务。
- 禁止新旧任务同时发布同一内容。
- Instagram 先验证账号类型、授权和 API 权限，再实现发布。
- Marketing Studio 不直接修改商品库存、价格或订单。

---

## 10. Commerce Core 稳定性

保留现有 Checkout 和 PayPal 实现，不在 Product Studio 开发中大规模重构。

但需单独检查：

- PayPal Webhook 幂等性。
- 支付成功与库存扣减的一致性。
- 并发购买导致的超卖风险。
- 支付失败、重复回调和重试。
- 生产环境数据库、R2 和密钥配置。

支付和库存的高风险问题应在正式上线或扩大销售前修复。

---

## 11. 待办维护

所有尚未完成、讨论中或状态待核验的事项集中维护在文档开头的“当前待办与开放讨论”。本 PRD 不再维护重复的分阶段计划或第二份上线清单；实施完成并核验后，从待办清单中移除或标记完成，并将稳定要求保留在对应功能章节。

---

## 12. Codex 开发约束

1. 开发前先检查现有仓库、依赖和实现。
2. 先提交简短的代码复用分析与实施计划。
3. 优先使用成熟开源组件，避免重复开发。
4. 不引入新的 CMS、PIM 或数据库。
5. 不重建 QuickCart 商城。
6. 不删除 Payload Admin。
7. 不随意替换 Neon、R2 或 PayPal。
8. 不进行与当前阶段无关的大规模重构。
9. 每个 Phase 独立实现、测试和验收。
10. 对商品创建、复制、SKU、Variant 更新、图片继承和发布状态编写测试。
11. 修改数据库结构前必须说明兼容性、迁移及回滚方案。
12. 优先保证实际操作效率、加载速度和系统稳定性。

---

## 13. 最终验收标准

Product Studio 完成后，应满足：

- [ ] 每次可以快速创建 1–5 款商品。
- [ ] 每款可上传 2–5 张图片，自动转换 WebP。
- [ ] 只填写名称、价格和规格即可保存。
- [ ] 信息不完整也可保存草稿；草稿不出现在商城或 Feed，发布前必须通过完整校验。
- [ ] Save & Add Another 只沿用分类和规格选择，不沿用价格、图片或文案。
- [ ] Description 和 SEO 自动生成，支持手动修改。
- [ ] 支持指定 Length + Shape 组合。
- [ ] 自动生成 XS / S / M / L Variants。
- [ ] 每个新 Variant 默认库存 10。
- [ ] 缺货 Variant 显示售罄；没有任何有库存的已启用 Variant 时不能发布。
- [ ] Variant 默认继承商品主图。
- [ ] Duplicate Product 不影响原商品。
- [ ] 新商品默认 Draft，手动 Publish。
- [ ] 修改已有商品不丢失 Variant 数据。
- [ ] 编辑商品时 Publish 会保存最新修改并在同一操作中发布；错误时保留表单并展示具体原因。
- [ ] 商品列表支持多选并批量设为 Draft / Published；批量发布逐商品校验并报告失败项。
- [ ] SEO 自动模板可用 `{availableLengthShapeCombinations}` 展示真实的 Length + Shape 组合，并用 `{availableSizes}` 展示对应启用尺码。
- [ ] 可搜索、预览并选择 Media 库已有图片；选择时不重复上传，且不被临时图片清理误删。
- [ ] Storefront、Product Studio、Marketing Studio 和 Payload Admin 使用统一字体和共享品牌 CSS tokens。
- [ ] 修改基础价格只影响继承价格的 Variant；移除再选回规格可恢复原 Variant。
- [ ] 已有手动描述、SEO 和 Variant 图片不被自动覆盖；清除专属图片后改为继承主图。
- [ ] 上传失败或取消创建不留下未引用图片和原图；删除被引用的媒体会提示并阻止。
- [ ] 超过 24 小时的未关联临时图片及原图会被清理，已被引用的媒体保留。
- [ ] 上传图片及原图保存在媒体存储中，不会作为未跟踪文件残留在项目源码目录或 Git 工作区；清理前检查所有商品和 Variant 引用。
- [ ] 重复保存不产生重复商品，并发编辑不静默覆盖库存。
- [ ] 管理员可记录商品级或 Variant 级供应商货号和进货 URL；公开接口、页面、Feed 与顾客订单不暴露这些字段。
- [ ] 无需使用原 Payload 商品编辑器即可完成日常上新。
- [ ] 保留现有商城、支付、商品 Feed 和后台功能。

**项目完成标准：商品维护明显比现有 Payload Admin 更简单、更快，同时不牺牲现有电商系统的稳定性。**
