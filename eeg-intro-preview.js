import { playEEGIntro } from './eeg-intro.js?v=language-landing';
import { playSignature } from './signature-particles.js';

const root = document.documentElement;
const overlay = document.querySelector('.eeg-intro-overlay');
const canvas = overlay.querySelector('canvas');
const caption = overlay.querySelector('.eeg-intro-stage');
const stages = [...overlay.querySelectorAll('.eeg-intro-progress i')];
const dock = document.querySelector('.eeg-intro-dock');
const replay = dock.querySelector('[data-eeg-replay]');
const skip = dock.querySelector('[data-eeg-skip]');
const hint = dock.querySelector('.eeg-intro-hint');
const heading = document.querySelector('.hero h1');
const header = document.querySelector('.header');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const sessionKey = 'zz-eeg-language-landing-played';
const stageLabels = {
  eeg: ['01  /  EEG SIGNAL', '01  /  脑电信号', 0],
  brain: ['02  /  HUMAN BRAIN', '02  /  人脑', 1],
  word: ['03  /  LANGUAGE', '03  /  语言', 2]
};

let playing = false;
let signing = false;
let cancel = null;
let portrait = null;
let expectedScroll = 0;
let scrollBeforeLanding = null;

function motionPaused() {
  return reduce.matches || root.dataset.motionPaused === 'true';
}

function syncControls() {
  const paused = motionPaused();
  replay.hidden = playing;
  replay.disabled = paused;
  skip.hidden = !playing;
  hint.hidden = !paused;
}

function targetRect() {
  const rect = portrait?.querySelector('.signal-language-token')?.getBoundingClientRect();
  return rect?.width > 0 && rect.height > 0 ? rect : null;
}

function scrollDuringOpening(top) {
  window.scrollTo({top, behavior: 'instant'});
  expectedScroll = scrollY;
}

function showLanguageBox() {
  const rect = targetRect();
  if (!rect) return;
  const controls = dock.getBoundingClientRect();
  const overlapsDock = rect.right > controls.left && rect.left < controls.right;
  const bottom = Math.min(innerHeight - 18, overlapsDock ? controls.top - 12 : Infinity);
  const top = (header?.getBoundingClientRect().bottom ?? 0) + 12;
  const shift = rect.bottom > bottom ? rect.bottom - bottom : Math.min(0, rect.top - top);
  if (Math.abs(shift) < 1) return;
  scrollBeforeLanding ??= scrollY;
  scrollDuringOpening(scrollY + shift);
}

function showStage(stage) {
  if (stage === 'word' || stage === 'landing') showLanguageBox();
  if (stage === 'landing') {
    overlay.classList.add('is-landing');
    return;
  }
  const label = stageLabels[stage];
  if (!label) return;
  caption.textContent = root.dataset.language === 'zh' ? label[1] : label[0];
  stages.forEach((item, index) => item.classList.toggle('is-current', index <= label[2]));
}

function finish() {
  if (!playing) return;
  playing = false;
  signing = false;
  scrollBeforeLanding = null;
  const stop = cancel;
  cancel = null;
  stop?.();
  heading?.classList.remove('signature-hidden', 'signature-reveal');
  portrait?.classList.remove('eeg-intro-hide-word');
  const restoreFocus = document.activeElement === skip;
  clearOverlay();
  syncControls();
  if (restoreFocus && !replay.disabled) replay.focus({preventScroll: true});
}

function clearOverlay() {
  overlay.classList.remove('is-playing', 'is-landing', 'is-signature');
}

function signatureTargets() {
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure || !heading) return [];
  const range = document.createRange();
  const isLight = root.dataset.theme === 'light';
  return [...heading.querySelectorAll('[data-signature]')].flatMap(element => {
    const style = getComputedStyle(element);
    const text = element.firstChild.textContent;
    const direction = element.dataset.signature;
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    const color = direction === 'strokes' ? (isLight ? '#7140b1' : '#e8beff') : (isLight ? '#4341a9' : '#abc9ff');
    measure.font = font;
    if ('letterSpacing' in measure) measure.letterSpacing = letterSpacing;
    range.selectNodeContents(element.firstChild);
    const lines = [...range.getClientRects()];
    if (lines.length !== 1) return [];
    const metrics = measure.measureText(text);
    const baseline = element.querySelector('.signature-baseline').getBoundingClientRect().top;
    const rect = {
      x: lines[0].left - metrics.actualBoundingBoxLeft,
      y: baseline - metrics.actualBoundingBoxAscent,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    };
    return rect.width > 0 && rect.height > 0 ? [{text, rect, font, letterSpacing, direction, color}] : [];
  });
}

function startSignature() {
  if (!playing) return;
  cancel = null;

  try {
    const targets = signatureTargets();
    if (targets.length !== 2) {
      finish();
      return;
    }
    signing = true;
    overlay.classList.add('is-signature');
    const stop = playSignature(canvas, {
      targets,
      onReveal: () => {
        heading.classList.add('signature-reveal');
        heading.classList.remove('signature-hidden');
      },
      onFinish: finish
    });
    if (playing) cancel = stop;
  } catch (error) {
    console.warn('Particle signature could not play', error);
    finish();
  }
}

function completeLanding() {
  if (!playing) return;
  portrait?.classList.remove('eeg-intro-hide-word');
  if (targetRect()) portrait.classList.add('eeg-intro-landing');
  if (scrollBeforeLanding === null) {
    startSignature();
    return;
  }

  // Let the word illuminate the real box before returning to the headline.
  const from = scrollY;
  const to = scrollBeforeLanding;
  let started;
  let request;
  function returnFrame(now) {
    started ??= now;
    const progress = Math.min(1, Math.max(0, (now - started - 250) / 330));
    if (progress > 0) {
      const ease = progress * progress * (3 - 2 * progress);
      scrollDuringOpening(from + (to - from) * ease);
    }
    if (progress < 1) request = requestAnimationFrame(returnFrame);
    else {
      scrollBeforeLanding = null;
      startSignature();
    }
  }
  request = requestAnimationFrame(returnFrame);
  cancel = () => cancelAnimationFrame(request);
}

function start() {
  if (playing || motionPaused() || document.hidden) return;
  clearOverlay();
  portrait = document.querySelector('.portrait-surface');
  portrait?.classList.remove('eeg-intro-landing');
  portrait?.classList.add('eeg-intro-hide-word');
  heading?.classList.add('signature-hidden');
  scrollBeforeLanding = null;
  expectedScroll = scrollY;
  playing = true;
  overlay.classList.add('is-playing');
  syncControls();
  showStage('eeg');
  try {
    sessionStorage.setItem(sessionKey, 'true');
  } catch {}
  try {
    const stop = playEEGIntro(canvas, {
      getTarget: targetRect,
      word: root.dataset.language === 'zh' ? '你好。' : 'Hello.',
      onStage: showStage,
      onFinish: completeLanding
    });
    if (playing) cancel = stop;
  } catch (error) {
    console.warn('Opening preview could not play', error);
    finish();
  }
}

function skipOpening() {
  if (playing && scrollBeforeLanding !== null && Math.abs(scrollY - expectedScroll) < 2) {
    scrollDuringOpening(scrollBeforeLanding);
  }
  finish();
}

replay.addEventListener('click', () => {
  window.scrollTo({top: 0, behavior: 'instant'});
  requestAnimationFrame(start);
});
skip.addEventListener('click', skipOpening);
document.addEventListener('keydown', event => {
  if (playing && event.key === 'Escape') skipOpening();
});
window.addEventListener('scroll', () => {
  if (playing && Math.abs(scrollY - expectedScroll) > 36) finish();
}, {passive: true});
window.addEventListener('resize', () => {
  if (signing) finish();
  else if (overlay.classList.contains('is-landing') && portrait?.classList.contains('eeg-intro-hide-word')) showLanguageBox();
}, {passive: true});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) finish();
});
function onMotionChange() {
  if (motionPaused()) finish();
  syncControls();
}
document.addEventListener('zz:motion', onMotionChange);
reduce.addEventListener('change', onMotionChange);

dock.hidden = false;
syncControls();
let hasPlayed = false;
try {
  hasPlayed = sessionStorage.getItem(sessionKey) === 'true';
} catch {}
if (!hasPlayed && (!location.hash || location.hash === '#home')) {
  requestAnimationFrame(start);
}
