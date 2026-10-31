// A small, physical 3 × 3 cube model. All state stays in memory for this visit.
export const FACE_MOVES = Object.freeze({
  U: { axis: 'y', layer: 1, quarter: -1 },
  D: { axis: 'y', layer: -1, quarter: 1 },
  L: { axis: 'x', layer: -1, quarter: 1 },
  R: { axis: 'x', layer: 1, quarter: -1 },
  F: { axis: 'z', layer: 1, quarter: -1 },
  B: { axis: 'z', layer: -1, quarter: 1 }
});
const COLORS = { U: '#f4f1e9', D: '#f6cb50', L: '#f39845', R: '#e76362', F: '#51b89d', B: '#5b92d9' };
const NORMALS = { U: [0, 1, 0], D: [0, -1, 0], L: [-1, 0, 0], R: [1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
const AXES = { x: 0, y: 1, z: 2 };
const dual = (en, zh) => `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;

export function createCube() {
  const cube = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (x === 0 && y === 0 && z === 0) continue;
    const pos = [x, y, z], id = `${x}:${y}:${z}`;
    cube.push({ id, pos, stickers: Object.entries(NORMALS)
      .filter(([, n]) => n.some((v, i) => v !== 0 && pos[i] === v))
      .map(([color, normal]) => ({ id: `${id}:${color}`, color, normal: [...normal] })) });
  }
  return cube;
}

export function rotateVector(vector, axis, quarter = 1) {
  if (!(axis in AXES) || !Number.isInteger(quarter)) throw new Error('Invalid cube rotation');
  let [x, y, z] = vector;
  for (let i = 0, n = ((quarter % 4) + 4) % 4; i < n; i++) {
    if (axis === 'x') [y, z] = [-z, y];
    else if (axis === 'y') [x, z] = [z, -x];
    else [x, y] = [-y, x];
  }
  return [x || 0, y || 0, z || 0];
}

export function applyMove(cube, axis, layer, quarter = 1) {
  if (!(axis in AXES) || ![-1, 0, 1].includes(layer)) throw new Error('Invalid cube layer');
  return cube.map(piece => piece.pos[AXES[axis]] === layer ? {
    ...piece,
    pos: rotateVector(piece.pos, axis, quarter),
    stickers: piece.stickers.map(s => ({ ...s, normal: rotateVector(s.normal, axis, quarter) }))
  } : piece);
}

export function applyFaceMove(cube, face, inverse = false) {
  const move = FACE_MOVES[face];
  if (!move) throw new Error('Unknown cube face');
  return applyMove(cube, move.axis, move.layer, move.quarter * (inverse ? -1 : 1));
}

export function isSolved(cube) {
  const faces = new Map();
  for (const p of cube) for (const s of p.stickers) {
    const key = s.normal.join(',');
    if (!faces.has(key)) faces.set(key, []);
    faces.get(key).push(s.color);
  }
  return faces.size === 6 && [...faces.values()].every(colors => colors.length === 9 && colors.every(c => c === colors[0]));
}

export function serializeCube(cube) {
  return JSON.stringify(cube.map(p => ({
    id: p.id, pos: p.pos,
    stickers: [...p.stickers].sort((a, b) => a.id.localeCompare(b.id)).map(s => ({ id: s.id, color: s.color, normal: s.normal }))
  })).sort((a, b) => a.id.localeCompare(b.id)));
}

export function scrambleMoves(length = 20, random = Math.random) {
  const faces = Object.keys(FACE_MOVES), result = [];
  let previousAxis = null;
  for (let i = 0; i < length; i++) {
    const candidates = faces.filter(face => FACE_MOVES[face].axis !== previousAxis);
    const face = candidates[Math.floor(random() * candidates.length) % candidates.length];
    const inverse = random() < .5;
    result.push({ face, inverse, ...FACE_MOVES[face], quarter: FACE_MOVES[face].quarter * (inverse ? -1 : 1) });
    previousAxis = FACE_MOVES[face].axis;
  }
  return result;
}

const STYLE = `
.hcube{--hc-unit:70px;--hc-body:#17212b;position:relative;color:var(--ink);width:100%}
.hcube .hcube-stage{height:410px;position:relative;isolation:isolate;overflow:hidden;touch-action:none;cursor:grab;border:1px solid var(--line);border-radius:20px;background:radial-gradient(ellipse at 50% 41%,color-mix(in srgb,var(--purple) 9%,var(--surface)),var(--surface) 74%);user-select:none;-webkit-user-select:none}
.hcube .hcube-stage:active{cursor:grabbing}.hcube .hcube-stage:focus-visible{outline:3px solid var(--purple);outline-offset:4px}
.hcube .hcube-stage:before{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(color-mix(in srgb,var(--muted) 16%,transparent) .75px,transparent .75px);background-size:19px 19px;mask-image:radial-gradient(ellipse,black,transparent 77%)}
.hcube .hcube-scene{position:absolute;inset:0;perspective:1050px;perspective-origin:50% 42%;transform-style:preserve-3d}
.hcube .hcube-object,.hcube .hcube-layer{position:absolute;left:50%;top:44%;width:0;height:0;transform-style:preserve-3d}
.hcube .hcube-layer{left:0;top:0}.hcube .hcube-piece{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}
.hcube .hcube-face{position:absolute;width:calc(var(--hc-unit) * .965);height:calc(var(--hc-unit) * .965);left:calc(var(--hc-unit) * -.4825);top:calc(var(--hc-unit) * -.4825);border:1px solid #313b43;border-radius:5px;background:var(--hc-body);backface-visibility:hidden;transform-style:preserve-3d}
.hcube .hcube-face[data-face=F]{transform:translateZ(calc(var(--hc-unit) * .4825))}.hcube .hcube-face[data-face=B]{transform:rotateY(180deg) translateZ(calc(var(--hc-unit) * .4825))}.hcube .hcube-face[data-face=R]{transform:rotateY(90deg) translateZ(calc(var(--hc-unit) * .4825))}.hcube .hcube-face[data-face=L]{transform:rotateY(-90deg) translateZ(calc(var(--hc-unit) * .4825))}.hcube .hcube-face[data-face=U]{transform:rotateX(90deg) translateZ(calc(var(--hc-unit) * .4825))}.hcube .hcube-face[data-face=D]{transform:rotateX(-90deg) translateZ(calc(var(--hc-unit) * .4825))}
.hcube .hcube-sticker{position:absolute;inset:4px;border-radius:4px;background:var(--hc-color);box-shadow:inset 0 1px 2px #ffffff78,inset 0 -2px 3px #00000024;border:1px solid #ffffff1f;cursor:crosshair;backface-visibility:hidden;transform:translateZ(.25px)}
.hcube .hcube-sticker:after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,#ffffff12,transparent 60%);pointer-events:none}.hcube .hcube-sticker.hcube-selected{outline:3px solid white;outline-offset:-3px;box-shadow:0 0 15px #ffffff70}
.hcube .hcube-floor{position:absolute;left:50%;top:80%;width:205px;height:22px;transform:translateX(-50%);background:#17212b24;border-radius:50%;filter:blur(10px);pointer-events:none}
.hcube .hcube-stage-label{position:absolute;left:18px;top:14px;font:600 10px/1.5 var(--display);letter-spacing:.15em;text-transform:uppercase;color:var(--muted);pointer-events:none}.hcube .hcube-stage-label .zh{display:block;font-size:10px;letter-spacing:.05em;font-weight:400}
.hcube .hcube-orbit-note{position:absolute;bottom:13px;left:16px;right:16px;text-align:center;color:var(--muted);font-size:11px;pointer-events:none}.hcube .hcube-orbit-note .zh{margin-left:7px}
.hcube .hcube-topline{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}.hcube .hcube-stats{display:flex;gap:22px}.hcube .hcube-stat{display:flex;align-items:baseline;gap:8px}.hcube .hcube-stat strong{font:650 23px/1.2 var(--display);font-variant-numeric:tabular-nums;letter-spacing:-.05em}.hcube .hcube-stat span{font-size:11px;color:var(--muted)}
.hcube .hcube-status{font-size:12px;color:var(--purple);min-height:21px}.hcube .hcube-status .zh{margin-left:7px}.hcube .hcube-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:17px}.hcube .hcube-face-controls{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}
.hcube .hcube-face-name{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 4px 5px;font-size:10px;color:var(--muted)}.hcube .hcube-face-dot{height:7px;width:7px;border-radius:50%;background:var(--hc-color);border:1px solid #17212b25}.hcube .hcube-face-name .zh{margin-left:3px}
.hcube .hcube-turns{display:grid;grid-template-columns:1fr 1fr}.hcube .hcube-turn{padding:10px 2px;font-size:14px;font-weight:650;color:var(--ink);background:transparent;min-width:0;border-top:1px solid var(--line);transition:background .16s}.hcube .hcube-turn+button{border-left:1px solid var(--line)}.hcube .hcube-turn:hover:enabled{background:color-mix(in srgb,var(--purple) 12%,var(--surface));color:var(--purple)}.hcube .hcube-turn:disabled,.hcube button:disabled{opacity:.45;cursor:wait}.hcube .hcube-turn:focus-visible{outline:2px solid var(--purple);outline-offset:-3px}
.hcube .hcube-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.hcube .hcube-actions .hgame-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 14px;border:1px solid var(--line);border-radius:9px;font-size:12px;background:var(--surface);color:var(--ink)}.hcube .hcube-actions .hcube-scramble{background:var(--purple);color:white;border-color:var(--purple)}.hcube .hcube-actions .hgame-button:hover:enabled{filter:brightness(.97)}
.hcube .hcube-help{font-size:11px;color:var(--muted);line-height:1.7;margin-top:13px}.hcube .hcube-help .zh{display:block;margin-top:3px}.hcube .hcube-help kbd{font:inherit;border:1px solid var(--line);padding:1px 4px;border-radius:4px;color:var(--ink)}
@media(max-width:650px){.hcube{--hc-unit:52px}.hcube .hcube-stage{height:340px}.hcube .hcube-controls{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.hcube .hcube-stage-label{font-size:9px;left:13px}.hcube .hcube-orbit-note{font-size:10px}.hcube .hcube-orbit-note .zh{display:block;margin-left:0}.hcube .hcube-stats{gap:18px}.hcube .hcube-status{font-size:11px}.hcube .hcube-floor{width:160px;top:79%}}
@media(prefers-reduced-motion:reduce){.hcube *{transition:none!important}}
`;

export function mount(container, context = {}) {
  const names = { U: ['Up', '顶'], D: ['Down', '底'], L: ['Left', '左'], R: ['Right', '右'], F: ['Front', '前'], B: ['Back', '后'] };
  container.innerHTML = `<div class="hcube" data-solved="true"><style>${STYLE}</style>
    <div class="hcube-topline"><div class="hcube-stats"><div class="hcube-stat"><strong data-hc-moves>0</strong><span>${dual('moves', '步')}</span></div><div class="hcube-stat"><strong data-hc-time>00:00</strong><span>${dual('time', '用时')}</span></div></div><div class="hcube-status" role="status" aria-live="polite">${dual('Your next move.', '从下一步开始。')}</div></div>
    <div class="hcube-stage" tabindex="0" role="img" aria-label="Interactive 3D Rubik’s cube. Drag a sticker to turn a layer, or use the face buttons below. / 可交互三维魔方。拖动彩块转层，或使用下方面转按钮。">
      <div class="hcube-stage-label">3 × 3 · ${dual('IN YOUR HANDS', '方寸之间，随心转动')}</div><div class="hcube-floor"></div><div class="hcube-scene"><div class="hcube-object"></div></div>
      <div class="hcube-orbit-note">${dual('Drag a sticker to turn · Drag the background to orbit', '拖动彩块转层 · 拖动背景旋转视角')}</div>
    </div>
    <div class="hcube-controls" aria-label="Cube face turns / 魔方面转操作">${Object.keys(FACE_MOVES).map(face => `<div class="hcube-face-controls"><div class="hcube-face-name"><i class="hcube-face-dot" style="--hc-color:${COLORS[face]}" aria-hidden="true"></i>${dual(names[face][0], names[face][1])}</div><div class="hcube-turns"><button class="hcube-turn" type="button" data-hc-face="${face}" aria-label="Turn ${face} clockwise / ${names[face][1]}面顺时针转动">${face} ↻</button><button class="hcube-turn" type="button" data-hc-face="${face}" data-hc-inverse aria-label="Turn ${face} counterclockwise / ${names[face][1]}面逆时针转动">${face}′</button></div></div>`).join('')}</div>
    <div class="hcube-actions"><button class="hgame-button hcube-scramble" type="button" data-hc-scramble>↝ ${dual('Scramble', '随机打乱')}</button><button class="hgame-button" type="button" data-hc-reset>↺ ${dual('Reset cube', '重置魔方')}</button><button class="hgame-button" type="button" data-hc-view>⤾ ${dual('Reset view', '复位视角')}</button></div>
    <p class="hcube-help">${dual('Keyboard: <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>B</kbd>; hold <kbd>Shift</kbd> for the inverse. The timer starts with your first turn. Reset returns to a solved cube.', '键盘 U / D / L / R / F / B 转动对应面，按住 Shift 反向。首次转动开始计时；“重置魔方”恢复初始状态。')}</p>
  </div>`;
  const root = container.querySelector('.hcube'), stage = root.querySelector('.hcube-stage'), object = root.querySelector('.hcube-object');
  const movesLabel = root.querySelector('[data-hc-moves]'), timeLabel = root.querySelector('[data-hc-time]'), status = root.querySelector('.hcube-status');
  const doc = container.ownerDocument;
  let cube = createCube(), destroyed = false, busy = false, moves = 0, startedAt = null, elapsed = 0, timer = null;
  let cameraX = -25, cameraY = -34, pointer = null, rotationFrame = null, animationFrame = null, animationTimeout = null, finishAnimation = null;
  const reduced = !!context.reducedMotion || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches);
  const listeners = [];
  const listen = (target, name, handler, options) => { target.addEventListener(name, handler, options); listeners.push(() => target.removeEventListener(name, handler, options)); };

  function paintCamera() { object.style.transform = `rotateX(${cameraX}deg) rotateY(${cameraY}deg)`; }
  function paintCube() {
    object.innerHTML = cube.map(piece => `<div class="hcube-piece" data-hc-piece="${piece.id}" style="transform:translate3d(calc(var(--hc-unit) * ${piece.pos[0]}),calc(var(--hc-unit) * ${-piece.pos[1]}),calc(var(--hc-unit) * ${piece.pos[2]}))">${Object.entries(NORMALS).map(([face, normal]) => {
      const sticker = piece.stickers.find(s => s.normal.every((v, i) => v === normal[i]));
      return `<div class="hcube-face" data-face="${face}" aria-hidden="true">${sticker ? `<div class="hcube-sticker" data-hc-sticker="${piece.id}" data-hc-normal="${normal.join(',')}" style="--hc-color:${COLORS[sticker.color]}"></div>` : ''}</div>`;
    }).join('')}</div>`).join('');
    paintCamera();
  }
  function updateTime() {
    const seconds = Math.floor((elapsed + (startedAt === null ? 0 : performance.now() - startedAt)) / 1000);
    timeLabel.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function stopTimer() {
    if (startedAt !== null) elapsed += performance.now() - startedAt;
    startedAt = null;
    if (timer !== null) clearInterval(timer);
    timer = null;
    updateTime();
  }
  function resetStats() { stopTimer(); moves = 0; elapsed = 0; movesLabel.textContent = '0'; updateTime(); }
  function lock(value) {
    busy = value;
    root.querySelectorAll('[data-hc-face],[data-hc-scramble],[data-hc-reset]').forEach(button => { button.disabled = value; });
    stage.setAttribute('aria-busy', String(value));
  }
  function message(en, zh) { status.innerHTML = dual(en, zh); }

  function animateMove(move, duration = 230) {
    if (destroyed) return Promise.resolve(false);
    if (reduced || duration <= 0) { cube = applyMove(cube, move.axis, move.layer, move.quarter); paintCube(); return Promise.resolve(true); }
    const layer = doc.createElement('div');
    layer.className = 'hcube-layer';
    const selected = new Set(cube.filter(p => p.pos[AXES[move.axis]] === move.layer).map(p => p.id));
    [...object.children].forEach(el => { if (selected.has(el.dataset.hcPiece)) layer.append(el); });
    object.append(layer);
    return new Promise(resolve => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        if (animationTimeout !== null) clearTimeout(animationTimeout);
        animationFrame = animationTimeout = finishAnimation = null;
        if (destroyed) { resolve(false); return; }
        cube = applyMove(cube, move.axis, move.layer, move.quarter);
        paintCube();
        resolve(true);
      };
      finishAnimation = done;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        // A second frame gives the new slice its initial, unrotated paint.
        animationFrame = requestAnimationFrame(() => {
          animationFrame = null;
          if (destroyed) { done(); return; }
          const cssSign = move.axis === 'y' ? 1 : -1;
          layer.style.transition = `transform ${duration}ms cubic-bezier(.22,.75,.24,1)`;
          layer.style.transform = `rotate${move.axis.toUpperCase()}(${move.quarter * 90 * cssSign}deg)`;
          animationTimeout = setTimeout(done, duration + 35);
        });
      });
    });
  }

  async function manualMove(move, label) {
    if (busy || destroyed) return;
    if (isSolved(cube) && moves > 0) resetStats();
    lock(true);
    if (startedAt === null) { startedAt = performance.now(); timer = setInterval(updateTime, 250); }
    moves++;
    movesLabel.textContent = String(moves);
    message(label || 'Make it your own.', label || '找到你的节奏。');
    const completed = await animateMove(move);
    if (!completed || destroyed) return;
    if (isSolved(cube)) { stopTimer(); message('Solved. Nicely done!', '还原成功，漂亮！'); root.dataset.solved = 'true'; }
    else { message('One turn at a time.', '一步一步，找到答案。'); root.dataset.solved = 'false'; }
    lock(false);
  }

  async function scramble() {
    if (busy || destroyed) return;
    resetStats();
    lock(true);
    message('Mixing things up…', '正在打乱…');
    for (const move of scrambleMoves(20)) if (!await animateMove(move, 62)) return;
    if (destroyed) return;
    root.dataset.solved = String(isSolved(cube));
    message('Scrambled. Your move!', '打乱完成，轮到你了！');
    lock(false);
  }

  function cameraVector(vector) {
    let [x, y, z] = [vector[0], -vector[1], vector[2]];
    const ry = cameraY * Math.PI / 180, rx = cameraX * Math.PI / 180;
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    return [x, y, z];
  }
  function projectTangent(vector, point) {
    const tangent = cameraVector(vector), position = cameraVector(point);
    const unit = parseFloat(getComputedStyle(root.querySelector('.hcube-face')).width) / .965;
    const depth = 1050 - position[2] * unit;
    // Differentiate the same CSS perspective projection used by the scene.
    // The object center is 44% down; the perspective origin is 42% down.
    // This keeps sticker drags correct near corners and after orbiting.
    return [
      tangent[0] + position[0] * unit * tangent[2] / depth,
      tangent[1] + (position[1] * unit + stage.clientHeight * .02) * tangent[2] / depth
    ];
  }
  function stickerMove(start, dx, dy) {
    const piece = cube.find(p => p.id === start.id);
    if (!piece) return null;
    const p = piece.pos.map((v, i) => v + start.normal[i] * .48);
    let best = null;
    for (const [axis, index] of Object.entries(AXES)) {
      if (start.normal[index] !== 0) continue;
      const derivative = axis === 'x' ? [0, -p[2], p[1]] : axis === 'y' ? [p[2], 0, -p[0]] : [-p[1], p[0], 0];
      const v = projectTangent(derivative, p), magnitude = Math.hypot(...v);
      if (magnitude < .01) continue;
      const score = (v[0] * dx + v[1] * dy) / magnitude;
      if (!best || Math.abs(score) > best.score) best = { axis, layer: piece.pos[index], quarter: score > 0 ? 1 : -1, score: Math.abs(score) };
    }
    return best;
  }
  function clearPointer() {
    if (pointer) { try { stage.releasePointerCapture(pointer.pointerId); } catch {} }
    pointer = null;
    root.querySelector('.hcube-selected')?.classList.remove('hcube-selected');
    stage.removeAttribute('data-dragging');
  }
  listen(stage, 'pointerdown', event => {
    if (event.button !== 0 || pointer || busy) return;
    const sticker = event.target.closest('[data-hc-sticker]');
    pointer = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY,
      id: sticker?.dataset.hcSticker, normal: sticker?.dataset.hcNormal.split(',').map(Number), mode: sticker ? 'sticker' : 'orbit' };
    sticker?.classList.add('hcube-selected');
    stage.focus({ preventScroll: true });
    stage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  listen(stage, 'pointermove', event => {
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    if (pointer.mode === 'orbit') {
      cameraY += (event.clientX - pointer.lastX) * .48;
      cameraX = Math.max(-88, Math.min(88, cameraX - (event.clientY - pointer.lastY) * .42));
      pointer.lastX = event.clientX; pointer.lastY = event.clientY;
      if (rotationFrame === null) rotationFrame = requestAnimationFrame(() => { rotationFrame = null; if (!destroyed) paintCamera(); });
    }
    stage.dataset.dragging = pointer.mode;
    event.preventDefault();
  });
  listen(stage, 'pointerup', event => {
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    const start = pointer, dx = event.clientX - start.x, dy = event.clientY - start.y;
    clearPointer();
    if (start.mode === 'sticker' && Math.hypot(dx, dy) >= 15) {
      const move = stickerMove(start, dx, dy);
      if (move) manualMove(move);
    }
  });
  listen(stage, 'pointercancel', clearPointer);
  listen(stage, 'contextmenu', event => event.preventDefault());
  listen(root, 'click', event => {
    const button = event.target.closest('button');
    if (!button || destroyed) return;
    if (button.hasAttribute('data-hc-face')) {
      const face = button.dataset.hcFace, base = FACE_MOVES[face], inverse = button.hasAttribute('data-hc-inverse');
      manualMove({ ...base, quarter: base.quarter * (inverse ? -1 : 1) }, face + (inverse ? '′' : ''));
    } else if (button.hasAttribute('data-hc-scramble')) scramble();
    else if (button.hasAttribute('data-hc-reset') && !busy) {
      resetStats(); cube = createCube(); paintCube(); root.dataset.solved = 'true';
      message('A fresh start.', '重新开始。');
    } else if (button.hasAttribute('data-hc-view')) { cameraX = -25; cameraY = -34; paintCamera(); }
  });
  listen(doc, 'keydown', event => {
    if (destroyed || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target?.matches('input,textarea,select,[contenteditable=true]')) return;
    // Only the mounted game in the active dialog owns these shortcuts.
    const dialog = container.closest('dialog');
    if (dialog && !dialog.open) return;
    const face = event.key.toUpperCase();
    if (!FACE_MOVES[face]) return;
    event.preventDefault();
    const move = FACE_MOVES[face];
    manualMove({ ...move, quarter: move.quarter * (event.shiftKey ? -1 : 1) }, face + (event.shiftKey ? '′' : ''));
  });
  paintCube();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearPointer();
      if (rotationFrame !== null) cancelAnimationFrame(rotationFrame);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      if (animationTimeout !== null) clearTimeout(animationTimeout);
      if (timer !== null) clearInterval(timer);
      finishAnimation?.();
      listeners.forEach(remove => remove());
      container.innerHTML = '';
    }
  };
}
