# 电商配置指南

**状态：** 本文说明当前已有功能的常用配置方法，不是验收记录。功能完成情况和待办见[文档索引](./README.md)及[PRD 首页待办](./prd.md#当前待办与开放讨论)。PayPal Card Fields 的完整变量说明以[PayPal 专项文档](./paypal-advanced-checkout.md)为准。

## PayPal 付款

Checkout 使用 PayPal Orders v2。初次集成应使用 Sandbox；本地、Preview 和 Production 使用各自环境的变量，不要把凭证写进 Git 或发到聊天中。银行卡收款还要求商户账户获批并开启 Card Fields。

部署后，在 PayPal Developer 创建订阅 `PAYMENT.CAPTURE.COMPLETED` 的 Webhook，并将地址设为 `https://你的域名/api/checkout/paypal-webhook`。Webhook ID 要与相应 Sandbox / Live 应用匹配。

中国大陆商户切换 Live 前，确认账户已开通 PayPal 中国跨境收款 / API 产品，并检查收款偏好支持商店使用的币种，否则付款可能处于 Pending。

## 配送与税费

在 **Admin → Store settings**（`/admin/globals/store-settings`）中先配置可选条件：订单金额达到指定值免运费（默认 USD 50），以及订单低于最低金额时不允许配送。然后选择配送费类型：Free shipping、Flat rate、Price、Weight、Number of items 或 Advanced cost table；页面只显示所选方式需要的字段。

重量范围使用 kg，订单总重量按商品每件重量乘购买数量计算。Advanced cost table 按选定的两个维度匹配费率行；低于最低金额或没有匹配费率时，Checkout 会阻止下单。商品价格含税，Checkout 不会再次加税。

## 商品规格与批量编辑

在 **Admin → Product Studio → Products** 管理商品。当前变体编辑器支持明确选择 Length + Shape 配对和 Size；每个 Variant 可维护 SKU、价格覆盖、库存跟踪和启用状态。Variant 价格留空时沿用商品价格。新增 Color、Pack quantity 等通用选项与变体生成、前台选择及结账校验列在[PRD 待办](./prd.md#当前待办与开放讨论)，完成验收前不要依赖其正式售卖。

Products Payload 列表可多选文档并批量编辑共同字段；Product Studio 的 Spreadsheet 支持商品字段筛选和批量编辑。现有内置工作流不要求安装 Payload Import/Export 插件。

## Google Merchant Center Feed

商品 Feed 地址为 `/api/merchant/feed.xml`。Production 环境需设置 `NEXT_PUBLIC_SITE_URL=https://ginnynana.com`，让商品链接和图片使用正式域名。没有主图的商品不会进入 Feed。Merchant Center 配送费需单独配置，并与 Payload 的配送规则保持一致；两边设置不会自动同步。商品支持选填 GTIN、MPN 和 Google 商品分类；手工商品没有真实标识时不要编造。

## 订单与折扣

Paid 和 Pending 订单保存在 **Admin → Orders**。PayPal 确认后更新付款状态；履约状态和物流追踪号可在订单中维护。顾客可通过订单号和结账邮箱进入 **Order status** 查看付款 / 履约状态及物流追踪号。折扣码在 **Admin → Discounts** 创建；Checkout 在服务端重新计算折扣，PayPal 确认付款后才增加使用次数。
