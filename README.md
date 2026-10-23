# Ginny Nana 电商项目

这是 Ginny Nana 的电商网站和运营后台。网站使用 Next.js，Payload CMS 管理商品、媒体、订单和运营内容；生产数据存储在 Neon PostgreSQL，媒体存储在 Cloudflare R2。

## 本地启动

需要 Node.js 和 npm。首次在本地运行：

1. 安装依赖：`npm install`
2. 复制环境变量模板：`cp .env.example .env.development.local`
3. 设置本地 `PAYLOAD_SECRET_DEVELOPMENT`。如需连接独立开发数据库，设置 `DATABASE_URL_DEVELOPMENT`；未设置时使用本地 SQLite。开发环境的 R2 配置可选。
4. 启动：`npm run dev`
5. 打开网站 `http://localhost:3000`，后台为 `http://localhost:3000/admin`。Product Studio 在 `/admin/collections/products/studio`。

不要把密钥提交到 Git。开发环境变量放在被忽略的 `.env.development.local`；Preview 使用 `*_PREVIEW` 变量，Production 使用无后缀变量。Netlify `dev` 分支只在 Branch deploys context 设置 `QUICKCART_ENVIRONMENT=preview` 和独立 Preview 配置。必需变量、用途及 Secret 勾选建议见 [.env.example](./.env.example)；不要用 `netlify env:import` 导入模板。Netlify 只在提交仅改动 `README.md`、`AGENTS.md`、`docs/`、`.env.example` 或 `.env.netlify-dev.example` 时跳过构建；应用、依赖及部署配置改动仍会构建，见 [netlify.toml](./netlify.toml)。环境选择逻辑见 [环境配置实现](./lib/environment-config.ts)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动已构建的网站 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行 `tests/` 下的测试 |
| `npm run migrate` | 对当前环境配置的数据库应用 Payload migrations；运行前先确认目标环境 |
| `npm run migrate:preview -- status` / `-- apply` | 使用 `.env.netlify-dev` 检查 / 执行 dev 数据库 migration；省略参数只检查 |
| `npm run migrate:production -- status` / `-- apply` | 使用 `.env.local` 检查 / 执行正式库 migration；该文件按项目约定连接 Production，缺少时停止，不会从 shell 环境补齐变量 |
| `npm run migrate:woocommerce-data -- --source-only <备份.wpress>` | 只读盘点 WooCommerce 备份中的顾客和订单，不连接数据库 |
| `npm run migrate:woocommerce-data -- <备份.wpress>` | 对当前 `.env.local` 数据库做导入预览，不写入 |
| `npm run migrate:woocommerce-data -- --apply <备份.wpress>` | 将预览确认的数据通过 Payload API 导入当前 `.env.local` 数据库；可重复运行 |

## 目录与关键文件

| 路径 | 作用；通常什么时候修改 |
| --- | --- |
| `app/(storefront)/` | 顾客访问的页面：主页、商品详情、分类筛选、购物车、结账、订单状态。调整页面或路由时从这里开始。 |
| `components/` | Storefront 共用组件，如导航栏、商品卡、购物车和支付按钮；Length / Shape 分类入口使用后台配置的图片和分类名称。 |
| `app/studio/product-studio.tsx` | Product Studio 的商品列表和编辑界面；当前变体支持 Length + Shape + Size 及 Mystery Box Size-only；商品级 Color 分类筛选已实现，复用现有字段和规格配置，无需 migration。Pack quantity 等自定义组合待补齐（见 PRD）。 |
| `app/marketing-studio/` | Marketing Studio 的路由入口。 |
| `app/(payload)/components/` | Payload 后台的自定义界面，如 Product Studio、Categories、Spreadsheet、Suppliers 和媒体工具。 |
| `app/(payload)/admin/[[...segments]]/` | Payload Admin 路由；`importMap.js` 把 Payload 配置中的组件路径连接到实际组件。 |
| `app/api/` | Next.js 服务端 API：商品后台、媒体、Checkout / PayPal、Merchant / Pinterest Feed 和定时任务。改 API 时同时检查调用它的页面与测试。 |
| `collections/` | Payload 集合的数据结构、字段、权限和 Hook。商品、Variant、Supplier、Media、Order、Discounts 和带展示位置的 Pages schema 在这里。 |
| `globals/` | Payload 单例配置数据，如配送设置、营销设置和商品规格维度。 |
| `payload.config.ts` | 注册 Payload collections / globals、数据库、R2 文件存储、Admin 组件和类型输出位置。 |
| `payload-types.ts` | Payload 根据 schema 生成的 TypeScript 类型；修改 schema 后重新生成，不要手工维护。 |
| `migrations/` | Payload 数据库迁移文件及注册表。只有数据库结构或需要迁移的数据变化时才新增。 |
| `lib/` | 可复用业务逻辑：价格、Variant 校验、库存、配送、PayPal、媒体命名和清理等。复杂逻辑优先放在这里，并由 API / 页面调用。 |
| `context/AppContext.jsx` | Storefront 购物车状态、商品加载状态及失败重试逻辑。 |
| `scripts/` | 手动运行的数据导入或迁移脚本；运行前确认当前环境和目标数据库。 |
| `tests/` | 业务逻辑和 API 行为测试；功能变更时补充对应的聚焦测试。 |
| `assets/`、`public/` | 项目图标、品牌素材和公开静态文件。 |
| `docs/` | 产品要求、配置说明、上线验收和已知风险；从 [文档索引](./docs/README.md) 开始。 |
| `AGENTS.md` | 项目开发约定，包括架构边界、测试和文档更新规则。 |

## 商品变体

线上规则暂时保持不变：普通商品使用已选定的 Length + Shape 组合及尺码；Mystery Box 仅使用尺码。通用商品仅尺码变体暂缓开发。变体按 `Length + Shape + Size` 组合匹配；编辑时组合键不变会保留原 Variant ID。若以后改变组合键（例如把普通商品改成仅尺码），旧变体会停用，新组合可能获得新 ID。历史订单保留原 Variant ID 和规格快照；实施这类改动前需评估购物车及外部变体链接，并明确旧变体 ID 的映射和库存处理。详见 [Product Studio PRD](./docs/prd.md)。

URL 当前仍使用 `?variant=ID`；改用可读规格参数及保留旧链接兼容的方案列为待讨论，暂不改动。可读 URL 不能替代 Variant ID 保留和规格变更映射。

## 顾客登录与迁移
## Storefront 页面与分类

首页采用明亮的美甲画廊视觉：以钴蓝、柠檬黄和番茄红突出产品摄影，展示新品、按形状 / 长度选购及手工、复用等卖点；首页入口在 `app/(storefront)/page.jsx`，沿用现有商品数据、导航、商品卡和页脚，无需新增环境变量或 migration。

导航配置加载时会保留 `How to Use` 入口，数据返回后再显示页面链接，避免刷新时入口闪烁；加载状态由 `context/AppContext.jsx` 提供，`components/Navbar.jsx` 呈现。

`/by-length` 和 `/by-shape` 先展示正方形分类图卡片，再进入对应商品；预览图在后台 Product Studio → Categories 设置。Pages 的 slug 默认由标题生成，手动指定时保留自定义值；展示位置可将已发布内容加入 How to Use 下拉菜单或页脚两栏，切回 storefront 时会刷新导航。新页面需将 Status 设为 Published 才会公开显示。Pages 新增展示位置字段，部署前需按[数据库迁移说明](./docs/database-migrations.md)应用 `20261023_190000_add_page_placement`。Merchant Center feed 会把商品 Markdown 转为基础 HTML 格式输出；Google 各展示位置对格式的保留情况可能不同。Product Studio 批量删除会对关联记录提示二次确认。


导航栏人像图标进入 `/account`，支持邮箱密码登录、退出及查看本人邮箱下的订单。顾客由 `collections/Customers.ts` 管理，`Users` 仍为管理员账户。`components/CustomerAccount.jsx` 是顾客界面，`app/api/customer/` 负责独立的 HTTP-only Cookie 和订单查询；`lib/admin-access.ts` 保证顾客没有后台管理权限。

迁移顾客的旧密码哈希仅服务端可读，首次正确登录时由 `lib/legacy-customer-password.ts` 验证 WordPress bcrypt，并自动升级为 Payload 密码、删除旧哈希。使用轻量依赖 `bcryptjs`，不保存明文密码。迁移顾客可直接使用旧站密码登录，无需强制重设密码；用户已确认备份之后无需补迁移顾客或订单。当前不开放自助注册，登录问题可通过联系页面处理。备份内 1 个顾客和 10 笔订单已导入，详见 [顾客与订单迁移](./docs/customer-order-migration.md)。

订单复用原有字段，不保留旧站 ID、重复日期、付款方式原文、账单地址、客户保存地址或明细总额字段。订单号使用新站 `GN-…` 格式，日期使用 `createdAt`，商品和变体仅在准确匹配时关联；缺失商品保留名称 / 规格快照，`items.product` 允许为空。Customers 只保留登录资料及首次登录后清除的旧密码哈希。订单付款确认和发货通知由 `collections/Orders.ts` 调用 `lib/order-email.js` 经 Resend 发送；在订单中填写物流单号和可选 Tracking URL 后，顾客可以在账户或订单查询页查看并点击追踪。需要配置 `RESEND_API_KEY` 和已验证发件地址 `ORDER_EMAIL_FROM`；具体步骤见[电商配置指南](./docs/commerce-setup.md)。

导入命令默认只预览；只有 `--apply` 才写入当前 `.env.local`，不会触发付款、库存扣减或邮件。已执行 `20261020_132125_simplify_order_fields` 清理 migration；连接同一数据库时无需重跑。其他环境有旧版导入数据时，先按专项文档转换、部署精简后的兼容代码，再清理数据库字段。

### Payload schema 变更

新增或修改 collection / global 字段时：

1. 修改对应的 `collections/*.ts` 或 `globals/*.ts`。
2. 创建并检查数据库 migration；更新 `migrations/index.ts`。
3. 运行 `npx payload generate:types && npx payload generate:importmap` 更新生成文件。
4. 在独立的开发或测试数据库应用 migration，并验证旧数据和后台功能。
5. 按下面的兼容规则决定部署顺序，再部署代码。

只新增或编辑商品内容不需要数据库 migration。Payload Admin 的自定义组件若新增或改名，也要更新生成的 `importMap.js`。

本地开发库可以使用自动 schema push；已部署的 dev Preview 和 Production 使用正式 migration，同一数据库不混用两种方式。dev 只放测试数据，不导入正式客户或订单。`payload.config.ts` 明确只允许 development 自动 push。

## 生产数据库迁移与部署顺序

部署顺序取决于代码和数据库是否兼容；**每次有 schema migration 时，先在目标环境检查 migration 状态**。

- 新增字段或表，旧代码可以在迁移后继续运行，而新代码依赖新结构：先运行 migration，再部署代码。
- 新代码能同时兼容迁移前后的结构：先部署兼容代码，再运行 migration。
- 删除、重命名或改变字段含义：分阶段发布，先部署兼容新旧结构的代码，再迁移数据，最后部署依赖新结构的代码。

判断两个问题：迁移前新代码能否运行？迁移后旧代码能否运行？不确定时先查对应 PRD 和 migration，不能兼容就分阶段发布。

同一份 migration 文件只生成一次，随代码提交；先在 dev 执行并测试，再在 Production 执行。合并 Git 分支不会自动修改数据库。本次待上线的两项是订单 Tracking URL（`20261020_150000`）和允许变体 Length / Shape 为空（`20261020_170400`）；后者补齐现有仅尺码商品规则的数据库约束，不改已有规格、SKU 或库存。

查看 dev 状态并执行：

```bash
npm run migrate:preview -- status
npm run migrate:preview -- apply
```

Production migration 使用被 Git 忽略的 `.env.local` 中的无后缀变量。确认 `DATABASE_URL` 指向 Netlify Production、检查目标和待执行 migration 后：

```bash
npm run migrate:production -- status
npm run migrate:production -- apply
```

两个新命令会显示环境和数据库主机，强制使用迁移模式；缺少配置文件或必要变量就停止，也不会使用继承的 shell 变量补齐。遇到历史 schema push / 数据丢失提示时不要直接确认，要先核对结构和迁移记录。dev 的一次性基线整理及验证范围见 [数据库迁移说明](./docs/database-migrations.md)。单独运行 `npm run migrate` 仍会读取当前本地配置，不建议用于环境切换。

## 修改代码时

商品名称搜索入口位于全站导航，结果页为 `/search?q=商品名`；`components/ProductSearch.jsx` 通过 Payload 商品 API 分页查询已发布商品，`lib/product-search.js` 统一查询参数。搜索忽略大小写、支持名称片段，每页 24 件；无需数据库 migration。

先读 [AGENTS.md](./AGENTS.md) 和相关 PRD，再沿用现有 API、组件与业务逻辑。功能行为、重要目录、命令、环境变量或部署方式有变化时，同时用简短中文更新本 README；详细操作步骤和待办放在相应的 `docs/` 文件里，避免重复粘贴。
