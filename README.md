# QuickCart - A simple eCommerce website

QuickCart is an open-source **Next.js eCommerce frontend** project.  
It provides a modern, fast and customizable shopping UI.  
This repo is **frontend only** – contributors can improve the design, add new pages, animations and more.

---

## Features

-   Built with **Next.js + Tailwind CSS**
-   Responsive design
-   Reusable components
-   Customizable layouts and colors
-   Open for contributions (UI/UX, animations, themes, layouts etc.)

---

## Getting Started

1. Clone the repo

    ```bash
    git clone https://github.com/GreatStackDev/QuickCart.git
    cd QuickCart
    ```

2. Install dependencies

    ```bash
    npm install
    ```

3. Run locally

    ```bash
    npm run dev
    ```

## Production database migrations

商品、页面、库存等内容的增删改不需要运行迁移。只有代码修改了 Payload 数据结构（例如新增集合或字段），并生成了新的 `migrations/` 文件，才需要把迁移应用到数据库。

有新迁移时，在包含该迁移文件的代码版本中先查看 Production 状态。对于新增字段等向后兼容的迁移，先应用迁移，再部署依赖新结构的代码：

商品价格界面使用 GMC 的 Price / Sale price 叫法，通过统一映射读写原有 `price`（实际成交价）和 `compareAtPrice`（可选原价）。这项调整不需要价格字段迁移，也不改写存量价格；此前未执行的 `20261016_120000_standardize_product_prices` 已移除。其他已有迁移仍按下面的状态检查处理。

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npx payload migrate:status
```

如果新迁移显示 `Ran: No`，运行下面的命令应用到 Production，然后再部署代码：

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npm run migrate
```

如果新迁移都显示 `Ran: Yes`，就不需要运行迁移。`npm run migrate` 单独运行时使用本地环境配置；不要把它当作 Production 迁移命令。开发时出现的 schema push 提示也只用于当前开发数据库，不代表 Production 已迁移。

如果 `npx vercel@latest` 因 npm 镜像报 `ETARGET`（如找不到 Vercel CLI 的依赖版本），在命令前临时加上 `npm_config_registry=https://registry.npmjs.org`，例如：

```bash
npm_config_registry=https://registry.npmjs.org npx --yes vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npx payload migrate:status
```

该前缀只影响这一条命令，不会修改本机的 npm 配置。迁移命令也可在前面加相同前缀重试。

遇到 `ETARGET` 时，Production 迁移命令完整写法：

```bash
npm_config_registry=https://registry.npmjs.org npx --yes vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npm run migrate
```

---

## Contributing

We welcome all kinds of contributions! You can:

- Create new pages
- Improve layouts
- Add animations and transitions
- Enhance responsiveness
- Refactor components
- Suggest new UI/UX ideas
- Add themes or color variations
- Introduce accessibility improvements
- Add filtering/search features
- Improve documentation

Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the **MIT License**.

---

## 🌟 Contributors

Thanks to everyone who contributes to **QuickCart**!
