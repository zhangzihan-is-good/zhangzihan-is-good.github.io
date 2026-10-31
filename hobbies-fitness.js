// Falling-arrow training. All game state lives only in this mounted session.
export const ROUND_MS = 40000;
export const DIRECTIONS = ['left', 'down', 'up', 'right'];
export const SPEEDS = Object.freeze({
  slow: { spacing: 1250, travel: 3300, perfect: 80, good: 190 },
  medium: { spacing: 900, travel: 2500, perfect: 70, good: 165 },
  fast: { spacing: 650, travel: 1850, perfect: 60, good: 145 }
});

export function createRound(speed = 'medium', seed = Date.now()) {
  if (!SPEEDS[speed]) speed = 'medium';
  const config = SPEEDS[speed], notes = [];
  let randomState = Number(seed) >>> 0;
  const random = () => { randomState = (1664525 * randomState + 1013904223) >>> 0; return randomState / 4294967296; };
  for (let spawnAt = 350, id = 0; spawnAt + config.travel <= ROUND_MS - 250; spawnAt += config.spacing, id++) {
    let direction = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)];
    if (id > 1 && notes[id - 1].direction === direction && notes[id - 2].direction === direction)
      direction = DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % 4];
    notes.push({ id, direction, spawnAt, hitAt: spawnAt + config.travel, resolved: false, grade: null, resolvedAt: null });
  }
  return { speed, config, notes, elapsed: 0, held: {}, score: 0, combo: 0,
    bestCombo: 0, perfect: 0, good: 0, miss: 0, wrong: 0, reps: 0, done: false };
}

function judgment(round, grade, direction, note = null, source = 'key') {
  round[grade]++;
  if (note) { note.resolved = true; note.grade = grade; note.resolvedAt = round.elapsed; }
  if (grade === 'miss') {
    round.combo = 0;
    if (source === 'wrong') { round.wrong++; round.score = Math.max(0, round.score - 60); }
  } else {
    round.reps++; round.combo++; round.bestCombo = Math.max(round.bestCombo, round.combo);
    round.score += (grade === 'perfect' ? 100 : 60) + Math.min(round.combo - 1, 10) * 5;
  }
  return { grade, direction, noteId: note?.id ?? null, source };
}

export function advanceRound(round, milliseconds) {
  const events = [];
  if (round.done || !Number.isFinite(milliseconds) || milliseconds < 0) return events;
  round.elapsed = Math.min(ROUND_MS, round.elapsed + milliseconds);
  for (const note of round.notes) {
    if (!note.resolved && (round.elapsed > note.hitAt + round.config.good || round.elapsed === ROUND_MS))
      events.push(judgment(round, 'miss', note.direction, note, 'late'));
  }
  if (round.elapsed === ROUND_MS) { round.done = true; round.held = {}; }
  return events;
}

export function strikeRound(round, direction, options = {}) {
  if (round.done || !DIRECTIONS.includes(direction) || options.repeat || round.held[direction]) return null;
  round.held[direction] = true;
  const candidates = round.notes.filter(note => !note.resolved && Math.abs(note.hitAt - round.elapsed) <= round.config.good)
    .sort((a,b) => Math.abs(a.hitAt - round.elapsed) - Math.abs(b.hitAt - round.elapsed));
  const note = candidates.find(candidate => candidate.direction === direction);
  if (note) return judgment(round, Math.abs(note.hitAt - round.elapsed) <= round.config.perfect ? 'perfect' : 'good', direction, note);
  // A wrong direction during a note's window consumes that note. Pressing every
  // direction cannot turn the same beat into a success after the wrong input.
  return judgment(round, 'miss', direction, candidates[0] || null, 'wrong');
}

export function releaseRound(round, direction) { delete round.held[direction]; }
export function keyDirection(key, code = '') {
  const map = { ArrowLeft: 'left', ArrowDown: 'down', ArrowUp: 'up', ArrowRight: 'right',
    Numpad4: 'left', Numpad2: 'down', Numpad8: 'up', Numpad6: 'right' };
  return map[key] || map[code] || null;
}

const arrows = { left: '←', down: '↓', up: '↑', right: '→' };
const colors = { left: '#bb9ae8', down: '#efad73', up: '#8bd3b3', right: '#8fc3e5' };
const dual = (en, zh) => `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;
const speedLabels = { slow: ['Slow','慢速'], medium: ['Medium','中速'], fast: ['Fast','快速'] };

export function mount(container, context = {}) {
  container.innerHTML = `<div class="hfitness" tabindex="0" aria-label="Falling-arrow dumbbell game / 方向箭头哑铃小游戏">
  <style>
  .hfitness{outline:none;--hf-amber:#edab60;--hf-green:#91d5ae;position:relative}.hfitness .zh{margin-left:.45em}
  .hfitness .hf-instructions{font-size:13px;line-height:1.7;color:var(--muted);margin:0 0 15px}.hfitness .hf-instructions .zh{display:block;margin:.25em 0 0}
  .hfitness .hf-setup{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:14px;flex-wrap:wrap}.hfitness .hf-setup-title{font-size:11px;color:var(--muted)}
  .hfitness .hf-speeds{display:flex;gap:5px;padding:4px;border:1px solid var(--line);border-radius:10px;background:var(--surface);margin:0;min-width:0}.hfitness .hf-speeds legend{position:absolute;clip:rect(0,0,0,0);width:1px;height:1px;overflow:hidden}.hfitness .hf-speeds label{position:relative;cursor:pointer;min-width:75px}.hfitness .hf-speeds input{position:absolute;opacity:0;width:1px;height:1px}.hfitness .hf-speeds label>span{display:block;padding:7px 12px;font-size:11px;text-align:center;border-radius:6px;color:var(--muted)}.hfitness .hf-speeds input:checked+span{background:var(--ink);color:var(--surface)}.hfitness .hf-speeds input:focus-visible+span{outline:3px solid var(--purple);outline-offset:2px}.hfitness .hf-speeds input:disabled+span{opacity:.65}.hfitness .hf-speeds input:disabled:checked+span{opacity:1}
  .hfitness .hf-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.hfitness .hf-stat{padding:10px 14px;border:1px solid var(--line);border-radius:11px;background:var(--surface)}.hfitness .hf-stat dt{font-size:10px;color:var(--muted);line-height:1.5}.hfitness .hf-stat dd{font-family:var(--display);font-size:24px;font-weight:650;margin:3px 0 0;line-height:1.2;font-variant-numeric:tabular-nums}
  .hfitness .hf-board{position:relative;display:grid;grid-template-columns:1.5fr 1fr;border:1px solid #ffffff12;border-radius:16px;overflow:hidden;background:#23232e;isolation:isolate}.hfitness .hf-arrow-panel,.hfitness .hf-athlete-panel{position:relative;min-width:0}.hfitness .hf-athlete-panel{border-left:1px solid #ffffff0b;background:#302830}
  .hfitness canvas{display:block;width:100%;height:clamp(300px,40vw,370px)}.hfitness .hf-panel-caption{position:absolute;top:13px;left:15px;color:#b5adbf;font:8px/1.5 var(--display);letter-spacing:1.8px;pointer-events:none}.hfitness .hf-panel-caption .zh{letter-spacing:.8px}.hfitness .hf-grade{position:absolute;right:16px;top:14px;color:#f1c58e;font-size:14px;font-weight:650;pointer-events:none;text-align:right}.hfitness .hf-grade[data-grade=perfect]{color:#91d5ae}.hfitness .hf-grade[data-grade=miss]{color:#eca38f}
  .hfitness .hf-duration{position:absolute;bottom:0;left:0;right:0;height:3px;background:#ffffff18}.hfitness .hf-duration span{display:block;height:100%;width:100%;background:var(--hf-amber);transform-origin:left}
  .hfitness .hf-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;flex-wrap:wrap}.hfitness .hf-session-actions{display:flex;gap:8px;flex-wrap:wrap}.hfitness .hf-session-actions button{min-height:44px;border:1px solid var(--line);border-radius:9px;padding:10px 16px;font-size:12px;background:var(--surface)}.hfitness button:focus-visible{outline:3px solid var(--purple);outline-offset:3px}.hfitness .hf-session-actions .hf-start{background:var(--ink);color:var(--surface);border-color:var(--ink)}
  .hfitness .hf-keys{display:flex;gap:7px}.hfitness .hf-key{display:grid;place-items:center;width:52px;height:47px;border:1px solid var(--line);border-radius:9px;background:var(--surface);font:700 28px/1 var(--display);box-shadow:0 3px 0 color-mix(in srgb,var(--ink) 12%,transparent);touch-action:manipulation;user-select:none;color:var(--ink)}.hfitness .hf-key:disabled{opacity:.42;cursor:default}.hfitness .hf-key[data-pressed=true]{transform:translateY(2px);box-shadow:0 1px 0 #0001;background:color-mix(in srgb,var(--purple) 18%,var(--surface));border-color:var(--purple)}
  .hfitness .hf-note{font-size:10px;color:var(--muted);margin-top:14px;line-height:1.7}.hfitness .hf-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#1c1e2adf;backdrop-filter:blur(7px);padding:22px;color:#fff1e0;z-index:2}.hfitness .hf-overlay[hidden]{display:none}.hfitness .hf-overlay h3{font-size:25px;color:inherit;margin:0 0 10px}.hfitness .hf-overlay p{font-size:12px;max-width:430px;color:#dfcfc4;line-height:1.8}.hfitness .hf-overlay strong{font-size:45px;display:block;font-family:var(--display);color:var(--hf-amber);font-weight:650;line-height:1.2;margin:7px 0}.hfitness .hf-overlay .zh{margin:0 .35em}.hfitness .hf-overlay .hf-arrow-sample{font-size:34px;letter-spacing:12px;color:#bca5e6;margin:5px 0 16px}
  html[data-language=zh] .hfitness .zh{margin-left:0}
  @media(max-width:580px){.hfitness .hf-board{grid-template-columns:minmax(0,1.9fr) minmax(82px,1fr)}.hfitness canvas{height:310px}.hfitness .hf-stat{padding:9px 8px}.hfitness .hf-stat dt{font-size:9px}.hfitness .hf-stat dt .zh{display:block;margin:0}.hfitness .hf-stat dd{font-size:21px}.hfitness .hf-hud{gap:6px}.hfitness .hf-controls{align-items:stretch;flex-direction:column}.hfitness .hf-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.hfitness .hf-key{width:100%;height:50px}.hfitness .hf-session-actions button{flex:1}.hfitness .hf-panel-caption{font-size:7px;left:9px;letter-spacing:1px}.hfitness .hf-athlete-panel .hf-panel-caption{right:5px;left:5px;text-align:center;font-size:6px;letter-spacing:.8px}.hfitness .hf-grade{font-size:11px;right:9px;top:34px}.hfitness .hf-setup{gap:9px}.hfitness .hf-speeds{width:100%}.hfitness .hf-speeds label{flex:1;min-width:0}.hfitness .hf-speeds label>span{padding:6px 8px}.hfitness .hf-overlay h3{font-size:20px}.hfitness .hf-overlay p{font-size:11px}}
  </style>
  <p class="hf-instructions">${dual('Follow the arrows from top to bottom. Press the matching arrow key when a note meets the glowing line to lift a dumbbell.', '箭头从上向下落。到达发光判定线时，按下对应方向键，让人物举起哑铃。')}</p>
  <div class="hf-setup"><span class="hf-setup-title">${dual('CHOOSE YOUR PACE', '选择训练速度')}</span><fieldset class="hf-speeds"><legend>${dual('Training speed', '训练速度')}</legend>${Object.keys(SPEEDS).map(speed=>`<label><input type="radio" name="hf-speed" value="${speed}"${speed==='medium'?' checked':''}><span>${dual(...speedLabels[speed])}</span></label>`).join('')}</fieldset></div>
  <dl class="hf-hud"><div class="hf-stat"><dt>${dual('TIME', '剩余时间')}</dt><dd data-time>40<span style="font-size:12px">s</span></dd></div><div class="hf-stat"><dt>${dual('SCORE', '得分')}</dt><dd data-score>0</dd></div><div class="hf-stat"><dt>${dual('COMBO', '连击')}</dt><dd data-combo>0</dd></div><div class="hf-stat"><dt>${dual('GOOD REPS', '有效次数')}</dt><dd data-reps>0</dd></div></dl>
  <div class="hf-board"><div class="hf-arrow-panel"><canvas data-lanes aria-label="Four falling-arrow lanes / 四列下落方向箭头"></canvas><div class="hf-panel-caption">ARROW TRAINING / 40 SEC</div></div><div class="hf-athlete-panel"><canvas data-athlete aria-label="Athlete raises a dumbbell for each correct arrow / 正确命中时人物举起哑铃"></canvas><div class="hf-panel-caption">FIND YOUR RHYTHM</div></div><div class="hf-grade" data-grade="ready" role="status" aria-live="polite"></div><div class="hf-duration"><span></span></div><div class="hf-overlay" data-overlay><div class="hf-arrow-sample" aria-hidden="true">← ↓ ↑ →</div><h3>${dual('A little rhythm. A little strength.', '跟着节奏，举起哑铃。')}</h3><p>${dual('Choose Slow, Medium or Fast, then start. Match the falling arrows at the bottom line. Use the arrow buttons on a touch screen.', '选择慢速、中速或快速，再开始训练。在底部判定线匹配下落箭头；触屏可使用下方四个方向按钮。')}</p></div></div>
  <div class="hf-controls"><div class="hf-session-actions"><button class="hgame-button hf-start" type="button" data-start>${dual('Start session', '开始训练')}</button><button class="hgame-button" type="button" data-pause hidden>${dual('Pause', '暂停')}</button></div><div class="hf-keys" role="group" aria-label="Arrow controls / 方向操作">${DIRECTIONS.map(direction=>`<button class="hf-key" type="button" data-direction="${direction}" aria-label="${direction} / ${{left:'左',down:'下',up:'上',right:'右'}[direction]}" disabled>${arrows[direction]}</button>`).join('')}</div></div>
  <p class="hf-note">${dual('Arrow keys / numeric-keypad arrows · one press per note · wrong directions and missed arrows break your combo. Pause any time; switching tabs pauses automatically. No progress is saved.', '使用键盘方向键或数字小键盘方向键，每个箭头按一次。按错或漏掉会中断连击。可随时暂停，切换标签页自动暂停；不保存进度。')}</p>
  </div>`;

  const root=container.querySelector('.hfitness'), laneCanvas=root.querySelector('[data-lanes]'), athleteCanvas=root.querySelector('[data-athlete]');
  const laneDraw=laneCanvas.getContext('2d'), athleteDraw=athleteCanvas.getContext('2d');
  const start=root.querySelector('[data-start]'),pause=root.querySelector('[data-pause]'),grade=root.querySelector('.hf-grade'),overlay=root.querySelector('[data-overlay]');
  const time=root.querySelector('[data-time]'),score=root.querySelector('[data-score]'),combo=root.querySelector('[data-combo]'),reps=root.querySelector('[data-reps]'),duration=root.querySelector('.hf-duration span');
  const speedInputs=[...root.querySelectorAll('[name="hf-speed"]')],keys=[...root.querySelectorAll('[data-direction]')];
  const dimensions=new Map(),listeners=[],reduced=Boolean(context.reducedMotion);
  let round=createRound(),state='ready',frameID=0,lastNow=0,destroyed=false,leftLift=0,rightLift=0,glow=0;
  const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);listeners.push(()=>target.removeEventListener(event,fn,options));};
  function hud(){
    time.innerHTML=`${Math.max(0,Math.ceil((ROUND_MS-round.elapsed)/1000))}<span style="font-size:12px">s</span>`;
    score.textContent=round.score;combo.textContent=round.combo;reps.textContent=round.reps;duration.style.transform=`scaleX(${1-round.elapsed/ROUND_MS})`;
    keys.forEach(key=>{key.disabled=state!=='running';key.dataset.pressed=String(Boolean(round.held[key.dataset.direction]));});
  }
  function feedback(event){
    if(!event)return;grade.dataset.grade=event.grade;
    grade.innerHTML=dual(...(event.grade==='perfect'?['Perfect','完美']:event.grade==='good'?['Good','不错']:event.source==='wrong'?['Wrong arrow','方向错误']:['Miss','漏掉了']))+` ${arrows[event.direction]}`;
    if(event.grade!=='miss'){if(event.direction==='left'||event.direction==='up')leftLift=1;else rightLift=1;glow=1;}
  }
  function arrow(ctx,x,y,size,direction,color,alpha=1,outline=false){
    ctx.save();ctx.translate(x,y);ctx.rotate({up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[direction]);ctx.globalAlpha=alpha;
    ctx.beginPath();ctx.moveTo(0,-size*.52);ctx.lineTo(size*.47,-size*.05);ctx.lineTo(size*.19,-size*.05);ctx.lineTo(size*.19,size*.43);ctx.lineTo(-size*.19,size*.43);ctx.lineTo(-size*.19,-size*.05);ctx.lineTo(-size*.47,-size*.05);ctx.closePath();
    if(outline){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}else{ctx.shadowBlur=reduced?0:13;ctx.shadowColor=color;ctx.fillStyle=color;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffffff60';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
  }
  function renderLanes(){
    if(!laneDraw)return;const {width:w,height:h}=dimensions.get(laneCanvas)||{width:450,height:360},ctx=laneDraw,line=h-62,lane=w/4,size=Math.min(48,lane*.62);
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#292735');bg.addColorStop(1,'#191f2b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    DIRECTIONS.forEach((direction,i)=>{
      const x=(i+.5)*lane;ctx.fillStyle=i%2?'#ffffff03':'#00000008';ctx.fillRect(i*lane,0,lane,h);
      ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo((i+1)*lane,0);ctx.lineTo((i+1)*lane,h);ctx.stroke();
      const isHeld=round.held[direction];arrow(ctx,x,line,size,direction,isHeld?colors[direction]:'#8a8697',isHeld?1:.6,true);
    });
    ctx.fillStyle='#91d5ae0d';ctx.fillRect(0,line-17,w,34);ctx.strokeStyle='#efbc7f8c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,line);ctx.lineTo(w,line);ctx.stroke();
    const notes=state==='ready'?[{direction:'left',spawnAt:0,hitAt:1,resolved:false,previewY:72},{direction:'up',spawnAt:0,hitAt:1,resolved:false,previewY:142},{direction:'right',spawnAt:0,hitAt:1,resolved:false,previewY:215}]:round.notes;
    for(const note of notes){
      const x=(DIRECTIONS.indexOf(note.direction)+.5)*lane;
      if(note.resolved){
        const age=round.elapsed-note.resolvedAt;if(age<240&&note.grade!=='miss'&&!reduced){ctx.strokeStyle=colors[note.direction];ctx.globalAlpha=1-age/240;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,line,size*.5+age*.08,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
        continue;
      }
      if(note.previewY!==undefined){arrow(ctx,x,note.previewY,size,note.direction,colors[note.direction],.45);continue;}
      if(round.elapsed<note.spawnAt||round.elapsed>note.hitAt+round.config.good)continue;
      const progress=(round.elapsed-note.spawnAt)/(note.hitAt-note.spawnAt),y=-size+(line+size)*progress;
      arrow(ctx,x,y,size,note.direction,colors[note.direction]);
    }
    ctx.textAlign='center';ctx.font='9px sans-serif';ctx.fillStyle='#a8a3b4';ctx.fillText(document.documentElement.dataset.language==='zh'?'判 定 线':'JUDGEMENT LINE',w/2,h-15);
  }
  function stroke(ctx,points,color,width){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(point=>ctx.lineTo(...point));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function rounded(ctx,x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
  function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function renderAthlete(){
    if(!athleteDraw)return;const {width:w,height:h}=dimensions.get(athleteCanvas)||{width:300,height:360},ctx=athleteDraw;
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#362c33');bg.addColorStop(1,'#25242f');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const light=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.4,w*.8);light.addColorStop(0,`rgba(237,171,96,${.13+glow*.12})`);light.addColorStop(1,'#edab6000');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/235,h/315);ctx.save();ctx.translate(w/2,h*.53);ctx.scale(scale,scale);
    ellipse(ctx,0,119,85,9,'#171b23');stroke(ctx,[[-92,119],[92,119]],'#dfaa6d35',2);
    stroke(ctx,[[-13,47],[-29,82],[-33,113]],'#747c8a',18);stroke(ctx,[[13,47],[29,82],[33,113]],'#a4aebb',18);
    stroke(ctx,[[-43,116],[-23,116]],'#e8dfd4',9);stroke(ctx,[[23,116],[43,116]],'#e8dfd4',9);
    const shirt=ctx.createLinearGradient(-32,-43,32,58);shirt.addColorStop(0,'#ad9edc');shirt.addColorStop(1,'#756698');rounded(ctx,-30,-42,60,101,21,shirt);
    rounded(ctx,-9,-60,18,22,6,'#e7bfa0');ellipse(ctx,0,-82,22,25,'#efceb0');
    ctx.beginPath();ctx.arc(0,-89,24,Math.PI,Math.PI*2);ctx.fillStyle='#33313e';ctx.fill();rounded(ctx,-22,-99,44,9,5,'#eda663');
    for(const side of [-1,1]){
      const lift=side===-1?leftLift:rightLift,p=reduced?(lift>.1?.65:0):Math.sin(lift*Math.PI),handX=side*(63-p*9),handY=36-p*88;
      stroke(ctx,[[side*30,-25],[side*50,7],[handX,handY]],side<0?'#d6b498':'#efceb0',14);
      stroke(ctx,[[handX-21,handY],[handX+21,handY]],'#c1c8d0',5);
      rounded(ctx,handX-25,handY-15,10,30,3,'#e29a6f');rounded(ctx,handX+15,handY-15,10,30,3,'#edb473');ellipse(ctx,handX,handY,7,7,'#f3d0af');
    }
    if(glow>.1&&!reduced){ctx.strokeStyle=`rgba(145,213,174,${glow*.4})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-2,102+(1-glow)*12,Math.PI*1.15,Math.PI*1.85);ctx.stroke();}
    ctx.restore();
  }
  function render(){if(destroyed)return;renderLanes();renderAthlete();}
  function stopFrame(){cancelAnimationFrame(frameID);frameID=0;lastNow=0;}
  function finish(){
    state='finished';stopFrame();pause.hidden=true;start.hidden=false;start.innerHTML=dual('Train again','再练一局');speedInputs.forEach(input=>input.disabled=false);keys.forEach(key=>key.dataset.pressed='false');
    grade.innerHTML='';overlay.hidden=false;overlay.innerHTML=`<h3>${dual('Session complete','训练完成')}</h3><strong>${round.score}</strong><p>${dual(`${round.reps} lifts · ${round.perfect} perfect · best combo ${round.bestCombo}`,`${round.reps} 次举起 · ${round.perfect} 次完美 · 最高 ${round.bestCombo} 连击`)}</p><p>${dual('Choose a pace and train again.','可重新选择速度，再练一局。')}</p>`;hud();render();start.focus({preventScroll:true});
  }
  function syncClock(now){
    const elapsed=lastNow?Math.max(0,now-lastNow):0;lastNow=Math.max(lastNow,now);
    const events=advanceRound(round,elapsed);if(events.length)feedback(events.at(-1));
    if(round.done){finish();return false;}return true;
  }
  function tick(now){
    if(destroyed||state!=='running')return;const visualDelta=Math.min(lastNow?Math.max(0,now-lastNow):0,100);
    if(!syncClock(now))return;leftLift=Math.max(0,leftLift-visualDelta/560);rightLift=Math.max(0,rightLift-visualDelta/560);glow=Math.max(0,glow-visualDelta/800);hud();render();frameID=requestAnimationFrame(tick);
  }
  function begin(){
    stopFrame();round=createRound(speedInputs.find(input=>input.checked)?.value||'medium');state='running';leftLift=rightLift=glow=0;overlay.hidden=true;grade.innerHTML='';start.hidden=true;pause.hidden=false;pause.innerHTML=dual('Pause','暂停');speedInputs.forEach(input=>input.disabled=true);hud();root.focus({preventScroll:true});lastNow=performance.now();frameID=requestAnimationFrame(tick);
  }
  function setPaused(paused){
    if(paused&&state==='running'){
      if(!syncClock(performance.now()))return;state='paused';stopFrame();round.held={};pause.innerHTML=dual('Resume','继续');overlay.hidden=false;overlay.innerHTML=`<h3>${dual('Paused','已暂停')}</h3><p>${dual('Time and arrows are on hold. Press Resume when you are ready.','计时和箭头已停下，准备好后点击「继续」。')}</p>`;hud();render();
    }else if(!paused&&state==='paused'){
      state='running';overlay.hidden=true;pause.innerHTML=dual('Pause','暂停');hud();root.focus({preventScroll:true});lastNow=performance.now();frameID=requestAnimationFrame(tick);
    }
  }
  function attempt(direction,repeat=false){if(state!=='running'||repeat)return;if(!syncClock(performance.now()))return;feedback(strikeRound(round,direction,{repeat}));hud();render();}
  function release(direction){releaseRound(round,direction);hud();}
  function resize(){
    for(const canvas of [laneCanvas,athleteCanvas]){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)continue;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);canvas.getContext('2d')?.setTransform(dpr,0,0,dpr,0,0);dimensions.set(canvas,{width:rect.width,height:rect.height});}render();
  }
  listen(start,'click',begin);listen(pause,'click',()=>setPaused(state==='running'));
  for(const canvas of [laneCanvas,athleteCanvas])listen(canvas,'pointerdown',()=>{if(state==='running')root.focus({preventScroll:true});});
  listen(root,'keydown',event=>{const direction=keyDirection(event.key,event.code);if(!direction||state!=='running'||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;event.preventDefault();attempt(direction,event.repeat);});
  // Releasing outside the panel only clears held-key state; it never intercepts
  // page keys. This avoids a stuck direction if focus moved while held down.
  listen(window,'keyup',event=>{const direction=keyDirection(event.key,event.code);if(direction)release(direction);});
  listen(root,'focusout',event=>{if(!root.contains(event.relatedTarget)){round.held={};hud();}});
  keys.forEach(key=>{
    const direction=key.dataset.direction;
    listen(key,'pointerdown',event=>{if(event.button!==0||state!=='running')return;event.preventDefault();key.setPointerCapture(event.pointerId);attempt(direction);});
    listen(key,'pointerup',()=>release(direction));listen(key,'pointercancel',()=>release(direction));listen(key,'lostpointercapture',()=>release(direction));
    listen(key,'click',event=>{if(event.detail===0){attempt(direction);release(direction);}});
  });
  listen(document,'visibilitychange',()=>{if(document.hidden)setPaused(true);});
  const observer=new ResizeObserver(resize);observer.observe(laneCanvas);observer.observe(athleteCanvas);hud();resize();
  return {destroy(){if(destroyed)return;destroyed=true;stopFrame();observer.disconnect();listeners.forEach(remove=>remove());container.replaceChildren();}};
}
