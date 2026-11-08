# Categories 与 Variant 检查（2026-11-08）

本次检查为本地开发数据及当前实现；正式 Neon 数据需 11 号恢复后复核。

## 当前适用规则

- Categories 的 Length / Shape 管理公共选项。Product Studio 只组合明确选中的 Length + Shape 配对与 Size；Mystery Box 为 Size-only。
- 已被商品或停用 Variant 使用的分类不能删除，避免破坏旧规格。
- Color 保存在商品级 `color`，用于列表和首页颜色筛选及商品 Feed，不参与 Variant 组合。Product Studio 会处理所有历史 Variant 颜色一致的情况；若不一致，需要管理员确认商品颜色。
- 本地 Color 显示 0 个选项。需要维护真实颜色选项，并为商品指定颜色，才能形成有效的颜色筛选；没有自动猜测或批量修改颜色。

## Pack quantity 的边界

- 内部 key 保留 `quantity`，显示名称改为 Pack quantity。它表示一个套装内的件数，与购物车购买几套是两个不同概念。
- 当前支持在既有 Variant 上保存正整数属性，Categories 可查看使用中的值。它不是库存，也不自动改变价格、扣减倍数或购物车购买数量。
- 本地没有 Variant 使用这个属性。
- **尚未完成通用变体功能**：Product Studio 仍以 Length + Shape + Size 作为唯一组合键，无法为同一组合生成 10-piece 和 20-piece 两个可售 Variant；不能仅新增一个 Quantity 分类就视为支持这种销售。
- 若以后需要多件数选择，必须一起完成生成、编辑、唯一组合键、Variant ID 保留策略及前台 / 购物车 / 订单规格快照验收。该工作在 PRD 中已明确暂缓，本次未扩大实施。

本次仅调整名称与说明，未修改商品数据、SKU、价格、库存、订单或 Variant ID。
