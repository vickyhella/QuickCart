# Ginny Nana 电商项目

这是 Ginny Nana 的电商网站和运营后台。网站使用 Next.js，Payload CMS 管理商品、媒体、订单和运营内容；生产数据存储在 Neon PostgreSQL，媒体存储在 Cloudflare R2。

## 本地启动

需要 Node.js 和 npm。首次在本地运行：

1. 安装依赖：`npm install`
2. 复制环境变量模板：`cp .env.example .env.development.local`
3. 设置本地 `PAYLOAD_SECRET_DEVELOPMENT`。如需连接独立开发数据库，设置 `DATABASE_URL_DEVELOPMENT`；未设置时使用本地 SQLite。开发环境的 R2 配置可选。
4. 启动：`npm run dev`
5. 打开网站 `http://localhost:3000`，后台为 `http://localhost:3000/admin`。Product Studio 在 `/admin/collections/products/studio`。

不要把密钥提交到 Git。开发环境变量放在被忽略的 `.env.development.local`；Preview 使用 `*_PREVIEW` 变量，Production 使用无后缀变量。详见 [.env.example](./.env.example) 和 [环境配置实现](./lib/environment-config.ts)。

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

## 目录与关键文件

| 路径 | 作用；通常什么时候修改 |
| --- | --- |
| `app/(storefront)/` | 顾客访问的页面：主页、商品详情、分类筛选、购物车、结账、订单状态。调整页面或路由时从这里开始。 |
| `components/` | Storefront 共用组件，如导航栏、商品卡、购物车和支付按钮。 |
| `app/studio/product-studio.tsx` | Product Studio 的商品列表和编辑界面。 |
| `app/marketing-studio/` | Marketing Studio 的路由入口。 |
| `app/(payload)/components/` | Payload 后台的自定义界面，如 Product Studio、Categories、Spreadsheet、Suppliers 和媒体工具。 |
| `app/(payload)/admin/[[...segments]]/` | Payload Admin 路由；`importMap.js` 把 Payload 配置中的组件路径连接到实际组件。 |
| `app/api/` | Next.js 服务端 API：商品后台、媒体、Checkout / PayPal、Merchant / Pinterest Feed 和定时任务。改 API 时同时检查调用它的页面与测试。 |
| `collections/` | Payload 集合的数据结构、字段、权限和 Hook。商品、Variant、Supplier、Media、Order 等 schema 在这里。 |
| `globals/` | Payload 单例配置数据，如配送设置、营销设置和商品规格维度。 |
| `payload.config.ts` | 注册 Payload collections / globals、数据库、R2 文件存储、Admin 组件和类型输出位置。 |
| `payload-types.ts` | Payload 根据 schema 生成的 TypeScript 类型；修改 schema 后重新生成，不要手工维护。 |
| `migrations/` | Payload 数据库迁移文件及注册表。只有数据库结构或需要迁移的数据变化时才新增。 |
| `lib/` | 可复用业务逻辑：价格、Variant 校验、库存、配送、PayPal、媒体命名和清理等。复杂逻辑优先放在这里，并由 API / 页面调用。 |
| `context/AppContext.jsx` | Storefront 购物车状态和商品加入购物车逻辑。 |
| `scripts/` | 手动运行的数据导入或迁移脚本；运行前确认当前环境和目标数据库。 |
| `tests/` | 业务逻辑和 API 行为测试；功能变更时补充对应的聚焦测试。 |
| `assets/`、`public/` | 项目图标、品牌素材和公开静态文件。 |
| `docs/` | 产品要求、配置说明、上线验收和已知风险；从 [文档索引](./docs/README.md) 开始。 |
| `AGENTS.md` | 项目开发约定，包括架构边界、测试和文档更新规则。 |

### Payload schema 变更

新增或修改 collection / global 字段时：

1. 修改对应的 `collections/*.ts` 或 `globals/*.ts`。
2. 创建并检查数据库 migration；更新 `migrations/index.ts`。
3. 运行 `npx payload generate:types && npx payload generate:importmap` 更新生成文件。
4. 在独立的开发或测试数据库应用 migration，并验证旧数据和后台功能。
5. 按下面的兼容规则决定部署顺序，再部署代码。

只新增或编辑商品内容不需要数据库 migration。Payload Admin 的自定义组件若新增或改名，也要更新生成的 `importMap.js`。

## 生产数据库迁移与部署顺序

部署顺序取决于代码和数据库是否兼容；**每次有 schema migration 时，先在目标环境检查 migration 状态**。

- 新增字段或表，旧代码可以在迁移后继续运行，而新代码依赖新结构：先运行 migration，再部署代码。
- 新代码能同时兼容迁移前后的结构：先部署兼容代码，再运行 migration。
- 删除、重命名或改变字段含义：分阶段发布，先部署兼容新旧结构的代码，再迁移数据，最后部署依赖新结构的代码。

判断两个问题：迁移前新代码能否运行？迁移后旧代码能否运行？不确定时先查对应 PRD 和 migration，不能兼容就分阶段发布。

查看 Production migration 状态：

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npx payload migrate:status
```

确认新增 migration 尚未运行，且部署方案要求先迁移后，应用到 Production：

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npm run migrate
```

若状态显示所有 migration 都已运行，就不需要重跑。单独运行 `npm run migrate` 使用当前本地环境变量，**不要用它代替 Production 迁移命令**。不要仅凭开发环境 schema push 提示判断生产库状态。

## 修改代码时

先读 [AGENTS.md](./AGENTS.md) 和相关 PRD，再沿用现有 API、组件与业务逻辑。功能行为、重要目录、命令、环境变量或部署方式有变化时，同时用简短中文更新本 README；详细操作步骤和待办放在相应的 `docs/` 文件里，避免重复粘贴。
