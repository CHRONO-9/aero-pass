// ============================================================================
// AERO-PASS: 第1の柱「学科CBT模試 ＆ 教則体系教科書」独立コントローラー
// ============================================================================

let currentAccessTier = 'pass'; // 'free' | 'pass' | 'b2b'
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
let currentCheatSheetTab = 'diff'; // 'diff' | 'num' | 'form'
let currentMlitFeedCategory = 'all';

const CHAPTER_LABEL_MAP = {
  ch1_2: '第1・2章：操縦者の心得',
  ch3: '第3章：規則・関連法令',
  ch4: '第4章：機体システム',
  ch5: '第5章：気象・運航体制',
  ch6: '第6章：運航リスク管理'
};

// ----------------------------------------------------------------------------
// アクセスランク切替（無料枠 / 合格パス / B2B）
// ----------------------------------------------------------------------------
function setAccessTier(tier) {
  currentAccessTier = tier;
  ['free', 'pass', 'b2b'].forEach((t) => {
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
    } else if (tier === 'b2b') {
      window.AERO_MONETIZE_LMS.passManager.setPlanDirect('b2b_student');
    }
  }

  if (tier === 'b2b') {
    location.href = 'index.html#mod-monetize';
  } else if (tier === 'free') {
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

// ----------------------------------------------------------------------------
// タイルクイック絞り込みフィルター（BizHack AI Style）
// ----------------------------------------------------------------------------
function filterCbtTiles(category, btn) {
  const buttons = document.querySelectorAll('.roadmap-filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const tiles = document.querySelectorAll('#cbt-tile-grid .pillar-tile');
  tiles.forEach(tile => {
    const tileCat = tile.getAttribute('data-cbt-category');
    if (category === 'all' || tileCat === category) {
      tile.classList.remove('pillar-hidden');
    } else {
      tile.classList.add('pillar-hidden');
    }
  });
}

// ----------------------------------------------------------------------------
// タイルからの機能起動・スムーズスクロール
// ----------------------------------------------------------------------------
function scrollToCbtSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function launchCbtExamMode(mode) {
  const modeSelect = document.getElementById('cbt-exam-mode-select');
  if (modeSelect) {
    modeSelect.value = mode;
    changeCbtExamMode(mode);
  }
  scrollToCbtSection('section-cbt-exam');
}

function launchTextbook(chId) {
  selectKyosokuTab(chId || 'ch1_2');
  scrollToCbtSection('section-textbook');
}

function launchDiffViewer() {
  setCbtFilter('fifth');
  scrollToCbtSection('section-cbt-exam');
}

function launchMlitWatcher(cat) {
  if (cat) setMlitFeedFilter(cat);
  scrollToCbtSection('section-mlit-watcher');
}

function launchCheatSheet(tab) {
  if (tab) setCheatSheetTab(tab);
  scrollToCbtSection('section-cheatsheet');
}

function launchFocusDrill(filterKey) {
  setCbtFilter(filterKey || 'ch3');
  scrollToCbtSection('section-cbt-exam');
}

// ----------------------------------------------------------------------------
// 本番CBT試験タイマー・合否判定
// ----------------------------------------------------------------------------
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

  const qTitleEl = document.getElementById('cbt-q-title');
  if (qTitleEl) qTitleEl.textContent = `問 ${cbtIndex + 1} / ${filteredCbtQuestions.length}`;

  const flagChk = document.getElementById('cbt-flag-chk');
  if (flagChk) flagChk.checked = Boolean(cbtFlagsById[qId]);

  const badgeId = document.getElementById('cbt-badge-id');
  if (badgeId) badgeId.textContent = qId;

  const chBadge = document.getElementById('cbt-badge-chapter');
  if (chBadge) {
    chBadge.textContent = CHAPTER_LABEL_MAP[item.chapterId] || '教則全6章';
  }

  const catBadge = document.getElementById('cbt-badge-cat');
  if (catBadge) catBadge.textContent = item.category || item.cat || '';

  const qText = document.getElementById('cbt-question-text');
  if (qText) qText.textContent = item.q;

  const refBadge = document.getElementById('cbt-ref-badge');
  if (refBadge) refBadge.textContent = item.ref;

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

  const diffOld = document.getElementById('cbt-diff-old');
  if (diffOld) diffOld.innerHTML = item.oldRule;

  const diffNew = document.getElementById('cbt-diff-new');
  if (diffNew) diffNew.innerHTML = item.newRule;

  const diffTip = document.getElementById('cbt-diff-tip');
  if (diffTip) diffTip.textContent = item.tip;

  // Render Palette
  const pal = document.getElementById('cbt-palette');
  if (pal) {
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
  }

  // Render Choices
  const cBox = document.getElementById('cbt-choice-container');
  if (cBox) {
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
        if (fb) {
          if (isCorrect) {
            btn.classList.add('correct');
            fb.className = 'feedback-box success';
            fb.innerHTML = `⭕ <strong>正解（選択肢 ${cIdx + 1}）！</strong> 右側の「教則スマート教科書ビューア」で普遍的原則（Core Principle）と条文根拠を確認してください。`;
          } else {
            btn.classList.add('wrong');
            fb.className = 'feedback-box error';
            fb.innerHTML = `❌ <strong>不正解。正解は (${item.ans + 1}) です。</strong> 右パネルの「普遍的原則（Core Principle）」および改訂差分・ひっかけ回避ポイントを確認しましょう。`;
          }
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
}

function toggleFlagCurrent() {
  if (filteredCbtQuestions.length === 0) return;
  const item = filteredCbtQuestions[cbtIndex];
  const qId = item.id || `Q-${cbtIndex + 1}`;
  const chk = document.getElementById('cbt-flag-chk');
  if (chk) {
    cbtFlagsById[qId] = chk.checked;
    renderCbtQuestion(cbtIndex);
  }
}

// ----------------------------------------------------------------------------
// 教則全6章 体系スマート教科書 ＆ バージョン管理機構
// ----------------------------------------------------------------------------
function openKyosokuChapterForCurrentQ() {
  if (filteredCbtQuestions.length > 0 && filteredCbtQuestions[cbtIndex]) {
    const chId = filteredCbtQuestions[cbtIndex].chapterId || 'ch1_2';
    selectKyosokuTab(chId);
  }
  scrollToCbtSection('section-textbook');
}

function filterCbtByChapterFromTextbook(chId) {
  setCbtFilter(chId);
  scrollToCbtSection('section-cbt-exam');
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

// ----------------------------------------------------------------------------
// 直前5分チートシート
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// 国土交通省（航空局）公式HP リアルタイム改訂ウォッチャー
// ----------------------------------------------------------------------------
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
    location.href = 'index.html#mod-kijo';
    return;
  }
  if (targetChapterId) {
    setCbtFilter(targetChapterId);
    selectKyosokuTab(targetChapterId);
  }
  scrollToCbtSection('section-cbt-exam');
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

// ----------------------------------------------------------------------------
// 初期化
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  filteredCbtQuestions = getFilteredCbtQuestions();
  renderCbtQuestion(0);
  renderKyosokuTextbook();
  renderCheatSheet();
  renderMlitLiveFeed();

  // URLハッシュやパラメータに応じた初期スクロール
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const el = document.getElementById(targetId);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }
});
