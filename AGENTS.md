# AGENTS.md — yc-move

AI コーディングエージェント（Claude Code / Codex / Cursor / Copilot など）向けのプロジェクト指示書。
**このファイルが唯一の正本**。CLAUDE.md はこのファイルを読み込むだけ。仕様を変えたらここも更新すること。
人向けの概要・セットアップは README.md を参照。

## プロジェクト概要

アプリ名: **yc-move**。U-12 ラグビースクール向けの戦術アニメーション作成・閲覧 Web アプリ。非商用・私的利用。

- **作成者**（リポジトリ所有者・1名）: 開発と初期配置の管理を行う
- **編集者**（コーチ 3〜10名）: スマホ/タブレット/PC でトップビュー 2D のプレイアニメーションを作り、URL で共有
- **閲覧者**（選手 10〜30名）: 主にスマホで共有 URL を開いて再生する。閲覧画面から編集に入ることも許容している
- 1〜数フェーズのランニングコース / パスコースの解説が目的。オフェンス・ディフェンス各 最大9名程度 + ボール1個
- 認証なし、個人情報なし、障害許容度は高い（趣味プロジェクト）

## 技術スタック（固定・変更前に必ず作成者の確認を取ること）

- Vite + React 19 + TypeScript（strict: true）
- 描画: **SVG のみ**（Canvas 禁止）
- 入力: **Pointer Events**（mouse/touch/pen を統一）。ピッチ SVG は `touch-action: pinch-zoom`
  （1本指はアプリが処理、2本指はブラウザのピンチズーム）
- 状態管理: Zustand + immer。Undo/Redo は immutable スナップショットの履歴スタック（最大100）
- テスト: Vitest（`src/core` は必須）
- 大型 UI フレームワーク・CSS フレームワークの導入禁止（インラインスタイル + `src/index.css` 最小限）
- ホスティング: Cloudflare Workers の静的アセット配信（`wrangler.jsonc`、`main` への push で Workers Builds が自動デプロイ）。バックエンド無し

## ディレクトリ構成

```
src/
  core/     # 純関数のみ。型・補間・ボール解決・URL エンコード・ラベル幅・マイグレーション
            # DOM / React / Zustand への依存禁止。新機能は Vitest テストと同時に実装
  state/    # Zustand ストア（playStore=Play データ+履歴、editorStore=エディタ UI 状態）、
            # usePlayback（再生）、defaultPlay（初期配置の取得）、draft（下書き自動保存）
  ui/       # React コンポーネント。layout.ts に下部パネルの共通寸法
  App.tsx   # 起動処理とルーティング（#p= があれば閲覧、無ければエディタ）
public/
  default-play.json  # 初期配置（起動時に fetch。失敗時は ui/samplePlay.ts）
  guide.html, guide/ # コーチ向け使い方マニュアルとスクリーンショット
scripts/
  set-default.ts     # 初期配置の更新（作成者専用）
  default-0.json     # 初期配置のゴールデンマスター（BK 6対6）
  guide-shots.mjs    # マニュアル用スクリーンショットの自動撮影
```

## 座標系（最重要・変更禁止）

- 単位は**メートル**。canonical 座標は **U-12 フルピッチ**で定義する
- 原点: 自陣トライライン × 左タッチラインの交点
- x: 左タッチライン(0) → 右タッチライン(40)
- y: 自陣トライライン(0) → 敵陣方向。**攻撃方向は常に +y（画面の下→上）**
- フルピッチ: 幅 40m × 長さ 60m。ハーフウェイライン y=30
- **上下反転機能は存在しない。orientation という概念を導入しないこと**

```ts
// src/core/field.ts
export const FIELD = {
  widthM: 40,
  lengthM: 60,
  halfM: 30,
  marginM: 1,    // タッチライン外の左右余白
  inGoalM: 5,    // インゴール深さ
} as const;
// 配置クランプ: x ∈ [-marginM, widthM+marginM], y ∈ [-inGoalM, lengthM+inGoalM]
```

- 余白などの寸法をマジックナンバーで書くことを禁止。必ず FIELD から導出する
- 表示幅は `SVG_WIDTH_M = widthM + 2*marginM`。表示高さは画面の縦横比から決まり、
  `viewY`（窓下端の y 座標, m）で縦にスクロールする
- SVG は y 軸が下向きなので、**すべての描画座標は純関数 `toScreen()`（src/core/camera.ts）を通す**。
  `<g transform="scale(1,-1)">` による反転は禁止（テキストが鏡文字になる）

## フィールド描画仕様

| 要素 | canonical 位置 | 線種 |
|---|---|---|
| トライライン | y = 0, 60 | 太実線 |
| ハーフウェイライン | y = 30 | 太実線 |
| タッチライン | x = 0, 40 | 太実線 |
| 10mライン | y = 10, 50 | 細実線 |
| 5mライン | y = 25, 35 | 破線 |
| 交線 | x = 3, 8, 32, 37 と各横断ライン（y = 0, 10, 25, 30, 35, 50, 60）の交点に y 方向 ±0.5m の短い縦ティック | 細実線 |

- プレーエリアは明るい緑、インゴールは暗い緑、その外側（余白）は茶色

## データモデル（schemaVersion: 2、src/core/types.ts が正）

```ts
export type Vec2 = { x: number; y: number };

export type TrackKey = {
  t: number;            // ms
  p: Vec2;              // m, canonical
  hold?: boolean;       // 前キー位置をこの時刻まで保持（待機）
  corner?: boolean;     // このキーでスプラインを分割（切り返し）
};

export type EntityShape = 'circle' | 'square';

export type Entity = {
  id: string;
  side: 'attack' | 'defence';
  label: string;        // 1〜3 文字・全角可。実名フィールドは作らない
  shape?: EntityShape;  // 省略時 'circle'。FW/BK 等の意味は持たせず「2種類の見分け」用
  track: TrackKey[];    // t 昇順・疎（動いた時刻にだけキーを打つ）
};

export type BallHolder = { t: number; holderId: string };
export type BallTrack = { holders: BallHolder[] };  // t 昇順。t=0 から始まる

export type Annotation = { id: string; text: string; p: Vec2; from?: number; to?: number };

export type Play = {
  schemaVersion: 2;
  id: string;
  title: string;
  meta: { tags: string[]; updatedAt: string };
  durationMs: number;
  markers: number[];    // フレーム(f2 以降)の時刻。f1 は常に t=0
  viewY: number;
  entities: Entity[];
  ball: BallTrack;
  annotations: Annotation[];   // 描画はあるが編集 UI は未実装
  nextAttackIdx: number;       // 次に追加する A のラベル番号
  nextDefenceIdx: number;
};
```

- schemaVersion を上げる変更にはマイグレーション関数（src/core/migration.ts）の実装を必須とする。
  v1（ball が initialHolder + PassEvent[]）→ v2 は実装済み
- 後方互換の**省略可能フィールド追加**（例: `shape`）は schemaVersion を上げずに行ってよい
- 共有 URL・default-play.json・下書きはすべて `migrateToLatest()` を通して読む
- kick / ruck のイベント種別は**追加しない**（注釈テキストで代替する方針）

### ラベル仕様（src/core/label.ts）

- 長さ: **コードポイント数で 1〜3 文字**（`Array.from(label).length`。`string.length` は禁止）
- 表示幅: U+00FF 以下を半角（0.5）、それ以外を全角（1.0）として W を算出
- トークン内・操作パネルの名前欄とも `fitFontSize()` で枠に収まるよう自動縮小（下限あり）
- 全角は 2 文字推奨（入力ダイアログで案内）

## 補間・ボール（src/core/interpolate.ts, ball.ts）

- 選手軌跡: centripetal Catmull-Rom（α = 0.5）、弧長パラメータ化（区間ごとにテーブル化して二分探索）
  - キー 2 点のみの区間は直線。`corner: true` で分割、`hold: true` は前キー位置の保持
- 速度チェック: 区間平均速度 6 m/s 超で `segmentWarnings()` が警告を返す（**UI 表示は未実装**）
- ボール: 各フレームで保持者を決める方式。連続する holders で保持者が変わると、
  その 2 時刻の間ずっとパス飛行中（リリース位置→レシーブ位置の線形補間）
  - 保持中は攻撃側はトークン上、守備側はトークン下に表示
  - `ballStateAt().isForward`（レシーブ y > リリース y）でスローフォワード判定（**UI 表示は未実装**）

## エディタ UX（現在の実装）

- **スマホ縦画面ファースト**。上にピッチ（画面幅いっぱい）、下に3段の操作エリア（上から）:
  1. フレーム行: `f1 f2 …`（選択中はオリーブ色 + 削除 ×、f1 は削除不可）と右端 `＋`
  2. 再生行: `▶`、シークバー、時間表示 `現在秒/全体秒`（全体秒は押すと変更）、右端 `?`（ガイド）
  3. 操作パネル: `▲▼`（スクロールモード） | `+A` `+D` 形切替 | ボール 名前 × | `←` `→` | `🔗`
- 下部の寸法は **src/ui/layout.ts に集約**。標準ボタン幅 `STD_W` は `.app-frame` を container にした
  `100cqw` から算出し、行をまたいで縦に揃える（f1↔▲▼、`?`/`＋`↔`🔗`、時間表示右端↔`→` 右端）。
  グループ内隙間 3px・グループ間 10px・高さ 28px。**作成者はこの整列を重視している**
- 編集できるのは**フレームチップが点灯（オリーブ）しているときだけ**。再生・シークで点灯が消える
- 主操作は**ドラッグ**（タップ配置は未実装）:
  - タップで選択（白い輪）、選択中を動かさずタップで解除。選択中でもそのままドラッグ可
  - 5px 未満の動きはタップ扱い（位置は確定しない）が、表示は指に追従
  - 押さえた点とトークン中心のずれを保持（中心が指へ吸い寄せられない）
  - 動き始めから 250ms（smoothstep）で 36px 上へ浮き上がる。**距離ベースにしないこと**（下・横方向で引っかかる）
  - 指を離した位置ではなく**最後に表示した位置**に確定する（跳ね防止）
  - ヒット判定は画面 44px 以上
- 追加: `+A`/`+D` 点灯中にピッチをタップすると t=0 のキーで追加、追加後は自動で選択状態
- 形切替: 追加モード中または未選択時は「次に追加する形」、選択中はそのプレイヤーの形。デフォルトは丸
- フレーム追加: 最後のフレーム +1 秒（シーク位置がそれより後ならシーク位置）。追加フレームを点灯
- オニオンスキン: 点灯フレームの**直前フレーム**の位置をゴースト表示。軌跡線はサイド色（A 赤 / D 青）
- スクロールモード（手のひらツール）: トークン減光・ピッチ枠ハイライト・右端に縦位置インジケータ
- 選択状態・編集モード・追加モード等は editorStore に置き、Play に保存しない
- iOS 対策: SVG に `user-select: none` / `-webkit-touch-callout: none`（ルーペ抑止）、
  `viewport-fit=cover` + `env(safe-area-inset-*)`（ホーム画面アプリで下部が切れない）
- タブレット/PC 向けの横並びレイアウトは**未実装**（縦レイアウトのまま横に広がる）

## 閲覧画面（src/ui/Viewer.tsx）

- 共有 URL（`#p=`）を開くと表示。初期表示はハーフウェイライン中央
- 1本指の上下ドラッグでスクロール、2本指でブラウザのピンチズーム。再生・シークのみ
- 時間表示の右に鉛筆ボタン: 確認ダイアログ → そのプレイを読み込んでエディタへ。
  `history.pushState` で履歴を積むので Safari の「戻る」で閲覧に戻れる

## 保存・共有・初期配置

- **共有**: Play JSON → gzip（CompressionStream）→ base64url → `#p=...`。フラグメント方式を維持（サーバーに送られない）。
  共有 URL は `useEffect` で事前生成し、ボタン押下時に同期で `clipboard.writeText`（iOS のユーザー操作制約のため）。
  clipboard が使えない環境では `prompt` で URL を表示
- **下書き**（src/state/draft.ts）: commit/undo/redo による変更を localStorage `yc-move:draft` に保存。
  起動時に下書きがあれば「前回の編集を再開しますか？」→ OK で再開、キャンセルで破棄して初期配置。
  端末・ブラウザごと（Safari とホーム画面アプリは別）。**localStorage を唯一の永続化にしない**方針は維持（正本は共有 URL）
- **初期配置**: `public/default-play.json` を起動時に fetch。作成者だけが更新する:
  `npm run set-default "<共有URL>"` → commit → push。`npm run set-default 0` で `scripts/default-0.json` に戻す
- **使い方マニュアル**: `public/guide.html`（コーチ向け・日本語）。エディタの `?` で iframe オーバーレイ表示
  （別タブにすると押すたびにページが増え、遷移すると編集中のプレイが消えるため）

## やらないこと

- 認証・ユーザー管理・アカウント
- キック・ラックの明示的モデル化
- ピッチの上下反転・orientation
- Canvas 描画、外部 UI フレームワーク
- 選手の実名・写真・個人情報のフィールド
- localStorage を唯一の永続化とする設計（下書き保持に使うのは可）

## 開発コマンド

- `npm run dev` — 開発サーバー（スマホ実機確認は `npm run dev -- --host` で LAN 公開）
- `npm run build` — 本番ビルド（Cloudflare 側は push で自動実行）
- `npm test` — Vitest
- `npm run lint` — ESLint + typecheck
- `npm run set-default "<共有URL>"` / `npm run set-default 0` — 初期配置の更新 / ゴールデンマスターに戻す（作成者専用）
- `npm run guide-shots` — マニュアル用スクリーンショットを撮り直す（`npm run dev` 起動中に実行。macOS の Chrome を使用、`CHROME_PATH` で変更可）

## 作業の進め方（作成者の好み・過去の経緯）

- 作成者は日本語でやり取りする。コメント・コミットメッセージも日本語
- 変更のたびに `npm run lint` `npm run build` `npm test` を通し、**1 変更 1 コミットで main に push** してきた（push で自動デプロイ）
- UI は iPhone 実機（Safari とホーム画面アプリ）で確認される。作成者は px 単位の寸法・行をまたいだ整列・
  同種要素の色やサイズの統一を細かく指示する。アクティブ色はオリーブ `#555500`
- 「実機で直っていない」と言われたら、まず**再読み込み（ホーム画面アプリは再起動）**を案内する。
  キャッシュが原因だったことが複数回ある
- 提案を求められたら、選択肢とおすすめを短く示してから実装する
- **UI を変えたら public/guide.html の記述とスクリーンショット（`npm run guide-shots`）も更新する**
- ヘッドレス Chrome + DevTools Protocol で操作・計測して検証してきた（座標の整列、ドラッグの滑らかさなど）。
  `scripts/guide-shots.mjs` が操作の書き方の参考になる
