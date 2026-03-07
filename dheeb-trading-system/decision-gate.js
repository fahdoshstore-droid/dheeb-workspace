/**
 * DHEEB Decision Gate Filter
 * Psychology + TRIL Analysis
 * Version: 1.0
 */

const fState = {
  answers: {},
  blocked: false,
  warnings: [],
  result: null,
  categories: {
    psychology: { label: 'الحالة النفسية', questions: ['q1','q2','q3','q4','q5'], max: 15, score: 0 },
    tril: { label: 'تحليل TRIL', questions: ['q6','q7','q8','q9'], max: 12, score: 0 },
    rrr: { label: 'المخاطرة/العائد', questions: ['q10'], max: 3, score: 0 }
  }
};

const fQOrder = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'];

function fAnswer(qId, score, level, btn) {
  if (fState.blocked) return;

  // Blocker check
  if (btn.dataset.block === 'true') {
    fState.blocked = true;
    const msg = btn.dataset.bmsg || 'لا تتداول.';
    fShowBlocker(msg);
    updateHeaderFilter('failed', '🚫', 'الفلتر: محظور');
    return;
  }

  // Deselect siblings
  const card = document.getElementById('fc-' + qId);
  card.querySelectorAll('.f-opt').forEach(b => b.classList.remove('sel','good','warn','bad'));
  btn.classList.add('sel', level);
  card.classList.add('answered');

  fState.answers[qId] = { score, level };
  if (score <= 1) {
    fState.warnings.push({ q: card.querySelector('.f-qtext').textContent, a: btn.textContent.trim() });
  }

  // Advance
  const idx = fQOrder.indexOf(qId);
  fUpdateProgress(Object.keys(fState.answers).length);

  if (idx < fQOrder.length - 1) {
    const next = fQOrder[idx + 1];
    if (next === 'q6') {
      document.getElementById('fPhase1').classList.remove('active');
      document.getElementById('fPhase2').classList.add('active');
      document.getElementById('fProgressPhase').textContent = 'المرحلة التحليلية';
    }
    setTimeout(() => {
      const nc = document.getElementById('fc-' + next);
      nc.style.display = 'block';
      nc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

function fShowBlocker(msg) {
  document.getElementById('fBlockerMsg').textContent = msg;
  document.getElementById('fBlocker').classList.add('vis');
  document.getElementById('fPhase1').style.display = 'none';
  document.getElementById('fPhase2').style.display = 'none';
}

function fUpdateProgress(count) {
  document.getElementById('fProgressFill').style.width = (count / 10 * 100) + '%';
  document.getElementById('fProgressCount').textContent = count + ' / 10';
}

function fUpdateRRR(val) {
  const el = document.getElementById('fRrrVal');
  el.textContent = '1:' + parseFloat(val).toFixed(1);
  el.style.color = val >= 2 ? 'var(--accent-green)' : val >= 1.5 ? 'var(--accent-amber)' : 'var(--accent-red)';
}

function fSubmitRRR() {
  const val = parseFloat(document.getElementById('fRrrSlider').value);
  let score = 0, level = 'bad';
  if (val >= 3) { score = 3; level = 'good'; }
  else if (val >= 2) { score = 2; level = 'good'; }
  else if (val >= 1.5) { score = 1; level = 'warn'; }
  fState.answers['q10'] = { score, level, rrr: val };
  if (val < 2) fState.warnings.push({ q: 'نسبة المخاطرة/العائد', a: '1:' + val.toFixed(1) + ' — أقل من الحد الأدنى' });
  fUpdateProgress(10);
  fCalculateResult();
}

function fCalculateResult() {
  // Calculate scores
  for (const [k, cat] of Object.entries(fState.categories)) {
    cat.score = 0;
    cat.questions.forEach(q => { if (fState.answers[q]) cat.score += fState.answers[q].score; });
  }
  
  const total = Object.values(fState.categories).reduce((s, c) => s + c.score, 0);
  const max = Object.values(fState.categories).reduce((s, c) => s + c.max, 0);
  const pct = Math.round((total / max) * 100);
  const rrr = fState.answers.q10?.rrr || 0;

  let verdict, vClass, icon, sub, canProceed = false;
  if (pct >= 75 && rrr >= 2) {
    verdict = 'ادخل الصفقة ✅'; vClass = 'go'; icon = '🟢';
    sub = 'كل المعايير متوافقة.نفذ خطتك بانضباط.'; canProceed = true;
  } else if (pct >= 50) {
    verdict = 'انتبه ⚠️'; vClass = 'caution'; icon = '🟡';
    sub = 'في نقاط ضعف. إذا تدخل — قلل الحجم ورقب عن قرب.'; canProceed = true;
  } else {
    verdict = 'لا تتداول 🛑'; vClass = 'stop'; icon = '🔴';
    sub = 'الظروف غير مناسبة. أفضل صفقة هي اللي ما تدخلها.'; canProceed = false;
  }

  fState.result = { pct, verdict: vClass, categories: { ...fState.categories } };

  // Render verdict
  const vb = document.getElementById('fVerdictBox');
  vb.className = 'f-verdict ' + vClass;
  document.getElementById('fVerdictIcon').textContent = icon;
  document.getElementById('fVerdictText').textContent = verdict;
  document.getElementById('fVerdictSub').textContent = sub;

  // Breakdown
  const rows = document.getElementById('fBreakdownRows');
  rows.innerHTML = '';
  for (const cat of Object.values(fState.categories)) {
    const cp = Math.round((cat.score / cat.max) * 100);
    const bc = cp >= 70 ? 'good' : cp >= 40 ? 'warn' : 'bad';
    const nc = cp >= 70 ? 'var(--accent-green)' : cp >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
    rows.innerHTML += `<div class="f-score-row"><span class="f-score-label">${cat.label}</span><div class="f-score-bar-w"><span class="f-score-num" style="color:${nc}">${cp}%</span><div class="f-score-mini"><div class="f-score-fill ${bc}" style="width:${cp}%"></div></div></div></div>`;
  }
  
  const tc = pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const tbc = pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad';
  rows.innerHTML += `<div class="f-score-row" style="border-top:1px solid var(--border-active);margin-top:4px;padding-top:10px"><span class="f-score-label" style="font-weight:700">المجموع</span><div class="f-score-bar-w"><span class="f-score-num" style="color:${tc};font-size:14px">${pct}%</span><div class="f-score-mini"><div class="f-score-fill ${tbc}" style="width:${pct}%"></div></div></div></div>`;

  // Warnings
  const wl = document.getElementById('fWarnings');
  wl.innerHTML = fState.warnings.map(w => `<div class="f-warn-item"><span>⚠️</span><span>${w.q}: ${w.a}</span></div>`).join('');

  // Proceed button
  const pb = document.getElementById('fProceedBtn');
  pb.disabled = !canProceed;
  pb.textContent = canProceed ? '🔓 الدخول للمنصة' : '🔒 غير مسموح — الظروف غير مناسبة';

  // Timestamp
  const now = new Date();
  document.getElementById('fTimestamp').textContent = '🐺 ' + now.toLocaleDateString('ar-SA') + ' — ' + now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' });

  // Show result
  document.getElementById('fPhase2').style.display = 'none';
  document.getElementById('fResult').classList.add('vis');
  document.getElementById('fResult').scrollIntoView({ behavior: 'smooth' });

  // Update header
  if (canProceed) {
    updateHeaderFilter(vClass === 'go' ? 'passed' : 'pending', vClass === 'go' ? '✅' : '⚠️', 'الفلتر: ' + pct + '%');
  } else {
    updateHeaderFilter('failed', '🛑', 'الفلتر: ' + pct + '%');
  }

  // Update side panel summary
  updateFilterSummary(pct);
}

function filterProceed() {
  document.getElementById('filterOverlay').classList.add('hidden');
}

function filterReset() {
  fState.answers = {};
  fState.blocked = false;
  fState.warnings = [];
  fState.result = null;
  for (const cat of Object.values(fState.categories)) cat.score = 0;

  document.getElementById('fBlocker').classList.remove('vis');
  document.getElementById('fResult').classList.remove('vis');
  document.getElementById('fProgressFill').style.width = '0%';
  document.getElementById('fProgressCount').textContent = '0 / 10';
  document.getElementById('fProgressPhase').textContent = 'المرحلة النفسية';
  document.getElementById('fRrrSlider').value = 2;
  document.getElementById('fRrrVal').textContent = '1:2.0';
  document.getElementById('fRrrVal').style.color = 'var(--accent-gold)';

  document.querySelectorAll('.f-card').forEach((c, i) => {
    c.classList.remove('answered');
    c.querySelectorAll('.f-opt').forEach(b => b.classList.remove('sel','good','warn','bad'));
    if (i > 0) c.style.display = 'none';
  });

  document.getElementById('fPhase1').classList.add('active');
  document.getElementById('fPhase1').style.display = '';
  document.getElementById('fPhase2').classList.remove('active');
  document.getElementById('fPhase2').style.display = '';

  updateHeaderFilter('pending', '⏳', 'الفلتر: لم يُجرَ');
  document.querySelector('.filter-container').scrollTo({ top: 0, behavior: 'smooth' });
}

function openFilter() {
  document.getElementById('filterOverlay').classList.remove('hidden');
}

function updateHeaderFilter(cls, icon, text) {
  const el = document.getElementById('headerFilterStatus');
  el.className = 'filter-status ' + cls;
  document.getElementById('hfsIcon').textContent = icon;
  document.getElementById('hfsText').textContent = text;
}

function updateFilterSummary(pct) {
  const sc = document.getElementById('fscScore');
  const clr = pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
  sc.style.color = clr;
  sc.textContent = pct + '%';

  const bars = document.getElementById('fscBars');
  bars.innerHTML = '';
  for (const cat of Object.values(fState.categories)) {
    const cp = Math.round((cat.score / cat.max) * 100);
    const bc = cp >= 70 ? 'var(--accent-green)' : cp >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
    bars.innerHTML += `<div class="fsc-bar-row"><span class="fsc-bar-label">${cat.label}</span><div class="fsc-bar-track"><div class="fsc-bar-fill" style="width:${cp}%;background:${bc}"></div></div><span class="fsc-bar-num" style="color:${bc}">${cp}%</span></div>`;
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fState, fAnswer, fCalculateResult, filterReset };
}
