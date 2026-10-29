# 电商配置指南

**状态：** 本文说明当前已有功能的常用配置方法，不是验收记录。功能完成情况和待办见[文档索引](./README.md)及[PRD 首页待办](./prd.md#当前待办与开放讨论)。PayPal Card Fields 的完整变量说明以[PayPal 专项文档](./paypal-advanced-checkout.md)为准。

## PayPal 付款

Checkout 使用 PayPal Orders v2。初次集成应使用 Sandbox；本地、Preview 和 Production 使用各自环境的变量，不要把凭证写进 Git 或发到聊天中。银行卡收款还要求商户账户获批并开启 Card Fields。

部署后，在 PayPal Developer 创建订阅 `PAYMENT.CAPTURE.COMPLETED` 的 Webhook，并将地址设为 `https://你的域名/api/checkout/paypal-webhook`。Webhook ID 要与相应 Sandbox / Live 应用匹配。

中国大陆商户切换 Live 前，确认账户已开通 PayPal 中国跨境收款 / API 产品，并检查收款偏好支持商店使用的币种，否则付款可能处于 Pending。

## 配送与税费

配送规则统一维护在仓库 `config/shipping.json`，**Admin → Store settings**（`/admin/globals/store-settings`）提供只读预览和维护位置。修改后需重新部署。折后商品金额达到 USD 50 免邮；不足时按总重量收取：0.0001–0.2010 kg 为 USD 9，0.2011–0.6010 kg 为 USD 12，≥0.6011 kg 免费。全部现有配送国家使用同表；备货 5–10 个工作日，运输 7–15 个工作日，预计合计 12–25 个工作日。

重量范围使用 kg，订单总重量按商品每件重量乘购买数量计算并向上取到四位小数；没有匹配费率时，Checkout 会阻止下单。商品价格含税，Checkout 不会再次加税。政策 Markdown、Admin 查看入口及 GMC 核对步骤见[政策与运费维护](./store-policies.md)。

## 商品规格与批量编辑

在 **Admin → Product Studio → Products** 管理商品。当前变体编辑器支持明确选择 Length + Shape 配对和 Size；每个 Variant 可维护 SKU、价格覆盖、库存跟踪和启用状态。Variant 价格留空时沿用商品价格。新增 Color、Pack quantity 等通用选项与变体生成、前台选择及结账校验列在[PRD 待办](./prd.md#当前待办与开放讨论)，完成验收前不要依赖其正式售卖。

Products Payload 列表可多选文档并批量编辑共同字段；Product Studio 的 Spreadsheet 支持商品字段筛选和批量编辑。现有内置工作流不要求安装 Payload Import/Export 插件。

## Google Merchant Center Feed

商品 Feed 地址为 `/api/merchant/feed.xml`。Production 环境需设置 `NEXT_PUBLIC_SITE_URL=https://ginnynana.com`，让商品链接和图片使用正式域名。没有主图的商品不会进入 Feed。Merchant Center 配送费需单独配置，并与仓库 `config/shipping.json` 的规则保持一致；两边设置不会自动同步。商品支持选填 GTIN、MPN 和 Google 商品分类；手工商品没有真实标识时不要编造。

## 订单与折扣

顾客可从导航栏人像图标进入 `/account` 登录、查看本人订单；账户在 **Admin → Store → Customers** 管理，管理员仍使用 Users。旧站顾客与历史订单尚未导入，密码兼容及发布顺序见[顾客与订单迁移](./customer-order-migration.md)。

Paid 和 Pending 订单保存在 **Admin → Orders**。PayPal 确认后更新付款状态；履约状态、物流追踪号及可选 Tracking URL 可在订单中维护。顾客可在账户或通过订单号和结账邮箱进入 **Order status** 查看订单；填写追踪链接后可点击进入承运商页面。

订单从未付款变为 Paid 时，系统发送付款确认邮件；订单设为 Shipped，或已发货订单的追踪号 / 链接更改时，系统发送发货通知。邮件使用 Resend；在 Netlify Production 环境变量中配置 `RESEND_API_KEY` 和 `ORDER_EMAIL_FROM`（格式如 `Ginny Nana <orders@你的已验证域名>`），并在 Resend 中完成发信域名 DNS 验证。Preview / Branch Deploy 可配置 `_PREVIEW` 后缀变量，本地开发使用 `_DEVELOPMENT` 后缀。未配置邮件服务时订单仍正常保存，但邮件会跳过；发送失败会记入函数日志，不会回滚付款或订单状态。已导入的旧订单不会补发邮件。

折扣码在 **Admin → Discounts** 创建；Checkout 在服务端重新计算折扣，PayPal 确认付款后才增加使用次数。
