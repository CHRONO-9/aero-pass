/**
 * AERO-PASS Growth & Lead Generation Funnel Module
 * 資格EdTech SEO集客・CRO・登録講習機関（ドローンスクール）高単価送客エンジン
 *
 * 主な機能:
 * 1. calculateExamROI(params) - 指定試験機関（一発試験）vs 登録講習機関（実地免除スクール）精密ROIシミュレーター
 * 2. schoolDirectory / searchSchools / submitLead - 都道府県・エリア別 提携ドローンスクール検索＆デュアルオファーリード獲得エンジン
 * 3. seoCheatSheet - 検索流入（SEO）＆試験直前5分暗記用「教則第5版 改訂早見表・頻出数値・一等計算公式チートシート」
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. 一発試験 vs 登録講習機関（実地免除スクール）精密ROIシミュレーター
  // ============================================================================

  /**
   * 資格区分ごとの基礎パラメータ（指定試験機関の法定受験料・登録講習機関の相場・難易度係数）
   */
  const LICENSE_SPEC_MASTER = {
    nitou_basic: {
      id: 'nitou_basic',
      label: '二等無人航空機操縦士（基本）',
      shortLabel: '二等（基本）',
      academicExamFee: 8800,           // 学科試験受験料（CBT）
      practicalExamFeePerTry: 22000,   // 指定試験機関・実地試験料（基本）
      physicalExamFee: 5200,           // 身体検査受験料（書類提出）
      issuanceFee: 3000,               // 技能証明申請手数料
      schoolStandardTuition: 198000,   // 登録講習機関 標準受講料（税込相場）
      schoolMinDays: 2,                // 最短実技日数
      schoolTotalHours: '学科10h + 実技10h（経験者2h）',
      baseDirectPassRate: {
        beginner: 18.0, // 未経験・ATTI練習環境なしの一発合格率(%)
        hobby: 34.0,    // GPS空撮経験のみの一発合格率(%)
        pro: 62.0       // 業務経験・練習コートありの一発合格率(%)
      },
      expectedRetakes: {
        beginner: 2.2,  // 平均再受験回数
        hobby: 1.4,
        pro: 0.5
      },
      practiceHoursNeeded: {
        beginner: 25,
        hobby: 15,
        pro: 6
      },
      schoolPassRate: 97.8,
      cpaBase: 10000
    },
    nitou_full: {
      id: 'nitou_full',
      label: '二等無人航空機操縦士（基本＋夜間・目視外限定解除）',
      shortLabel: '二等（夜間・目視外フル）',
      academicExamFee: 8800,
      practicalExamFeePerTry: 37400,   // 基本22,000 + 夜間7,700 + 目視外7,700
      physicalExamFee: 5200,
      issuanceFee: 3000,
      schoolStandardTuition: 264000,   // 基本＋夜間＋目視外パッケージ相場
      schoolMinDays: 3,
      schoolTotalHours: '学科10h + 実技12h（基本10h+夜間1h+目視外1h）',
      baseDirectPassRate: {
        beginner: 12.5,
        hobby: 26.0,
        pro: 52.0
      },
      expectedRetakes: {
        beginner: 2.8,
        hobby: 1.8,
        pro: 0.8
      },
      practiceHoursNeeded: {
        beginner: 32,
        hobby: 20,
        pro: 10
      },
      schoolPassRate: 96.9,
      cpaBase: 12000
    },
    ittou_basic: {
      id: 'ittou_basic',
      label: '一等無人航空機操縦士（基本）',
      shortLabel: '一等（基本）',
      academicExamFee: 9900,           // 一等学科試験受験料（CBT 70問・75分）
      practicalExamFeePerTry: 38500,   // 一等実地試験料（基本）
      physicalExamFee: 5200,           // 書類審査5,200（検査受験は19,900）
      issuanceFee: 3000,
      schoolStandardTuition: 462000,   // 一等登録講習機関 相場
      schoolMinDays: 5,
      schoolTotalHours: '学科18h + 実技50h（二等保有者9h〜）',
      baseDirectPassRate: {
        beginner: 4.5,  // 一等実地（ATTI高精度8の字・ピルエット・緊急着陸）の一発合格は極めて狭き門
        hobby: 11.0,
        pro: 28.0
      },
      expectedRetakes: {
        beginner: 3.8,
        hobby: 2.6,
        pro: 1.5
      },
      practiceHoursNeeded: {
        beginner: 60,
        hobby: 45,
        pro: 25
      },
      schoolPassRate: 95.2,
      cpaBase: 15000
    },
    ittou_full: {
      id: 'ittou_full',
      label: '一等無人航空機操縦士（基本＋夜間・目視外限定解除）',
      shortLabel: '一等（夜間・目視外フル）',
      academicExamFee: 9900,
      practicalExamFeePerTry: 56100,   // 一等基本38,500 + 夜間8,800 + 目視外8,800
      physicalExamFee: 5200,
      issuanceFee: 3000,
      schoolStandardTuition: 550000,
      schoolMinDays: 6,
      schoolTotalHours: '学科18h + 実技54h（二等保有者13h〜）',
      baseDirectPassRate: {
        beginner: 3.2,
        hobby: 8.5,
        pro: 22.0
      },
      expectedRetakes: {
        beginner: 4.2,
        hobby: 3.0,
        pro: 1.8
      },
      practiceHoursNeeded: {
        beginner: 75,
        hobby: 55,
        pro: 32
      },
      schoolPassRate: 95.0,
      cpaBase: 15000
    }
  };

  /**
   * 操縦経験・練習環境ごとのコスト係数（機体手配・練習コート・遠征交通費）
   */
  const EXPERIENCE_PROFILE_MASTER = {
    beginner: {
      id: 'beginner',
      label: '未経験・ATTIモード練習環境なし',
      droneSetupCost: 48000,       // ATTIモード切替対応機レンタルまたは練習機調達・プロペラガード等
      courtCostPerHour: 3300,      // 屋外・屋内練習コート利用料（時間単価）
      travelCostPerExam: 14500,    // 指定試験機関会場（郊外）への往復交通費・宿泊/移動時間コスト
      durationDirect: '3.5〜6ヶ月（会場空き待ち・再受験待機含む）',
      painPoints: [
        '市販のDJI機（Mini/Air等）はATTIモード（GNSSオフ）への手動切替ができず、一発試験の練習機を自前で用意できない',
        '机上試験（4問10分・飛行計画の矛盾指摘）と飛行日誌の手書き記入ルールで時間切れ・減点失格になりやすい',
        '風が5m/s近く吹く屋外会場でATTIモードのスクエア飛行・8の字飛行を維持できず、高度・位置逸脱で即終了リスク大'
      ]
    },
    hobby: {
      id: 'hobby',
      label: '空撮経験あり（GPSモードのみ）',
      droneSetupCost: 35000,
      courtCostPerHour: 2800,
      travelCostPerExam: 12000,
      durationDirect: '2.5〜4.5ヶ月（ATTI矯正・再受験待機含む）',
      painPoints: [
        '普段のGPS（Pモード）操作の癖が抜けず、ATTIモードでの慣性ドリフト補正（当て舵）とラダー旋回で減点が重なる',
        '口述試験での「飛行前点検の指差し呼称」「緊急用務空域・事故報告基準」の正確な条文発声で詰まりやすい',
        '夜間・目視外の実地試験を同日受験する場合、1科目でも70点未満になると再受験料と会場往復が再度発生する'
      ]
    },
    pro: {
      id: 'pro',
      label: '業務経験・練習コートあり',
      droneSetupCost: 15000,       // 試験会場での機体レンタル費または持込機体検査準備費
      courtCostPerHour: 1500,
      travelCostPerExam: 10000,
      durationDirect: '1.5〜3ヶ月（書類申請・試験日程調整）',
      painPoints: [
        '実技はこなせても、教則第5版で改訂された「机上試験の特例条件」や「飛行日誌（日常点検・飛行記録）の単位・記載様式」で思わぬ減点を喫する',
        '平日の指定試験機関会場への移動・拘束時間（丸1日×受験回数）による業務機会損失が大きい',
        '一等の場合、屋外風速の影響でベテランでも一発試験の合格率が20〜30%台に留まる'
      ]
    }
  };

  /**
   * 給付金・助成金制度マスター
   */
  const SUBSIDY_SCHEME_MASTER = {
    none: {
      id: 'none',
      label: '給付金・助成金を利用しない（一般個人）',
      discountRate: 0.0,
      maxCap: 0,
      wageSubsidy: 0,
      badgeText: '通常料金（分割決済・キャンペーン対象）',
      description: 'スクール独自の「一等・二等セット割」や「AERO-PASS経由の入学金免除特典（最大¥15,000オフ）」を活用可能です。'
    },
    kyufukin: {
      id: 'kyufukin',
      label: '教育訓練給付金（一般20% / 特定一般・専門実践 最大40〜50%還付）',
      discountRate: 0.25, // 実効平均25%（一般20%〜特定一般40%の中央値ベース）
      maxCap: 100000,
      wageSubsidy: 0,
      badgeText: '厚生労働省・教育訓練給付制度（最大20〜50%支給）',
      description: '雇用保険の加入期間要件（初回1年以上等）を満たす会社員・離職者の方は、ハローワークから受講費用の20%（最大10万円、特定一般は40%）が修了後に支給されます。'
    },
    joseikin: {
      id: 'joseikin',
      label: '法人向け 人材開発支援助成金（事業展開等リスキリング支援コース）',
      discountRate: 0.60, // 中小企業 経費助成45%〜75%（実効60%計算）
      maxCap: 300000,
      wageSubsidy: 28800, // 賃金助成（約960円×時間数の目安）
      badgeText: '法人利用No.1：経費最大60〜75%＋賃金助成',
      description: '法人・個人事業主が従業員に資格を取得させる場合、受講料の最大45〜75%＋講習時間中の賃金助成（1時間あたり最大960円）が支給され、一発試験より圧倒的に安価になります。'
    }
  };

  /**
   * 指定試験機関での「一発試験」vs「登録講習機関（実地免除スクール）」のROIを精密計算する
   * @param {Object} params
   * @param {string} [params.licenseType='nitou_basic'] - 'nitou_basic' | 'nitou_full' | 'ittou_basic' | 'ittou_full'
   * @param {string} [params.expLevel='beginner'] - 'beginner' | 'hobby' | 'pro'
   * @param {string} [params.subsidyType='none'] - 'none' | 'kyufukin' | 'joseikin'
   * @returns {Object} 精密シミュレーション結果
   */
  function calculateExamROI(params = {}) {
    const licenseKey = params.licenseType || params.targetLicense || params.license || 'nitou_basic';
    const expKey = params.expLevel || params.experience || 'beginner';
    const subsidyKey = params.subsidyType || params.subsidy || 'none';

    const lic = LICENSE_SPEC_MASTER[licenseKey] || LICENSE_SPEC_MASTER.nitou_basic;
    const exp = EXPERIENCE_PROFILE_MASTER[expKey] || EXPERIENCE_PROFILE_MASTER.beginner;
    const sub = SUBSIDY_SCHEME_MASTER[subsidyKey] || SUBSIDY_SCHEME_MASTER.none;

    // --- 1. 指定試験機関（一発試験ルート）の試算 ---
    const directPassRate = lic.baseDirectPassRate[exp.id];
    const expectedRetakes = lic.expectedRetakes[exp.id];
    const totalPracticalAttempts = Number((1 + expectedRetakes).toFixed(1));

    const academicExamFee = lic.academicExamFee;
    const practicalExamFeeTotal = Math.round(lic.practicalExamFeePerTry * totalPracticalAttempts);
    const droneRentalAndRigFee = exp.droneSetupCost;
    const practiceHours = lic.practiceHoursNeeded[exp.id];
    const practiceCourtFee = Math.round(practiceHours * exp.courtCostPerHour);
    const travelAndTimeCost = Math.round(exp.travelCostPerExam * totalPracticalAttempts);
    const certAndPhysicalFee = lic.physicalExamFee + lic.issuanceFee;

    const directTotalCost =
      academicExamFee +
      practicalExamFeeTotal +
      droneRentalAndRigFee +
      practiceCourtFee +
      travelAndTimeCost +
      certAndPhysicalFee;

    // --- 2. 登録講習機関（実地試験100%免除スクールルート）の試算 ---
    const tuitionGross = lic.schoolStandardTuition;
    const rawSubsidy = Math.min(Math.round(tuitionGross * sub.discountRate), sub.maxCap || Infinity);
    const totalSubsidyAmount = rawSubsidy + (sub.wageSubsidy || 0);
    // 学科試験料＋身体検査＋発行手数料はスクールルートでも共通で発生
    const schoolStatutoryFees = academicExamFee + certAndPhysicalFee;
    const aeroPassBonusDiscount = 2980; // AERO-PASS合格パス無料進呈分の実質価値

    const schoolNetTuition = Math.max(45000, tuitionGross - totalSubsidyAmount);
    const schoolNetTotalCost = schoolNetTuition + schoolStatutoryFees;

    // --- 3. 比較・意思決定メトリクス ---
    const costDiff = schoolNetTotalCost - directTotalCost; // マイナスならスクールの方が安い
    const passRateBoost = Number((lic.schoolPassRate - directPassRate).toFixed(1));

    let recommendationHeadline = '';
    let recommendationDetail = '';

    if (costDiff <= 15000) {
      recommendationHeadline = `💡 登録講習機関なら実地試験100%免除＆実質負担がほぼ同等（合格率 +${passRateBoost}% UP）`;
      recommendationDetail =
        `${lic.shortLabel}を「${exp.label}」で一発受験する場合、平均${expectedRetakes}回の再受験・練習コート代・機体手配費により総額 ¥${directTotalCost.toLocaleString()} 前後まで膨らみます。` +
        `一方、登録講習機関（実地免除）なら${sub.id !== 'none' ? sub.badgeText + 'の活用で' : ''}実質 ¥${schoolNetTotalCost.toLocaleString()} で最短${lic.schoolMinDays}日・合格率${lic.schoolPassRate}%で確実に取得できます。`;
    } else {
      recommendationHeadline = `🎯 再受験リスク（想定${expectedRetakes}回）と会場拘束時間をゼロにする「実地100%免除」ルート`;
      recommendationDetail =
        `一発試験の推定合格率はわずか ${directPassRate}% です。指定試験機関の実地試験で1度でも不合格になると再受験料（¥${lic.practicalExamFeePerTry.toLocaleString()}/回）と数週間の待機が発生します。` +
        `教育訓練給付金や法人助成金対象の提携スクールを選べば、差額を最小化しつつ実地試験免除で確実に一発取得が可能です。`;
    }

    return {
      input: {
        licenseType: lic.id,
        licenseLabel: lic.label,
        expLevel: exp.id,
        expLabel: exp.label,
        subsidyType: sub.id,
        subsidyLabel: sub.label
      },
      directExam: {
        routeName: '指定試験機関（一発試験・独学ルート）',
        estimatedPassRate: directPassRate,
        expectedRetakes: expectedRetakes,
        totalPracticalAttempts: totalPracticalAttempts,
        practiceHoursRequired: practiceHours,
        costBreakdown: {
          academicExamFee: academicExamFee,
          practicalExamFeePerTry: lic.practicalExamFeePerTry,
          practicalExamFeeTotal: practicalExamFeeTotal,
          droneRentalAndRigFee: droneRentalAndRigFee,
          practiceCourtFee: practiceCourtFee,
          travelAndTimeCost: travelAndTimeCost,
          certificateIssuanceFee: certAndPhysicalFee
        },
        totalEstimatedCost: directTotalCost,
        estimatedDuration: exp.durationDirect,
        riskFactors: exp.painPoints
      },
      registeredSchool: {
        routeName: '登録講習機関（実地試験100%免除スクール）',
        passRate: lic.schoolPassRate,
        practicalExamExemption: true,
        curriculumHours: lic.schoolTotalHours,
        tuitionGross: tuitionGross,
        statutoryFees: schoolStatutoryFees,
        subsidySchemeName: sub.badgeText,
        subsidyAmount: totalSubsidyAmount,
        aeroPassBonusValue: aeroPassBonusDiscount,
        netTuitionOnly: schoolNetTuition,
        netSelfBurden: schoolNetTotalCost,
        estimatedDuration: `最短${lic.schoolMinDays}〜${lic.schoolMinDays + 2}日間（学科eラーニング＋実技講習）`,
        includedBenefits: [
          '指定試験機関での実地試験（実技・机上・口述）が100%免除',
          'ATTIモード対応の講習機体・保険・全天候型練習コート代がすべて受講料にコミコミ',
          '万が一修了審査に落ちても無料の補習・再審査保証つき（合格率95%超）',
          '【AERO-PASS特典】資料請求だけで「一等・二等 合格パス（¥2,980）」が即時無料アンロック'
        ]
      },
      comparisonSummary: {
        costDifference: costDiff,
        isSchoolCheaperOrEqual: costDiff <= 0,
        passRateBoost: passRateBoost,
        recommendationHeadline: recommendationHeadline,
        recommendationDetail: recommendationDetail,
        affiliateCpaEstimate: lic.cpaBase
      }
    };
  }

  // ============================================================================
  // 2. 都道府県・エリア別 提携ドローンスクール検索 ＆ リード獲得エンジン
  // ============================================================================

  /**
   * 全国の主要エリア別 提携登録講習機関ディレクトリ
   */
  const schoolDirectory = [
    {
      id: 'sch-kanto-tokyo-01',
      area: '関東',
      prefectures: ['東京都', '神奈川県', '埼玉県', '千葉県'],
      primaryPrefecture: '東京都',
      name: '東京エアロスペース登録講習センター（品川・お台場校）',
      registrationCode: '国土交通省 登録講習機関 T0042-001',
      tagline: '都心から30分・全天候型大型屋内ドーム完備。一等・二等＆夜間・目視外を最短3日で一括取得',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金（最大20%還付）', '人材開発支援助成金（最大75%）', '東京都リスキリング対象'],
      features: [
        '完全遮光可能な屋内コートにより、昼間時間帯でも「夜間飛行」の実技講習・修了審査を実施可能',
        '一等無人航空機操縦士専用の広大な屋外フィールド（千葉県木更津提携コート）も無料送迎バスあり',
        'AERO-PASS CBT模試と完全連動した学科eラーニングで通勤中に学科対策が完結'
      ],
      tuitionFrom: 187000,
      passRate: 98.4,
      cpaReward: 15000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-kanto-kanagawa-02',
      area: '関東',
      prefectures: ['神奈川県', '東京都'],
      primaryPrefecture: '神奈川県',
      name: '横浜ベイサイド・ドローンアカデミー（みなとみらい・厚木校）',
      registrationCode: '国土交通省 登録講習機関 T0089-002',
      tagline: 'インフラ点検・測量実務直結。週末2日間で修了できる社会人特化型カリキュラム',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金対象', '人材開発支援助成金対応'],
      features: [
        '土日祝の週末集中コース追加料金なし。会社を休まずに二等（基本＋夜間・目視外）を修了可能',
        '修了生には無料で月2回の屋内ATTIモード自主練習コート開放特典つき',
        '橋梁・外壁点検プロ講師による実務フライトプラン作成指導'
      ],
      tuitionFrom: 176000,
      passRate: 97.9,
      cpaReward: 12000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-kanto-chiba-saitama-03',
      area: '関東',
      prefectures: ['千葉県', '埼玉県', '茨城県'],
      primaryPrefecture: '千葉県',
      name: '関東広域ドローンフライトパーク（幕張・大宮校）',
      registrationCode: '国土交通省 登録講習機関 T0115-001',
      tagline: '25kg以上大型機・一等25m高度飛行に対応した関東最大級の専用テストフィールド',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['人材開発支援助成金対応', '農業ドローン補助金対象'],
      features: [
        '一等実地試験と同じ寸法・高度の屋外常設コートで風速補正（ATTI 8の字）を徹底反復',
        '第5版で緩和された「工業専用地域での夜間農薬散布」に対応した大型農業機コースも併設',
        '無料駐車場50台完備・最寄り駅から無料シャトル運行'
      ],
      tuitionFrom: 165000,
      passRate: 97.2,
      cpaReward: 12000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-chubu-aichi-01',
      area: '中部',
      prefectures: ['愛知県', '長野県', '静岡県', '岐阜県'],
      primaryPrefecture: '愛知県',
      name: '名古屋セントラル無人航空機教習所（栄・豊田・松本キャンパス）',
      registrationCode: '国土交通省 登録講習機関 T0154-001',
      tagline: '中部・東海エリア実績No.1。製造業・建設業の法人助成金活用サポート専任窓口を完備',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金（最大40%特定一般）', '人材開発支援助成金（社労士無料相談）'],
      features: [
        '特定一般教育訓練給付金（受講料の40%支給）指定講座あり。実質10万円台前半で国家資格を取得可能',
        '長野県（松本・伊那）の山間部物流・目視外長距離フライト実証フィールドでの一等講習も選択可',
        '修了審査の「机上試験・口述試験」対策ゼミを開講し、初回合格率98.6%を達成'
      ],
      tuitionFrom: 181500,
      passRate: 98.6,
      cpaReward: 13500,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-kansai-osaka-01',
      area: '関西',
      prefectures: ['大阪府', '兵庫県', '京都府', '奈良県', '滋賀県'],
      primaryPrefecture: '大阪府',
      name: '関西エアモビリティ登録講習学院（梅田・神戸ポートアイランド・京都伏見校）',
      registrationCode: '国土交通省 登録講習機関 T0067-001',
      tagline: '大阪・兵庫・京都の3拠点相互利用OK。冷暖房完備の屋内コートで夜間・目視外まで一発修了',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金対象', '人材開発支援助成金（最大75%）', 'リスキリング補助金対応'],
      features: [
        '梅田校（学科・シミュレーター）・神戸校（大型屋内/屋外コート）・京都校をスケジュールに合わせて自由選択',
        '国家試験の審査官経験を持つ一等操縦士インストラクターがマンツーマンでATTI操作を指導',
        'DIPS 2.0での技能証明申請から機体登録・包括飛行許可申請まで卒業後も無期限サポート'
      ],
      tuitionFrom: 178000,
      passRate: 98.1,
      cpaReward: 14000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-hokkaido-tohoku-01',
      area: '北海道・東北',
      prefectures: ['北海道', '宮城県', '福島県', '岩手県'],
      primaryPrefecture: '北海道',
      name: '北日本ドローン・スマートアグリ講習センター（札幌・仙台校）',
      registrationCode: '国土交通省 登録講習機関 T0203-001',
      tagline: '冬季でも快適な全天候型暖房体育館コート完備。広大な屋外試験場での一等・スマート農業特化',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金対象', '人材開発支援助成金対応', 'スマート農業導入支援対象'],
      features: [
        '積雪期でも毎週開講できる大型屋内ドーム（札幌・仙台）で最短2日間の二等実技修了審査を実施',
        '25kg以上の農薬散布機・大型物流機による「物件投下・危険物輸送」の限定変更・実務講習に強み',
        '遠方からの受講生向けにホテル宿泊パック（実質無料補助）を用意'
      ],
      tuitionFrom: 169000,
      passRate: 97.5,
      cpaReward: 11000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-chugoku-shikoku-01',
      area: '中国・四国',
      prefectures: ['広島県', '岡山県', '香川県', '愛媛県'],
      primaryPrefecture: '広島県',
      name: '瀬戸内エアロテック登録講習機関（広島・高松校）',
      registrationCode: '国土交通省 登録講習機関 T0241-001',
      tagline: '多島美エリアでの離島物流・橋梁点検ノウハウを凝縮。一等・二等実地免除コース毎日開講',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金対象', '人材開発支援助成金対応'],
      features: [
        '中国・四国エリア最大級の屋内練習コート（夜間照明遮断設備つき）で仕事帰り18時からの夜間実技受講も可',
        '海風・突風環境を想定した実践的な緊急帰還（RTH）および安全管理措置の机上試験対策が充実'
      ],
      tuitionFrom: 172000,
      passRate: 97.6,
      cpaReward: 11000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-kyushu-okinawa-01',
      area: '九州・沖縄',
      prefectures: ['福岡県', '熊本県', '鹿児島県', '沖縄県'],
      primaryPrefecture: '福岡県',
      name: '九州スカイネクスト登録講習アカデミー（博多・熊本・那覇校）',
      registrationCode: '国土交通省 登録講習機関 T0178-001',
      tagline: '博多駅から15分。九州・沖縄全県で「オンライン学科＋最短2日実技」のハイブリッド受講を実現',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金（最大20%還付）', '人材開発支援助成金（最大75%）'],
      features: [
        '学科講習（二等10h / 一等18h）はスマホ・PCで24時間受講できる国交省認定eラーニングを採用',
        '実技は博多・熊本・那覇の提携屋内コートで最短2日間で完結し、指定試験機関の実地試験が100%免除',
        '建設ICT・太陽光パネル赤外線点検の案件紹介ネットワークあり'
      ],
      tuitionFrom: 174000,
      passRate: 98.0,
      cpaReward: 12500,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    },
    {
      id: 'sch-national-online-01',
      area: '全国オンライン学科対応',
      prefectures: ['全国オンライン学科対応', '東京都', '大阪府', '愛知県', '福岡県', '北海道', '宮城県', '広島県'],
      primaryPrefecture: '全国オンライン学科対応',
      name: 'AERO-PASS公認 全国オンライン学科＆47都道府県実技提携ネットワーク',
      registrationCode: '国土交通省 登録講習機関 広域提携コンソーシアム T0012-999',
      tagline: '自宅からオンラインで学科修了！実技審査はお近くの都道府県提携コート（全国65拠点）で最短1〜2日',
      supportedLicenses: ['nitou_basic', 'nitou_full', 'ittou_basic', 'ittou_full'],
      hasNightVisionCourse: true,
      hasNightPracticeCourt: true,
      subsidyBadges: ['教育訓練給付金対象', '人材開発支援助成金対応', '全国47都道府県の実技会場網'],
      features: [
        '学科講習は完全オンライン（オンデマンド映像＋確認テスト）のため、通学ゼロで自宅から修了可能',
        '実技講習・修了審査は全国47都道府県の最寄り提携コートをコンシェルジュがマッチング',
        'パンフレット一括請求で「AERO-PASS 一等・二等オールインワン合格パス（¥2,980）」が即時永久アンロック'
      ],
      tuitionFrom: 162800,
      passRate: 98.2,
      cpaReward: 13000,
      dualOfferBadge: '🎁 資料請求でAERO-PASS合格パス(¥2,980)即時無料解放'
    }
  ];

  /**
   * コンバージョン・アフィリエイト成果報酬集計ステート
   */
  const conversionStats = {
    totalLeadsSubmitted: 25,           // 今月の初期累計リード数（デモ初期値）
    totalCpaRevenueYen: 312500,        // 今月の累計アフィリエイト報酬額（円）
    freePassUnlockedCount: 25,         // デュアルオファーによる合格パス無料解放数
    byArea: {
      '関東': 10,
      '関西': 5,
      '中部': 4,
      '九州・沖縄': 3,
      '北海道・東北': 1,
      '中国・四国': 1,
      '全国オンライン学科対応': 1
    },
    byLicense: {
      nitou_basic: 8,
      nitou_full: 11,
      ittou_basic: 4,
      ittou_full: 2
    },
    recentLeads: []
  };

  /**
   * 条件に応じて提携ドローンスクールを検索・フィルタリングする
   * @param {Object} [filters={}]
   * @param {string} [filters.prefecture] - 都道府県名またはエリア名（例: '東京都', '関東', '全国オンライン学科対応'）
   * @param {string} [filters.area] - エリア名
   * @param {string} [filters.licenseType] - 'nitou_basic' | 'nitou_full' | 'ittou_basic' | 'ittou_full'
   * @param {boolean} [filters.requireNightCourt] - 夜間練習コート必須フラグ
   * @param {string} [filters.subsidyType] - 'kyufukin' | 'joseikin'
   * @returns {Array<Object>} マッチした登録講習機関リスト
   */
  function searchSchools(filters = {}) {
    const prefOrArea = (filters.prefecture || filters.area || '').trim();
    const licenseType = filters.licenseType || '';
    const requireNightCourt = Boolean(filters.requireNightCourt);
    const subsidyType = filters.subsidyType || '';

    let matched = schoolDirectory.filter((school) => {
      if (prefOrArea && prefOrArea !== 'すべて' && prefOrArea !== 'all') {
        const matchPref = school.prefectures.some((p) => p.includes(prefOrArea) || prefOrArea.includes(p));
        const matchArea = school.area.includes(prefOrArea) || prefOrArea.includes(school.area);
        const isNational = school.area === '全国オンライン学科対応';
        if (!matchPref && !matchArea && !isNational) {
          return false;
        }
      }
      if (licenseType && !school.supportedLicenses.includes(licenseType)) {
        return false;
      }
      if (requireNightCourt && !school.hasNightPracticeCourt) {
        return false;
      }
      if (subsidyType === 'kyufukin') {
        const hasKyufu = school.subsidyBadges.some((b) => b.includes('教育訓練給付'));
        if (!hasKyufu) return false;
      }
      if (subsidyType === 'joseikin') {
        const hasJosei = school.subsidyBadges.some((b) => b.includes('助成金'));
        if (!hasJosei) return false;
      }
      return true;
    });

    // 指定エリアが先頭に来るようにソート（全国オンラインは後ろに添える）
    matched.sort((a, b) => {
      const aExact = a.primaryPrefecture === prefOrArea || a.area === prefOrArea ? 1 : 0;
      const bExact = b.primaryPrefecture === prefOrArea || b.area === prefOrArea ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return b.cpaReward - a.cpaReward;
    });

    return matched;
  }

  /**
   * 資料請求・無料体験予約リードを送信し、デュアルオファー（AERO-PASS合格パス即時無料解放）とCPA集計を実行する
   * @param {Object} leadPayload
   * @param {string} [leadPayload.prefecture='東京都'] - 希望都道府県・エリア
   * @param {string} [leadPayload.licenseType='nitou_full'] - 希望資格区分
   * @param {string} [leadPayload.expLevel='beginner'] - 現在の操縦経験
   * @param {string} [leadPayload.subsidyType='kyufukin'] - 希望給付金区分
   * @param {string} [leadPayload.schoolId] - 指名スクールID（省略時はエリア適合スクール一括）
   * @param {string} [leadPayload.userEmail] - ユーザー連絡先（デモ時は任意）
   * @returns {Object} リード送信結果・アンロックされた特典パス情報・アフィリエイト成果情報
   */
  function submitLead(leadPayload = {}) {
    const pref = leadPayload.prefecture || '東京都';
    const licenseType = leadPayload.licenseType || 'nitou_full';
    const expLevel = leadPayload.expLevel || 'beginner';
    const subsidyType = leadPayload.subsidyType || 'kyufukin';

    const matchedSchools = searchSchools({
      prefecture: pref,
      licenseType: licenseType
    });

    const targetSchools = leadPayload.schoolId
      ? schoolDirectory.filter((s) => s.id === leadPayload.schoolId)
      : matchedSchools.slice(0, 3);

    const primarySchool = targetSchools[0] || schoolDirectory[0];
    const cpaEarned = primarySchool.cpaReward || 12000;
    const leadId = 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    const unlockToken = 'AEROPASS-FREE-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // コンバージョン集計の更新
    conversionStats.totalLeadsSubmitted += 1;
    conversionStats.totalCpaRevenueYen += cpaEarned;
    conversionStats.freePassUnlockedCount += 1;

    const areaKey = primarySchool.area || '全国オンライン学科対応';
    conversionStats.byArea[areaKey] = (conversionStats.byArea[areaKey] || 0) + 1;
    conversionStats.byLicense[licenseType] = (conversionStats.byLicense[licenseType] || 0) + 1;

    const leadRecord = {
      leadId: leadId,
      timestamp: new Date().toISOString(),
      prefecture: pref,
      area: areaKey,
      licenseType: licenseType,
      expLevel: expLevel,
      subsidyType: subsidyType,
      matchedSchoolNames: targetSchools.map((s) => s.name),
      cpaRewardYen: cpaEarned,
      dualOfferUnlocked: true,
      unlockToken: unlockToken
    };
    conversionStats.recentLeads.unshift(leadRecord);

    // デュアルオファー処理：AERO-PASS 合格パス（¥2,980相当）を即時アンロック
    try {
      if (global.localStorage) {
        global.localStorage.setItem('aero_pass_unlocked', 'true');
        global.localStorage.setItem('aero_pass_unlock_reason', 'school_lead_dual_offer');
        global.localStorage.setItem('aero_pass_unlock_token', unlockToken);
      }
    } catch (_) {
      // localStorage制限環境でもエラーにしない
    }

    if (typeof global.setAccessTier === 'function') {
      try {
        global.setAccessTier('pass');
      } catch (_) {}
    }

    return {
      success: true,
      leadId: leadId,
      unlockToken: unlockToken,
      dualOffer: {
        unlocked: true,
        unlockedPlanName: '一等＆二等 オールインワン合格パス（¥2,980相当）',
        pricePaid: 0,
        message: `🎉【デュアルオファー適用】「${pref}」対応の提携登録講習機関（${targetSchools.map((s) => s.name).join(' / ')}）のパンフレット・実地免除カリキュラム資料を送信しました！特典として『AERO-PASS 合格パス（¥2,980相当）』が今すぐ無料で全機能アンロックされました。`
      },
      matchedSchools: targetSchools,
      affiliateMetrics: {
        cpaEarnedYen: cpaEarned,
        cumulativeLeads: conversionStats.totalLeadsSubmitted,
        cumulativeRevenueYen: conversionStats.totalCpaRevenueYen
      }
    };
  }

  /**
   * 現在の送客コンバージョン・CPA収益サマリーを取得する
   */
  function getConversionAnalytics() {
    const avgCpa =
      conversionStats.totalLeadsSubmitted > 0
        ? Math.round(conversionStats.totalCpaRevenueYen / conversionStats.totalLeadsSubmitted)
        : 12500;
    return {
      totalLeadsSubmitted: conversionStats.totalLeadsSubmitted,
      totalCpaRevenueYen: conversionStats.totalCpaRevenueYen,
      averageCpaYen: avgCpa,
      freePassUnlockedCount: conversionStats.freePassUnlockedCount,
      byArea: Object.assign({}, conversionStats.byArea),
      byLicense: Object.assign({}, conversionStats.byLicense),
      recentLeads: conversionStats.recentLeads.slice(0, 10)
    };
  }

  // ============================================================================
  // 3. SEO集客＆試験直前5分暗記用「教則第5版 改訂早見表 ＆ 頻出数値チートシート」
  // ============================================================================

  const seoCheatSheet = {
    meta: {
      title: '無人航空機の飛行の安全に関する教則（第5版・2026年7月14日試験適用）完全攻略チートシート',
      targetKeywords: [
        '無人航空機操縦士 教則第5版 違い',
        'ドローン国家資格 学科試験 頻出数値 暗記',
        '一等無人航空機操縦士 計算問題 公式 フレネルゾーン 旋回半径',
        'ドローン 一発試験 スクール 費用 比較'
      ],
      lastUpdated: '2026-07-14'
    },

    /**
     * 試験直前5分で確認できる「教則第4版 → 第5版 全改訂箇所一覧表」
     */
    edition5DiffTable: [
      {
        id: 'diff-01',
        chapter: '教則第5版 第3章 3.1.2(2)1) 飛行の許可が必要となる空域（DID特例）',
        topic: '① 都市計画法「工業専用地域」内の区域におけるDID飛行許可不要の特例',
        oldEdition4: '国勢調査の結果による人口集中地区（DID）上空での飛行は、都市計画法上の用途地域にかかわらず原則として国土交通大臣の飛行許可が必要とされていた。',
        newEdition5: '都市計画法第8条第1項第1号に規定する「工業専用地域」内の区域（水面を含む）で飛行させる場合は、国勢調査のDIDに含まれていても居住者が原則存在しないため、DIDに係る飛行許可手続きが不要となった。',
        examTrapPoint: '「工業地域」や「準工業地域」は除外されず従来通りDID許可が必要。「工業専用地域」のみがDID飛行許可不要となる名称のひっかけに注意。',
        importance: '★★★（最頻出）'
      },
      {
        id: 'diff-02',
        chapter: '教則第5版 第3章 3.1.2(2)3) 農薬等の空中散布における承認不要の特例',
        topic: '② 一定の要件を満たす農薬等の空中散布における「5つの飛行方法承認」不要特例',
        oldEdition4: '農薬等の空中散布を行う際は、「危険物輸送」「物件投下」「夜間飛行」「目視外飛行」「第三者から30m未満の飛行」について個別に国土交通大臣の承認申請が必要であった。',
        newEdition5: '航空法施行規則第236条の82第1項第2号の要件（立入管理措置等）を満たして農薬等の空中散布を行う場合、①夜間飛行、②目視外飛行、③第三者（又は物件）から30m未満の飛行、④危険物の輸送、⑤物件の投下の「5つの承認手続き」が不要となった。',
        examTrapPoint: '不要になるのは飛行方法の「5つの承認（夜・目・30m・危・投）」であり、空港周辺や地表から150m以上、催し場所上空などの空域「許可」まで不要になるわけではない点に注意。',
        importance: '★★★（最頻出）'
      },
      {
        id: 'diff-03',
        chapter: '教則第5版 第3章・第4章 物件投下時の安全確保措置（補助者なし高度制限）',
        topic: '③ 補助者を配置しないで行う物件投下の高度制限（原則1m以内）',
        oldEdition4: '物件投下時の高度目安と農薬散布高度や一般的な荷下ろし手順の記載が混同されやすかった。',
        newEdition5: '投下場所に補助者を配置しないで無人航空機から物件投下（または物件の切り離し・設置）を行う場合の高度は「原則 1m 以内」と明確に規定された（液体・粉末等の散布は1m以内でも物件投下に該当するが、農薬散布は要件を満たせば5承認不要特例の対象）。',
        examTrapPoint: '「補助者なしの物件投下は原則5m以内（または10m以内）」という選択肢は誤り（×）。必ず「原則 1m 以内」を選ぶこと。',
        importance: '★★★（最頻出）'
      },
      {
        id: 'diff-04',
        chapter: '教則第5版 第3章 3.2.1 小型無人機等飛行禁止法（対象施設周辺地域の拡大）',
        topic: '④ 小型無人機等飛行禁止法の対象施設周辺地域「おおむね300m / 一部重要施設はおおむね1,000m」',
        oldEdition4: '対象施設の敷地・区域（レッドゾーン）およびその周囲おおむね300mの地域（イエローゾーン）のみが記載されていた。',
        newEdition5: '法改正を反映し、対象施設周辺地域が「対象施設の敷地・区域の周囲おおむね300m（防衛関係施設等の一部対象施設においては周囲おおむね1,000m）」の地域へと拡大されて明記された。',
        examTrapPoint: '小型無人機等飛行禁止法は「100g未満の模型航空機（トイドローン）も規制対象」であり、周辺地域が「おおむね300m（一部重要施設はおおむね1,000m）」である点、48時間前までの通報が必要である点が頻出。',
        importance: '★★★（最頻出）'
      },
      {
        id: 'diff-05',
        chapter: '教則第5版 第3章 3.1.2(5)3) 無人航空機操縦者技能証明の更新申請期間',
        topic: '⑤ 技能証明の更新申請期間「有効期間が満了する日の6月前から1月前まで」',
        oldEdition4: '第4版までは、技能証明の更新は有効期間が満了する日以前「6月以内（満了日当日まで）」に申請すると記載されていた。',
        newEdition5: '技能証明（有効期間3年）の更新申請期間は、登録更新講習機関の講習を修了した上で「有効期間が満了する日の6月前から1月前までの間」に申請する規定へと改訂された。',
        examTrapPoint: '旧第4版の問題集で「満了日当日まで申請可能」と覚えている受験者を狙う最重要ひっかけポイント！第5版では「6月前から1月前まで」が正解。',
        importance: '★★★（最頻出）'
      },
      {
        id: 'diff-06',
        chapter: '教則第5版 第3章・第6章 緊急用務空域の確認義務・賠償保険付保・SORAリスク評価',
        topic: '⑥ 飛行前の緊急用務空域確認義務・賠償保険加入勧奨・SORA（GRC/ARC/SAIL/OSO）体系化',
        oldEdition4: '保険加入は一般的な推奨にとどまり、リスク評価用語にも旧ドラフト表現が一部残っていた。',
        newEdition5: '飛行開始前の「緊急用務空域」指定状況の確認義務（包括許可取得済でも指定時は飛行禁止）、DIPS2.0飛行計画通報と連動した対人・対物損害賠償責任保険への加入（付保）の強い勧奨、および一等カテゴリーⅢ飛行における最終GRC×残留ARC＝SAIL（Ⅰ〜Ⅵ）→OSOロバスト性の体系が明確化された。',
        examTrapPoint: 'ドローンには自動車の自賠責保険のような法定強制保険がないため、民間の損害賠償責任保険への加入が強く勧奨されている点に注意。',
        importance: '★★☆（頻出）'
      }
    ],

    /**
     * 試験直前5分で確認できる「頻出数値（100g, 150m, 30m, 1m, 300m/1000m, 6月前〜1月前, 3年, 20h, 風速5m/s等）暗記カードデータ」
     */
    frequentNumbersCards: [
      {
        id: 'num-100g',
        numberKey: '100g以上',
        category: '機体重量・登録義務',
        frontQuestion: '航空法上の「無人航空機」の対象となる重量（機体本体＋バッテリーの合計重量）の基準は？',
        backAnswer: '100g以上（100g未満は「模型航空機」に分類され、空港周辺・高高度や緊急用務空域、小型無人機等飛行禁止法を除き特定飛行の規制対象外）',
        trapAlert: '⚠️「100gを超える（100gは含まない）」は誤り！正しくは「100g以上（100gちょうどを含む）」。また機体本体＋バッテリー重量で判定する。'
      },
      {
        id: 'num-150m',
        numberKey: '150m以上',
        category: '飛行禁止空域',
        frontQuestion: '国土交通大臣の許可が必要となる「地表又は水面からの高さ」の基準は？',
        backAnswer: '地表又は水面から 150m 以上 の空域（海抜高度ではなく対地高度 AGL で150m以上）',
        trapAlert: '⚠️「標高（海抜）150m以上」は誤り！山岳部では山の斜面（地表）から150m未満であれば高高度空域の許可は不要。'
      },
      {
        id: 'num-30m',
        numberKey: '30m未満 / 30m以下',
        category: '飛行の方法・係留特例',
        frontQuestion: '①第三者または第三者の物件との保安距離、および ②十分な強度の紐による「係留飛行」の上限長さは？',
        backAnswer: '①人又は物件から 30m 未満の飛行は承認が必要（30m以上離せば承認不要） / ②係留飛行の紐の長さ上限は 30m 以下',
        trapAlert: '⚠️ここでいう「人又は物件」は第三者および第三者物件を指し、地面・土地・樹木等の自然物は「物件」に含まれない！'
      },
      {
        id: 'num-1m',
        numberKey: '原則 1m 以内',
        category: '第5版頻出：補助者なし物件投下＆離着陸確認高度',
        frontQuestion: '①投下場所に補助者を配置しないで行う物件投下の高度上限、および ②実地試験の離陸後初期ホバリング確認高度は？',
        backAnswer: '①補助者なしの物件投下高度は「原則 1m 以内」（教則第5版明記） / ②実地試験の初期ホバリング確認も地表から約1〜1.5mで実施',
        trapAlert: '⚠️「補助者なし物件投下＝原則5m以内（または10m以内）」という誤答トラップが頻出！必ず「原則 1m 以内」と暗記すること。'
      },
      {
        id: 'num-1000m',
        numberKey: '300m / 1,000m (1km)',
        category: '第5版改訂：小型無人機等飛行禁止法',
        frontQuestion: '小型無人機等飛行禁止法における対象施設周辺地域（イエローゾーン）の範囲は？（教則第5版改訂）',
        backAnswer: '対象施設の敷地・区域の周囲「おおむね 300m」（防衛関係施設等の一部対象施設では周囲「おおむね 1,000m」）の地域',
        trapAlert: '⚠️第4版までは「おおむね300m」のみだったが、第5版（3.2.1）で「一部対象施設ではおおむね1,000m」への拡大が明記された！'
      },
      {
        id: 'num-6m-1m',
        numberKey: '6月前〜1月前まで',
        category: '第5版改訂：技能証明の更新申請期間',
        frontQuestion: '無人航空機操縦者技能証明（有効期間3年）の「更新申請期間」はいつからいつまでか？（教則第5版改訂）',
        backAnswer: '有効期間が満了する日の「6月前から1月前までの間」に更新を申請する（登録更新講習機関の講習修了が必要）',
        trapAlert: '⚠️第4版の「満了日以前6月以内（満了日当日まで）」は第5版では誤り（×）！満了日の1月前までに申請しなければならない。'
      },
      {
        id: 'num-3years',
        numberKey: '3年',
        category: '有効期間（技能証明・機体登録）',
        frontQuestion: '①無人航空機操縦者「技能証明書」の有効期間 と ②「無人航空機の登録（JU登録記号）」の有効期間は？',
        backAnswer: 'どちらも「3年」（一等・二等ともに3年ごとに更新が必要。なお国勢調査によるDID設定は「5年」ごと）',
        trapAlert: '⚠️「二等は3年、一等は5年」や「DIDは10年ごとの国勢調査」という数字の入れ替え引っかけ問題に注意！'
      },
      {
        id: 'num-8h-20h',
        numberKey: '20時間毎',
        category: '飛行日誌・点検整備記録',
        frontQuestion: '「飛行日誌（様式3：点検整備記録）」において定期点検を実施すべき総飛行時間間隔の基準は？',
        backAnswer: '原則として「20時間飛行ごと」（またはメーカー指定の点検時間間隔・部品交換時）に点検整備を実施し様式3へ記載する',
        trapAlert: '⚠️飛行前後の毎回記入する「様式2：日常点検記録」と、20時間毎や部品交換時に記入する「様式3：点検整備記録」の連動が実地試験で問われる！'
      },
      {
        id: 'num-wind-5ms',
        numberKey: '風速 5m/s 以上',
        category: '気象・飛行中止基準（農薬は3m/s以下）',
        frontQuestion: '航空局標準飛行マニュアルおよび実地試験における飛行中止基準の風速と、農薬空中散布の実施基準風速は？',
        backAnswer: '標準マニュアル・実地試験では「風速 5m/s 以上」で飛行中止。なお農薬空中散布ではドリフト防止のため「地上風速 3m/s 以下」が実施基準。',
        trapAlert: '⚠️机上試験（用紙A/B）の農薬散布シナリオで「機体耐風速8m/s・当日風速6m/s」と出た場合、農薬飛散基準（3m/s以下）超過のため飛行中止となる！'
      },
      {
        id: 'num-25kg',
        numberKey: '25kg (20mm / 3mm)',
        category: '機体区分・登録記号の文字サイズ',
        frontQuestion: '最大離陸重量「25kg」を境に変わる①技能証明の限定区分、②カテゴリーⅡBの上限、③登録記号の表示文字高さは？',
        backAnswer: '①25kg以上は技能証明の限定変更が必要、②カテゴリーⅡB（許可承認不要）は25kg未満のみ対象、③登録記号の高さは「25kg以上＝20mm以上」「25kg未満＝3mm以上」',
        trapAlert: '⚠️25kg以上の大型機は、たとえ第二種機体認証＋二等/一等技能証明があってもカテゴリーⅡB（許可承認不要）の対象外となり必ず許可・承認が必要！'
      }
    ],

    /**
     * 一等無人航空機操縦士 計算公式チートシート
     */
    ittouFormulaCards: [
      {
        id: 'form-turn-radius',
        title: '① 定常水平旋回の旋回半径 r と 荷重倍数 n',
        formulaText: 'r = v² / (g × tanθ)   ｜   n = L / W = 1 / cosθ',
        variables: 'v: 飛行速度(m/s), g: 重力加速度(9.8m/s²), θ: バンク角(度), n: 荷重倍数(G)',
        quickRule: '【秒殺暗記】速度 v が2倍になると旋回半径 r は「4倍（2²）」になる！ バンク角 θ=45° のとき tan45°=1 なので r = v² / 9.8、荷重倍数 n = 1/cos45° ≒ 1.41倍。バンク角 θ=60° のとき cos60°=0.5 なので荷重倍数 n = 2.0倍！',
        exampleCalc: '例：速度 v = 14 m/s、バンク角 θ = 45° のとき → r = 14² / (9.8 × 1) = 196 / 9.8 = 20 m'
      },
      {
        id: 'form-stall-speed',
        title: '② 旋回中の失速速度 V_sθ の上昇',
        formulaText: 'V_sθ = V_s × √n = V_s / √(cosθ)',
        variables: 'V_s: 水平直線飛行時の失速速度(m/s), n: 荷重倍数(1/cosθ)',
        quickRule: '【秒殺暗記】バンク角が深くなるほど揚力の鉛直成分が減り、必要揚力を維持するために失速速度は √n 倍に上昇する！ θ=60°（n=2）のとき、失速速度は √2 ≒ 1.41倍になる。',
        exampleCalc: '例：水平失速速度 10 m/s の機体がバンク角 60° で旋回するとき → 旋回中失速速度 = 10 × √2 = 14.1 m/s'
      },
      {
        id: 'form-fresnel',
        title: '③ 電波伝搬・第1フレネルゾーン半径 r₁',
        formulaText: 'r₁ = √( (λ × d₁ × d₂) / (d₁ + d₂) )   ※波長 λ = c / f （c = 3×10⁸ m/s）',
        variables: 'λ: 波長(m), d₁: 送信点から障害物までの距離(m), d₂: 障害物から受信点までの距離(m)',
        quickRule: '【秒殺暗記】2.4GHz帯の波長 λ ≒ 0.125m（1/8m）。送受信の中間点（d₁=d₂）で半径 r₁ は最大となり、第1フレネルゾーンの断面積の「60%以上」が障害物で遮られないこと（閉塞率40%以下、クリアランス60%以上）が良好な通信の条件！',
        exampleCalc: '例：波長 λ = 0.125m、通信距離 800m の中間点（d₁=400m, d₂=400m） → r₁ = √(0.125 × 400 × 400 / 800) = √25 = 5.0 m'
      },
      {
        id: 'form-glide-ratio',
        title: '④ 揚抗比（滑空比 L/D）と水平滑空到達距離 D',
        formulaText: '水平到達距離 D = 高度 H × (L / D)   ※無風・定常滑空時',
        variables: 'H: 飛行高度(m), L: 揚力(N), D: 抗力(N), L/D: 揚抗比',
        quickRule: '【秒殺暗記】最大揚抗比（L/Dが最大となる迎角）で飛行するとき、水平滑空距離および航続距離が最大となる！追い風時は対地到達距離が伸び、向かい風時は縮む。',
        exampleCalc: '例：高度 120 m、揚抗比 L/D = 4.5 の固定翼機が動力停止で滑空する場合 → 水平到達距離 = 120 × 4.5 = 540 m'
      }
    ]
  };

  /**
   * チートシートデータをカテゴリやキーワードで検索するヘルパー関数
   * @param {string} [query='']
   * @returns {Object} フィルタリングされたチートシート項目
   */
  function searchCheatSheet(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        diffs: seoCheatSheet.edition5DiffTable,
        numbers: seoCheatSheet.frequentNumbersCards,
        formulas: seoCheatSheet.ittouFormulaCards
      };
    }
    return {
      diffs: seoCheatSheet.edition5DiffTable.filter(
        (item) =>
          item.topic.toLowerCase().includes(q) ||
          item.newEdition5.toLowerCase().includes(q) ||
          item.chapter.toLowerCase().includes(q)
      ),
      numbers: seoCheatSheet.frequentNumbersCards.filter(
        (card) =>
          card.numberKey.toLowerCase().includes(q) ||
          card.frontQuestion.toLowerCase().includes(q) ||
          card.backAnswer.toLowerCase().includes(q)
      ),
      formulas: seoCheatSheet.ittouFormulaCards.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.formulaText.toLowerCase().includes(q) ||
          f.quickRule.toLowerCase().includes(q)
      )
    };
  }

  // ============================================================================
  // Export to window.AERO_GROWTH_FUNNEL
  // ============================================================================
  global.AERO_GROWTH_FUNNEL = {
    version: '5.0.0-2026',
    // 1. ROI Simulator
    LICENSE_SPEC_MASTER: LICENSE_SPEC_MASTER,
    EXPERIENCE_PROFILE_MASTER: EXPERIENCE_PROFILE_MASTER,
    SUBSIDY_SCHEME_MASTER: SUBSIDY_SCHEME_MASTER,
    calculateExamROI: calculateExamROI,

    // 2. School Directory & Lead Gen Engine
    schoolDirectory: schoolDirectory,
    searchSchools: searchSchools,
    submitLead: submitLead,
    conversionStats: conversionStats,
    getConversionAnalytics: getConversionAnalytics,

    // 3. SEO & 5th Edition Cheat Sheet
    seoCheatSheet: seoCheatSheet,
    searchCheatSheet: searchCheatSheet
  };
})(typeof window !== 'undefined' ? window : globalThis);
