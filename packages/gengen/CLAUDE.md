## プロジェクト概要
LLMが出力したMarkdownをリッチな見た目にレンダリングするReactライブラリ。

## 設計思想
- **Claude Codeフレンドリー**: unified/remark の知識不要でカスタムレンダラーを定義できる
- **LLMとセット**: レンダラー定義から `toPrompt()` でLLM向けシステムプロンプトを自動生成できる
- **シンプルなAPI**: `defineRenderer` + `MarkdownRenderer` の2つだけ

## アーキテクチャ
- `src/lib-core/` — ライブラリ本体
  - `defineRenderer.ts` — レンダラー定義関数
  - `MarkdownRenderer.tsx` — レンダリングコンポーネント（remark プラグイン自動生成含む）
  - `toPrompt.ts` — レンダラー定義からLLM向けプロンプトを自動生成
  - `types.ts` — 型定義
- `src/App.tsx` — 各種パターンのデモ（設計検証を兼ねる）

## レンダラーの種類
1. **コードブロックレンダラー**: ` ```lang ` で発火。`before`/`after` で隣接要素を取り込める
2. **要素レンダラー**: `blockquote`/`ol`/`ul` などmarkdown要素を丸ごと置き換え

## toPrompt の設計方針
- `defineRenderer` の構造（lang/after/before/element）から**自動生成**
- 手書きの `prompt` フィールドは持たない
- `locale` 引数で多言語対応（デフォルト: 'ja'）
