/**
 * AeroPass Japan - 個人買い切り・学習履歴永続化・弱点分析・B2BスクールLMS管理モジュール
 * Namespace: window.AERO_MONETIZE_LMS
 * 対応基準: 無人航空機の飛行の安全に関する教則（第5版）＆修了審査実地・机上・口述基準
 */
(function (global) {
  'use strict';

  const STORAGE_KEY_STUDY = 'aero_pass_study_state_v1';
  const STORAGE_KEY_PASS = 'aero_pass_user_plan_v1';
  const STORAGE_KEY_B2B = 'aero_pass_b2b_lms_v1';

  // 分野マスター定義（教則第5版準拠）
  const CATEGORY_MASTER = {
    cat_1: {
      id: 'cat_1',
      name: '無人航空機に関する規則（航空法・小型無人機等飛行禁止法）',
      shortName: '第1・2章 法令・規則',
      weight: 0.25,
      targetRate: 85,
      remediationAdvice: '特定飛行の許可・承認区分、リモートID免除要件、事故・重大インシデント報告基準を重点復習してください。'
    },
    cat_2: {
      id: 'cat_2',
      name: '無人航空機のシステム（機体構造・GNSS・バッテリー・電波）',
      shortName: '第3章 システム・機体',
      weight: 0.20,
      targetRate: 80,
      remediationAdvice: 'マルチローターの反トルク制御、GNSSマルチパス誤差、LiPoバッテリーのセル電圧管理を確認してください。'
    },
    cat_3: {
      id: 'cat_3',
      name: '無人航空機の操縦者及び運航体制（CRM・飛行計画・日常点検）',
      shortName: '第4章 操縦者・運航体制',
      weight: 0.15,
      targetRate: 85,
      remediationAdvice: '飛行日誌（日常点検記録・飛行記録・点検整備記録）の記載要領およびDIPS2.0飛行計画通報手順を再確認してください。'
    },
    cat_4: {
      id: 'cat_4',
      name: '運航上のリスク管理（気象・CRM・フェールセーフ・教則第5版改訂）',
      shortName: '第5章 リスク管理・第5版改訂',
      weight: 0.25,
      targetRate: 90,
      remediationAdvice: '【第5版最重要】RTH（Return To Home）高度設定と障害物衝突リスク、緊急着陸地点の事前選定、突風・大気安定度を復習してください。'
    },
    cat_calc: {
      id: 'cat_calc',
      name: '一等計算問題（風向風速ベクトル・バッテリー消費・地上画素寸法GSD・制動距離）',
      shortName: '一等 航空力学・運航計算',
      weight: 0.15,
      targetRate: 80,
      remediationAdvice: '三角関数を用いた偏流角・対地速度計算、安全マージンを考慮した帰還可能時間、撮影高度とGSDの比例式を反復演習してください。'
    }
  };

  // プラン定義
  const PLAN_CATALOG = {
    free: {
      id: 'free',
      name: '無料体験プラン',
      price: 0,
      priceFormatted: '¥0',
      badge: 'FREE',
      description: '厳選サンプル問題・基本計算ドリル1問・机上口述プレビューまで利用可能',
      features: {
        cbtQuestionLimit: 10,
        ittouCalcFullAccess: false,
        deskExamFullAccess: false,
        oralLogbookSimFullAccess: false,
        weaknessAiAnalytics: false,
        fifthEditionFilter: false,
        b2bConsoleAccess: false
      }
    },
    nitou_pass: {
      id: 'nitou_pass',
      name: '二等無人航空機操縦士 合格買い切りパス',
      price: 1980,
      priceFormatted: '¥1,980（税込・買い切り）',
      badge: '二等合格PASS',
      description: '教則第5版完全対応・二等学科CBT全問・机上試験＆口述・飛行日誌シミュレーター無制限解放',
      features: {
        cbtQuestionLimit: 9999,
        ittouCalcFullAccess: false,
        deskExamFullAccess: true,
        oralLogbookSimFullAccess: true,
        weaknessAiAnalytics: true,
        fifthEditionFilter: true,
        b2bConsoleAccess: false
      }
    },
    ittou_pass: {
      id: 'ittou_pass',
      name: '一等・二等オールインワン完全合格パス',
      price: 2980,
      priceFormatted: '¥2,980（税込・買い切り）',
      badge: '一等ALL-IN-ONE',
      description: '一等計算ドリル無制限生成＋一等/二等CBT全問＋机上・口述・飛行日誌フル機能＋弱点AI分析',
      features: {
        cbtQuestionLimit: 9999,
        ittouCalcFullAccess: true,
        deskExamFullAccess: true,
        oralLogbookSimFullAccess: true,
        weaknessAiAnalytics: true,
        fifthEditionFilter: true,
        b2bConsoleAccess: false
      }
    },
    school_gift_pass: {
      id: 'school_gift_pass',
      name: '提携ドローンスクール資料請求・診断特典パス',
      price: 0,
      priceFormatted: '¥0（スクール協賛特典）',
      badge: '特典UNLOCK',
      description: '登録講習機関スマート診断・パンフレット請求特典により二等・一等対策機能を特別無料解放中',
      features: {
        cbtQuestionLimit: 9999,
        ittouCalcFullAccess: true,
        deskExamFullAccess: true,
        oralLogbookSimFullAccess: true,
        weaknessAiAnalytics: true,
        fifthEditionFilter: true,
        b2bConsoleAccess: false
      }
    },
    b2b_student: {
      id: 'b2b_student',
      name: '登録講習機関（B2B法人ライセンス）受講生アカウント',
      price: 0,
      priceFormatted: '法人契約済',
      badge: 'B2B PRO',
      description: '所属ドローンスクールのLMS連携アカウント。修了審査進級判定および全機能が利用可能です',
      features: {
        cbtQuestionLimit: 9999,
        ittouCalcFullAccess: true,
        deskExamFullAccess: true,
        oralLogbookSimFullAccess: true,
        weaknessAiAnalytics: true,
        fifthEditionFilter: true,
        b2bConsoleAccess: true
      }
    }
  };

  // 初期B2B受講生モックデータ（10名・リアルな進捗状況）
  const INITIAL_B2B_STUDENTS = [
    {
      studentId: 'TDA-2026-001',
      name: '佐藤 健太',
      kana: 'サトウ ケンタ',
      targetClass: '一等（基本＋夜間＋目視外）',
      cbtScore: 92,
      calcMastery: 88,
      deskOralScore: 90,
      fifthEdRthScore: 95,
      logbookDeductions: 0,
      studyHours: 18.5,
      lastActive: '2026-11-10 07:45'
    },
    {
      studentId: 'TDA-2026-002',
      name: '鈴木 美咲',
      kana: 'スズキ ミサキ',
      targetClass: '二等（基本＋目視外）',
      cbtScore: 86,
      calcMastery: 100,
      deskOralScore: 85,
      fifthEdRthScore: 90,
      logbookDeductions: 5,
      studyHours: 12.0,
      lastActive: '2026-11-10 06:30'
    },
    {
      studentId: 'TDA-2026-003',
      name: '高橋 誠一',
      kana: 'タカハシ セイイチ',
      targetClass: '一等（基本＋目視外＋25kg以上）',
      cbtScore: 82,
      calcMastery: 62,
      deskOralScore: 78,
      fifthEdRthScore: 70,
      logbookDeductions: 10,
      studyHours: 14.2,
      lastActive: '2026-11-09 22:15'
    },
    {
      studentId: 'TDA-2026-004',
      name: '田中 陽子',
      kana: 'タナカ ヨウコ',
      targetClass: '二等（基本＋夜間＋目視外）',
      cbtScore: 74,
      calcMastery: 80,
      deskOralScore: 68,
      fifthEdRthScore: 55,
      logbookDeductions: 20,
      studyHours: 6.5,
      lastActive: '2026-11-08 19:10'
    },
    {
      studentId: 'TDA-2026-005',
      name: '伊藤 翔太',
      kana: 'イトウ ショウタ',
      targetClass: '一等（基本＋夜間＋目視外）',
      cbtScore: 94,
      calcMastery: 92,
      deskOralScore: 88,
      fifthEdRthScore: 96,
      logbookDeductions: 0,
      studyHours: 22.4,
      lastActive: '2026-11-10 08:00'
    },
    {
      studentId: 'TDA-2026-006',
      name: '渡辺 裕樹',
      kana: 'ワタナベ ユウキ',
      targetClass: '一等（基本）',
      cbtScore: 79,
      calcMastery: 58,
      deskOralScore: 82,
      fifthEdRthScore: 85,
      logbookDeductions: 5,
      studyHours: 11.8,
      lastActive: '2026-11-09 20:40'
    },
    {
      studentId: 'TDA-2026-007',
      name: '山本 彩花',
      kana: 'ヤマモト アヤカ',
      targetClass: '二等（基本＋目視外）',
      cbtScore: 88,
      calcMastery: 90,
      deskOralScore: 92,
      fifthEdRthScore: 92,
      logbookDeductions: 0,
      studyHours: 15.0,
      lastActive: '2026-11-10 07:12'
    },
    {
      studentId: 'TDA-2026-008',
      name: '中村 大輔',
      kana: 'ナカムラ ダイスケ',
      targetClass: '二等（基本）',
      cbtScore: 81,
      calcMastery: 85,
      deskOralScore: 72,
      fifthEdRthScore: 68,
      logbookDeductions: 15,
      studyHours: 9.3,
      lastActive: '2026-11-09 18:05'
    },
    {
      studentId: 'TDA-2026-009',
      name: '小林 恵理',
      kana: 'コバヤシ エリ',
      targetClass: '一等（基本＋目視外）',
      cbtScore: 68,
      calcMastery: 52,
      deskOralScore: 65,
      fifthEdRthScore: 50,
      logbookDeductions: 25,
      studyHours: 5.1,
      lastActive: '2026-11-07 21:30'
    },
    {
      studentId: 'TDA-2026-010',
      name: '加藤 隆司',
      kana: 'カトウ タカシ',
      targetClass: '二等（基本＋夜間＋目視外）',
      cbtScore: 90,
      calcMastery: 95,
      deskOralScore: 86,
      fifthEdRthScore: 88,
      logbookDeductions: 5,
      studyHours: 16.7,
      lastActive: '2026-11-10 07:55'
    }
  ];

  // スクールテナント一覧
  const SCHOOL_TENANTS = [
    {
      tenantId: 'T0123001',
      schoolName: '東京ドローンアカデミー',
      registrationCode: '登録講習機関コード: T0123001（一等・二等対応）',
      auditorName: '主任講習員・修了審査員: 航空 太郎',
      passCriteria: { cbtMin: 80, calcMin: 75, deskOralMin: 80, fifthEdMin: 80 }
    },
    {
      tenantId: 'T0245008',
      schoolName: '関西エアロモビリティ講習センター',
      registrationCode: '登録講習機関コード: T0245008（一等・二等対応）',
      auditorName: '主任講習員・修了審査員: 浪速 翼',
      passCriteria: { cbtMin: 80, calcMin: 75, deskOralMin: 80, fifthEdMin: 80 }
    },
    {
      tenantId: 'T0388015',
      schoolName: '九州スカイドローン教習所',
      registrationCode: '登録講習機関コード: T0388015（一等・二等対応）',
      auditorName: '主任講習員・修了審査員: 玄海 遥',
      passCriteria: { cbtMin: 80, calcMin: 75, deskOralMin: 80, fifthEdMin: 80 }
    }
  ];

  // ユーティリティ: 安全なLocalStorage読み書き
  function loadFromStorage(key, defaultObj) {
    try {
      const raw = global.localStorage ? global.localStorage.getItem(key) : null;
      if (!raw) return JSON.parse(JSON.stringify(defaultObj));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(defaultObj)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultObj));
    }
  }

  function saveToStorage(key, data) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, JSON.stringify(data));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // デフォルト学習ステート生成
  function getDefaultStudyState() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      targetLicense: 'ittou', // 'nitou' | 'ittou'
      categories: {
        cat_1: { attempts: 12, correct: 10, fifthEdAttempts: 4, fifthEdCorrect: 3 },
        cat_2: { attempts: 10, correct: 8, fifthEdAttempts: 2, fifthEdCorrect: 2 },
        cat_3: { attempts: 10, correct: 8, fifthEdAttempts: 3, fifthEdCorrect: 2 },
        cat_4: { attempts: 14, correct: 9, fifthEdAttempts: 8, fifthEdCorrect: 5 },
        cat_calc: { attempts: 8, correct: 5, fifthEdAttempts: 2, fifthEdCorrect: 1 }
      },
      cbtHistory: [
        { timestamp: '2026-11-08T10:00:00Z', questionId: 'Q501', categoryId: 'cat_4', isCorrect: false, isFifthEd: true, topic: 'RTH高度設定とフェールセーフ経路' },
        { timestamp: '2026-11-09T14:20:00Z', questionId: 'Q104', categoryId: 'cat_1', isCorrect: true, isFifthEd: false, topic: '特定飛行の許可・承認（航空法第132条の85・86）' },
        { timestamp: '2026-11-09T18:45:00Z', questionId: 'Q408', categoryId: 'cat_4', isCorrect: false, isFifthEd: true, topic: 'フェールセーフ機能作動時の緊急着陸場所選定' }
      ],
      calcDrillHistory: [
        { timestamp: '2026-11-09T19:00:00Z', drillType: 'wind_vector', isCorrect: false, timeSpentSec: 95, topic: '風向風速ベクトル・偏流角と対地速度' },
        { timestamp: '2026-11-09T19:10:00Z', drillType: 'gsd_camera', isCorrect: true, timeSpentSec: 52, topic: '地上画素寸法(GSD)と撮影高度計算' }
      ],
      deskExamHistory: [
        { timestamp: '2026-11-09T20:00:00Z', scenarioId: 'DESK-01', score: 80, maxScore: 100, passed: true, weakPoint: 'RTH退避高度のビル風影響考慮' }
      ],
      oralAndLogbookHistory: [
        { timestamp: '2026-11-09T20:30:00Z', checkType: 'flight_logbook', deductionPoints: 10, finalScore: 90, flawDetected: '日常点検記録の点検時刻・バッテリーシリアル記載漏れ指摘' }
      ]
    };
  }

  // ============================================================================
  // 1. 学習履歴・弱点分析エンジン (studyTracker)
  // ============================================================================
  const studyTracker = {
    getState() {
      return loadFromStorage(STORAGE_KEY_STUDY, getDefaultStudyState());
    },

    saveState(state) {
      state.updatedAt = new Date().toISOString();
      saveToStorage(STORAGE_KEY_PASS + '_last_sync', { syncedAt: state.updatedAt });
      return saveToStorage(STORAGE_KEY_STUDY, state);
    },

    setTargetLicense(licenseType) {
      const state = this.getState();
      state.targetLicense = licenseType === 'nitou' ? 'nitou' : 'ittou';
      this.saveState(state);
      return state.targetLicense;
    },

    /**
     * 学科CBT問題の解答を記録
     * @param {Object} payload { questionId, categoryId, isCorrect, isFifthEd, topic }
     */
    recordCbtAnswer(payload) {
      const state = this.getState();
      const catId = CATEGORY_MASTER[payload.categoryId] ? payload.categoryId : 'cat_4';
      const cat = state.categories[catId] || { attempts: 0, correct: 0, fifthEdAttempts: 0, fifthEdCorrect: 0 };

      cat.attempts += 1;
      if (payload.isCorrect) cat.correct += 1;
      if (payload.isFifthEd) {
        cat.fifthEdAttempts += 1;
        if (payload.isCorrect) cat.fifthEdCorrect += 1;
      }
      state.categories[catId] = cat;

      state.cbtHistory.unshift({
        timestamp: new Date().toISOString(),
        questionId: payload.questionId || 'Q-CUSTOM',
        categoryId: catId,
        isCorrect: Boolean(payload.isCorrect),
        isFifthEd: Boolean(payload.isFifthEd),
        topic: payload.topic || CATEGORY_MASTER[catId].shortName
      });
      if (state.cbtHistory.length > 200) state.cbtHistory.length = 200;

      this.saveState(state);
      return this.getAnalyticsSummary();
    },

    /**
     * 一等計算ドリルの解答を記録
     * @param {Object} payload { drillType, isCorrect, timeSpentSec, topic }
     */
    recordCalcDrill(payload) {
      const state = this.getState();
      const cat = state.categories.cat_calc || { attempts: 0, correct: 0, fifthEdAttempts: 0, fifthEdCorrect: 0 };
      cat.attempts += 1;
      if (payload.isCorrect) cat.correct += 1;
      state.categories.cat_calc = cat;

      state.calcDrillHistory.unshift({
        timestamp: new Date().toISOString(),
        drillType: payload.drillType || 'general_calc',
        isCorrect: Boolean(payload.isCorrect),
        timeSpentSec: Number(payload.timeSpentSec) || 60,
        topic: payload.topic || '一等運航・力学計算問題'
      });
      if (state.calcDrillHistory.length > 100) state.calcDrillHistory.length = 100;

      this.saveState(state);
      return this.getAnalyticsSummary();
    },

    /**
     * 修了審査：机上試験スコアを記録
     * @param {Object} payload { scenarioId, score, maxScore, weakPoint }
     */
    recordDeskExamScore(payload) {
      const state = this.getState();
      const score = Number(payload.score) || 0;
      const maxScore = Number(payload.maxScore) || 100;
      const normalized = Math.round((score / maxScore) * 100);

      state.deskExamHistory.unshift({
        timestamp: new Date().toISOString(),
        scenarioId: payload.scenarioId || 'DESK-SIM',
        score: normalized,
        maxScore: 100,
        passed: normalized >= 80,
        weakPoint: payload.weakPoint || '飛行経路リスク評価・RTH高度設定'
      });

      // リスク管理カテゴリへも反映
      const cat4 = state.categories.cat_4;
      cat4.attempts += 1;
      if (normalized >= 80) cat4.correct += 1;

      this.saveState(state);
      return this.getAnalyticsSummary();
    },

    /**
     * 修了審査：口述試験・飛行日誌（点検・飛行・整備記録）減点履歴を記録
     * @param {Object} payload { checkType, deductionPoints, flawDetected }
     */
    recordOralAndLogbook(payload) {
      const state = this.getState();
      const deduction = Math.max(0, Number(payload.deductionPoints) || 0);
      const finalScore = Math.max(0, 100 - deduction);

      state.oralAndLogbookHistory.unshift({
        timestamp: new Date().toISOString(),
        checkType: payload.checkType || 'oral_and_logbook',
        deductionPoints: deduction,
        finalScore: finalScore,
        flawDetected: payload.flawDetected || '飛行日誌・日常点検項目の確認'
      });

      const cat3 = state.categories.cat_3;
      cat3.attempts += 1;
      if (finalScore >= 80) cat3.correct += 1;

      this.saveState(state);
      return this.getAnalyticsSummary();
    },

    /**
     * 分野別の正答率、現在の推定合格確率（%）、および「最優先で復習すべき弱点トップ3」を算出
     */
    getAnalyticsSummary() {
      const state = this.getState();
      const categoryBreakdown = [];
      let weightedAccuracySum = 0;
      let totalWeight = 0;
      let totalAttempts = 0;
      let totalCorrect = 0;
      let fifthEdAttempts = 0;
      let fifthEdCorrect = 0;

      Object.keys(CATEGORY_MASTER).forEach((catId) => {
        const meta = CATEGORY_MASTER[catId];
        const stat = state.categories[catId] || { attempts: 0, correct: 0, fifthEdAttempts: 0, fifthEdCorrect: 0 };
        const accuracy = stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0;
        const gapToTarget = meta.targetRate - accuracy;

        totalAttempts += stat.attempts;
        totalCorrect += stat.correct;
        fifthEdAttempts += stat.fifthEdAttempts || 0;
        fifthEdCorrect += stat.fifthEdCorrect || 0;

        weightedAccuracySum += accuracy * meta.weight;
        totalWeight += meta.weight;

        categoryBreakdown.push({
          categoryId: catId,
          name: meta.name,
          shortName: meta.shortName,
          attempts: stat.attempts,
          correct: stat.correct,
          accuracyRate: accuracy,
          targetRate: meta.targetRate,
          gapToTarget: gapToTarget,
          status: accuracy >= meta.targetRate ? 'PASS_READY' : accuracy >= 70 ? 'WARNING' : 'CRITICAL',
          remediationAdvice: meta.remediationAdvice
        });
      });

      const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const fifthEdMastery = fifthEdAttempts > 0 ? Math.round((fifthEdCorrect / fifthEdAttempts) * 100) : 70;

      // 机上試験＆口述・飛行日誌の平均スコア
      const latestDeskScore = state.deskExamHistory.length > 0 ? state.deskExamHistory[0].score : 75;
      const latestOralScore = state.oralAndLogbookHistory.length > 0 ? state.oralAndLogbookHistory[0].finalScore : 80;
      const calcAccuracy = (categoryBreakdown.find((c) => c.categoryId === 'cat_calc') || { accuracyRate: 70 }).accuracyRate;

      // 推定合格確率（%）の算出（CBT加重正答率 55% + 第5版改訂習熟度 20% + 机上・口述スコア 25%）
      const weightedCbt = totalWeight > 0 ? weightedAccuracySum / totalWeight : overallAccuracy;
      const rawPassProb = (weightedCbt * 0.55) + (fifthEdMastery * 0.20) + (((latestDeskScore + latestOralScore) / 2) * 0.25);
      const estimatedPassProbability = Math.min(99, Math.max(15, Math.round(rawPassProb)));

      // 最優先で復習すべき弱点トップ3の抽出（目標正答率との乖離が大きく重要度が高い順）
      const top3Weaknesses = categoryBreakdown
        .slice()
        .sort((a, b) => (b.gapToTarget * CATEGORY_MASTER[b.categoryId].weight) - (a.gapToTarget * CATEGORY_MASTER[a.categoryId].weight))
        .slice(0, 3)
        .map((item, idx) => ({
          rank: idx + 1,
          categoryId: item.categoryId,
          title: item.shortName,
          fullName: item.name,
          currentAccuracy: item.accuracyRate,
          targetAccuracy: item.targetRate,
          deficitPoints: Math.max(0, item.gapToTarget),
          urgencyLabel: item.accuracyRate < 70 ? '最優先・赤信号' : item.accuracyRate < item.targetRate ? '要強化・黄信号' : '合格圏・さらなる定着',
          actionableAdvice: item.remediationAdvice
        }));

      return {
        updatedAt: state.updatedAt,
        targetLicense: state.targetLicense,
        totalAttempts,
        totalCorrect,
        overallAccuracyRate: overallAccuracy,
        fifthEdMasteryRate: fifthEdMastery,
        calcAccuracyRate: calcAccuracy,
        latestDeskExamScore: latestDeskScore,
        latestOralLogbookScore: latestOralScore,
        estimatedPassProbability,
        passVerdictLabel: estimatedPassProbability >= 85
          ? '合格安全圏（A判定）'
          : estimatedPassProbability >= 75
            ? '合格ボーダー圏（B判定・弱点補強推奨）'
            : '要集中対策（C判定・第5版改訂＆計算重点）',
        categoryBreakdown,
        top3Weaknesses,
        recentHistory: {
          cbt: state.cbtHistory.slice(0, 10),
          calc: state.calcDrillHistory.slice(0, 10),
          desk: state.deskExamHistory.slice(0, 5),
          oralLogbook: state.oralAndLogbookHistory.slice(0, 5)
        }
      };
    },

    resetStudyData() {
      const fresh = getDefaultStudyState();
      this.saveState(fresh);
      return this.getAnalyticsSummary();
    }
  };

  // ============================================================================
  // 2. 個人買い切りパス＆ペイウォール管理 (passManager)
  // ============================================================================
  const passManager = {
    getCurrentPlanState() {
      const defaultState = {
        planId: 'free',
        purchasedAt: null,
        receiptId: null,
        unlockedBySchoolLead: false,
        b2bSchoolCode: null
      };
      const saved = loadFromStorage(STORAGE_KEY_PASS, defaultState);
      const catalogItem = PLAN_CATALOG[saved.planId] || PLAN_CATALOG.free;
      return {
        ...saved,
        planMeta: catalogItem
      };
    },

    getAllPlans() {
      return JSON.parse(JSON.stringify(PLAN_CATALOG));
    },

    /**
     * 指定機能が現在のプランで解放されているかチェック
     * @param {string} featureKey 'ittouCalcFullAccess' | 'deskExamFullAccess' | 'oralLogbookSimFullAccess' | 'weaknessAiAnalytics' | 'fifthEditionFilter' | 'b2bConsoleAccess'
     */
    canAccessFeature(featureKey) {
      const current = this.getCurrentPlanState();
      return Boolean(current.planMeta.features && current.planMeta.features[featureKey]);
    },

    /**
     * Stripe Checkout 決済シミュレーション処理（即時アンロック＆レシート発行）
     * @param {string} planId 'nitou_pass' | 'ittou_pass' | 'b2b_student'
     */
    simulateStripeCheckout(planId) {
      const targetPlan = PLAN_CATALOG[planId];
      if (!targetPlan) {
        return {
          success: false,
          message: '指定されたパスIDが無効です: ' + planId
        };
      }

      const receiptId = 'STRP-AERO-' + Date.now().toString(36).toUpperCase();
      const newState = {
        planId: targetPlan.id,
        purchasedAt: new Date().toISOString(),
        receiptId: receiptId,
        unlockedBySchoolLead: false,
        b2bSchoolCode: planId === 'b2b_student' ? 'T0123001' : null
      };

      saveToStorage(STORAGE_KEY_PASS, newState);

      return {
        success: true,
        planId: targetPlan.id,
        planName: targetPlan.name,
        amountPaid: targetPlan.price,
        priceFormatted: targetPlan.priceFormatted,
        receiptId: receiptId,
        purchasedAt: newState.purchasedAt,
        unlockedFeatures: targetPlan.features,
        message: `【決済完了】${targetPlan.name}（${targetPlan.priceFormatted}）が有効化されました。すべての対象モジュールが即座にご利用いただけます。`
      };
    },

    /**
     * 登録講習機関（ドローンスクール）資料請求・スマート診断完了による無料特典アンロック
     * @param {Object} leadInfo { schoolName, userName, email, targetLicense }
     */
    unlockViaSchoolGift(leadInfo = {}) {
      const receiptId = 'GIFT-SCH-' + Date.now().toString(36).toUpperCase();
      const newState = {
        planId: 'school_gift_pass',
        purchasedAt: new Date().toISOString(),
        receiptId: receiptId,
        unlockedBySchoolLead: true,
        sponsorSchoolName: leadInfo.schoolName || '提携登録講習機関（ドローンスクール）',
        applicantName: leadInfo.userName || '受講希望者'
      };

      saveToStorage(STORAGE_KEY_PASS, newState);

      return {
        success: true,
        planId: 'school_gift_pass',
        planName: PLAN_CATALOG.school_gift_pass.name,
        receiptId: receiptId,
        sponsorSchoolName: newState.sponsorSchoolName,
        unlockedFeatures: PLAN_CATALOG.school_gift_pass.features,
        message: `【特典アンロック完了】${newState.sponsorSchoolName}の資料請求・スマート診断特典として、¥2,980相当のオールインワン対策パスが無料解放されました！`
      };
    },

    /**
     * プラン状態の切り替え（デモ検証・切替用）
     */
    setPlanDirect(planId) {
      if (!PLAN_CATALOG[planId]) return this.getCurrentPlanState();
      if (planId === 'free') {
        const resetState = {
          planId: 'free',
          purchasedAt: null,
          receiptId: null,
          unlockedBySchoolLead: false,
          b2bSchoolCode: null
        };
        saveToStorage(STORAGE_KEY_PASS, resetState);
        return this.getCurrentPlanState();
      }
      if (planId === 'school_gift_pass') {
        this.unlockViaSchoolGift({});
        return this.getCurrentPlanState();
      }
      this.simulateStripeCheckout(planId);
      return this.getCurrentPlanState();
    }
  };

  // ============================================================================
  // 3. 登録講習機関（ドローンスクール）向け B2B LMS 管理コンソール (b2bConsole)
  // ============================================================================
  const b2bConsole = {
    getState() {
      const defaultB2b = {
        activeTenantId: SCHOOL_TENANTS[0].tenantId,
        students: INITIAL_B2B_STUDENTS
      };
      return loadFromStorage(STORAGE_KEY_B2B, defaultB2b);
    },

    saveState(state) {
      return saveToStorage(STORAGE_KEY_B2B, state);
    },

    getTenants() {
      return JSON.parse(JSON.stringify(SCHOOL_TENANTS));
    },

    setActiveTenant(tenantId) {
      const state = this.getState();
      const found = SCHOOL_TENANTS.find((t) => t.tenantId === tenantId);
      if (found) {
        state.activeTenantId = found.tenantId;
        this.saveState(state);
      }
      return this.getActiveTenant();
    },

    getActiveTenant() {
      const state = this.getState();
      return SCHOOL_TENANTS.find((t) => t.tenantId === state.activeTenantId) || SCHOOL_TENANTS[0];
    },

    /**
     * 受講生ごとの修了審査（実技検定）進級可否を自動判定するコアロジック
     * 判定区分:
     *  - '● 受験許可OK' (statusKey: 'OK')
     *  - '▲ 計算・RTH要補習' (statusKey: 'WARN_REMEDIAL')
     *  - '× 第5版改訂箇所未達' (statusKey: 'NG_FIFTH_ED')
     */
    evaluateStudentClearance(student) {
      const cbt = Number(student.cbtScore) || 0;
      const calc = Number(student.calcMastery) || 0;
      const deskOral = Number(student.deskOralScore) || 0;
      const fifthEd = Number(student.fifthEdRthScore != null ? student.fifthEdRthScore : Math.min(cbt, deskOral));
      const logDeduct = Number(student.logbookDeductions) || 0;
      const isIttou = String(student.targetClass || '').includes('一等');

      // 1. 第5版改訂箇所（RTHフェールセーフ・緊急着陸・リスク管理）が70点未満、または学科CBT75点未満、または机上口述70点未満は「× 第5版改訂箇所未達」
      if (fifthEd < 70 || cbt < 75 || deskOral < 70 || logDeduct >= 20) {
        return {
          statusKey: 'NG_FIFTH_ED',
          badgeText: '× 第5版改訂箇所未達',
          badgeClass: 'status-ng',
          canTakePracticalExam: false,
          auditorNote: `教則第5版重要項目（RTH高度・緊急着陸手順: ${fifthEd}%）または飛行日誌記載（減点-${logDeduct}）が基準未達です。学科・机上補講後に再判定してください。`
        };
      }

      // 2. 一等で計算習得率75%未満、または第5版RTHスコア80%未満、または学科80点未満・机上口述80点未満は「▲ 計算・RTH要補習」
      if ((isIttou && calc < 75) || fifthEd < 80 || cbt < 80 || deskOral < 80 || logDeduct >= 10) {
        return {
          statusKey: 'WARN_REMEDIAL',
          badgeText: '▲ 計算・RTH要補習',
          badgeClass: 'status-warn',
          canTakePracticalExam: false,
          auditorNote: isIttou && calc < 75
            ? `一等計算習得率（${calc}%）が基準（75%）未満です。風速ベクトル・GSD計算ドリル補習を実施してください。`
            : `机上・口述スコア（${deskOral}点）およびRTHリスク管理手順の最終確認補習が必要です。`
        };
      }

      // 3. 全基準クリア：「● 受験許可OK」
      return {
        statusKey: 'OK',
        badgeText: '● 受験許可OK',
        badgeClass: 'status-ok',
        canTakePracticalExam: true,
        auditorNote: '学科CBT・一等計算・机上口述・飛行日誌すべて修了審査基準を満たしています。実地修了審査へ進級可能です。'
      };
    },

    /**
     * 受講生一覧の取得（フィルタリング＆進級判定付与）
     * @param {Object} filter { statusKey: 'ALL'|'OK'|'WARN_REMEDIAL'|'NG_FIFTH_ED', targetClassKeyword: '', searchQuery: '' }
     */
    getStudents(filter = {}) {
      const state = this.getState();
      const enriched = state.students.map((st) => {
        const clearance = this.evaluateStudentClearance(st);
        return {
          ...st,
          clearance
        };
      });

      return enriched.filter((item) => {
        if (filter.statusKey && filter.statusKey !== 'ALL' && item.clearance.statusKey !== filter.statusKey) {
          return false;
        }
        if (filter.targetClassKeyword && !String(item.targetClass).includes(filter.targetClassKeyword)) {
          return false;
        }
        if (filter.searchQuery) {
          const q = String(filter.searchQuery).trim().toLowerCase();
          const hay = `${item.studentId} ${item.name} ${item.kana} ${item.targetClass}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    },

    /**
     * スクール全体のKPIサマリー取得
     */
    getCohortSummary() {
      const all = this.getStudents();
      const total = all.length;
      const okCount = all.filter((s) => s.clearance.statusKey === 'OK').length;
      const warnCount = all.filter((s) => s.clearance.statusKey === 'WARN_REMEDIAL').length;
      const ngCount = all.filter((s) => s.clearance.statusKey === 'NG_FIFTH_ED').length;

      const avgCbt = total > 0 ? Math.round(all.reduce((acc, s) => acc + Number(s.cbtScore || 0), 0) / total) : 0;
      const avgCalc = total > 0 ? Math.round(all.reduce((acc, s) => acc + Number(s.calcMastery || 0), 0) / total) : 0;
      const avgDeskOral = total > 0 ? Math.round(all.reduce((acc, s) => acc + Number(s.deskOralScore || 0), 0) / total) : 0;

      return {
        tenant: this.getActiveTenant(),
        totalStudents: total,
        okCount,
        warnCount,
        ngCount,
        clearanceRate: total > 0 ? Math.round((okCount / total) * 100) : 0,
        averageCbtScore: avgCbt,
        averageCalcMastery: avgCalc,
        averageDeskOralScore: avgDeskOral
      };
    },

    /**
     * 新規受講生の追加
     */
    addStudent(studentInput = {}) {
      const state = this.getState();
      const nextNum = state.students.length + 1;
      const studentId = studentInput.studentId || `TDA-2026-${String(nextNum).padStart(3, '0')}`;
      const cbtScore = Number(studentInput.cbtScore != null ? studentInput.cbtScore : 84);
      const calcMastery = Number(studentInput.calcMastery != null ? studentInput.calcMastery : 78);
      const deskOralScore = Number(studentInput.deskOralScore != null ? studentInput.deskOralScore : 82);
      const fifthEdRthScore = Number(studentInput.fifthEdRthScore != null ? studentInput.fifthEdRthScore : Math.min(100, cbtScore + 2));

      const newStudent = {
        studentId,
        name: studentInput.name || `新規受講生 ${nextNum}`,
        kana: studentInput.kana || 'シンキ ジュコウセイ',
        targetClass: studentInput.targetClass || '一等（基本＋夜間＋目視外）',
        cbtScore,
        calcMastery,
        deskOralScore,
        fifthEdRthScore,
        logbookDeductions: Number(studentInput.logbookDeductions != null ? studentInput.logbookDeductions : 5),
        studyHours: Number(studentInput.studyHours != null ? studentInput.studyHours : 10.0),
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      state.students.unshift(newStudent);
      this.saveState(state);
      return {
        ...newStudent,
        clearance: this.evaluateStudentClearance(newStudent)
      };
    },

    /**
     * 現在の自分の学習スコア（studyTracker）をB2B受講生リストへ同期反映
     */
    syncCurrentUserToCohort(userName = 'あなた（デモ受講生）') {
      const summary = studyTracker.getAnalyticsSummary();
      const state = this.getState();
      const existingIdx = state.students.findIndex((s) => s.studentId === 'TDA-2026-SELF');

      const record = {
        studentId: 'TDA-2026-SELF',
        name: userName,
        kana: 'デモ ジュコウセイ',
        targetClass: summary.targetLicense === 'nitou' ? '二等（基本＋夜間＋目視外）' : '一等（基本＋夜間＋目視外）',
        cbtScore: summary.overallAccuracyRate,
        calcMastery: summary.calcAccuracyRate,
        deskOralScore: Math.round((summary.latestDeskExamScore + summary.latestOralLogbookScore) / 2),
        fifthEdRthScore: summary.fifthEdMasteryRate,
        logbookDeductions: Math.max(0, 100 - summary.latestOralLogbookScore),
        studyHours: Number((summary.totalAttempts * 0.25).toFixed(1)),
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      if (existingIdx >= 0) {
        state.students[existingIdx] = record;
      } else {
        state.students.unshift(record);
      }
      this.saveState(state);
      return {
        ...record,
        clearance: this.evaluateStudentClearance(record)
      };
    },

    /**
     * 監査・修了審査台帳用CSV文字列生成＆ブラウザダウンロード支援
     */
    exportCohortCsv(filter = {}, triggerDownload = false) {
      const tenant = this.getActiveTenant();
      const rows = this.getStudents(filter);
      const headers = [
        '登録講習機関コード',
        '受講生ID',
        '氏名',
        'フリガナ',
        '受講区分',
        '学科CBT模試スコア(点)',
        '一等計算習得率(%)',
        '机上・口述スコア(点)',
        '第5版RTH・リスク管理習得率(%)',
        '飛行日誌減点(点)',
        '累計学習時間(h)',
        '修了審査進級判定',
        '審査員所見',
        '最終学習日時'
      ];

      const escapeCsv = (val) => {
        const str = String(val == null ? '' : val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvLines = [headers.map(escapeCsv).join(',')];
      rows.forEach((st) => {
        csvLines.push([
          tenant.tenantId,
          st.studentId,
          st.name,
          st.kana,
          st.targetClass,
          st.cbtScore,
          st.calcMastery,
          st.deskOralScore,
          st.fifthEdRthScore,
          st.logbookDeductions,
          st.studyHours,
          st.clearance.badgeText,
          st.clearance.auditorNote,
          st.lastActive
        ].map(escapeCsv).join(','));
      });

      const csvContent = '\uFEFF' + csvLines.join('\r\n'); // BOM付きUTF-8（Excel文字化け防止）

      if (triggerDownload && typeof document !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aero_pass_lms_${tenant.tenantId}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return csvContent;
    },

    resetCohortData() {
      const fresh = {
        activeTenantId: SCHOOL_TENANTS[0].tenantId,
        students: INITIAL_B2B_STUDENTS
      };
      this.saveState(fresh);
      return this.getStudents();
    }
  };

  // グローバル公開
  global.AERO_MONETIZE_LMS = {
    version: '1.0.0-5th-ed',
    CATEGORY_MASTER,
    PLAN_CATALOG,
    SCHOOL_TENANTS,
    studyTracker,
    passManager,
    b2bConsole
  };
})(typeof window !== 'undefined' ? window : globalThis);
