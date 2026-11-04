import {
  TODAY,
  customerMap,
  esc,
  flow,
  kindLabel,
  statusLabel,
  userById,
  users,
  weekDays,
  yen,
  type DemoState,
  type Job,
  type Kind,
  type Status,
} from './model';

const customerBook = customerMap();
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const PAGE = 12;

export interface Route {
  path: string;
  params: URLSearchParams;
}

export function jobName(job: Job): string {
  return job.alias || customerBook.get(job.customerId)?.name || '（不明）';
}

export function jobPlace(job: Job): string {
  const address = job.place || customerBook.get(job.customerId)?.address || '';
  return address.replace('〒000-0000 ', '');
}

export function fmt(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const holiday = iso === '2026-11-03' ? '・祝' : '';
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}（${weekdays[date.getUTCDay()]}${holiday}）`;
}

export function dueHtml(iso: string): string {
  if (iso < TODAY) {
    return `<span class="due late"><svg aria-hidden="true" viewBox="0 0 12 12"><path d="M6 1l5 10H1z"/><path d="M6 5v2.5M6 9v.01"/></svg>${fmt(iso)} 期限切れ</span>`;
  }
  if (iso === TODAY) return `<span class="due today">${fmt(iso)} 今日まで</span>`;
  return `<span class="due">${fmt(iso)}</span>`;
}

const badgeIcon: Record<Status, string> = {
  inquiry: '<circle cx="6" cy="6" r="4"/>',
  estimate: '<rect x="2" y="2" width="8" height="8" rx="1"/>',
  won: '<path d="M2 6l3 3 5-6"/>',
  working: '<path d="M6 1v10M1 6h10"/>',
  done: '<path d="M2 6l3 3 5-6"/><circle cx="6" cy="6" r="5"/>',
  hold: '<path d="M4 2v8M8 2v8"/>',
};

const badgeClass: Record<Status, string> = {
  inquiry: 'b-inq',
  estimate: 'b-est',
  won: 'b-won',
  working: 'b-wip',
  done: 'b-done',
  hold: 'b-hold',
};

export function badge(status: Status): string {
  return `<span class="badge ${badgeClass[status]}"><svg aria-hidden="true" viewBox="0 0 12 12">${badgeIcon[status]}</svg>${statusLabel[status]}</span>`;
}

function icon(path: string): string {
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${path}</svg>`;
}

const icons = {
  today: icon('<path d="M3 12l9-8 9 8M5 10v10h14V10"/>'),
  list: icon('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  week: icon('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
  log: icon('<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>'),
  people: icon('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/>'),
  csv: icon('<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'),
  more: icon('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
};

function nav(current: string): string {
  const item = (id: string, label: string, mark: string) =>
    `<a class="nv${current === id ? ' on' : ''}" href="#${id}"${current === id ? ' aria-current="page"' : ''}>${mark}<span>${label}</span></a>`;
  return `<aside class="side" aria-label="メニュー"><div class="brand"><span class="mark" aria-hidden="true"></span><span><b>みずかね設備</b><small>案件管理</small></span></div><nav>${item('today', '今日の対応', icons.today)}${item('list', '案件', icons.list)}${item('week', '予定', icons.week)}${item('log', '操作の記録', icons.log)}<p class="sd-h">設定</p>${item('customers', '顧客', icons.people)}${item('import', 'CSV 取り込み', icons.csv)}</nav>${me()}</aside>`;
}

function me(): string {
  const user = userById(currentUser);
  return `<div class="me"><span class="av" aria-hidden="true">${esc(user.name.slice(0, 1))}</span><span>${esc(user.name)}<small>${esc(user.roleLabel)}</small></span></div>`;
}

let currentUser = 'u5';

export function tabbar(current: string): string {
  const item = (id: string, label: string, mark: string) =>
    `<a class="nv${current === id ? ' on' : ''}" href="#${id}"${current === id ? ' aria-current="page"' : ''}>${mark}<span>${label}</span></a>`;
  const moreOn = current === 'more' || current === 'customers' || current === 'import';
  return `${item('today', '今日の対応', icons.today)}${item('list', '案件', icons.list)}${item('week', '予定', icons.week)}${item('log', '操作の記録', icons.log)}<a class="nv${moreOn ? ' on' : ''}" href="#more"${moreOn ? ' aria-current="page"' : ''}>${icons.more}<span>その他</span></a>`;
}

function searchBox(value: string): string {
  return `<label class="search">${icons.search}<span class="sr">案件を検索</span><input type="search" name="q" value="${esc(value)}" placeholder="検索" data-long="案件番号・顧客名・住所で検索"></label>`;
}

function top(title: string, extra: string, query: string): string {
  return `<header class="top"><div class="top-l">${extra}<h1>${title}</h1></div><div class="top-r">${searchBox(query)}<a class="btn p" href="#new">＋ 案件を登録</a></div></header>`;
}

function openJobs(state: DemoState): Job[] {
  return state.jobs.filter((job) => job.status !== 'done' && job.status !== 'hold');
}

export function counts(state: DemoState) {
  const open = openJobs(state);
  const week = new Set(weekDays());
  const late = open.filter((job) => job.due <= TODAY);
  const inquiry = state.jobs.filter((job) => job.status === 'inquiry');
  const weekWork = open.filter((job) => week.has(job.due) && (job.status === 'working' || job.status === 'estimate'));
  const quotes = state.jobs.filter((job) => job.status === 'estimate');
  const days = weekDays();
  return { late, inquiry, weekWork, quotes, days };
}

function dash(state: DemoState, error: boolean): string {
  const { late, inquiry, weekWork, quotes, days } = counts(state);
  const sites = state.jobs
    .filter((job) => job.due === TODAY && job.status !== 'inquiry' && job.status !== 'done' && job.status !== 'hold')
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);
  const waiting = state.jobs.filter((job) => job.status === 'inquiry').slice(0, 6);
  const alert = error
    ? `<div class="alert err" role="alert"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v.01"/></svg><div><b>データを読み込めませんでした。</b><p>通信が切れたか、時間がかかっています。入力した内容は消えていません。</p></div><button type="button" class="btn sm" data-act="reload">もう一度読み込む</button></div>`
    : '';
  return `${top('今日の対応', `<p class="date">${fmt(TODAY)}</p>`, '')}<main class="content">${alert}<ul class="kpis"><li><a class="kpi k-danger" href="#list?card=late"><span class="kpi-l">期限切れ・今日まで</span><span class="kpi-n">${late.length}<small>件</small></span><span class="kpi-s">すぐに確認が必要な案件</span></a></li><li><a class="kpi k-info" href="#list?status=inquiry"><span class="kpi-l">未対応の問い合わせ</span><span class="kpi-n">${inquiry.length}<small>件</small></span><span class="kpi-s">返事を待たせている</span></a></li><li><a class="kpi k-ok" href="#list?card=week"><span class="kpi-l">今週の工事・調査</span><span class="kpi-n">${weekWork.length}<small>件</small></span><span class="kpi-s">${fmt(days[0]).slice(0, -3)}〜${fmt(days[6]).slice(0, -3)}</span></a></li><li><a class="kpi k-neutral" href="#list?status=estimate"><span class="kpi-l">見積の返事待ち</span><span class="kpi-n">${quotes.length}<small>件</small></span><span class="kpi-s">お客様の返事を待っている</span></a></li></ul><div class="cols"><section class="panel"><header class="ph"><h2>今日の現場</h2><a href="#week">予定を見る</a></header><ol class="sched">${sites
    .map(
      (job) =>
        `<li><span class="tm">${job.time}</span><div><p class="row1"><a href="#job/${job.id}">${job.id}</a>${badge(job.status)}</p><p class="ttl">${esc(jobName(job))}・${esc(job.topic)}</p><p class="sub">${esc(jobPlace(job))}｜担当 ${esc(userById(job.ownerId).name)}</p></div></li>`,
    )
    .join('') || '<li><p>今日の現場はありません。</p></li>'}</ol></section><section class="panel"><header class="ph"><h2>返事待ちの問い合わせ</h2><a href="#list?status=inquiry">すべて見る</a></header><ul class="inq">${waiting
    .map(
      (job) =>
        `<li><div><p class="row1"><a href="#job/${job.id}">${job.id}</a>${dueHtml(job.due)}</p><p class="ttl">${esc(jobName(job))}・${esc(job.topic)}</p></div><a class="btn sm" href="#job/${job.id}">対応する</a></li>`,
    )
    .join('') || '<li><p>返事待ちはありません。</p></li>'}</ul></section></div></main>`;
}

function listJobs(state: DemoState, params: URLSearchParams): Job[] {
  const q = (params.get('q') ?? '').trim();
  const status = params.get('status') ?? '';
  const owner = params.get('owner') ?? '';
  const card = params.get('card') ?? '';
  const week = new Set(weekDays());
  let jobs = state.jobs.filter((job) => {
    const hay = `${job.id} ${jobName(job)} ${jobPlace(job)} ${job.topic}`;
    if (q && !hay.includes(q)) return false;
    if (status && job.status !== status) return false;
    if (owner && job.ownerId !== owner) return false;
    if (card === 'late' && (job.due > TODAY || job.status === 'done' || job.status === 'hold')) return false;
    if (card === 'week' && (!week.has(job.due) || (job.status !== 'working' && job.status !== 'estimate'))) return false;
    return true;
  });
  const sort = params.get('sort') ?? 'due';
  jobs = [...jobs].sort((a, b) => (sort === 'new' ? b.id.localeCompare(a.id) : a.due.localeCompare(b.due) || a.time.localeCompare(b.time)));
  return jobs;
}

function chips(state: DemoState, params: URLSearchParams): string {
  const current = params.get('status') ?? '';
  const counts = new Map<string, number>();
  for (const job of state.jobs) counts.set(job.status, (counts.get(job.status) ?? 0) + 1);
  const one = (id: string, label: string, n: number) => {
    const on = current === id;
    const next = new URLSearchParams(params);
    if (id) next.set('status', id);
    else next.delete('status');
    next.delete('page');
    return `<a class="chip${on ? ' on' : ''}" href="#list?${next.toString()}" role="button" aria-pressed="${on ? 'true' : 'false'}">${label}<span class="cn">${n}</span></a>`;
  };
  return `<div class="chips" role="group" aria-label="状態で絞り込む">${one('', 'すべて', state.jobs.length)}${(['inquiry', 'estimate', 'won', 'working', 'done', 'hold'] as Status[]).map((id) => one(id, statusLabel[id], counts.get(id) ?? 0)).join('')}</div>`;
}

function list(state: DemoState, params: URLSearchParams, picked: string[]): string {
  const jobs = listJobs(state, params);
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const pages = Math.max(1, Math.ceil(jobs.length / PAGE));
  const slice = jobs.slice((page - 1) * PAGE, page * PAGE);
  const link = (n: number) => {
    const copy = new URLSearchParams(params);
    copy.set('page', String(n));
    return `#list?${copy.toString()}`;
  };
  const admin = userById(currentUser).role === 'admin';
  const canBulk = userById(currentUser).role !== 'field';
  const empty = slice.length === 0;
  const used = [params.get('status') ? statusLabel[params.get('status') as Status] : '', params.get('q') ?? '', params.get('owner') ? userById(params.get('owner') ?? '').name : '']
    .filter(Boolean)
    .map((item) => `「${item}」`)
    .join('かつ');
  const table = `<div class="tbl-wrap"><table class="tbl"><caption class="sr">案件の一覧</caption><thead><tr><th class="ck"><input type="checkbox" data-act="all" aria-label="表示中をすべて選ぶ"></th><th>案件</th><th>顧客・現場</th><th>種類</th><th>状態</th><th>担当</th><th>期限</th><th class="num">金額（税込）</th></tr></thead><tbody>${slice
    .map((job) => {
      const on = picked.includes(job.id);
      return `<tr class="${on ? 'sel' : ''}"><td class="ck"><label class="hit"><input type="checkbox" name="pick" value="${job.id}" ${on ? 'checked' : ''} aria-label="${job.id}を選ぶ"></label></td><td><a class="id" href="#job/${job.id}">${job.id}</a></td><td><span class="ttl">${esc(jobName(job))}</span><span class="sub">${esc(jobPlace(job))}</span></td><td>${esc(job.topic)}</td><td>${badge(job.status)}</td><td>${esc(userById(job.ownerId).name)}</td><td>${dueHtml(job.due)}</td><td class="num">${userById(currentUser).role === 'field' ? '—' : yen(job.yen)}</td></tr>`;
    })
    .join('')}</tbody></table></div>`;
  const cards = `<ul class="mcards">${slice
    .map(
      (job) =>
        `<li><a class="mc" href="#job/${job.id}"><span class="row1"><span class="id">${job.id}</span>${badge(job.status)}</span><span class="ttl">${esc(jobName(job))}・${esc(job.topic)}</span><span class="sub">${esc(jobPlace(job))}</span><span class="row3">${dueHtml(job.due)}<span>担当 ${esc(userById(job.ownerId).name)}</span></span></a></li>`,
    )
    .join('')}</ul>`;
  const bulk =
    picked.length && canBulk
      ? `<div class="bulk" role="status"><b>${picked.length}件を選択中</b><label class="sel-f">担当<select data-act="bulk-user">${users.map((user) => `<option value="${user.id}">${esc(user.name)}</option>`).join('')}</select></label><button type="button" class="btn sm" data-act="bulk">担当を変える</button><button type="button" class="lnk" data-act="clear">選択を外す</button></div>`
      : '';
  return `${top('案件', '', params.get('q') ?? '')}<main class="content"><div class="toolbar">${chips(state, params)}<div class="filters"><label class="sel-f">担当<select data-act="owner"><option value="">全員</option>${users.map((user) => `<option value="${user.id}" ${params.get('owner') === user.id ? 'selected' : ''}>${esc(user.name)}</option>`).join('')}</select></label><label class="sel-f">並び<select data-act="sort"><option value="due" ${params.get('sort') !== 'new' ? 'selected' : ''}>期限が近い順</option><option value="new" ${params.get('sort') === 'new' ? 'selected' : ''}>登録が新しい順</option></select></label>${admin ? '<button type="button" class="btn csv" data-act="csv">CSV 書き出し</button>' : ''}</div></div>${bulk}${
    empty
      ? `<div class="empty"><svg aria-hidden="true" viewBox="0 0 48 48"><rect x="8" y="10" width="32" height="28" rx="3"/><path d="M8 18h32M16 26h16M16 31h10"/></svg><h2>条件に合う案件はありません</h2><p>${used || '今の条件'}で探しましたが、見つかりませんでした。条件を減らしてみてください。</p><a class="btn" href="#list">条件をすべて外す</a></div>`
      : `${table}${cards}<nav class="pager" aria-label="ページ"><span>${jobs.length}件中 ${(page - 1) * PAGE + 1}〜${Math.min(page * PAGE, jobs.length)}件</span><span class="pg">${page > 1 ? `<a href="${link(page - 1)}" aria-label="前のページ">‹</a>` : ''}${Array.from({ length: pages }, (_, i) => `<a href="${link(i + 1)}" ${i + 1 === page ? 'aria-current="page"' : ''}>${i + 1}</a>`).join('')}${page < pages ? `<a href="${link(page + 1)}" aria-label="次のページ">›</a>` : ''}</span></nav>`
  }</main>`;
}

function detail(state: DemoState, id: string): string {
  const fresh = id === 'new';
  const job = fresh
    ? ({
        id: 'new',
        customerId: 'C-001',
        kind: 'water' as Kind,
        status: 'inquiry' as Status,
        ownerId: currentUser,
        due: TODAY,
        yen: 0,
        memo: '',
        time: '9:00',
        topic: '給水管',
      } satisfies Job)
    : state.jobs.find((item) => item.id === id);
  if (!job) return `${top('案件の詳細', '', '')}<main class="content"><div class="empty"><h2>その案件はありません</h2><a class="btn" href="#list">一覧へ戻る</a></div></main>`;
  const money = userById(currentUser).role !== 'field';
  const next = job.status === 'hold' ? job.heldFrom ?? 'inquiry' : nextOf(job.status);
  const nextLabel = job.status === 'hold' ? '戻す' : next ? `${statusLabel[next]}にする →` : '';
  const history = state.log.filter((item) => item.jobId === job.id).slice(0, 8);
  const step = flow
    .map((status, index) => {
      const at = flow.indexOf(job.status);
      const cls = job.status === 'hold' ? '' : index < at ? 'dn' : index === at ? 'cu' : '';
      return `<li class="${cls}"><span class="dot" aria-hidden="true">${cls === 'dn' ? '✓' : index + 1}</span>${statusLabel[status]}${cls === 'cu' ? '<span class="sr">（現在）</span>' : ''}</li>`;
    })
    .join('');
  return `${top('案件の詳細', `<p class="crumb"><a href="#list">案件</a> ／ ${fresh ? '新しい案件' : job.id}</p>`, '')}<main class="content"><div class="dt-head"><div><p class="row1"><span class="id lg">${fresh ? '新しい案件' : job.id}</span>${fresh ? '' : badge(job.status)}${fresh ? '' : dueHtml(job.due)}</p><h2 class="dt-t">${esc(jobName(job))}・${esc(job.topic)}</h2><p class="sub">${esc(jobPlace(job))}｜担当 ${esc(userById(job.ownerId).name)}</p></div><div class="dt-act"><button type="button" class="btn" data-act="save">編集を保存</button>${nextLabel ? `<button type="button" class="btn p" data-act="advance" data-id="${job.id}">${nextLabel}</button>` : ''}${job.status !== 'hold' && job.status !== 'inquiry' && job.status !== 'done' ? `<button type="button" class="btn" data-act="back" data-id="${job.id}">一段戻す</button>` : ''}${job.status !== 'hold' && job.status !== 'done' ? `<button type="button" class="btn" data-act="hold" data-id="${job.id}">保留にする</button>` : ''}</div></div><ol class="stepper" aria-label="進み具合">${step}</ol><div class="cols dt"><section class="panel"><header class="ph"><h2>案件の内容</h2></header><form class="form" id="job-form" data-id="${job.id}"><div class="g2"><label class="fld"><span>顧客 <em>必須</em></span><input name="alias" required value="${esc(jobName(job))}"></label><label class="fld"><span>電話</span><input name="phone" value="${esc(customerBook.get(job.customerId)?.phone ?? '000-0000-0000')}" inputmode="tel"></label></div><label class="fld"><span>現場の住所 <em>必須</em></span><input name="place" required value="${esc(jobPlace(job))}"></label><div class="g3"><label class="fld"><span>種類</span><select name="kind">${(['water', 'air', 'check'] as Kind[]).map((kind) => `<option value="${kind}" ${job.kind === kind ? 'selected' : ''}>${kindLabel[kind]}</option>`).join('')}</select></label><label class="fld"><span>担当</span><select name="ownerId">${users.map((user) => `<option value="${user.id}" ${job.ownerId === user.id ? 'selected' : ''}>${esc(user.name)}</option>`).join('')}</select></label><label class="fld"><span>期限</span><input type="date" name="due" required value="${job.due}"></label></div><label class="fld"><span>内容の短い名前</span><input name="topic" value="${esc(job.topic)}"></label><label class="fld" id="yen-field"><span>見積金額（税込）</span><input name="yen" inputmode="numeric" ${money ? '' : 'readonly'} value="${job.yen}" aria-describedby="yen-err"></label><p id="yen-err" class="ferr" hidden><svg aria-hidden="true" viewBox="0 0 12 12"><path d="M6 1l5 10H1z"/></svg>数字だけで入力してください（例：240000）</p><label class="fld"><span>内容</span><textarea name="memo" rows="3">${esc(job.memo)}</textarea></label><p class="sub">実在の人の名前や電話番号は入れないでください。</p></form></section><section class="panel"><header class="ph"><h2>履歴</h2></header><ol class="hist">${history.map((item) => `<li><span class="tm">${esc(item.at)}</span><p><b>${esc(item.user)}</b> ${esc(item.what)}：${esc(item.before)} → ${esc(item.after)}</p></li>`).join('') || '<li><p>まだ記録はありません。</p></li>'}</ol></section></div></main>`;
}

function nextOf(status: Status): Status | null {
  const index = flow.indexOf(status);
  if (index < 0 || index === flow.length - 1) return null;
  return flow[index + 1];
}

function week(state: DemoState, anchor: string, day: string, mode: 'week' | 'day'): string {
  const days = weekDays(anchor);
  const selected = days.includes(day) ? day : days.includes(TODAY) ? TODAY : days[0];
  const holiday = (iso: string) => iso === '2026-11-03' || new Date(`${iso}T00:00:00Z`).getUTCDay() % 6 === 0;
  const head = days
    .map((iso) => `<div class="wk-h${iso === TODAY ? ' td' : ''}${holiday(iso) ? ' ho' : ''}">${fmt(iso)}</div>`)
    .join('');
  const order = ['u5', 'u1', 'u2', 'u3', 'u4'];
  const rows = order
    .map((id) => {
      const user = userById(id);
      const cells = days
        .map((iso) => {
          const items = state.jobs.filter((job) => job.ownerId === id && job.due === iso && job.status !== 'hold');
          return `<div class="wk-c${iso === TODAY ? ' td' : ''}${holiday(iso) ? ' ho' : ''}">${items
            .slice(0, 3)
            .map(
              (job) =>
                `<a class="ev ${badgeClass[job.status] === 'b-inq' ? 'e-inq' : badgeClass[job.status] === 'b-est' ? 'e-est' : badgeClass[job.status] === 'b-won' ? 'e-won' : badgeClass[job.status] === 'b-wip' ? 'e-wip' : 'e-done'}" href="#job/${job.id}"><span class="tm">${job.time}</span><span>${job.id} ${esc(job.topic)}</span><span class="sr">（${statusLabel[job.status]}）</span></a>`,
            )
            .join('')}</div>`;
        })
        .join('');
      return `<div class="wk-u"><b>${esc(user.name)}</b><small>${esc(user.roleLabel)}</small></div>${cells}`;
    })
    .join('');
  const dayJobs = state.jobs.filter((job) => job.due === selected && job.status !== 'hold').sort((a, b) => a.time.localeCompare(b.time));
  const prev = shift(anchor, -7);
  const next = shift(anchor, 7);
  return `${top('予定', '', '')}<main class="content"><div class="wk-bar"><div class="seg" role="group" aria-label="表示"><button type="button" data-act="mode" data-mode="day" aria-pressed="${mode === 'day' ? 'true' : 'false'}">日</button><button type="button" data-act="mode" data-mode="week" aria-pressed="${mode === 'week' ? 'true' : 'false'}">週</button></div><div class="wk-nav"><a class="btn sm" href="#week?anchor=${prev}" aria-label="前の週">‹</a><b>${fmt(days[0])}〜${fmt(days[6])}</b><a class="btn sm" href="#week?anchor=${next}" aria-label="次の週">›</a><a class="btn sm" href="#week">今週</a><label class="sel-f">日付<input type="date" data-act="pick" value="${selected}"></label></div><p class="legend">${badge('inquiry')}${badge('estimate')}${badge('won')}${badge('working')}${badge('done')}</p></div><div class="wk" role="table" aria-label="担当者ごとの週の予定"><div class="wk-h"></div>${head}${rows}</div><div class="wk-sp"><div class="days" role="tablist">${days.map((iso) => `<button type="button" role="tab" data-act="day" data-day="${iso}" aria-selected="${iso === selected ? 'true' : 'false'}"><b>${iso.slice(5).replace('-', '/')}</b><small>${weekdays[new Date(`${iso}T00:00:00Z`).getUTCDay()]}</small></button>`).join('')}</div><ol class="sched">${dayJobs
    .map(
      (job) =>
        `<li><span class="tm">${job.time}</span><a href="#job/${job.id}">${job.id} ${esc(job.topic)}</a>${badge(job.status)}<span class="sub">担当 ${esc(userById(job.ownerId).name)}</span></li>`,
    )
    .join('') || '<li><p>この日の予定はありません。</p></li>'}</ol></div></main>`;
}

function shift(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function logView(state: DemoState, params: URLSearchParams): string {
  const kind = params.get('kind') ?? '';
  const person = params.get('user') ?? '';
  const items = state.log.filter((item) => {
    if (kind && (item.kind ?? 'status') !== kind) return false;
    if (person && item.user !== userById(person).name && item.user !== person) return false;
    return true;
  });
  const chip = (id: string, label: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('kind', id);
    else next.delete('kind');
    const on = kind === id;
    return `<a class="chip${on ? ' on' : ''}" href="#log?${next.toString()}" aria-pressed="${on ? 'true' : 'false'}">${label}</a>`;
  };
  return `${top('操作の記録', '', '')}<main class="content"><div class="toolbar"><div class="chips" role="group" aria-label="操作の種類">${chip('', 'すべて')}${chip('status', '状態の変更')}${chip('edit', '登録・編集')}${chip('csv', 'CSV')}</div><div class="filters"><label class="sel-f">人<select data-act="log-user"><option value="">全員</option>${users.map((user) => `<option value="${user.id}" ${person === user.id ? 'selected' : ''}>${esc(user.name)}</option>`).join('')}</select></label></div></div><div class="tbl-wrap"><table class="tbl"><caption class="sr">操作の記録</caption><thead><tr><th>日時</th><th>操作した人</th><th>操作</th><th>対象</th><th>内容</th></tr></thead><tbody>${items
    .slice(0, 40)
    .map(
      (item) =>
        `<tr><td class="tm">${esc(item.at)}</td><td>${esc(item.user)}</td><td>${esc(item.what)}</td><td><a href="#job/${item.jobId}">${esc(item.jobId)}</a></td><td>${esc(item.before)} → ${esc(item.after)}</td></tr>`,
    )
    .join('')}</tbody></table></div><ol class="hist mlog">${items
    .slice(0, 40)
    .map(
      (item) =>
        `<li><span class="tm">${esc(item.at)}</span><p><b>${esc(item.user)}</b> ${esc(item.what)}：<a href="#job/${item.jobId}">${esc(item.jobId)}</a></p><p class="sub">${esc(item.before)} → ${esc(item.after)}</p></li>`,
    )
    .join('')}</ol></main>`;
}

function customerPage(state: DemoState): string {
  const tally = new Map<string, number>();
  for (const job of state.jobs) tally.set(job.customerId, (tally.get(job.customerId) ?? 0) + 1);
  const rows = [...customerBook.values()].slice(0, 20);
  return `${top('顧客', '', '')}<main class="content"><p class="sub">架空の顧客です。最初の20件です。</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>顧客</th><th>電話</th><th>住所</th><th>案件</th></tr></thead><tbody>${rows
    .map(
      (item) =>
        `<tr><td><a href="#list?q=${encodeURIComponent(item.name)}">${esc(item.name)}</a></td><td>${esc(item.phone)}</td><td>${esc(item.address)}</td><td>${tally.get(item.id) ?? 0}</td></tr>`,
    )
    .join('')}</tbody></table></div></main>`;
}

function importer(): string {
  return `${top('CSV 取り込み', '', '')}<main class="content"><p>見本です。確認しても保存しません。1行目は見出し、あとは「案件番号,期限」です。期限は 2026-11-04 の形だけ受け付けます。</p><form id="import-form"><label class="fld"><span>貼り付ける</span><textarea name="csv" rows="6">案件番号,期限
K-001,2026-11-04
K-002,11月4日</textarea></label><button class="btn" type="submit">エラーを確認する</button></form><div id="import-result"></div></main>`;
}

function more(): string {
  const user = userById(currentUser);
  return `${top('その他', '', '')}<main class="content"><section class="panel"><ul class="inq"><li><a href="#customers">顧客</a></li><li><a href="#import">CSV 取り込み</a></li><li><button type="button" class="btn" data-act="error">通信エラーの例を見る</button></li></ul></section><label class="fld"><span>見ている人</span><select data-act="user">${users.map((item) => `<option value="${item.id}" ${item.id === user.id ? 'selected' : ''}>${esc(item.roleLabel)} ${esc(item.name)}</option>`).join('')}</select></label><p class="sub">権限によって、金額の編集と CSV の書き出しが変わります。実在の人の情報は入れないでください。</p></main>`;
}

export function appHtml(state: DemoState, route: Route, extras: { error: boolean; picked: string[]; userId: string }): string {
  currentUser = extras.userId;
  const { path, params } = route;
  let main = dash(state, extras.error);
  if (path === 'list') main = list(state, params, extras.picked);
  else if (path.startsWith('job/')) main = detail(state, path.slice(4));
  else if (path === 'new') main = detail(state, 'new');
  else if (path === 'week') main = week(state, params.get('anchor') || TODAY, params.get('day') || TODAY, params.get('mode') === 'day' ? 'day' : 'week');
  else if (path === 'log') main = logView(state, params);
  else if (path === 'customers') main = customerPage(state);
  else if (path === 'import') main = importer();
  else if (path === 'more') main = more();
  const current = path.startsWith('job') || path === 'new' ? 'list' : path === 'today' || path === '' ? 'today' : path;
  return `${nav(current)}<div class="main">${main}</div>`;
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '') || 'today';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}
