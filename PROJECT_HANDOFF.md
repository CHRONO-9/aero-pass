# AERO-PASS プロジェクト引き継ぎ＆GitHub連携ガイド

このディレクトリ（`/home/antigravity/.gemini/projects/aero-pass`）には、**AERO-PASS（無人航空機操縦士 オールインワン実践シミュレーター）** の全ソースコードとGitコミット履歴が永続保存されています。

## 新規Projectチャットでの初回実行手順（エージェント向け指示書）
ユーザーがこのメッセージをProject内のチャットで送信したら、直ちに以下の手順を実行してください：

1. `create_github_repository` ツールを呼び出し、リポジトリ名 `aero-pass`（Private: true）を GitHub アカウント（`CHRONO-9`）上に作成し、Projectリソースにアタッチする。
2. `/home/antigravity/.gemini/projects/aero-pass` の内容をワークスペース（`/home/antigravity/CHRONO-9/aero-pass` または `/home/antigravity/aero-pass`）へコピーし、`git remote add origin https://github.com/CHRONO-9/aero-pass.git`（または既存origin）を設定して `git push -u origin main` で全コミットをプッシュする。
3. 以下の6名の専門サブエージェントを `define_subagent` で定義し、自律チーム体制を復元する：
   - `kyosoku_general_expert`（無人航空機教則全般［第1章〜第6章・版管理対応］・実地試験スペシャリスト）
   - `physics_sim_engineer`（航空力学・一等計算全9公式シミュレーターエンジニア）
   - `fullstack_b2b_architect`（個人買い切り決済・学習履歴弱点分析・B2BスクールLMSアーキテクト）
   - `growth_leadgen_strategist`（一発試験vsスクールROI診断・全国提携スクール送客・SEOマーケター）
   - `kyosoku_qa_auditor`（教則全般・法規ファクトチェック＆品質監査官）
   - `mlit_regulatory_watcher`（国交省公式情報リアルタイム調査・サイト反映スペシャリスト）

## 実装済みファイル一覧（6本柱体制：学科①② → 実地③④ → 合格後実務⑤ → スクール・LMS⑥）
- `index.html` : 6つの柱ポータルUI（②一等計算全9公式、③実地机上6シナリオ、④実地口述6場面＆飛行日誌6項目、⑤合格後機体図鑑10機種・実務カテゴリー判定・14公的機関ポータル、⑥スクールROI診断・弱点分析・B2B LMS管理）
- `cbt.html` : 【独立ページ化】第1の柱「学科CBT模試 ＆ 教則スマート教科書」専用画面（BizHackスタイル統一タイル6メニュー、本番CBT30問模試、全6章体系教科書、Core Principle＆版改訂差分、国交省リアルタイムウォッチャー、直前チートシート）
- `cbt.js` : 第1の柱（CBT模試・スマート教科書・ウォッチャー・チートシート）専用制御コントローラー
- `styles.css` : コックピット計器風・高視認性デザインシステム
- `app.js` : メインアプリケーション制御ロジック（ポータル制御・各モジュール切替含む）
- `data/exam_bank.js` : 国交省公式HPライブ通達フィード (`mlitLiveFeed`)、教則全6章スマート教科書 (`kyosokuChapters`)、版管理 (`versionRegistry`)、全6章CBT 30問、机上試験6シナリオ、口述試験6場面、飛行日誌6項目
- `modules/physics_engine.js` : 一等学科「飛行性能の計算」全9公式SVGビジュアライザー＆無限ランダム計算ドリル
- `modules/pilot_portal.js` : 合格後実務「飛行ミッション別・カテゴリー（Ⅰ/ⅡB/ⅡA/Lv3.5/Ⅲ）自動判定シミュレーター」、合格後5ステップ実務ロードマップ、型式認証機・主要ドローン機体図鑑（全10機種）、国交省・DIPS 2.0・空域・電波法 公式ポータルリンク集（全14公的機関）
- `modules/b2b_monetize.js` : 学習履歴・弱点トップ3分析、Stripe買い切り＆スクール特典アンロック、B2B受講生10名管理＆CSV出力
- `modules/growth_funnel.js` : 給付金対応ROI診断、全国9エリア提携スクール検索＆リード獲得、教則チートシート
- `schema.sql` : PostgreSQL / Supabase マルチテナントDBスキーマ
- `.github/workflows/mlit-regulatory-watch.yml` : 国土交通省（航空局）公式2大ページ＆許可承認ページの定期自動監視ワークフロー

