# 首页主视觉图片

Storefront 的颜色、边框和商品卡片样式变量在 `app/brand-theme.css`；首页与所有商品列表共用 `store-product-card` 样式。首页也会根据商品已有的 Color 字段显示可直接筛选的色系入口。

## 在后台设置

1. 打开 `/admin/` → **Marketing Studio** → **Homepage**。
2. 图片先上传到 **Media**，再回到 Homepage 标签，从 **Hero image** 中选择。
3. 填写 **Image alt text** 作为无障碍替代文字。
4. 在 **Click-through product** 选择一个已发布商品。顾客点击主图后会进入该商品页。
5. 点击 **Save homepage settings**。

主图与跳转商品可以分开选择。没有指定跳转商品时，主图会指向首个商品页；没有设置主图时，首页会使用首个商品图片。

## 在代码中指定备用图片

主视觉读取逻辑位于 `app/(storefront)/page.jsx` 的 `heroImage` 常量。当前优先级是后台设置图片、首个商品图片、最后的静态备用图片：

```js
const heroImage = homepageSettings?.imageUrl || heroProduct?.image?.[0] || '/media/ginny-nana-press-on-nails-test1-01.webp'
```

若只想替换最后的静态备用图，把图片放进 `public/`，并修改表达式末尾的路径。例如 `public/images/home-hero.webp` 对应 `/images/home-hero.webp`。该备用图只会在后台未设图片且首个商品没有图片时显示。

若希望代码中的图片作为默认主图、但仍允许后台图片覆盖，可将表达式改为：

```js
const heroImage = homepageSettings?.imageUrl || '/images/home-hero.webp'
```

点击跳转的默认逻辑在同一文件的 `heroHref` 常量。后台选择的商品优先；没有选择时跳到首个商品页。要改代码默认目标，可修改 `heroHref` 中 `'/all-products'` 或首个商品的路由表达式。

## Mystery Box 首页横幅

1. 在 **Marketing Studio → Homepage → Mystery Box feature** 里选择一个已发布商品；不选择时首页隐藏该区域。
2. 可选上传并选择独立横幅图片；未选时使用商品图片。
3. 修改替代文字、眉题、标题和描述，再点 **Save homepage settings**。
4. 横幅整体点击后打开所选商品页。

首页 Newsletter 区显示在 Footer 上方。订阅邮箱、同意时间和来源保存于 Admin → Store → Newsletter subscribers；重复订阅不会创建重复记录。当前只收集同意名单，尚未接入营销群发服务。顾客可发邮件至 `ginnynana@hotmail.com` 申请退出。

`Find your shape` 与 `Pick your length` 分别使用 `--gn-plum` 和 `--gn-highlight` 两个共享颜色令牌，悬停色也在 `app/theme-tokens.css` 集中维护。
