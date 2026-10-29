# 政策与运费维护

当前政策、About Us、Contact Us 和配送规则由仓库提供；Admin 显示预览和实际维护位置。数据库可用后，也可以按下文切到 Admin 来源，后台编辑的内容才会成为前台来源。每组同一时间只读取一处，避免编辑后前台没有变化。

## 修改位置

| 内容 | 仓库文件 | 前台预览 |
| --- | --- | --- |
| 隐私政策 | `content/pages/privacy-policy.md` | `/privacy-policy/` |
| 服务条款 | `content/pages/terms-conditions.md` | `/terms-conditions/` |
| 退换货 | `content/pages/refunds-returns.md` | `/refunds-returns/` |
| 配送说明 | `content/pages/shipping-policy.md` | `/shipping-policy/` |
| 关于我们 | `content/pages/about-us.md` | `/about-us/` |
| 联系我们 | `content/pages/contact-us.md` | `/contact-us/` |
| 运费、配送国家、备货与运输时效 | `config/shipping.json` | Admin → Store settings；配送政策页 |
| 品牌名称、客服邮箱、社交链接、默认 SEO | `config/site.json` | Admin → Store settings；Navbar / Footer / 页面 SEO |
| 首页主视觉、文案、Mystery Box 展示 | `config/homepage.json`、`public/site/` | Admin → Marketing Studio；首页 |
| Length / Shape 固定入口图 | `config/category-images.json`、`public/site/categories/` | Admin → Categories；分类入口 |
| 页面标题、SEO 简介与页脚位置 | `lib/repository-pages.ts` | 各页面与全站页脚 |

Admin → Website → Pages 顶部列出全部预览链接和 Markdown 路径；Commerce → Store settings 显示当前来源和维护位置。`repository` 模式下，六个核心页面禁止编辑、运费字段只读；切到 `admin` 后，Pages 和 Store settings 恢复读写，结账、国家选择、Feed 预览和配送政策页也读取对应 Admin 数据。没有删除旧字段或原记录。

## 运费规则

2026-10-29 用户确认的规则：全部 33 个现有配送国家使用同一份重量表。折后商品金额达到 USD 50（含）免邮；不足时按以下总重量计算：

| 总重量（kg） | 费用（USD） |
| --- | --- |
| 0.0001–0.2010 | 9 |
| 0.2011–0.6010 | 12 |
| ≥ 0.6011 | 免费 |

`shippingTiers` 中的最大重量包含端点，`null` 表示没有上限。每件商品重量仍在 Payload 商品中维护，缺失或无效时沿用既有的 0.2 kg 默认值。总重量按数量求和后向上取到四位小数，区间之间不要留空档或重叠；超过表中范围会阻止结账，不能默认为免邮。

仓库模式下品牌与默认 SEO 在 `config/site.json` 维护；Admin 模式在 Marketing Studio → Site settings 编辑。未确认的社交账号链接保持为空，不要猜测或填写非官方地址。仓库模式首页 Hero 来自 `config/homepage.json`；Admin 模式在 Marketing Studio → Homepage 编辑同一组文案与图片。图片本身不跳转商品，按钮链接由 `buttonHref` 决定。Mystery Box 当前关闭，启用前应提供确认可用的图片与对应说明。分类固定展示图在仓库模式由 `config/category-images.json` 映射到 `public/site/categories/*.webp`，Admin 模式使用 Product Dimensions 里的媒体映射。商品规格和分类项仍在 Product Dimensions Admin 中管理。仓库模式的 `hiddenShapes` 可暂时隐藏形状入口；当前 Almond 因此隐藏，移除该项后即可恢复。仓库模式下数据库不可用时分类导航仍回退显示默认 Length / Shape 入口与仓库图片。

## 配置文件使用与来源切换

所有 JSON 都使用标准 JSON 格式，不能加入注释；修改后先确认文件仍可解析，再部署。图片字段使用 `public/` 下的站点绝对路径，例如 `/site/categories/short-square.webp`，新图片需一并提交到仓库。

- `config/shipping.json`：币种、免邮门槛、重量费率、配送国家、备货与运输工作日。配送政策中的 `{{shippingDetails}}` 会自动生成说明，结账运费和国家也共用该配置。
- `config/site.json`：品牌名、客服邮箱、社交链接、默认 SEO 标题和简介、页眉与页脚 Logo 路径。
- `config/homepage.json`：Hero 文案、图片和按钮地址；`mysteryBox.enabled` 控制横幅是否展示。Hero 图片本身不跳商品。
- `config/category-images.json`：Length / Shape 分类值到 WebP 图片的映射。`hiddenShapes` 用于暂时隐藏形状入口；恢复 Almond 时删除数组中的 `"almond"`，然后重新部署。
- `content/pages/<slug>.md`：六个政策与介绍页面的正文。配送数字不要在 Markdown 里重复维护，使用 `{{shippingDetails}}` 占位符。

`config/content-sources.json` 记录各组配置当前采用的来源，仓库默认值均为 `repository`。现在每组已实现前台来源选择及对应 Admin 维护入口；但切换仍不能只改一个值就直接部署。**数据库 migration 和策略 Pages 内容同步是两件独立的事**：migration 只准备后台所需字段，不会创建或更新 Pages 正文。

### 切换到 Admin 前的操作

1. 先对目标数据库检查 migration 状态。Preview 使用 `.env.netlify-dev`：

   ```bash
   npm run migrate:preview -- status
   npm run migrate:preview -- apply
   ```

   Production 使用 `.env.local`：

   ```bash
   npm run migrate:production -- status
   npm run migrate:production -- apply
   ```

   `status` 是只读检查，确认目标数据库和待执行项包含 `20261029_120000_add_site_identity_settings` 后，再执行 `apply`。只需对将要切换的目标环境执行对应命令，不要把 Preview 和 Production 命令都当作一组必跑步骤。

2. 对同一个目标数据库预览 Pages 状态：

   ```bash
   npm run seed:pages
   ```

   此命令只检查六个策略页面，不会写入。确认连接的数据库环境正确后，运行 `npm run seed:pages -- --apply` 只补建缺失页面；已有 Admin 页面会保留，不会被覆盖。若要把已有页面正文也更新成 `content/pages/*.md` 仓库版本，先逐页核对并备份，再运行 `npm run seed:pages -- --apply --overwrite`；该操作会覆盖这六个页面的后台正文。

3. 在 Admin 检查重量费率、最低订单金额、国家、备货 / 运输工作日、首页文案和图片、品牌 / SEO，以及分类图片媒体映射。确认数据与仓库预览一致后，再把 `config/content-sources.json` 中需要切换的组改为 `admin` 并部署。
4. 部署后 Admin 才成为对应内容组的生效来源；恢复为仓库维护时，将对应值改回 `repository` 并重新部署。Admin 保存不会写回 Markdown/JSON 文件，两边不会自动同步。

`policies` 对应 Pages 集合；`shipping` 对应 Commerce → Store settings；`homepage` 和 `site` 对应 Marketing Studio → Homepage / Site settings；`categoryImages` 对应 Product Dimensions 分类图片配置。各组可以独立切换。当前保持 `repository`，不影响数据库断开时静态内容和结账配置可用。切到 `admin` 后如果数据库断开，这些后台来源内容就无法读取，这是 Admin 来源的预期依赖。

`config/shipping.json` 中 `handlingBusinessDays` 为发货前备货 5–10 个工作日；`transitBusinessDays` 为发货后运输 7–15 个工作日，预计合计 12–25 个工作日。Admin 模式可在 Store settings 编辑相同工作日字段。保存后会更新政策页、购物车 / 结账时效提示。当前没有启用最低订单金额；币种维持 USD、商品价格含税，结账不额外加税。

`availableCountries` 保存支持的两位国家代码，国家名称取自 `lib/countries.js`。Checkout、国家 API、Feed 预览与运费政策均读取当前所选来源。商品 Feed 继续输出每件商品的 `shipping_weight`；Google Merchant Center 的账户配送设置不会自动同步，需手动保持国家、金额免邮门槛、费率、备货与运输时间一致。不要将 7–15 个工作日填写为包含备货的全部配送时间。Google 对多维配送表和一致性的说明见[官方配送设置文档](https://support.google.com/merchants/answer/12577710)。

配送 Markdown 的 `{{shippingDetails}}` 是固定占位符，会从 `config/shipping.json` 生成运费表、免邮条件、时效和国家名单。修改费用时只改 JSON，避免在正文中手写第二份数字。

## 从 WooCommerce 迁移的内容检查

- 隐私、退换货和条款以旧站公开页面存档为基础；About Us 和 Contact Us 沿用现有开发库内容。实时旧站返回 500，未能与生产库最新正文核对。
- 删除已失效的 WooCommerce 托管说明，改为当前 PayPal 付款、游客结账、账户与 `/my-orders/` 查询入口。
- 修正旧版“收集信用卡资料”和“内容可能明文传输”的描述：当前使用 HTTPS；PayPal / Card Fields 处理付款，店铺保存付款引用与状态，不保存完整卡号和安全码。
- 补充现有联系表单、顾客登录 Cookie、购物车本地存储、Newsletter 订阅资料及业务服务商所需的信息处理说明。
- 配送政策根据本次确认的规则整理，不照搬不可用的旧配送正文。
- 保留旧退换货的按单制作、24 小时内联系取消、到货后 7 天内反映质量问题、5–7 个工作日退款等规则；本次没有重新制定这些业务承诺。
- **仍需运营 / 法律核对**：旧条款第 18 节写“法国法律”，没有证据支持改成其他法域，因此原样保留；还需确认该适用法律是否符合实际经营主体。退货运费承担、退货地址以及发货地没有足够已确认资料，本次不编造；正式提交审核前应补充实际安排并与 GMC 一致。本次不是完整法律合规审查。

## 修改与验收

1. 修改上述 Markdown 或 JSON；金额、重量和时效只改对应配置。
2. 运行 `node --import tsx/esm --test tests/repository-settings.test.ts tests/shipping-tiers.test.ts tests/product-pricing-routes.test.ts tests/paypal-checkout-route.test.ts tests/customer-access.test.ts tests/admin-navigation.test.ts`、`npm run typecheck` 和 `npm run build`。
3. 部署后查看六个前台页面、Admin 两处预览和一笔未付款结账报价；核对 GMC 配送配置。
4. 验证数据库不可连接时六个页面仍返回 200，原始 HTML 有正文、SEO 和六个页脚链接。

六页使用独立静态路由，`components/RepositoryPage.jsx` 共用现有 Markdown 渲染方式；`lib/repository-page-content.ts` 只读白名单内的本地文件。`next.config.mjs` 将 Markdown 纳入部署文件追踪。普通 CMS 页面继续走原 `[slug]` 路由。商品、库存、折扣、订单、登录及联系表单提交仍依赖数据库；本次保证政策与规则展示可用，不意味着断库时仍可下单。

## 本地验证记录（2026-10-29）

- 上述聚焦测试 27 项通过，覆盖重量边界、向上取整、折后免邮、真实报价 / 订单 / PayPal 金额一致性、保留路径限制、后台预览渲染及国家 API 无数据库依赖。
- `npm run typecheck`、`npm run build`、`npx payload generate:types` 和 `npx payload generate:importmap` 通过；六个核心路由显示为静态生成。相关文件 ESLint 无错误，Checkout 原有 `set-state-in-effect` 警告仍保留。
- 使用指向 `127.0.0.1:1` 的无效开发数据库地址运行生产构建：六个核心页面均返回 HTTP 200，原始 HTML 包含正文、SEO 及六个固定页脚链接；国家接口返回 HTTP 200 和 33 个国家。浏览器检查了配送政策的费率表和备货 / 运输说明。
- 未部署到生产、未修改 GMC、未做真实付款和登录后的 Admin 人工走查；Admin 预览以组件服务端渲染测试验证。
