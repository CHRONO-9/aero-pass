-- ============================================================================
-- AERO-PASS: 無人航空機操縦士 オールインワン学習プラットフォーム DBスキーマ (PostgreSQL / Supabase)
-- 特徴: 初期の「個人買い切り＋スクール送客 (B2C)」から、将来の「登録講習機関向けLMS (B2B)」へ
--       テーブル構造を変更せずにシームレスに移行できるマルチテナント設計
-- ============================================================================

-- 1. 組織（将来のB2Bドローンスクール・登録講習機関テナント）
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- 例: "東京ドローンアカデミー（登録講習機関 T0123001）"
    registration_code TEXT,                      -- 国交省 登録講習機関コード
    plan_tier TEXT NOT NULL DEFAULT 'standard',  -- 'standard' (¥24,800/月), 'enterprise' (¥49,800/月)
    seat_limit INT NOT NULL DEFAULT 50,          -- 同時受講生アカウント上限
    custom_branding JSONB DEFAULT '{}'::jsonb,   -- スクールロゴ・テーマカラー（ホワイトラベル用）
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ユーザー（個人独学受験者 ＆ スクール受講生・講師）
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    target_grade TEXT NOT NULL DEFAULT 'nitou',  -- 'nitou' (二等), 'ittou' (一等)
    -- B2C 個人買い切りステータス
    access_tier TEXT NOT NULL DEFAULT 'free',    -- 'free', 'nitou_pass' (¥1,980), 'ittou_pass' (¥2,980), 'b2b_student'
    pass_expires_at TIMESTAMPTZ,                 -- 合格パス有効期限（または無期限NULL）
    -- B2B スクール所属（個人ユーザーの場合は NULL）
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    org_role TEXT DEFAULT 'student',             -- 'student', 'instructor', 'org_admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 学習ログ・弱点分析（学科CBT・一等計算・実地机上・口述・飛行日誌）
CREATE TABLE study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    module_type TEXT NOT NULL,                   -- 'cbt_written', 'calc_drill', 'tabletop_map', 'oral_sim', 'flight_log'
    question_id TEXT NOT NULL,
    category TEXT NOT NULL,                      -- 'rules_5th_diff', 'aero_calc', 'risk_cat3', 'rth_safety', 'incident_report'
    is_correct BOOLEAN NOT NULL,
    score_earned INT DEFAULT 0,                  -- 実地減点方式の残り持ち点（例: 80 / 100）
    time_spent_sec INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ドローンスクール送客（アフィリエイト・資料請求リード）管理テーブル
CREATE TABLE school_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    prefecture TEXT NOT NULL,                    -- 希望エリア（都道府県）
    desired_license TEXT NOT NULL,               -- '二等基本', '二等(夜間・目視外)', '一等基本'
    trigger_source TEXT NOT NULL,                -- 送客トリガー（例: 'kijo_low_score', 'oral_deduction_alert', 'cost_simulator'）
    partner_school_id UUID REFERENCES organizations(id),
    commission_yen INT NOT NULL DEFAULT 10000,   -- 成果報酬単価（¥5,000〜¥15,000）
    status TEXT NOT NULL DEFAULT 'submitted',    -- 'submitted', 'approved', 'paid'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
