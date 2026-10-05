# kmos

Landing site for kmos, a software collective. Websites, apps, tech support, and automation.

The visual system is unchanged from the original layout. Copy, name, and logo are kmos.

## Commands

| Command | Action |
| :------ | :----- |
| `bun install` | Install dependencies |
| `bun dev` | Local dev server |
| `bun build` | Static build to `./dist/` |
| `bun run deploy` | Build, then deploy the static site to Cloudflare Workers |

## Cloudflare Workers

Marketing pages are prerendered. The request form and `/admin` run on the Worker and store rows in D1 (`DB`).

Local admin login is in `.env` (dev) and `.dev.vars` (Workers), neither committed:

```
ADMIN_USER=kmos
ADMIN_PASSWORD=choose-a-password
```

`bun dev` stores requests in `.data/inquiries.json`. The Worker build stores them in D1.

Before a real deploy, create the database, put its id in `wrangler.jsonc`, and set the same two names as secrets:

```sh
bunx wrangler d1 create kmos-inquiries
bunx wrangler d1 execute kmos-inquiries --remote --file=migrations/0001_inquiries.sql
bunx wrangler secret put ADMIN_USER
bunx wrangler secret put ADMIN_PASSWORD
bun run deploy
```

`/admin` asks for that username and password. Requests are not linked from the public site.
