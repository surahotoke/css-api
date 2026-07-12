# css-api

[English version here](README.md)

CSS から読み取るためのデータを SVG として返す API。Cloudflare Workers + Hono。

**エンドポイント一覧・ドキュメント:** https://css-api.surahotoke.workers.dev/

## 仕組み
JS を使わず CSS だけでデータを扱えるように、レスポンスを 3 つのチャンネルに分けている。

- **info** — 値を SVG の寸法にエンコードして返す。`width = value % 316781`、`height = 900 × floor(value / 316781) + (status − 100)`。CSS 側（[ultra-css-template](https://github.com/surahotoke/ultra-css-template) の api-getter）が scroll-timeline でデコードし、HTTP ステータスまで CSS から参照できる
- **view** — 人が読むテキストを SVG 画像として返す。ユーザー入力を含む内容も `<img>` で表示される画像なのでスクリプトは実行されない（XSS 防止）
- **post** — フォーム POST を受け、referer へ 303 リダイレクトで戻す（PRG）。フォーム UI 自体は CSS 側が持ち、この API はデータの受け口だけを提供する

## 機能

- **datetime** — 現在日時（アクセス元タイムゾーン・ロケール対応、ずらし表示、SVG 内 animate で進み続ける時計）
- **weather** — 現在の天気（Open-Meteo、アクセス元の現在地対応）
- **stock** — 株価（始値/高値/安値/終値、取引時間に応じたキャッシュ）
- **cookie** — cookie の読み書き。数値（get/add）・カンマ区切りリスト（push/remove/includes/index/at）操作つき
- **comment** — 掲示板。投稿・名前変更・一覧のデザイン画像（foreignObject + text-fit）
- **heartbeat / online-count** — 同時接続数（Durable Object）
- **random** — 整数乱数

## 技術

- Cloudflare Workers / Hono
- D1 + Kysely（`sql` タグとしてのみ使用）— comment の永続化
- Workers KV / Cache API — 外部 API のキャッシュ
- Durable Objects — 接続数カウント
- Cron Triggers — 株価始値の先回り取得
- Cookie — 投稿者名の保存・汎用 cookie API・接続識別

## 開発

```sh
npx wrangler dev                          # ローカル起動
npx wrangler d1 migrations apply DB       # マイグレーション（ローカル）
npx wrangler d1 migrations apply DB --remote  # マイグレーション（本番）
npx wrangler deploy                       # デプロイ
```

## 関連

- [ultra-css-template](https://github.com/surahotoke/ultra-css-template) — この API を使う CSS 側のテンプレート

## License
MIT
