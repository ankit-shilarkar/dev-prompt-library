import { BRAND, SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');

export const icons = {
  check: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevron: '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ── Session ──────────────────────────────────────────────
let session = null;
let isAdmin = false;
const authListeners = new Set();

export const getSession = () => session;
export const isGuest = () => !!session?.user?.is_anonymous;
export const userIsAdmin = () => isAdmin;
export const onAuthChange = fn => authListeners.add(fn);

async function refreshAdminFlag() {
  isAdmin = false;
  if (!session) return;
  const { data } = await sb.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle();
  isAdmin = !!data?.is_admin;
}

export async function initAuth() {
  const { data } = await sb.auth.getSession();
  session = data.session;
  await refreshAdminFlag();
  sb.auth.onAuthStateChange((event, next) => {
    const changed = next?.user?.id !== session?.user?.id || next?.user?.is_anonymous !== session?.user?.is_anonymous;
    session = next;
    if (!changed && event !== 'USER_UPDATED') return;
    // Supabase calls inside this callback can deadlock the client, so defer them.
    setTimeout(async () => {
      await refreshAdminFlag();
      authListeners.forEach(fn => fn(session));
    }, 0);
  });
  return session;
}

export async function startGuest() {
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error(/disabled|not enabled/i.test(error.message)
    ? 'Guest mode is not switched on yet. Ask the site owner to enable anonymous sign-ins in Supabase.'
    : error.message);
  // onAuthStateChange updates `session` and re-renders listeners; setting it here would hide the change.
  track('guest_start');
  return data.session;
}

const redirectTo = () => location.origin + location.pathname;

export async function saveProgressWithEmail(email) {
  const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: redirectTo() });
  if (error) throw error;
  track('account_saved', { props: { method: 'email' } });
}

export async function signInWithEmail(email) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo() } });
  if (error) throw error;
}

export async function signOut() {
  await flushEvents();
  await sb.auth.signOut();
}

// ── Usage events ─────────────────────────────────────────
// Only recorded for signed-in players (guests included); batched to save requests.
const queue = [];
let flushTimer;

export function track(type, data = {}) {
  queue.push({
    type,
    path: location.pathname.slice(-200),
    step_id: data.step_id ?? null,
    prompt_id: data.prompt_id ?? null,
    props: data.props ?? {},
  });
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 2000);
}

export async function flushEvents() {
  if (!queue.length) return;
  const batch = queue.splice(0);
  if (!session) return;
  const { error } = await sb.from('events').insert(batch);
  if (error) console.warn('events not recorded', error.message);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushEvents(); });

// ── UI helpers ───────────────────────────────────────────
export function toast(message, kind = '') {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  host.append(el);
  setTimeout(() => el.remove(), 3200);
}

export async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (btn) {
    const label = btn.textContent;
    btn.classList.add('copied');
    btn.textContent = 'Copied';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = label; }, 1800);
  }
}

// ── Header + account panel ───────────────────────────────
let headerSummary = null;

export function setHeaderProgress(summary) {
  headerSummary = summary;
  renderHeaderRight();
}

export function renderHeader(active) {
  const header = document.getElementById('site-header');
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  header.className = 'site-header';
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="./">${BRAND.logo}<span>${esc(BRAND.name)}</span></a>
      <nav class="nav" aria-label="Main">
        ${link('roadmap.html', 'Roadmap', 'roadmap')}
        ${link('library.html', 'Prompt library', 'library')}
        <span id="admin-link"></span>
      </nav>
      <div class="header-right" id="header-right"></div>
    </div>
    <div class="account-panel" id="account-panel" popover></div>`;
  renderHeaderRight(active);
  onAuthChange(() => renderHeaderRight(active));
}

function renderHeaderRight(active) {
  const right = document.getElementById('header-right');
  if (!right) return;
  const adminSlot = document.getElementById('admin-link');
  if (adminSlot) adminSlot.innerHTML = isAdmin ? `<a href="admin.html"${active === 'admin' ? ' aria-current="page"' : ''}>Admin</a>` : '';

  const s = headerSummary;
  const chip = session && s ? `
    <a class="xp-chip" href="roadmap.html" title="Level ${s.level} · ${s.xp} XP">
      <span class="lvl">${s.level}</span>
      <span class="meta"><span>${s.xp} XP</span><span class="bar"><i style="--fill:${s.levelPct / 100}"></i></span></span>
    </a>` : '';
  const label = !session ? 'Sign in' : isGuest() ? 'Guest' : 'Account';
  right.innerHTML = `${chip}<button class="btn btn-small" type="button" popovertarget="account-panel">${label}</button>`;
  renderAccountPanel();
}

function renderAccountPanel() {
  const panel = document.getElementById('account-panel');
  const privacy = '<p class="fine">We store your progress, activity logs and page usage to improve this course. Only you and the course admin can see them. Keep personal details out of your answers.</p>';
  if (!session) {
    panel.innerHTML = `
      <h2>Start your quest</h2>
      <p>Play as a guest: no sign-up, progress saves instantly. You can attach an email later.</p>
      <button class="btn btn-primary" type="button" data-act="guest" style="width:100%">Start as guest</button>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      <h2>Already saved progress?</h2>
      <form data-form="signin">
        <label for="signin-email">Email</label>
        <input id="signin-email" type="email" required autocomplete="email" placeholder="you@college.edu">
        <button class="btn" type="submit">Email me a sign-in link</button>
      </form>${privacy}`;
  } else if (isGuest()) {
    panel.innerHTML = `
      <h2>You're playing as a guest</h2>
      <p>Your progress lives on this browser only. Add your email to keep it if you clear your browser or switch devices.</p>
      <form data-form="save">
        <label for="save-email">Email</label>
        <input id="save-email" type="email" required autocomplete="email" placeholder="you@college.edu">
        <button class="btn btn-primary" type="submit">Save my progress</button>
      </form>
      <button class="btn btn-quiet btn-small" type="button" data-act="signout">Sign out (guest progress will be lost)</button>${privacy}`;
  } else {
    panel.innerHTML = `
      <h2>Your account</h2>
      <p>Signed in as <b>${esc(session.user.email)}</b>. Your progress syncs across devices.</p>
      <button class="btn" type="button" data-act="signout">Sign out</button>${privacy}`;
  }
  panel.onclick = async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'guest') {
      try { await startGuest(); panel.hidePopover(); toast('Quest started. Your progress now saves automatically.'); }
      catch (err) { toast(err.message); }
    }
    if (act === 'signout') {
      if (isGuest() && !confirm('Guest progress cannot be recovered after signing out. Sign out anyway?')) return;
      await signOut();
      panel.hidePopover();
    }
  };
  panel.onsubmit = async e => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value.trim();
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      if (form.dataset.form === 'save') await saveProgressWithEmail(email);
      else await signInWithEmail(email);
      form.innerHTML = `<p>Check <b>${esc(email)}</b> for a link from us. Open it on this device to finish.</p>`;
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
    }
  };
}

export function renderFooter() {
  const footer = document.getElementById('site-footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap">
      <span>Built by Ankit · Prompt Playbook patterns by <a href="https://kunalganglani.com" target="_blank" rel="noopener">Kunal Ganglani</a> · Roadmap format inspired by <a href="https://roadmap.sh" target="_blank" rel="noopener">roadmap.sh</a></span>
      <a href="${BRAND.repoUrl}" target="_blank" rel="noopener">Source on GitHub</a>
    </div>`;
}

export async function bootPage(active) {
  renderHeader(active);
  renderFooter();
  await initAuth();
  renderHeaderRight(active);
  if (session) track('page_view');
  return session;
}
