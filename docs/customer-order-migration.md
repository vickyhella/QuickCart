# 顾客与订单迁移

**状态：当前 `.env.local` 数据库已导入并核验；备份之后的增量仍待核对。** 生产环境是否使用同一数据库需由环境配置确认；本次没有推送或部署代码。长期待办统一见 [PRD 首页](./prd.md#当前待办与开放讨论)。

## 已有功能

- `/account`：邮箱密码登录、退出、恢复浏览器会话、分页查看本人订单；访客仍可使用 `/my-orders`。
- Admin → Store → Customers：顾客账户与 Users 管理员账户分开。顾客不能管理商品、供应商、媒体、订单、运营配置或管理员账户。
- Cookie 为 `ginny-customer-token`，与后台 Cookie 分开；HTTP-only、SameSite=Lax，生产使用 Secure；会话两小时，退出会撤销服务端会话。
- 连续五次错误登录锁定十五分钟；未知邮箱与错误密码使用相同提示。
- 只读检查找到备份内约 55 MiB 的数据库，包含 1 个 administrator 和 1 个 customer，密码格式均为 WordPress bcrypt；只迁移顾客，管理员账户不导入新站 Customers。
- WooCommerce HPOS `wc_orders` 有 10 笔历史订单：7 笔 completed、3 笔 cancelled；3 笔关联注册账户、7 笔游客订单，账单邮箱均存在。订单日期范围为 2025-01-22 至 2025-11-29（GMT）。只使用 HPOS 作为来源，避免与旧版 posts 副本重复。
- 支持该备份的 `$wp$2…` bcrypt 和标准 bcrypt。首次用原密码成功登录后，通过 Payload API 生成新密码哈希、删除旧哈希；后续改密也清除旧哈希。其他格式需单独核验。

当前不开放自助注册；真实邮件服务和顾客重设密码页面尚未实现，界面提供联系客服入口。

## 数据导入流程与本次结果

脚本位于 `scripts/migrate-woocommerce-customers-orders.mts`，默认 dry-run；`--source-only` 仅检查备份，`--apply` 才写入当前 `.env.local` 数据库。脚本只读取 HPOS 订单，通过 Payload Local API 写数据。顾客按邮箱去重，已存在的账号不会覆盖密码；订单使用符合新站格式的稳定 `GN-…` 号码重复运行去重，不需要保存旧站 ID 字段。

2026-09-17 备份导入结果：1 个顾客、10 笔订单（7 completed、3 cancelled）、36 个商品明细，总金额 USD 767.52。预览和导入后复核均无账户 / 订单号冲突、缺少账单邮箱、必要配送地址缺项或金额核对差异。此导入不会触发付款、退款、库存扣减或顾客邮件。

首次导入曾通过 `20261020_122640_add_woocommerce_customer_order_history_fields` 添加来源字段和地址字段。按用户确认的精简方案，之后已将数据转换回现有订单结构，再执行 `20261020_132125_simplify_order_fields` 删除这些冗余字段及 `Customers.legacyWordpressID`。首次登录所需的隐藏旧密码哈希保留。

## 精简后的字段规则

- 订单和明细的 Payload ID 保持不变；仅把旧数字订单号转换成新站 `GN-…` 格式。订单日期沿用 `createdAt`，付款方式使用 `paymentProvider` / `paymentReference`。
- 复用原有 `shippingAddress`、`unitPrice`、`subtotal`、`discountTotal` 和 `total`；单价保存折扣前金额，折扣只计算在订单折扣里，避免重复扣减。不保留账单地址、客户地址簿或明细专用金额字段。
- 31 条商品明细已关联当前商品，24 条同时准确匹配当前变体。无法准确匹配变体时清空旧变体 ID，保留规格文字；有数量选项但新商品没有该选项的 Mystery Box 不强行匹配尺码变体。
- 5 条明细对应的四款商品在新站不存在：Dual Stars（2 条）、Haze Butterfly、Coco Brown Lovely Heart、Brown Leopard Cat Eyes。经用户确认，这些明细保留名称 / 规格快照，商品关联为空。
- `items.product` 允许为空是相对于原订单字段的唯一放宽；付款状态恢复原选项。三笔旧取消订单使用 `paymentStatus=pending` 和 `fulfillmentStatus=cancelled`，不表示已付款。
- 下单、支付、库存和营销逻辑未修改；账户订单仍按认证顾客邮箱查询。

备份只能恢复备份时点的数据。需确认 2026-09-17 之后是否有新增、修改、取消或退款的订单，以及新增或改密的顾客；有变化需补齐增量。商品未变化不能证明订单和顾客也未变化。管理员账户未迁移；顾客首次登录可用旧密码，成功后系统自动升级密码哈希。初始随机密码不会发送给顾客。

## 本次代码部署

当前 `.env.local` 已完成转换和清理 migration，同库部署无需再运行。其他环境先检查 migration 状态；不要假定 `.env.local` 与线上环境相同。

如果另一环境也有首次导入留下的数字订单号，在该目标环境配置下先预览，再确认写入：

```bash
npm run migrate:woocommerce-data -- --normalize-existing /path/to/backup.wpress
npm run migrate:woocommerce-data -- --normalize-existing --apply /path/to/backup.wpress
```

脚本核对原订单日期、金额、明细名称和数量后才转换，保留已有订单 / 明细 ID。转换完成后部署精简后的代码（它兼容仍有冗余列的数据库），再执行清理 migration。该 migration 会检查订单号、日期、金额和变体关联，未转换完整会拒绝删除字段。旧版依赖来源字段的代码不能在清理后继续使用。

不修改已执行 migration 的历史文件。清理 migration 的 `down` 只能恢复字段结构，不能恢复删除的旧站原始值；完整原资料仍在 WPress 备份中。

## 维护入口

| 文件 | 职责 |
| --- | --- |
| `collections/Customers.ts` | 顾客结构、权限、锁定与密码升级 Hook |
| `lib/legacy-customer-password.ts` | WordPress 密码验证与升级 |
| `lib/customer-session.ts` | 顾客 Cookie 和会话 |
| `app/api/customer/session/route.ts` | 登录、当前顾客和退出 |
| `app/api/customer/orders/route.ts` | 按认证顾客的邮箱读取必要的订单快照 |
| `scripts/migrate-woocommerce-customers-orders.mts` | 解析 WPress 备份、预览差异或幂等导入顾客与 HPOS 订单 |
| `migrations/20261020_132125_simplify_order_fields.ts` | 在数据转换检查通过后清理冗余字段，保留原有业务字段 |
| `tests/woocommerce-order-migration.test.ts` | 验证号码去重、商品 / 变体匹配、折扣和精简字段映射 |
| `components/CustomerAccount.jsx` | 商城账户界面 |
| `tests/customer-auth.test.ts` | 临时 SQLite 与合成顾客验证登录、升级、锁定、退出和订单隔离 |
| `tests/customer-access.test.ts` | 顾客被内部集合、全局配置和管理 API 拒绝的权限验证 |
