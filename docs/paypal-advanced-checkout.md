# PayPal 高级银行卡收款

保留现有 PayPal 跳转付款，银行卡使用 PayPal JavaScript SDK v5 Card Fields（官方仍支持）。不安装新的支付依赖，不迁移 Payload 订单。参考 Payload 官方支付适配器的创建支付、验证支付、完成订单流程；其电商插件目前仅内置 Stripe，项目未安装该插件。

## 配置

本地在被 Git 忽略的 `.env.development.local` 中配置以下变量，重启开发服务：

```dotenv
PAYPAL_ENV_DEVELOPMENT=sandbox
PAYPAL_CLIENT_ID_DEVELOPMENT=你的沙箱应用ClientID
PAYPAL_CLIENT_SECRET_DEVELOPMENT=你的沙箱应用Secret
PAYPAL_WEBHOOK_ID_DEVELOPMENT=你的沙箱WebhookID
PAYPAL_CARD_PAYMENTS_ENABLED_DEVELOPMENT=true
```

Preview 使用 `_PREVIEW` 后缀；Production 使用无后缀变量，`PAYPAL_ENV=live` 并填写同一获批商户 Live 应用的凭证。Sandbox 与 Live Webhook ID 不通用。Secret 仅存服务端，不能使用 `NEXT_PUBLIC_` 前缀。

在对应 PayPal 应用注册 HTTPS Webhook：`https://你的域名/api/checkout/paypal-webhook`，订阅 `PAYMENT.CAPTURE.COMPLETED`。本地联调需要可接收通知的 HTTPS 地址。填写返回的 Webhook ID 后重新部署或重启。

未配置凭证或开关关闭时不加载银行卡表单。SDK 判断账号/买家不符合资格或加载失败时提示使用 PayPal。开关不等于商户权限获批。

## 支付流程

- 卡号、有效期、安全码和持卡人姓名在 PayPal 托管字段中输入，不提交到本网站服务端。
- `/api/checkout` 接收 `paymentMethod: 'card'`，继续从 Payload 读取商品、运费和优惠，服务端计算金额，创建本地订单及 PayPal 订单。银行卡请求启用 `SCA_WHEN_REQUIRED` 验证。
- SDK 获批后调用同源 POST `/api/checkout/paypal-capture`；服务端核实本地关联、订单金额和币种，使用固定请求 ID 扣款，仅在扣款 COMPLETED 后完成订单。
- PayPal 跳转回调及签名验证通过的 Webhook 复用相同支付校验。扣款结果不明确时阻止页面再次付款，提示联系商家核查，避免盲目重付。

## 添加凭证后必须联调

- PayPal 钱包付款原有流程、取消与失败。
- 银行卡成功、无效卡、银行拒绝、3D Secure 成功/失败/取消。
- 缺少联系方式或地址不能创建订单；修改前端金额不能改变服务端价格。
- SDK 加载失败或不符合资格时，PayPal 仍能使用。
- 付款期间重复点击、刷新回调、Webhook 重试、付款后立即关闭页面。
- 核对 PayPal 实收金额、币种与后台订单，优惠使用次数及库存仅处理一次。

没有凭证时只能进行模拟与静态检查，无法证明账号权限、银行验证和真实扣款成功。

## 现有订单完成逻辑限制

项目既有 `markOrderPaid` 对已经完成的订单会跳过重复处理，但付款标记、优惠次数和库存更新尚非一个原子事务；并发回调或更新中途出错存在重复或遗漏库存处理风险（PRD 已记录）。本次未迁移订单模型，正式上线前必须处理并验证这项限制，不能仅凭模拟测试开放收款。

## 官方参考

- https://developer.paypal.com/docs/checkout/advanced/integrate/
- https://payloadcms.com/docs/ecommerce/payments
