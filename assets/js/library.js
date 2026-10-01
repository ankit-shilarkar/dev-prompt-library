import { bootPage, esc, icons, safeUrl, getSession, track, copyText, onAuthChange } from './core.js';
import { PLAYBOOK_SOURCE } from './config.js';
import { loadPrompts } from './prompts-store.js';
import { syncHeaderProgress } from './progress.js';

const SECTIONS = [
  { key: 'original', title: 'Original library', color: 'var(--hue-original)' },
  { key: 'badge-foundation', title: 'Playbook · Foundation', color: 'var(--hue-foundation)' },
  { key: 'badge-reference', title: 'Playbook · Reference', color: 'var(--hue-reference)' },
  { key: 'badge-pro', title: 'Playbook · Pro patterns', color: 'var(--hue-pro)' },
  { key: 'badge-daily', title: 'Playbook · Daily use', color: 'var(--hue-daily)' },
];
const PURPOSES = [['build', 'Build'], ['review', 'Review'], ['debug', 'Debug'], ['learn', 'Learn'], ['plan', 'Plan'], ['write', 'Write'], ['interview', 'Interview prep']];

let prompts = [];
const state = { collection: 'all', category: 'all', purpose: 'all', q: '' };
const open = new Set();

const $ = id => document.getElementById(id);
const sectionOf = p => (p.source === PLAYBOOK_SOURCE ? p.tag_class : 'original');
const colorOf = p => SECTIONS.find(s => s.key === sectionOf(p))?.color || 'var(--ink-2)';
const inCollection = p => state.collection === 'all' || (state.collection === 'playbook') === (p.source === PLAYBOOK_SOURCE);

function matches(p) {
  if (!inCollection(p)) return false;
  if (state.category !== 'all' && p.category_slug !== state.category) return false;
  if (state.purpose !== 'all' && !p.purpose.includes(state.purpose)) return false;
  if (!state.q) return true;
  const hay = [p.title, p.preview, p.purpose_note, p.tag_label, p.chapter, p.prompt_text,
    ...p.examples.map(e => `${e.title} ${e.best_for}`)].join(' ').toLowerCase();
  return state.q.split(/\s+/).every(t => hay.includes(t));
}

function filterButton(kind, value, label, count) {
  const pressed = state[kind] === value;
  return `<li><button type="button" data-kind="${kind}" data-value="${esc(value)}" aria-pressed="${pressed}">
    <span>${esc(label)}</span>${count === undefined ? '' : `<span class="n">${count}</span>`}</button></li>`;
}

function renderFilters() {
  const playbookCount = prompts.filter(p => p.source === PLAYBOOK_SOURCE).length;
  const visible = prompts.filter(inCollection);
  const categoryGroups = SECTIONS.map(section => {
    const cats = new Map();
    visible.filter(p => sectionOf(p) === section.key).forEach(p => {
      const c = cats.get(p.category_slug) || { label: p.tag_label, n: 0 };
      c.n++;
      cats.set(p.category_slug, c);
    });
    if (!cats.size) return '';
    return `<li class="filter-group-title">${esc(section.title)}</li>${[...cats].map(([slug, c]) => filterButton('category', slug, c.label, c.n)).join('')}`;
  }).join('');

  $('filters').innerHTML = `
    <section><h2>Collection</h2><ul class="filter-list">
      ${filterButton('collection', 'all', 'All prompts', prompts.length)}
      ${filterButton('collection', 'original', 'Original library', prompts.length - playbookCount)}
      ${filterButton('collection', 'playbook', 'Prompt Playbook', playbookCount)}
    </ul></section>
    <section><h2>Purpose</h2><ul class="filter-list">
      ${filterButton('purpose', 'all', 'Any purpose')}
      ${PURPOSES.map(([v, l]) => filterButton('purpose', v, l)).join('')}
    </ul></section>
    <section><h2>Category</h2><ul class="filter-list">
      ${filterButton('category', 'all', 'All categories')}
      ${categoryGroups}
    </ul></section>`;
}

function rowHtml(p) {
  const isOpen = open.has(p.id);
  const url = safeUrl(p.source_url);
  const source = url ? `<a class="source" href="${esc(url)}" target="_blank" rel="noopener">Source: ${esc(p.source)}</a>` : `<span class="source">Source: ${esc(p.source)}</span>`;
  const examples = p.examples.length ? `
    <p class="detail-label">Examples</p>
    <div class="examples">
      ${p.examples.map((ex, i) => `
        <div class="example">
          <h4>${esc(ex.title)}</h4>
          ${ex.best_for ? `<p class="best">Best for: ${esc(ex.best_for)}</p>` : ''}
          <pre class="prompt-text">${esc(ex.prompt)}</pre>
          <div class="detail-actions"><button class="btn btn-small" type="button" data-copy="${p.id}" data-example="${i}">Copy example</button></div>
        </div>`).join('')}
    </div>` : '';
  return `
    <li class="prompt-row${isOpen ? ' open' : ''}" id="p-${p.id}" style="--cat-color:${colorOf(p)}">
      <button type="button" data-toggle="${p.id}" aria-expanded="${isOpen}" aria-controls="d-${p.id}">
        <h3>${esc(p.title)}</h3>
        <span class="chev">${icons.chevron}</span>
        <span class="preview">${esc(p.preview)}</span>
        <span class="tags"><span class="cat">${esc(p.tag_label)}</span>${p.purpose.map(x => `<span>${esc(x)}</span>`).join('')}</span>
      </button>
      <div class="prompt-detail" id="d-${p.id}">
        <p class="when-note"><b>When to use:</b> ${esc(p.purpose_note)}</p>
        <p class="detail-label">Prompt template</p>
        <pre class="prompt-text">${esc(p.prompt_text)}</pre>
        <div class="detail-actions">
          <button class="btn btn-small btn-primary" type="button" data-copy="${p.id}">Copy prompt</button>
          ${source}
        </div>
        ${examples}
      </div>
    </li>`;
}

function renderList() {
  const list = prompts.filter(matches);
  $('results-count').innerHTML = `Showing <b>${list.length}</b> of ${prompts.length}`;
  $('prompt-list').innerHTML = list.length
    ? list.map(rowHtml).join('')
    : '<li class="empty"><h2>No prompts match</h2><p>Try fewer words, or reset the filters on the left.</p></li>';
}

function render() {
  renderFilters();
  renderList();
}

function openFromHash() {
  const id = Number(location.hash.match(/^#p-(\d+)$/)?.[1]);
  if (!id || !prompts.some(p => p.id === id)) return;
  Object.assign(state, { collection: 'all', category: 'all', purpose: 'all', q: '' });
  $('search').value = '';
  open.add(id);
  render();
  document.getElementById(`p-${id}`)?.scrollIntoView({ block: 'start' });
}

document.addEventListener('click', e => {
  const filter = e.target.closest('[data-kind]');
  if (filter) {
    state[filter.dataset.kind] = filter.dataset.value;
    if (filter.dataset.kind === 'collection') state.category = 'all';
    render();
    return;
  }

  const copyBtn = e.target.closest('[data-copy]');
  if (copyBtn) {
    const p = prompts.find(x => x.id === Number(copyBtn.dataset.copy));
    const ex = copyBtn.dataset.example;
    copyText(ex === undefined ? p.prompt_text : p.examples[Number(ex)].prompt, copyBtn);
    if (getSession()) track(ex === undefined ? 'prompt_copy' : 'example_copy', { prompt_id: p.id });
    return;
  }

  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const id = Number(toggle.dataset.toggle);
    const row = toggle.parentElement;
    const isOpen = !open.has(id);
    isOpen ? open.add(id) : open.delete(id);
    row.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    if (isOpen && getSession()) track('prompt_open', { prompt_id: id });
  }
});

$('search').addEventListener('input', e => {
  state.q = e.target.value.toLowerCase().trim();
  renderList();
});
window.addEventListener('hashchange', openFromHash);

await bootPage('library');
try {
  const { rows } = await loadPrompts({ onUpdate: fresh => { prompts = fresh; render(); } });
  prompts = rows;
  render();
  openFromHash();
} catch {
  $('prompt-list').innerHTML = '<li class="error-state"><h2>Prompts didn\'t load</h2><p>The database may be waking up. Refresh in a few seconds.</p></li>';
}

syncHeaderProgress().catch(() => {});
onAuthChange(() => syncHeaderProgress().catch(() => {}));
