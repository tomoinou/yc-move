# GETTING_STARTED — セットアップ手順と Claude Code 投入プロンプト集

このファイルは自分用の手順書。リポジトリに入れても入れなくてもよい。
各マイルストーンのプロンプトは Claude Code にそのまま貼り付けられる。

---

## 0. 事前チェックリスト

- [ ] `brew install node gh` 済み
- [ ] `gh auth login` 済み
- [ ] `git config --global user.name / user.email` 済み
- [ ] `claude --version` が通る
- [ ] GitHub にリポジトリ作成済み: `mkdir -p ~/work2/projects && cd ~/work2/projects && gh repo create yc-move --public --clone`
- [ ] このリポジトリ直下に `CLAUDE.md` を置いた

## 毎セッションの型（儀式）

1. `cd ~/work2/projects/yc-move && claude`
2. 新しいマイルストーンなら `/clear` で履歴をリセット（前タスクの文脈を持ち越さない）
3. **Shift+Tab ×2 で Plan Mode** に入れてからプロンプトを貼る
4. 提示された計画を読む。おかしければ日本語で修正指示。納得してから承認
5. 実装が終わったら: `npm test` と `npm run dev` で確認 →
   「変更内容を説明して」と聞いて理解する（学習ポイント）
6. 「動作確認できた。コミットして push して」
7. スマホで本番 URL を開いて実機確認（M3 以降は必須）

途中で挙動がおかしくなったら: いったん `/clear`、最悪 `git checkout .` で直前コミットに戻す。

---

## M0: プロジェクト骨格と自動デプロイ

> このリポジトリの CLAUDE.md を読んでから計画を立ててください。
> M0 として以下だけを行います。アプリ機能はまだ実装しません。
>
> 1. Vite + React + TypeScript(strict) のプロジェクトを初期化
> 2. Vitest と ESLint を設定し、npm run dev / build / test / lint が通る状態にする
> 3. CLAUDE.md 記載のディレクトリ構成(src/core, src/state, src/ui)を空モジュールで用意
> 4. src/core/field.ts に FIELD 定数を実装し、ダミーテストを 1 本置く
> 5. 画面には「yc-move」とだけ表示されれば良い
> 6. .gitignore を適切に設定し、コミットする
>
> 計画には各ステップで作成・変更するファイル一覧を含めてください。

M0 完了後、Cloudflare Pages を接続する（ブラウザ作業、10分）:

1. dash.cloudflare.com でアカウント作成（無料・カード不要）
2. Workers & Pages → Pages → Connect to Git → GitHub 連携 → yc-move を選択
3. Framework preset: Vite（Build command: `npm run build` / Output: `dist`）
4. Save and Deploy → 発行された URL をスマホで開いて表示確認
5. 以後 `git push` のたびに自動デプロイされる

## M1: コアロジック（UI なし）

> CLAUDE.md の「データモデル」「補間仕様」を読んでから計画を立ててください。
> M1 として src/core を実装します。React には一切触りません。
>
> 1. types.ts: Play ほか全型定義
> 2. interpolate.ts: エンティティ軌跡の補間
>    - Catmull-Rom(centripetal α=0.5)、corner 分割、hold、2点間直線
>    - 弧長パラメータ化(サンプリング累積 + 二分探索)による等速化
>    - entityPositionAt(entity, t): Vec2 を公開 API とする
>    - 区間平均速度の算出と 6 m/s 超の警告フラグ
> 3. ball.ts: ballStateAt(play, t) — 保持者 or 飛行中位置の解決、
>    スローフォワード判定(レシーブ y > リリース y)
> 4. すべて Vitest でテストする。特に:
>    - 弧長等速性(等時間刻みの移動距離がほぼ一定)
>    - hold 区間で位置が不変
>    - スローフォワードの正例・負例
>
> 実装前に、公開 API の関数シグネチャ一覧を計画に含めてください。

## M2: フィールド静的描画

> CLAUDE.md の「座標系」「フィールド描画仕様」を読んでから計画してください。
> M2 として、フィールドの静的描画を実装します。アニメーションはまだです。
>
> 1. src/core/camera.ts: toScreen(p, viewY, viewportH) 純関数。テスト必須
> 2. src/ui/Pitch.tsx: SVG でフィールドを描画
>    - CLAUDE.md のライン仕様表(太実線/細実線/破線/交線)を全て実装
>    - viewY で自陣ハーフ相当の窓を切り出す。窓外・余白は暗い緑
> 3. ハードコードしたサンプル Play(アタック5・ディフェンス4)の
>    t=0 の配置をトークン(サイド色 + ラベル)として描画
> 4. スマホ縦画面で幅いっぱいに表示されるレイアウト
>
> 受け入れ基準: チャットで確認したライン仕様図と同じ構成のピッチが
> スマホの本番 URL で表示されること。

## M3: 再生

> M3 として再生機能を実装します。編集はまだです。
>
> 1. requestAnimationFrame ベースの再生クロック(src/state)
> 2. サンプル Play に track(2〜3 フェーズ)と pass イベントを追加し、
>    選手とボールが M1 の補間で動くこと
> 3. 再生/一時停止ボタンとシークバー(閲覧用の連続スクラブ)
> 4. 注釈の from/to による表示切り替え
> 5. 速度超過区間の軌跡赤表示、スローフォワード警告表示
>
> ここからは毎回スマホ実機で動作確認する。

## M4 以降(概要のみ。都度 Plan Mode で詳細化)

- M4: エディタ基盤 — 選手追加、選択、タップ配置でキー打ち、ドラッグ微調整
  (指上オフセット表示)、フェーズチップ、Undo/Redo、オニオンスキン
- M5: パス編集 UI(保持者から to をタップで指定)、スクロールモードトグル
  (pointerEvents 無効化 + 減光 + 位置インジケータ)、viewY の保存
- M6: URL 共有(gzip + base64url フラグメント)、閲覧専用ビュー
- M7: フォーメーションプリセット、フリーハンドコース描画(RDP 間引き)、
  動画書き出し、(必要なら)Workers KV 保存

---

## Claude Code 運用メモ

- モデル: `/model` で確認できるが、基本はデフォルトのまま。
  Plan Mode に強いモデルの選択肢が出ていれば計画時のみ使う
- 権限モード: 慣れるまで確認ありで運転。Shift+Tab で切り替え
- 1 セッション 1 マイルストーン。大きな依頼を 1 プロンプトに詰め込まない
- 「なぜこう書いたのか」を都度質問する。TypeScript の学習はこれが最速
- コミット前に `git status` を自分でも見る習慣をつける
