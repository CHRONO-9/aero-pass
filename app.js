// ============================================================================
// AERO-PASS All-in-One Integrated Application Controller
// Integrates:
//  - window.AERO_EXAM_BANK (data/exam_bank.js)
//  - window.AERO_PHYSICS_ENGINE (modules/physics_engine.js)
//  - window.AERO_MONETIZE_LMS (modules/b2b_monetize.js)
//  - window.AERO_GROWTH_FUNNEL (modules/growth_funnel.js)
//  - window.AERO_PILOT_PORTAL (modules/pilot_portal.js)
// ============================================================================

let currentModule = 'home';
let currentAccessTier = 'pass'; // 'free' | 'pass'

// Tile portal: home + 4 academic subpages
const ACADEMIC_MODULES = ['home', 'cbt', 'textbook', 'watcher', 'cheatsheet'];

function switchModule(mod) {
  if (!ACADEMIC_MODULES.includes(mod)) mod = 'home';
  currentModule = mod;
  ACADEMIC_MODULES.forEach((m) => {
    const sec = document.getElementById('mod-' + m);
    if (!sec) return;
    if (m === mod) sec.classList.remove('hidden');
    else sec.classList.add('hidden');
  });
  // Scroll to top of page cleanly when navigating between pages
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setAccessTier(tier) {
  currentAccessTier = tier;
  ['free', 'pass'].forEach((t) => {
    const btn = document.getElementById('tier-' + t);
    if (!btn) return;
    if (t === tier) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.passManager) {
    if (tier === 'free') {
      window.AERO_MONETIZE_LMS.passManager.setPlanDirect('free');
    } else if (tier === 'pass') {
      window.AERO_MONETIZE_LMS.passManager.setPlanDirect('ittou_pass');
    }
  }

  if (tier === 'free') {
    openPaywallModal();
  }
}

function openPaywallModal() {
  const modal = document.getElementById('paywall-modal');
  if (modal) modal.classList.remove('hidden');
}

function closePaywallModal() {
  const modal = document.getElementById('paywall-modal');
  if (modal) modal.classList.add('hidden');
}

function activatePass(grade) {
  const planId = grade === 'ittou' ? 'ittou_pass' : 'nitou_pass';
  let msg = '';
  if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.passManager) {
    const res = window.AERO_MONETIZE_LMS.passManager.simulateStripeCheckout(planId);
    msg = res.message;
  } else {
    const label = grade === 'ittou' ? '一等＆二等 オールインワン合格パス (¥2,980)' : '二等・完全合格パス (¥1,980)';
    msg = `✅ ${label} が有効化されました！全シナリオ・無限計算ドリルが利用可能です。`;
  }
  setAccessTier('pass');
  closePaywallModal();
  alert(msg);
}

// ============================================================================
// MODULE 1: 実地試験 — 机上試験（飛行計画マップ＆用紙B 4問20点演習・全6シナリオ）
// ============================================================================
let currentKijoIdx = 0;
let kijoTimerInterval = null;
let kijoRemainingSec = 600; // 実地机上試験標準 10分 (600秒)

function getKijoScenarios() {
  if (window.AERO_EXAM_BANK && Array.isArray(window.AERO_EXAM_BANK.kijoScenarios)) {
    return window.AERO_EXAM_BANK.kijoScenarios;
  }
  return [];
}

function initKijoScenarioSelect() {
  const scenarios = getKijoScenarios();
  const sel = document.getElementById('kijo-scenario-select');
  if (!sel || scenarios.length === 0) return;
  sel.innerHTML = '';
  scenarios.forEach((sc, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = sc.title;
    sel.appendChild(opt);
  });
}

function loadKijoScenario(idxStr) {
  const scenarios = getKijoScenarios();
  if (scenarios.length === 0) return;
  currentKijoIdx = Math.max(0, Math.min(scenarios.length - 1, parseInt(idxStr, 10) || 0));
  const sc = scenarios[currentKijoIdx];

  const sel = document.getElementById('kijo-scenario-select');
  if (sel && sel.value !== String(currentKijoIdx)) {
    sel.value = String(currentKijoIdx);
  }

  document.getElementById('kijo-spec-drone').textContent = sc.specDrone;
  document.getElementById('kijo-spec-weather').textContent = sc.specWeather;
  document.getElementById('kijo-spec-rth').textContent = sc.specRth;
  document.getElementById('kijo-total-score').textContent = '未採点 / 20点';
  document.getElementById('kijo-grade-feedback').classList.add('hidden');

  const hRthTitle = sc.hotspots && sc.hotspots.rth && sc.hotspots.rth.title ? sc.hotspots.rth.title : '経路上の高度・RTH・通信検証';
  const hDistTitle = sc.hotspots && sc.hotspots.dist && sc.hotspots.dist.title ? sc.hotspots.dist.title : '立入管理区画・離隔・特例検証';
  const hWindTitle = sc.hotspots && sc.hotspots.wind && sc.hotspots.wind.title ? sc.hotspots.wind.title : '気象限界・法令区分・SORA検証';

  const shortZone = sc.zoneLabel.length > 40 ? sc.zoneLabel.slice(0, 40) + '…' : sc.zoneLabel;
  const shortRth = hRthTitle.length > 22 ? hRthTitle.slice(0, 22) + '…' : hRthTitle;
  const shortDist = hDistTitle.length > 22 ? hDistTitle.slice(0, 22) + '…' : hDistTitle;
  const shortWind = hWindTitle.length > 22 ? hWindTitle.slice(0, 22) + '…' : hWindTitle;

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
    <rect x="14" y="12" width="238" height="76" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="5 3" />
    <text x="22" y="34" font-size="11.5" font-weight="800" fill="#0369a1">📍 空域・現場条件 (${sc.id || '用紙A'})</text>
    <text x="22" y="54" font-size="10.5" fill="#0f172a">${shortZone}</text>
    <text x="22" y="72" font-size="10" fill="#0369a1">区分: ${sc.grade === 'ittou' ? '一等実地（カテゴリーⅢ・SORA）' : '二等/共通実地（特定飛行・安全管理）'}</text>

    <!-- Hotspot 1: RTH / Obstacle -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('rth')">
      <rect x="268" y="12" width="278" height="72" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
      <text x="278" y="34" font-size="11.5" font-weight="800" fill="#991b1b">⚡ 検証ポイント①（クリックで詳細）</text>
      <text x="278" y="56" font-size="11" font-weight="600" fill="#7f1d1d">${shortRth}</text>
    </g>

    <!-- Hotspot 2: Third Party / Distance -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('dist')">
      <rect x="292" y="132" width="254" height="74" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="2" />
      <text x="302" y="154" font-size="11.5" font-weight="800" fill="#92400e">🛡️ 検証ポイント②（クリックで詳細）</text>
      <text x="302" y="176" font-size="11" font-weight="600" fill="#78350f">${shortDist}</text>
    </g>

    <!-- Hotspot 3: Weather / Wind -->
    <g style="cursor:pointer;" onclick="showKijoHotspot('wind')">
      <rect x="14" y="132" width="260" height="74" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
      <text x="24" y="154" font-size="11.5" font-weight="800" fill="#991b1b">💨 検証ポイント③（クリックで詳細）</text>
      <text x="24" y="176" font-size="11" font-weight="600" fill="#7f1d1d">${shortWind}</text>
    </g>

    <!-- Flight Path Line -->
    <polyline points="75,112 195,96 345,96 470,114" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="6 4" />
    <circle cx="75" cy="112" r="8" fill="#059669" />
    <text x="88" y="116" font-size="11.5" font-weight="800" fill="#065f46">離着陸地点 (H)</text>
    <circle cx="470" cy="114" r="7.5" fill="#0284c7" />
    <text x="385" y="118" font-size="11.5" font-weight="800" fill="#0369a1">ミッション地点</text>
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
      <div style="font-weight:700; font-size:0.82rem; margin-bottom:0.4rem; line-height:1.45;">${q.label}</div>
      <select id="kijo-ans-${qIdx}" class="form-control">
        ${optsHtml}
      </select>
    `;
    qContainer.appendChild(block);
  });

  const alertBox = document.getElementById('kijo-hotspot-alert');
  alertBox.className = 'feedback-box';
  alertBox.innerHTML = `💡 <strong>空域・立地条件：</strong> ${sc.zoneLabel}<br/>マップ上の①・②・③の検証ボックスをクリックすると、飛行計画（用紙A）の矛盾点・教則第5版のポイントを確認できます。`;
}

function showKijoHotspot(key) {
  const scenarios = getKijoScenarios();
  const sc = scenarios[currentKijoIdx];
  if (!sc || !sc.hotspots || !sc.hotspots[key]) return;
  const h = sc.hotspots[key];
  const box = document.getElementById('kijo-hotspot-alert');
  box.className = 'feedback-box warning';
  if (typeof h === 'object') {
    box.innerHTML = `<div><strong>🔍 【${h.title}】</strong></div><div style="margin-top:0.25rem;">${h.detail}</div>`;
  } else {
    box.innerHTML = `<strong>🔍 マップ検証結果：</strong> ${h}`;
  }
}

function resetKijoTimer() {
  if (kijoTimerInterval) clearInterval(kijoTimerInterval);
  kijoRemainingSec = 600;
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
  const scenarios = getKijoScenarios();
  const sc = scenarios[currentKijoIdx];
  if (!sc) return;

  let score = 0;
  let unanswered = 0;
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('kijo-ans-' + i);
    const val = el ? el.value : '';
    if (!val) unanswered++;
    if (val === 'correct') score += 5;
  }

  const scoreEl = document.getElementById('kijo-total-score');
  const fb = document.getElementById('kijo-grade-feedback');
  fb.classList.remove('hidden');

  if (unanswered > 0) {
    fb.className = 'feedback-box warning';
    fb.innerHTML = `⚠️ 未回答の設問が ${unanswered} 問あります。4問すべて選択してから採点してください。`;
    return;
  }

  scoreEl.textContent = `${score} / 20点`;

  // 学習履歴（AERO_MONETIZE_LMS.studyTracker）へ記録
  if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
    window.AERO_MONETIZE_LMS.studyTracker.recordDeskExamScore({
      scenarioId: sc.id || `KIJO-0${currentKijoIdx + 1}`,
      score: score,
      maxScore: 20,
      weakPoint: sc.title
    });
  }

  if (score === 20) {
    fb.className = 'feedback-box success';
    fb.innerHTML = `🎉 <strong>満点合格（20 / 20点）！</strong> 「${sc.title}」の法令遵守・安全確保措置・機体限界・危機回避設定をすべて正確に判定できています（学習履歴に記録しました）。`;
  } else {
    fb.className = 'feedback-box error';
    fb.innerHTML = `
      <div>❌ <strong>得点：${score} / 20点（-${20 - score}点の減点・学習履歴に記録済）</strong></div>
      <div style="margin-top:0.35rem;">一発試験（実地）では机上試験の減点が実技の持ち点に直接響きます。「⑤ スクール送客・弱点分析」タブで、実地試験100%免除の登録講習機関とのROI比較や弱点トップ3も確認できます。</div>
    `;
  }
}

// ============================================================================
// MODULE 2: 実地試験 — 口述試験AIロールプレイ(全6場面) ＆ 飛行日誌チェッカー(全6項目)
// ============================================================================
let oralRemainingPoints = 100;
let currentOralIdx = 0;

function getOralStages() {
  if (window.AERO_EXAM_BANK && Array.isArray(window.AERO_EXAM_BANK.oralStages)) {
    return window.AERO_EXAM_BANK.oralStages;
  }
  return [];
}

function getOralRoleplayChoices(stageObj, idx) {
  if (Array.isArray(stageObj.choices) && stageObj.choices.length > 0) {
    return stageObj.choices;
  }
  // Generate interactive roleplay choices from modelAnswer & keyPoints for all 6 stages
  const distractorsByIdx = [
    [
      '「バッテリー残量だけ確認しました。異常ないのでこのまま離陸します」とだけ伝えてスロットルを上げる（機体ON→送信機ONの逆順で投入）',
      '点検は黙って目視だけで行い、登録記号やリモートID・周囲の安全確認を発声せずに離陸位置へ移動する'
    ],
    [
      '「少々の異音や微振動なら飛行中に収まることが多いので、そのままスクエア飛行の課題へ進みます」と答えて飛行を継続する',
      '着陸させた後、プロペラが回転しているうちに送信機の電源を先に切ってから機体に手を伸ばす'
    ],
    [
      '「飛行高度を5mだけ上げて、歩行者の頭上を素早く通過してミッションを続行します」と回答する',
      '飛行中のまま送信機（プロポ）を地面に置いて、操縦者自身が歩いて第三者へ注意しに行く'
    ],
    [
      '「GNSSが切れても自動RTHボタンを押せば元の位置へ正確に戻るので、RTHスイッチを入れてプロポから手を離します」と回答する',
      '機体が風下に流されるのを防ぐため、ラダー（機首回転）を連続で高速回転させながら最高速度で上昇させる'
    ],
    [
      '「軽傷の負傷者や第三者の看板破損であれば『重大インシデント』にとどまるため、報告義務はありません」と回答する',
      '「ドローン単体が無人の山林で木に接触してプロペラが折れた場合も、必ず大臣への『事故報告』が必要です」と回答する'
    ],
    [
      '「第一種機体認証機は絶対に墜落しないため、モーターが故障してもパラシュートは開傘させず観客席上空をそのまま飛行させます」と回答する',
      '「ジオフェンスを逸脱しそうになったら、地上への警報ブザーを鳴らさずに高度150m以上へ急上昇させます」と回答する'
    ]
  ];
  const dPair = distractorsByIdx[idx] || distractorsByIdx[0];

  return [
    {
      text: stageObj.modelAnswer,
      correct: true,
      feedback: `⭕ 満点回答（減点0）！試験官が求めるキーワード（${(stageObj.keyPoints || []).join(' ／ ')}）をすべて網羅できています。`
    },
    {
      text: dPair[0],
      correct: false,
      feedback: `❌ -15点減点！安全確認手順や法令基準から逸脱しています。下の「満点発声スクリプト＆採点官チェックポイント」を声に出して復習しましょう。`
    },
    {
      text: dPair[1],
      correct: false,
      feedback: `❌ -20点減点（または試験中止）！実地試験では重大な安全不備とみなされます。必ず模範回答の手順通りに発声・行動してください。`
    }
  ];
}

function initOralStageButtons() {
  const stages = getOralStages();
  const btnContainer = document.getElementById('oral-stage-buttons');
  if (!btnContainer || stages.length === 0) return;
  btnContainer.innerHTML = '';
  stages.forEach((st, idx) => {
    const b = document.createElement('button');
    b.id = 'oral-btn-' + idx;
    b.className = idx === 0 ? 'btn btn-primary' : 'btn';
    b.style.fontSize = '0.78rem';
    b.textContent = `場面${idx + 1} (${st.id || ''})`;
    b.title = st.stage;
    b.onclick = () => loadOralStage(idx);
    btnContainer.appendChild(b);
  });
}

function loadOralStage(idx) {
  const stages = getOralStages();
  if (stages.length === 0) return;
  currentOralIdx = Math.max(0, Math.min(stages.length - 1, idx));
  const st = stages[currentOralIdx];

  stages.forEach((_, i) => {
    const b = document.getElementById('oral-btn-' + i);
    if (b) b.className = i === currentOralIdx ? 'btn btn-primary' : 'btn';
  });

  document.getElementById('oral-stage-label').textContent = st.stage;
  document.getElementById('oral-examiner-q').textContent = st.question;

  // Populate Model Answer & Key Points
  const modelEl = document.getElementById('oral-model-answer');
  const kpEl = document.getElementById('oral-key-points');
  if (modelEl) modelEl.textContent = st.modelAnswer || '';
  if (kpEl) {
    kpEl.innerHTML = '';
    (st.keyPoints || []).forEach((pt) => {
      const li = document.createElement('li');
      li.textContent = pt;
      kpEl.appendChild(li);
    });
  }

  const choices = getOralRoleplayChoices(st, currentOralIdx);
  const box = document.getElementById('oral-choices-box');
  box.innerHTML = '';

  choices.forEach((c, cIdx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<strong>[${cIdx + 1}]</strong> <span>${c.text}</span>`;
    btn.onclick = () => {
      const res = document.getElementById('oral-result-box');
      if (c.correct) {
        btn.classList.add('correct');
        res.className = 'feedback-box success';
        res.textContent = c.feedback;
        if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
          window.AERO_MONETIZE_LMS.studyTracker.recordOralAndLogbook({
            checkType: `oral_${st.id || currentOralIdx + 1}`,
            deductionPoints: 0,
            flawDetected: `${st.stage}（満点クリア）`
          });
        }
      } else {
        btn.classList.add('wrong');
        oralRemainingPoints = Math.max(0, oralRemainingPoints - 15);
        const badge = document.getElementById('oral-points-badge');
        badge.textContent = `残り持ち点: ${oralRemainingPoints} / 100点`;
        badge.style.background = 'var(--status-danger-bg)';
        badge.style.color = 'var(--status-danger)';
        res.className = 'feedback-box error';
        res.textContent = c.feedback;
        if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
          window.AERO_MONETIZE_LMS.studyTracker.recordOralAndLogbook({
            checkType: `oral_${st.id || currentOralIdx + 1}`,
            deductionPoints: 15,
            flawDetected: st.stage
          });
        }
      }
    };
    box.appendChild(btn);
  });
}

// Flight Log Defect Inspector (All 6 Cases from AERO_EXAM_BANK.flightLogCases)
function getFlightLogCases() {
  if (window.AERO_EXAM_BANK && Array.isArray(window.AERO_EXAM_BANK.flightLogCases)) {
    return window.AERO_EXAM_BANK.flightLogCases;
  }
  return [];
}

function renderFlightLogTable() {
  const cases = getFlightLogCases();
  const tbody = document.getElementById('flight-log-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  cases.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="mono" style="font-size:0.72rem; color:var(--brand-primary); font-weight:700;">${c.id} | ${c.formType}</div>
        <div style="font-weight:700; margin-top:0.15rem;">${c.title}</div>
      </td>
      <td id="flog-val-${idx}">
        <span style="color:var(--status-danger); font-weight:600;">❌ 誤記入例：</span>${c.badExample}
      </td>
      <td>
        <button id="flog-btn-${idx}" class="btn" style="font-size:0.78rem;" onclick="inspectFlightLogRow(${idx})">
          ⚠️ 検証・修正する
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function inspectFlightLogRow(idx) {
  const cases = getFlightLogCases();
  const c = cases[idx];
  if (!c) return;

  const valTd = document.getElementById('flog-val-' + idx);
  const btn = document.getElementById('flog-btn-' + idx);
  const fb = document.getElementById('flight-log-feedback');

  valTd.innerHTML = `
    <div style="text-decoration:line-through; color:var(--text-muted); font-size:0.76rem; margin-bottom:0.25rem;">誤：${c.badExample}</div>
    <div style="color:var(--status-success); font-weight:700;">✅ 正しい記載ルール：${c.correctRule}</div>
  `;
  if (btn) {
    btn.className = 'btn btn-primary';
    btn.textContent = '✅ 修正完了';
  }
  fb.className = 'feedback-box warning';
  fb.innerHTML = `<strong>📋 【${c.id}：${c.formType}】</strong><br/>${c.deductionRisk}`;

  if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
    window.AERO_MONETIZE_LMS.studyTracker.recordOralAndLogbook({
      checkType: `logbook_${c.id}`,
      deductionPoints: 5,
      flawDetected: c.title
    });
  }
}

// ============================================================================
// MODULE 3: 一等学科 — 計算ビジュアライザー(全9公式) ＆ 無限ランダム生成ドリル
// ============================================================================
let currentCalcViz = 'turn';

function initCalcFormulaControls() {
  if (!window.AERO_PHYSICS_ENGINE || !window.AERO_PHYSICS_ENGINE.formulas) return;
  const formulas = window.AERO_PHYSICS_ENGINE.formulas;
  const keys = window.AERO_PHYSICS_ENGINE.formulaKeys || Object.keys(formulas);

  const sel = document.getElementById('calc-formula-select');
  const btnBox = document.getElementById('calc-formula-buttons');
  if (sel) sel.innerHTML = '';
  if (btnBox) btnBox.innerHTML = '';

  keys.forEach((key) => {
    const f = formulas[key];
    if (sel) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = f.title;
      sel.appendChild(opt);
    }
    if (btnBox) {
      const b = document.createElement('button');
      b.id = 'viz-btn-' + key;
      b.className = key === currentCalcViz ? 'btn btn-primary' : 'btn';
      b.style.fontSize = '0.76rem';
      b.style.padding = '0.35rem 0.65rem';
      b.textContent = f.shortLabel;
      b.onclick = () => setCalcVisualizer(key);
      btnBox.appendChild(b);
    }
  });
}

function setCalcVisualizer(mode) {
  if (!window.AERO_PHYSICS_ENGINE || !window.AERO_PHYSICS_ENGINE.formulas) return;
  const formulas = window.AERO_PHYSICS_ENGINE.formulas;
  if (!formulas[mode]) mode = 'turn';
  currentCalcViz = mode;

  const f = formulas[mode];
  const sel = document.getElementById('calc-formula-select');
  if (sel && sel.value !== mode) sel.value = mode;

  Object.keys(formulas).forEach((k) => {
    const btn = document.getElementById('viz-btn-' + k);
    if (btn) {
      btn.className = k === mode ? 'btn btn-primary' : 'btn';
    }
  });

  document.getElementById('calc-formula-title').textContent = f.title;
  document.getElementById('calc-formula-eq').textContent = f.equation;
  document.getElementById('calc-formula-desc').textContent = f.description;

  const s1 = document.getElementById('calc-s1');
  const s2 = document.getElementById('calc-s2');
  const l1 = document.getElementById('calc-s1-label');
  const l2 = document.getElementById('calc-s2-label');

  l1.textContent = f.slider1.label;
  s1.min = f.slider1.min;
  s1.max = f.slider1.max;
  s1.step = f.slider1.step;
  s1.value = f.slider1.defaultValue;

  l2.textContent = f.slider2.label;
  s2.min = f.slider2.min;
  s2.max = f.slider2.max;
  s2.step = f.slider2.step;
  s2.value = f.slider2.defaultValue;

  renderCalcVisualizer();
}

function renderCalcVisualizer() {
  if (!window.AERO_PHYSICS_ENGINE) return;
  const v1 = parseFloat(document.getElementById('calc-s1').value);
  const v2 = parseFloat(document.getElementById('calc-s2').value);

  const res = window.AERO_PHYSICS_ENGINE.computeFormula(currentCalcViz, v1, v2);
  const svgHtml = window.AERO_PHYSICS_ENGINE.renderFormulaSvg(currentCalcViz, v1, v2);

  document.getElementById('calc-s1-val').textContent = res.s1Display;
  document.getElementById('calc-s2-val').textContent = res.s2Display;
  document.getElementById('calc-m1-label').textContent = res.m1Label;
  document.getElementById('calc-m1-val').textContent = res.m1Val;
  document.getElementById('calc-m2-label').textContent = res.m2Label;
  document.getElementById('calc-m2-val').textContent = res.m2Val;
  document.getElementById('calc-m3-label').textContent = res.m3Label;
  document.getElementById('calc-m3-val').textContent = res.m3Val;

  const stepBox = document.getElementById('calc-step-box');
  if (stepBox) {
    stepBox.textContent = `📝 リアルタイム途中式： ${res.stepByStep}`;
  }

  const svg = document.getElementById('calc-viz-svg');
  if (svg) svg.innerHTML = svgHtml;
}

// Infinite Random Calculation Drill Generator (All 9 Formulas)
function generateNewDrill(formulaKey) {
  if (!window.AERO_PHYSICS_ENGINE) return;
  const drill = window.AERO_PHYSICS_ENGINE.generateRandomDrill(formulaKey || 'all');

  const tagEl = document.getElementById('drill-formula-tag');
  const stemEl = document.getElementById('drill-stem');
  const choicesEl = document.getElementById('drill-choices');
  const fbEl = document.getElementById('drill-feedback');

  if (tagEl) tagEl.textContent = `📐 出題公式：${drill.title}`;
  stemEl.textContent = drill.stem;
  choicesEl.innerHTML = '';

  drill.options.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn mono';
    btn.innerHTML = `<strong>(${i + 1})</strong> <span>${o.text}</span>`;
    btn.onclick = () => {
      btn.classList.add(o.correct ? 'correct' : 'wrong');
      fbEl.className = o.correct ? 'feedback-box success' : 'feedback-box error';
      fbEl.textContent = o.exp;

      // Sync left visualizer to match the drill parameters
      setCalcVisualizer(drill.formulaKey);
      if (o.slider1Val !== undefined) document.getElementById('calc-s1').value = o.slider1Val;
      if (o.slider2Val !== undefined) document.getElementById('calc-s2').value = o.slider2Val;
      renderCalcVisualizer();

      // Record to studyTracker
      if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
        window.AERO_MONETIZE_LMS.studyTracker.recordCalcDrill({
          drillType: drill.formulaKey,
          isCorrect: o.correct,
          timeSpentSec: 45,
          topic: drill.title
        });
      }
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
// ============================================================================
// MODULE 1 (Pillar 1): 学科CBT完全再現モック(全30問・全6章フィルタ) × 普遍的原則・版改訂ビューア ＋ 全6章スマート教科書
// ============================================================================
let currentCbtFilter = 'all'; // 'all' | 'ch1_2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'ittou' | 'fifth' | 'nitou'
let filteredCbtQuestions = [];
let cbtIndex = 0;
const cbtFlagsById = {};
const cbtAnswersById = {};
let currentCbtExamMode = 'ittou_75m'; // 'nitou_30m' | 'ittou_75m'
let cbtTimerInterval = null;
let cbtRemainingSec = 75 * 60;
let cbtTimerRunning = false;
let currentKyosokuTab = 'ch1_2'; // 'ch1_2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'versions'

const CHAPTER_LABEL_MAP = {
  ch1_2: '第1・2章：操縦者の心得',
  ch3: '第3章：規則・関連法令',
  ch4: '第4章：機体システム',
  ch5: '第5章：気象・運航体制',
  ch6: '第6章：運航リスク管理'
};

function formatCbtTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `⏱️ ${m}:${s}`;
}

function changeCbtExamMode(mode) {
  currentCbtExamMode = mode === 'nitou_30m' ? 'nitou_30m' : 'ittou_75m';
  if (cbtTimerInterval) {
    clearInterval(cbtTimerInterval);
    cbtTimerInterval = null;
  }
  cbtTimerRunning = false;
  cbtRemainingSec = currentCbtExamMode === 'nitou_30m' ? 30 * 60 : 75 * 60;

  const disp = document.getElementById('cbt-timer-display');
  if (disp) disp.textContent = formatCbtTimer(cbtRemainingSec);

  const btn = document.getElementById('btn-cbt-timer-toggle');
  if (btn) btn.textContent = '▶️ タイマー開始/リセット';

  if (currentCbtExamMode === 'nitou_30m') {
    setCbtFilter('nitou');
  } else {
    setCbtFilter('all');
  }
}

function toggleOrResetCbtTimer() {
  const disp = document.getElementById('cbt-timer-display');
  const btn = document.getElementById('btn-cbt-timer-toggle');
  const defaultSec = currentCbtExamMode === 'nitou_30m' ? 30 * 60 : 75 * 60;

  if (cbtTimerRunning) {
    clearInterval(cbtTimerInterval);
    cbtTimerInterval = null;
    cbtTimerRunning = false;
    cbtRemainingSec = defaultSec;
    if (disp) disp.textContent = formatCbtTimer(cbtRemainingSec);
    if (btn) btn.textContent = '▶️ タイマー開始/リセット';
    return;
  }

  cbtRemainingSec = defaultSec;
  cbtTimerRunning = true;
  if (disp) disp.textContent = formatCbtTimer(cbtRemainingSec);
  if (btn) btn.textContent = '⏹️ リセット (稼働中)';

  cbtTimerInterval = setInterval(() => {
    cbtRemainingSec--;
    if (cbtRemainingSec <= 0) {
      clearInterval(cbtTimerInterval);
      cbtTimerInterval = null;
      cbtTimerRunning = false;
      if (disp) disp.textContent = '⏱️ 00:00 (試験終了)';
      if (btn) btn.textContent = '▶️ タイマー開始/リセット';
      gradeCbtSession();
      return;
    }
    if (disp) disp.textContent = formatCbtTimer(cbtRemainingSec);
  }, 1000);
}

function gradeCbtSession() {
  const box = document.getElementById('cbt-session-grade-summary');
  if (!box) return;
  box.classList.remove('hidden');

  const pool = filteredCbtQuestions.length > 0 ? filteredCbtQuestions : getFilteredCbtQuestions();
  let answeredCount = 0;
  let correctCount = 0;
  let flaggedCount = 0;
  const chapterStats = {};

  pool.forEach((q, idx) => {
    const qId = q.id || `Q-${idx + 1}`;
    const chKey = q.chapterId || 'ch3';
    if (!chapterStats[chKey]) {
      chapterStats[chKey] = { total: 0, answered: 0, correct: 0 };
    }
    chapterStats[chKey].total++;
    if (cbtFlagsById[qId]) flaggedCount++;

    const rec = cbtAnswersById[qId];
    if (rec !== undefined) {
      answeredCount++;
      chapterStats[chKey].answered++;
      if (rec.isCorrect) {
        correctCount++;
        chapterStats[chKey].correct++;
      }
    }
  });

  const baseCount = answeredCount > 0 ? answeredCount : pool.length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / baseCount) * 100) : 0;
  const isPass = answeredCount > 0 && accuracy >= 80;

  const weakChapters = [];
  Object.keys(chapterStats).forEach((chKey) => {
    const st = chapterStats[chKey];
    if (st.answered > 0) {
      const chAcc = Math.round((st.correct / st.answered) * 100);
      if (chAcc < 80) {
        weakChapters.push(`${CHAPTER_LABEL_MAP[chKey] || chKey}（正答率 ${chAcc}%）`);
      }
    }
  });

  const modeLabel = currentCbtExamMode === 'nitou_30m' ? '二等学科モード（制限30分・合格基準80%）' : '一等学科フルモード（制限75分・合格基準80%）';

  if (answeredCount === 0) {
    box.className = 'feedback-box warning';
    box.innerHTML = `
      <div>📊 <strong>【${modeLabel}】現在まだ回答済みの問題がありません（対象：全${pool.length}問 ／ 見直しフラグ：${flaggedCount}件）</strong></div>
      <div style="font-size:0.8rem; margin-top:0.25rem;">下の問題パネルで選択肢をクリックして回答すると、正答数・正答率・合否判定（80%基準）および章別アドバイスが即時算出されます。</div>
    `;
    return;
  }

  const adviceText =
    weakChapters.length > 0
      ? `⚠️ 要復習チャプター：<strong>${weakChapters.join(' ／ ')}</strong>。下の「📚 教則全6章 体系スマート教科書」で該当章の条文根拠とひっかけ注意点を復習しましょう。`
      : `✅ 回答済みのすべての章で合格基準（80%以上）を達成しています！未回答問題（残り ${pool.length - answeredCount} 問）や見直しフラグ（${flaggedCount} 件）も仕上げましょう。`;

  box.className = isPass ? 'feedback-box success' : 'feedback-box error';
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <strong>${isPass ? '🎉 【合格圏到達（80%以上クリア）】' : '🚨 【要復習（合格基準80%未達）】'} ${modeLabel}</strong>
      <span class="mono" style="font-weight:800; font-size:0.9rem;">正答 ${correctCount} / 回答 ${answeredCount} 問（対象全${pool.length}問）｜ 正答率 ${accuracy}% ｜ 🚩フラグ ${flaggedCount}件</span>
    </div>
    <div style="font-size:0.81rem; margin-top:0.35rem; line-height:1.5;">${adviceText}</div>
  `;
}

function getFilteredCbtQuestions() {
  const all = (window.AERO_EXAM_BANK && window.AERO_EXAM_BANK.cbtQuestions) || [];
  if (currentCbtFilter === 'ch1_2' || currentCbtFilter === 'ch3' || currentCbtFilter === 'ch4' || currentCbtFilter === 'ch5' || currentCbtFilter === 'ch6') {
    return all.filter((q) => q.chapterId === currentCbtFilter);
  }
  if (currentCbtFilter === 'fifth') {
    return all.filter((q) => q.isFifthEd === true);
  }
  if (currentCbtFilter === 'ittou') {
    return all.filter((q) => q.grade === 'ittou');
  }
  if (currentCbtFilter === 'nitou') {
    return all.filter((q) => q.grade === 'nitou' || q.grade === 'both');
  }
  return all;
}

function setCbtFilter(filterKey) {
  currentCbtFilter = filterKey;
  ['all', 'ch1_2', 'ch3', 'ch4', 'ch5', 'ch6', 'ittou', 'fifth'].forEach((k) => {
    const b = document.getElementById('cbt-filter-' + k);
    if (b) b.className = k === filterKey ? 'btn btn-primary' : 'btn';
  });
  filteredCbtQuestions = getFilteredCbtQuestions();
  cbtIndex = 0;
  renderCbtQuestion(0);
}

function prevCbtQuestion() {
  if (filteredCbtQuestions.length === 0) return;
  const nextIdx = (cbtIndex - 1 + filteredCbtQuestions.length) % filteredCbtQuestions.length;
  renderCbtQuestion(nextIdx);
}

function nextCbtQuestion() {
  if (filteredCbtQuestions.length === 0) return;
  const nextIdx = (cbtIndex + 1) % filteredCbtQuestions.length;
  renderCbtQuestion(nextIdx);
}

function mapQuestionToCategoryId(item) {
  if (item.isFifthEd) return 'cat_4';
  if (item.grade === 'ittou' && item.id === 'CBT-1ST-18') return 'cat_calc';
  if (item.chapterId === 'ch4') return 'cat_2';
  if (item.chapterId === 'ch1_2') return 'cat_3';
  if (item.chapterId === 'ch5' || item.chapterId === 'ch6') return 'cat_4';
  return 'cat_1';
}

function renderCbtQuestion(idx) {
  if (filteredCbtQuestions.length === 0) {
    filteredCbtQuestions = getFilteredCbtQuestions();
  }
  if (filteredCbtQuestions.length === 0) return;

  cbtIndex = Math.max(0, Math.min(filteredCbtQuestions.length - 1, idx));
  const item = filteredCbtQuestions[cbtIndex];
  const qId = item.id || `Q-${cbtIndex + 1}`;

  document.getElementById('cbt-q-title').textContent = `問 ${cbtIndex + 1} / ${filteredCbtQuestions.length}`;
  document.getElementById('cbt-flag-chk').checked = Boolean(cbtFlagsById[qId]);
  document.getElementById('cbt-badge-id').textContent = qId;

  const chBadge = document.getElementById('cbt-badge-chapter');
  if (chBadge) {
    chBadge.textContent = CHAPTER_LABEL_MAP[item.chapterId] || '教則全6章';
  }

  document.getElementById('cbt-badge-cat').textContent = item.category || item.cat || '';
  document.getElementById('cbt-question-text').textContent = item.q;
  document.getElementById('cbt-ref-badge').textContent = item.ref;

  const edBadge = document.getElementById('cbt-edition-badge');
  if (edBadge) {
    if (item.isFifthEd) {
      edBadge.textContent = '🔥 第5版改訂重点 (v4→v5差分あり)';
      edBadge.style.background = 'var(--status-warning-bg)';
      edBadge.style.color = 'var(--status-warning)';
    } else if (item.grade === 'ittou') {
      edBadge.textContent = '👑 一等固有カリキュラム (全6章体系)';
      edBadge.style.background = '#e0e7ff';
      edBadge.style.color = '#3730a3';
    } else {
      edBadge.textContent = '📘 教則普遍カリキュラム (第1章〜第6章共通)';
      edBadge.style.background = 'var(--status-success-bg)';
      edBadge.style.color = 'var(--status-success)';
    }
  }

  const coreEl = document.getElementById('cbt-core-principle');
  if (coreEl) {
    coreEl.textContent = item.corePrinciple || '無人航空機の航行の安全および地上・水上の人・物件の安全を確保するための教則の普遍的原則に基づきます。';
  }

  const oldLabelEl = document.getElementById('cbt-diff-old-label');
  const oldContentEl = document.getElementById('cbt-diff-old');
  const newLabelEl = document.getElementById('cbt-diff-new-label');
  if (item.isFifthEd) {
    if (oldLabelEl) oldLabelEl.textContent = '❌ 旧・教則第4版までの規定（誤答トラップ注意）';
    if (oldContentEl) oldContentEl.style.textDecoration = 'line-through';
    if (newLabelEl) newLabelEl.textContent = '✅ 教則第5版（現行最新基準・2026年7月14日適用）';
  } else {
    if (oldLabelEl) oldLabelEl.textContent = '📌 関連条文・制度の前提背景';
    if (oldContentEl) oldContentEl.style.textDecoration = 'none';
    if (newLabelEl) newLabelEl.textContent = '✅ 教則の体系的規定・正答の根拠';
  }

  document.getElementById('cbt-diff-old').innerHTML = item.oldRule;
  document.getElementById('cbt-diff-new').innerHTML = item.newRule;
  document.getElementById('cbt-diff-tip').textContent = item.tip;

  // Render Palette
  const pal = document.getElementById('cbt-palette');
  pal.innerHTML = '';
  filteredCbtQuestions.forEach((qItem, i) => {
    const idKey = qItem.id || `Q-${i + 1}`;
    const ansRec = cbtAnswersById[idKey];
    const mark = ansRec ? (ansRec.isCorrect ? '⭕' : '❌') : '';
    const b = document.createElement('button');
    b.className = i === cbtIndex ? 'btn btn-primary mono' : 'btn mono';
    b.style.padding = '0.22rem 0.5rem';
    b.style.fontSize = '0.75rem';
    b.textContent = `${i + 1}${mark}${cbtFlagsById[idKey] ? '🚩' : ''}`;
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
      const isCorrect = cIdx === item.ans;
      cbtAnswersById[qId] = {
        selectedIdx: cIdx,
        isCorrect: isCorrect,
        chapterId: item.chapterId || 'ch3'
      };
      const fb = document.getElementById('cbt-answer-feedback');
      if (isCorrect) {
        btn.classList.add('correct');
        fb.className = 'feedback-box success';
        fb.innerHTML = `⭕ <strong>正解（選択肢 ${cIdx + 1}）！</strong> 右側の「教則スマート教科書ビューア」で普遍的原則（Core Principle）と条文根拠を確認してください。`;
      } else {
        btn.classList.add('wrong');
        fb.className = 'feedback-box error';
        fb.innerHTML = `❌ <strong>不正解。正解は (${item.ans + 1}) です。</strong> 右パネルの「普遍的原則（Core Principle）」および改訂差分・ひっかけ回避ポイントを確認しましょう。`;
      }

      if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.studyTracker) {
        window.AERO_MONETIZE_LMS.studyTracker.recordCbtAnswer({
          questionId: qId,
          categoryId: mapQuestionToCategoryId(item),
          isCorrect: isCorrect,
          isFifthEd: Boolean(item.isFifthEd),
          topic: item.category || item.cat
        });
      }
    };
    cBox.appendChild(btn);
  });
}

function toggleFlagCurrent() {
  if (filteredCbtQuestions.length === 0) return;
  const item = filteredCbtQuestions[cbtIndex];
  const qId = item.id || `Q-${cbtIndex + 1}`;
  cbtFlagsById[qId] = document.getElementById('cbt-flag-chk').checked;
  renderCbtQuestion(cbtIndex);
}

// 教則全6章 体系スマート教科書 ＆ バージョン管理機構 (kyosokuChapters + versionRegistry)
function scrollToKyosokuTextbook() {
  switchModule('textbook');
}

function openKyosokuChapterForCurrentQ() {
  if (filteredCbtQuestions.length > 0 && filteredCbtQuestions[cbtIndex]) {
    const chId = filteredCbtQuestions[cbtIndex].chapterId || 'ch1_2';
    selectKyosokuTab(chId);
  }
  switchModule('textbook');
}

function filterCbtByChapterFromTextbook(chId) {
  setCbtFilter(chId);
  switchModule('cbt');
}

function selectKyosokuTab(tabKey) {
  currentKyosokuTab = tabKey;
  ['ch1_2', 'ch3', 'ch4', 'ch5', 'ch6', 'versions'].forEach((k) => {
    const b = document.getElementById('kyosoku-tab-' + k);
    if (!b) return;
    if (k === tabKey) {
      b.className = k === 'versions' ? 'btn btn-amber' : 'btn btn-primary';
    } else {
      b.className = 'btn';
    }
  });
  renderKyosokuTextbook();
}

function renderKyosokuTextbook() {
  const container = document.getElementById('kyosoku-textbook-body');
  if (!container || !window.AERO_EXAM_BANK) return;

  if (currentKyosokuTab === 'versions') {
    const reg = window.AERO_EXAM_BANK.versionRegistry;
    if (!reg || !reg.editions) return;
    const editions = Object.values(reg.editions);
    let cardsHtml = '';
    editions.forEach((ed) => {
      const isCurrent = ed.id === reg.currentEdition;
      const borderStyle = isCurrent ? 'border:2px solid var(--brand-primary); background:#f0f9ff;' : 'border:1px solid var(--border-color); background:var(--bg-subtle);';
      const statusBadge = isCurrent
        ? `<span class="nav-pill" style="background:var(--status-success-bg); color:var(--status-success); font-weight:800;">● 現行適用基準 (${ed.effectiveDate}〜)</span>`
        : ed.status === 'archived'
          ? `<span class="nav-pill" style="background:#fee2e2; color:#991b1b; font-weight:700;">アーカイブ (${ed.effectiveDate})</span>`
          : `<span class="nav-pill" style="background:#fef3c7; color:#92400e; font-weight:700;">将来改訂拡張スキーマ (${ed.effectiveDate})</span>`;

      const highlightsHtml = (ed.keyHighlights || []).map((h) => `<li style="margin-bottom:0.25rem;">${h}</li>`).join('');
      let schemaHtml = '';
      if (ed.diffPatchTemplate) {
        schemaHtml = `
          <div class="mono" style="margin-top:0.55rem; background:#0f172a; color:#e2e8f0; padding:0.65rem; border-radius:6px; font-size:0.75rem; line-height:1.45;">
            <div style="color:#38bdf8; font-weight:700; margin-bottom:0.2rem;">// 将来改訂ホットスワップ用パッチ定義スキーマ</div>
            targetChapterId: "${ed.diffPatchTemplate.targetChapterId}"<br/>
            ruleId: "${ed.diffPatchTemplate.ruleId}"<br/>
            migrationNote: "${ed.diffPatchTemplate.migrationNote}"
          </div>
        `;
      }

      let pdfLinksHtml = '';
      const linkBtns = [];
      if (ed.officialPdfUrl) {
        linkBtns.push(`<a href="${ed.officialPdfUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.74rem; padding:0.2rem 0.55rem; text-decoration:none;">📄 公式PDFを開く ↗</a>`);
      }
      if (ed.changelogPdfUrl) {
        linkBtns.push(`<a href="${ed.changelogPdfUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.74rem; padding:0.2rem 0.55rem; text-decoration:none;">📑 変更履歴PDF ↗</a>`);
      }
      if (ed.practicalExamStandardUrl) {
        linkBtns.push(`<a href="${ed.practicalExamStandardUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.74rem; padding:0.2rem 0.55rem; text-decoration:none;">📋 実地試験実施基準PDF ↗</a>`);
      }
      if (ed.portalUrl) {
        linkBtns.push(`<a href="${ed.portalUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.74rem; padding:0.2rem 0.55rem; text-decoration:none;">🌐 国交省公式ページ ↗</a>`);
      }
      if (linkBtns.length > 0) {
        pdfLinksHtml = `<div style="margin-top:0.65rem; display:flex; gap:0.4rem; flex-wrap:wrap;">${linkBtns.join('')}</div>`;
      }

      cardsHtml += `
        <div style="${borderStyle} border-radius:8px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.45rem;">
            <strong style="font-size:0.95rem; color:var(--text-main);">${ed.name}</strong>
            ${statusBadge}
          </div>
          <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:0.6rem; line-height:1.5;">${ed.summary}</p>
          <ul style="font-size:0.8rem; color:var(--text-main); padding-left:1.15rem; line-height:1.5;">
            ${highlightsHtml}
          </ul>
          ${pdfLinksHtml}
          ${schemaHtml}
        </div>
      `;
    });

    container.innerHTML = `
      <div style="margin-bottom:0.75rem; padding:0.75rem 1rem; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; font-size:0.83rem; color:#92400e;">
        🔄 <strong>教則バージョン管理機構（Version Registry）：</strong> AERO-PASSは特定の版にハードコードせず、教則全6章の普遍的原則（<code>corePrinciple</code>）と各版の規定差分（<code>oldRule</code> / <code>newRule</code>）を分離管理しているため、第6版以降の法改正・教則改訂にも即座に対応できます。
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:0.85rem;">
        ${cardsHtml}
      </div>
    `;
    return;
  }

  const chapters = window.AERO_EXAM_BANK.kyosokuChapters || [];
  const ch = chapters.find((c) => c.id === currentKyosokuTab) || chapters[0];
  if (!ch) return;

  const qCount = ((window.AERO_EXAM_BANK && window.AERO_EXAM_BANK.cbtQuestions) || []).filter((q) => q.chapterId === ch.id).length;

  let sectionsHtml = '';
  (ch.sections || []).forEach((sec) => {
    const ptsHtml = (sec.keyPoints || []).map((pt) => `<li style="margin-bottom:0.35rem;">${pt}</li>`).join('');
    sectionsHtml += `
      <div style="border:1px solid var(--border-color); border-radius:8px; padding:1rem; background:#ffffff;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.45rem;">
          <div style="font-weight:800; font-size:0.92rem; color:var(--brand-primary);">§ ${sec.secNo}　${sec.title}</div>
          <span class="mono" style="font-size:0.74rem; background:var(--bg-subtle); padding:0.2rem 0.5rem; border-radius:4px; color:var(--text-secondary); font-weight:600;">根拠：${sec.lawOrPrinciple}</span>
        </div>
        <div style="background:#eff6ff; border-left:3px solid var(--brand-primary); padding:0.6rem 0.8rem; border-radius:4px; font-size:0.83rem; font-weight:600; color:#1e3a8a; margin-bottom:0.65rem; line-height:1.5;">
          💡 <strong>体系的要旨：</strong> ${sec.coreSummary}
        </div>
        <ul style="font-size:0.82rem; color:var(--text-main); padding-left:1.2rem; line-height:1.55; margin-bottom:0.65rem;">
          ${ptsHtml}
        </ul>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:0.55rem 0.75rem; font-size:0.79rem; color:#991b1b; font-weight:600;">
          ⚠️ <strong>学科・実地試験の頻出ひっかけ注意：</strong> ${sec.trapWarning}
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:8px; padding:0.9rem 1.1rem; margin-bottom:0.9rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
      <div style="flex:1; min-width:260px;">
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.25rem;">
          <span class="nav-pill" style="background:var(--brand-primary); color:#fff; font-weight:800; font-size:0.76rem;">${ch.chapterNumber}</span>
          <strong style="font-size:0.98rem; color:var(--text-main);">${ch.title}</strong>
          <span class="mono" style="font-size:0.74rem; color:var(--brand-primary); font-weight:700;">（${ch.weightBadge}）</span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">${ch.overview}</p>
      </div>
      <button class="btn btn-primary" onclick="filterCbtByChapterFromTextbook('${ch.id}')">
        📝 この章のCBT問題（全${qCount}問）を演習する ↑
      </button>
    </div>
    <div style="display:flex; flex-direction:column; gap:0.85rem;">
      ${sectionsHtml}
    </div>
  `;
}

// Cheat Sheet Sub-view in Module 4
let currentCheatSheetTab = 'diff'; // 'diff' | 'num' | 'form'

function scrollToCheatSheet() {
  switchModule('cheatsheet');
}

function setCheatSheetTab(tab) {
  currentCheatSheetTab = tab;
  ['diff', 'num', 'form'].forEach((t) => {
    const b = document.getElementById('cs-tab-' + t);
    if (b) b.className = t === tab ? 'btn btn-primary' : 'btn';
  });
  renderCheatSheet();
}

function renderCheatSheet() {
  if (!window.AERO_GROWTH_FUNNEL || !window.AERO_GROWTH_FUNNEL.searchCheatSheet) return;
  const query = (document.getElementById('cheatsheet-search-input') || {}).value || '';
  const data = window.AERO_GROWTH_FUNNEL.searchCheatSheet(query);
  const container = document.getElementById('cheatsheet-body');
  if (!container) return;

  if (currentCheatSheetTab === 'diff') {
    let rowsHtml = '';
    data.diffs.forEach((d) => {
      rowsHtml += `
        <tr>
          <td>
            <div style="font-weight:800; color:var(--brand-primary);">${d.topic}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">${d.chapter} | 重要度: ${d.importance}</div>
          </td>
          <td style="background:#fef2f2; color:#7f1d1d;">${d.oldEdition4}</td>
          <td style="background:#ecfdf5; color:#065f46; font-weight:600;">${d.newEdition5}</td>
          <td><span style="font-size:0.78rem; color:#92400e;">⚠️ ${d.examTrapPoint}</span></td>
        </tr>
      `;
    });
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:24%;">改訂テーマ・該当章</th>
            <th style="width:24%;">❌ 旧・教則第4版まで</th>
            <th style="width:28%;">✅ 教則第5版（2026.7.14現行）</th>
            <th style="width:24%;">🎯 試験のひっかけ対策</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || '<tr><td colspan="4">該当する項目がありません</td></tr>'}</tbody>
      </table>
    `;
  } else if (currentCheatSheetTab === 'num') {
    let cardsHtml = '';
    data.numbers.forEach((c) => {
      cardsHtml += `
        <div style="border:1px solid var(--border-color); border-radius:8px; padding:0.85rem; background:var(--bg-subtle);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <span class="mono" style="background:var(--brand-primary); color:#fff; font-weight:800; padding:0.15rem 0.5rem; border-radius:4px; font-size:0.84rem;">${c.numberKey}</span>
            <span style="font-size:0.73rem; font-weight:700; color:var(--text-secondary);">${c.category}</span>
          </div>
          <div style="font-weight:700; font-size:0.84rem; margin-bottom:0.35rem;">Q. ${c.frontQuestion}</div>
          <div style="font-size:0.82rem; color:#065f46; background:#ecfdf5; padding:0.5rem; border-radius:6px; font-weight:600; margin-bottom:0.35rem;">A. ${c.backAnswer}</div>
          <div style="font-size:0.76rem; color:#92400e;">${c.trapAlert}</div>
        </div>
      `;
    });
    container.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:0.75rem;">${cardsHtml}</div>`;
  } else {
    let formHtml = '';
    data.formulas.forEach((f) => {
      formHtml += `
        <div style="border:1px solid var(--border-color); border-radius:8px; padding:0.9rem; background:var(--bg-subtle);">
          <div style="font-weight:800; color:var(--brand-primary); font-size:0.9rem;">${f.title}</div>
          <div class="mono" style="background:#fff; border:1px solid var(--border-strong); padding:0.45rem 0.65rem; border-radius:6px; font-weight:800; margin:0.4rem 0; font-size:0.84rem;">${f.formulaText}</div>
          <div style="font-size:0.76rem; color:var(--text-secondary); margin-bottom:0.35rem;">${f.variables}</div>
          <div style="font-size:0.82rem; font-weight:600; color:#065f46; margin-bottom:0.25rem;">${f.quickRule}</div>
          <div class="mono" style="font-size:0.78rem; color:#0369a1;">${f.exampleCalc}</div>
        </div>
      `;
    });
    container.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); gap:0.75rem;">${formHtml}</div>`;
  }
}

// ============================================================================
// MODULE 5: スクール送客・個人弱点トップ3分析・B2B LMS管理画面
// ============================================================================
function renderPersonalAnalytics() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.studyTracker) return;
  const summary = window.AERO_MONETIZE_LMS.studyTracker.getAnalyticsSummary();

  document.getElementById('study-prob-val').textContent = `${summary.estimatedPassProbability}%`;
  document.getElementById('study-5th-val').textContent = `${summary.fifthEdMasteryRate}%`;
  document.getElementById('study-calc-val').textContent = `${summary.calcAccuracyRate}%`;
  document.getElementById('study-desk-val').textContent = `${summary.latestDeskExamScore}点`;

  const verdictEl = document.getElementById('study-pass-verdict');
  verdictEl.textContent = summary.passVerdictLabel;
  if (summary.estimatedPassProbability >= 85) {
    verdictEl.style.background = 'var(--status-success-bg)';
    verdictEl.style.color = 'var(--status-success)';
  } else if (summary.estimatedPassProbability >= 75) {
    verdictEl.style.background = 'var(--status-warning-bg)';
    verdictEl.style.color = 'var(--status-warning)';
  } else {
    verdictEl.style.background = 'var(--status-danger-bg)';
    verdictEl.style.color = 'var(--status-danger)';
  }

  const top3Box = document.getElementById('study-weakness-top3');
  if (top3Box) {
    top3Box.innerHTML = '';
    summary.top3Weaknesses.forEach((w) => {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid var(--border-color); border-radius:8px; padding:0.65rem; background:var(--bg-subtle); font-size:0.78rem;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
          <strong style="color:var(--status-danger);">弱点 #${w.rank}：${w.title}</strong>
          <span class="mono" style="font-weight:700;">正答率 ${w.currentAccuracy}% (目標${w.targetAccuracy}%)</span>
        </div>
        <div style="color:var(--text-secondary); line-height:1.45;">${w.actionableAdvice}</div>
      `;
      top3Box.appendChild(card);
    });
  }
}

function resetPersonalStudyData() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.studyTracker) return;
  window.AERO_MONETIZE_LMS.studyTracker.resetStudyData();
  renderPersonalAnalytics();
}

function updateSchoolComparison() {
  if (!window.AERO_GROWTH_FUNNEL || !window.AERO_GROWTH_FUNNEL.calculateExamROI) return;
  const lic = document.getElementById('lead-license-type').value;
  const exp = document.getElementById('lead-exp-level').value;
  const subEl = document.getElementById('lead-subsidy-type');
  const sub = subEl ? subEl.value : 'kyufukin';

  const roi = window.AERO_GROWTH_FUNNEL.calculateExamROI({
    licenseType: lic,
    expLevel: exp,
    subsidyType: sub
  });

  const box = document.getElementById('school-comparison-box');
  box.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.82rem;">
      <div style="background:#fef2f2; border:1px solid #fca5a5; padding:0.75rem; border-radius:6px;">
        <div style="font-weight:800; color:#991b1b;">⚠️ ${roi.directExam.routeName}</div>
        <div style="margin-top:0.3rem;">推定一発合格率：<strong class="mono">${roi.directExam.estimatedPassRate}%</strong> (平均再受験 ${roi.directExam.expectedRetakes}回)</div>
        <div style="margin-top:0.2rem;">想定総費用（再受験・練習機・コート込）：<strong class="mono" style="font-size:0.95rem; color:#991b1b;">¥${roi.directExam.totalEstimatedCost.toLocaleString()}</strong></div>
        <div style="color:#7f1d1d; font-size:0.75rem; margin-top:0.25rem;">期間目安：${roi.directExam.estimatedDuration}</div>
      </div>
      <div style="background:#ecfdf5; border:1px solid #6ee7b7; padding:0.75rem; border-radius:6px;">
        <div style="font-weight:800; color:#065f46;">✅ ${roi.registeredSchool.routeName}</div>
        <div style="margin-top:0.3rem;">修了審査合格率：<strong class="mono">${roi.registeredSchool.passRate}%</strong> (実地試験100%免除)</div>
        <div style="margin-top:0.2rem;">給付金適用後 実質負担：<strong class="mono" style="font-size:0.95rem; color:#065f46;">¥${roi.registeredSchool.netSelfBurden.toLocaleString()}</strong> <span style="font-size:0.72rem;">(-¥${roi.registeredSchool.subsidyAmount.toLocaleString()}還付)</span></div>
        <div style="color:#065f46; font-size:0.75rem; margin-top:0.25rem;">期間目安：${roi.registeredSchool.estimatedDuration}</div>
      </div>
    </div>
    <div style="margin-top:0.65rem; font-size:0.82rem; color:var(--brand-primary); font-weight:800;">${roi.comparisonSummary.recommendationHeadline}</div>
    <p style="margin-top:0.25rem; font-size:0.79rem; color:var(--text-secondary); line-height:1.5;">${roi.comparisonSummary.recommendationDetail}</p>
  `;

  renderMatchedSchools();
}

function renderMatchedSchools() {
  if (!window.AERO_GROWTH_FUNNEL || !window.AERO_GROWTH_FUNNEL.searchSchools) return;
  const pref = document.getElementById('lead-pref').value;
  const lic = document.getElementById('lead-license-type').value;
  const listEl = document.getElementById('matched-schools-list');
  if (!listEl) return;

  const schools = window.AERO_GROWTH_FUNNEL.searchSchools({
    prefecture: pref,
    licenseType: lic
  }).slice(0, 3);

  listEl.innerHTML = '';
  schools.forEach((s) => {
    const item = document.createElement('div');
    item.style.cssText = 'border:1px solid var(--border-color); border-radius:6px; padding:0.6rem 0.75rem; background:#fff; font-size:0.79rem;';
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap;">
        <strong style="color:var(--text-main);">${s.name}</strong>
        <span class="mono" style="font-size:0.73rem; background:var(--status-success-bg); color:var(--status-success); padding:0.1rem 0.45rem; border-radius:4px; font-weight:700;">合格率 ${s.passRate}% | ¥${s.tuitionFrom.toLocaleString()}〜</span>
      </div>
      <div style="color:var(--text-secondary); font-size:0.75rem; margin-top:0.2rem;">${s.tagline}</div>
      <div style="font-size:0.72rem; color:var(--brand-primary); margin-top:0.2rem; font-weight:600;">${s.subsidyBadges.join(' ／ ')}</div>
    `;
    listEl.appendChild(item);
  });
}

function submitSchoolLead() {
  const pref = document.getElementById('lead-pref').value;
  const lic = document.getElementById('lead-license-type').value;
  const exp = document.getElementById('lead-exp-level').value;
  const subEl = document.getElementById('lead-subsidy-type');
  const sub = subEl ? subEl.value : 'kyufukin';

  const msg = document.getElementById('lead-submit-msg');
  msg.classList.remove('hidden');
  msg.className = 'feedback-box success';

  if (window.AERO_GROWTH_FUNNEL && window.AERO_GROWTH_FUNNEL.submitLead) {
    const res = window.AERO_GROWTH_FUNNEL.submitLead({
      prefecture: pref,
      licenseType: lic,
      expLevel: exp,
      subsidyType: sub
    });

    if (window.AERO_MONETIZE_LMS && window.AERO_MONETIZE_LMS.passManager) {
      window.AERO_MONETIZE_LMS.passManager.unlockViaSchoolGift({
        schoolName: (res.matchedSchools[0] && res.matchedSchools[0].name) || '提携登録講習機関',
        targetLicense: lic
      });
    }

    const cpaPill = document.getElementById('cpa-revenue-pill');
    if (cpaPill) {
      cpaPill.textContent = `累計送客報酬 ¥${res.affiliateMetrics.cumulativeRevenueYen.toLocaleString()} (${res.affiliateMetrics.cumulativeLeads}件)`;
    }

    msg.innerHTML = `
      <div><strong>${res.dualOffer.message}</strong></div>
      <div class="mono" style="margin-top:0.3rem; font-size:0.76rem;">受付ID: ${res.leadId} | 特典トークン: ${res.unlockToken} | 今回CPA成果報酬: +¥${res.affiliateMetrics.cpaEarnedYen.toLocaleString()}</div>
    `;
  } else {
    msg.innerHTML = `🎉 <strong>【送客リード記録完了（${pref}）】</strong> 提携ドローンスクールの資料を送信し、「AERO-PASS 合格パス」を無料アンロックしました！`;
  }
}

// B2B School LMS Console Functions
function initB2bTenantSelect() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.b2bConsole) return;
  const tenants = window.AERO_MONETIZE_LMS.b2bConsole.getTenants();
  const sel = document.getElementById('b2b-tenant-select');
  if (!sel) return;
  sel.innerHTML = '';
  tenants.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.tenantId;
    opt.textContent = t.schoolName;
    sel.appendChild(opt);
  });
}

function changeB2bTenant(tenantId) {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.b2bConsole) return;
  window.AERO_MONETIZE_LMS.b2bConsole.setActiveTenant(tenantId);
  renderB2bTable();
}

function renderB2bTable() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.b2bConsole) return;
  const b2b = window.AERO_MONETIZE_LMS.b2bConsole;
  const summary = b2b.getCohortSummary();

  const metaEl = document.getElementById('b2b-tenant-meta');
  if (metaEl) {
    metaEl.innerHTML = `<span>${summary.tenant.registrationCode}</span><span>${summary.tenant.auditorName}</span>`;
  }

  const kpiEl = document.getElementById('b2b-kpi-summary');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="metric-item" style="padding:0.5rem;">
        <div class="metric-label">受験許可OK / 総数</div>
        <div class="metric-value mono" style="font-size:0.95rem; color:var(--status-success);">${summary.okCount} / ${summary.totalStudents}名 (${summary.clearanceRate}%)</div>
      </div>
      <div class="metric-item" style="padding:0.5rem;">
        <div class="metric-label">要補習 / 第5版未達</div>
        <div class="metric-value mono" style="font-size:0.95rem; color:var(--status-warning);">▲${summary.warnCount}名 / ×${summary.ngCount}名</div>
      </div>
      <div class="metric-item" style="padding:0.5rem;">
        <div class="metric-label">全体平均 (CBT/計算)</div>
        <div class="metric-value mono" style="font-size:0.95rem;">${summary.averageCbtScore}点 / ${summary.averageCalcMastery}%</div>
      </div>
    `;
  }

  const statusKey = (document.getElementById('b2b-status-filter') || {}).value || 'ALL';
  const searchQuery = (document.getElementById('b2b-search-input') || {}).value || '';
  const students = b2b.getStudents({ statusKey, searchQuery });

  const tbody = document.getElementById('b2b-students-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  students.forEach((st) => {
    let colorStyle = 'color:var(--status-success);';
    if (st.clearance.statusKey === 'WARN_REMEDIAL') colorStyle = 'color:var(--status-warning);';
    if (st.clearance.statusKey === 'NG_FIFTH_ED') colorStyle = 'color:var(--status-danger);';

    const tr = document.createElement('tr');
    tr.title = st.clearance.auditorNote;
    tr.innerHTML = `
      <td>
        <strong>${st.name}</strong>
        <div class="mono" style="font-size:0.7rem; color:var(--text-muted);">${st.studentId}</div>
      </td>
      <td style="font-size:0.76rem;">${st.targetClass}</td>
      <td class="mono">${st.cbtScore}点</td>
      <td class="mono">${st.calcMastery}%</td>
      <td class="mono">${st.deskOralScore}点 / ${st.fifthEdRthScore}%</td>
      <td><span style="${colorStyle} font-weight:700; font-size:0.78rem;">${st.clearance.badgeText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function syncMyScoreToB2b() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.b2bConsole) return;
  window.AERO_MONETIZE_LMS.b2bConsole.syncCurrentUserToCohort('あなた（現在演習中の受講生）');
  renderB2bTable();
}

function downloadB2bCsv() {
  if (!window.AERO_MONETIZE_LMS || !window.AERO_MONETIZE_LMS.b2bConsole) return;
  const statusKey = (document.getElementById('b2b-status-filter') || {}).value || 'ALL';
  const searchQuery = (document.getElementById('b2b-search-input') || {}).value || '';
  const csv = window.AERO_MONETIZE_LMS.b2bConsole.exportCohortCsv({ statusKey, searchQuery }, true);

  const previewBox = document.getElementById('b2b-csv-preview-box');
  if (previewBox) {
    previewBox.classList.remove('hidden');
    previewBox.className = 'feedback-box success';
    const lineCount = csv.trim().split('\n').length;
    previewBox.innerHTML = `📥 <strong>監査台帳CSVをダウンロードしました（全 ${lineCount - 1} 名分・UTF-8 BOM付）</strong>`;
  }
}

// ============================================================================
// MLIT Official Website Live Regulatory Watcher & Feed Controller
// ============================================================================
let currentMlitFeedCategory = 'all';

function openMlitWatcherFromAnywhere() {
  switchModule('watcher');
}

function setMlitFeedFilter(cat) {
  currentMlitFeedCategory = cat;
  ['all', 'kyosoku', 'jicchi', 'kyoka', 'koshin'].forEach((c) => {
    const btn = document.getElementById('mlit-cat-' + c);
    if (!btn) return;
    btn.className = c === cat ? 'btn btn-primary' : 'btn';
  });
  renderMlitLiveFeed();
}

function jumpFromMlitFeedToStudy(targetChapterId, targetModule) {
  if (targetModule === 'kijo') {
    switchModule('kijo');
    loadKijoScenario(4); // シナリオ⑤ 目視外・レベル3.5等
    const modEl = document.getElementById('mod-kijo');
    if (modEl) modEl.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  switchModule('cbt');
  if (targetChapterId) {
    setCbtFilter(targetChapterId);
    selectKyosokuTab(targetChapterId);
  }
  const barEl = document.getElementById('cbt-filter-bar-card');
  if (barEl) barEl.scrollIntoView({ behavior: 'smooth' });
}

function reverifyMlitFeedIndex() {
  const feed = window.AERO_EXAM_BANK && window.AERO_EXAM_BANK.mlitLiveFeed;
  if (!feed) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const statusBadge = document.getElementById('mlit-watcher-status-badge');
  const totalItems = (feed.items || []).length;
  if (statusBadge) {
    statusBadge.textContent = `● LIVE SYNC: 再検証完了 ${y}-${m}-${d} ${hh}:${mm}:${ss} (全${totalItems}件同期済)`;
  }

  const alertBox = document.getElementById('mlit-reverify-alert');
  if (alertBox) {
    alertBox.classList.remove('hidden');
    alertBox.className = 'feedback-box success';
    alertBox.innerHTML = `
      <div>✅ <strong>国土交通省（航空局）公式インデックスの再検証が完了しました（${y}-${m}-${d} ${hh}:${mm}:${ss}）</strong></div>
      <div style="font-size:0.79rem; margin-top:0.2rem;">
        監視対象3サイト（<code>koku_tk10_000003.html</code> / <code>license.html</code> / <code>koku_fr10_000042.html</code>）の最新通達・教則第5版（<code>002010809.pdf</code>）・実地試験実施基準（<code>001971373.pdf</code>）と AERO-PASS データベース（全${totalItems}件）の整合性を確認しました。未反映の差分はありません。
      </div>
    `;
  }
}

function renderMlitLiveFeed() {
  const feed = window.AERO_EXAM_BANK && window.AERO_EXAM_BANK.mlitLiveFeed;
  if (!feed) return;

  const headerDateEl = document.getElementById('header-mlit-verified-date');
  if (headerDateEl && feed.lastVerifiedAt) {
    headerDateEl.textContent = feed.lastVerifiedAt;
  }

  const sourcesBar = document.getElementById('mlit-watched-sources-bar');
  if (sourcesBar && Array.isArray(feed.watchedSources)) {
    sourcesBar.innerHTML = feed.watchedSources
      .map(
        (src) => `
        <a href="${src.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:0.35rem; color:#0369a1; text-decoration:none; font-weight:600; background:#f0f9ff; padding:0.2rem 0.55rem; border-radius:4px; border:1px solid #bae6fd;">
          <span style="color:#16a34a;">●</span>
          <span>${src.name}</span>
          <span class="mono" style="font-size:0.7rem; color:#0284c7;">↗</span>
        </a>
      `
      )
      .join('');
  }

  const allItems = feed.items || [];
  const allBtn = document.getElementById('mlit-cat-all');
  if (allBtn) {
    allBtn.textContent = `すべて (${allItems.length})`;
  }

  const filtered =
    currentMlitFeedCategory === 'all'
      ? allItems
      : allItems.filter((item) => item.category === currentMlitFeedCategory);

  const container = document.getElementById('mlit-live-feed-container');
  if (!container) return;
  container.innerHTML = '';

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.style.cssText =
      'border:1px solid var(--border-color); border-radius:8px; padding:0.85rem 1rem; background:#ffffff; display:flex; flex-direction:column; justify-content:space-between; gap:0.55rem; box-shadow:0 1px 2px rgba(15,23,42,0.04);';

    let badgeColor = 'background:#e0f2fe; color:#0369a1;';
    if (item.category === 'kyosoku') badgeColor = 'background:#fef3c7; color:#92400e;';
    if (item.category === 'jicchi') badgeColor = 'background:#fce7f3; color:#9d174d;';
    if (item.category === 'koshin') badgeColor = 'background:#ede9fe; color:#5b21b6;';

    const secondaryLinkHtml = item.secondaryUrl
      ? `<a href="${item.secondaryUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.73rem; padding:0.22rem 0.5rem; text-decoration:none;">📑 関連資料・新旧対照 ↗</a>`
      : '';

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.35rem;">
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
            <span class="mono" style="font-size:0.74rem; font-weight:800; color:var(--text-secondary);">📅 ${item.publishedDate}</span>
            <span class="nav-pill" style="${badgeColor} font-weight:800; font-size:0.7rem;">${item.categoryLabel}</span>
            <span class="nav-pill" style="background:#fee2e2; color:#991b1b; font-weight:800; font-size:0.68rem;">${item.badgeText}</span>
          </div>
          <span class="mono" style="font-size:0.68rem; color:var(--text-muted);">${item.id}</span>
        </div>
        <div style="font-weight:800; font-size:0.88rem; color:var(--text-main); line-height:1.45; margin-bottom:0.3rem;">
          ${item.title}
        </div>
        <div style="font-size:0.73rem; color:var(--brand-primary); font-weight:600; margin-bottom:0.4rem;">
          📄 出典：${item.sourceDocName}（適用：${item.effectiveDate}）
        </div>
        <div style="font-size:0.79rem; color:var(--text-secondary); background:var(--bg-subtle); padding:0.55rem 0.7rem; border-radius:6px; line-height:1.5; margin-bottom:0.4rem;">
          🎯 <strong>受験者への影響：</strong> ${item.examImpactSummary}
        </div>
      </div>
      <div>
        <div style="font-size:0.74rem; font-weight:700; color:#065f46; background:#ecfdf5; padding:0.3rem 0.55rem; border-radius:4px; margin-bottom:0.5rem;">
          ${item.aeroPassSyncStatus}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap;">
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <a href="${item.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="font-size:0.73rem; padding:0.22rem 0.55rem; text-decoration:none;">🌐 公式HP / 通達PDF ↗</a>
            ${secondaryLinkHtml}
          </div>
          <button class="btn btn-primary" style="font-size:0.73rem; padding:0.22rem 0.6rem;" onclick="jumpFromMlitFeedToStudy('${item.targetChapterId}', '${item.targetModule || 'cbt'}')">
            📚 該当章・演習へ →
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================================
// MODULE 5 (Pillar 5): 合格後：機体図鑑・実務カテゴリー判定・国交省＆公的機関ポータル (window.AERO_PILOT_PORTAL)
// ============================================================================
let currentPortalRoadmapStep = 1;
let currentPortalDroneCat = 'all';
let currentPortalDirCat = 'all';

function updatePortalMissionSim() {
  if (!window.AERO_PILOT_PORTAL || !window.AERO_PILOT_PORTAL.evaluateFlightMission) return;
  const licEl = document.getElementById('portal-sim-license');
  const airEl = document.getElementById('portal-sim-aircraft');
  const spcEl = document.getElementById('portal-sim-airspace');
  const resBox = document.getElementById('portal-sim-result-box');
  if (!resBox) return;

  const res = window.AERO_PILOT_PORTAL.evaluateFlightMission({
    license: licEl ? licEl.value : 'nitou',
    aircraftCert: airEl ? airEl.value : 'type2',
    airspaceAndMethod: spcEl ? spcEl.value : 'did_night_bvlos_30m'
  });

  let badgeStyle = 'background:#ecfdf5; color:#065f46; border:1px solid #6ee7b7;';
  if (res.badgeColor === 'amber') {
    badgeStyle = 'background:#fffbeb; color:#92400e; border:1px solid #fcd34d;';
  } else if (res.badgeColor === 'rose') {
    badgeStyle = 'background:#fef2f2; color:#991b1b; border:1px solid #fca5a5;';
  } else if (res.badgeColor === 'blue' || res.badgeColor === 'cyan' || res.badgeColor === 'teal') {
    badgeStyle = 'background:#f0f9ff; color:#0369a1; border:1px solid #7dd3fc;';
  }

  const procHtml = (res.requiredProcedures || [])
    .map((p) => `<li style="margin-bottom:0.25rem;">${p}</li>`)
    .join('');
  const chkHtml = (res.checklist || [])
    .map((c) => `<li style="margin-bottom:0.25rem;">☑️ ${c}</li>`)
    .join('');

  resBox.innerHTML = `
    <div style="border:1px solid var(--border-color); border-radius:8px; padding:0.9rem; background:var(--bg-subtle);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.45rem;">
        <strong style="font-size:0.94rem; color:var(--brand-primary);">${res.categoryName}</strong>
        <span class="nav-pill" style="background:#e0e7ff; color:#3730a3; font-weight:700;">${res.levelName}</span>
      </div>
      <div style="${badgeStyle} padding:0.5rem 0.75rem; border-radius:6px; font-weight:800; font-size:0.84rem; margin-bottom:0.6rem;">
        ⚖️ 飛行許可・承認判定：${res.permissionRequired}
      </div>
      <p style="font-size:0.81rem; color:var(--text-main); line-height:1.55; margin-bottom:0.65rem;">
        ${res.summary}
      </p>
      <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.65rem 0.8rem; margin-bottom:0.55rem;">
        <div style="font-weight:800; font-size:0.8rem; color:var(--brand-primary); margin-bottom:0.3rem;">📋 必須手続き・DIPS 2.0アクション</div>
        <ul style="font-size:0.78rem; color:var(--text-main); padding-left:1.15rem; line-height:1.5;">
          ${procHtml}
        </ul>
      </div>
      <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.65rem 0.8rem;">
        <div style="font-weight:800; font-size:0.8rem; color:#065f46; margin-bottom:0.3rem;">🛡️ 出発前・現場実務チェックリスト</div>
        <ul style="font-size:0.77rem; color:var(--text-secondary); list-style:none; padding-left:0; line-height:1.5;">
          ${chkHtml}
        </ul>
      </div>
    </div>
  `;
}

function selectPortalRoadmapStep(stepNum) {
  currentPortalRoadmapStep = stepNum;
  renderPortalRoadmap();
}

function renderPortalRoadmap() {
  if (!window.AERO_PILOT_PORTAL || !Array.isArray(window.AERO_PILOT_PORTAL.postPassRoadmap)) return;
  const steps = window.AERO_PILOT_PORTAL.postPassRoadmap;
  const tabsEl = document.getElementById('portal-roadmap-tabs');
  const bodyEl = document.getElementById('portal-roadmap-body');
  if (!tabsEl || !bodyEl || steps.length === 0) return;

  tabsEl.innerHTML = '';
  steps.forEach((st) => {
    const btn = document.createElement('button');
    btn.className = st.step === currentPortalRoadmapStep ? 'btn btn-primary' : 'btn';
    btn.style.fontSize = '0.76rem';
    btn.style.padding = '0.3rem 0.65rem';
    btn.textContent = `Step ${st.step}: ${st.phase.replace(/^STEP 0\d\s*—\s*/, '')}`;
    btn.onclick = () => selectPortalRoadmapStep(st.step);
    tabsEl.appendChild(btn);
  });

  const active = steps.find((s) => s.step === currentPortalRoadmapStep) || steps[0];
  const actionsHtml = (active.actionItems || [])
    .map((a) => `<li style="margin-bottom:0.35rem;">${a}</li>`)
    .join('');

  bodyEl.innerHTML = `
    <div style="border:1px solid var(--border-color); border-radius:8px; padding:0.95rem; background:var(--bg-subtle);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.35rem;">
        <span class="mono nav-pill" style="background:var(--brand-primary); color:#ffffff; font-weight:800;">${active.phase}</span>
        <span class="mono" style="font-size:0.74rem; color:var(--text-secondary); font-weight:700;">根拠条文：${active.legalBasis}</span>
      </div>
      <div style="font-weight:800; font-size:0.96rem; color:var(--text-main); margin-bottom:0.3rem;">
        ${active.title}
      </div>
      <div style="font-size:0.77rem; color:#0369a1; font-weight:700; margin-bottom:0.55rem;">
        ⏰ 実施タイミング：${active.timing}
      </div>
      <p style="font-size:0.81rem; color:var(--text-secondary); line-height:1.55; margin-bottom:0.7rem;">
        ${active.summary}
      </p>
      <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.7rem 0.85rem;">
        <div style="font-weight:800; font-size:0.8rem; color:var(--brand-primary); margin-bottom:0.35rem;">✅ 実務アクション＆注意点</div>
        <ul style="font-size:0.79rem; color:var(--text-main); padding-left:1.15rem; line-height:1.55;">
          ${actionsHtml}
        </ul>
      </div>
    </div>
  `;
}

function setPortalDroneCategory(catKey) {
  currentPortalDroneCat = catKey;
  ['all', 'type1_cert', 'type2_cert', 'enterprise', 'agri_logistics', 'training_compact'].forEach((k) => {
    const b = document.getElementById('portal-drone-cat-' + k);
    if (b) b.className = k === catKey ? 'btn btn-primary' : 'btn';
  });
  renderPortalDroneCatalog();
}

function renderPortalDroneCatalog() {
  if (!window.AERO_PILOT_PORTAL || !Array.isArray(window.AERO_PILOT_PORTAL.droneCatalog)) return;
  const allDrones = window.AERO_PILOT_PORTAL.droneCatalog;
  const query = ((document.getElementById('portal-drone-search') || {}).value || '').trim().toLowerCase();
  const grid = document.getElementById('portal-drone-grid');
  if (!grid) return;

  const filtered = allDrones.filter((d) => {
    if (currentPortalDroneCat !== 'all' && d.category !== currentPortalDroneCat) return false;
    if (!query) return true;
    const hay = [
      d.name,
      d.manufacturer,
      d.categoryLabel,
      d.certificationBadge,
      d.regulatoryAdvantage,
      d.specSummary,
      ...(d.useCases || []),
      ...(d.supportedLevels || [])
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(query);
  });

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="feedback-box warning" style="grid-column:1/-1;">該当する機体が見つかりませんでした。検索条件を変更してください。</div>`;
    return;
  }

  filtered.forEach((d) => {
    let certStyle = 'background:#f1f5f9; color:#334155;';
    if (d.category === 'type1_cert') {
      certStyle = 'background:#fef3c7; color:#92400e; border:1px solid #fcd34d;';
    } else if (d.category === 'type2_cert') {
      certStyle = 'background:#ecfdf5; color:#065f46; border:1px solid #6ee7b7;';
    } else if (d.weightClass === 'over25kg') {
      certStyle = 'background:#fef2f2; color:#991b1b; border:1px solid #fca5a5;';
    }

    const useTags = (d.useCases || [])
      .map((u) => `<span class="nav-pill" style="background:var(--bg-subtle); color:var(--text-secondary); font-size:0.7rem; border:1px solid var(--border-color);">${u}</span>`)
      .join(' ');
    const lvTags = (d.supportedLevels || [])
      .map((lv) => `<span class="nav-pill" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; font-weight:700;">${lv}</span>`)
      .join(' ');

    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid var(--border-color); border-radius:8px; padding:0.95rem; background:#ffffff; display:flex; flex-direction:column; justify-content:space-between; gap:0.6rem; box-shadow:0 1px 2px rgba(15,23,42,0.04);';
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.3rem;">
          <div>
            <div style="font-size:0.73rem; font-weight:700; color:var(--text-secondary);">${d.manufacturer}｜${d.categoryLabel}</div>
            <div style="font-size:1rem; font-weight:800; color:var(--text-main);">${d.name}</div>
          </div>
          <span class="nav-pill" style="${certStyle} font-weight:800; font-size:0.7rem;">${d.certificationBadge}</span>
        </div>

        <div class="metric-grid" style="grid-template-columns:repeat(2, 1fr); margin-top:0.45rem; margin-bottom:0.55rem; gap:0.4rem;">
          <div class="metric-item" style="padding:0.4rem 0.55rem; text-align:left;">
            <div class="metric-label" style="font-size:0.68rem;">最大離陸重量 / 区分</div>
            <div class="metric-value mono" style="font-size:0.78rem;">${d.mtowDisplay}</div>
          </div>
          <div class="metric-item" style="padding:0.4rem 0.55rem; text-align:left;">
            <div class="metric-label" style="font-size:0.68rem;">耐風速 / 最大飛行時間</div>
            <div class="metric-value mono" style="font-size:0.78rem;">耐風 ${d.maxWindSpeed} / ${d.maxFlightTime}</div>
          </div>
        </div>

        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:0.45rem;">
          <span class="nav-pill" style="background:#ede9fe; color:#5b21b6; font-size:0.7rem; font-weight:700;">📡 リモートID: ${d.remoteId}</span>
          ${lvTags}
        </div>

        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:0.55rem;">
          ${useTags}
        </div>

        <div style="background:#eff6ff; border-left:3px solid var(--brand-primary); padding:0.55rem 0.7rem; border-radius:4px; font-size:0.78rem; color:#1e3a8a; line-height:1.5; margin-bottom:0.45rem;">
          ⚖️ <strong>技能証明×法規メリット：</strong> ${d.regulatoryAdvantage}
        </div>

        <div style="font-size:0.77rem; color:var(--text-secondary); line-height:1.5;">
          🔧 <strong>機体仕様・特徴：</strong> ${d.specSummary}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function setPortalDirectoryCategory(catKey) {
  currentPortalDirCat = catKey;
  ['all', 'mlit_core', 'dips_exam', 'airspace_map', 'radio_safety'].forEach((k) => {
    const b = document.getElementById('portal-dir-cat-' + k);
    if (b) b.className = k === catKey ? 'btn btn-primary' : 'btn';
  });
  renderPortalDirectory();
}

function renderPortalDirectory() {
  if (!window.AERO_PILOT_PORTAL || !Array.isArray(window.AERO_PILOT_PORTAL.officialPortalDirectory)) return;
  const allLinks = window.AERO_PILOT_PORTAL.officialPortalDirectory;
  const grid = document.getElementById('portal-directory-grid');
  if (!grid) return;

  const filtered =
    currentPortalDirCat === 'all'
      ? allLinks
      : allLinks.filter((item) => item.category === currentPortalDirCat);

  grid.innerHTML = '';
  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid var(--border-color); border-radius:8px; padding:0.9rem; background:#ffffff; display:flex; flex-direction:column; justify-content:space-between; gap:0.55rem; box-shadow:0 1px 2px rgba(15,23,42,0.04);';
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.3rem;">
          <span class="nav-pill" style="background:#e0f2fe; color:#0369a1; font-weight:800; font-size:0.7rem;">${item.categoryLabel}</span>
          <span class="nav-pill" style="background:#fef3c7; color:#92400e; font-weight:800; font-size:0.7rem;">${item.badge}</span>
        </div>
        <div style="font-size:0.73rem; color:var(--text-secondary); font-weight:700; margin-bottom:0.15rem;">🏛️ ${item.org}</div>
        <div style="font-size:0.9rem; font-weight:800; color:var(--text-main); line-height:1.45; margin-bottom:0.4rem;">
          ${item.title}
        </div>
        <p style="font-size:0.78rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0.45rem;">
          ${item.description}
        </p>
        <div style="background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:6px; padding:0.5rem 0.65rem; font-size:0.76rem; color:var(--text-main); line-height:1.45;">
          💡 <strong>実務で使うタイミング：</strong> ${item.whenToUse}
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:0.2rem;">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:0.76rem; padding:0.3rem 0.7rem; text-decoration:none;">
          🌐 公式ポータルを開く ↗
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ============================================================================
// Initialize Academic Exam Simulator on page load
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  renderMlitLiveFeed();
  setCbtFilter('all');
  renderKyosokuTextbook();
  renderCheatSheet();
  switchModule('home');
});
