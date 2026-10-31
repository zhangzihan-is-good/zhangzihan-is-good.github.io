// A local, in-memory rhythm game. Nothing is written to browser storage.
export const ROUND_MS = 40000;
export const TARGET = 0.76;

export function judgeTiming(position) {
  const distance = Math.abs(position - TARGET);
  return distance <= 0.028 ? 'perfect' : distance <= 0.085 ? 'good' : 'miss';
}

export function createRound() {
  return { elapsed: 0, cycleElapsed: 0, cycleMs: 1800, cycle: 0,
    attempted: false, score: 0, combo: 0, bestCombo: 0,
    perfect: 0, good: 0, miss: 0, reps: 0, done: false };
}

function applyJudgment(round, grade) {
  round[grade]++;
  if (grade === 'miss') round.combo = 0;
  else {
    round.reps++;
    round.combo++;
    round.bestCombo = Math.max(round.bestCombo, round.combo);
    round.score += (grade === 'perfect' ? 100 : 55) + Math.min(round.combo - 1, 10) * 5;
  }
  return grade;
}

export function strikeRound(round) {
  if (round.done || round.attempted) return null;
  round.attempted = true;
  return applyJudgment(round, judgeTiming(round.cycleElapsed / round.cycleMs));
}

export function advanceRound(round, milliseconds) {
  const events = [];
  if (round.done || !Number.isFinite(milliseconds) || milliseconds <= 0) return events;
  let remaining = Math.min(milliseconds, ROUND_MS - round.elapsed);
  while (remaining > 0.000001) {
    const step = Math.min(remaining, round.cycleMs - round.cycleElapsed);
    round.elapsed += step;
    round.cycleElapsed += step;
    remaining -= step;
    if (round.cycleElapsed >= round.cycleMs - 0.000001) {
      if (!round.attempted) events.push(applyJudgment(round, 'miss'));
      round.cycle++;
      round.cycleElapsed = 0;
      round.attempted = false;
      round.cycleMs = 1800 - 550 * round.elapsed / ROUND_MS;
    }
  }
  if (round.elapsed >= ROUND_MS - 0.000001) { round.elapsed = ROUND_MS; round.done = true; }
  return events;
}

// Count real active time even on a slow display. A long rendering stall pauses
// the session rather than silently skipping a whole beat the player never saw.
export function advanceFrame(round, milliseconds) {
  if (milliseconds > 1200) return { paused: true, events: [] };
  return { paused: false, events: advanceRound(round, milliseconds) };
}

const dual = (en, zh) => `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;
const labels = {
  ready: ['Find your rhythm.', '找到你的训练节奏。'],
  running: ['Hit when the marker reaches the green zone.', '标记进入绿色区域时发力。'],
  paused: ['Take a breath. Your session is paused.', '休息一下，训练已暂停。'],
  perfect: ['Perfect', '完美发力'], good: ['Good', '不错'], miss: ['Miss · next beat', '错过了 · 看下一拍'],
  finished: ['Session complete', '训练完成']
};

export function mount(container, context = {}) {
  container.innerHTML = `<div class="hfitness" tabindex="0" aria-label="Rhythm lifting game / 节奏举铁小游戏">
  <style>
  .hfitness{outline:none;--hf-amber:#edab60;--hf-coral:#db7862;--hf-green:#91d5ae;position:relative}
  .hfitness .zh{margin-left:.45em}.hfitness .hf-instructions .zh{display:block;margin:.3em 0 0}
  .hfitness .hf-instructions{font-size:13px;line-height:1.65;color:var(--muted);max-width:710px;margin:0 0 18px}
  .hfitness .hf-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
  .hfitness .hf-stat{padding:12px 15px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
  .hfitness .hf-stat dt{font-size:10px;color:var(--muted);line-height:1.6}.hfitness .hf-stat dd{font-family:var(--display);font-size:25px;font-weight:650;margin:3px 0 0;line-height:1.2;font-variant-numeric:tabular-nums}
  .hfitness .hf-stage{position:relative;border-radius:16px;overflow:hidden;background:#24232c;border:1px solid #ffffff14;isolation:isolate}
  .hfitness canvas{display:block;width:100%;height:clamp(225px,34vw,335px)}
  .hfitness .hf-stage-label{position:absolute;top:17px;left:19px;color:#f6dbc0;font:10px/1.5 var(--display);letter-spacing:2px;pointer-events:none}
  .hfitness .hf-stage-label small{display:block;font-size:8px;letter-spacing:1.2px;color:#c7b9b1;margin-top:3px}
  .hfitness .hf-grade{position:absolute;right:20px;top:18px;min-height:34px;color:var(--hf-amber);font-size:15px;font-weight:650;text-align:right;pointer-events:none}
  .hfitness .hf-grade[data-grade=perfect]{color:var(--hf-green)}.hfitness .hf-grade[data-grade=miss]{color:#eaa18c}
  .hfitness .hf-track-wrap{padding:19px 1px 0}.hfitness .hf-track-labels{display:flex;justify-content:space-between;color:var(--muted);font-size:10px;margin-bottom:9px}
  .hfitness .hf-track{height:30px;background:color-mix(in srgb,var(--ink) 7%,var(--surface));border:1px solid var(--line);border-radius:8px;position:relative;overflow:visible}
  .hfitness .hf-target{position:absolute;top:3px;bottom:3px;left:67.5%;width:17%;background:#91d5ae5c;border:1px solid #70aa88;border-radius:5px}
  .hfitness .hf-perfect-zone{position:absolute;left:73.2%;width:5.6%;top:3px;bottom:3px;border-radius:4px;background:#72bf91a6}
  .hfitness .hf-marker{position:absolute;top:-5px;bottom:-5px;left:0;width:5px;margin-left:-2px;background:var(--hf-coral);border-radius:5px;box-shadow:0 0 0 3px color-mix(in srgb,var(--surface) 90%,transparent);will-change:left}
  .hfitness .hf-duration{position:absolute;bottom:0;left:0;right:0;height:3px;background:#ffffff18}.hfitness .hf-duration span{display:block;height:100%;width:100%;background:var(--hf-amber);transform-origin:left}
  .hfitness .hf-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;flex-wrap:wrap}
  .hfitness .hf-session-actions{display:flex;gap:8px;flex-wrap:wrap}.hfitness button{min-height:44px;border:1px solid var(--line);border-radius:9px;padding:10px 16px;font-size:12px;background:var(--surface)}
  .hfitness button:focus-visible{outline:3px solid var(--purple);outline-offset:3px}.hfitness button:disabled{opacity:.45;cursor:default}
  .hfitness .hf-hit{min-width:172px;background:var(--hf-amber);border-color:transparent;color:#30231d;font-weight:700;box-shadow:0 4px 0 #a96d39;touch-action:manipulation;user-select:none}
  .hfitness .hf-hit:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 0 #a96d39}.hfitness .hf-start{background:var(--ink);color:var(--surface);border-color:var(--ink)}
  .hfitness .hf-note{font-size:10px;color:var(--muted);margin-top:16px;line-height:1.7}
  .hfitness .hf-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#1d1d27db;backdrop-filter:blur(7px);padding:24px;color:#fff1e0}
  .hfitness .hf-overlay[hidden]{display:none}.hfitness .hf-overlay h3{font-size:27px;color:inherit;margin:0 0 10px}.hfitness .hf-overlay p{font-size:13px;max-width:420px;color:#dfcfc4;line-height:1.8}
  .hfitness .hf-overlay strong{font-size:46px;display:block;font-family:var(--display);color:var(--hf-amber);font-weight:650;line-height:1.3;margin:7px 0}
  .hfitness .hf-overlay .zh{margin:0 .35em}.hfitness .hf-hidden-note{margin-top:12px;font-size:11px}
  html[data-language=zh] .hfitness .zh{margin-left:0}html[data-language=en] .hfitness .en,html[data-language=zh] .hfitness .zh{display:inline}
  @media(max-width:520px){.hfitness .hf-stat{padding:10px 8px}.hfitness .hf-stat dt{font-size:9px}.hfitness .hf-stat dt .zh{display:block;margin:0}.hfitness .hf-stat dd{font-size:21px}.hfitness .hf-hud{gap:6px}.hfitness .hf-controls{align-items:stretch}.hfitness .hf-hit{flex:1}.hfitness .hf-session-actions{flex:1}.hfitness .hf-session-actions button{flex:1}.hfitness .hf-stage-label{font-size:8px;left:13px;top:13px}.hfitness .hf-grade{font-size:12px;right:12px;top:12px}.hfitness .hf-overlay h3{font-size:21px}.hfitness .hf-overlay p{font-size:11px}}
  </style>
  <p class="hf-instructions">${dual('A 40-second rhythm session. Tap LIFT or press Space when the moving marker enters the green zone. One attempt per pass.', '40 秒节奏训练：移动标记进入绿色区域时，点击「发力」或按空格。每一轮经过只有一次机会。')}</p>
  <dl class="hf-hud"><div class="hf-stat"><dt>${dual('TIME', '剩余时间')}</dt><dd data-time>40<span style="font-size:12px">s</span></dd></div><div class="hf-stat"><dt>${dual('SCORE', '得分')}</dt><dd data-score>0</dd></div><div class="hf-stat"><dt>${dual('COMBO', '连击')}</dt><dd data-combo>0</dd></div><div class="hf-stat"><dt>${dual('GOOD REPS', '有效次数')}</dt><dd data-reps>0</dd></div></dl>
  <div class="hf-stage"><canvas aria-label="Animated athlete lifting a barbell / 举杠铃的运动人物"></canvas><div class="hf-stage-label">RHYTHM / STRENGTH<small>40 SECOND SESSION</small></div><div class="hf-grade" data-grade="ready" role="status" aria-live="polite">${dual(...labels.ready)}</div><div class="hf-duration"><span></span></div><div class="hf-overlay" data-overlay hidden></div></div>
  <div class="hf-track-wrap"><div class="hf-track-labels"><span>${dual('FOLLOW THE MARKER', '跟随标记')}</span><span>${dual('GREEN = LIFT', '绿色区域 = 发力')}</span></div><div class="hf-track" aria-hidden="true"><span class="hf-target"></span><span class="hf-perfect-zone"></span><span class="hf-marker"></span></div></div>
  <div class="hf-controls"><div class="hf-session-actions"><button class="hgame-button hf-start" type="button" data-start>${dual('Start session', '开始训练')}</button><button class="hgame-button" type="button" data-pause hidden>${dual('Pause', '暂停')}</button></div><button class="hgame-button hf-hit" type="button" data-hit disabled>${dual('LIFT', '发力')} <span aria-hidden="true">↥</span></button></div>
  <p class="hf-note">${dual('Accuracy builds your combo. Misses reset it. The session pauses when you leave this tab; use Resume to continue. Your result is not saved.', '准确命中可积累连击，失误会中断连击。离开此标签页时自动暂停，点击「继续」恢复。本局结果不会保存。')}</p>
  </div>`;

  const root = container.querySelector('.hfitness');
  const canvas = root.querySelector('canvas');
  const draw = canvas.getContext('2d');
  const start = root.querySelector('[data-start]'), pause = root.querySelector('[data-pause]'), hit = root.querySelector('[data-hit]');
  const marker = root.querySelector('.hf-marker'), grade = root.querySelector('.hf-grade'), overlay = root.querySelector('[data-overlay]');
  const time = root.querySelector('[data-time]'), score = root.querySelector('[data-score]'), combo = root.querySelector('[data-combo]'), reps = root.querySelector('[data-reps]');
  const duration = root.querySelector('.hf-duration span');
  let round = createRound(), state = 'ready', frameID = 0, lastNow = 0, destroyed = false;
  let width = 720, height = 320, lift = 0, glow = 0, shake = 0;
  const listeners = [];
  const listen = (target, event, fn, options) => { target.addEventListener(event, fn, options); listeners.push(() => target.removeEventListener(event, fn, options)); };
  const reduced = Boolean(context.reducedMotion);
  function status(key) { grade.dataset.grade = key; grade.innerHTML = dual(...labels[key]); }
  function hud() {
    time.innerHTML = `${Math.max(0, Math.ceil((ROUND_MS - round.elapsed) / 1000))}<span style="font-size:12px">s</span>`;
    score.textContent = round.score; combo.textContent = round.combo; reps.textContent = round.reps;
    marker.style.left = `${Math.min(100, round.cycleElapsed / round.cycleMs * 100)}%`;
    marker.style.opacity = round.attempted ? '.35' : '1';
    duration.style.transform = `scaleX(${1 - round.elapsed / ROUND_MS})`;
    hit.disabled = state !== 'running' || round.attempted;
  }
  function feedback(value) {
    status(value);
    if (value !== 'miss') { lift = 1; glow = value === 'perfect' ? 1 : .5; }
    else if (!reduced) shake = 1;
  }
  function stroke(points, color, lineWidth) {
    draw.beginPath(); draw.moveTo(...points[0]);
    points.slice(1).forEach(point => draw.lineTo(...point));
    draw.strokeStyle = color; draw.lineWidth = lineWidth; draw.lineCap = 'round'; draw.lineJoin = 'round'; draw.stroke();
  }
  function ellipse(x,y,rx,ry,color) { draw.beginPath();draw.ellipse(x,y,rx,ry,0,0,Math.PI*2);draw.fillStyle=color;draw.fill(); }
  function rounded(x,y,w,h,r,color) { draw.beginPath();draw.roundRect(x,y,w,h,r);draw.fillStyle=color;draw.fill(); }
  function render() {
    if (!draw || destroyed) return;
    draw.clearRect(0,0,width,height);
    const bg = draw.createLinearGradient(0,0,width,height);bg.addColorStop(0,'#30292f');bg.addColorStop(1,'#1c2029');
    draw.fillStyle=bg;draw.fillRect(0,0,width,height);
    const light=draw.createRadialGradient(width*.5,height*.2,5,width*.5,height*.3,width*.6);
    light.addColorStop(0,`rgba(237,171,96,${.1+glow*.12})`);light.addColorStop(1,'rgba(237,171,96,0)');draw.fillStyle=light;draw.fillRect(0,0,width,height);
    draw.strokeStyle='#ffffff07';draw.lineWidth=1;
    for(let i=1;i<9;i++){draw.beginPath();draw.moveTo(width*i/9,0);draw.lineTo(width*i/9,height);draw.stroke();}
    for(let i=1;i<5;i++){draw.beginPath();draw.moveTo(0,height*i/5);draw.lineTo(width,height*i/5);draw.stroke();}
    const scale=Math.min(width/660,height/340),cx=width/2,cy=height*.52;
    draw.save();draw.translate(cx+(reduced?0:Math.sin(shake*28)*shake*3),cy);draw.scale(scale,scale);
    ellipse(0,125,131,12,'#11161c');ellipse(0,125,98,5,'#f1b56912');
    stroke([[-145,121],[145,121]],'#dfaa6d38',2);
    // Squat-to-press motion uses a fixed visual pose under reduced motion.
    const pose=reduced?0:Math.sin(lift*Math.PI),bend=pose*7,barY=-25-pose*89;
    stroke([[-13,47+bend],[-39,83],[-44,118]],'#747d8b',21);
    stroke([[13,47+bend],[39,83],[44,118]],'#aeb7c1',21);
    stroke([[-53,120],[-29,120]],'#e7ddd0',10);stroke([[29,120],[53,120]],'#e7ddd0',10);
    const shirt=draw.createLinearGradient(-40,-45,40,64);shirt.addColorStop(0,'#a59ad7');shirt.addColorStop(1,'#73669c');
    rounded(-31,-46+bend,62,104,22,shirt);
    stroke([[-31,-27+bend],[-57,-13-pose*44],[-65,barY]],'#d4b399',15);
    stroke([[31,-27+bend],[57,-13-pose*44],[65,barY]],'#f2d3b5',15);
    rounded(-9,-64+bend,18,24,6,'#e5bfa1');ellipse(0,-85+bend,22,25,'#f1cfb0');
    draw.beginPath();draw.arc(0,-91+bend,24,Math.PI,Math.PI*2);draw.fillStyle='#33313e';draw.fill();
    rounded(-22,-101+bend,44,10,5,'#efac64');
    // A slightly tilted bar and layered weight plates give the drawing depth.
    stroke([[-137,barY],[137,barY]],'#c4c9ce',7);
    stroke([[-92,barY],[92,barY]],'#edf0ed',5);
    for(const side of [-1,1]){
      rounded(side===-1?-125:105,barY-35,20,70,5,'#d58164');
      rounded(side===-1?-108:95,barY-27,11,54,4,'#f1b56f');
      rounded(side===-1?-137:127,barY-8,10,16,3,'#a3aab3');
      ellipse(side*65,barY,9,9,'#f3d2b5');
    }
    if(!reduced&&glow>.1){draw.strokeStyle=`rgba(145,213,174,${glow*.35})`;draw.lineWidth=2;draw.beginPath();draw.arc(0,-20,142+(1-glow)*20,Math.PI*1.15,Math.PI*1.85);draw.stroke();}
    draw.restore();
    // Equipment rests at either edge, preserving a clear central silhouette.
    const sy=height*.83;stroke([[width*.12,sy],[width*.12,sy-50]],'#786b67',3);stroke([[width*.08,sy],[width*.16,sy]],'#786b67',3);
    rounded(width*.08,sy-55,width*.08,8,3,'#8f7770');
    if(width>480){stroke([[width*.88,sy],[width*.88,sy-54]],'#786b67',3);stroke([[width*.84,sy],[width*.92,sy]],'#786b67',3);ellipse(width*.88,sy-33,17,17,'#715f61');ellipse(width*.88,sy-33,5,5,'#282832');}
  }
  function stopFrame() { cancelAnimationFrame(frameID);frameID=0;lastNow=0; }
  function finish() {
    state='finished';stopFrame();status('finished');pause.hidden=true;
    start.innerHTML=dual('Train again','再练一局');start.hidden=false;
    overlay.hidden=false;overlay.innerHTML=`<h3>${dual(...labels.finished)}</h3><strong>${round.score}</strong><p>${dual(`${round.reps} good reps · ${round.perfect} perfect · best combo ${round.bestCombo}`,`${round.reps} 次有效动作 · ${round.perfect} 次完美发力 · 最高 ${round.bestCombo} 连击`)}</p><p class="hf-hidden-note">${dual('Press Train again for a fresh session.','点击「再练一局」开始新的训练。')}</p>`;
    hud();render();start.focus({preventScroll:true});
  }
  function tick(now) {
    if(destroyed||state!=='running')return;
    const elapsed=lastNow?Math.max(0,now-lastNow):0;lastNow=now;
    const previousCycle=round.cycle,step=advanceFrame(round,elapsed);
    if(step.paused){setPaused(true);return;}
    const events=step.events,dt=Math.min(elapsed,100);
    if(events.length)feedback(events.at(-1));
    else if(previousCycle!==round.cycle)status('running');
    lift=Math.max(0,lift-dt/670);glow=Math.max(0,glow-dt/900);shake=Math.max(0,shake-dt/300);
    hud();render();
    if(round.done)finish();else frameID=requestAnimationFrame(tick);
  }
  function begin() {
    stopFrame();round=createRound();lift=glow=shake=0;state='running';overlay.hidden=true;
    start.hidden=true;pause.hidden=false;pause.innerHTML=dual('Pause','暂停');status('running');hud();root.focus({preventScroll:true});lastNow=performance.now();frameID=requestAnimationFrame(tick);
  }
  function setPaused(paused) {
    if(paused&&state==='running'){
      state='paused';stopFrame();status('paused');pause.innerHTML=dual('Resume','继续');
      overlay.hidden=false;overlay.innerHTML=`<h3>${dual('Paused','已暂停')}</h3><p>${dual('Your time and rhythm are on hold. Press Resume when you are ready.','计时与节奏已停下。准备好后点击「继续」。')}</p>`;hud();render();
    }else if(!paused&&state==='paused'){
      state='running';overlay.hidden=true;pause.innerHTML=dual('Pause','暂停');status('running');lastNow=performance.now();hud();root.focus({preventScroll:true});frameID=requestAnimationFrame(tick);
    }
  }
  function attempt() {
    if(state!=='running')return;
    const result=strikeRound(round);if(!result)return;
    feedback(result);hud();render();
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw?.setTransform(dpr,0,0,dpr,0,0);render();
  }
  listen(start,'click',begin);
  listen(pause,'click',()=>setPaused(state==='running'));
  listen(hit,'click',attempt);
  listen(root,'keydown',event=>{
    if(event.code!=='Space'||event.repeat||state!=='running')return;
    if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    const button=event.target.closest('button');if(button&&button!==hit)return;
    event.preventDefault();attempt();
  });
  listen(document,'visibilitychange',()=>{if(document.hidden)setPaused(true);});
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  hud();resize();
  return {destroy(){if(destroyed)return;destroyed=true;stopFrame();observer.disconnect();listeners.forEach(remove=>remove());container.replaceChildren();}};
}
