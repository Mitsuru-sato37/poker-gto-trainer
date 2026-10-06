import { PLAY_THROUGH_HANDS, PROBLEMS } from './data/problems.js';
import {
  SESSION_STORAGE_KEY,
  advanceSession,
  createReviewSession,
  createSession,
  getCurrentAnswer,
  getCurrentItem,
  recordAnswer,
  restoreSession,
  serializeSession,
} from './session.js';
import { HISTORY_STORAGE_KEY, getMistakeEntries, recordHistory, restoreHistory, serializeHistory } from './history.js';

const catalog = { problems: PROBLEMS, hands: PLAY_THROUGH_HANDS };
const app = document.querySelector('#app');
const savedSession = restoreSession(window.localStorage.getItem(SESSION_STORAGE_KEY));
const SUSPENDED_SESSION_STORAGE_KEY = 'poker-gto-trainer.mock-suspended-session.v1';
const savedHistory = restoreHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
const appState = {
  screen: 'home',
  session: savedSession,
  suspendedSession: restoreSession(window.localStorage.getItem(SUSPENDED_SESSION_STORAGE_KEY)),
  history: savedHistory,
  feedback: null,
};

const metrics = {
  today: 0,
  total: 380,
  bestRate: 64,
  acceptableRate: 89,
  averageEvLoss: '-0.04',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function persist() {
  if (appState.session) window.localStorage.setItem(SESSION_STORAGE_KEY, serializeSession(appState.session));
}

function persistHistory() {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(appState.history));
}

function resetViewport() {
  if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function current() {
  return getCurrentItem(appState.session, catalog);
}

function startSession(type) {
  appState.suspendedSession = null;
  window.localStorage.removeItem(SUSPENDED_SESSION_STORAGE_KEY);
  appState.session = createSession(type, catalog);
  appState.feedback = null;
  appState.screen = 'question';
  persist();
  render();
}

function startReview() {
  const reviewSession = createReviewSession(appState.history, catalog);
  if (!reviewSession) return;
  if (appState.session?.status === 'in-progress' && appState.session.type !== 'REVIEW') {
    appState.suspendedSession = appState.session;
    window.localStorage.setItem(SUSPENDED_SESSION_STORAGE_KEY, serializeSession(appState.session));
  }
  appState.session = reviewSession;
  appState.feedback = null;
  appState.screen = 'question';
  persist();
  render();
}

function continueSession() {
  if (!appState.session) return;
  const currentAnswer = getCurrentAnswer(appState.session);
  appState.feedback = currentAnswer
    ? { itemIndex: appState.session.currentIndex, actionId: currentAnswer.selectedAction, item: appState.session.items[appState.session.currentIndex] }
    : null;
  appState.screen = currentAnswer ? 'feedback' : 'question';
  render();
}

function selectAction(actionId) {
  if (appState.screen !== 'question' || appState.feedback) return;
  const { problem, item } = current();
  const action = problem.availableActions.find((entry) => entry.id === actionId);
  if (!action) return;
  const answer = {
    problemId: problem.id,
    sessionId: appState.session.id,
    selectedAction: action.id,
    solverFrequency: action.frequency,
    selectedActionEv: action.ev,
    bestActionEv: Math.max(...problem.availableActions.map((entry) => entry.ev)),
    evLoss: action.evLoss,
    evaluation: action.evaluation,
    endsHand: action.id === 'fold' || Boolean(item.terminal),
    isFirstAttempt: true,
    answeredAt: new Date().toISOString(),
  };
  appState.session = recordAnswer(appState.session, answer);
  appState.history = recordHistory(appState.history, { ...answer, problemSnapshot: problem, sessionMode: appState.session.type });
  persistHistory();
  appState.feedback = { itemIndex: appState.session.currentIndex, actionId: action.id, item };
  appState.screen = 'feedback';
  persist();
  render();
}

function nextItem() {
  if (!appState.session || !appState.feedback) return;
  appState.session = advanceSession(appState.session);
  appState.feedback = null;
  appState.screen = appState.session.status === 'complete' ? 'result' : 'question';
  persist();
  render();
}

function showNewSession() {
  appState.screen = 'new-session';
  appState.feedback = null;
  render();
}

function goHome() {
  if (appState.session?.type === 'REVIEW' && appState.suspendedSession) {
    appState.session = appState.suspendedSession;
    appState.suspendedSession = null;
    window.localStorage.removeItem(SUSPENDED_SESSION_STORAGE_KEY);
    persist();
  }
  appState.screen = 'home';
  appState.feedback = null;
  render();
}

function evaluationClass(evaluation) {
  return String(evaluation).toLowerCase();
}

function localizeHistoryLabel(label) {
  return String(label)
    .replace(/ folds?/gu, ': FOLD')
    .replace(/ calls?/gu, ': CALL')
    .replace(/ raises?/gu, ': RAISE')
    .replace(/ bets?/gu, ': BET');
}

function localizeStreet(street) {
  return { preflop: 'プリフロップ', flop: 'フロップ', turn: 'ターン', river: 'リバー' }[street] ?? street;
}

function localizeActionLabel(label) {
  return String(label)
    .replace(/^FOLD/iu, 'フォールド')
    .replace(/^CHECK/iu, 'チェック')
    .replace(/^CALL/iu, 'コール')
    .replace(/^BET/iu, 'ベット')
    .replace(/^RAISE/iu, 'レイズ');
}

function renderHeader(back = false) {
  return `<header class="topbar">
    ${back ? '<button class="icon-button" data-action="home" aria-label="ホームに戻る">‹</button>' : '<span class="brand-mark" aria-hidden="true">+</span>'}
    <div class="topbar-title">GTOトレーナー <span>· MVPモック</span></div>
    <button class="icon-button" data-action="home" aria-label="ホーム">⌂</button>
  </header>`;
}

function renderHome() {
  const hasResume = appState.session?.status === 'in-progress';
  const mistakeCount = getMistakeEntries(appState.history).length;
  const progress = hasResume ? `${appState.session.currentIndex + 1} / ${appState.session.items.length}` : '';
  return `${renderHeader()}
    <main class="screen home-screen">
      ${hasResume ? `<section class="resume-card">
        <div><span class="eyebrow">セッション進行中</span><strong>${escapeHtml(appState.session.modeLabel)}</strong><span class="muted">問題 ${progress}</span></div>
        <button class="button button-primary" data-action="continue">続きから</button>
      </section>` : ''}
      <section class="intro"><span class="eyebrow">今日</span><h1>意思決定を鍛える。<br><em>結果に振り回されない。</em></h1><p>GTOの反復練習と、次に活かせるフィードバック。</p></section>
      <section class="metric-grid" aria-label="トレーニング概要">
        <div class="metric-card"><span class="eyebrow">今日</span><strong>${appState.history.length}</strong><span class="muted">問題</span></div>
        <div class="metric-card"><span class="eyebrow">新規問題の累計</span><strong>${metrics.total}</strong><span class="muted">問題</span></div>
        <div class="metric-card"><span class="eyebrow">BEST</span><strong>${metrics.bestRate}%</strong><span class="muted">アクションの質</span></div>
        <div class="metric-card"><span class="eyebrow">許容範囲</span><strong>${metrics.acceptableRate}%</strong><span class="muted">レンジ内</span></div>
      </section>
      <section class="loss-strip"><span>平均EV損失</span><strong>${metrics.averageEvLoss} BB</strong><span class="status-dot good"></span></section>
      <button class="button button-primary button-large" data-action="new-session">新しく始める <span aria-hidden="true">→</span></button>
      <section class="quiet-link"><span>${mistakeCount ? `${mistakeCount}問を復習できます。` : '復習は独立したモードです。'}</span>${mistakeCount ? '<button class="text-button" data-action="review">ミスを復習 →</button>' : '<button class="text-button" aria-disabled="true" data-action="unavailable">準備中</button>'}</section>
    </main>`;
}

function renderNewSession() {
  const modes = [
    ['RANDOM', '10問', '練習セットから未出題のスポットを出題します。'],
    ['PREFLOP', '10問', 'オープンとディフェンスの土台を鍛えます。'],
    ['FLOP+', '10問', 'フロップ・ターン・リバーだけを練習します。'],
    ['PLAY_THROUGH', '3ハンド', '1つのハンドを通りごとに追いかけます。'],
  ];
  return `${renderHeader(true)}
    <main class="screen">
      <section class="page-heading"><span class="eyebrow">新しいセッション</span><h1>練習モードを<br><em>選択してください。</em></h1><p>新しい問題と復習は分けて管理します。</p></section>
      <section class="mode-list" aria-label="セッションモード">
        ${modes.map(([type, label, description]) => `<button class="mode-card" data-session-type="${type}">
          <span class="mode-number">${type === 'PLAY_THROUGH' ? '04' : `0${modes.findIndex((mode) => mode[0] === type) + 1}`}</span><span class="mode-copy"><strong>${type === 'PLAY_THROUGH' ? 'ハンドを通して練習' : type === 'RANDOM' ? 'ランダム' : type === 'PREFLOP' ? 'プリフロップ' : 'フロップ+'}</strong><span>${label}</span><small>${description}</small></span><span class="mode-arrow" aria-hidden="true">→</span>
        </button>`).join('')}
        <div class="mode-card disabled"><span class="mode-number">05</span><span class="mode-copy"><strong>カスタム練習</strong><span>準備中</span><small>ポジション、ボード、レンジを指定して練習します。</small></span><span class="tag">近日公開</span></div>
      </section>
    </main>`;
}

function renderProblemSummary(problem, item) {
  const handLabel = item.handId ? `ハンド ${item.handId.split('-').at(-1)} · 判断 ${item.decisionIndex + 1}` : `${appState.session.currentIndex + 1} / ${appState.session.items.length}`;
  const history = problem.actionHistory.map((entry, index) => {
    const tone = entry.label.toLowerCase().includes('fold') ? 'fold' : entry.label.toLowerCase().includes('call') ? 'call' : entry.label.toLowerCase().includes('raise') || entry.label.toLowerCase().includes('bet') ? 'aggressive' : 'neutral';
    const previous = problem.actionHistory[index - 1];
    const streetLabel = entry.street && entry.street !== previous?.street ? `<div class="history-street"><span>${escapeHtml(localizeStreet(entry.street))}</span></div>` : '';
    return `${streetLabel}<div class="history-step history-${tone}"><span class="history-marker">${String(index + 1).padStart(2, '0')}</span><span class="history-actor">${escapeHtml(entry.actor)}</span><strong>${escapeHtml(localizeHistoryLabel(entry.label))}</strong></div>`;
  }).join('');
  return `<div class="question-meta"><span class="eyebrow">${handLabel}</span><span class="progress-track"><span style="width:${((appState.session.currentIndex + 1) / appState.session.items.length) * 100}%"></span></span></div>
    <div class="spot-line"><strong>${problem.heroPosition} <span>対</span> ${problem.villainPosition}</strong><span>${problem.potType} · ${problem.stackSize}BB</span></div>
    ${problem.dataSource ? `<div class="data-source"><span class="status-dot"></span>実Solver検証済み · ${escapeHtml(problem.solutionId)}</div>` : '<div class="data-source warning"><span class="status-dot"></span>仮データ（GTOではありません）</div>'}
    <div class="hero-card">
      <div><span class="eyebrow">ボード</span><strong class="board">${problem.board.length ? problem.board.map(escapeHtml).join(' ') : 'プリフロップ'}</strong></div>
      <div class="pot-stat"><span class="eyebrow">ポット</span><strong>${problem.potSize} BB</strong></div>
    </div>
    <div class="hero-hand"><div><span class="eyebrow">ヒーロー · ${problem.heroPosition}</span><strong>${escapeHtml(problem.heroHand)}</strong></div><span class="stack-chip">残り ${problem.stackSize - 2.5} BB</span></div>
    <div class="history"><div class="history-heading"><span class="eyebrow">アクションの流れ</span><span class="history-count">${problem.actionHistory.length}アクション</span></div><div class="history-timeline">${history}<div class="history-current"><span class="history-marker">現在</span><span class="history-actor">${escapeHtml(problem.heroPosition)}</span><strong>あなたの判断</strong></div></div></div>`;
}

function renderQuestion() {
  const { problem, item } = current();
  return `${renderHeader(true)}
    <main class="screen question-screen">
      ${renderProblemSummary(problem, item)}
      <section class="decision-prompt"><span class="eyebrow">あなたの判断</span><h1>どうしますか？</h1></section>
      <section class="action-list" aria-label="選択できるアクション">
        ${problem.availableActions.map((entry) => `<button class="action-button action-${escapeHtml(entry.id)}" data-action-id="${escapeHtml(entry.id)}"><span>${escapeHtml(localizeActionLabel(entry.label))}</span><small>${entry.potPercentage ? `${entry.potPercentage}%ポット` : 'ポットをコントロール'}</small></button>`).join('')}
      </section>
    </main>`;
}

function renderFrequencyRows(problem, selectedAction) {
  return problem.availableActions.map((entry) => `<div class="strategy-row ${entry.id === selectedAction.id ? 'selected' : ''}">
    <div class="strategy-label"><span>${entry.id === selectedAction.id ? '✓' : ''} ${escapeHtml(localizeActionLabel(entry.label))}</span><strong>${Math.round(entry.frequency * 100)}%</strong></div>
    <div class="frequency-track"><span style="width:${entry.frequency * 100}%"></span></div>
    <div class="strategy-detail"><span>EV ${entry.ev.toFixed(2)} BB</span><span>損失 ${entry.evLoss.toFixed(2)} BB</span></div>
  </div>`).join('');
}

function renderRange(problem) {
  const cells = problem.rangeData.flat();
  return `<section class="range-section"><div class="section-heading"><div><span class="eyebrow">代表的なコンボ</span><h2>近いハンド</h2></div><button class="text-button" aria-disabled="true" data-action="unavailable">全レンジ表示は準備中</button></div><p class="range-explainer">ここに表示しているのは、今回のハンドと比較しやすい代表的なコンボです。GTOレンジ全体の一覧ではありません。</p><div class="range-legend"><span><i class="legend-swatch hero"></i>今回のハンド</span><span><i class="legend-swatch"></i>比較用のコンボ</span></div>${cells.length ? `<div class="range-grid">${cells.map((cell) => `<span class="range-cell ${cell === problem.heroHand ? 'hero' : ''}">${escapeHtml(cell)}</span>`).join('')}</div>` : '<div class="range-unavailable">この問題では代表コンボをまだ表示できません。</div>'}</section>`;
}

function renderFeedback() {
  const { problem, item } = current();
  const selectedAction = problem.availableActions.find((entry) => entry.id === appState.feedback.actionId);
  const isSolverBacked = Boolean(problem.dataSource);
  return `${renderHeader(true)}
    <main class="screen feedback-screen">
      <div class="feedback-summary"><strong>${escapeHtml(problem.heroHand)}</strong><span>${problem.board.join(' ') || 'プリフロップ'} · ポット ${problem.potSize}BB</span><span>${escapeHtml(localizeHistoryLabel(problem.actionHistory[0].label))}</span>${problem.dataSource ? '<span class="data-source">実Solver検証済み</span>' : ''}</div>
      <div class="evaluation-banner ${evaluationClass(selectedAction.evaluation)}"><span class="evaluation-icon">${selectedAction.evaluation === 'BEST' ? '✓✓' : selectedAction.evaluation === 'GOOD' ? '✓' : '×'}</span><div><span class="eyebrow">あなたの選択</span><strong>${escapeHtml(localizeActionLabel(selectedAction.label))}</strong></div><span class="evaluation-word">${selectedAction.evaluation}</span></div>
      <section class="strategy-section"><div class="section-heading"><div><span class="eyebrow">${isSolverBacked ? 'GTO戦略' : '仮データ（GTOではありません）'}</span><h2>${isSolverBacked ? '混合戦略' : '表示例'}</h2></div><span class="muted">${problem.potSize} BBポット</span></div>${renderFrequencyRows(problem, selectedAction)}</section>
      <section class="ev-callout"><span class="eyebrow">EV損失</span><strong>${selectedAction.evLoss === 0 ? '0.00' : `-${selectedAction.evLoss.toFixed(2)}`} BB</strong><span>アクションEV ${selectedAction.ev.toFixed(2)} BB · 最大 ${Math.max(...problem.availableActions.map((entry) => entry.ev)).toFixed(2)} BB</span></section>
      <section class="why-card"><span class="eyebrow">理由</span><p>${escapeHtml(problem.whyText)}</p><button class="text-button" aria-disabled="true" data-action="unavailable">詳しく見る</button></section>
      ${renderRange(problem)}
      <div class="bottom-action"><button class="button button-primary button-large" data-action="next">${appState.session.currentIndex === appState.session.items.length - 1 ? '結果を見る' : '次へ'} <span aria-hidden="true">→</span></button></div>
    </main>`;
}

function resultStats() {
  const answers = appState.session.answers;
  return {
    best: answers.filter((answer) => answer.evaluation === 'BEST').length,
    acceptable: answers.filter((answer) => answer.evaluation === 'BEST' || answer.evaluation === 'GOOD').length,
    mistake: answers.filter((answer) => answer.evaluation === 'MISTAKE').length,
    averageLoss: answers.length ? (answers.reduce((sum, answer) => sum + answer.evLoss, 0) / answers.length).toFixed(2) : '0.00',
  };
}

function renderResult() {
  const stats = resultStats();
  const isPlayThrough = appState.session.type === 'PLAY_THROUGH';
  return `${renderHeader(false)}
    <main class="screen result-screen">
      <section class="result-heading"><span class="eyebrow">セッション完了</span><h1>${isPlayThrough ? 'ハンドをプレイしました。' : 'お疲れさまでした。'}</h1><p>${escapeHtml(appState.session.modeLabel)}</p></section>
      <section class="result-hero"><strong>${isPlayThrough ? appState.session.handCount : appState.session.items.length}</strong><span>${isPlayThrough ? 'ハンド' : '新しい問題'}</span>${isPlayThrough ? `<div class="decision-count"><strong>${appState.session.decisionCount}</strong><span>判断</span></div>` : ''}</section>
      <section class="result-grid"><div><span class="eyebrow">BEST</span><strong>${stats.best} / ${appState.session.answers.length}</strong></div><div><span class="eyebrow">GOOD</span><strong>${stats.acceptable} / ${appState.session.answers.length}</strong></div><div><span class="eyebrow">MISTAKE</span><strong>${stats.mistake} / ${appState.session.answers.length}</strong></div><div><span class="eyebrow">平均EV損失</span><strong>-${stats.averageLoss} BB</strong></div></section>
      <div class="result-actions"><button class="button button-primary button-large" data-action="new-session">新しく始める <span aria-hidden="true">→</span></button>${getMistakeEntries(appState.history).length ? '<button class="button button-secondary" data-action="review">ミスを復習</button>' : '<button class="button button-secondary" aria-disabled="true" data-action="unavailable">ミスを復習</button>'}<button class="text-button" data-action="home">ホームに戻る</button></div>
    </main>`;
}

function render() {
  if (!app) return;
  if (appState.screen === 'home') app.innerHTML = renderHome();
  if (appState.screen === 'new-session') app.innerHTML = renderNewSession();
  if (appState.screen === 'question') app.innerHTML = renderQuestion();
  if (appState.screen === 'feedback') app.innerHTML = renderFeedback();
  if (appState.screen === 'result') app.innerHTML = renderResult();
  resetViewport();
  app.querySelectorAll('[data-action="new-session"]').forEach((button) => button.addEventListener('click', showNewSession));
  app.querySelectorAll('[data-action="continue"]').forEach((button) => button.addEventListener('click', continueSession));
  app.querySelectorAll('[data-action="review"]').forEach((button) => button.addEventListener('click', startReview));
  app.querySelectorAll('[data-action="home"]').forEach((button) => button.addEventListener('click', goHome));
  app.querySelectorAll('[data-action="next"]').forEach((button) => button.addEventListener('click', nextItem));
  app.querySelectorAll('[data-action="unavailable"]').forEach((button) => button.addEventListener('click', () => {}));
  app.querySelectorAll('[data-session-type]').forEach((button) => button.addEventListener('click', () => startSession(button.dataset.sessionType)));
  app.querySelectorAll('[data-action-id]').forEach((button) => button.addEventListener('click', () => selectAction(button.dataset.actionId)));
  const focusTarget = app.querySelector('h1') ?? app.querySelector('main');
  if (focusTarget) {
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }
}

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
