# 顾客与订单迁移

**状态：顾客登录与旧密码兼容已实现，正式导入待完成。** 本文不代表线上迁移已执行；待办统一见 [PRD 首页](./prd.md#当前待办与开放讨论)。

## 已有功能

- `/account`：邮箱密码登录、退出、恢复浏览器会话、分页查看本人订单；访客仍可使用 `/my-orders`。
- Admin → Store → Customers：顾客账户与 Users 管理员账户分开。顾客不能管理商品、供应商、媒体、订单、运营配置或管理员账户。
- Cookie 为 `ginny-customer-token`，与后台 Cookie 分开；HTTP-only、SameSite=Lax，生产使用 Secure；会话两小时，退出会撤销服务端会话。
- 连续五次错误登录锁定十五分钟；未知邮箱与错误密码使用相同提示。
- 只读检查找到备份内约 55 MiB 的数据库，包含 1 个 administrator 和 1 个 customer，密码格式均为 WordPress bcrypt；只迁移顾客，管理员账户不导入新站 Customers。
- WooCommerce HPOS `wc_orders` 有 10 笔历史订单：7 笔 completed、3 笔 cancelled；3 笔关联注册账户、7 笔游客订单，账单邮箱均存在。订单日期范围为 2025-01-22 至 2025-11-29（GMT）。须与旧版 posts 订单副本核对，避免重复导入。
- 支持该备份的 `$wp$2…` bcrypt 和标准 bcrypt。首次用原密码成功登录后，通过 Payload API 生成新密码哈希、删除旧哈希；后续改密也清除旧哈希。其他格式需单独核验。

当前不开放自助注册；真实邮件服务和顾客重设密码页面尚未实现，界面提供联系客服入口。

## 数据导入流程（待完成）

1. 盘点备份中的注册顾客、游客订单、HPOS / 旧版订单表、订单项、退款与地址；仅输出数量和异常摘要。顾客明细及密码哈希不得进入 Git 或聊天。
2. 排除旧站管理员等非顾客角色。注册顾客按邮箱去重，保存 `legacyWordpressID`、姓名和旧密码哈希，生成随机初始 Payload 密码，不发送通知。完整顾客地址等资料需先确定字段映射。
3. 历史订单保留原订单号、日期、币种、金额、商品名称 / 规格快照、付款与履约状态。新站订单项当前要求商品关联；已删除或未迁移商品需要补充可保存历史快照的结构，不能随意关联其他商品。
4. 按旧用户 / 订单 ID 建立可重复执行的导入映射；遇到新站现有账户或订单冲突时列入异常清单，不直接覆盖。
5. 独立测试库试导入，核对账户数、各状态订单数、金额、明细、退款和商品关联，验证旧密码与订单隐私隔离。
6. 备份目标环境，按 schema migration 的兼容顺序发布，再通过 Payload API 导入；不触发付款、退款、库存扣减、折扣计数或顾客邮件。

备份只能恢复备份时点的数据。正式迁移前确认 2026-09-17 之后是否有新增、修改、取消或退款的订单，以及新增或改密的顾客；有变化需补齐增量。商品未变化不能证明订单和顾客也未变化。

## 本次代码部署

新增 migration：`20261020_120000_add_customers`，创建顾客与会话表、索引和 Payload 内部关联列，不导入 Woo 数据或改动现有订单、库存。

先在测试库验证；Production 先迁移再部署代码。具体环境确认和命令见根 README 的“生产数据库迁移与部署顺序”。`down` 保留顾客数据；不要为回退代码删除顾客表。

## 维护入口

| 文件 | 职责 |
| --- | --- |
| `collections/Customers.ts` | 顾客结构、权限、锁定与密码升级 Hook |
| `lib/legacy-customer-password.ts` | WordPress 密码验证与升级 |
| `lib/customer-session.ts` | 顾客 Cookie 和会话 |
| `app/api/customer/session/route.ts` | 登录、当前顾客和退出 |
| `app/api/customer/orders/route.ts` | 按认证顾客的邮箱读取必要的订单快照 |
| `components/CustomerAccount.jsx` | 商城账户界面 |
| `tests/customer-auth.test.ts` | 临时 SQLite 与合成顾客验证登录、升级、锁定、退出和订单隔离 |
| `tests/customer-access.test.ts` | 顾客被内部集合、全局配置和管理 API 拒绝的权限验证 |
