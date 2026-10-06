# yc-move

U-12 ラグビースクール向けの、戦術アニメーションを作って共有する Web アプリです。
コーチがスマホでプレイヤーの動きとパスを作り、URL を LINE などで選手に送ると、選手はその URL を開いて再生できます。

- 非商用・私的利用。認証なし・サーバー無し（データは URL の中に入ります）
- 使い方（コーチ向け）: アプリの `?` ボタン、または `/guide.html`
- AI エージェントで開発を続ける場合の指示書: [AGENTS.md](AGENTS.md)（仕様・設計方針・作業の進め方はすべてこちら）

## 必要なもの

- Node.js 22 以上（開発時は v26 を使用。`scripts/set-default.ts` は Node の TypeScript 直接実行を利用）
- macOS の Google Chrome（マニュアル用スクリーンショットの撮影時のみ）

## セットアップと開発

```sh
npm install
npm run dev            # http://localhost:5173/
npm run dev -- --host  # 同じ Wi-Fi のスマホから http://<MacのIP>:5173/ で確認する場合
```

| コマンド | 内容 |
|---|---|
| `npm test` | テスト（Vitest） |
| `npm run lint` | ESLint と型チェック |
| `npm run build` | 本番ビルド（`dist/`） |
| `npm run guide-shots` | マニュアルのスクリーンショットを撮り直す（`npm run dev` 起動中に実行） |

## デプロイ

Cloudflare Workers の静的アセット配信を使っています（設定は `wrangler.jsonc`）。
GitHub の `main` に push すると Cloudflare Workers Builds が自動でビルド・公開します。手作業のデプロイはありません。

## 初期配置を変える（作成者のみ）

アプリを開いたときのプレイヤー配置は `public/default-play.json` です。コードを触らずに変えられます。

1. アプリでプレイヤーを並べ、`🔗` で共有 URL をコピーする
2. `npm run set-default "<共有URL>"`
3. `git add public/default-play.json && git commit -m "初期配置を更新" && git push`

元の配置（BK 6対6、`scripts/default-0.json`）に戻すときは `npm run set-default 0` のあと同様に commit / push します。

## 構成

```
src/core/    純粋関数（座標・補間・ボール・URL エンコード・マイグレーション）とテスト
src/state/   状態管理（Zustand）、再生、初期配置の読み込み、下書き保存
src/ui/      画面（エディタ・閲覧・各パネル）
public/      初期配置 JSON、使い方マニュアルと画像
scripts/     初期配置の更新、マニュアル画像の撮影
```
