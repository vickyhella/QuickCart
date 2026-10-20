# QuickCart — Codex Project Instructions

## Project Context

- Project: Ginny Nana ecommerce website
- Stack: Next.js 16, React 19, Payload CMS 3, PostgreSQL (Neon), Cloudflare R2.
- Existing storefront, Payload Admin, checkout, and PayPal integration must be preserved.
- Product Studio: `/admin/collections/products/studio`
- Marketing Studio: `/admin/collections/marketing/studio`
- Product Studio PRD: `docs/prd.md`

## Development Principles

1. Read the relevant PRD sections before implementing features.
2. Inspect existing code and dependencies before adding new implementations.
3. Prefer reusing existing components, APIs, hooks, and utilities.
4. Make minimal, focused changes. Avoid unrelated refactoring.
5. Do not introduce new frameworks, CMS platforms, databases, or major dependencies without approval.
6. Prioritize simplicity, maintainability, performance, and ease of use.

## Architecture

- Keep Payload CMS as the source of truth for products and media.
- Use Payload APIs for product management. Do not write directly to database tables.
- Preserve existing product IDs, variant IDs, SKUs, prices, inventory, and order history.
- Reuse existing media upload, WebP conversion, and original-image storage logic.
- Keep Product Studio and Marketing Studio logically separated.
- Preserve the existing Payload Admin as a fallback.

## UI Guidelines

- Prefer shadcn/ui and existing components.
- Use TanStack Table for product lists when appropriate.
- Use react-dropzone for image uploads and dnd-kit for image sorting when needed.
- Avoid heavy spreadsheet libraries unless explicitly required.
- Optimize for creating 1–5 products per session with 2–5 images each.
- Keep forms simple and avoid unnecessary navigation.

## Product Rules

- New products default to Draft.
- Publishing requires explicit user action.
- Use a unified Description template with Auto / Custom modes.
- Never overwrite manually edited descriptions or SEO fields.
- Generate variants only from explicitly selected Length + Shape combinations and Sizes.
- Default stock for new variants: 10, with stock tracking enabled.
- Variants inherit the featured image unless explicitly overridden.
- Preserve existing variant data when editing products.
- Duplicated products must receive new IDs and SKUs and start as Draft.

## Workflow

1. Before coding, briefly summarize the intended changes and affected files.
2. Implement only the requested scope or PRD phase.
3. For nontrivial architectural decisions, present alternatives before proceeding.
4. Do not modify checkout, payments, orders, or marketing logic while implementing Product Studio unless explicitly requested.
5. Do not perform destructive database migrations without approval.
6. When a feature or code change is complete, update the root `README.md` in concise Chinese with the affected feature, entry points or key files, and any required environment, command, migration, or deployment steps. Keep detailed procedures in `docs/` and verify the README matches the implementation.

## Testing

- Run only relevant tests, linting, and type checks for the changed code.
- Avoid unnecessary full-project test suites.
- Add focused tests for product creation, duplication, variant preservation, and publishing.
- Report what was tested and any remaining risks.
- Do not repeatedly run the same failing command without investigating the cause.

## Communication

- Respond in Chinese.
- Keep explanations concise and actionable.
- Explain major trade-offs before introducing dependencies.
- When implementation is complete, summarize changed files, results, and any required manual steps.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
