# Loudness Analyzer v1.0-beta

**Loudness Analyzer** は、楽曲の音量感を国際規格（ITU-R BS.1770-4）に基づいて正確に計測するための、ブラウザベースのプロフェッショナルなラウドネスメーターです。

## 🚀 ライブデモ
[https://yapanysk.github.io/loudnessanalyzer/](https://yapanysk.github.io/loudnessanalyzer/)

## ✨ 主な特徴
- **高精度な計測**: 国際規格（ITU-R BS.1770-4）に準拠した2段階ゲート処理（絶対ゲート・相対ゲート）を実装。
- **プライバシー重視**: 解析処理はすべてブラウザ内（ローカル）で完結。音声データがサーバーにアップロードされることは一切ありません。
- **ハイパフォーマンス**: Web Workerを採用し、重いファイルの解析中も画面がフリーズしません。
- **洗練されたUI**: Apple標準の San Francisco フォントを採用した、視認性の高いダークモード・インターフェース。

## 🛠 技術仕様
- **アルゴリズム**: ITU-R BS.1770-4 (Integrated Loudness)
- **フィルタ**: K-Weighting (High-shelf + RLB)
- **ゲート処理**: -70 LKFS（絶対） / -10 dB（相対）
- **対応フォーマット**: WAV, MP3, M4A 等（ブラウザの仕様に準じます）

## 📂 ファイル構成

```text
.
├── index.html          # メインのUI・レイアウト
├── main.js             # アプリケーションの制御・音声デコード
├── processor.worker.js # ラウドネス計算エンジン（Web Worker）
├── USER_GUIDE.html     # 詳細マニュアル・技術解説
├── LICENSE             # MIT ライセンス
└── README.md           # プロジェクト概要（本ファイル）
```

## 📄 ドキュメント
操作方法や技術的な背景の詳細については、[操作マニュアル・技術仕様 (USER_GUIDE.html)](USER_GUIDE.html) を参照してください。

## ⚖️ ライセンス
このプロジェクトは **MITライセンス** の下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---
Created by **YAPAN**