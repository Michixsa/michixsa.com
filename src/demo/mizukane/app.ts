import {
  STORAGE_KEY,
  esc,
  kindLabel,
  loadState,
  nextStatus,
  prevStatus,
  saveState,
  seedState,
  statusLabel,
  userById,
  yen,
  type DemoState,
  type Job,
  type Status,
} from './model';
import { appHtml, jobName, parseRoute, tabbar } from './view';

let state: DemoState = loadState();
let picked: string[] = [];
let errorExample = false;
let undo: { jobs: Job[]; logLength: number } | null = null;

function route() {
  return parseRoute(location.hash);
}

function render() {
  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');
  if (!app || !tabs) return;
  const current = route();
  app.innerHTML = appHtml(state, current, { error: errorExample, picked, userId: state.userId });
  const path = current.path.startsWith('job') || current.path === 'new' ? 'list' : current.path || 'today';
  tabs.innerHTML = tabbar(path);
  const box = app.querySelector<HTMLInputElement>('input[type="search"]');
  if (box && window.matchMedia('(min-width: 768px)').matches) box.placeholder = box.dataset.long || box.placeholder;
}

function snapshot() {
  undo = { jobs: state.jobs.map((job) => ({ ...job })), logLength: state.log.length };
}

function toast(message: string, withUndo = false) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.innerHTML = `<span>${esc(message)}</span>${withUndo ? '<button type="button" data-act="undo">元に戻す</button>' : ''}`;
  node.hidden = false;
  window.setTimeout(() => {
    if (!node.hidden) node.hidden = true;
  }, 4000);
}

function log(jobId: string, what: string, before: string, after: string, kind: 'status' | 'edit' | 'csv') {
  state.log = [{ at: '11/4 10:00', user: userById(state.userId).name, jobId, what, before, after, kind }, ...state.log];
}

function remember(id: string, patch: Partial<Job>, what: string, before: string, after: string, kind: 'status' | 'edit' | 'csv') {
  snapshot();
  state.jobs = state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job));
  log(id, what, before, after, kind);
  saveState(state);
}

function ask(title: string, body: string, ok: string, danger: boolean, run: () => void) {
  const dialog = document.getElementById('ask') as HTMLDialogElement | null;
  const heading = document.getElementById('ask-title');
  const text = document.getElementById('ask-body');
  const button = document.getElementById('ask-ok');
  if (!dialog || !heading || !text || !button) return;
  heading.textContent = title;
  text.textContent = body;
  button.textContent = ok;
  button.className = danger ? 'btn danger' : 'btn p';
  dialog.returnValue = '';
  dialog.showModal();
  dialog.onclose = () => {
    if (dialog.returnValue === 'ok') run();
  };
}

function onClick(event: Event) {
  const target = event.target as HTMLElement;
  const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (act === 'reset') {
    ask(
      '最初の状態に戻しますか？',
      'この端末で入力・変更した内容がすべて消え、サンプルの最初の内容に戻ります。',
      '消して戻す',
      true,
      () => {
        localStorage.removeItem(STORAGE_KEY);
        state = seedState();
        picked = [];
        errorExample = false;
        location.hash = '#today';
        render();
      },
    );
    return;
  }
  if (act === 'error') {
    errorExample = true;
    location.hash = '#today';
    render();
    return;
  }
  if (act === 'reload') {
    errorExample = false;
    render();
    toast('読み込み直しました。');
    return;
  }
  if (act === 'undo' && undo) {
    state.jobs = undo.jobs;
    state.log = state.log.slice(state.log.length - undo.logLength);
    saveState(state);
    undo = null;
    render();
    return;
  }
  if (act === 'clear') {
    picked = [];
    render();
    return;
  }
  if (act === 'csv') {
    if (userById(state.userId).role !== 'admin') return;
    const jobs = state.jobs;
    const lines = ['案件番号,顧客,状態,担当,期限,金額'];
    for (const job of jobs) {
      lines.push([job.id, jobName(job), statusLabel[job.status], userById(job.ownerId).name, job.due, String(job.yen)].map((cell) => `"${cell.split('"').join('""')}"`).join(','));
    }
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mizukane-jobs.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    log('一覧', 'CSV を書き出し', `${jobs.length}件`, `${jobs.length}件`, 'csv');
    saveState(state);
    toast(`${jobs.length}件を書き出しました。`);
    return;
  }
  if (act === 'bulk') {
    const owner = (document.querySelector('[data-act="bulk-user"]') as HTMLSelectElement | null)?.value ?? '';
    if (!owner || picked.length === 0) return;
    snapshot();
    const name = userById(owner).name;
    for (const id of picked) {
      const job = state.jobs.find((item) => item.id === id);
      if (!job || job.ownerId === owner) continue;
      const before = userById(job.ownerId).name;
      state.jobs = state.jobs.map((item) => (item.id === id ? { ...item, ownerId: owner } : item));
      log(id, '担当を変更', before, name, 'edit');
    }
    saveState(state);
    picked = [];
    render();
    toast('担当を変えました。', true);
    return;
  }
  if (act === 'save') {
    saveForm();
    return;
  }
  if (act === 'back') {
    const id = target.closest<HTMLElement>('[data-id]')?.dataset.id ?? '';
    const job = state.jobs.find((item) => item.id === id);
    const prev = job ? prevStatus(job.status) : null;
    if (!job || !prev) return;
    ask(`「${statusLabel[prev]}」に戻しますか？`, `${job.id} の状態を「${statusLabel[job.status]}」から「${statusLabel[prev]}」に戻します。操作の記録に残ります。`, '戻す', false, () => {
      remember(job.id, { status: prev }, '状態', statusLabel[job.status], statusLabel[prev], 'status');
      render();
    });
    return;
  }
  if (act === 'advance' || act === 'hold') {
    const id = target.closest<HTMLElement>('[data-id]')?.dataset.id ?? route().path.replace('job/', '');
    const job = state.jobs.find((item) => item.id === id);
    if (!job) return;
    if (act === 'hold') {
      ask('保留にしますか？', '期限の通知を止めます。', '保留にする', false, () => {
        remember(job.id, { status: 'hold', heldFrom: job.status }, '状態', statusLabel[job.status], '保留', 'status');
        render();
      });
      return;
    }
    const next: Status | null = job.status === 'hold' ? job.heldFrom ?? 'inquiry' : nextStatus(job.status);
    if (!next) return;
    const title = next === 'done' ? '「完了」にしますか？' : job.status === 'hold' ? `「${statusLabel[next]}」に戻しますか？` : `「${statusLabel[next]}」に変更しますか？`;
    const body =
      next === 'done'
        ? '完了にすると、今日の対応と予定から外れます。あとから戻せます。'
        : `${job.id} ${jobName(job)}（${kindLabel[job.kind]}）の状態を「${statusLabel[job.status]}」から「${statusLabel[next]}」に変えます。担当の${userById(job.ownerId).name}さんの予定に表示され、操作の記録に残ります。`;
    const ok = next === 'done' ? '完了にする' : job.status === 'hold' ? '戻す' : `${statusLabel[next]}にする`;
    ask(title, body, ok, false, () => {
      remember(job.id, { status: next, heldFrom: undefined }, '状態', statusLabel[job.status], statusLabel[next], 'status');
      render();
    });
  }
}

function saveForm() {
  const form = document.getElementById('job-form') as HTMLFormElement | null;
  if (!form) return;
  const data = new FormData(form);
  const alias = String(data.get('alias') ?? '').trim();
  const place = String(data.get('place') ?? '').trim();
  const due = String(data.get('due') ?? '');
  const amount = Number(String(data.get('yen') ?? '').replace(/,/g, ''));
  const field = document.getElementById('yen-field');
  const err = document.getElementById('yen-err');
  const input = form.querySelector<HTMLInputElement>('[name="yen"]');
  const money = userById(state.userId).role !== 'field';
  if (!alias || !place || !due || (money && (!Number.isFinite(amount) || amount < 0))) {
    field?.classList.add('invalid');
    if (input) input.setAttribute('aria-invalid', 'true');
    if (err) err.hidden = false;
    return;
  }
  const id = form.dataset.id ?? '';
  const patch = {
    alias,
    place,
    due,
    kind: String(data.get('kind')) as Job['kind'],
    ownerId: String(data.get('ownerId')),
    topic: String(data.get('topic') ?? ''),
    memo: String(data.get('memo') ?? ''),
    yen: money ? amount : state.jobs.find((job) => job.id === id)?.yen ?? 0,
  };
  if (id === 'new') {
    snapshot();
    const job: Job = {
      id: `K-${String(state.jobs.length + 1).padStart(3, '0')}`,
      customerId: 'C-001',
      status: 'inquiry',
      time: '9:00',
      ...patch,
    };
    state.jobs = [job, ...state.jobs];
    log(job.id, '案件を登録', '—', alias, 'edit');
    saveState(state);
    location.hash = `#job/${job.id}`;
    toast(`${job.id} を登録しました。`, true);
    return;
  }
  const before = state.jobs.find((job) => job.id === id);
  remember(id, patch, '内容を保存', before ? yen(before.yen) : '', money ? yen(patch.yen) : '', 'edit');
  toast(`${id} を保存しました。`, true);
  render();
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.dataset.act === 'user') {
    state.userId = target.value;
    saveState(state);
    render();
    return;
  }
  if (target.dataset.act === 'owner' || target.dataset.act === 'sort' || target.dataset.act === 'log-user') {
    const params = route().params;
    const key = target.dataset.act === 'sort' ? 'sort' : target.dataset.act === 'log-user' ? 'user' : 'owner';
    if (target.value) params.set(key, target.value);
    else params.delete(key);
    const base = target.dataset.act === 'log-user' ? 'log' : 'list';
    location.hash = `#${base}?${params.toString()}`;
    return;
  }
  if (target.dataset.act === 'pick' || target.name === 'pick') {
    picked = [...document.querySelectorAll<HTMLInputElement>('input[name="pick"]:checked')].map((item) => item.value);
    render();
    return;
  }
  if (target.dataset.act === 'all') {
    const boxes = [...document.querySelectorAll<HTMLInputElement>('input[name="pick"]')];
    picked = target.checked ? boxes.map((item) => item.value) : [];
    render();
    return;
  }
  if (target.dataset.act === 'pick-date' || target.dataset.act === 'pick') {
    const params = route().params;
    params.set('anchor', target.value);
    params.set('day', target.value);
    location.hash = `#week?${params.toString()}`;
  }
}

function onSubmit(event: Event) {
  const form = event.target as HTMLFormElement;
  if (form.id === 'import-form') {
    event.preventDefault();
    const text = String(new FormData(form).get('csv') ?? '');
    const lines = text.split(/\r?\n/).slice(1).filter((line) => line.trim());
    const errors = lines.flatMap((line, index) => {
      const due = line.split(',')[1]?.trim() ?? '';
      return /^\d{4}-\d{2}-\d{2}$/.test(due) ? [] : [`${index + 2} 行目の期限「${due}」は 2026-11-04 の形ではありません。`];
    });
    const box = document.getElementById('import-result');
    if (box) {
      box.innerHTML = errors.length
        ? `<div class="alert err" role="alert"><div><b>取り込めない行があります。</b><p>${errors.map((item) => esc(item)).join('<br>')}</p><p>保存はしていません。</p></div></div>`
        : '<p>この見本では、問題のない行も保存しません。</p>';
    }
    return;
  }
  if ((event.target as HTMLElement).closest?.('.search')) {
    event.preventDefault();
  }
}

function onSearch(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.type !== 'search') return;
  if (event.type === 'change' || (event as KeyboardEvent).key === 'Enter') {
    location.hash = `#list?q=${encodeURIComponent(input.value)}`;
  }
}

export function boot() {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest('a');
    if (link?.getAttribute('href')?.startsWith('#')) return;
    onClick(event);
  });
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', (event) => {
    if ((event.target as HTMLInputElement).type === 'search' && event.key === 'Enter') {
      event.preventDefault();
      onSearch(event);
    }
  });
  document.addEventListener('click', (event) => {
    const day = (event.target as HTMLElement).closest<HTMLElement>('[data-act="day"]');
    if (!day) return;
    const params = route().params;
    params.set('day', day.dataset.day ?? '');
    params.set('mode', 'day');
    location.hash = `#week?${params.toString()}`;
  });
  document.addEventListener('click', (event) => {
    const mode = (event.target as HTMLElement).closest<HTMLElement>('[data-act="mode"]');
    if (!mode) return;
    const params = route().params;
    params.set('mode', mode.dataset.mode ?? 'week');
    location.hash = `#week?${params.toString()}`;
  });
  const fresh = !localStorage.getItem(STORAGE_KEY);
  const path = route().path;
  if (!fresh || (path !== 'today' && path !== '')) render();
  window.addEventListener('hashchange', () => {
    picked = [];
    render();
  });
}
