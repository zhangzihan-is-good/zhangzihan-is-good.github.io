// The games are imported only when opened. Each round lives in memory only.
const dialog = document.querySelector('#hobby-dialog');
const content = document.querySelector('#hobby-dialog-content');
const title = document.querySelector('#hobby-dialog-title');
const kicker = document.querySelector('#hobby-dialog-kicker');
const dual = (en, zh) => `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;
const VERSION = '20261031d';
const experiences = {
  cube: { title: ['Rubik’s Cube', '魔方'], kicker: '01 / A DIFFERENT PERSPECTIVE', file: './hobbies-cube.js' },
  fitness: { title: ['Dumbbell rhythm', '箭头举铁'], kicker: '02 / FIND YOUR RHYTHM', file: './hobbies-fitness.js' },
  gallery: { title: ['Through the lens', '光影作品廊'], kicker: '03 / MOMENTS IN ORBIT', file: './hobbies-gallery.js' },
  arena: { title: ['Rift footwork', '峡谷走位挑战'], kicker: '04 / KEEP MOVING', file: './hobbies-arena.js' }
};
let active = null;
let generation = 0;
let trigger = null;
let previousOverflow = '';
let ownsScrollLock = false;

function destroyActive() {
  if (active) {
    try { active.destroy(); } catch (error) { console.error('Hobby cleanup failed', error); }
    active = null;
  }
}

async function openExperience(id, button) {
  const experience = experiences[id];
  if (!experience || !dialog) return;
  if (!dialog.open && document.querySelector('dialog[open]')) return;
  const token = ++generation;
  destroyActive();
  trigger = button;
  title.innerHTML = dual(...experience.title);
  kicker.textContent = experience.kicker;
  content.dataset.experience = id;
  content.setAttribute('aria-busy', 'true');
  content.innerHTML = `<div class="hobby-loading" role="status"><span class="hobby-loading-orbit" aria-hidden="true"></span>${dual('A little break is loading…', '正在准备这一刻的小憩…')}</div>`;
  if (!dialog.open) {
    previousOverflow = document.body.style.overflow;
    ownsScrollLock = true;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  dialog.scrollTop = 0;
  try {
    const url = new URL(experience.file, import.meta.url);
    url.searchParams.set('v', VERSION);
    const module = await import(url.href);
    if (generation !== token || !dialog.open) return;
    content.replaceChildren();
    active = module.mount(content, {
      language: document.documentElement.dataset.language || 'both',
      reducedMotion: document.documentElement.dataset.motionPaused === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches
    });
    content.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (generation !== token || !dialog.open) return;
    console.error('Could not open hobby', error);
    content.setAttribute('aria-busy', 'false');
    content.innerHTML = `<div class="hobby-loading" role="alert">${dual('This experience could not load. Please close it and try again.', '暂时无法加载，请关闭后重新打开。')}</div>`;
  }
}

document.querySelectorAll('[data-hobby-open]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => openExperience(button.dataset.hobbyOpen, button));
});
document.querySelector('.hobbies-section')?.classList.add('hobbies-ready');
document.querySelector('#hobby-dialog-close')?.addEventListener('click', () => dialog.close());
function finishExperience() {
  ++generation;
  destroyActive();
  content.replaceChildren();
  content.removeAttribute('aria-busy');
  if (ownsScrollLock) {
    document.body.style.overflow = previousOverflow;
    ownsScrollLock = false;
  }
  if (document.visibilityState !== 'hidden') trigger?.focus({ preventScroll: true });
  trigger = null;
}
dialog?.addEventListener('close', finishExperience);
dialog?.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
window.addEventListener('pagehide', () => {
  if (dialog?.open) dialog.close();
  finishExperience();
});
