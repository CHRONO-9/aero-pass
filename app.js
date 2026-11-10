// ============================================================================
// AERO-PASS All-in-One MVP Application Logic
// ============================================================================

let currentModule = 'kijo';
let currentAccessTier = 'pass'; // 'free' | 'pass' | 'b2b'

function switchModule(mod) {
  currentModule = mod;
  const mods = ['kijo', 'oral', 'calc', 'cbt', 'monetize'];
  mods.forEach(m => {
    const sec = document.getElementById('mod-' + m);
    const tab = document.getElementById('nav-' + m);
    if (m === mod) {
      sec.classList.remove('hidden');
      tab.classList.add('active');
    } else {
      sec.classList.add('hidden');
      tab.classList.remove('active');
    }
  });
  if (mod === 'calc') {
    renderCalcVisualizer();
  }
}

function setAccessTier(tier) {
  currentAccessTier = tier;
  ['free', 'pass', 'b2b'].forEach(t => {
    const btn = document.getElementById('tier-' + t);
    if (t === tier) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  if (tier === 'b2b') {
    switchModule('monetize');
  } else if (tier === 'free') {
    openPaywallModal();
  }
}

function openPaywallModal() {
  document.getElementById('paywall-modal').classList.remove('hidden');
}

function closePaywallModal() {
  document.getElementById('paywall-modal').classList.add('hidden');
}

function activatePass(grade) {
  setAccessTier('pass');
  closePaywallModal();
  const label = grade === 'ittou' ? '一等＆二等 オールインワン合格パス (¥2,980)' : '二等・完全合格パス (¥1,980)';
  alert(`✅ ${label} が有効化されました！全シナリオ・無限計算ドリルが利用可能です。`);
}

// ============================================================================
// MODULE 1: 実地試験 — 机上試験（飛行計画マップ＆用紙B 4問20点演習）
// ============================================================================
const kijoScenarios = [
  {
    title: '演習1: 橋梁点検（強風・高圧線RTH不備）',
    specDrone: '最大耐風速 10m/s / 防水なし (IPX0)',
    specWeather: '18:30 (日没後・夜間) / 予報風速 12m/s',
    specRth: 'RTH高度 25m (経路上の高圧送電線 35m)',
    zoneLabel: '人口集中地区 (住宅地DID)',
    hotspots: {
      rth: '⚠️ 【危機回避設定の不備】経路上に高さ35mの高圧送電線が存在するのに、自動帰還(RTH)高度が25mに設定されており、帰還時に衝突する危険があります。',
      dist: '⚠️ 【第三者物件との距離・立入管理】病院・一般道路から15m（30m未満）を飛行する計画ですが、立入管理措置や補助者配置が計画されていません。',
      wind: '⚠️ 【機体の限界事項超過】当日の予報風速(12m/s)が、使用機体の最大耐風速(10m/s)を超過しているため、飛行を中止・延期する必要があります。'
    },
    questions: [
      {
        label: '問1 [航空法の法令遵守 (5点)] 本飛行計画における特定飛行の許可・承認の要否として正しいものは？',
        options: [
          { text: '住宅地DIDの上空かつ日没後・第三者物件から15mの飛行であるため、DID許可および夜間・30m未満の承認が必要', correct: true },
          { text: '二等無人航空機操縦士の技能証明を保有していれば、立入管理措置なしでも許可・承認ともに不要', correct: false },
          { text: '橋梁点検は公共性が高いため、航空法の特定飛行の規制対象外となる', correct: false }
        ]
      },
      {
        label: '問2 [安全確保の措置 (5点)] 第三者建物および一般道路（距離15m）付近を飛行する際の安全措置として適切なものは？',
        options: [
          { text: '第三者の立入りを制限する立入管理区画を設定し、補助者を配置して監視・誘導を行う', correct: true },
          { text: '飛行速度を最大に上げて短時間で通過すれば、立入管理区画や補助者は不要である', correct: false },
          { text: 'スピーカーで警告音を鳴らせば第三者の真上をそのまま飛行してよい', correct: false }
        ]
      },
      {
        label: '問3 [機体の仕様・限界事項 (5点)] 当日の気象条件（予報風速12m/s）に対する判断として最も適切なものは？',
        options: [
          { text: '使用機体の最大耐風速（10m/s）を超えているため、飛行を中止または気象回復まで延期する', correct: true },
          { text: 'GNSSを切ってATTIモードに切り替えれば、耐風速10m/sを超えていても安全に飛行できる', correct: false },
          { text: '離陸重量を重くするためにバラストを積載して計画通り飛行する', correct: false }
        ]
      },
      {
        label: '問4 [自動飛行・危機回避機能 (5点)] リターン・トゥ・ホーム（RTH）高度の設定に関する判断として適切なものは？',
        options: [
          { text: '経路上の最高障害物である高圧送電線（高さ35m）との衝突を防ぐため、35mに安全マージンを加えた高度（例: 45〜50m）へ変更する', correct: true },
          { text: 'バッテリー消費を抑えるため、現在設定されている25mのまま変更せずに飛行する', correct: false },
          { text: 'すべての障害物を避けるため、RTH高度を地表から160mに設定変更する', correct: false }
        ]
      }
    ]
  },
  {
    title: '演習2: 工業専用地域での夜間農薬散布（教則第5版特例）',
    specDrone: '農薬散布機 (最大耐風速 8m/s / IP54防滴)',
    specWeather: '20:00 (夜間) / 風速 4m/s / 視程良好',
    specRth: 'RTH高度 15m (周囲障害物 最高8m)',
    zoneLabel: '都市計画法「工業専用地域」内の農地・緑地',
    hotspots: {
      rth: '✅ 【教則第5版・重要改訂】都市計画法上の「工業専用地域」内の区域では、国勢調査のDIDに含まれていてもDID飛行許可手続きが不要となりました。',
      dist: '✅ 【教則第5版・農薬散布の特例】一定の要件（立入管理措置等）を満たす農薬等の空中散布では、夜間・目視外・30m未満・危険物輸送・物件投下の5つの承認手続きが不要となります。',
      wind: '⚠️ 【補助者なし物件投下の高度制限】補助者を配置せずに農薬散布（物件投下）を行う場合、原則として高度1m以内（または立入管理措置の要件遵守）が求められます。'
    },
    questions: [
      {
        label: '問1 [航空法の遵守・教則第5版 (5点)] 都市計画法の「工業専用地域」内で飛行させる場合のDID許可について正しいものは？',
        options: [
          { text: '教則第5版に基づき、工業専用地域内の区域での飛行はDIDに係る飛行許可手続きが不要である', correct: true },
          { text: '工業専用地域であっても、DIDに該当する場合は必ず国土交通大臣の許可が必要である', correct: false },
          { text: '工業地域および準工業地域もすべてDID許可が不要となる', correct: false }
        ]
      },
      {
        label: '問2 [農薬散布の特例・教則第5版 (5点)] 航空法施行規則の要件を満たして農薬の空中散布を行う場合に不要となる手続きは？',
        options: [
          { text: '夜間飛行・目視外飛行・第三者から30m以内の飛行・危険物輸送・物件投下に係る「承認」手続きが不要となる', correct: true },
          { text: '空港周辺や150m以上の空域における「許可」も含めてすべての手続きが不要となる', correct: false },
          { text: '機体登録およびリモートIDの搭載義務が不要となる', correct: false }
        ]
      },
      {
        label: '問3 [機体の仕様・限界事項 (5点)] 散布機体の耐風速8m/sに対し、当日風速4m/s・小雨の予報である。確認すべき事項は？',
        options: [
          { text: '風速は限界内であり機体はIP54防滴仕様だが、送信機（プロポ）側の防水性能および農薬飛散（ドリフト）基準を満たすか確認する', correct: true },
          { text: '機体が防滴であれば、送信機が非防水でも雨天でそのまま使用して問題ない', correct: false },
          { text: '農薬を規定濃度より2倍濃くして短時間で散布を終える', correct: false }
        ]
      },
      {
        label: '問4 [自動飛行・フェイルセーフ (5点)] 農薬タンク積載時のバッテリー電圧低下に対する危機回避設定として適切なものは？',
        options: [
          { text: '満載時は消費電力が大きくなるため、余裕をもった残量閾値で自動帰還または着陸する設定とし、緊急着陸地点を事前設定する', correct: true },
          { text: 'バッテリー残量0%まで散布を継続できるよう、低電圧アラームを無効化する', correct: false },
          { text: '電波ロスト時はその場で農薬を全量投棄する設定にする', correct: false }
        ]
      }
    ]
  },
  {
    title: '演習3: 市街地イベント空撮（催し場所・緊急着陸地点不備）',
    specDrone: '空撮機 900g (最大耐風速 10m/s)',
    specWeather: '13:00 (昼間) / 風速 6m/s / 晴天',
    specRth: '緊急着陸地点の未設定・催し場所上空通過',
    zoneLabel: '屋外フェスティバル会場 (多数の者の集合する催し)',
    hotspots: {
      rth: '⚠️ 【催し場所上空の飛行規制】多数の者の集合する催し場所の上空飛行は、特定の許可要件（飛行経路下の立入禁止区画設定や係留等）を満たさなければ飛行できません。',
      dist: '⚠️ 【緊急着陸地点の未設定】飛行経路上に、機体トラブル時に第三者へ危害を与えずに着陸できる「緊急着陸地点」が確保されていません。',
      wind: '⚠️ 【小型無人機等飛行禁止法（第5版）】対象施設の敷地・区域から周囲おおむね1000mの周辺地域では、同意や通報等の所定手続きが必要です。'
    },
    questions: [
      {
        label: '問1 [航空法・他法令の遵守 (5点)] 多数の者が集合する催し場所の上空での飛行に関する記述として正しいものは？',
        options: [
          { text: '特定飛行（空域の許可対象）に該当し、観客の頭上を避ける立入禁止区画の設定など厳格な安全措置と国土交通大臣の許可が必要', correct: true },
          { text: '主催者の口頭同意さえあれば、航空法上の許可申請なしで観客の真上を飛行できる', correct: false },
          { text: '昼間の目視内飛行であれば、催し場所上空でも特定飛行には当たらない', correct: false }
        ]
      },
      {
        label: '問2 [安全確保措置 (5点)] 飛行計画の作成時に必ず設定・確認すべき安全上の場所として適切なものは？',
        options: [
          { text: '不測の事態（機体不具合や気象急変等）が発生した際に安全に降下できる「緊急着陸地点」を事前に確認・設定しておく', correct: true },
          { text: '催し会場のステージ中央を緊急着陸地点に設定する', correct: false },
          { text: '高度100m以上でホバリングし続ければ緊急着陸地点の設定は不要である', correct: false }
        ]
      },
      {
        label: '問3 [機体の仕様・ペイロード (5点)] 風対策として機体に外付けのプロペラガードを装着した場合の注意点として正しいものは？',
        options: [
          { text: '総重量および空気抵抗が増加するため、飛行可能時間の短縮や耐風性能の変化を考慮して飛行計画を見直す', correct: true },
          { text: 'プロペラガードを装着すると揚力が増えるため、最大飛行時間が長くなる', correct: false },
          { text: '外付け装備を追加しても重心位置や最大離陸重量の確認は不要である', correct: false }
        ]
      },
      {
        label: '問4 [自動飛行・GNSS環境 (5点)] ビルや大型テントに囲まれた会場で自動飛行を行う際のリスク管理として適切なものは？',
        options: [
          { text: 'マルチパスやGNSS受信感度低下により位置保持が不安定になるおそれがあるため、いつでも手動操縦（ATTI等）へ切り替えられる体制をとる', correct: true },
          { text: 'GNSSはビル陰でも絶対に誤差が生じないため、プロポから手を離して自動飛行に任せる', correct: false },
          { text: 'コンパスエラーが出た場合はキャリブレーションを行わずにそのまま離陸する', correct: false }
        ]
      }
    ]
  }
];

let currentKijoIdx = 0;
let kijoTimerInterval = null;
let kijoRemainingSec = 240; // 4 minutes

function loadKijoScenario(idxStr) {
  currentKijoIdx = parseInt(idxStr, 10);
  const sc = kijoScenarios[currentKijoIdx];

  document.getElementById('kijo-spec-drone').textContent = sc.specDrone;
  document.getElementById('kijo-spec-weather').textContent = sc.specWeather;
  document.getElementById('kijo-spec-rth').textContent = sc.specRth;
  document.getElementById('kijo-total-score').textContent = '未採点 / 20点';
  document.getElementById('kijo-grade-feedback').classList.add('hidden');

  // Render Map SVG
  const svg = document.getElementById('kijo-map-svg');
  svg.innerHTML = `
    <g stroke="#cbd5e1" stroke-width="1" opacity="0.5">
      <line x1="0" y1="55" x2="560" y2="55" />
      <line x1="0" y1="110" x2="560" y2="110" />
      <line x1="0" y1="165" x2="560" y2="165" />
      <line x1="110" y1="0" x2="110" y2="220" />
      <line x1="230" y1="0" x2="230" y2="220" />
      <line x1="350" y1="0" x2="350" y2="220" />
      <line x1="470" y1="0" x2="470" y2="220" />
    </g>

    <!-- Zone Box -->
    <rect x="16" y="14" width="215" height="82" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="5 3" />
    <text x="26" y="36" font-size="12" font-weight="700" fill="#0369a1">📍 ${sc.zoneLabel}</text>
    <text x="26" y="56" font-size="11" fill="#334155">クリックして空域・特例要件を確認</text>

    <!-- Hotspot 1: RTH / Obstacle -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('rth')">
      <rect x="255" y="18" width="175" height="64" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
      <text x="266" y="40" font-size="12" font-weight="700" fill="#991b1b">⚡ 経路上の重要チェック点①</text>
      <text x="266" y="60" font-size="11" fill="#7f1d1d">${sc.specRth}</text>
    </g>

    <!-- Hotspot 2: Third Party / Distance -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('dist')">
      <rect x="360" y="125" width="182" height="72" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="2" />
      <text x="372" y="148" font-size="12" font-weight="700" fill="#92400e">🏥 第三者物件・立入管理チェック②</text>
      <text x="372" y="168" font-size="11" fill="#78350f">距離15m / 緊急着陸地点・補助者確認</text>
    </g>

    <!-- Hotspot 3: Weather / Wind -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('wind')">
      <rect x="16" y="125" width="215" height="72" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
      <text x="28" y="148" font-size="12" font-weight="700" fill="#991b1b">💨 気象・機体限界チェック③</text>
      <text x="28" y="168" font-size="11" fill="#7f1d1d">${sc.specWeather}</text>
    </g>

    <!-- Flight Path Line -->
    <polyline points="85,112 185,68 335,55 450,118" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="6 4" />
    <circle cx="85" cy="112" r="9" fill="#059669" />
    <text x="100" y="116" font-size="12" font-weight="700" fill="#065f46">離陸地点 (H)</text>
    <circle cx="450" cy="118" r="8" fill="#0284c7" />
    <text x="464" y="122" font-size="12" font-weight="700" fill="#0369a1">目的地点</text>
  `;

  // Render 4 Questions
  const qContainer = document.getElementById('kijo-questions-container');
  qContainer.innerHTML = '';
  sc.questions.forEach((q, qIdx) => {
    const block = document.createElement('div');
    block.style.cssText = 'border:1px solid var(--border-color); border-radius:8px; padding:0.75rem; background:var(--bg-subtle);';
    let optsHtml = `<option value="">-- 解答を選択してください --</option>`;
    q.options.forEach((opt, oIdx) => {
      optsHtml += `<option value="${opt.correct ? 'correct' : 'wrong_' + oIdx}">${opt.text}</option>`;
    });
    block.innerHTML = `
      <div style="font-weight:700; font-size:0.82rem; margin-bottom:0.4rem;">${q.label}</div>
      <select id="kijo-ans-${qIdx}" class="form-control">
        ${optsHtml}
      </select>
    `;
    qContainer.appendChild(block);
  });
}

function showKijoHotspot(key) {
  const sc = kijoScenarios[currentKijoIdx];
  const box = document.getElementById('kijo-hotspot-alert');
  box.className = 'feedback-box warning';
  box.innerHTML = `<strong>🔍 マップ検証結果：</strong> ${sc.hotspots[key]}`;
}

function resetKijoTimer() {
  if (kijoTimerInterval) clearInterval(kijoTimerInterval);
  kijoRemainingSec = 240;
  const badge = document.getElementById('kijo-timer-badge');
  kijoTimerInterval = setInterval(() => {
    kijoRemainingSec--;
    if (kijoRemainingSec <= 0) {
      clearInterval(kijoTimerInterval);
      badge.textContent = '⏱️ 00:00 (終了)';
      return;
    }
    const m = String(Math.floor(kijoRemainingSec / 60)).padStart(2, '0');
    const s = String(kijoRemainingSec % 60).padStart(2, '0');
    badge.textContent = `⏱️ ${m}:${s}`;
  }, 1000);
}

function gradeKijoExam() {
  let score = 0;
  let unanswered = 0;
  for (let i = 0; i < 4; i++) {
    const val = document.getElementById('kijo-ans-' + i).value;
    if (!val) unanswered++;
    if (val === 'correct') score += 5;
  }

  const scoreEl = document.getElementById('kijo-total-score');
  const fb = document.getElementById('kijo-grade-feedback');
  fb.classList.remove('hidden');

  if (unanswered > 0) {
    fb.className = 'feedback-box warning';
    fb.innerHTML = `⚠️ 未回答の設問が ${unanswered} 問あります。すべて選択してから採点してください。`;
    return;
  }

  scoreEl.textContent = `${score} / 20点`;
  if (score === 20) {
    fb.className = 'feedback-box success';
    fb.innerHTML = `🎉 <strong>満点合格（20 / 20点）！</strong> 机上試験の4大観点（法令遵守・安全確保措置・機体限界・危機回避RTH設定）をすべて正確に判定できています。`;
  } else {
    fb.className = 'feedback-box error';
    fb.innerHTML = `
      <div>❌ <strong>得点：${score} / 20点（-${20 - score}点の減点）</strong></div>
      <div style="margin-top:0.35rem;">一発試験（実地）では机上試験の減点が実技の持ち点に直接響きます。実地試験免除の登録講習機関（スクール）との比較も「⑤ スクール送客」タブで確認できます。</div>
    `;
  }
}

// ============================================================================
// MODULE 2: 実地試験 — 口述試験AIロールプレイ ＆ 飛行日誌チェッカー
// ============================================================================
const oralStages = [
  {
    stage: '場面①：飛行前点検（口述試験1）',
    question: '試験官：「これから離陸します。機体の電源を入れる前、および電源を入れた後に確認すべき『飛行前点検項目』と『周囲の安全確認』を声に出して実施してください。」',
    choices: [
      {
        text: '「プロペラの損傷・緩みよし、機体フレーム・スキッド損傷よし、バッテリー膨張・残量よし、リモートID作動よし、GNSS捕捉数・コンパス異常なし、周囲の第三者・障害物・風速よし！」と指差呼称する',
        correct: true,
        feedback: '⭕ 満点回答（減点0）！機体外観（電源ON前）→システム・通信・バッテリー・リモートID（電源ON後）→周囲の気象・立入管理区画の順で指差呼称するのが合格の鉄則です。'
      },
      {
        text: '「バッテリー残量だけ確認しました。異常ないので離陸します」とだけ伝えてスロットルを上げる',
        correct: false,
        feedback: '❌ -15点減点！プロペラ取付状態・機体外観・リモートID・GNSS・周囲確認が抜けると大幅減点または試験中止となります。'
      },
      {
        text: '点検は黙って目視だけで行い、試験官には何も発声せずに離陸位置へ移動する',
        correct: false,
        feedback: '❌ -20点減点！口述試験では「確認していることを試験官に聞こえるように発声・報告する」ことが採点基準です。'
      }
    ]
  },
  {
    stage: '場面②：飛行中の異常事態への対応',
    question: '試験官：「飛行中、補助者から『立入管理区画内に第三者（歩行者）が侵入した』との報告がありました。操縦者として直ちにどう行動しますか？」',
    choices: [
      {
        text: '直ちに飛行を一時停止（ホバリング）または安全な場所へ退避・着陸させ、第三者が区画外へ退出して安全が再確認されるまで飛行を再開しない',
        correct: true,
        feedback: '⭕ 満点回答（減点0）！立入管理区画への第三者侵入時は「直ちにホバリング停止または安全に着陸・退避」が教則上の必須対応です。'
      },
      {
        text: '高度を5mだけ上げて、歩行者の頭上をそのまま通過してミッションを続行する',
        correct: false,
        feedback: '❌ 一発不合格（危険行為）！第三者の上空通過は重大な安全違反となり、実地試験では即座に不合格となります。'
      },
      {
        text: 'プロポから手を離して補助者に歩いて注意しに行く',
        correct: false,
        feedback: '❌ -20点減点！飛行中に操縦者が送信機から手を離したり機体から目を離すことは厳禁です。'
      }
    ]
  },
  {
    stage: '場面③：飛行後の口述試験（事故・重大インシデント報告）',
    question: '試験官：「飛行中、機体が制御不能となり第三者の店舗看板に衝突して破損させました（負傷者なし）。これは『事故』ですか、『重大インシデント』ですか？また、どのような対応が必要ですか？」',
    choices: [
      {
        text: '第三者の物件損壊があるため「事故」に該当する。直ちに飛行を中止し、危険防止措置を講じた上で、国土交通大臣へ事故報告（DIPS2.0等）を行う',
        correct: true,
        feedback: '⭕ 満点回答（減点0）！「人の死傷（重傷以上）」または「第三者物件の損壊」「航空機との衝突・接触」はすべて『事故』です。'
      },
      {
        text: '負傷者がいないため「重大インシデント」に該当し、1ヶ月以内に指定試験機関へメールする',
        correct: false,
        feedback: '❌ -20点減点！第三者所有物の損壊は負傷者がいなくても「事故」です（重大インシデントは『制御不能』『バッテリー発火』『航空機との異常接近』等で損壊に至らなかったケース）。'
      },
      {
        text: '看板の弁償さえすれば、航空法上の報告義務は発生しない',
        correct: false,
        feedback: '❌ -20点減点！民事上の賠償とは別に、航空法第132条の90に基づく国土交通大臣への事故報告義務（義務違反は罰則対象）があります。'
      }
    ]
  }
];

let oralRemainingPoints = 100;

function loadOralStage(idx) {
  const st = oralStages[idx];
  document.getElementById('oral-stage-label').textContent = st.stage;
  document.getElementById('oral-examiner-q').textContent = st.question;
  const box = document.getElementById('oral-choices-box');
  box.innerHTML = '';

  st.choices.forEach((c, cIdx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<strong>[${cIdx + 1}]</strong> <span>${c.text}</span>`;
    btn.onclick = () => {
      const res = document.getElementById('oral-result-box');
      if (c.correct) {
        btn.classList.add('correct');
        res.className = 'feedback-box success';
        res.textContent = c.feedback;
      } else {
        btn.classList.add('wrong');
        oralRemainingPoints = Math.max(0, oralRemainingPoints - 15);
        const badge = document.getElementById('oral-points-badge');
        badge.textContent = `残り持ち点: ${oralRemainingPoints} / 100点`;
        badge.style.background = 'var(--status-danger-bg)';
        badge.style.color = 'var(--status-danger)';
        res.className = 'feedback-box error';
        res.textContent = c.feedback;
      }
    };
    box.appendChild(btn);
  });
}

// Flight Log Defect Inspector Data
const flightLogRows = [
  {
    item: '無人航空機の登録記号',
    val: '未記入（機体シリアル番号のみ記載）',
    isDefect: true,
    fixedVal: 'JU1234567890（国交省登録記号を正確に記載）',
    reason: '⚠️ 減点対象！飛行記録には製造番号ではなく「無人航空機の登録記号（JU〜）」の記載が必須です。'
  },
  {
    item: '離陸・着陸時刻および飛行時間',
    val: '10:05 離陸 〜 10:12 着陸（飛行時間 7分）',
    isDefect: false,
    fixedVal: '10:05 離陸 〜 10:12 着陸（飛行時間 7分 / 総飛行時間も記載）',
    reason: '✅ 適切です。時刻は24時間表記で秒単位または分単位で試験官の指示通り正確に記入します。'
  },
  {
    item: '飛行の安全に影響のあった事項',
    val: '空欄（何も書かずに提出）',
    isDefect: true,
    fixedVal: '「特になし」（または突風・警告等の具体的事象を記入）',
    reason: '⚠️ 頻出減点ポイント！異常がなかった場合でも空欄のまま提出すると「記入漏れ」として減点されます。必ず『特になし』等と明記します。'
  },
  {
    item: '日常点検記録（飛行前・飛行後）',
    val: '飛行前点検のみ「異常なし」と記入（飛行後が未記入）',
    isDefect: true,
    fixedVal: '飛行前・飛行後の両方の日常点検結果（異常なし）および実施年月日・氏名を記入',
    reason: '⚠️ 減点対象！実技飛行が終わった後の「飛行後点検」の記録漏れが試験本番で非常に多く発生します。'
  }
];

function renderFlightLogTable() {
  const tbody = document.getElementById('flight-log-tbody');
  tbody.innerHTML = '';
  flightLogRows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.item}</strong></td>
      <td id="flog-val-${idx}">${r.val}</td>
      <td>
        <button class="btn" onclick="inspectFlightLogRow(${idx})">
          ${r.isDefect ? '⚠️ 検証・修正する' : '✅ 確認する'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function inspectFlightLogRow(idx) {
  const r = flightLogRows[idx];
  const valTd = document.getElementById('flog-val-' + idx);
  const fb = document.getElementById('flight-log-feedback');
  valTd.innerHTML = `<strong style="color:var(--status-success);">${r.fixedVal}</strong>`;
  fb.className = r.isDefect ? 'feedback-box warning' : 'feedback-box success';
  fb.textContent = r.reason;
}

// ============================================================================
// MODULE 3: 一等学科 — 計算ビジュアライザー ＆ 無限ランダム生成ドリル
// ============================================================================
let currentCalcViz = 'turn'; // 'turn' | 'fresnel' | 'glide'

function setCalcVisualizer(mode) {
  currentCalcViz = mode;
  ['turn', 'fresnel', 'glide'].forEach(m => {
    const btn = document.getElementById('viz-btn-' + m);
    if (m === mode) btn.className = 'btn btn-primary';
    else btn.className = 'btn';
  });

  const s1 = document.getElementById('calc-s1');
  const s2 = document.getElementById('calc-s2');
  const l1 = document.getElementById('calc-s1-label');
  const l2 = document.getElementById('calc-s2-label');

  if (mode === 'turn') {
    l1.textContent = '飛行速度 v (m/s)';
    s1.min = 5; s1.max = 25; s1.step = 1; s1.value = 10;
    l2.textContent = 'バンク角 θ (度)';
    s2.min = 15; s2.max = 60; s2.step = 15; s2.value = 45;
  } else if (mode === 'fresnel') {
    l1.textContent = '送受信間距離 d (m)';
    s1.min = 100; s1.max = 1200; s1.step = 100; s1.value = 400;
    l2.textContent = '周波数帯 (1=2.4GHz, 2=5.7GHz)';
    s2.min = 1; s2.max = 2; s2.step = 1; s2.value = 1;
  } else {
    l1.textContent = '飛行高度 H (m)';
    s1.min = 20; s1.max = 150; s1.step = 10; s1.value = 60;
    l2.textContent = '揚抗比 L/D';
    s2.min = 3; s2.max = 12; s2.step = 1; s2.value = 5;
  }
  renderCalcVisualizer();
}

function renderCalcVisualizer() {
  const v1 = parseFloat(document.getElementById('calc-s1').value);
  const v2 = parseFloat(document.getElementById('calc-s2').value);
  const svg = document.getElementById('calc-viz-svg');

  if (currentCalcViz === 'turn') {
    const v = v1;
    const deg = v2;
    const rad = (deg * Math.PI) / 180;
    const g = 9.8;
    const r = (v * v) / (g * Math.tan(rad));
    const loadFactor = 1 / Math.cos(rad);

    document.getElementById('calc-s1-val').textContent = `${v} m/s`;
    document.getElementById('calc-s2-val').textContent = `${deg}°`;
    document.getElementById('calc-m1-label').textContent = '旋回半径 r = v²/(g·tanθ)';
    document.getElementById('calc-m1-val').textContent = `${r.toFixed(1)} m`;
    document.getElementById('calc-m2-label').textContent = '荷重倍数 n = 1/cosθ';
    document.getElementById('calc-m2-val').textContent = `${loadFactor.toFixed(2)} G`;
    document.getElementById('calc-m3-label').textContent = '失速速度の変化 (√n 倍)';
    document.getElementById('calc-m3-val').textContent = `${Math.sqrt(loadFactor).toFixed(2)} 倍に上昇`;

    const circleR = Math.min(68, Math.max(16, r * 1.25));
    svg.innerHTML = `
      <!-- Left: Force Vector Diagram -->
      <g transform="translate(135, 102)">
        <line x1="-95" y1="0" x2="95" y2="0" stroke="#94a3b8" stroke-dasharray="4 3" />
        <line x1="0" y1="-80" x2="0" y2="65" stroke="#94a3b8" stroke-dasharray="4 3" />
        <!-- Gravity -->
        <line x1="0" y1="0" x2="0" y2="52" stroke="#dc2626" stroke-width="3" />
        <text x="8" y="50" font-size="11" font-weight="700" fill="#991b1b">重力 mg</text>
        <!-- Centripetal force -->
        <line x1="0" y1="0" x2="${Math.min(85, 52 * Math.tan(rad))}" y2="0" stroke="#d97706" stroke-width="3" />
        <text x="16" y="-8" font-size="11" font-weight="700" fill="#92400e">向心力 L·sinθ</text>
        <!-- Banked Drone -->
        <g transform="rotate(${deg})">
          <line x1="-45" y1="0" x2="45" y2="0" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
          <circle cx="-45" cy="-5" r="6" fill="#0284c7" />
          <circle cx="45" cy="-5" r="6" fill="#0284c7" />
          <line x1="0" y1="0" x2="0" y2="-64" stroke="#059669" stroke-width="3" />
          <text x="-22" y="-68" font-size="11" font-weight="700" fill="#065f46">揚力 L</text>
        </g>
      </g>
      <!-- Right: Top-down Turning Circle -->
      <g transform="translate(405, 92)">
        <circle cx="0" cy="0" r="${circleR}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="5 3" />
        <line x1="0" y1="0" x2="${circleR}" y2="0" stroke="#0284c7" stroke-width="2" />
        <circle cx="${circleR}" cy="0" r="6" fill="#059669" />
        <text x="-48" y="${circleR + 18}" font-size="12" font-weight="700" fill="#0369a1">旋回半径 r = ${r.toFixed(1)} m</text>
      </g>
    `;
  } else if (currentCalcViz === 'fresnel') {
    const d = v1;
    const freqGHz = v2 === 1 ? 2.4 : 5.7;
    const c = 3e8;
    const f = freqGHz * 1e9;
    const r1 = 0.5 * Math.sqrt((c * d) / f);
    const r60 = r1 * 0.6;

    document.getElementById('calc-s1-val').textContent = `${d} m`;
    document.getElementById('calc-s2-val').textContent = `${freqGHz} GHz`;
    document.getElementById('calc-m1-label').textContent = '第1フレネル半径 r₁';
    document.getElementById('calc-m1-val').textContent = `${r1.toFixed(2)} m`;
    document.getElementById('calc-m2-label').textContent = '確保すべき60%クリアランス';
    document.getElementById('calc-m2-val').textContent = `${r60.toFixed(2)} m`;
    document.getElementById('calc-m3-label').textContent = '波長 λ (= c/f)';
    document.getElementById('calc-m3-val').textContent = `${((c / f) * 100).toFixed(1)} cm`;

    const ry = Math.min(62, Math.max(16, r1 * 8));
    svg.innerHTML = `
      <g transform="translate(270, 92)">
        <ellipse cx="0" cy="0" rx="205" ry="${ry}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
        <ellipse cx="0" cy="0" rx="205" ry="${ry * 0.6}" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="5 3" />
        <line x1="-205" y1="0" x2="205" y2="0" stroke="#475569" stroke-width="1.5" />
        <circle cx="-205" cy="0" r="8" fill="#d97706" />
        <text x="-235" y="26" font-size="12" font-weight="700" fill="#92400e">送信機 (プロポ)</text>
        <circle cx="205" cy="0" r="8" fill="#059669" />
        <text x="175" y="26" font-size="12" font-weight="700" fill="#065f46">無人航空機</text>
        <line x1="0" y1="0" x2="0" y2="${-ry}" stroke="#0284c7" stroke-width="2.5" />
        <text x="8" y="${-ry / 2}" font-size="12" font-weight="700" fill="#0369a1">最大半径 r₁ = ${r1.toFixed(2)} m</text>
      </g>
    `;
  } else {
    const H = v1;
    const ld = v2;
    const dist = H * ld;

    document.getElementById('calc-s1-val').textContent = `高度 ${H} m`;
    document.getElementById('calc-s2-val').textContent = `揚抗比 ${ld}`;
    document.getElementById('calc-m1-label').textContent = '無風時の水平到達距離 D';
    document.getElementById('calc-m1-val').textContent = `${dist} m`;
    document.getElementById('calc-m2-label').textContent = '公式 D = H × (L/D)';
    document.getElementById('calc-m2-val').textContent = `${H} × ${ld}`;
    document.getElementById('calc-m3-label').textContent = '滑空角 tanγ (= D/L)';
    document.getElementById('calc-m3-val').textContent = `${(1 / ld).toFixed(2)}`;

    svg.innerHTML = `
      <g transform="translate(65, 30)">
        <!-- Ground & Height -->
        <line x1="0" y1="125" x2="420" y2="125" stroke="#475569" stroke-width="2" />
        <line x1="20" y1="15" x2="20" y2="125" stroke="#0284c7" stroke-width="2.5" />
        <text x="28" y="70" font-size="12" font-weight="700" fill="#0369a1">高度 H = ${H}m</text>
        <!-- Glide Path -->
        <line x1="20" y1="15" x2="375" y2="125" stroke="#059669" stroke-width="3" stroke-dasharray="6 3" />
        <circle cx="20" cy="15" r="7" fill="#0284c7" />
        <circle cx="375" cy="125" r="7" fill="#059669" />
        <text x="155" y="145" font-size="12" font-weight="700" fill="#065f46">水平到達距離 D = ${dist} m (揚抗比 ${ld})</text>
      </g>
    `;
  }
}

// Random Calculation Drill Generator
function generateNewDrill() {
  const types = ['turn', 'fresnel', 'glide'];
  const pick = types[Math.floor(Math.random() * types.length)];
  const stemEl = document.getElementById('drill-stem');
  const choicesEl = document.getElementById('drill-choices');
  const fbEl = document.getElementById('drill-feedback');
  choicesEl.innerHTML = '';

  let options = [];

  if (pick === 'turn') {
    const vList = [7, 10, 14, 20];
    const bList = [
      { deg: 30, tan: 0.58 },
      { deg: 45, tan: 1.0 },
      { deg: 60, tan: 1.73 }
    ];
    const v = vList[Math.floor(Math.random() * vList.length)];
    const b = bList[Math.floor(Math.random() * bList.length)];
    const r = (v * v) / (9.8 * b.tan);
    const ans = r.toFixed(1);

    stemEl.textContent = `【一等・定常旋回の計算】飛行速度 ${v} m/s、バンク角 ${b.deg}° で定常水平旋回を行う場合の旋回半径 r として最も近いものはどれか。（重力加速度 g = 9.8 m/s²、tan${b.deg}° = ${b.tan} とする）`;
    options = [
      { text: `約 ${ans} m`, correct: true, exp: `⭕ 正解！ r = v² / (g·tanθ) = ${v}² / (9.8 × ${b.tan}) = ${v * v} / ${(9.8 * b.tan).toFixed(2)} ≈ ${ans} m です。`, sync: () => { setCalcVisualizer('turn'); document.getElementById('calc-s1').value = v; document.getElementById('calc-s2').value = b.deg; renderCalcVisualizer(); } },
      { text: `約 ${(r * 2).toFixed(1)} m`, correct: false, exp: `❌ 不正解。正しくは r = ${v}² / (9.8 × ${b.tan}) ≈ ${ans} m です。`, sync: () => {} },
      { text: `約 ${(v / (9.8 * b.tan)).toFixed(1)} m`, correct: false, exp: `❌ 不正解。速度 v を2乗(v²)する必要があります。正しくは約 ${ans} m です。`, sync: () => {} }
    ];
  } else if (pick === 'fresnel') {
    const dList = [200, 400, 600, 800];
    const d = dList[Math.floor(Math.random() * dList.length)];
    const r1 = 0.5 * Math.sqrt((3e8 * d) / 2.4e9);
    const ans = r1.toFixed(2);

    stemEl.textContent = `【一等・電波とフレネルゾーン】周波数 2.4 GHz（波長 λ = 0.125 m）、送信機と無人航空機の距離 d = ${d} m のとき、第1フレネルゾーンの最大半径 r₁ として最も近いものはどれか。（r₁ = 1/2 √(λ·d) とする）`;
    options = [
      { text: `約 ${ans} m`, correct: true, exp: `⭕ 正解！ r₁ = 0.5 × √(0.125 × ${d}) = 0.5 × √${(0.125 * d).toFixed(1)} ≈ ${ans} m です。`, sync: () => { setCalcVisualizer('fresnel'); document.getElementById('calc-s1').value = d; document.getElementById('calc-s2').value = 1; renderCalcVisualizer(); } },
      { text: `約 ${(r1 * 2).toFixed(2)} m`, correct: false, exp: `❌ 不正解。1/2 を掛け忘れています。正しくは約 ${ans} m です。`, sync: () => {} },
      { text: `約 ${(0.125 * d * 0.5).toFixed(2)} m`, correct: false, exp: `❌ 不正解。平方根（ルート）を取る必要があります。正しくは約 ${ans} m です。`, sync: () => {} }
    ];
  } else {
    const hList = [40, 60, 80, 100];
    const ldList = [4, 5, 6, 8];
    const h = hList[Math.floor(Math.random() * hList.length)];
    const ld = ldList[Math.floor(Math.random() * ldList.length)];
    const ans = h * ld;

    stemEl.textContent = `【一等・揚抗比と水平到達距離】無風状態において、高度 ${h} m から揚抗比（L/D）が ${ld} の固定翼無人航空機が推力なしで滑空した場合、地上に到達するまでの水平距離として正しいものはどれか。`;
    options = [
      { text: `${ans} m`, correct: true, exp: `⭕ 正解！ 水平到達距離 D = 高度 H × 揚抗比(L/D) = ${h} × ${ld} = ${ans} m です。`, sync: () => { setCalcVisualizer('glide'); document.getElementById('calc-s1').value = h; document.getElementById('calc-s2').value = ld; renderCalcVisualizer(); } },
      { text: `${(h / ld).toFixed(1)} m`, correct: false, exp: `❌ 不正解。高度に揚抗比を掛けます（${h} × ${ld} = ${ans} m）。`, sync: () => {} },
      { text: `${ans * 2} m`, correct: false, exp: `❌ 不正解。正しくは ${h} × ${ld} = ${ans} m です。`, sync: () => {} }
    ];
  }

  options.sort(() => Math.random() - 0.5);
  options.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn mono';
    btn.innerHTML = `<strong>(${i + 1})</strong> <span>${o.text}</span>`;
    btn.onclick = () => {
      fbEl.className = o.correct ? 'feedback-box success' : 'feedback-box error';
      fbEl.textContent = o.exp;
      o.sync();
    };
    choicesEl.appendChild(btn);
  });
}

function clearMiniCalc() {
  document.getElementById('mini-calc-input').value = '';
}

function evalMiniCalc() {
  const inp = document.getElementById('mini-calc-input');
  try {
    const sanitized = inp.value.replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) return;
    const val = Function('"use strict"; return (' + sanitized + ')')();
    inp.value = Number(val).toFixed(2);
  } catch (e) {
    inp.value = 'Error';
  }
}

function sqrtMiniCalc() {
  const inp = document.getElementById('mini-calc-input');
  const v = parseFloat(inp.value);
  if (!isNaN(v) && v >= 0) {
    inp.value = Math.sqrt(v).toFixed(3);
  }
}

// ============================================================================
// MODULE 4: 学科CBT完全再現モック × 教則第5版スマート差分ビューア
// ============================================================================
const cbtBank = [
  {
    cat: '教則第5版 改訂箇所（都市計画法・工業専用地域）',
    ref: '教則第5版 第3章 3.1.2(2)1)',
    q: '人口集中地区（DID）における無人航空機の飛行許可に関する記述として、教則（第5版）に照らし最も適切なものはどれか。',
    choices: [
      '都市計画法に規定する工業地域および準工業地域内の区域で飛行させる場合は、DIDに係る許可手続きが不要となる。',
      '都市計画法第8条第1項第1号に規定する「工業専用地域」内の区域で飛行させる場合は、DIDに係る許可手続き等が不要となる。',
      '人口集中地区（DID）は10年ごとの国勢調査の結果から設定されるため、工場地帯でもすべて許可が必要である。'
    ],
    ans: 1,
    oldRule: '第4版まで：人口集中地区（DID）上空での飛行は、都市計画法の用途地域にかかわらず原則として国土交通大臣の許可が必要。',
    newRule: '第5版（現行）：都市計画法の<span class="marker-yellow">「工業専用地域」内の区域で飛行させる場合は、DIDに係る飛行許可手続きが不要</span>となった。',
    tip: '「工業地域」「準工業地域」は除外されません。「工業専用地域」のみがDID許可不要となる点、および国勢調査は「5年ごと」である点が頻出ポイントです。'
  },
  {
    cat: '教則第5版 改訂箇所（農薬等の空中散布の特例）',
    ref: '教則第5版 第3章 3.1.2(2)3)',
    q: '航空法施行規則第236条の82第1項第2号の要件を満たして農薬等の空中散布を行う場合の手続きについて、教則（第5版）の内容として正しいものはどれか。',
    choices: [
      '夜間飛行・目視外飛行・第三者から30m以内の飛行・危険物輸送・物件投下に係る承認手続きが不要となる。',
      '危険物輸送と物件投下の承認のみ不要となり、夜間飛行や目視外飛行の承認手続きは引き続き必要である。',
      '空港周辺の空域や地表から150m以上の空域における飛行許可手続きも含めてすべて不要となる。'
    ],
    ans: 0,
    oldRule: '第4版まで：農薬散布は「危険物輸送」「物件投下」等に該当し、飛行方法ごとに個別の承認申請が必要。',
    newRule: '第5版（現行）：一定の要件を満たす農薬等の空中散布では、<span class="marker-yellow">夜間・目視外・第三者30m未満・危険物輸送・物件投下の5つの「承認」手続きが不要</span>。',
    tip: '不要になるのは飛行方法の「承認」です。空域の「許可」（空港周辺・150m以上・催し場所上空など）まで不要になるわけではありません。'
  },
  {
    cat: '教則第5版 改訂箇所（技能証明の更新申請期間）',
    ref: '教則第5版 第3章 3.1.2(5)3)',
    q: '無人航空機操縦者技能証明の有効期間および更新申請の期間について、教則（第5版）の内容として正しいものはどれか。',
    choices: [
      '有効期間は3年であり、更新は有効期間が満了する日の6月前から満了日当日までの間に申請する。',
      '有効期間は3年であり、更新は有効期間が満了する日の6月前から1月前までの間に申請する。',
      '有効期間は5年であり、更新は有効期間が満了する日の6月前から1月前までの間に申請する。'
    ],
    ans: 1,
    oldRule: '第4版まで：技能証明の更新は、有効期間が満了する日以前「6月以内」に申請する。',
    newRule: '第5版（現行）：技能証明の有効期間（3年）が満了する日の<span class="marker-yellow">「6月前から1月前までの間」に更新を申請</span>する。',
    tip: '第4版対応の古い問題集やアプリでは「満了日以前6月以内」が正解になっているため、独学受験者が最も引っかかりやすい改訂項目です。'
  },
  {
    cat: '教則第5版 改訂箇所（小型無人機等飛行禁止法）',
    ref: '教則第5版 第3章 3.2.1',
    q: '小型無人機等飛行禁止法における対象施設周辺地域の範囲について、教則（第5版）の記述として正しいものはどれか。',
    choices: [
      '対象施設の敷地・区域の上空および周囲おおむね100mの地域',
      '対象施設の敷地・区域の上空および周囲おおむね300m（一部対象施設ではおおむね1,000m）の地域',
      'すべての対象施設において一律に周囲5,000mの地域'
    ],
    ans: 1,
    oldRule: '第4版まで：対象施設の敷地または区域およびその周囲おおむね300mの地域のみを記載。',
    newRule: '第5版（現行）：法改正を反映し、<span class="marker-yellow">周囲おおむね300m（防衛関係施設等の一部対象施設では周囲おおむね1,000m）</span>の地域へと記載が更新された。',
    tip: '教則第5版（第3章 3.2.1）で「おおむね1,000m」の対象拡大が明記されました。数字のひっかけに注意しましょう。'
  },
  {
    cat: '教則第5版 重要頻出（補助者なし物件投下の高度）',
    ref: '教則第5版 第3章・第4章',
    q: '投下場所に補助者を配置しないで無人航空機から物件投下を行う場合の高度について、教則（第5版）に示されているものはどれか。',
    choices: [
      '原則として高度 10m 以内',
      '原則として高度 5m 以内',
      '原則として高度 1m 以内'
    ],
    ans: 2,
    oldRule: '旧基準との混同注意：立入管理や農薬散布の高度目安と混同して「5m」や「10m」を選びやすい。',
    newRule: '第5版（現行）：補助者を配置しないで物件投下を行うときの高度は<span class="marker-yellow">「原則 1m 以内」</span>と明記されている。',
    tip: '「補助者なし物件投下＝原則1m以内」は二等・一等ともに超頻出の数値問題です。'
  }
];

let cbtIndex = 0;
const cbtFlags = [false, false, false, false, false];

function renderCbtQuestion(idx) {
  cbtIndex = idx;
  const item = cbtBank[idx];
  document.getElementById('cbt-q-title').textContent = `問 ${idx + 1} / ${cbtBank.length}`;
  document.getElementById('cbt-flag-chk').checked = cbtFlags[idx];
  document.getElementById('cbt-badge-cat').textContent = item.cat;
  document.getElementById('cbt-question-text').textContent = item.q;
  document.getElementById('cbt-ref-badge').textContent = item.ref;
  document.getElementById('cbt-diff-old').innerHTML = item.oldRule;
  document.getElementById('cbt-diff-new').innerHTML = item.newRule;
  document.getElementById('cbt-diff-tip').textContent = item.tip;

  // Render Palette
  const pal = document.getElementById('cbt-palette');
  pal.innerHTML = '';
  cbtBank.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = i === idx ? 'btn btn-primary mono' : 'btn mono';
    b.style.padding = '0.25rem 0.55rem';
    b.textContent = `${i + 1}${cbtFlags[i] ? '🚩' : ''}`;
    b.onclick = () => renderCbtQuestion(i);
    pal.appendChild(b);
  });

  // Render Choices
  const cBox = document.getElementById('cbt-choice-container');
  cBox.innerHTML = '';
  item.choices.forEach((cText, cIdx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<strong>(${cIdx + 1})</strong> <span>${cText}</span>`;
    btn.onclick = () => {
      const fb = document.getElementById('cbt-answer-feedback');
      if (cIdx === item.ans) {
        btn.classList.add('correct');
        fb.className = 'feedback-box success';
        fb.innerHTML = `⭕ <strong>正解（選択肢 ${cIdx + 1}）！</strong> 右側の「教則第5版スマート差分ビューア」で旧第4版との違いを確認してください。`;
      } else {
        btn.classList.add('wrong');
        fb.className = 'feedback-box error';
        fb.innerHTML = `❌ <strong>不正解。正解は (${item.ans + 1}) です。</strong> 旧第4版の規定と混同していないか右パネルを確認しましょう。`;
      }
    };
    cBox.appendChild(btn);
  });
}

function toggleFlagCurrent() {
  cbtFlags[cbtIndex] = document.getElementById('cbt-flag-chk').checked;
  renderCbtQuestion(cbtIndex);
}

// ============================================================================
// MODULE 5: スクール送客シミュレーター ＆ リード獲得
// ============================================================================
function updateSchoolComparison() {
  const lic = document.getElementById('lead-license-type').value;
  const exp = document.getElementById('lead-exp-level').value;
  const box = document.getElementById('school-comparison-box');

  let oneShotPassRate = '約 15〜25%';
  let expectedRetakes = '平均 2〜3回（再受験料＋会場交通費がかさむ）';
  let recText = 'ATTIモード（GNSSオフ）での8の字飛行やスクエア飛行は独学での合格率が極めて低く、実地試験免除の「登録講習機関」の受講が圧倒的に安全です。';

  if (lic === 'ittou_basic') {
    oneShotPassRate = '約 5〜10% 未満';
    expectedRetakes = '一等実地の一発試験は極めて高難度（機体持込・補助者手配も必要）';
    recText = '一等の実地試験は指定試験機関での一発合格が極めて困難なため、95%以上の合格者が登録講習機関（教育訓練給付金・助成金対象校あり）を利用しています。';
  } else if (exp === 'pro') {
    oneShotPassRate = '約 45〜55%';
    expectedRetakes = '机上・口述・日誌の減点対策を徹底すれば一発合格圏内';
    recText = '操縦技術がある方でも「机上試験・口述試験・飛行日誌」の減点で落ちるケースが多発しています。AERO-PASSの合格パスで減点対策を固めましょう。';
  }

  box.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.83rem;">
      <div style="background:#fef2f2; border:1px solid #fca5a5; padding:0.7rem; border-radius:6px;">
        <div style="font-weight:700; color:#991b1b;">⚠️ 指定試験機関での「一発試験」</div>
        <div style="margin-top:0.25rem;">推定一発合格率：<strong>${oneShotPassRate}</strong></div>
        <div style="color:#7f1d1d; font-size:0.78rem; margin-top:0.2rem;">${expectedRetakes}</div>
      </div>
      <div style="background:#ecfdf5; border:1px solid #6ee7b7; padding:0.7rem; border-radius:6px;">
        <div style="font-weight:700; color:#065f46;">✅ 登録講習機関（実地試験免除）</div>
        <div style="margin-top:0.25rem;">修了審査合格率：<strong>約 95% 以上</strong></div>
        <div style="color:#065f46; font-size:0.78rem; font-top:0.2rem;">国家試験の実地試験が100%免除！</div>
      </div>
    </div>
    <p style="margin-top:0.65rem; font-size:0.82rem; color:var(--text-main); font-weight:600;">💡 診断アドバイス：${recText}</p>
  `;
}

function submitSchoolLead() {
  const pref = document.getElementById('lead-pref').value;
  const msg = document.getElementById('lead-submit-msg');
  msg.classList.remove('hidden');
  msg.className = 'feedback-box success';
  msg.innerHTML = `🎉 <strong>【送客リード記録完了（${pref}）】</strong> 提携ドローンスクール3校の資料＆無料体験案内を送信し、特典として「AERO-PASS 一等・二等合格パス」を無料アンロックしました！（運営側に成果報酬 ¥10,000 が計上されます）`;
}

// Initialize all modules on page load
window.addEventListener('DOMContentLoaded', () => {
  loadKijoScenario(0);
  loadOralStage(0);
  renderFlightLogTable();
  renderCalcVisualizer();
  generateNewDrill();
  renderCbtQuestion(0);
  updateSchoolComparison();
});
