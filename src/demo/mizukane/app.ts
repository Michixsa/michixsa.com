import {
  TODAY,
  STORAGE_KEY,
  customerMap,
  esc,
  kindLabel,
  kinds,
  loadState,
  nextStatus,
  saveState,
  statusLabel,
  statuses,
  userById,
  users,
  weekDays,
  yen,
  type DemoState,
  type Job,
  type Status,
} from './model';

const customers = customerMap();
let state: DemoState = loadState();
let errorExample = false;
let confirm: { title: string; body: string; run: () => void } | null = null;
const PAGE = 20;

function role() {
  return userById(state.userId).role;
}

function canEditMoney() {
  return role() !== 'field';
}

function canExport() {
  return role() === 'admin';
}

function customerName(id: string) {
  return customers.get(id)?.name ?? '（不明）';
}

function setHash(hash: string) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || 'today';
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  return { path, params };
}

function logChange(jobId: string, what: string, before: string, after: string) {
  state.log = [
    {
      at: `${TODAY} 10:00`,
      user: userById(state.userId).name,
      jobId,
      what,
      before,
      after,
    },
    ...state.log,
  ];
}

function updateJob(id: string, patch: Partial<Job>, what: string, before: string, after: string) {
  state.jobs = state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job));
  logChange(id, what, before, after);
  saveState(state);
}

function shell(body: string) {
  const user = userById(state.userId);
  const nav = [
    ['today', '今日の対応'],
    ['list', '案件'],
    ['week', '予定'],
    ['customers', '顧客'],
    ['log', '記録'],
    ['import', '取り込み'],
  ] as const;
  return `
    <p class="banner">架空のサンプル。入力した内容はこの端末のブラウザにだけ保存されます。
      <button type="button" data-act="reset">最初の状態に戻す</button>
    </p>
    <div class="layout">
      <nav aria-label="画面">
        ${nav.map(([id, label]) => `<a href="#${id}" ${parseHash().path === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
      <div class="main">
        <div class="toolbar">
          <label>見ている人
            <select data-act="user" aria-label="見ている人">
              ${users.map((item) => `<option value="${item.id}" ${item.id === state.userId ? 'selected' : ''}>${esc(item.roleLabel)} ${esc(item.name)}</option>`).join('')}
            </select>
          </label>
          <p class="role">権限：${esc(user.roleLabel)}。実在の人の名前や電話番号は入れないでください。</p>
        </div>
        ${errorExample ? '<p class="error" role="alert">通信に失敗した例です。データは変わっていません。</p>' : ''}
        ${body}
      </div>
    </div>`;
}

function openConfirm(title: string, body: string, run: () => void) {
  confirm = { title, body, run };
  const dialog = document.getElementById('ask') as HTMLDialogElement | null;
  const heading = document.getElementById('ask-title');
  const text = document.getElementById('ask-body');
  if (!dialog || !heading || !text) return;
  heading.textContent = title;
  text.textContent = body;
  dialog.showModal();
}

function todayBody() {
  const open = state.jobs.filter((job) => job.status !== 'done' && job.status !== 'cancel');
  const due = open.filter((job) => job.due <= TODAY);
  const waiting = open.filter((job) => job.status === 'inquiry');
  const week = new Set(weekDays());
  const scheduled = open.filter((job) => week.has(job.due) && (job.status === 'working' || job.status === 'survey'));
  const rows = due.slice(0, 8);
  return `
    <h1>今日の対応</h1>
    <p>今日行く現場と、返事を待たせている問い合わせ。</p>
    <ul class="counts">
      <li><a href="#list?due=over">${due.length} 件、期限が今日か過ぎています</a></li>
      <li><a href="#list?status=inquiry">${waiting.length} 件、未対応の問い合わせ</a></li>
      <li><a href="#week">${scheduled.length} 件、今週の工事・調査</a></li>
    </ul>
    <button type="button" data-act="error">通信エラーの例を見る</button>
    ${rows.length === 0 ? '<p class="empty">今日の対応はありません。</p>' : table(rows, false)}`;
}

function filtered(params: URLSearchParams): Job[] {
  const q = (params.get('q') ?? '').trim();
  const status = params.get('status') ?? '';
  const owner = params.get('owner') ?? '';
  const kind = params.get('kind') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const due = params.get('due') ?? '';
  let jobs = state.jobs.filter((job) => {
    const customer = customers.get(job.customerId);
    const hay = `${job.id} ${customer?.name ?? ''} ${customer?.address ?? ''} ${kindLabel[job.kind]}`;
    if (q && !hay.includes(q)) return false;
    if (status && job.status !== status) return false;
    if (owner && job.ownerId !== owner) return false;
    if (kind && job.kind !== kind) return false;
    if (from && job.due < from) return false;
    if (to && job.due > to) return false;
    if (due === 'over' && job.due > TODAY) return false;
    if (due === 'over' && (job.status === 'done' || job.status === 'cancel')) return false;
    return true;
  });
  const sort = params.get('sort') ?? 'due';
  jobs = [...jobs].sort((a, b) => {
    if (sort === 'yen') return b.yen - a.yen;
    if (sort === 'status') return a.status.localeCompare(b.status);
    return a.due.localeCompare(b.due);
  });
  return jobs;
}

function table(jobs: Job[], pick: boolean) {
  const head = `<tr>${pick ? '<th scope="col">選択</th>' : ''}<th scope="col">案件</th><th scope="col">顧客</th><th scope="col">種類</th><th scope="col">状態</th><th scope="col">担当</th><th scope="col">期限</th>${canEditMoney() ? '<th scope="col">金額</th>' : ''}</tr>`;
  const body = jobs
    .map((job) => {
      const cells = [
        pick ? `<td data-label="選択"><input type="checkbox" name="pick" value="${job.id}" aria-label="${job.id} を選択"></td>` : '',
        `<td data-label="案件"><a href="#job/${job.id}">${job.id}</a></td>`,
        `<td data-label="顧客">${esc(customerName(job.customerId))}</td>`,
        `<td data-label="種類">${kindLabel[job.kind]}</td>`,
        `<td data-label="状態">${statusLabel[job.status]}</td>`,
        `<td data-label="担当">${esc(userById(job.ownerId).name)}</td>`,
        `<td data-label="期限">${job.due}</td>`,
        canEditMoney() ? `<td data-label="金額">${yen(job.yen)}</td>` : '',
      ];
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function listBody(params: URLSearchParams) {
  const jobs = filtered(params);
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const pages = Math.max(1, Math.ceil(jobs.length / PAGE));
  const slice = jobs.slice((page - 1) * PAGE, page * PAGE);
  const keep = new URLSearchParams(params);
  const link = (next: number) => {
    const copy = new URLSearchParams(keep);
    copy.set('page', String(next));
    return `#list?${copy.toString()}`;
  };
  return `
    <h1>案件</h1>
    <form class="filters" data-act="filter">
      <label>検索<input name="q" value="${esc(params.get('q') ?? '')}" placeholder="名前・住所・番号"></label>
      <label>状態<select name="status"><option value="">すべて</option>${statuses.map((item) => `<option value="${item}" ${params.get('status') === item ? 'selected' : ''}>${statusLabel[item]}</option>`).join('')}</select></label>
      <label>担当<select name="owner"><option value="">すべて</option>${users.map((item) => `<option value="${item.id}" ${params.get('owner') === item.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
      <label>種類<select name="kind"><option value="">すべて</option>${kinds.map((item) => `<option value="${item}" ${params.get('kind') === item ? 'selected' : ''}>${kindLabel[item]}</option>`).join('')}</select></label>
      <label>期限から<input type="date" name="from" value="${esc(params.get('from') ?? '')}"></label>
      <label>期限まで<input type="date" name="to" value="${esc(params.get('to') ?? '')}"></label>
      <label>並び<select name="sort">
        <option value="due" ${params.get('sort') === 'due' ? 'selected' : ''}>期限</option>
        <option value="yen" ${params.get('sort') === 'yen' ? 'selected' : ''}>金額</option>
        <option value="status" ${params.get('sort') === 'status' ? 'selected' : ''}>状態</option>
      </select></label>
      <button type="submit">絞り込む</button>
      ${canExport() ? '<button type="button" data-act="csv">CSVを書き出す</button>' : '<p>CSVの書き出しは管理者だけです。</p>'}
    </form>
    <p>${jobs.length} 件${params.get('due') === 'over' ? '（期限が今日か過ぎているもの）' : ''}</p>
    ${
      slice.length === 0
        ? '<p class="empty">該当する案件はありません。</p>'
        : `${role() !== 'field' ? `<div class="row"><label>選択した担当を変える<select data-act="bulk-user">${users.map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label><button type="button" data-act="bulk">まとめて変える</button></div>` : ''}${table(slice, role() !== 'field')}`
    }
    <p class="row">
      ${page > 1 ? `<a href="${link(page - 1)}">前の20件</a>` : ''}
      <span>${page} / ${pages}</span>
      ${page < pages ? `<a href="${link(page + 1)}">次の20件</a>` : ''}
    </p>`;
}

function detailBody(id: string) {
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return '<h1>案件</h1><p class="empty">その案件はありません。</p>';
  const customer = customers.get(job.customerId);
  const next = nextStatus(job.status);
  const history = state.log.filter((item) => item.jobId === job.id).slice(0, 8);
  return `
    <p><a href="#list">案件の一覧へ</a></p>
    <h1>${job.id}</h1>
    <p>${esc(customer?.name ?? '')}／${esc(customer?.address ?? '')}／${esc(customer?.phone ?? '')}</p>
    <form data-act="save" data-id="${job.id}">
      <label>種類<select name="kind">${kinds.map((item) => `<option value="${item}" ${job.kind === item ? 'selected' : ''}>${kindLabel[item]}</option>`).join('')}</select></label>
      <label>担当<select name="ownerId">${users.map((item) => `<option value="${item.id}" ${job.ownerId === item.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
      <label>期限<input type="date" name="due" required value="${job.due}"></label>
      <label>金額<input name="yen" inputmode="numeric" ${canEditMoney() ? '' : 'readonly'} value="${job.yen}"></label>
      <label>メモ<textarea name="memo" rows="3">${esc(job.memo)}</textarea></label>
      <p class="row"><button type="submit" class="primary">保存する</button></p>
    </form>
    <div class="row">
      ${next ? `<button type="button" data-act="advance" data-id="${job.id}" data-next="${next}">${statusLabel[next]} に進める</button>` : ''}
      ${job.status !== 'done' && job.status !== 'cancel' ? `<button type="button" data-act="cancel" data-id="${job.id}">キャンセルにする</button>` : ''}
    </div>
    <h2>この案件の記録</h2>
    ${history.length === 0 ? '<p>まだ記録はありません。</p>' : `<ul>${history.map((item) => `<li>${esc(item.at)} ${esc(item.user)}：${esc(item.what)}を ${esc(item.before)} から ${esc(item.after)}</li>`).join('')}</ul>`}`;
}

function weekBody() {
  const days = weekDays();
  const labels = ['月', '火', '水', '木', '金', '土', '日'];
  return `
    <h1>工事の予定</h1>
    <p>${days[0]} からの1週間です。${TODAY} が今日の設定です。</p>
    <div class="week">
      ${days
        .map((day, index) => {
          const items = state.jobs.filter((job) => job.due === day && job.status !== 'cancel' && job.status !== 'done');
          return `<section><h2>${labels[index]} ${day.slice(5)}</h2>${items.length === 0 ? '<p>予定なし</p>' : `<ul>${items.map((job) => `<li><a href="#job/${job.id}">${job.id}</a> ${esc(customerName(job.customerId))} ${statusLabel[job.status]}</li>`).join('')}</ul>`}</section>`;
        })
        .join('')}
    </div>`;
}

function customersBody() {
  const counts = new Map<string, number>();
  for (const job of state.jobs) counts.set(job.customerId, (counts.get(job.customerId) ?? 0) + 1);
  const rows = [...customers.values()].slice(0, 20);
  return `
    <h1>顧客</h1>
    <p>架空の顧客です。最初の20件を出しています。</p>
    <div class="table-wrap"><table><thead><tr><th scope="col">顧客</th><th scope="col">電話</th><th scope="col">住所</th><th scope="col">案件</th></tr></thead><tbody>
      ${rows
        .map(
          (item) =>
            `<tr><td data-label="顧客"><a href="#list?q=${encodeURIComponent(item.name.replace(' 様', ''))}">${esc(item.name)}</a></td><td data-label="電話">${esc(item.phone)}</td><td data-label="住所">${esc(item.address)}</td><td data-label="案件">${counts.get(item.id) ?? 0}</td></tr>`,
        )
        .join('')}
    </tbody></table></div>`;
}

function logBody() {
  return `
    <h1>操作の記録</h1>
    <ul class="log">${state.log
      .slice(0, 40)
      .map((item) => `<li>${esc(item.at)} ${esc(item.user)} ${esc(item.jobId)}：${esc(item.what)}を ${esc(item.before)} から ${esc(item.after)}</li>`)
      .join('')}</ul>`;
}

function importBody() {
  return `
    <h1>CSVの取り込み</h1>
    <p>見本です。ここでの確認は保存しません。1行目は見出し、あとは「案件番号,期限」です。期限は 2026-11-04 の形だけ受け付けます。</p>
    <form data-act="import">
      <label>貼り付ける<textarea name="csv" rows="6">案件番号,期限
K-001,2026-11-04
K-002,11月4日</textarea></label>
      <button type="submit">エラーを確認する</button>
    </form>
    <div id="import-result"></div>`;
}

function view() {
  const { path, params } = parseHash();
  if (path === 'list') return listBody(params);
  if (path.startsWith('job/')) return detailBody(path.slice(4));
  if (path === 'week') return weekBody();
  if (path === 'customers') return customersBody();
  if (path === 'log') return logBody();
  if (path === 'import') return importBody();
  return todayBody();
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = shell(view());
}

function csv(params: URLSearchParams) {
  const lines = ['案件番号,顧客,状態,担当,期限,金額'];
  for (const job of filtered(params)) {
    lines.push(
      [job.id, customerName(job.customerId), statusLabel[job.status], userById(job.ownerId).name, job.due, String(job.yen)]
        .map((cell) => `"${cell.split('"').join('""')}"`)
        .join(','),
    );
  }
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'mizukane-jobs.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function onClick(event: Event) {
  const target = event.target as HTMLElement;
  const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (act === 'reset') {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    errorExample = false;
    setHash('#today');
    return;
  }
  if (act === 'error') {
    errorExample = !errorExample;
    render();
    return;
  }
  if (act === 'csv') {
    const form = target.closest('form');
    if (!form) return;
    const data = new FormData(form);
    const next = new URLSearchParams();
    data.forEach((value, key) => next.set(key, String(value)));
    csv(next);
    return;
  }
  if (act === 'bulk') {
    const picked = [...document.querySelectorAll<HTMLInputElement>('input[name="pick"]:checked')].map((item) => item.value);
    const owner = (document.querySelector('[data-act="bulk-user"]') as HTMLSelectElement | null)?.value ?? '';
    if (picked.length === 0 || !owner) return;
    const name = userById(owner).name;
    openConfirm('担当をまとめて変える', `${picked.length} 件の担当を ${name} に変えます。`, () => {
      for (const id of picked) {
        const job = state.jobs.find((item) => item.id === id);
        if (!job || job.ownerId === owner) continue;
        updateJob(id, { ownerId: owner }, '担当', userById(job.ownerId).name, name);
      }
      render();
    });
    return;
  }
  if (act === 'advance' || act === 'cancel') {
    const id = target.closest<HTMLElement>('[data-id]')?.dataset.id ?? '';
    const job = state.jobs.find((item) => item.id === id);
    if (!job) return;
    const next = act === 'cancel' ? 'cancel' : ((target.closest<HTMLElement>('[data-next]')?.dataset.next ?? '') as Status);
    openConfirm('状態を変える', `${job.id} を ${statusLabel[job.status]} から ${statusLabel[next]} にします。`, () => {
      updateJob(id, { status: next }, '状態', statusLabel[job.status], statusLabel[next]);
      render();
    });
  }
}

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target.dataset.act === 'user') {
    state.userId = target.value;
    saveState(state);
    render();
  }
}

function onSubmit(event: Event) {
  const form = event.target as HTMLFormElement;
  const act = form.dataset.act;
  if (!act) return;
  event.preventDefault();
  if (act === 'filter') {
    const data = new FormData(form);
    const params = new URLSearchParams();
    data.forEach((value, key) => {
      if (String(value)) params.set(key, String(value));
    });
    setHash(`#list?${params.toString()}`);
    return;
  }
  if (act === 'save') {
    const id = form.dataset.id ?? '';
    const job = state.jobs.find((item) => item.id === id);
    if (!job) return;
    const data = new FormData(form);
    const due = String(data.get('due') ?? '');
    const amount = Number(String(data.get('yen') ?? '').replace(/,/g, ''));
    if (!due) return;
    if (canEditMoney() && (!Number.isFinite(amount) || amount < 0)) return;
    openConfirm('変更を保存する', `${id} の内容を保存します。この端末のブラウザにだけ残ります。`, () => {
      updateJob(
        id,
        {
          kind: String(data.get('kind')) as Job['kind'],
          ownerId: String(data.get('ownerId')),
          due,
          yen: canEditMoney() ? amount : job.yen,
          memo: String(data.get('memo') ?? ''),
        },
        '内容',
        job.due,
        due,
      );
      render();
    });
    return;
  }
  if (act === 'import') {
    const text = String(new FormData(form).get('csv') ?? '');
    const lines = text.split(/\r?\n/).slice(1).filter((line) => line.trim());
    const errors = lines.flatMap((line, index) => {
      const due = line.split(',')[1]?.trim() ?? '';
      return /^\d{4}-\d{2}-\d{2}$/.test(due) ? [] : [`${index + 2} 行目の期限「${due}」は 2026-11-04 の形ではありません。`];
    });
    const box = document.getElementById('import-result');
    if (box) {
      box.innerHTML = errors.length
        ? `<h2>取り込めない行</h2><ul>${errors.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><p>保存はしていません。</p>`
        : '<p>この見本では、問題のない行も保存しません。</p>';
    }
  }
}

function onDialog(event: Event) {
  const dialog = event.target as HTMLDialogElement;
  if (dialog.id !== 'ask' || !confirm) return;
  if (dialog.returnValue === 'ok') confirm.run();
  confirm = null;
}

export function boot() {
  const root = document.getElementById('app');
  if (!root) return;
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('submit', onSubmit);
  document.getElementById('ask')?.addEventListener('close', onDialog);
  const fresh = !localStorage.getItem(STORAGE_KEY);
  const { path } = parseHash();
  if (!fresh || (path !== 'today' && path !== '')) render();
  window.addEventListener('hashchange', render);
}
