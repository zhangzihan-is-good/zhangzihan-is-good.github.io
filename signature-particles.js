import { signatureStrokes } from "./signature-strokes.js";

const DURATION = 1800;
const REVEAL = 1480;
const WRITE_START = 60;
const WRITE_END = 1310;
const STREAM_END = 1250;
const TAU = Math.PI * 2;

const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;
function smooth(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function seededRandom() {
  let seed = 928451;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Use the same font and spacing as the heading. The mask fits its visible ink
// bounds so there is no line-height jump when the real text fades in.
function createInk(target, random) {
  const { text, rect, direction } = target;
  if (!text || rect.width < 1 || rect.height < 1) return null;
  const mask = document.createElement("canvas");
  const brush = mask.getContext("2d", { willReadFrequently: true });
  if (!brush) return null;

  const setFont = () => {
    brush.font = target.font;
    brush.textBaseline = "alphabetic";
    brush.textAlign = "left";
    if ("letterSpacing" in brush && target.letterSpacing && target.letterSpacing !== "normal") {
      brush.letterSpacing = target.letterSpacing;
    }
  };
  setFont();
  const ink = brush.measureText(text);
  const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
  const inkHeight = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
  if (!(inkWidth > 0 && inkHeight > 0)) return null;

  const padding = 2;
  const scale = Math.min(rect.width / inkWidth, rect.height / inkHeight);
  mask.width = Math.ceil(inkWidth + padding * 2);
  mask.height = Math.ceil(inkHeight + padding * 2);
  setFont();
  const origin = padding + ink.actualBoundingBoxLeft;
  const baseline = padding + ink.actualBoundingBoxAscent;
  brush.fillStyle = "white";
  brush.fillText(text, origin, baseline);
  const pixels = brush.getImageData(0, 0, mask.width, mask.height).data;
  const x = rect.x + (rect.width - inkWidth * scale) / 2;
  const y = rect.y + (rect.height - inkHeight * scale) / 2;
  const mapX = pixelX => x + (pixelX - padding) * scale;
  const mapY = pixelY => y + (pixelY - padding) * scale;

  const step = Math.max(direction === "strokes" ? 1.65 : 2.7, Math.sqrt(inkWidth * inkHeight / 3400));
  const particles = [];
  for (let row = 0; row * step < inkHeight; row++) {
    const sy = padding + (row + 0.5) * step;
    for (let sx = padding + (row % 2 ? 0.28 : 0.72) * step; sx < padding + inkWidth; sx += step) {
      const dx = sx + (random() - 0.5) * step * 0.34;
      const dy = sy + (random() - 0.5) * step * 0.34;
      if (!(pixels[(Math.floor(dy) * mask.width + Math.floor(dx)) * 4 + 3] >= 140)) continue;
      const shade = random();
      particles.push({
        x: mapX(dx),
        y: mapY(dy),
        along: (dx - padding) / inkWidth,
        radius: scale * step * (0.29 + random() * 0.23),
        shade: shade < 0.49 ? 0 : shade < 0.79 ? 1 : 2,
        seed: random(),
      });
    }
  }
  if (!particles.length) return null;

  const strokes = [];
  if (direction === "strokes") {
    let prefix = "";
    for (const character of text) {
      const glyph = brush.measureText(character);
      const offset = origin + brush.measureText(prefix).width;
      const left = offset - glyph.actualBoundingBoxLeft;
      const width = glyph.actualBoundingBoxLeft + glyph.actualBoundingBoxRight;
      const top = baseline - glyph.actualBoundingBoxAscent;
      const height = glyph.actualBoundingBoxAscent + glyph.actualBoundingBoxDescent;
      for (const path of signatureStrokes[character] ?? []) {
        strokes.push(path.map(([px, py]) => [mapX(left + px * width), mapY(top + py * height)]));
      }
      prefix += character;
    }
  }
  return { particles, strokes, rect };
}

function strokeTimeline(paths) {
  let elapsed = 0;
  return paths.map(points => {
    let length = 0;
    const segments = points.slice(1).map(([x, y], index) => {
      const [startX, startY] = points[index];
      const dx = x - startX;
      const dy = y - startY;
      const distance = Math.hypot(dx, dy);
      const segment = { startX, startY, dx, dy, distance, offset: length };
      length += distance;
      return segment;
    });
    const duration = 2.1 + Math.sqrt(length);
    const stroke = { segments, length, start: elapsed, duration };
    elapsed += duration;
    return stroke;
  });
}

function prepareInk(ink) {
  ink.timeline = strokeTimeline(ink.strokes);
  const last = ink.timeline.at(-1);
  const total = last ? last.start + last.duration : 1;
  for (const point of ink.particles) {
    point.order = point.along;
    let nearest = Infinity;
    for (const stroke of ink.timeline) {
      for (const s of stroke.segments) {
        if (!s.distance) continue;
        const t = clamp(((point.x - s.startX) * s.dx + (point.y - s.startY) * s.dy) / (s.distance ** 2));
        const distance = (point.x - s.startX - t * s.dx) ** 2 + (point.y - s.startY - t * s.dy) ** 2;
        if (distance < nearest) {
          nearest = distance;
          point.order = (stroke.start + (s.offset + t * s.distance) / stroke.length * stroke.duration) / total;
        }
      }
    }
  }
  ink.total = total;
}

function drawHalo(context, x, y, radius, bright, clear) {
  const halo = context.createRadialGradient(x, y, 0, x, y, radius);
  halo.addColorStop(0, bright);
  halo.addColorStop(1, clear);
  context.fillStyle = halo;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawBrush(context, ink, progress, alpha) {
  if (progress <= 0 || progress >= 1 || !ink.timeline.length) return;
  const position = progress * ink.total;
  const stroke = ink.timeline.find(item => position < item.start + item.duration);
  const tip = clamp((position - stroke.start) / stroke.duration) * stroke.length;
  const tail = Math.max(0, tip - 14);
  let tipX;
  let tipY;
  context.beginPath();
  for (const segment of stroke.segments) {
    const finish = segment.offset + segment.distance;
    if (finish <= tail || segment.offset >= tip) continue;
    const a = clamp((tail - segment.offset) / segment.distance);
    const b = clamp((tip - segment.offset) / segment.distance);
    context.moveTo(segment.startX + a * segment.dx, segment.startY + a * segment.dy);
    tipX = segment.startX + b * segment.dx;
    tipY = segment.startY + b * segment.dy;
    context.lineTo(tipX, tipY);
  }
  if (tipX === undefined) return;
  context.globalAlpha = alpha * 0.64;
  drawHalo(context, tipX, tipY, 20, "rgba(223, 157, 255, .96)", "rgba(181, 128, 252, 0)");
  context.lineCap = "round";
  context.lineWidth = 4.8;
  context.strokeStyle = "#c17af3";
  context.globalAlpha = alpha * 0.26;
  context.stroke();
  context.lineWidth = 1.7;
  context.strokeStyle = "#fff2ff";
  context.globalAlpha = alpha * 0.93;
  context.stroke();
}

function drawWriting(context, ink, time, alpha) {
  const progress = clamp((time - WRITE_START) / (WRITE_END - WRITE_START));
  const palette = ["#c591fa", "#edc5ff", "#fff1ff"];
  for (let shade = 0; shade < palette.length; shade++) {
    context.fillStyle = palette[shade];
    context.globalAlpha = alpha * (0.69 + shade * 0.11);
    context.beginPath();
    for (const point of ink.particles) {
      if (point.shade !== shade) continue;
      const age = progress - point.order + 0.016;
      if (age < 0) continue;
      const r = point.radius * (1.07 + 0.47 * Math.exp(-age * 28));
      context.moveTo(point.x + r, point.y);
      context.arc(point.x, point.y, r, 0, TAU);
    }
    context.fill();
  }
  drawBrush(context, ink, progress, alpha);
}

function drawStream(context, ink, time, alpha, width, height) {
  const palette = ["#a48efa", "#a2e7ef", "#ecfcff"];
  const { rect } = ink;
  const centerY = rect.y + rect.height * 0.54;
  const rush = smooth((time - 25) / 240) * (1 - smooth((time - 790) / 330));
  if (rush > 0) {
    const front = smooth((time - 25) / 1050);
    const headX = rect.x + rect.width * front;
    const tailX = Math.max(-8, headX - Math.min(rect.width * 0.45, 155));
    if (headX > tailX) {
      context.globalAlpha = rush * alpha * 0.46;
      const trail = context.createLinearGradient(tailX, 0, headX + 12, 0);
      trail.addColorStop(0, "rgba(160, 123, 245, 0)");
      trail.addColorStop(0.7, "rgba(174, 151, 250, .64)");
      trail.addColorStop(1, "rgba(183, 246, 255, .85)");
      context.strokeStyle = trail;
      context.lineWidth = 0.65;
      for (const offset of [-17, -7, 6, 15]) {
        const tipY = centerY + offset * 0.28;
        context.beginPath();
        context.moveTo(tailX, centerY + offset * 2);
        context.bezierCurveTo(lerp(tailX, headX, 0.53), centerY - offset, headX - 12, tipY, headX, tipY);
        context.stroke();
      }
      drawHalo(context, headX, centerY, 30, "rgba(164, 231, 249, .27)", "rgba(180, 143, 255, 0)");
    }
  }

  for (let shade = 0; shade < palette.length; shade++) {
    context.fillStyle = palette[shade];
    context.globalAlpha = alpha * (0.63 + shade * 0.15) * smooth(time / 135);
    context.beginPath();
    for (const point of ink.particles) {
      if (point.shade !== shade) continue;
      const arrive = Math.min(STREAM_END, 650 + point.along * 510 + point.seed * 125);
      const start = point.along * 170 + point.seed * 115;
      if (time <= start) continue;
      const t = clamp((time - start) / (arrive - start));
      const travel = 1 - (1 - t) ** 2.35;
      const startX = rect.x - 32 - 118 * point.seed + point.along * 38;
      const startY = centerY + Math.cos(point.seed * 17 + point.along * 11) * Math.min(92, 26 + rect.height * 0.7);
      const arc = Math.sin(Math.PI * travel) * (point.seed - 0.48);
      const x = lerp(startX, point.x, travel) + arc * 22;
      const y = lerp(startY, point.y, travel) + arc * 39;
      if (x < -3 || x > width + 3 || y < -3 || y > height + 3) continue;
      const radius = point.radius * (0.72 + 0.44 * travel);
      context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, TAU);
      if (shade === 2 && point.seed > 0.92 && t < 0.82) {
        context.rect(x - 3 * (1 - t), y - 0.35, 3 * (1 - t), 0.7);
      }
    }
    context.fill();
  }
}

export function playSignature(canvas, { targets = [], onReveal, onFinish } = {}) {
  const context = canvas.getContext("2d", { alpha: true });
  const random = seededRandom();
  const scenes = context ? targets.flatMap(target => {
    const ink = createInk(target, random);
    if (!ink) return [];
    if (target.direction === "strokes") prepareInk(ink);
    return [{ ink, direction: target.direction }];
  }) : [];

  let active = true;
  let request;
  let started;
  let revealed = false;
  let width = 0;
  let height = 0;
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width || window.innerWidth;
    height = bounds.height || window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const stop = () => {
    if (!active) return;
    active = false;
    if (request != null) cancelAnimationFrame(request);
    if (scenes.length) {
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
    }
  };

  if (!scenes.length) {
    queueMicrotask(() => {
      if (!active) return;
      onReveal?.();
      if (active) onFinish?.();
      active = false;
    });
    return stop;
  }
  resize();
  function frame(now) {
    if (!active) return;
    started ??= now;
    const time = now - started;
    context.clearRect(0, 0, width, height);
    if (time >= REVEAL && !revealed) {
      revealed = true;
      onReveal?.();
      if (!active) return;
    }
    if (time >= DURATION) {
      stop();
      onFinish?.();
      return;
    }

    const alpha = 1 - smooth((time - REVEAL) / (DURATION - REVEAL));
    for (const { ink, direction } of scenes) {
      if (direction === "strokes") drawWriting(context, ink, time, alpha);
      else drawStream(context, ink, time, alpha, width, height);
    }
    request = requestAnimationFrame(frame);
  }

  request = requestAnimationFrame(frame);
  return stop;
}
