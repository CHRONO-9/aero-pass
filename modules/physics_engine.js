// ============================================================================
// AERO-PASS Physics & Flight Performance Calculation Engine (教則第5版・一等完全対応)
// File: /home/antigravity/aero-pass/modules/physics_engine.js
// Exports: window.AERO_PHYSICS_ENGINE
// ============================================================================

(function (global) {
  'use strict';

  const G_ACCEL = 9.8; // 重力加速度 g (m/s²)
  const LIGHT_SPEED = 3.0e8; // 光速 c (m/s)
  const RHO_STD = 1.225; // 標準大気密度 ρ₀ (kg/m³)

  /**
   * 配列をランダムにシャッフルして返す（非破壊）
   */
  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * 配列からランダムに1要素を選択
   */
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ==========================================================================
  // 1. 全9公式の定義・スライダー設定・リアルタイム計算・SVG描画関数
  // ==========================================================================
  const formulas = {
    // ------------------------------------------------------------------------
    // ① 定常水平旋回の旋回半径 r = v² / (g · tanθ) とバンク角の関係
    // ------------------------------------------------------------------------
    turn: {
      key: 'turn',
      id: 1,
      shortLabel: '① 定常旋回半径',
      title: '① 定常水平旋回の旋回半径 r = v² / (g · tanθ)',
      equation: 'r = v² / (g · tanθ)',
      description: '定常水平旋回では、旋回半径 r は飛行速度 v の「2乗」に比例し、バンク角 θ の正接（tanθ）に反比例します。速度が2倍になると旋回半径は4倍に膨らみます。',
      slider1: {
        label: '飛行速度 v (m/s)',
        min: 5,
        max: 25,
        step: 1,
        defaultValue: 10,
        unit: 'm/s',
        formatVal: (v) => `${v} m/s`
      },
      slider2: {
        label: 'バンク角 θ (度)',
        min: 15,
        max: 60,
        step: 15,
        defaultValue: 45,
        unit: '°',
        formatVal: (v) => `${v}°`
      },
      compute(s1, s2) {
        const v = Number(s1) || 10;
        const deg = Number(s2) || 45;
        const rad = (deg * Math.PI) / 180;
        const tanTheta = Math.tan(rad);
        const r = (v * v) / (G_ACCEL * tanTheta);
        const loadFactor = 1 / Math.cos(rad);
        const centripetalAccel = G_ACCEL * tanTheta;

        return {
          s1Display: `${v} m/s`,
          s2Display: `${deg}°`,
          m1Label: '旋回半径 r = v²/(g·tanθ)',
          m1Val: `${r.toFixed(1)} m`,
          m2Label: '向心加速度 a = g·tanθ',
          m2Val: `${centripetalAccel.toFixed(2)} m/s²`,
          m3Label: '速度・バンク角との比例関係',
          m3Val: `速度2倍で半径4倍 (n=${loadFactor.toFixed(2)}G)`,
          raw: { v, deg, tanTheta, r, loadFactor, centripetalAccel },
          stepByStep: `r = v² / (g × tan${deg}°) = ${v}² / (9.8 × ${tanTheta.toFixed(2)}) = ${v * v} / ${(9.8 * tanTheta).toFixed(2)} ≈ ${r.toFixed(1)} m`
        };
      },
      renderSvg(s1, s2) {
        const v = Number(s1) || 10;
        const deg = Number(s2) || 45;
        const rad = (deg * Math.PI) / 180;
        const r = (v * v) / (G_ACCEL * Math.tan(rad));
        const circleR = Math.min(68, Math.max(16, r * 1.25));
        const horizForcePx = Math.min(82, 50 * Math.tan(rad));

        return `
          <!-- Left: Rear-View Force Vector Diagram -->
          <g transform="translate(135, 102)">
            <line x1="-95" y1="0" x2="95" y2="0" stroke="#94a3b8" stroke-dasharray="4 3" />
            <line x1="0" y1="-82" x2="0" y2="65" stroke="#94a3b8" stroke-dasharray="4 3" />
            <!-- Gravity mg -->
            <line x1="0" y1="0" x2="0" y2="50" stroke="#dc2626" stroke-width="3" />
            <polygon points="-4,46 4,46 0,55" fill="#dc2626" />
            <text x="8" y="52" font-size="11" font-weight="700" fill="#991b1b">重力 mg</text>
            <!-- Vertical Lift Component L cosθ -->
            <line x1="0" y1="0" x2="0" y2="-50" stroke="#059669" stroke-width="2" stroke-dasharray="3 2" />
            <!-- Centripetal Force L sinθ = mg tanθ -->
            <line x1="0" y1="0" x2="${horizForcePx.toFixed(1)}" y2="0" stroke="#d97706" stroke-width="3" />
            <polygon points="${(horizForcePx - 4).toFixed(1)},-4 ${(horizForcePx - 4).toFixed(1)},4 ${(horizForcePx + 4).toFixed(1)},0" fill="#d97706" />
            <text x="12" y="-8" font-size="11" font-weight="700" fill="#92400e">向心力 L·sinθ</text>
            <!-- Banked Airframe -->
            <g transform="rotate(${deg})">
              <line x1="-44" y1="0" x2="44" y2="0" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
              <circle cx="-44" cy="-5" r="5.5" fill="#0284c7" />
              <circle cx="44" cy="-5" r="5.5" fill="#0284c7" />
              <line x1="0" y1="0" x2="0" y2="-62" stroke="#059669" stroke-width="3" />
              <polygon points="-4,-58 4,-58 0,-67" fill="#059669" />
              <text x="-22" y="-70" font-size="11" font-weight="700" fill="#065f46">総揚力 L</text>
            </g>
            <text x="-85" y="72" font-size="11" font-weight="600" fill="#475569">バンク角 θ = ${deg}° (tanθ = ${Math.tan(rad).toFixed(2)})</text>
          </g>
          <!-- Right: Top-Down Turning Circle -->
          <g transform="translate(400, 90)">
            <circle cx="0" cy="0" r="${circleR.toFixed(1)}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="5 3" />
            <circle cx="0" cy="0" r="3" fill="#0369a1" />
            <line x1="0" y1="0" x2="${circleR.toFixed(1)}" y2="0" stroke="#0284c7" stroke-width="2" />
            <!-- Tangential velocity vector -->
            <line x1="${circleR.toFixed(1)}" y1="0" x2="${circleR.toFixed(1)}" y2="${(-Math.min(48, v * 2.2)).toFixed(1)}" stroke="#059669" stroke-width="2.5" />
            <circle cx="${circleR.toFixed(1)}" cy="0" r="6" fill="#059669" />
            <text x="${(circleR + 8).toFixed(1)}" y="-12" font-size="11" font-weight="700" fill="#065f46">v=${v}m/s</text>
            <text x="-62" y="${Math.min(82, circleR + 20).toFixed(1)}" font-size="12" font-weight="700" fill="#0369a1">旋回半径 r = ${r.toFixed(1)} m</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ② バンク角 θ に対する荷重倍数 n = 1 / cosθ と旋回失速速度 Vs_turn = Vs · √n
    // ------------------------------------------------------------------------
    load_stall: {
      key: 'load_stall',
      id: 2,
      shortLabel: '② 荷重倍数・旋回失速',
      title: '② 荷重倍数 n = 1 / cosθ と旋回失速速度 Vs_turn = Vs · √n',
      equation: 'n = 1 / cosθ ,  Vs_turn = Vs × √n',
      description: '高度を維持して旋回すると、機体には重力以上の見かけの重さ（荷重倍数 n = 1/cosθ）がかかります。その結果、旋回中の失速速度は水平直線飛行時の √n 倍に上昇します（バンク60°で n=2G、失速速度は約1.41倍）。',
      slider1: {
        label: '水平失速速度 Vs (m/s)',
        min: 6,
        max: 20,
        step: 1,
        defaultValue: 10,
        unit: 'm/s',
        formatVal: (v) => `${v} m/s`
      },
      slider2: {
        label: 'バンク角 θ (度)',
        min: 0,
        max: 75,
        step: 15,
        defaultValue: 60,
        unit: '°',
        formatVal: (v) => `${v}°`
      },
      compute(s1, s2) {
        const vs = Number(s1) || 10;
        const deg = Number(s2) !== undefined ? Number(s2) : 60;
        const rad = (deg * Math.PI) / 180;
        const cosTheta = Math.cos(rad);
        const n = 1 / cosTheta;
        const sqrtN = Math.sqrt(n);
        const vsTurn = vs * sqrtN;

        return {
          s1Display: `${vs} m/s`,
          s2Display: `${deg}°`,
          m1Label: '荷重倍数 n = 1 / cosθ',
          m1Val: `${n.toFixed(2)} G (倍)`,
          m2Label: '旋回失速速度 Vs_turn = Vs·√n',
          m2Val: `${vsTurn.toFixed(2)} m/s`,
          m3Label: '失速速度の上昇倍率 (√n)',
          m3Val: `${sqrtN.toFixed(2)} 倍 (+${((sqrtN - 1) * 100).toFixed(0)}%)`,
          raw: { vs, deg, cosTheta, n, sqrtN, vsTurn },
          stepByStep: `n = 1 / cos${deg}° = 1 / ${cosTheta.toFixed(2)} ≈ ${n.toFixed(2)} G → 旋回失速速度 Vs_turn = ${vs} × √${n.toFixed(2)} = ${vs} × ${sqrtN.toFixed(2)} ≈ ${vsTurn.toFixed(2)} m/s`
        };
      },
      renderSvg(s1, s2) {
        const vs = Number(s1) || 10;
        const deg = Number(s2) !== undefined ? Number(s2) : 60;
        const rad = (deg * Math.PI) / 180;
        const n = 1 / Math.cos(rad);
        const sqrtN = Math.sqrt(n);
        const vsTurn = vs * sqrtN;

        const baseBarW = Math.min(110, vs * 5.2);
        const turnBarW = Math.min(210, vsTurn * 5.2);
        const liftLen = Math.min(72, 34 * n);

        return `
          <!-- Left: Bank Angle & Load Factor Vector -->
          <g transform="translate(125, 105)">
            <line x1="-85" y1="0" x2="85" y2="0" stroke="#94a3b8" stroke-dasharray="4 3" />
            <!-- Weight W -->
            <line x1="0" y1="0" x2="0" y2="38" stroke="#dc2626" stroke-width="3" />
            <text x="-28" y="54" font-size="11" font-weight="700" fill="#991b1b">自重 W (1.0G)</text>
            <!-- Banked Wing & Required Lift L = n*W -->
            <g transform="rotate(${deg})">
              <line x1="-42" y1="0" x2="42" y2="0" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
              <line x1="0" y1="0" x2="0" y2="${(-liftLen).toFixed(1)}" stroke="#0284c7" stroke-width="3.5" />
              <circle cx="0" cy="${(-liftLen).toFixed(1)}" r="4" fill="#0284c7" />
            </g>
            <text x="-85" y="-68" font-size="12" font-weight="700" fill="#0369a1">必要揚力 L = ${n.toFixed(2)} W (${n.toFixed(2)}G)</text>
          </g>

          <!-- Right: Stall Speed Comparison Bars -->
          <g transform="translate(255, 38)">
            <text x="0" y="0" font-size="12" font-weight="700" fill="#0f172a">失速速度の比較（√n 倍に上昇）</text>

            <!-- Level Flight Stall Speed -->
            <text x="0" y="26" font-size="11" fill="#475569">水平飛行時 Vs (バンク0°)</text>
            <rect x="0" y="32" width="${baseBarW.toFixed(1)}" height="22" rx="4" fill="#94a3b8" />
            <text x="${(baseBarW + 8).toFixed(1)}" y="48" font-size="12" font-weight="700" fill="#334155">${vs.toFixed(1)} m/s</text>

            <!-- Turning Stall Speed -->
            <text x="0" y="76" font-size="11" font-weight="700" fill="#991b1b">旋回時 Vs_turn (バンク${deg}° → √${n.toFixed(2)}倍)</text>
            <rect x="0" y="82" width="${turnBarW.toFixed(1)}" height="24" rx="4" fill="#ef4444" />
            <text x="${(turnBarW + 8).toFixed(1)}" y="99" font-size="12" font-weight="800" fill="#991b1b">${vsTurn.toFixed(2)} m/s</text>

            <rect x="0" y="116" width="265" height="24" rx="4" fill="#fffbeb" stroke="#f59e0b" />
            <text x="8" y="132" font-size="11" font-weight="700" fill="#92400e">⚠️ 60°旋回時は荷重2倍(2G)・失速速度√2(1.41)倍</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ③ 電波の波長 λ = c / f と第1フレネルゾーン最大半径 r₁ = 1/2 √(c·d / f)
    // ------------------------------------------------------------------------
    fresnel: {
      key: 'fresnel',
      id: 3,
      shortLabel: '③ フレネルゾーン',
      title: '③ 電波の波長 λ = c / f と第1フレネルゾーン最大半径 r₁',
      equation: 'λ = c / f ,  r₁ = 1/2 · √(λ · d) = 1/2 · √(c · d / f)',
      description: '電波は直線だけでなくラグビーボール状の領域（フレネルゾーン）に広がって伝播します。良好な通信のため、第1フレネルゾーン最大半径 r₁ の「60%以上」に障害物が入らないよう見通しを確保します。',
      slider1: {
        label: '送受信間距離 d (m)',
        min: 100,
        max: 1200,
        step: 100,
        defaultValue: 400,
        unit: 'm',
        formatVal: (v) => `${v} m`
      },
      slider2: {
        label: '周波数帯 (1=2.4GHz, 2=5.7GHz)',
        min: 1,
        max: 2,
        step: 1,
        defaultValue: 1,
        unit: 'GHz',
        formatVal: (v) => (Number(v) === 1 ? '2.4 GHz' : Number(v) === 2 ? '5.7 GHz' : `${v} GHz`)
      },
      compute(s1, s2) {
        const d = Number(s1) || 400;
        const rawS2 = Number(s2) || 1;
        const freqGHz = rawS2 === 1 ? 2.4 : rawS2 === 2 ? 5.7 : rawS2;
        const f = freqGHz * 1e9;
        const lambda = LIGHT_SPEED / f;
        const r1 = 0.5 * Math.sqrt(lambda * d);
        const r60 = r1 * 0.6;

        return {
          s1Display: `${d} m`,
          s2Display: `${freqGHz} GHz`,
          m1Label: '第1フレネル半径 r₁ = ½√(λ·d)',
          m1Val: `${r1.toFixed(2)} m`,
          m2Label: '確保すべき60%クリアランス',
          m2Val: `${r60.toFixed(2)} m`,
          m3Label: '波長 λ (= c / f)',
          m3Val: `${(lambda * 100).toFixed(2)} cm (${lambda.toFixed(3)} m)`,
          raw: { d, freqGHz, f, lambda, r1, r60 },
          stepByStep: `λ = 3.0×10⁸ / (${freqGHz}×10⁹) ≈ ${lambda.toFixed(3)} m → r₁ = 0.5 × √(${lambda.toFixed(3)} × ${d}) ≈ ${r1.toFixed(2)} m（60%クリアランス = ${r60.toFixed(2)} m）`
        };
      },
      renderSvg(s1, s2) {
        const d = Number(s1) || 400;
        const rawS2 = Number(s2) || 1;
        const freqGHz = rawS2 === 1 ? 2.4 : rawS2 === 2 ? 5.7 : rawS2;
        const f = freqGHz * 1e9;
        const r1 = 0.5 * Math.sqrt((LIGHT_SPEED * d) / f);
        const r60 = r1 * 0.6;
        const ry = Math.min(62, Math.max(18, r1 * 8.2));

        return `
          <g transform="translate(270, 92)">
            <!-- 1st Fresnel Zone Ellipse -->
            <ellipse cx="0" cy="0" rx="205" ry="${ry.toFixed(1)}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
            <!-- 60% Clearance Zone Ellipse -->
            <ellipse cx="0" cy="0" rx="205" ry="${(ry * 0.6).toFixed(1)}" fill="#dcfce7" fill-opacity="0.55" stroke="#059669" stroke-width="2" stroke-dasharray="5 3" />
            <!-- Direct Line of Sight -->
            <line x1="-205" y1="0" x2="205" y2="0" stroke="#475569" stroke-width="1.5" />
            <!-- Transmitter & UAV -->
            <circle cx="-205" cy="0" r="8" fill="#d97706" />
            <text x="-245" y="28" font-size="11" font-weight="700" fill="#92400e">送信機 (プロポ)</text>
            <circle cx="205" cy="0" r="8" fill="#059669" />
            <text x="172" y="28" font-size="11" font-weight="700" fill="#065f46">無人航空機</text>
            <!-- Radius r1 indicator at d/2 -->
            <line x1="0" y1="0" x2="0" y2="${(-ry).toFixed(1)}" stroke="#0284c7" stroke-width="2.5" />
            <text x="8" y="${(-ry - 4).toFixed(1)}" font-size="12" font-weight="700" fill="#0369a1">最大半径 r₁ = ${r1.toFixed(2)} m</text>
            <text x="8" y="${(ry * 0.6 + 14).toFixed(1)}" font-size="11" font-weight="700" fill="#065f46">60%クリアランス = ${r60.toFixed(2)} m (距離 d=${d}m)</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ④ 揚抗比 L/D と無風時の滑空水平到達距離 D = H × (L/D)
    // ------------------------------------------------------------------------
    glide: {
      key: 'glide',
      id: 4,
      shortLabel: '④ 揚抗比・滑空距離',
      title: '④ 揚抗比 L/D と無風時の滑空水平到達距離 D = H × (L/D)',
      equation: 'D = H × (L / D_drag)',
      description: '推力を失った固定翼機が無風状態で滑空するとき、「揚抗比（揚力L ÷ 抗力D）」が大きいほど滑空角が浅くなり、高度 H の（揚抗比）倍だけ遠くへ水平到達できます。',
      slider1: {
        label: '飛行高度 H (m)',
        min: 20,
        max: 150,
        step: 10,
        defaultValue: 60,
        unit: 'm',
        formatVal: (v) => `高度 ${v} m`
      },
      slider2: {
        label: '揚抗比 L/D',
        min: 3,
        max: 12,
        step: 1,
        defaultValue: 5,
        unit: '',
        formatVal: (v) => `揚抗比 ${v}`
      },
      compute(s1, s2) {
        const H = Number(s1) || 60;
        const ld = Number(s2) || 5;
        const dist = H * ld;
        const tanGamma = 1 / ld;
        const gammaDeg = (Math.atan(tanGamma) * 180) / Math.PI;

        return {
          s1Display: `高度 ${H} m`,
          s2Display: `揚抗比 ${ld}`,
          m1Label: '無風時の水平到達距離 D',
          m1Val: `${dist} m`,
          m2Label: '公式 D = H × (L/D)',
          m2Val: `${H} m × ${ld} = ${dist} m`,
          m3Label: '滑空角 γ (tanγ = D/L)',
          m3Val: `${gammaDeg.toFixed(1)}° (tanγ=${tanGamma.toFixed(2)})`,
          raw: { H, ld, dist, tanGamma, gammaDeg },
          stepByStep: `水平到達距離 D = 高度 H × 揚抗比(L/D) = ${H} × ${ld} = ${dist} m`
        };
      },
      renderSvg(s1, s2) {
        const H = Number(s1) || 60;
        const ld = Number(s2) || 5;
        const dist = H * ld;
        const endX = Math.min(410, Math.max(160, 80 + ld * 26));
        const topY = Math.max(18, 125 - H * 0.65);

        return `
          <g transform="translate(55, 25)">
            <!-- Ground Line -->
            <line x1="0" y1="125" x2="435" y2="125" stroke="#475569" stroke-width="2" />
            <!-- Altitude Pillar H -->
            <line x1="25" y1="${topY.toFixed(1)}" x2="25" y2="125" stroke="#0284c7" stroke-width="3" />
            <text x="33" y="${((topY + 125) / 2).toFixed(1)}" font-size="12" font-weight="700" fill="#0369a1">高度 H = ${H} m</text>
            <!-- Glide Slope Trajectory -->
            <line x1="25" y1="${topY.toFixed(1)}" x2="${endX.toFixed(1)}" y2="125" stroke="#059669" stroke-width="3" stroke-dasharray="6 3" />
            <circle cx="25" cy="${topY.toFixed(1)}" r="7" fill="#0284c7" />
            <circle cx="${endX.toFixed(1)}" cy="125" r="7" fill="#059669" />
            <!-- Distance Label -->
            <text x="115" y="148" font-size="12" font-weight="700" fill="#065f46">水平到達距離 D = ${H} × ${ld} = ${dist} m</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ⑤ 風ベクトル補正（追い風・向かい風時の対地速度 Vg = Va ± Vw と2地点間の往復所要時間）
    // ------------------------------------------------------------------------
    wind_time: {
      key: 'wind_time',
      id: 5,
      shortLabel: '⑤ 風補正・往復時間',
      title: '⑤ 対地速度 Vg = Va ± Vw と2地点間の往復飛行時間',
      equation: 'Vg_向かい風 = Va - Vw ,  Vg_追い風 = Va + Vw ,  T_往復 = d/(Va-Vw) + d/(Va+Vw)',
      description: '向かい風では対地速度が (Va - Vw) に減少し、追い風では (Va + Vw) に増加します。遅い向かい風区間を飛ぶ時間の方が長くなるため、風があるときの往復時間は「無風時より必ず長く」なります。',
      slider1: {
        label: '対気速度 Va (m/s)',
        min: 8,
        max: 20,
        step: 1,
        defaultValue: 10,
        unit: 'm/s',
        formatVal: (v) => `${v} m/s`
      },
      slider2: {
        label: '風速 Vw (m/s) [片道600m]',
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 2,
        unit: 'm/s',
        formatVal: (v) => `風速 ${v} m/s`
      },
      compute(s1, s2) {
        const va = Number(s1) || 10;
        const vw = Math.min(va - 1, Number(s2) !== undefined ? Number(s2) : 2);
        const distOneWay = 600; // 基準片道距離 600m
        const vgHead = va - vw;
        const vgTail = va + vw;
        const tOut = distOneWay / vgHead;
        const tIn = distOneWay / vgTail;
        const tTotal = tOut + tIn;
        const tNoWind = (distOneWay * 2) / va;

        return {
          s1Display: `${va} m/s`,
          s2Display: `風速 ${vw} m/s`,
          m1Label: '対地速度 (往路:向かい風 / 復路:追い風)',
          m1Val: `${vgHead} m/s / ${vgTail} m/s`,
          m2Label: '片道600mの往復所要時間',
          m2Val: `${tTotal.toFixed(1)} 秒 (往${tOut.toFixed(0)}s+復${tIn.toFixed(0)}s)`,
          m3Label: `無風時(${tNoWind.toFixed(0)}秒)との比較`,
          m3Val: vw === 0 ? '差なし (0.0秒)' : `+${(tTotal - tNoWind).toFixed(1)} 秒 増加 (必ず遅くなる)`,
          raw: { va, vw, distOneWay, vgHead, vgTail, tOut, tIn, tTotal, tNoWind },
          stepByStep: `往路(向かい風): 600 ÷ (${va}-${vw}) = ${tOut.toFixed(1)}秒、復路(追い風): 600 ÷ (${va}+${vw}) = ${tIn.toFixed(1)}秒 → 合計 ${tTotal.toFixed(1)}秒（無風時 ${tNoWind.toFixed(1)}秒より長い）`
        };
      },
      renderSvg(s1, s2) {
        const va = Number(s1) || 10;
        const vw = Math.min(va - 1, Number(s2) !== undefined ? Number(s2) : 2);
        const vgHead = va - vw;
        const vgTail = va + vw;
        const tOut = 600 / vgHead;
        const tIn = 600 / vgTail;
        const tTotal = tOut + tIn;
        const tNoWind = 1200 / va;

        const outBarW = Math.min(240, tOut * 1.45);
        const inBarW = Math.min(240, tIn * 1.45);

        return `
          <g transform="translate(24, 24)">
            <text x="0" y="0" font-size="12" font-weight="700" fill="#0f172a">片道 d = 600 m 往復時の対地速度と所要時間</text>

            <!-- Outbound: Headwind -->
            <rect x="0" y="14" width="235" height="54" rx="6" fill="#fef2f2" stroke="#fca5a5" />
            <text x="10" y="33" font-size="11" font-weight="700" fill="#991b1b">① 往路（向かい風）Vg = ${va} - ${vw} = ${vgHead} m/s</text>
            <rect x="10" y="42" width="${outBarW.toFixed(1)}" height="16" rx="3" fill="#dc2626" />
            <text x="10" y="84" font-size="11" font-weight="700" fill="#991b1b">往路時間 t₁ = 600 ÷ ${vgHead} = ${tOut.toFixed(1)} 秒</text>

            <!-- Inbound: Tailwind -->
            <rect x="255" y="14" width="235" height="54" rx="6" fill="#ecfdf5" stroke="#6ee7b7" />
            <text x="265" y="33" font-size="11" font-weight="700" fill="#065f46">② 復路（追い風）Vg = ${va} + ${vw} = ${vgTail} m/s</text>
            <rect x="265" y="42" width="${inBarW.toFixed(1)}" height="16" rx="3" fill="#059669" />
            <text x="265" y="84" font-size="11" font-weight="700" fill="#065f46">復路時間 t₂ = 600 ÷ ${vgTail} = ${tIn.toFixed(1)} 秒</text>

            <!-- Total Comparison -->
            <rect x="0" y="102" width="490" height="44" rx="6" fill="#e0f2fe" stroke="#0284c7" />
            <text x="14" y="121" font-size="12" font-weight="800" fill="#0369a1">往復合計 T = ${tOut.toFixed(1)} + ${tIn.toFixed(1)} = ${tTotal.toFixed(1)} 秒 （無風時 ${tNoWind.toFixed(1)} 秒より +${(tTotal - tNoWind).toFixed(1)} 秒長い）</text>
            <text x="14" y="138" font-size="11" fill="#334155">💡 試験頻出：風がある中で往復すると、追い風で短縮する時間より向かい風で遅れる時間の方が必ず大きくなる！</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ⑥ 飛行速度 v と抗力（v²比例）・必要消費パワー（v³比例）および特性速度
    // ------------------------------------------------------------------------
    power_drag: {
      key: 'power_drag',
      id: 6,
      shortLabel: '⑥ 抗力v²・必要パワーv³',
      title: '⑥ 速度変化に対する形状抗力 (v²比例) と必要パワー (v³比例)',
      equation: '形状抗力 Dp ∝ v² ,  必要パワー Pp = Dp × v ∝ v³',
      description: '飛行速度 v が k 倍になると、空気抵抗（形状抗力）は k² 倍になり、それに打ち勝つための単位時間あたりの必要パワー（仕事率 P = D×v）は k³ 倍に急増します（速度2倍で抗力4倍・必要パワー8倍）。',
      slider1: {
        label: '基準からの速度倍率 k (倍)',
        min: 1.0,
        max: 3.0,
        step: 0.5,
        defaultValue: 2.0,
        unit: '倍',
        formatVal: (v) => `速度 ${Number(v).toFixed(1)} 倍`
      },
      slider2: {
        label: '基準速度での形状抗力 D₀ (N)',
        min: 2,
        max: 15,
        step: 1,
        defaultValue: 5,
        unit: 'N',
        formatVal: (v) => `基準抗力 ${v} N`
      },
      compute(s1, s2) {
        const k = Number(s1) || 2.0;
        const d0 = Number(s2) || 5;
        const dragRatio = k * k;
        const powerRatio = k * k * k;
        const newDrag = d0 * dragRatio;

        return {
          s1Display: `速度 ${k.toFixed(1)} 倍`,
          s2Display: `基準抗力 ${d0} N`,
          m1Label: '形状抗力 D = D₀ × k² (2乗比例)',
          m1Val: `${newDrag.toFixed(1)} N (${dragRatio.toFixed(2)}倍)`,
          m2Label: '必要パワー P = P₀ × k³ (3乗比例)',
          m2Val: `基準の ${powerRatio.toFixed(2)} 倍`,
          m3Label: '一等頻出：特性速度の大小関係',
          m3Val: '最大滞空時間速度 ＜ 最大航続距離速度',
          raw: { k, d0, dragRatio, powerRatio, newDrag },
          stepByStep: `速度が ${k}倍 → 形状抗力は ${k}² = ${dragRatio.toFixed(2)}倍 (${newDrag.toFixed(1)} N)、必要パワーは ${k}³ = ${powerRatio.toFixed(2)}倍`
        };
      },
      renderSvg(s1, s2) {
        const k = Number(s1) || 2.0;
        const d0 = Number(s2) || 5;
        const dragRatio = k * k;
        const powerRatio = k * k * k;

        const barV = Math.min(180, k * 20);
        const barD = Math.min(180, dragRatio * 14);
        const barP = Math.min(200, powerRatio * 7.2);

        return `
          <!-- Left: Scaling Bars (v, v^2, v^3) -->
          <g transform="translate(22, 24)">
            <text x="0" y="0" font-size="12" font-weight="700" fill="#0f172a">速度 ${k.toFixed(1)} 倍時の抗力・消費パワー倍率</text>

            <text x="0" y="24" font-size="11" fill="#334155">① 飛行速度 v (×k)</text>
            <rect x="0" y="30" width="${barV.toFixed(1)}" height="16" rx="3" fill="#0284c7" />
            <text x="${(barV + 8).toFixed(1)}" y="43" font-size="11" font-weight="700" fill="#0369a1">${k.toFixed(1)} 倍</text>

            <text x="0" y="66" font-size="11" fill="#334155">② 形状抗力 Dp (×k²)</text>
            <rect x="0" y="72" width="${barD.toFixed(1)}" height="16" rx="3" fill="#d97706" />
            <text x="${(barD + 8).toFixed(1)}" y="85" font-size="11" font-weight="700" fill="#92400e">${dragRatio.toFixed(2)} 倍 (${(d0 * dragRatio).toFixed(1)}N)</text>

            <text x="0" y="108" font-size="11" fill="#334155">③ 必要パワー Pp = D·v (×k³)</text>
            <rect x="0" y="114" width="${barP.toFixed(1)}" height="18" rx="3" fill="#dc2626" />
            <text x="${(barP + 8).toFixed(1)}" y="128" font-size="12" font-weight="800" fill="#991b1b">${powerRatio.toFixed(2)} 倍</text>
          </g>

          <!-- Right: Drag Curve & Characteristic Speeds -->
          <g transform="translate(295, 22)">
            <rect x="0" y="0" width="225" height="140" rx="6" fill="#f8fafc" stroke="#cbd5e1" />
            <text x="12" y="20" font-size="11" font-weight="700" fill="#0f172a">全抗力曲線（誘導抗力＋形状抗力）</text>
            <!-- Axes -->
            <line x1="25" y1="115" x2="205" y2="115" stroke="#475569" stroke-width="1.5" />
            <line x1="25" y1="30" x2="25" y2="115" stroke="#475569" stroke-width="1.5" />
            <!-- U-shaped Total Drag Curve -->
            <path d="M 38,42 Q 95,125 195,40" fill="none" stroke="#0284c7" stroke-width="2.5" />
            <!-- Endurance speed (Min Power) -->
            <circle cx="88" cy="79" r="4.5" fill="#059669" />
            <text x="32" y="102" font-size="10" font-weight="700" fill="#065f46">● 最大滞空時間速度</text>
            <!-- Range speed (Min Drag / Max L/D) -->
            <circle cx="116" cy="83" r="4.5" fill="#dc2626" />
            <text x="115" y="102" font-size="10" font-weight="700" fill="#991b1b">● 最大航続距離速度</text>
            <text x="48" y="132" font-size="10" font-weight="700" fill="#334155">滞空時間速度 ＜ 航続距離速度</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ⑦ バッテリー容量(mAh)・放電深度(DoD)・平均消費電流(A)からの安全飛行可能時間計算
    // ------------------------------------------------------------------------
    battery: {
      key: 'battery',
      id: 7,
      shortLabel: '⑦ バッテリー飛行時間',
      title: '⑦ バッテリー容量(mAh)・安全放電率と飛行可能時間',
      equation: 'T(分) = [ 容量(mAh) ÷ 1000 × 安全使用率 ] ÷ 平均電流(A) × 60',
      description: '1000 mAh = 1 Ah（1Aの電流を1時間流せる容量）です。リチウムポリマーバッテリーの過放電を防ぐため、実務・試験では容量の70〜80%（残量20〜30%確保）を実効容量として安全飛行可能時間を算出します。',
      slider1: {
        label: 'バッテリー容量 C (mAh)',
        min: 2000,
        max: 20000,
        step: 1000,
        defaultValue: 10000,
        unit: 'mAh',
        formatVal: (v) => `${v} mAh`
      },
      slider2: {
        label: '平均消費電流 I (A)',
        min: 10,
        max: 50,
        step: 5,
        defaultValue: 25,
        unit: 'A',
        formatVal: (v) => `${v} A`
      },
      compute(s1, s2) {
        const capMah = Number(s1) || 10000;
        const currentA = Number(s2) || 25;
        const capAh = capMah / 1000;
        const dod = 0.8; // 標準80%使用（20%安全マージン）
        const usableAh = capAh * dod;
        const time100Min = (capAh / currentA) * 60;
        const time80Min = (usableAh / currentA) * 60;

        return {
          s1Display: `${capMah} mAh (${capAh.toFixed(1)}Ah)`,
          s2Display: `${currentA} A`,
          m1Label: '安全飛行可能時間 (80%使用・残20%)',
          m1Val: `${time80Min.toFixed(1)} 分`,
          m2Label: '理論上の100%完全放電時間',
          m2Val: `${time100Min.toFixed(1)} 分`,
          m3Label: '実効使用可能容量 (Ah換算)',
          m3Val: `${usableAh.toFixed(2)} Ah / 全${capAh.toFixed(1)} Ah`,
          raw: { capMah, currentA, capAh, dod, usableAh, time100Min, time80Min },
          stepByStep: `容量 ${capMah}mAh = ${capAh}Ah → 80%使用時の実効容量 = ${usableAh.toFixed(2)}Ah → 飛行時間 T = (${usableAh.toFixed(2)} ÷ ${currentA}) × 60 = ${time80Min.toFixed(1)} 分`
        };
      },
      renderSvg(s1, s2) {
        const capMah = Number(s1) || 10000;
        const currentA = Number(s2) || 25;
        const capAh = capMah / 1000;
        const usableAh = capAh * 0.8;
        const time80Min = (usableAh / currentA) * 60;
        const time100Min = (capAh / currentA) * 60;

        return `
          <g transform="translate(28, 25)">
            <!-- Battery Pack Illustration -->
            <rect x="0" y="18" width="220" height="64" rx="8" fill="#f1f5f9" stroke="#334155" stroke-width="2.5" />
            <rect x="220" y="36" width="10" height="28" rx="2" fill="#334155" />
            <!-- 80% Usable Region -->
            <rect x="6" y="24" width="166" height="52" rx="5" fill="#10b981" />
            <text x="16" y="48" font-size="12" font-weight="800" fill="#ffffff">実効80%: ${usableAh.toFixed(1)} Ah</text>
            <text x="16" y="65" font-size="11" font-weight="700" fill="#ecfdf5">安全飛行: ${time80Min.toFixed(1)} 分</text>
            <!-- 20% Reserve Region -->
            <rect x="174" y="24" width="40" height="52" rx="4" fill="#f59e0b" />
            <text x="178" y="48" font-size="10" font-weight="800" fill="#ffffff">残20%</text>
            <text x="177" y="63" font-size="9" font-weight="700" fill="#fffbeb">予備</text>

            <!-- Formula Conversion Flow -->
            <g transform="translate(255, 14)">
              <rect x="0" y="0" width="235" height="122" rx="6" fill="#e0f2fe" stroke="#0284c7" />
              <text x="12" y="22" font-size="12" font-weight="800" fill="#0369a1">単位換算と計算ステップ</text>
              <text x="12" y="44" font-size="11" fill="#0f172a">① Ah換算: ${capMah} ÷ 1000 = ${capAh.toFixed(1)} Ah</text>
              <text x="12" y="65" font-size="11" fill="#0f172a">② 80%実効容量: ${capAh.toFixed(1)} × 0.8 = ${usableAh.toFixed(2)} Ah</text>
              <text x="12" y="86" font-size="11" fill="#0f172a">③ 時間(h): ${usableAh.toFixed(2)} ÷ ${currentA}A = ${(usableAh / currentA).toFixed(3)} 時間</text>
              <text x="12" y="108" font-size="12" font-weight="800" fill="#065f46">④ 分換算(×60): ${time80Min.toFixed(1)} 分 (100%時 ${time100Min.toFixed(1)}分)</text>
            </g>

            <text x="0" y="115" font-size="11" font-weight="700" fill="#475569">平均消費電流 I = ${currentA} A で放電中</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ⑧ 地上リスク緩衝地域（立入管理区画の水平距離：飛行高度・速度からの落下分散距離計算）
    // ------------------------------------------------------------------------
    buffer_zone: {
      key: 'buffer_zone',
      id: 8,
      shortLabel: '⑧ 立入管理区画・落下距離',
      title: '⑧ 地上リスク緩衝地域（立入管理区画）と弾道落下水平距離',
      equation: '落下時間 t = √(2H / g) ,  水平落下距離 d = v × √(2H / g)',
      description: '飛行速度 v、高度 H で飛行中に推力を喪失した場合、地上到達までの自由落下時間は t = √(2H/g) 秒となり、その間に水平方向へ d = v·t メートル進んで落下します。立入管理区画はこの落下分散距離以上に設定します。',
      slider1: {
        label: '飛行速度 v (m/s)',
        min: 5,
        max: 25,
        step: 1,
        defaultValue: 10,
        unit: 'm/s',
        formatVal: (v) => `${v} m/s`
      },
      slider2: {
        label: '飛行高度 H (m)',
        min: 10,
        max: 150,
        step: 5,
        defaultValue: 49,
        unit: 'm',
        formatVal: (v) => `高度 ${v} m`
      },
      compute(s1, s2) {
        const v = Number(s1) || 10;
        const H = Number(s2) || 49;
        const tFall = Math.sqrt((2 * H) / G_ACCEL);
        const dBallistic = v * tFall;
        const recommendedBuffer = Math.max(30, Math.ceil(dBallistic + 10));

        return {
          s1Display: `${v} m/s`,
          s2Display: `高度 ${H} m`,
          m1Label: '自由落下時間 t = √(2H / g)',
          m1Val: `${tFall.toFixed(2)} 秒`,
          m2Label: '弾道水平到達距離 d = v·√(2H/g)',
          m2Val: `${dBallistic.toFixed(1)} m`,
          m3Label: '推奨立入管理区画 (安全マージン込)',
          m3Val: `${recommendedBuffer} m 以上確保`,
          raw: { v, H, tFall, dBallistic, recommendedBuffer },
          stepByStep: `落下時間 t = √(2 × ${H} / 9.8) = √${((2 * H) / 9.8).toFixed(2)} ≈ ${tFall.toFixed(2)} 秒 → 水平到達距離 d = ${v} × ${tFall.toFixed(2)} ≈ ${dBallistic.toFixed(1)} m`
        };
      },
      renderSvg(s1, s2) {
        const v = Number(s1) || 10;
        const H = Number(s2) || 49;
        const tFall = Math.sqrt((2 * H) / G_ACCEL);
        const dBallistic = v * tFall;

        const topY = Math.max(22, 130 - H * 0.68);
        const dropX = Math.min(395, Math.max(95, 55 + dBallistic * 3.2));
        const bufferEndX = Math.min(465, dropX + 45);

        return `
          <g transform="translate(35, 18)">
            <!-- Ground Line -->
            <line x1="0" y1="132" x2="475" y2="132" stroke="#475569" stroke-width="2" />
            <!-- Buffer Zone Highlight on Ground -->
            <rect x="45" y="126" width="${(bufferEndX - 45).toFixed(1)}" height="12" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
            <!-- Altitude Line H -->
            <line x1="45" y1="${topY.toFixed(1)}" x2="45" y2="132" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4 3" />
            <text x="52" y="${((topY + 132) / 2 + 4).toFixed(1)}" font-size="11" font-weight="700" fill="#0369a1">H=${H}m</text>
            <!-- Velocity Vector at Top -->
            <line x1="45" y1="${topY.toFixed(1)}" x2="${(45 + Math.min(80, v * 3.5)).toFixed(1)}" y2="${topY.toFixed(1)}" stroke="#059669" stroke-width="2.5" />
            <circle cx="45" cy="${topY.toFixed(1)}" r="6.5" fill="#0284c7" />
            <text x="52" y="${(topY - 7).toFixed(1)}" font-size="11" font-weight="700" fill="#065f46">初速 v=${v}m/s (落下時間 t=${tFall.toFixed(2)}s)</text>
            <!-- Parabolic Ballistic Drop Path -->
            <path d="M 45,${topY.toFixed(1)} Q ${(45 + (dropX - 45) * 0.65).toFixed(1)},${topY.toFixed(1)} ${dropX.toFixed(1)},132" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 3" />
            <circle cx="${dropX.toFixed(1)}" cy="132" r="6" fill="#dc2626" />
            <!-- Labels -->
            <text x="45" y="154" font-size="12" font-weight="800" fill="#991b1b">弾道落下距離 d = v·√(2H/g) = ${dBallistic.toFixed(1)} m （立入管理区画を設定）</text>
          </g>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // ⑨ 揚力の基本公式 L = 1/2 · ρ · v² · S · CL（空気密度・標高・気温変化による必要速度変化）
    // ------------------------------------------------------------------------
    lift_eq: {
      key: 'lift_eq',
      id: 9,
      shortLabel: '⑨ 揚力公式・空気密度',
      title: '⑨ 揚力の基本公式 L = ½ · ρ · v² · S · CL と空気密度影響',
      equation: 'L = 1/2 × ρ × v² × S × CL',
      description: '揚力 L は空気密度 ρ、主翼面積（ローター回転円盤面積）S、揚力係数 CL に比例し、対気速度 v の「2乗」に比例します。標高が高い場所や夏場の高温時は空気密度 ρ が低下するため、同じ揚力を得るにはより高い速度や迎角が必要です。',
      slider1: {
        label: '対気速度 v (m/s)',
        min: 6,
        max: 24,
        step: 1,
        defaultValue: 12,
        unit: 'm/s',
        formatVal: (v) => `${v} m/s`
      },
      slider2: {
        label: '空気密度比 ρ/ρ₀ (高標高・高温影響)',
        min: 0.70,
        max: 1.10,
        step: 0.05,
        defaultValue: 1.00,
        unit: '倍',
        formatVal: (v) => `密度比 ${(Number(v) * 100).toFixed(0)}%`
      },
      compute(s1, s2) {
        const v = Number(s1) || 12;
        const rhoRatio = Number(s2) || 1.0;
        const rho = RHO_STD * rhoRatio;
        const S = 0.5; // 基準翼面積 S = 0.5 m²
        const CL = 0.8; // 基準揚力係数 CL = 0.8
        const liftN = 0.5 * rho * v * v * S * CL;
        const reqSpeedFactor = 1 / Math.sqrt(rhoRatio);

        return {
          s1Display: `${v} m/s`,
          s2Display: `密度 ${(rhoRatio * 100).toFixed(0)}% (${rho.toFixed(2)}kg/m³)`,
          m1Label: '発生揚力 L = ½·ρ·v²·S·CL (S=0.5, CL=0.8)',
          m1Val: `${liftN.toFixed(1)} N (約${(liftN / G_ACCEL).toFixed(1)}kgf)`,
          m2Label: '空気密度 ρ (標準1.225 kg/m³比)',
          m2Val: `${rho.toFixed(3)} kg/m³ (${(rhoRatio * 100).toFixed(0)}%)`,
          m3Label: '同揚力維持に必要な速度倍率 (1/√ρ比)',
          m3Val: `基準の ${reqSpeedFactor.toFixed(2)} 倍`,
          raw: { v, rhoRatio, rho, S, CL, liftN, reqSpeedFactor },
          stepByStep: `L = 0.5 × ${rho.toFixed(3)} × ${v}² × ${S} × ${CL} = 0.5 × ${rho.toFixed(3)} × ${v * v} × 0.4 ≈ ${liftN.toFixed(1)} N`
        };
      },
      renderSvg(s1, s2) {
        const v = Number(s1) || 12;
        const rhoRatio = Number(s2) || 1.0;
        const rho = RHO_STD * rhoRatio;
        const liftN = 0.5 * rho * v * v * 0.5 * 0.8;
        const liftArrowLen = Math.min(72, Math.max(18, liftN * 0.95));

        return `
          <g transform="translate(30, 26)">
            <!-- Left: Airfoil & Airflow Visualization -->
            <g transform="translate(120, 82)">
              <!-- Airflow lines -->
              <line x1="-105" y1="-18" x2="-35" y2="-18" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3" />
              <line x1="-105" y1="6" x2="-35" y2="6" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3" />
              <text x="-105" y="-26" font-size="11" font-weight="700" fill="#0369a1">相対風 v=${v}m/s (密度ρ=${rho.toFixed(2)})</text>
              <!-- Tilted Wing Airfoil -->
              <ellipse cx="10" cy="-4" rx="52" ry="10" transform="rotate(-10)" fill="#cbd5e1" stroke="#0f172a" stroke-width="2.5" />
              <!-- Upward Lift Vector L -->
              <line x1="8" y1="-8" x2="8" y2="${(-8 - liftArrowLen).toFixed(1)}" stroke="#059669" stroke-width="4" />
              <polygon points="2,${(-4 - liftArrowLen).toFixed(1)} 14,${(-4 - liftArrowLen).toFixed(1)} 8,${(-14 - liftArrowLen).toFixed(1)}" fill="#059669" />
              <text x="18" y="${(-liftArrowLen / 2 - 4).toFixed(1)}" font-size="12" font-weight="800" fill="#065f46">揚力 L = ${liftN.toFixed(1)} N</text>
            </g>

            <!-- Right: Formula & Density Altitude Trap Box -->
            <g transform="translate(275, 0)">
              <rect x="0" y="0" width="215" height="132" rx="6" fill="#f8fafc" stroke="#cbd5e1" />
              <text x="12" y="22" font-size="12" font-weight="800" fill="#0f172a">揚力の比例関係（一等頻出）</text>
              <text x="12" y="44" font-size="11" fill="#334155">・空気密度 ρ に比例 (L ∝ ρ)</text>
              <text x="12" y="64" font-size="11" font-weight="700" fill="#0369a1">・対気速度 v の「2乗」に比例 (L ∝ v²)</text>
              <text x="12" y="84" font-size="11" fill="#334155">・翼面積 S / 揚力係数 CL に比例</text>
              <rect x="8" y="94" width="199" height="30" rx="4" fill="#fef2f2" />
              <text x="14" y="113" font-size="10.5" font-weight="700" fill="#991b1b">⚠️ 高標高・高温時は ρ 低下 → 揚力減少</text>
            </g>
          </g>
        `;
      }
    }
  };

  const formulaKeys = Object.keys(formulas);

  // ==========================================================================
  // 2. 無限ランダム計算ドリル生成エンジン generateRandomDrill(formulaKey)
  // ==========================================================================
  const drillGenerators = {
    // ① 定常水平旋回の旋回半径 r = v² / (g · tanθ)
    turn() {
      const vList = [7, 10, 14, 15, 20, 21];
      const bList = [
        { deg: 30, tan: 0.58 },
        { deg: 45, tan: 1.0 },
        { deg: 60, tan: 1.73 }
      ];
      const v = pickRandom(vList);
      const b = pickRandom(bList);
      const r = (v * v) / (G_ACCEL * b.tan);
      const ans = r.toFixed(1);

      const wrongNoSquare = (v / (G_ACCEL * b.tan)).toFixed(1);
      const wrongMultTan = ((v * v * b.tan) / G_ACCEL === r
        ? r * 2
        : (v * v * b.tan) / G_ACCEL
      ).toFixed(1);

      return {
        formulaKey: 'turn',
        title: formulas.turn.title,
        stem: `【① 定常水平旋回の計算】飛行速度 ${v} m/s、バンク角 ${b.deg}° で高度を維持した定常水平旋回を行う場合の旋回半径 r として、最も近いものはどれか。（重力加速度 g = 9.8 m/s²、tan${b.deg}° = ${b.tan} とする）`,
        options: shuffleArray([
          {
            text: `約 ${ans} m`,
            correct: true,
            exp: `⭕ 正解！ 定常旋回半径の公式 r = v² / (g·tanθ) に代入すると、r = ${v}² / (9.8 × ${b.tan}) = ${v * v} / ${(9.8 * b.tan).toFixed(2)} ≈ ${ans} m となります。`,
            slider1Val: v,
            slider2Val: b.deg
          },
          {
            text: `約 ${wrongNoSquare} m`,
            correct: false,
            exp: `❌ 不正解（速度vの2乗し忘れ）。分子の速度 v を2乗せず v / (g·tanθ) = ${v} / ${(9.8 * b.tan).toFixed(2)} と計算しています。正しくは ${v}² = ${v * v} を用いて約 ${ans} m です。`,
            slider1Val: v,
            slider2Val: b.deg
          },
          {
            text: `約 ${wrongMultTan} m`,
            correct: false,
            exp: `❌ 不正解（tanθの掛け割りミス・2倍ミス）。tanθ は分母に掛ける必要があります。正しくは r = ${v}² / (9.8 × ${b.tan}) ≈ ${ans} m です。`,
            slider1Val: v,
            slider2Val: b.deg
          }
        ])
      };
    },

    // ② 荷重倍数 n = 1 / cosθ と旋回失速速度 Vs_turn = Vs · √n
    load_stall() {
      const vsList = [8, 10, 12, 14, 15, 16];
      const bankList = [
        { deg: 30, cos: 0.87, n: 1.15, sqrtN: 1.07 },
        { deg: 45, cos: 0.71, n: 1.41, sqrtN: 1.19 },
        { deg: 60, cos: 0.50, n: 2.00, sqrtN: 1.41 }
      ];
      const vs = pickRandom(vsList);
      const b = pickRandom(bankList);
      const vsTurn = vs * b.sqrtN;
      const ans = vsTurn.toFixed(1);

      const wrongLinearN = (vs * b.n).toFixed(1);
      const wrongDivideSqrt = (vs / b.sqrtN).toFixed(1);

      return {
        formulaKey: 'load_stall',
        title: formulas.load_stall.title,
        stem: `【② 荷重倍数と旋回失速速度】水平直線飛行時の失速速度が ${vs} m/s の無人航空機が、バンク角 ${b.deg}° で定常水平旋回を行う場合、旋回中の失速速度として最も近いものはどれか。（cos${b.deg}° = ${b.cos}、荷重倍数 n = 1/cosθ ≈ ${b.n}、√${b.n} ≈ ${b.sqrtN} とする）`,
        options: shuffleArray([
          {
            text: `約 ${ans} m/s`,
            correct: true,
            exp: `⭕ 正解！ バンク角 ${b.deg}° の荷重倍数は n = 1 / cos${b.deg}° ≈ ${b.n} G です。旋回失速速度は √n 倍になるため、Vs_turn = ${vs} × √${b.n} = ${vs} × ${b.sqrtN} ≈ ${ans} m/s となります。`,
            slider1Val: vs,
            slider2Val: b.deg
          },
          {
            text: `約 ${wrongLinearN} m/s`,
            correct: false,
            exp: `❌ 不正解（ルートし忘れミス）。荷重倍数 n = ${b.n} をそのまま掛けて ${vs} × ${b.n} = ${wrongLinearN} m/s としています。揚力は速度の2乗に比例するため、失速速度は √n 倍（×${b.sqrtN}）の約 ${ans} m/s になります。`,
            slider1Val: vs,
            slider2Val: b.deg
          },
          {
            text: `約 ${wrongDivideSqrt} m/s`,
            correct: false,
            exp: `❌ 不正解（掛け算・割り算の逆算ミス）。旋回中は必要揚力が増えるため、失速速度は低下せず上昇（×√n）します。正しくは ${vs} × ${b.sqrtN} ≈ ${ans} m/s です。`,
            slider1Val: vs,
            slider2Val: b.deg
          }
        ])
      };
    },

    // ③ 電波の波長 λ = c / f と第1フレネルゾーン最大半径 r₁ = 1/2 √(λ·d)
    fresnel() {
      const dList = [200, 400, 500, 600, 800, 1000];
      const d = pickRandom(dList);
      const askClearance = Math.random() < 0.35;
      const lambda = 0.125; // 2.4GHz: 3e8 / 2.4e9 = 0.125 m
      const r1 = 0.5 * Math.sqrt(lambda * d);

      if (askClearance) {
        const r60 = r1 * 0.6;
        const ans = r60.toFixed(2);
        return {
          formulaKey: 'fresnel',
          title: formulas.fresnel.title,
          stem: `【③ 第1フレネルゾーンと60%クリアランス】周波数 2.4 GHz（波長 λ = 0.125 m）、送受信間距離 d = ${d} m のとき、良好な通信を確保するために障害物を避けるべき「第1フレネルゾーン最大半径 r₁ の60%」の長さとして最も近いものはどれか。（r₁ = 1/2 √(λ·d) とする）`,
          options: shuffleArray([
            {
              text: `約 ${ans} m`,
              correct: true,
              exp: `⭕ 正解！ まず第1フレネル半径 r₁ = 0.5 × √(0.125 × ${d}) = 0.5 × √${(0.125 * d).toFixed(1)} ≈ ${r1.toFixed(2)} m。その60%クリアランスは ${r1.toFixed(2)} × 0.6 ≈ ${ans} m です。`,
              slider1Val: d,
              slider2Val: 1
            },
            {
              text: `約 ${r1.toFixed(2)} m`,
              correct: false,
              exp: `❌ 不正解（60%掛け忘れミス）。${r1.toFixed(2)} m は第1フレネルゾーン最大半径 r₁ そのものの値です。問題文は「60%クリアランス半径」を求めているため、0.6 を掛けて約 ${ans} m となります。`,
              slider1Val: d,
              slider2Val: 1
            },
            {
              text: `約 ${(r1 * 2 * 0.6).toFixed(2)} m`,
              correct: false,
              exp: `❌ 不正解（公式の 1/2 掛け忘れミス）。r₁ = 1/2 √(λ·d) の 1/2 を忘れています。正しくは r₁ ≈ ${r1.toFixed(2)} m × 0.6 ≈ ${ans} m です。`,
              slider1Val: d,
              slider2Val: 1
            }
          ])
        };
      }

      const ans = r1.toFixed(2);
      const wrongNoHalf = (r1 * 2).toFixed(2);
      const wrongNoSqrt = (0.5 * lambda * d).toFixed(2);

      return {
        formulaKey: 'fresnel',
        title: formulas.fresnel.title,
        stem: `【③ 電波と第1フレネルゾーン半径】周波数 2.4 GHz（波長 λ = 0.125 m）、送信機と無人航空機の距離 d = ${d} m のとき、第1フレネルゾーンの最大半径 r₁ として最も近いものはどれか。（r₁ = 1/2 √(λ·d) とする）`,
        options: shuffleArray([
          {
            text: `約 ${ans} m`,
            correct: true,
            exp: `⭕ 正解！ r₁ = 0.5 × √(0.125 × ${d}) = 0.5 × √${(0.125 * d).toFixed(1)} = 0.5 × ${Math.sqrt(0.125 * d).toFixed(2)} ≈ ${ans} m です。`,
            slider1Val: d,
            slider2Val: 1
          },
          {
            text: `約 ${wrongNoHalf} m`,
            correct: false,
            exp: `❌ 不正解（先頭の 1/2 掛け忘れミス）。√(0.125 × ${d}) = ${wrongNoHalf} m のまま回答しています。公式 r₁ = 1/2 √(λ·d) の通り 0.5 を掛けて約 ${ans} m となります。`,
            slider1Val: d,
            slider2Val: 1
          },
          {
            text: `約 ${wrongNoSqrt} m`,
            correct: false,
            exp: `❌ 不正解（平方根 √ の取り忘れミス）。0.5 × 0.125 × ${d} = ${wrongNoSqrt} m と計算しています。必ず √(λ·d) の平方根をとる必要があり、正解は約 ${ans} m です。`,
            slider1Val: d,
            slider2Val: 1
          }
        ])
      };
    },

    // ④ 揚抗比 L/D と無風時の滑空水平到達距離 D = H × (L/D)
    glide() {
      const hList = [40, 50, 60, 80, 100, 120, 150];
      const ldList = [4, 5, 6, 8, 10, 12];
      const h = pickRandom(hList);
      const ld = pickRandom(ldList);
      const ans = h * ld;

      const wrongDiv = (h / ld).toFixed(1);
      const wrongHalf = Math.round(ans * 0.5);

      return {
        formulaKey: 'glide',
        title: formulas.glide.title,
        stem: `【④ 揚抗比と滑空水平到達距離】無風状態において、高度 ${h} m を飛行中の揚抗比（L/D）が ${ld} の固定翼無人航空機が推力を失い滑空した場合、地上に到達するまでの水平距離として正しいものはどれか。`,
        options: shuffleArray([
          {
            text: `${ans} m`,
            correct: true,
            exp: `⭕ 正解！ 無風時の水平滑空距離 D = 高度 H × 揚抗比(L/D) = ${h} m × ${ld} = ${ans} m です。`,
            slider1Val: h,
            slider2Val: ld
          },
          {
            text: `${wrongDiv} m`,
            correct: false,
            exp: `❌ 不正解（掛け算と割り算の逆算ミス）。高度 H を揚抗比で割って ${h} ÷ ${ld} = ${wrongDiv} m としています。正しくは ${h} × ${ld} = ${ans} m です。`,
            slider1Val: h,
            slider2Val: ld
          },
          {
            text: `${wrongHalf} m`,
            correct: false,
            exp: `❌ 不正解（三角形の面積公式 1/2 との混同ミス）。1/2 を掛ける必要はありません。水平到達距離は H × (L/D) = ${h} × ${ld} = ${ans} m です。`,
            slider1Val: h,
            slider2Val: ld
          }
        ])
      };
    },

    // ⑤ 風ベクトル補正と2地点間の往復所要時間
    wind_time() {
      const scenarios = [
        { dist: 360, va: 10, vw: 2 }, // out: 360/8=45s, in: 360/12=30s -> total 75s (no wind: 72s)
        { dist: 480, va: 10, vw: 2 }, // out: 480/8=60s, in: 480/12=40s -> total 100s (no wind: 96s)
        { dist: 600, va: 10, vw: 2 }, // out: 600/8=75s, in: 600/12=50s -> total 125s (no wind: 120s)
        { dist: 450, va: 12, vw: 3 }, // out: 450/9=50s, in: 450/15=30s -> total 80s (no wind: 75s)
        { dist: 600, va: 15, vw: 5 }, // out: 600/10=60s, in: 600/20=30s -> total 90s (no wind: 80s)
        { dist: 720, va: 15, vw: 3 }  // out: 720/12=60s, in: 720/18=40s -> total 100s (no wind: 96s)
      ];
      const sc = pickRandom(scenarios);
      const vgOut = sc.va - sc.vw;
      const vgIn = sc.va + sc.vw;
      const tOut = sc.dist / vgOut;
      const tIn = sc.dist / vgIn;
      const tTotal = tOut + tIn;
      const tNoWind = (sc.dist * 2) / sc.va;

      return {
        formulaKey: 'wind_time',
        title: formulas.wind_time.title,
        stem: `【⑤ 風補正と2地点間の往復飛行時間】2地点間（片道距離 ${sc.dist} m）を対気速度 ${sc.va} m/s で往復飛行する。経路と平行に風速 ${sc.vw} m/s の一定の風が吹いているとき、往復に要する合計飛行時間として正しいものはどれか。（旋回に要する時間は無視する）`,
        options: shuffleArray([
          {
            text: `${tTotal} 秒`,
            correct: true,
            exp: `⭕ 正解！ 往路（向かい風）の対地速度は ${sc.va} - ${sc.vw} = ${vgOut} m/s より t₁ = ${sc.dist} ÷ ${vgOut} = ${tOut} 秒。復路（追い風）の対地速度は ${sc.va} + ${sc.vw} = ${vgIn} m/s より t₂ = ${sc.dist} ÷ ${vgIn} = ${tIn} 秒。往復合計は ${tOut} + ${tIn} = ${tTotal} 秒です。`,
            slider1Val: sc.va,
            slider2Val: sc.vw
          },
          {
            text: `${tNoWind} 秒`,
            correct: false,
            exp: `❌ 不正解（無風時と往復時間が同じになるという典型トラップ）。「行きと帰りで風の影響が相殺される」と考え ${sc.dist * 2} ÷ ${sc.va} = ${tNoWind} 秒としていますが、低速な向かい風区間を飛ぶ時間(${tOut}秒)の方が長いため、合計時間は必ず ${tTotal} 秒へ増加します。`,
            slider1Val: sc.va,
            slider2Val: sc.vw
          },
          {
            text: `${tOut * 2} 秒`,
            correct: false,
            exp: `❌ 不正解（往路・向かい風の時間を単純に2倍したミス）。復路は追い風（対地速度 ${vgIn} m/s）になるため ${tIn} 秒で帰還できます。正しくは ${tOut} + ${tIn} = ${tTotal} 秒です。`,
            slider1Val: sc.va,
            slider2Val: sc.vw
          }
        ])
      };
    },

    // ⑥ 速度と形状抗力(v²)・必要パワー(v³)
    power_drag() {
      const kList = [1.5, 2, 2.5, 3];
      const k = pickRandom(kList);
      const askPower = Math.random() < 0.55;
      const d0 = pickRandom([4, 5, 6, 8, 10]);

      if (askPower) {
        const powerMult = k * k * k;
        const dragMult = k * k;
        const fmtP = Number.isInteger(powerMult) ? String(powerMult) : powerMult.toFixed(2);
        const fmtD = Number.isInteger(dragMult) ? String(dragMult) : dragMult.toFixed(2);

        return {
          formulaKey: 'power_drag',
          title: formulas.power_drag.title,
          stem: `【⑥ 飛行速度と必要消費パワー】無人航空機の飛行速度 v を基準速度の ${k} 倍に増加させたとき、形状抗力（空気抵抗）に打ち勝つために必要な単位時間あたりの消費パワー（仕事率 P = D × v）は基準時の何倍になるか。`,
          options: shuffleArray([
            {
              text: `${fmtP} 倍`,
              correct: true,
              exp: `⭕ 正解！ 形状抗力 D は速度の2乗（${k}² = ${fmtD}倍）に比例し、単位時間あたりに進む距離も ${k} 倍になるため、必要パワー P = D × v は速度の「3乗」（${k}³ = ${fmtP}倍）に比例します。`,
              slider1Val: k,
              slider2Val: d0
            },
            {
              text: `${fmtD} 倍`,
              correct: false,
              exp: `❌ 不正解（抗力の2乗比例とパワーの3乗比例の混同ミス）。${fmtD} 倍（${k}²）は「形状抗力 D」の増加倍率です。必要パワー（仕事率 P = D × v）はさらに速度 v を掛けるため、3乗（${k}³ = ${fmtP}倍）になります。`,
              slider1Val: k,
              slider2Val: d0
            },
            {
              text: `${k} 倍`,
              correct: false,
              exp: `❌ 不正解（単純比例ミス）。必要パワーは速度の1乗ではなく「3乗（k³）」に比例するため、${k}³ = ${fmtP} 倍となります。`,
              slider1Val: k,
              slider2Val: d0
            }
          ])
        };
      }

      const newDrag = d0 * k * k;
      const wrongLinear = d0 * k;
      const wrongCube = d0 * k * k * k;

      return {
        formulaKey: 'power_drag',
        title: formulas.power_drag.title,
        stem: `【⑥ 飛行速度と形状抗力】ある速度で飛行中の無人航空機に働く形状抗力が ${d0} N であった。他の条件を変えずに飛行速度を ${k} 倍にしたとき、機体に働く形状抗力として正しいものはどれか。`,
        options: shuffleArray([
          {
            text: `${newDrag} N`,
            correct: true,
            exp: `⭕ 正解！ 形状抗力は飛行速度の「2乗」に比例するため、D = ${d0} × ${k}² = ${d0} × ${k * k} = ${newDrag} N となります。`,
            slider1Val: k,
            slider2Val: d0
          },
          {
            text: `${wrongLinear} N`,
            correct: false,
            exp: `❌ 不正解（速度の2乗し忘れミス）。${d0} × ${k} = ${wrongLinear} N と1乗で計算しています。抗力は速度の2乗に比例するため ${d0} × ${k}² = ${newDrag} N です。`,
            slider1Val: k,
            slider2Val: d0
          },
          {
            text: `${wrongCube} N`,
            correct: false,
            exp: `❌ 不正解（パワーの3乗比例との混同ミス）。3乗（${k}³）に比例するのは必要パワー P であり、形状抗力 D は2乗（${k}²）に比例するため ${newDrag} N です。`,
            slider1Val: k,
            slider2Val: d0
          }
        ])
      };
    },

    // ⑦ バッテリー容量(mAh)・安全使用率・平均消費電流(A)からの飛行可能時間計算
    battery() {
      const presets = [
        { capMah: 6000, currentA: 15, dodPct: 80 },  // 6Ah * 0.8 = 4.8Ah / 15A * 60 = 19.2 min (100%: 24 min)
        { capMah: 8000, currentA: 20, dodPct: 80 },  // 8Ah * 0.8 = 6.4Ah / 20A * 60 = 19.2 min (100%: 24 min)
        { capMah: 10000, currentA: 20, dodPct: 80 }, // 10Ah * 0.8 = 8Ah / 20A * 60 = 24 min (100%: 30 min)
        { capMah: 10000, currentA: 25, dodPct: 80 }, // 10Ah * 0.8 = 8Ah / 25A * 60 = 19.2 min (100%: 24 min)
        { capMah: 12000, currentA: 24, dodPct: 80 }, // 12Ah * 0.8 = 9.6Ah / 24A * 60 = 24 min (100%: 30 min)
        { capMah: 15000, currentA: 30, dodPct: 80 }, // 15Ah * 0.8 = 12Ah / 30A * 60 = 24 min (100%: 30 min)
        { capMah: 16000, currentA: 20, dodPct: 75 }  // 16Ah * 0.75 = 12Ah / 20A * 60 = 36 min (100%: 48 min)
      ];
      const p = pickRandom(presets);
      const capAh = p.capMah / 1000;
      const usableAh = capAh * (p.dodPct / 100);
      const ansMin = (usableAh / p.currentA) * 60;
      const wrong100Min = (capAh / p.currentA) * 60;
      const wrongDecimalHour = (usableAh / p.currentA) * 100; // 60ではなく100を掛けたミス

      const fmtAns = Number.isInteger(ansMin) ? String(ansMin) : ansMin.toFixed(1);
      const fmt100 = Number.isInteger(wrong100Min) ? String(wrong100Min) : wrong100Min.toFixed(1);
      const fmtDec = Number.isInteger(wrongDecimalHour) ? String(wrongDecimalHour) : wrongDecimalHour.toFixed(1);

      return {
        formulaKey: 'battery',
        title: formulas.battery.title,
        stem: `【⑦ バッテリー容量と安全飛行可能時間】容量 ${p.capMah} mAh のバッテリーを搭載した無人航空機が、平均消費電流 ${p.currentA} A で飛行する。安全マージンとしてバッテリー容量の ${100 - p.dodPct}% を残して着陸する場合（実効使用率 ${p.dodPct}%）、飛行可能時間として正しいものはどれか。`,
        options: shuffleArray([
          {
            text: `${fmtAns} 分`,
            correct: true,
            exp: `⭕ 正解！ ① ${p.capMah} mAh ÷ 1000 = ${capAh} Ah。② 実効使用率 ${p.dodPct}% より使用可能容量は ${capAh} × ${p.dodPct / 100} = ${usableAh.toFixed(2)} Ah。③ 飛行可能時間 = (${usableAh.toFixed(2)} Ah ÷ ${p.currentA} A) × 60分 = ${fmtAns} 分です。`,
            slider1Val: p.capMah,
            slider2Val: p.currentA
          },
          {
            text: `${fmt100} 分`,
            correct: false,
            exp: `❌ 不正解（安全マージン・実効使用率の掛け忘れミス）。容量100%（${capAh} Ah）をすべて使い切る前提で (${capAh} ÷ ${p.currentA}) × 60 = ${fmt100} 分と計算しています。${p.dodPct}% を掛けて ${fmtAns} 分とする必要があります。`,
            slider1Val: p.capMah,
            slider2Val: p.currentA
          },
          {
            text: `${fmtDec} 分`,
            correct: false,
            exp: `❌ 不正解（時間→分の60倍換算ミス）。1時間は60分であるため (${usableAh.toFixed(2)} ÷ ${p.currentA}) 時間には 60 を掛ける必要があります（100を掛けると誤答になります）。正解は ${fmtAns} 分です。`,
            slider1Val: p.capMah,
            slider2Val: p.currentA
          }
        ])
      };
    },

    // ⑧ 地上リスク緩衝地域（立入管理区画：弾道落下水平距離 d = v · √(2H/g)）
    buffer_zone() {
      const hPresets = [
        { H: 19.6, t: 2.0 }, // 2*19.6/9.8 = 4 -> sqrt = 2.0s
        { H: 44.1, t: 3.0 }, // 2*44.1/9.8 = 9 -> sqrt = 3.0s
        { H: 49.0, t: 3.16 }, // 2*49/9.8 = 10 -> sqrt = 3.16s
        { H: 78.4, t: 4.0 }  // 2*78.4/9.8 = 16 -> sqrt = 4.0s
      ];
      const vList = [5, 8, 10, 12, 15, 20];
      const hp = pickRandom(hPresets);
      const v = pickRandom(vList);

      const d = v * hp.t;
      const ans = d.toFixed(1);
      const wrongNoSqrt = (v * ((2 * hp.H) / G_ACCEL)).toFixed(1);
      const wrongNoTwo = (v * Math.sqrt(hp.H / G_ACCEL)).toFixed(1);

      return {
        formulaKey: 'buffer_zone',
        title: formulas.buffer_zone.title,
        stem: `【⑧ 立入管理区画・弾道落下距離】高度 H = ${hp.H} m を水平速度 v = ${v} m/s で飛行中の無人航空機が推力を完全に喪失し自由落下した場合、地上に落下するまでに水平方向へ進む距離 d = v·√(2H/g) として最も近いものはどれか。（空気抵抗は無視し、重力加速度 g = 9.8 m/s² とする）`,
        options: shuffleArray([
          {
            text: `約 ${ans} m`,
            correct: true,
            exp: `⭕ 正解！ まず自由落下時間 t = √(2H / g) = √(2 × ${hp.H} / 9.8) = √${((2 * hp.H) / 9.8).toFixed(1)} ≈ ${hp.t.toFixed(2)} 秒。その間に水平速度 ${v} m/s で進む距離は d = ${v} × ${hp.t.toFixed(2)} ≈ ${ans} m です。`,
            slider1Val: v,
            slider2Val: Math.round(hp.H)
          },
          {
            text: `約 ${wrongNoSqrt} m`,
            correct: false,
            exp: `❌ 不正解（落下時間の平方根 √ 取り忘れミス）。2H/g = ${((2 * hp.H) / 9.8).toFixed(1)} のルートをとらずにそのまま速度 ${v} m/s を掛けています。t = √(2H/g) ≈ ${hp.t.toFixed(2)} 秒より、正解は約 ${ans} m です。`,
            slider1Val: v,
            slider2Val: Math.round(hp.H)
          },
          {
            text: `約 ${wrongNoTwo} m`,
            correct: false,
            exp: `❌ 不正解（√(2H/g) の「2」の掛け忘れミス）。自由落下公式 H = 1/2·g·t² を変形すると t = √(2H/g) になります。2 を忘れずに入れて計算すると約 ${ans} m となります。`,
            slider1Val: v,
            slider2Val: Math.round(hp.H)
          }
        ])
      };
    },

    // ⑨ 揚力の基本公式 L = 1/2 · ρ · v² · S · CL
    lift_eq() {
      const vList = [10, 12, 15, 20];
      const sList = [0.4, 0.5, 0.8, 1.0];
      const clList = [0.5, 0.6, 0.8, 1.0];
      const v = pickRandom(vList);
      const S = pickRandom(sList);
      const CL = pickRandom(clList);
      const rho = 1.2; // 計算しやすい空気密度 ρ = 1.2 kg/m³

      const lift = 0.5 * rho * v * v * S * CL;
      const ans = lift.toFixed(1);
      const wrongNoHalf = (rho * v * v * S * CL).toFixed(1);
      const wrongNoSquare = (0.5 * rho * v * S * CL).toFixed(1);

      return {
        formulaKey: 'lift_eq',
        title: formulas.lift_eq.title,
        stem: `【⑨ 揚力の基本公式】空気密度 ρ = ${rho} kg/m³、飛行速度 v = ${v} m/s、主翼面積 S = ${S} m²、揚力係数 CL = ${CL} で飛行する固定翼無人航空機に発生する揚力 L [N] として正しいものはどれか。（L = 1/2 · ρ · v² · S · CL とする）`,
        options: shuffleArray([
          {
            text: `${ans} N`,
            correct: true,
            exp: `⭕ 正解！ 揚力の公式 L = 1/2 × ρ × v² × S × CL に数値を代入すると、L = 0.5 × ${rho} × ${v}² × ${S} × ${CL} = 0.6 × ${v * v} × ${(S * CL).toFixed(2)} = ${ans} N となります。`,
            slider1Val: v,
            slider2Val: 1.0
          },
          {
            text: `${wrongNoHalf} N`,
            correct: false,
            exp: `❌ 不正解（動圧の 1/2 掛け忘れミス）。公式先頭の 1/2（0.5）を掛け忘れ、2倍の ${wrongNoHalf} N となっています。正しくは ${ans} N です。`,
            slider1Val: v,
            slider2Val: 1.0
          },
          {
            text: `${wrongNoSquare} N`,
            correct: false,
            exp: `❌ 不正解（飛行速度 v の2乗し忘れミス）。速度 v を2乗せず 0.5 × ${rho} × ${v} × ${S} × ${CL} = ${wrongNoSquare} N と計算しています。揚力は速度の2乗（${v}² = ${v * v}）に比例するため ${ans} N です。`,
            slider1Val: v,
            slider2Val: 1.0
          }
        ])
      };
    }
  };

  /**
   * 指定された公式（または 'all' / 未指定時は9公式からランダム）について、
   * 毎回ランダムな数値の3択計算問題を生成して返す
   * @param {string} [formulaKey='all']
   * @returns {{ formulaKey: string, title: string, stem: string, options: Array<{ text: string, correct: boolean, exp: string, slider1Val: number, slider2Val: number }> }}
   */
  function generateRandomDrill(formulaKey) {
    let targetKey = formulaKey;
    if (!targetKey || targetKey === 'all' || !drillGenerators[targetKey]) {
      targetKey = pickRandom(formulaKeys);
    }
    return drillGenerators[targetKey]();
  }

  // ==========================================================================
  // Public API Export
  // ==========================================================================
  global.AERO_PHYSICS_ENGINE = {
    version: '5.0.0',
    constants: {
      G_ACCEL,
      LIGHT_SPEED,
      RHO_STD
    },
    formulaKeys,
    formulas,
    generateRandomDrill,
    computeFormula(key, s1, s2) {
      const f = formulas[key] || formulas.turn;
      return f.compute(s1, s2);
    },
    renderFormulaSvg(key, s1, s2) {
      const f = formulas[key] || formulas.turn;
      return f.renderSvg(s1, s2);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
