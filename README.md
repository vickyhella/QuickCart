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

部署依赖新字段或集合的代码前，先查看 Production 是否还有未执行的迁移：

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npx payload migrate:status
```

如果新迁移显示 `Ran: No`，运行下面的命令应用到 Production，然后再部署代码：

```bash
npx vercel@latest env run -e production -- env NODE_ENV=production VERCEL_ENV=production npm run migrate
```

如果新迁移都显示 `Ran: Yes`，就不需要再运行。`npm run migrate` 单独运行时使用本地环境配置；不要把它当作 Production 迁移命令。开发时出现的 schema push 提示也只用于当前开发数据库，不代表 Production 已迁移。

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
