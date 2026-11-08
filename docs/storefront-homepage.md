# 首页维护与验收

首页在 `app/(storefront)/page.jsx`，当前展示配置来自 `config/homepage.json`。沿用现有字体、莓紫与奶白色，未修改支付、订单或数据库结构。

## 内容与图片

- `hero`：主图、标题、简短说明与购买按钮。主图为展示素材，不跳转商品；手机端另有链接跳到新客指南。
- `discovery.lengths`：长度入口的名称、说明及筛选值。图片沿用 `config/category-images.json`，Admin 图片来源时读取导航中的配置。移除了提及当前隐藏 Almond 的固定文案。
- `craft`：实物细节照片与品牌说明。当前只有商品实物图，没有制作实拍或顾客评价，不应标成制作过程或顾客反馈。
- 新客指南：链接到尺码、套装内容与贴戴教程；操作特写为生成的教学示意，与实物细节区分开。
- FAQ：回答尺码、套装、复用和配送；配送时效与免邮门槛读取当前配送配置。
- Mystery Box：保留原开关与展示，默认关闭。

## 手动精选

在 `featured.productKeys` 按展示顺序填写 4–6 个已发布商品的 slug 或 ID。可从商品链接复制 slug；不要填写本地测试商品。标题和介绍由 `featured.title`、`featured.description` 维护。

只从当前公开目录匹配商品，自动去重，最多展示六款；无效或已下架的条目跳过。没有有效精选时显示普通目录与 Explore our nail sets 标题，不把自动结果标为手动精选。当前列表为空，正式选品待 11 号 Neon 数据恢复后确定。精选跟随 `config/content-sources.json` 的 `homepage` 来源开关：`repository` 使用仓库配置，不读取首页配置数据库；`admin` 使用 Marketing Studio → Homepage → Featured products，支持按行填写商品 slug / ID、标题和说明。新客指南、长度入口和实物细节区仍使用仓库配置。Admin 未配置精选时沿用仓库精选，显式保存空名单则展示普通目录。

统一读取接口为 `lib/homepage-settings.ts` 的 `getHomepageSettings()`；首页布局和 `GET /api/storefront/homepage/settings` 复用该入口。Admin 使用已有设置缓存与保存失效标签，读取失败回退仓库配置。商品目录仍依赖原有商品接口。

新增迁移 `20261108_120000_add_homepage_featured` 只增加一个 JSON 字段。11 号恢复后，先按数据库迁移说明执行 `npm run migrate:production`，再使用新增 Admin 字段及切换来源。新版本 Admin 也依赖该字段，部署前应先完成迁移；本次未连接 Neon 执行迁移。来源切换需重新部署。

## Newsletter

订阅区缩小后位于 Footer 上方，仍使用现有 API 保存邮箱、同意时间和来源，重复订阅不创建重复记录。没有接入营销群发服务，成功提示仅确认邮箱已保存，不承诺欢迎邮件、优惠码或自动新品通知。未改邮件发送逻辑。顾客可通过联系邮箱申请退出。

## 验收

检查桌面与手机布局，特别是 375×667 手机首屏购物按钮、分类筛选、新客锚点、指南链接和 FAQ 展开。目录失败时仍显示重试入口。测试手动选品顺序、去重、无效条目和无配置回退。真实商品、订阅数据库写入和生产效果待 Neon 恢复后复查；本地测试商品不代表正式陈列。

本次无新依赖或环境变量。精选 Admin 适配新增上述 migration；修改仓库配置后需部署生效。
