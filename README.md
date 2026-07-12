# css-api

[日本語版はこちら](README.ja.md)

An API that serves data as SVG so it can be read from CSS. Cloudflare Workers + Hono.

**Endpoint list & documentation:** https://css-api.surahotoke.workers.dev/

## How it works
Responses are split into three channels so that data can be handled purely in CSS, without JavaScript.

- **info** — Encodes a value into the SVG's dimensions: `width = value % 316781`, `height = 900 × floor(value / 316781) + (status − 100)`. The CSS side (api-getter in [ultra-css-template](https://github.com/surahotoke/ultra-css-template)) decodes it via scroll timelines, and even the HTTP status is readable from CSS
- **view** — Returns human-readable text as an SVG image. Since content — including user input — is displayed as an image via `<img>`, no scripts can run (XSS prevention)
- **post** — Accepts form POSTs and redirects back to the referer with a 303 (PRG). The form UI itself lives on the CSS side; this API only provides the data endpoint

## Features

- **datetime** — Current date and time (visitor's timezone and locale, shifted display, a clock that keeps ticking via SVG animate)
- **weather** — Current weather (Open-Meteo, visitor's location supported)
- **stock** — Stock quotes (open/high/low/close, caching tuned to trading hours)
- **comment** — Message board: posting, renaming, and a styled list image (foreignObject + text-fit)
- **cookie** — Cookie read/write, with number operations (get/add) and comma-separated list operations (push/remove/includes/index/at)
- **heartbeat / online-count** — Concurrent connection count (Durable Object)
- **random** — Random integers

## Tech

- Cloudflare Workers / Hono
- D1 + Kysely (used only as the `sql` tag) — persistence for comments
- Workers KV / Cache API — caching of external APIs
- Durable Objects — connection counting
- Cron Triggers — pre-fetching stock opening prices
- Cookies — poster-name storage, general-purpose cookie API, connection identification

## Development

```sh
npx wrangler dev                          # local dev server
npx wrangler d1 migrations apply DB       # migrations (local)
npx wrangler d1 migrations apply DB --remote  # migrations (production)
npx wrangler deploy                       # deploy
```

## Related

- [ultra-css-template](https://github.com/surahotoke/ultra-css-template) — The CSS-side template that uses this API

## License
MIT
