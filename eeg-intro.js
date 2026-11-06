import { createBrainShape } from "./intro-brain-shape.js";

const BRAIN_HOLD = 440;
const DURATION = 2680 + BRAIN_HOLD;
const EEG_END = 670;
const BRAIN_END = 1330 + BRAIN_HOLD;
const WORD_END = 2020 + BRAIN_HOLD;
const COLORS = ["#a68bfa", "#c1a9ff", "#8beded", "#eeeaff",
  "rgba(154,112,222,.52)", "#b58bea", "#dcc2ff", "#bdfbf5"];
const WORD_FONT = '700 158px Arial, "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (a, b, fraction) => a + (b - a) * fraction;
const smooth = value => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const phase = (time, start, end) => smooth((time - start) / (end - start));
const windowAlpha = (time, enter, full, leave, end) => (
  phase(time, enter, full) * (1 - phase(time, leave, end))
);

function randomSequence(seed) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function createScene(count, word) {
  const random = randomSequence(39017);
  const traces = Array.from({ length: 3 }, (_, row) => {
    return Array.from({ length: 241 }, (_, index) => {
      const p = index / 240;
      const middle = p - (0.48 + row * 0.012);
      const envelope = 0.35 + 0.65 * Math.sin(Math.PI * p);
      const rhythms = Math.sin(p * 84 + row) * 4.6 + Math.sin(p * 177 + row * 1.3) * 3.0
        + Math.sin(p * 331 + row * 3.1) * 1.4;
      const burst = Math.exp(-middle * middle / 0.0024) * Math.sin(middle * 199) * (20 - row * 3);
      return [p * 616 - 308, (row - 1) * 49 + rhythms * envelope + burst];
    });
  });

  const brain = createBrainShape(count, random);
  const waveform = [];
  for (let index = 0; index < count; index++) {
    const along = index / (count - 1);
    const row = index % traces.length;
    const x = clamp(along + (random() - 0.5) * 0.006);
    const sample = traces[row][Math.round(x * 240)];
    waveform.push([sample[0] + (random() - 0.5) * 2, sample[1] + (random() - 0.5) * 3]);
  }
  const sort = (a, b) => a[0] - b[0] || a[1] - b[1];
  brain.points.sort((a, b) => a.x - b.x || a.y - b.y);
  waveform.sort(sort);

  const mask = document.createElement("canvas");
  mask.width = 560;
  mask.height = 202;
  const brush = mask.getContext("2d", { willReadFrequently: true });
  if (!brush) return null;
  brush.font = WORD_FONT;
  brush.textAlign = "center";
  brush.textBaseline = "middle";
  brush.fillStyle = "white";
  brush.fillText(word, 280, 107);
  const pixels = brush.getImageData(0, 0, mask.width, mask.height).data;
  const text = [];
  for (let y = 2; y < mask.height; y += 3) {
    for (let x = 2; x < mask.width; x += 3) {
      if (pixels[(y * mask.width + x) * 4 + 3] > 160) text.push([x - 280, y - 107]);
    }
  }
  text.sort(sort);
  const letters = Array.from({ length: count }, (_, index) => {
    const point = text[Math.floor(index * text.length / count)];
    return point || [0, 0];
  });

  const particles = Array.from({ length: count }, (_, index) => {
    const [x, y] = waveform[index];
    const vertical = random() - 0.5;
    const shade = random();
    return {
      x, y,
      startX: x * (1.2 + random() * 0.8) + (random() - 0.5) * 160,
      startY: y * (1.7 + random()) + vertical * (100 + random() * 255),
      brainPoint: brain.points[index],
      wx: letters[index][0], wy: letters[index][1],
      drift: (random() - 0.5) * 80,
      radius: 0.75 + random() * 0.85,
      speed: random(),
      color: shade < 0.45 ? 0 : shade < 0.73 ? 1 : shade < 0.87 ? 2 : 3,
    };
  });
  return { traces, brain, particles };
}

function tracePath(context, points, close = false) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index++) {
    context.lineTo(points[index][0], points[index][1]);
  }
  if (close) context.closePath();
}

function drawGlow(context, x, y, radius, center, edge = "rgba(160, 112, 255, 0)") {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, center);
  gradient.addColorStop(1, edge);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function paintSignal(context, scene, time) {
  const alpha = windowAlpha(time, 40, 220, 610, 890);
  if (!alpha) return;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = "rgba(168, 144, 235, .14)";
  context.lineWidth = 1;
  context.beginPath();
  for (let x = -300; x <= 300; x += 25) {
    context.moveTo(x, -78);
    context.lineTo(x, 78);
  }
  for (let y = -75; y <= 75; y += 25) {
    context.moveTo(-308, y);
    context.lineTo(308, y);
  }
  context.stroke();
  const pulse = clamp((time - 130) / 575);
  const head = pulse * 616 - 308;
  const travel = context.createLinearGradient(head - 145, 0, head + 16, 0);
  travel.addColorStop(0, "rgba(188, 151, 255, .2)");
  travel.addColorStop(0.8, "#c4a9ff");
  travel.addColorStop(0.94, "#c8fafa");
  travel.addColorStop(1, "rgba(188, 151, 255, .2)");
  for (const points of scene.traces) {
    context.strokeStyle = travel;
    context.lineWidth = 1.45;
    tracePath(context, points);
    context.stroke();
    const [x, y] = points[Math.round(pulse * (points.length - 1))];
    drawGlow(context, x, y, 22, "rgba(171, 247, 253, .56)");
    context.fillStyle = "#edffff";
    context.beginPath();
    context.arc(x, y, 2.7, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function brainProjection(time) {
  const turn = phase(time, 780, BRAIN_END + 250);
  const yaw = mix(-0.16, 0.18, turn);
  const pitch = mix(-0.07, 0.09, turn);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  return ({x, y, z}) => {
    const depth = z * cy - x * sy;
    const perspective = 820 / (820 - depth * cx - y * sx);
    return [(x * cy + z * sy) * perspective, (y * cx - depth * sx) * perspective];
  };
}

function paintBrain(context, brain, time, project, sweep) {
  const alpha = windowAlpha(time, 755, 1110, 1285 + BRAIN_HOLD, 1615 + BRAIN_HOLD);
  if (!alpha) return;
  context.save();
  context.globalAlpha = alpha;
  context.lineCap = "round";
  context.lineJoin = "round";
  const activation = context.createLinearGradient(sweep - 76, 0, sweep + 76, 0);
  activation.addColorStop(0, "rgba(211,170,249,.52)");
  activation.addColorStop(.51, "rgba(158,247,245,.91)");
  activation.addColorStop(1, "rgba(211,170,249,.52)");
  for (const {kind, outline, center, folds} of brain.surfaces) {
    const [x, y] = project(center);
    const cortex = kind === "cortex";
    const light = context.createRadialGradient(x - (cortex ? 55 : 15), y - 25, 0, x, y, cortex ? 252 : 86);
    light.addColorStop(0, cortex ? "#66468b" : "#554273");
    light.addColorStop(0.62, cortex ? "#38254f" : "#302542");
    light.addColorStop(1, "#160e28");
    tracePath(context, outline.map(project), true);
    context.fillStyle = light;
    context.fill();
    context.lineWidth = cortex ? 1.9 : 1.4;
    context.strokeStyle = cortex ? "rgba(218,179,255,.66)" : "rgba(184,156,244,.53)";
    context.stroke();
    for (const fold of folds) {
      tracePath(context, fold.map(project));
      context.lineWidth = cortex ? 7 : 4.5;
      context.strokeStyle = "rgba(18,9,34,.66)";
      context.stroke();
      context.lineWidth = cortex ? 2.05 : 1.45;
      context.strokeStyle = activation;
      context.stroke();
    }
  }
  context.restore();
}

function cubic(a, b, c, d, t) {
  const s = 1 - t;
  return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d;
}

function paintLandingTrail(context, time, x, y, target, width, height) {
  const progress = phase(time, 2030, 2540);
  if (progress <= 0 || progress >= 1) return;
  const start = Math.max(0, progress - .18);
  const curveX = t => cubic(x, x + width * .13, target.x - width * .18, target.x, t);
  const curveY = t => cubic(y, y + height * .07, target.y - height * .12, target.y, t);
  const light = context.createLinearGradient(curveX(start), curveY(start), curveX(progress), curveY(progress));
  light.addColorStop(0, 'rgba(161, 117, 249, 0)');
  light.addColorStop(.65, 'rgba(181, 146, 255, .45)');
  light.addColorStop(1, '#e5faff');
  context.save();
  context.beginPath();
  context.moveTo(curveX(start), curveY(start));
  for (let i = 1; i <= 14; i++) {
    const t = mix(start, progress, i / 14);
    context.lineTo(curveX(t), curveY(t));
  }
  context.lineCap = 'round';
  context.strokeStyle = light;
  context.globalAlpha = .22;
  context.lineWidth = 5;
  context.stroke();
  context.globalAlpha = .82;
  context.lineWidth = 1.25;
  context.stroke();
  context.restore();
}

export function playEEGIntro(canvas, { getTarget, onFinish, onStage, word = "Hello." } = {}) {
  const context = canvas.getContext("2d", { alpha: true });
  const scene = context && createScene(window.innerWidth < 650 ? 760 : 1450, word);
  if (!scene) {
    queueMicrotask(() => onFinish?.());
    return () => {};
  }

  let viewport;
  let request;
  let start;
  let currentStage;
  let cancelled = false;

  function measure() {
    const bounds = canvas.getBoundingClientRect();
    const width = bounds.width || window.innerWidth;
    const height = bounds.height || window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, width < 650 ? 1.45 : 1.75);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    viewport = {
      width, height, left: bounds.left, top: bounds.top,
      x: width * 0.5,
      y: height * 0.455,
      scale: Math.min(width * 0.82 / 616, height * 0.53 / 260, 1.16),
    };
  }

  function targetPosition() {
    const { width, height, left, top } = viewport;
    const rect = getTarget?.();
    if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)) return null;
    const rawX = rect.x - left + rect.width * 0.5;
    const rawY = rect.y - top + rect.height * 0.5;
    return {
      x: rawX, y: rawY,
      width: rect.width, height: rect.height,
      visible: rawX >= 0 && rawX <= width && rawY >= 0 && rawY <= height,
    };
  }

  function render(time) {
    const { width, height, x, y, scale } = viewport;
    const afterBrain = time - BRAIN_HOLD;
    const formBrain = phase(time, 665, 1080);
    const formWord = phase(afterBrain, 1320, 1725);
    const brainWeight = formBrain * (1 - formWord);
    const project = brainWeight ? brainProjection(time) : null;
    const sweep = mix(-295, 305, phase(time, 920, BRAIN_END + 45));
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    paintSignal(context, scene, time);
    if (project) paintBrain(context, scene.brain, time, project, sweep);
    const ink = windowAlpha(afterBrain, 1585, 1750, 2005, 2200);
    if (ink) {
      context.globalAlpha = ink * 0.20;
      context.fillStyle = "#a37cf3";
      context.font = WORD_FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(word, 0, 0);
    }
    context.restore();

    const landing = time >= WORD_END;
    const target = landing ? targetPosition() : null;
    if (target?.visible) paintLandingTrail(context, afterBrain, x, y, target, width, height);
    const alpha = windowAlpha(time, 0, 135, 2505 + BRAIN_HOLD, DURATION);
    const rise = phase(time, 0, 345);
    const wobble = Math.sin(Math.PI * formBrain) * 0.43 + Math.sin(Math.PI * formWord) * 0.65;
    const drawPaths = COLORS.map(() => new Path2D());
    for (const particle of scene.particles) {
      const brain = particle.brainPoint;
      const [bx, by] = project ? project(brain) : [brain.x, brain.y];
      const px = mix(mix(mix(particle.startX, particle.x, rise), bx, formBrain), particle.wx, formWord);
      const py = mix(mix(mix(particle.startY, particle.y, rise), by, formBrain), particle.wy, formWord)
        + particle.drift * wobble;
      let drawX = x + px * scale;
      let drawY = y + py * scale;
      let radius = particle.radius * Math.max(0.75, scale);
      let color = particle.color;
      if (brainWeight > particle.speed) {
        const pulse = clamp(1 - Math.abs(bx - sweep) / 71);
        const light = brain.shade + pulse * .31;
        color = 4 + Math.min(3, Math.floor(light * 3.5));
        radius *= mix(.67, 1.08, clamp(light));
      }
      if (target) {
        const p = phase(afterBrain, 2020 + particle.speed * 135, 2560 - particle.speed * 40);
        const spread = particle.drift;
        const endX = target.x + spread * 0.14;
        const endY = target.y + (particle.speed - 0.5) * 8;
        drawX = cubic(drawX, x + width * .13 + spread * .9, target.x - width * .18, endX, p);
        drawY = cubic(drawY, y + height * .07 + spread * 1.6, target.y - height * .12 + spread * .55, endY, p);
        radius *= mix(1, 0.50, p);
      }
      const path = drawPaths[color];
      path.moveTo(drawX + radius, drawY);
      path.arc(drawX, drawY, radius, 0, Math.PI * 2);
    }
    context.globalAlpha = alpha;
    COLORS.forEach((color, index) => {
      context.fillStyle = color;
      context.fill(drawPaths[index]);
    });
    context.globalAlpha = 1;

    if (target?.visible) {
      const arrival = windowAlpha(afterBrain, 2280, 2490, 2550, 2680);
      context.globalAlpha = arrival;
      drawGlow(context, target.x, target.y, Math.max(45, target.width * 0.74), "rgba(183, 143, 255, .45)");
      context.globalAlpha = 1;
    }
  }

  function dispose() {
    cancelled = true;
    cancelAnimationFrame(request);
    window.removeEventListener("resize", measure);
    context.clearRect(0, 0, viewport.width, viewport.height);
  }

  function frame(now) {
    if (cancelled) return;
    start ??= now;
    const time = Math.min(DURATION, now - start);
    const stage = time < EEG_END ? "eeg" : time < BRAIN_END ? "brain" : time < WORD_END ? "word" : "landing";
    if (stage !== currentStage) {
      currentStage = stage;
      onStage?.(stage);
      if (cancelled) return;
    }
    render(time);
    if (time < DURATION) request = requestAnimationFrame(frame);
    else {
      dispose();
      onFinish?.();
    }
  }

  measure();
  window.addEventListener("resize", measure, { passive: true });
  request = requestAnimationFrame(frame);
  return dispose;
}
