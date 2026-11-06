import { playEEGIntro } from './eeg-intro.js?v=brain';
import { playSignature } from './signature-particles.js';

const root = document.documentElement;
const overlay = document.querySelector('.eeg-intro-overlay');
const canvas = overlay.querySelector('canvas');
const caption = overlay.querySelector('.eeg-intro-stage');
const stages = [...overlay.querySelectorAll('.eeg-intro-progress i')];
const previewTarget = overlay.querySelector('.eeg-intro-preview-target');
const dock = document.querySelector('.eeg-intro-dock');
const replay = dock.querySelector('[data-eeg-replay]');
const skip = dock.querySelector('[data-eeg-skip]');
const hint = dock.querySelector('.eeg-intro-hint');
const heading = document.querySelector('.hero h1');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const sessionKey = 'zz-eeg-brain-preview-played';
const stageLabels = {
  eeg: ['01  /  EEG SIGNAL', '01  /  脑电信号', 0],
  brain: ['02  /  HUMAN BRAIN', '02  /  人脑', 1],
  word: ['03  /  LANGUAGE', '03  /  语言', 2]
};

let playing = false;
let signing = false;
let cancel = null;
let landing = null;
let portrait = null;
let fallback = false;
let scrollAtStart = 0;
let cleanupTimer;

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
  const box = document.querySelector('.signal-language-token');
  const rect = box?.getBoundingClientRect();
  if (rect && rect.width > 0 && rect.bottom < innerHeight - 14 && rect.top > 64) {
    fallback = false;
    return rect;
  }
  fallback = true;
  return previewTarget.getBoundingClientRect();
}

function showStage(stage) {
  if (stage === 'landing') {
    landing = targetRect();
    overlay.classList.add('is-landing');
    previewTarget.classList.toggle('is-visible', fallback);
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
  clearTimeout(cleanupTimer);
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

function clearPreviewTarget() {
  previewTarget.classList.remove('is-visible');
  previewTarget.textContent = '';
}

function clearOverlay() {
  overlay.classList.remove('is-playing', 'is-landing', 'is-signature');
  clearPreviewTarget();
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
  portrait?.classList.remove('eeg-intro-hide-word');
  if (landing && !fallback) portrait?.classList.add('eeg-intro-landing');
  if (fallback) {
    previewTarget.textContent = root.dataset.language === 'zh' ? '你好。' : 'Hello.';
    cleanupTimer = setTimeout(clearPreviewTarget, 340);
  }

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

function start() {
  if (playing || motionPaused() || document.hidden) return;
  clearTimeout(cleanupTimer);
  clearOverlay();
  portrait = document.querySelector('.portrait-surface');
  portrait?.classList.remove('eeg-intro-landing');
  portrait?.classList.add('eeg-intro-hide-word');
  heading?.classList.add('signature-hidden');
  landing = null;
  fallback = false;
  scrollAtStart = scrollY;
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
      onFinish: startSignature
    });
    if (playing) cancel = stop;
  } catch (error) {
    console.warn('Opening preview could not play', error);
    finish();
  }
}

replay.addEventListener('click', () => {
  window.scrollTo({top: 0, behavior: 'instant'});
  requestAnimationFrame(start);
});
skip.addEventListener('click', () => finish());
document.addEventListener('keydown', event => {
  if (playing && event.key === 'Escape') finish();
});
window.addEventListener('scroll', () => {
  if (playing && Math.abs(scrollY - scrollAtStart) > 36) finish();
}, {passive: true});
window.addEventListener('resize', () => {
  if (signing) finish();
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
