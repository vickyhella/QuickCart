# 数据库迁移与环境隔离

dev 分支部署使用 Preview Neon / R2；main 部署使用 Production Neon / R2。migration 只修改对应数据库，不复制业务数据、不操作 R2。客户与历史订单不导入 dev。

## 日常流程

1. 在 dev 修改 Payload 字段，生成并检查 migration SQL、JSON schema 快照和 `migrations/index.ts`。同一份 migration 不要按环境重复生成，也不要修改已执行的历史 migration。
2. 执行 `npm run migrate:preview -- status`，确认目标和待执行项，再执行 `npm run migrate:preview -- apply`。省略 action 默认只检查。
3. 测试后台保存、已有数据兼容性，以及相关业务功能。
4. 确认 Production 目标并备份。对兼容旧代码的新增字段 / 放宽约束，先在正式库运行同一份 migration，再将 dev 合并到 main 并部署。删除或重命名字段需另做分阶段兼容方案。

Preview 命令只读取 `.env.netlify-dev` 的 `*_PREVIEW` 值；Production 命令读取 `.env.local` 的无后缀值。两个文件均被 Git 忽略。配置文件或必需变量缺失即停止，不使用继承的 shell 变量补齐缺项；命令固定 `NODE_ENV=production` 并显式选择运行环境，避免本地开发自动 push。

本项目约定 `.env.local` 保存 Netlify Production 对应的无后缀变量。运行 `migrate:production` 前，确认其中的 `DATABASE_URL` 指向正式库；脚本会显示数据库主机供核对。Netlify 构建仍是 `npm run build`，不会自动修改数据库。

## 2026-10-21：dev 基线与本次升级

Preview 最初通过 schema push 初始化，已有完整结构和一个管理员，但只有 `dev / batch=-1` 记录。直接重跑旧 migration 会重复建字段，且早期历史没有从空库建表的初始 migration。

这次对 Preview 进行了完整 schema 核对：字段、类型、可空规则、枚举、索引、约束与当前 Payload 配置一致；Drizzle 报告的数值 / JSONB 默认值差异逐项在 PostgreSQL 中验证为语义等价，没有应用其生成的 SQL。

核对后，历史截至 `20261020_132125_simplify_order_fields` 的 14 项登记为 **基线（batch=0）**，并在同一事务中移除 Preview 的旧 `dev / batch=-1` 标记。这表示结构已由初始化实现，不表示重新执行过旧 SQL。管理员和现有记录保留，不回放旧订单导入或字段删除操作。随后两项升级通过正式 migration 执行：

| migration | 修改 | 安全性 |
| --- | --- | --- |
| `20261020_150000_add_order_tracking_url` | 订单增加可为空的 `tracking_url` | 已存在时跳过，不改物流单号或订单 |
| `20261020_170400_allow_size_only_variants` | 变体 `length`、`shape` 允许为空 | 不改现有规格、价格、SKU、库存；与已有 Mystery Box 仅尺码验证规则配合 |

最新 JSON 快照包含以上结构，避免下次生成 migration 再次添加 Tracking URL。Length / Shape 的反向 migration 在已有空值时由 PostgreSQL 拒绝，不能为回滚而自动填假规格。

**不要回滚到 batch=0 或对该库执行 `migrate:reset` / `migrate:fresh`。** 基线不是可以反向重放的安装过程。以后只执行新增 migration；历史基线不要重复登记。新建另一套空数据库时也不能直接跑这套历史 SQL，应单独准备初始 schema / 基线。

## 验证方式

`tests/schema-migrations.test.ts` 可连接测试 PostgreSQL，在独立临时 schema 中创建合成数据，按升级前约束测试这两份真实 migration。测试覆盖已有记录保留、重复执行、写入仅尺码变体、保存物流链接，以及存在空规格时拒绝反向迁移；整个事务最终回滚，不触及 public 的商品、订单或客户。

测试连接通过 `MIGRATION_TEST_DATABASE_URL` 显式提供；未提供时仅跳过 PostgreSQL 集成部分，不会自行读取正式库。环境选择和缺少变量时停止的规则由 `tests/migration-environment.test.ts` 覆盖。

本次另通过 Payload Local API 在 Preview 事务中验证：仅尺码草稿新增 / 编辑、变体 ID 与 SKU 保留、物流链接保存 / 修改、非法链接拒绝。全部合成记录已回滚，Preview 仍为 0 商品、0 顾客、0 订单和 1 个管理员。未触发付款或顾客邮件，也未上传 R2 媒体。

已执行相关测试、真实 PostgreSQL migration 集成测试、`npm run typecheck`、修改文件的 ESLint，以及明确指定 Preview 变量的 `npm run build`；均通过。本次不是实付下单或真实发信验收，邮件域名与服务配置仍按 PRD 待办处理。

## Production 状态（2026-10-21）

通过 `npm run migrate:production -- status` 对 `.env.local` 对应的 Production 数据库进行只读核对；Payload 登记的 16 项 migration 均显示 `Ran: Yes`，包括 `20261020_150000_add_order_tracking_url` 与 `20261020_170400_allow_size_only_variants`。本次状态检查没有应用 migration 或修改数据。

该结果确认 migration 执行记录，不替代商品创建、结账、订单、库存和支付等线上流程验收；这些项目仍按 [PRD 当前待办](./prd.md#当前待办与开放讨论) 完成。不要重新应用已执行的历史 migration，也不要向 dev 导入正式客户或订单。
