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

脚本位于 `scripts/migrate-woocommerce-customers-orders.mts`，默认 dry-run；`--source-only` 仅检查备份，`--apply` 才写入当前 `.env.local` 数据库。脚本只读取 HPOS 订单，通过 Payload Local API 写数据，并按 WooCommerce 用户 ID、订单号实现重复运行去重。

2026-09-17 备份导入结果：1 个顾客、10 笔订单（7 completed、3 cancelled）、36 个商品明细，总金额 USD 767.52。预览和导入后复核均无账户 / 订单号冲突、缺少账单邮箱、必要配送地址缺项或金额核对差异；复核显示 1 个顾客及 10 笔订单均已存在。订单保留商品名称和规格快照；旧商品未强行关联到新站商品。此导入不会触发付款、退款、库存扣减或顾客邮件。

执行前已应用增量 migration `20261020_122640_add_woocommerce_customer_order_history_fields`，只增加历史顾客 / 订单所需字段、索引和状态选项，并放宽历史商品关联，不删除现有业务数据。Payload 因此前的 dev-mode schema push 显示通用数据丢失警告；用户确认后才继续，本次 migration 成功。

备份只能恢复备份时点的数据。需确认 2026-09-17 之后是否有新增、修改、取消或退款的订单，以及新增或改密的顾客；有变化需补齐增量。商品未变化不能证明订单和顾客也未变化。管理员账户未迁移；顾客首次登录可用旧密码，成功后系统自动升级密码哈希。初始随机密码不会发送给顾客。

## 本次代码部署

此前 migration `20261020_120000_add_customers` 创建顾客与会话表。本次历史字段 migration 已在当前 `.env.local` 数据库成功执行。若部署目标是另一环境，需先检查该环境 migration 状态，并按根 README 的部署顺序单独执行 migration；不要假定 `.env.local` 与线上环境相同。两个 migration 的 `down` 都保留顾客 / 订单数据。

## 维护入口

| 文件 | 职责 |
| --- | --- |
| `collections/Customers.ts` | 顾客结构、权限、锁定与密码升级 Hook |
| `lib/legacy-customer-password.ts` | WordPress 密码验证与升级 |
| `lib/customer-session.ts` | 顾客 Cookie 和会话 |
| `app/api/customer/session/route.ts` | 登录、当前顾客和退出 |
| `app/api/customer/orders/route.ts` | 按认证顾客的邮箱读取必要的订单快照 |
| `scripts/migrate-woocommerce-customers-orders.mts` | 解析 WPress 备份、预览差异或幂等导入顾客与 HPOS 订单 |
| `migrations/20261020_122640_add_woocommerce_customer_order_history_fields.ts` | 为历史地址、订单来源、明细快照和顾客关联添加兼容字段 |
| `components/CustomerAccount.jsx` | 商城账户界面 |
| `tests/customer-auth.test.ts` | 临时 SQLite 与合成顾客验证登录、升级、锁定、退出和订单隔离 |
| `tests/customer-access.test.ts` | 顾客被内部集合、全局配置和管理 API 拒绝的权限验证 |
