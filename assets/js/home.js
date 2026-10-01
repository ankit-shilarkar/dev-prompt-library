import { bootPage, esc, icons, onAuthChange } from './core.js';
import { loadRoadmap, syncHeaderProgress } from './progress.js';

document.querySelectorAll('.loop-arrow').forEach(el => { el.innerHTML = icons.arrow; });

await bootPage('home');
const roadmap = await loadRoadmap();

document.getElementById('path-list').innerHTML = roadmap.levels.map((level, i) => `
  <li>
    <span class="lvl-num">${i + 1}</span>
    <div><h3>${esc(level.title)}</h3><p>${esc(level.goal)}</p></div>
    <span class="badge-name">Badge: ${esc(level.badge)}</span>
  </li>`).join('');

const summary = await syncHeaderProgress().catch(() => null);
if (summary?.done > 0) {
  document.getElementById('hero-actions').firstElementChild.textContent = `Continue your quest (${summary.done}/${summary.total})`;
}
onAuthChange(() => syncHeaderProgress().catch(() => {}));
