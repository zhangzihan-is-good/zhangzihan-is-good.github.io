import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../dist/hobbies-arena.js', import.meta.url), 'utf8').catch(error => { if (error.code !== 'ENOENT') throw error; return fs.readFile(new URL('../hobbies-arena.js', import.meta.url), 'utf8'); });
const {mount, segmentDistanceSquared, intersectsCone, dashDestination, simulationSteps, advanceRoundClock} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// Projectile collision checks the entire path, not just its final position.
assert.equal(segmentDistanceSquared(10, 10, 0, 0, 20, 0), 100);
assert.equal(segmentDistanceSquared(50, 0, 0, 0, 100, 0), 0);
assert.equal(segmentDistanceSquared(5, 5, 0, 0, 0, 0), 50);
assert.equal(segmentDistanceSquared(30, 0, 0, 0, 20, 0), 100);

const cone = {x: 0, y: 0, angle: 0, spread: Math.PI / 6, radius: 100};
assert.ok(intersectsCone({x: 40, y: 0, radius: 5}, cone));
assert.ok(!intersectsCone({x: -20, y: 0, radius: 5}, cone));
assert.ok(!intersectsCone({x: 120, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: 104, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: 50, y: 31, radius: 5}, cone)); // Clips a radial edge.
assert.ok(!intersectsCone({x: 50, y: 41, radius: 5}, cone));
assert.ok(intersectsCone({x: 0, y: 0, radius: 5}, cone));
assert.ok(intersectsCone({x: -40, y: 0, radius: 5}, {...cone, angle: Math.PI})); // Angle wrapping.

const player = {x: 450, y: 260, radius: 12};
const destination = dashDestination(player, {x: 3, y: 4});
assert.ok(Math.abs(Math.hypot(destination.x - player.x, destination.y - player.y) - 135) < 1e-9);
assert.deepEqual(dashDestination({x: 60, y: 60, radius: 12}, {x: -1, y: -1}), {x: 52, y: 52});
assert.deepEqual(dashDestination(player, {x: 0, y: 0}), {x: 450, y: 260});

// The real round clock does not slow down, auto-pause or replay invisible attacks on slow frames.
for (const fps of [1, 4, 10, 20, 30, 60, 120]) {
  let state = {elapsed: 0, cooldown: 5};
  for (let frame = 0; frame < 45 * fps; frame++) {
    const steps = simulationSteps(1 / fps);
    assert.ok(steps.every(dt => dt <= 1 / 120 + 1e-12));
    assert.ok(steps.reduce((sum, dt) => sum + dt, 0) <= .25 + 1e-12);
    state = advanceRoundClock(state.elapsed, state.cooldown, 1 / fps);
  }
  assert.ok(Math.abs(state.elapsed - 45) < 1e-9, `Round duration drifted at ${fps} fps`);
  assert.equal(state.cooldown, 0);
}
assert.equal(simulationSteps(1).length, 30);
assert.ok(Math.abs(simulationSteps(10).reduce((sum, dt) => sum + dt, 0) - .25) < 1e-12);
assert.deepEqual(simulationSteps(NaN), []);
assert.deepEqual(simulationSteps(0), []);
assert.deepEqual(advanceRoundClock(10, 3, 1), {elapsed: 11, cooldown: 2});
assert.deepEqual(advanceRoundClock(44, 3, 2), {elapsed: 45, cooldown: 1});
assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(source));

// Exercise the actual mounted game loop and input handlers with a deterministic clock and canvas.
// This catches Start→stall→Pause regressions that isolated geometry/timestep tests cannot detect.
class Target {
  constructor(tagName = 'DIV') {
    this.tagName = tagName; this.listeners = new Map(); this.hidden = false; this.disabled = false; this.innerHTML = ''; this.textContent = '';
    this.attrs = new Map(); this.classes = new Set(); this.children = [];
    this.classList = {toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name)};
    this.style = {setProperty() {}};
  }
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  fire(type, options = {}) {
    const event = {target: this, key: '', code: '', button: 0, prevented: false, preventDefault() {this.prevented = true;}, ...options};
    for (const fn of [...(this.listeners.get(type) || [])]) fn(event);
    return event;
  }
  closest(selector) {
    if (selector === 'dialog') return this.dialog || null;
    if (selector === 'button,a' && ['BUTTON', 'A'].includes(this.tagName)) return this;
    if (selector.startsWith('input,') && ['INPUT', 'TEXTAREA', 'SELECT'].includes(this.tagName)) return this;
    return null;
  }
  setAttribute(name, value) { this.attrs.set(name, value); }
  focus() { document.activeElement = this; }
}

const originals = new Map(['window','document','performance','requestAnimationFrame','cancelAnimationFrame','ResizeObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const originalRandom = Math.random;
try {
  let now = 100, nextRAF = 1, seed = 2, lastPlayer = null, resizeWrites = 0;
  const pendingFrames = new Map();
  const doc = new Target(), win = new Target(); doc.hidden = false; win.devicePixelRatio = 1;
  const dialog = new Target('DIALOG'), root = new Target(), container = new Target(); container.dialog = dialog;
  const names = ['.ha-overlay','[data-start]','[data-pause]','[data-dash]','[data-overlay-title]','[data-overlay-copy]','.ha-status','[data-time]','[data-lives]','[data-dodged]','[data-cooldown]'];
  const elements = new Map(names.map(name => [name, new Target(name.startsWith('[data-start') || name.startsWith('[data-pause') || name.startsWith('[data-dash') ? 'BUTTON' : 'DIV')]));
  elements.get('[data-lives]').children = [new Target('I'),new Target('I'),new Target('I')];
  const canvas = new Target('CANVAS');
  let width = 900, height = 520;
  Object.defineProperties(canvas, {width: {get: () => width, set: value => {width = value; resizeWrites++;}}, height: {get: () => height, set: value => {height = value; resizeWrites++;}}});
  const drawing = new Proxy({}, {get(object, key) {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop() {}});
    if (key === 'translate') return (x,y) => {lastPlayer = {x,y};};
    return object[key] ?? (() => {});
  }});
  canvas.getContext = () => drawing;
  canvas.getBoundingClientRect = () => ({left: 0, top: 0, width: 720, height: 416});
  canvas.setPointerCapture = () => {}; canvas.hasPointerCapture = () => false;
  elements.set('.ha-canvas', canvas);
  root.querySelector = selector => elements.get(selector);
  container.querySelector = () => root;
  const observers = [];
  class Observer {constructor(fn) {this.fn = fn; this.disconnected = false; observers.push(this);} observe() {} disconnect() {this.disconnected = true;}}
  const values = {window: win, document: doc, performance: {now: () => now}, ResizeObserver: Observer,
    requestAnimationFrame: callback => {const id = nextRAF++; pendingFrames.set(id, callback); return id;}, cancelAnimationFrame: id => pendingFrames.delete(id)};
  for (const [key,value] of Object.entries(values)) Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  Math.random = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;};
  function tick(seconds) { now += seconds * 1000; const callbacks = [...pendingFrames.values()]; pendingFrames.clear(); for (const fn of callbacks) fn(now); }
  const game = mount(container, {reducedMotion: true});
  const get = selector => elements.get(selector);
  const start = get('[data-start]'), pause = get('[data-pause]'), dash = get('[data-dash]'), overlay = get('.ha-overlay'), timer = get('[data-time]');

  start.fire('click');
  assert.equal(overlay.hidden, true);
  tick(.25); assert.equal(timer.textContent, '44.8'); assert.equal(overlay.hidden, true);
  tick(1); assert.equal(timer.textContent, '43.8'); assert.equal(overlay.hidden, true, '1-second frames must not auto-pause');
  const beforeKeyboard = {...lastPlayer};
  const key = dialog.fire('keydown', {target: pause, key:'ArrowRight', code:'ArrowRight'});
  assert.equal(key.prevented, true, 'Movement works even if a game control has focus');
  tick(.25); assert.ok(lastPlayer.x > beforeKeyboard.x);
  doc.fire('keyup', {key:'ArrowRight'});
  const inputKey = dialog.fire('keydown', {target: new Target('INPUT'), key:'ArrowLeft', code:'ArrowLeft'});
  assert.equal(inputKey.prevented, false, 'Do not hijack editable fields');
  const normalButtonSpace = dialog.fire('keydown', {target: pause, key:' ', code:'Space'});
  assert.equal(normalButtonSpace.prevented, false, 'Keep native Pause/Close button activation');

  const beforeMouse = {...lastPlayer};
  canvas.fire('pointerdown', {clientX:10, clientY:10, pointerId:1, button:0});
  tick(.25); assert.ok(lastPlayer.x < beforeMouse.x && lastPlayer.y < beforeMouse.y);
  canvas.fire('pointerup', {pointerId:1});
  const beforeTouch = {...lastPlayer};
  canvas.fire('pointerdown', {clientX:700, clientY:380, pointerId:2, pointerType:'touch', button:0});
  canvas.fire('pointermove', {clientX:650, clientY:360, pointerId:2, pointerType:'touch'});
  tick(.25); assert.ok(lastPlayer.x > beforeTouch.x && lastPlayer.y > beforeTouch.y);
  canvas.fire('pointercancel', {pointerId:2});

  const beforeDash = {...lastPlayer}; dash.fire('click');
  assert.ok(Math.hypot(lastPlayer.x-beforeDash.x,lastPlayer.y-beforeDash.y) > 100);
  assert.equal(get('[data-cooldown]').textContent, '5.0s'); assert.equal(dash.disabled,true);
  win.fire('blur'); tick(1);
  assert.equal(overlay.hidden,true,'Window focus changes must not pause gameplay');
  assert.equal(get('[data-cooldown]').textContent,'4.0s');

  pause.fire('click'); const pausedTime = timer.textContent;
  assert.equal(overlay.hidden,false); assert.equal(pendingFrames.size,0);
  tick(10); assert.equal(timer.textContent,pausedTime);
  start.fire('click'); tick(1);
  assert.equal(overlay.hidden,true); assert.equal(Number(timer.textContent),Number(pausedTime)-1);
  doc.hidden=true; doc.fire('visibilitychange'); const hiddenTime=timer.textContent;
  tick(10); assert.equal(timer.textContent,hiddenTime);
  doc.hidden=false; start.fire('click');
  for(let i=0;i<3;i++)tick(1);
  assert.equal(dash.disabled,false,'Dash cooldown recharges in real active seconds');

  const writes=resizeWrites;
  for(let i=0;i<10;i++)observers[0].fn();
  assert.equal(resizeWrites,writes,'Unchanged resize observations must not rewrite canvas dimensions');
  tick(45);
  assert.equal(timer.textContent,'0.0'); assert.equal(overlay.hidden,false);
  assert.match(get('[data-overlay-title]').innerHTML,/Beautiful footwork/);
  start.fire('click'); assert.equal(timer.textContent,'45.0');assert.equal(overlay.hidden,true);assert.equal(dash.disabled,false);
  for(let i=0;i<45*60&&overlay.hidden;i++)tick(1/60);
  assert.equal(overlay.hidden,false);
  assert.ok(get('[data-lives]').children.every(el=>el.classes.has('is-lost')),'Standing still takes three real hits and ends the round');
  assert.match(get('[data-overlay-title]').innerHTML,/One more try/);
  start.fire('click'); assert.equal(overlay.hidden,true); assert.equal(timer.textContent,'45.0');
  game.destroy();assert.equal(pendingFrames.size,0);assert.equal(observers[0].disconnected,true);
  assert.equal([...dialog.listeners.values(),...doc.listeners.values(),...win.listeners.values()].reduce((sum,list)=>sum+list.size,0),0);
} finally {
  Math.random=originalRandom;
  for(const [key,descriptor] of originals) descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];
}
console.log('Arena: geometry, real low-fps clock, actual mounted start/input/dash/pause/visibility/end/replay/cleanup and no-save checks passed.');
