# 商城 SEO 上线验收

1. 在正式域名检查 `/robots.txt` 和 `/sitemap.xml` 返回 200。随机核对站点地图里的商品 URL、商品 canonical、已下架商品的 404，以及第二页列表的 canonical 和商品链接。
2. 在 Search Console 提交站点地图。抽查首页、集合页、普通商品和 Mystery Box。记录索引状态、Google 选定的 canonical、非品牌查询和各类落地页的展示及点击。
3. 在 Merchant Center 重新拉取 `/api/merchant/feed.xml`。确认商品链接全部使用正式域名，并抽查普通商品和 Mystery Box 的变体选中状态、图片、价格、币种、库存以及配送设置。用 Rich Results Test 验证同一批页面。
4. 用移动设备复测筛选、返回列表、尺码查看、加购和结账。记录首页、列表和商品页的 LCP、INP、CLS。用站内数据跟踪自然搜索落地后的加购与购买。
5. 每周根据搜索查询和库存选择扩充的集合。优先完善现有的尺码、佩戴和套装指南，使用实拍步骤并链接到对应集合。商品标题、文案和手工 SEO 字段按实际设计维护。
6. 正式 PayPal 付款与订单通知走既有 [PayPal 验收流程](./paypal-advanced-checkout.md)，并检查库存和优惠次数只处理一次。
