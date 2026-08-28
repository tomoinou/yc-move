# CLAUDE.md — yc-move

## プロジェクト概要

アプリ名: **yc-move**。U-12 ラグビースクール向けの戦術アニメーション作成・閲覧 Web アプリ。非商用・私的利用。
コーチ（3〜10名）がスマホ/タブレット/PC でトップビュー 2D のプレイアニメーションを作成し、
URL で共有。選手（10〜30名）は主にスマホで閲覧する。

- オフェンス・ディフェンス各 最大9名 + ボール1個
- 1〜数フェーズのランニングコース / パスコースの解説が目的
- 認証なし、個人情報なし、障害許容度は高い（趣味プロジェクト）

## 技術スタック（固定・変更前に必ず確認を取ること）

- Vite + React + TypeScript（strict: true）
- 描画: **SVG のみ**（Canvas 禁止）
- 入力: **Pointer Events**（mouse/touch/pen を統一。ピッチ要素に `touch-action: none`）
- 状態管理: Zustand + immer。Undo/Redo は immutable スナップショットの履歴スタック
- テスト: Vitest（`src/core` は必須）
- 大型 UI フレームワーク・CSS フレームワークの導入禁止（素の CSS or CSS Modules）
- ホスティング: Cloudflare Pages（静的）。バックエンドは Phase 2 まで無し

## ディレクトリ構成

```
src/
  core/     # 純関数のみ。型定義・補間・ボール解決・判定・URL エンコード
            # DOM / React / Zustand への依存禁止。全モジュールに Vitest テスト必須
  state/    # Zustand ストア（Play データ + エディタ UI 状態は別ストア）
  ui/       # React コンポーネント
```

## 座標系（最重要・変更禁止）

- 単位は**メートル**。canonical 座標は **U-12 フルピッチ**で定義する
- 原点: 自陣トライライン × 左タッチラインの交点
- x: 左タッチライン(0) → 右タッチライン(40)
- y: 自陣トライライン(0) → 敵陣方向。**攻撃方向は常に +y（画面の下→上）**
- フルピッチ: 幅 40m × 長さ 60m。ハーフウェイライン y=30
- **上下反転機能は存在しない。orientation という概念を導入しないこと**

```ts
export const FIELD = {
  widthM: 40,
  lengthM: 60,
  halfM: 30,
  marginM: 2,          // 全周の配置可能余白。UI 確認後に変更の可能性あり
} as const;
// 配置クランプ: x ∈ [-marginM, widthM+marginM], y ∈ [-marginM, lengthM+marginM]
```

- 余白などの寸法をマジックナンバーで書くことを禁止。必ず FIELD から導出する
- 表示ウィンドウ: 自陣ハーフ相当（y 方向 30m + 上下余白）を基本とし、
  `viewY`（窓下端の y 座標, m）で縦にスクロールする
- SVG は y 軸が下向きなので、**すべての描画座標は純関数 `toScreen()` を通す**。
  `<g transform="scale(1,-1)">` による反転は禁止（テキストが鏡文字になる）

## フィールド描画仕様

| 要素 | canonical 位置 | 線種 |
|---|---|---|
| トライライン | y = 0, 60 | 太実線 |
| ハーフウェイライン | y = 30 | 太実線 |
| タッチライン | x = 0, 40 | 太実線 |
| 10mライン | y = 10, 50 | 細実線 |
| 5mライン | y = 25, 35 | 破線 |
| 交線 | x = 3, 8, 32, 37 にて、上記の各横断ライン（y = 0, 10, 25, 30, 35, 50, 60）と交差する位置に y 方向 ±0.5m の短い縦ティック | 細実線 |

- プレーエリア外（インゴール側・タッチ外・余白）は背景をわずかに暗い緑にする
- ライン群も `toScreen()` を通して描く（描画写像を 1 箇所に閉じる）

## データモデル（schemaVersion: 1）

```ts
export type Vec2 = { x: number; y: number };

export type TrackKey = {
  t: number;            // ms
  p: Vec2;              // m, canonical
  hold?: boolean;       // 前キー位置をこの時刻まで保持（待機）
  corner?: boolean;     // このキーでスプラインを分割（切り返し）
};

export type Entity = {
  id: string;
  side: 'attack' | 'defence';
  label: string;        // 1〜3 文字・全角可（下記「ラベル仕様」参照）。実名フィールドは作らない
  track: TrackKey[];    // t 昇順・疎（動いた時刻にだけキーを打つ）
};

export type PassEvent = {
  t: number;            // リリース時刻 ms
  kind: 'pass';
  from: string;         // Entity.id
  to: string;           // Entity.id
  flightMs: number;
};

export type BallTrack = {
  initialHolder: string;   // Entity.id
  events: PassEvent[];     // t 昇順
};

export type Annotation = {
  id: string;
  text: string;
  p: Vec2;
  from?: number;        // 表示開始 ms（省略時 0）
  to?: number;          // 表示終了 ms（省略時 durationMs）
};

export type Play = {
  schemaVersion: 1;
  id: string;
  title: string;
  meta: { tags: string[]; updatedAt: string };
  durationMs: number;
  markers: number[];    // 共通フェーズ時刻。UI のスナップ用であり、キーの存在を強制しない
  viewY: number;        // 保存された縦スクロール窓位置(m)。閲覧時はこれで固定表示
  entities: Entity[];
  ball: BallTrack;
  annotations: Annotation[];
};
```

### ラベル仕様

- 長さ: **コードポイント数で 1〜3 文字**（`Array.from(label).length` で数える。
  `string.length` による UTF-16 単位のカウントは禁止）。全角・半角の混在可
- 表示幅: コードポイント U+00FF 以下を半角（0.5 単位）、それ以外を全角（1.0 単位）
  として表示幅 W を算出する（半角カナも全角扱いで妥協する）
- トークンは円形を維持し、フォントサイズは
  `min(基準サイズ, トークン内寸 / W)` に自動縮小する（可読下限を設ける）
- 全角 3 文字は許容するが、入力 UI のプレースホルダ等で「全角は 2 文字推奨」と示す

- kick / ruck のイベント種別は**追加しない**（注釈テキストで代替する方針）
- schemaVersion を上げる変更にはマイグレーション関数の実装を必須とする

## 補間仕様（src/core/interpolate.ts）

- 選手軌跡: Catmull-Rom スプライン（centripetal, α = 0.5）
  - キーが 2 点のみの区間は直線
  - `corner: true` のキーでスプラインを分割（その点で C1 連続性を切る）
  - `hold: true` は前キー位置の保持として扱う
- **弧長パラメータ化必須**: 区間ごとに弧長をサンプリング累積してテーブル化し、
  二分探索で引く。時間→距離は区間内等速を基本とする
- 速度チェック: 区間平均速度が **6 m/s** を超えたら警告フラグを返す（UI は軌跡を赤表示）
- ボール位置の解決:
  - 保持中: キャリア位置 + 固定オフセット
  - パス飛行中: リリース位置（from の t 時点の位置）とレシーブ位置（to の t+flightMs 時点の位置）の線形補間
- **スローフォワード判定**: レシーブ時のボール y > リリース時のボール y なら警告
  （攻撃方向 = +y なので符号は恒久固定。ビューに依存しない）

## エディタ UX 原則

- **スマホ縦画面ファースト**。ピッチを上部（画面幅いっぱい）、操作 UI を下部（親指圏）に配置。
  タブレット/PC ではパネルをピッチ横に並べるレスポンシブ分岐
- 主操作は**タップ配置**: 選手を選択 → ピッチをタップでその位置にキーを打つ。
  ドラッグは微調整用。ドラッグ中はトークンを接触点の約 36px 上にオフセット表示する
- ヒット判定は**画面ピクセル固定で 44px 以上**（ズーム率に依存させない）
- タイムラインは連続スライダーではなく**フェーズチップ** `[KF1][KF2][+]`。
  連続スクラブは再生ビューのみ
- 背景スクロールは**モード切替トグル**（手のひらツール方式）:
  - スクロールモード中はトークン層を `pointerEvents: 'none'` にし、
    ピッチ全面ドラッグで viewY を動かす
  - モード中はトークンを減光 + ピッチ縁をハイライト（モードエラー防止）
  - ピッチ脇に細い縦位置インジケータを表示
- Undo/Redo 必須（最初のマイルストーンから）
- オニオンスキン: 前後フェーズの位置をゴースト表示
- 新規プレイは選手 0 人から開始。「+アタッカー」「+ディフェンダー」で追加
- 選択状態・編集モード・ドラッグ中の viewY などのエディタ状態は Play に保存しない
  （UI ストアに分離する）

## 共有（Phase 1）

- Play JSON → gzip（CompressionStream）→ base64url → URL フラグメント `#p=...`
- フラグメント方式を維持すること（サーバーに送られない）
- Phase 2 で Cloudflare Workers KV（playId → JSON）へ拡張予定。認証は導入しない

## やらないこと

- 認証・ユーザー管理・アカウント
- キック・ラックの明示的モデル化
- ピッチの上下反転・orientation
- Canvas 描画、外部 UI フレームワーク
- 選手の実名・写真・個人情報のフィールド
- localStorage を唯一の永続化とする設計（下書き保持に使うのは可）

## 開発コマンド

- `npm run dev` — 開発サーバー
- `npm run build` — 本番ビルド（Cloudflare Pages は push で自動実行）
- `npm test` — Vitest
- `npm run lint` — ESLint + typecheck

## コーディング規約

- `src/core` は純関数・副作用禁止。新機能はテストと同時に実装する
- 1 マイルストーン 1 コミット以上。**常に動く状態でコミットする**
- コメント・コミットメッセージは日本語で可
