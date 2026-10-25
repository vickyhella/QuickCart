# 商品工作台连接

商品工作台通过 `/api/inventory-sync/products` 读取商品／SKU 快照，并在用户确认后修改商品上下架状态或单个 SKU 的 `enabled` 状态。用 `openssl rand -hex 32` 生成至少 32 个随机字节，并按 development、preview、production 分别配置为 `QUICKCART_INVENTORY_SYNC_TOKEN_DEVELOPMENT`、`QUICKCART_INVENTORY_SYNC_TOKEN_PREVIEW`、`QUICKCART_INVENTORY_SYNC_TOKEN`。在 Netlify 将其标记为 Secret；不得提交实际令牌。

生成随机令牌后，将其存入目标环境变量，并在 macOS 商品工作台“独立站”页保存到钥匙串。预览写入携带商品 `updatedAt`；若该商品在预览后有修改，接口返回 409 并要求刷新。上架继续执行现有商品发布校验；下架仅将状态改为 draft；停售 SKU 仅修改对应变体 `enabled`，不改库存、媒体或其他变体。

接口只支持分页 GET 和三类 PATCH 动作。访问控制依赖独立环境令牌，必须通过 HTTPS；轮换令牌会立即使已保存的旧令牌失效。任何状态写入都由工作台用户逐项确认，接口不提供批量或自动状态跟随功能。

部署后需在 Preview 使用测试商品验证正确令牌、错误令牌、分页、上架校验、下架及 SKU 停售／恢复，并确认超时或版本冲突不会在客户端显示为成功。生产环境配置和生产写入验收应另行执行。
