/** Browser-local footwork practice. State exists only for this open game. */
const W = 900, H = 520, EDGE = 40, ROUND = 45;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const length = (x, y) => Math.hypot(x, y);
const dual = (en, zh) => `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;

/** Physics catch-up is bounded; the round clock still consumes real active time. */
export function simulationSteps(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return [];
  // Never replay seconds of unseen attacks after a delayed animation frame.
  const physicsSeconds = Math.min(seconds, .25);
  const count = Math.ceil(physicsSeconds / (1 / 120));
  return Array.from({length: count}, () => physicsSeconds / count);
}

export function advanceRoundClock(elapsed, cooldown, seconds) {
  const activeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return {elapsed: Math.min(ROUND, elapsed + activeSeconds), cooldown: Math.max(0, cooldown - activeSeconds)};
}

export function segmentDistanceSquared(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = dx || dy ? clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1) : 0;
  return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
}

/** Exact circle/sector intersection, including the two radial edges. */
export function intersectsCone(player, cone) {
  const dx = player.x - cone.x, dy = player.y - cone.y;
  const distance = length(dx, dy), delta = Math.atan2(Math.sin(Math.atan2(dy, dx) - cone.angle), Math.cos(Math.atan2(dy, dx) - cone.angle));
  if (Math.abs(delta) <= cone.spread && distance <= cone.radius + player.radius) return true;
  for (const a of [cone.angle - cone.spread, cone.angle + cone.spread]) {
    if (segmentDistanceSquared(player.x, player.y, cone.x, cone.y, cone.x + Math.cos(a) * cone.radius, cone.y + Math.sin(a) * cone.radius) <= player.radius ** 2) return true;
  }
  return false;
}

export function dashDestination(player, direction, distance = 135) {
  const size = length(direction.x, direction.y) || 1;
  return {x: clamp(player.x + direction.x / size * distance, EDGE + player.radius, W - EDGE - player.radius), y: clamp(player.y + direction.y / size * distance, EDGE + player.radius, H - EDGE - player.radius)};
}

const css = `
.harena{--ha-blue:#75d7ef;--ha-gold:#e2bd78;color:var(--ink);width:100%;font-family:inherit}
.harena .ha-heading{display:none}
.harena .ha-eyebrow{font-size:10px;font-weight:700;letter-spacing:.2em;color:var(--muted);margin-bottom:7px}
.harena .ha-heading h3{font-size:clamp(22px,3vw,32px);letter-spacing:-.045em;margin:0;line-height:1.3}
.harena .ha-heading h3 .zh{display:block;font-size:.58em;letter-spacing:.03em;color:var(--muted);margin:6px 0 0}
.harena .ha-duration{font-size:12px;color:var(--muted);text-align:right;white-space:nowrap}
.harena .ha-duration strong{display:block;font-size:30px;font-family:var(--display,inherit);letter-spacing:-.08em;color:var(--ink);font-weight:500;line-height:1.2}
.harena .ha-hud{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-bottom:0;border-radius:13px 13px 0 0;overflow:hidden}
.harena .ha-hud>div{padding:13px 18px;background:var(--surface);display:flex;gap:12px;align-items:center;justify-content:space-between}
.harena .ha-hud-label{font-size:10px;letter-spacing:.035em;color:var(--muted);line-height:1.6}
.harena .ha-hud-label .zh{display:block;margin:0;font-size:10px}
.harena .ha-value{font-variant-numeric:tabular-nums;font-family:var(--display,inherit);font-weight:650;font-size:21px;line-height:1.2;white-space:nowrap}
.harena .ha-lives{font-size:21px;letter-spacing:3px;color:#c36871;white-space:nowrap}
.harena .ha-lives i{font-style:normal;transition:opacity .2s}.harena .ha-lives .is-lost{opacity:.18}
.harena .ha-field{--ha-field-height:min(45dvh,420px);position:relative;display:grid;justify-items:center;background:radial-gradient(ellipse at center,#153746,#0c1c29);border-radius:0 0 14px 14px;isolation:isolate;overflow:hidden;border:1px solid #254151;box-shadow:0 18px 45px #071a2917}
.harena .ha-canvas{width:min(100%,calc(var(--ha-field-height)*1.730769));height:auto;aspect-ratio:900/520;display:block;touch-action:none;outline-offset:-5px;cursor:crosshair}
.harena .ha-canvas:focus-visible{outline:2px solid var(--ha-gold)}
.harena .ha-overlay{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;overflow:auto;overscroll-behavior:contain;padding:22px;background:#07141e5c;backdrop-filter:blur(3px);z-index:2;text-align:center;color:#e7f2f4}
.harena .ha-overlay[hidden]{display:none}.harena .ha-panel{width:100%;max-width:460px;min-width:0;flex-shrink:0;margin:auto;padding:26px 34px;background:linear-gradient(145deg,#193b4aeb,#102331f5);border:1px solid #7096a454;border-radius:16px;box-shadow:0 24px 75px #0005}
.harena .ha-crest{width:42px;height:42px;margin:0 auto 16px;color:var(--ha-gold)}
.harena .ha-panel h4{font-size:clamp(23px,4vw,35px);font-weight:550;letter-spacing:-.045em;line-height:1.22;margin:0 0 12px;font-family:var(--display,inherit)}
.harena .ha-panel h4 .zh{display:block;font-size:.58em;letter-spacing:.06em;margin-top:7px;color:#b8cbd1}
.harena .ha-panel p{font-size:12px;line-height:1.7;color:#b8cbd1;margin:0 0 20px}.harena .ha-panel p .zh{display:block;margin-top:3px;font-size:12px}
.harena .ha-primary{border:1px solid #e2bd7880!important;background:#e2bd78!important;color:#142c36!important;padding:10px 24px!important;border-radius:8px;font-size:12px;font-weight:650;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;cursor:pointer}
.harena .ha-primary:hover{background:#f1cf92!important;transform:translateY(-1px)}
.harena .ha-controls{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:15px;flex-wrap:wrap}
.harena .ha-buttons{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.harena .ha-control{border:1px solid var(--line);border-radius:8px;min-height:42px;padding:9px 15px;font-size:12px;background:var(--surface);display:inline-flex;gap:6px;align-items:center;cursor:pointer}
.harena .ha-control:hover:not(:disabled){border-color:var(--purple);color:var(--purple)}.harena .ha-control:disabled{opacity:.46;cursor:default}
.harena .ha-dash{min-width:164px;position:relative;overflow:hidden}.harena .ha-dash>span{position:relative;z-index:1}.harena .ha-dash:before{content:'';position:absolute;inset:0;background:color-mix(in srgb,var(--ha-blue) 18%,transparent);transform:scaleX(var(--ha-charge,1));transform-origin:left}
.harena .ha-dash kbd{font-size:10px;border:1px solid var(--line);border-radius:3px;padding:1px 4px;margin-right:3px;color:var(--muted)}
.harena .ha-legend{font-size:10px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap}.harena .ha-legend>span{display:flex;align-items:center;gap:5px}.harena .ha-legend i{display:block;width:7px;height:7px;border-radius:50%;background:#d9ae64}.harena .ha-legend>span:nth-child(2) i{background:#ce7c9a}.harena .ha-legend>span:nth-child(3) i{background:#6faebb}
.harena .ha-instructions{font-size:12px;color:var(--muted);line-height:1.85;margin-top:15px;padding-top:14px;border-top:1px solid var(--line)}
.harena .ha-instructions .zh{display:block;margin:4px 0 0;font-size:12px}.harena .ha-status{min-height:1.5em;font-size:12px;margin:8px 0 0;color:var(--muted)}
.harena .ha-status .zh{margin-left:8px}.harena .ha-touch-note{display:none}
@media(pointer:coarse){.harena .ha-touch-note{display:inline}.harena .ha-key-note{display:none}}
@media(max-width:600px){.harena .ha-hud>div{padding:8px 9px;gap:4px;flex-direction:column;align-items:flex-start}.harena .ha-hud-label{font-size:9px}.harena .ha-hud-label .zh{font-size:9px;display:inline;margin-left:4px}.harena .ha-value{font-size:20px}.harena .ha-lives{font-size:20px}.harena .ha-panel{padding:10px 16px}.harena .ha-crest{display:none}.harena .ha-panel p{font-size:10px;line-height:1.5;margin-bottom:10px}.harena .ha-panel p .zh{font-size:10px}.harena .ha-panel h4{font-size:20px;margin-bottom:7px}.harena .ha-overlay{padding:9px}.harena .ha-primary{min-height:39px;padding:8px 18px!important}.harena .ha-controls{margin-top:10px;gap:10px}.harena .ha-legend{width:100%;gap:12px;font-size:9px}.harena .ha-control{padding:9px 12px}.harena .ha-instructions,.harena .ha-instructions .zh{font-size:11px}}
@media(max-height:600px) and (min-width:601px){.harena .ha-field{--ha-field-height:clamp(130px,calc(100dvh - 300px),230px)}.harena .ha-hud>div{padding:7px 12px}.harena .ha-hud-label .zh{display:inline;margin-left:5px}.harena .ha-controls{margin-top:9px}.harena .ha-instructions{margin-top:9px;padding-top:8px;font-size:10px}.harena .ha-instructions .zh{font-size:10px}.harena .ha-status{font-size:10px;min-height:0;margin-top:5px}.harena .ha-panel{padding:12px 22px}.harena .ha-crest{display:none}.harena .ha-panel h4{font-size:24px}.harena .ha-panel p{font-size:11px;margin-bottom:12px}}
@media(prefers-reduced-motion:reduce){.harena *{transition:none!important}}
`;

export function mount(container, context = {}) {
  const reducedMotion = !!context.reducedMotion;
  container.innerHTML = `<div class="harena"><style>${css}</style>
    <div class="ha-heading"><div><p class="ha-eyebrow">LEAGUE OF LEGENDS · FOOTWORK PRACTICE</p><h3>${dual('One more dodge.','峡谷走位挑战')}</h3></div><p class="ha-duration"><strong>45<span style="font-size:.4em;letter-spacing:0">s</span></strong>${dual('SURVIVE THE RIFT','坚持到底')}</p></div>
    <div class="ha-hud"><div><span class="ha-hud-label">${dual('REMAINING','剩余时间')}</span><strong class="ha-value" data-time>45.0</strong></div><div><span class="ha-hud-label">${dual('HEALTH','生命')}</span><strong class="ha-lives" data-lives aria-label="3 lives / 3 次机会"><i>♥</i><i>♥</i><i>♥</i></strong></div><div><span class="ha-hud-label">${dual('DODGED','成功躲避')}</span><strong class="ha-value" data-dodged>00</strong></div></div>
    <div class="ha-field"><canvas class="ha-canvas" width="900" height="520" tabindex="0" aria-label="Skillshot arena. Click to move, use WASD or arrows, Space to dash. / 走位训练场。点地移动，WASD 或方向键移动，空格位移。"></canvas>
      <div class="ha-overlay"><div class="ha-panel"><svg class="ha-crest" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3 42 14v20L24 45 6 34V14Z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="m24 12 9 12-9 12-9-12Z" fill="currentColor" opacity=".85"/><path d="M24 5v5m0 28v5M9 15l5 3m20 13 5 3m0-19-5 3M14 31l-5 3" stroke="currentColor"/></svg><h4 data-overlay-title>${dual('Read. Move. Repeat.','预判，走位，再躲一招。')}</h4><p data-overlay-copy>${dual('Three lives. Forty-five seconds. Every attack gives you a warning.','三次机会，45 秒挑战。所有技能都会提前预警。')}</p><button class="ha-primary" type="button" data-start>${dual('Enter the arena','开始挑战')} <span aria-hidden="true">↗</span></button></div></div>
    </div>
    <div class="ha-controls"><div class="ha-buttons"><button type="button" class="ha-control ha-dash" data-dash disabled><span><kbd class="ha-key-note">SPACE</kbd>${dual('Dash','位移')} <b data-cooldown>↗</b></span></button><button type="button" class="ha-control" data-pause disabled>${dual('Pause','暂停')}</button></div><div class="ha-legend" aria-hidden="true"><span><i></i>${dual('Line','直线')}</span><span><i></i>${dual('Impact','落点')}</span><span><i></i>${dual('Fan','扇形')}</span></div></div>
    <p class="ha-instructions">${dual('Click the ground to move, or use WASD / arrow keys. Space dashes toward your destination; 5-second cooldown. Leave the red and gold warning zones before they activate.','鼠标点地或用 WASD／方向键移动，空格向移动方向位移，冷却 5 秒。手机可点地或拖动移动，并点击「位移」。在红色、金色预警生效前离开范围。')}</p><p class="ha-status" role="status" aria-live="polite">${dual('Ready when you are.','准备好就开始。')}</p>
  </div>`;

  const root = container.querySelector('.harena');
  const keyboardScope = container.closest('dialog') || root;
  const $ = s => root.querySelector(s);
  const canvas = $('.ha-canvas'), ctx = canvas.getContext('2d');
  const overlay = $('.ha-overlay'), startButton = $('[data-start]'), pauseButton = $('[data-pause]'), dashButton = $('[data-dash]');
  const title = $('[data-overlay-title]'), copy = $('[data-overlay-copy]'), status = $('.ha-status');
  const timeUI = $('[data-time]'), livesUI = $('[data-lives]'), dodgedUI = $('[data-dodged]'), cooldownUI = $('[data-cooldown]');
  let destroyed = false, raf = 0, lastFrame = 0, mode = 'ready', elapsed = 0, hp = 3, dodged = 0, cooldown = 0, spawnIn = 1.3, wave = 0;
  let player = {x: W / 2, y: H / 2, radius: 12, facing: -Math.PI / 2, invincible: 0};
  let target = {x: player.x, y: player.y}, keys = new Set(), hazards = [], particles = [], trails = [], pointer = null, moveMarker = 0;
  let lastDirection = {x: 0, y: -1}, lastHUD = '', pixelWidth = 900, pixelHeight = 520;
  const listeners = [];
  const listen = (el, type, handler, options) => { el.addEventListener(type, handler, options); listeners.push(() => el.removeEventListener(type, handler, options)); };

  if (!ctx) {
    copy.innerHTML = dual('This browser could not start the canvas. Please try another browser.','此浏览器无法启动画布，请尝试其他浏览器。');
    startButton.disabled = true;
    return {destroy() {destroyed = true; container.innerHTML = '';}};
  }

  function setStatus(en, zh) { status.innerHTML = dual(en, zh); }
  function polygon(points) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); }
  function arenaShape(inset = 0) {
    const x = 20 + inset, y = 20 + inset, right = W - x, bottom = H - y, cut = 30;
    polygon([[x + cut,y],[right-cut,y],[right,y+cut],[right,bottom-cut],[right-cut,bottom],[x+cut,bottom],[x,bottom-cut],[x,y+cut]]);
  }
  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#183947'); bg.addColorStop(.55, '#102832'); bg.addColorStop(1, '#0c1c29');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    arenaShape(); ctx.fillStyle = '#112b36'; ctx.fill(); ctx.strokeStyle = '#a68b5780'; ctx.lineWidth = 1; ctx.stroke();
    arenaShape(8); ctx.strokeStyle = '#628c9c27'; ctx.stroke();
    ctx.save(); arenaShape(11); ctx.clip();
    ctx.strokeStyle = '#78abb610'; ctx.lineWidth = 1;
    for (let x = -H; x < W + H; x += 56) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+H,H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-H,H); ctx.stroke(); }
    const light = ctx.createRadialGradient(W/2,H/2,12,W/2,H/2,420); light.addColorStop(0, '#4a91a00d'); light.addColorStop(1, '#04121c55'); ctx.fillStyle = light; ctx.fillRect(0,0,W,H);
    ctx.restore();
    for (const r of [65,92,100]) { ctx.beginPath(); ctx.arc(W/2,H/2,r,0,Math.PI*2); ctx.strokeStyle = r===92?'#ceb47730':'#6fa0ae22'; ctx.stroke(); }
    ctx.save(); ctx.translate(W/2,H/2); ctx.rotate(Math.PI/4); ctx.strokeStyle='#d8ba761c'; ctx.strokeRect(-44,-44,88,88); ctx.strokeRect(-38,-38,76,76); ctx.restore();
    for (const [x,y,rotation] of [[72,72,Math.PI/4],[W-72,72,3*Math.PI/4],[72,H-72,-Math.PI/4],[W-72,H-72,-3*Math.PI/4]]) {
      ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.fillStyle='#1a4350'; ctx.strokeStyle='#80b4c459'; polygon([[-12,-17],[12,-17],[18,0],[0,22],[-18,0]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#79cade'; ctx.shadowColor='#68c7df'; ctx.shadowBlur=reducedMotion?0:15; polygon([[0,-8],[6,0],[0,10],[-6,0]]);ctx.fill();ctx.restore();
    }
    ctx.fillStyle='#9bc0cb66'; ctx.font='9px monospace'; ctx.textAlign='left'; ctx.fillText('FOOTWORK / TRAINING GROUNDS',56,47);
    ctx.textAlign='right'; ctx.fillStyle='#cfb77d88'; ctx.fillText(`WAVE ${String(Math.max(1,Math.ceil(elapsed/15))).padStart(2,'0')}`,W-56,47);
  }

  function drawHazard(h) {
    const charge = clamp(h.age/h.warning,0,1), active = h.age>=h.warning;
    ctx.save(); ctx.lineCap='round';
    if (h.type==='line') {
      if (!active) {
        const end={x:h.x+h.dx*1200,y:h.y+h.dy*1200};
        ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(end.x,end.y);ctx.strokeStyle=`rgba(226,189,120,${.13+charge*.23})`;ctx.lineWidth=18;ctx.stroke();
        ctx.setLineDash([8,9]);ctx.strokeStyle=`rgba(245,208,140,${.4+charge*.5})`;ctx.lineWidth=1.3;ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(h.x,h.y,11+charge*8,0,Math.PI*2);ctx.strokeStyle='#efc47d';ctx.stroke();
      } else {
        ctx.strokeStyle='#e9bc76';ctx.lineWidth=7;ctx.shadowColor='#d6ad65';ctx.shadowBlur=reducedMotion?0:15;
        ctx.beginPath();ctx.moveTo(h.x-h.dx*28,h.y-h.dy*28);ctx.lineTo(h.x,h.y);ctx.stroke();
        ctx.fillStyle='#fff1cb';ctx.beginPath();ctx.arc(h.x,h.y,4.5,0,Math.PI*2);ctx.fill();
      }
    } else if(h.type==='circle') {
      ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);ctx.fillStyle=active?'#df8aab70':`rgba(204,112,152,${.06+charge*.18})`;ctx.fill();ctx.strokeStyle=active?'#f4b4cf':'#c77d9d';ctx.lineWidth=active?2:1.5;ctx.stroke();
      if(!active){ctx.beginPath();ctx.arc(h.x,h.y,h.radius*charge,-Math.PI/2,Math.PI*1.5);ctx.strokeStyle='#efb0cdb0';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#e3a0bb85';ctx.beginPath();ctx.moveTo(h.x-7,h.y);ctx.lineTo(h.x+7,h.y);ctx.moveTo(h.x,h.y-7);ctx.lineTo(h.x,h.y+7);ctx.stroke();}
      else{ctx.beginPath();ctx.arc(h.x,h.y,h.radius*(1+(h.age-h.warning)*.5),0,Math.PI*2);ctx.strokeStyle='#f3b8d150';ctx.stroke();}
    } else {
      ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.arc(h.x,h.y,h.radius,h.angle-h.spread,h.angle+h.spread);ctx.closePath();ctx.fillStyle=active?'#7bd0df70':`rgba(111,182,201,${.06+charge*.15})`;ctx.fill();ctx.strokeStyle=active?'#9fe5ed':'#73aebb';ctx.lineWidth=active?2:1;ctx.stroke();
      if(!active){ctx.save();ctx.clip();ctx.strokeStyle='#92c4cf2d';for(let i=20;i<h.radius;i+=26){ctx.beginPath();ctx.arc(h.x,h.y,i,0,Math.PI*2);ctx.stroke();}ctx.restore();}
    }
    ctx.restore();
  }
  function drawPlayer() {
    if(moveMarker>0&&length(target.x-player.x,target.y-player.y)>12){ctx.save();ctx.globalAlpha=Math.min(.65,moveMarker);ctx.strokeStyle='#e2bd78';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(target.x,target.y,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(target.x-13,target.y);ctx.lineTo(target.x-5,target.y);ctx.moveTo(target.x+5,target.y);ctx.lineTo(target.x+13,target.y);ctx.moveTo(target.x,target.y-13);ctx.lineTo(target.x,target.y-5);ctx.moveTo(target.x,target.y+5);ctx.lineTo(target.x,target.y+13);ctx.stroke();ctx.restore();}
    for(const trail of trails){ctx.save();ctx.globalAlpha=trail.life/.28*.35;ctx.fillStyle='#70ddf3';ctx.beginPath();ctx.arc(trail.x,trail.y,player.radius,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.save();ctx.translate(player.x,player.y);
    ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(0,12,17,6,0,0,Math.PI*2);ctx.fill();
    const blinking=player.invincible>0&&!reducedMotion&&Math.floor(player.invincible*14)%2===0;ctx.globalAlpha=blinking?.45:1;
    if(player.invincible>0){ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.strokeStyle='#d1eef9aa';ctx.lineWidth=1.4;ctx.stroke();}
    ctx.rotate(player.facing+Math.PI/2);ctx.shadowColor='#75d7ef';ctx.shadowBlur=reducedMotion?0:12;
    polygon([[0,-15],[10,3],[8,13],[0,8],[-8,13],[-10,3]]);ctx.fillStyle='#58afca';ctx.fill();ctx.strokeStyle='#b9e4e9';ctx.lineWidth=1.3;ctx.stroke();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(0,-5,5.6,0,Math.PI*2);ctx.fillStyle='#dceff0';ctx.fill();ctx.strokeStyle='#e2bd78';ctx.lineWidth=1;ctx.stroke();
    ctx.strokeStyle='#e7c788';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,-2);ctx.lineTo(-14,8);ctx.moveTo(10,-2);ctx.lineTo(14,8);ctx.stroke();ctx.restore();
  }
  function draw() {
    if(destroyed)return;
    ctx.setTransform(pixelWidth/W,0,0,pixelHeight/H,0,0);ctx.clearRect(0,0,W,H);drawBackground();
    hazards.forEach(drawHazard);drawPlayer();
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.55);ctx.fillStyle=p.color;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);});ctx.globalAlpha=1;
    const fraction=clamp(elapsed/ROUND,0,1);ctx.fillStyle='#78b8c91a';ctx.fillRect(50,H-35,W-100,2);ctx.fillStyle='#e2bd78';ctx.fillRect(50,H-35,(W-100)*fraction,2);
  }
  function resize() {
    if(destroyed)return;
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    if(rect.width<=0||rect.height<=0)return;
    pixelWidth=Math.max(1,Math.round(rect.width*dpr));pixelHeight=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==pixelWidth)canvas.width=pixelWidth;
    if(canvas.height!==pixelHeight)canvas.height=pixelHeight;
    draw();
  }
  function updateHUD(force=false) {
    const time=(ROUND-elapsed).toFixed(1), charge=Math.ceil(cooldown*10)/10;
    const key=`${time}/${hp}/${dodged}/${charge}/${mode}`;
    if(!force&&key===lastHUD)return;lastHUD=key;
    timeUI.textContent=time;dodgedUI.textContent=String(dodged).padStart(2,'0');
    [...livesUI.children].forEach((el,i)=>el.classList.toggle('is-lost',i>=hp));livesUI.setAttribute('aria-label',`${hp} lives / ${hp} 次机会`);
    cooldownUI.textContent=cooldown>0?`${cooldown.toFixed(1)}s`:'↗';dashButton.style.setProperty('--ha-charge',String(1-cooldown/5));dashButton.disabled=mode!=='running'||cooldown>0;pauseButton.disabled=mode!=='running'&&mode!=='paused';
    pauseButton.innerHTML=mode==='paused'?dual('Resume','继续'):dual('Pause','暂停');
  }
  function burst(x,y,color,count=12) {
    if(reducedMotion)return;
    for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=30+Math.random()*100;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.55,color});}
  }
  function spawn() {
    const difficulty=elapsed/ROUND; wave++;
    const type=elapsed<8?(wave%3===0?'circle':'line'):elapsed<16?(wave%2?'line':'circle'):['line','circle','line','cone'][wave%4];
    if(type==='line'){
      const side=Math.floor(Math.random()*4);let x,y;
      if(side<2){x=side===0?30:W-30;y=70+Math.random()*(H-140);}else{x=70+Math.random()*(W-140);y=side===2?30:H-30;}
      const aim={x:clamp(player.x+(Math.random()-.5)*32,EDGE,W-EDGE),y:clamp(player.y+(Math.random()-.5)*32,EDGE,H-EDGE)},magnitude=length(aim.x-x,aim.y-y)||1;
      hazards.push({type,x,y,dx:(aim.x-x)/magnitude,dy:(aim.y-y)/magnitude,speed:370+difficulty*150,warning:.95-difficulty*.18,age:0,hit:false,touched:false});
    }else if(type==='circle'){
      hazards.push({type,x:clamp(player.x+(Math.random()-.5)*64,90,W-90),y:clamp(player.y+(Math.random()-.5)*64,90,H-90),radius:54+difficulty*17,warning:1.12-difficulty*.12,active:.34,age:0,hit:false,touched:false});
    }else{
      const angle=Math.random()*Math.PI*2,distance=160+Math.random()*80;
      const x=clamp(player.x+Math.cos(angle)*distance,60,W-60),y=clamp(player.y+Math.sin(angle)*distance,60,H-60);
      hazards.push({type,x,y,angle:Math.atan2(player.y-y,player.x-x),spread:.36+difficulty*.06,radius:240,warning:1.08,active:.32,age:0,hit:false,touched:false});
    }
  }
  function finish(won) {
    mode='result';keys.clear();cancelAnimationFrame(raf);raf=0;overlay.hidden=false;
    title.innerHTML=won?dual('Beautiful footwork.','走位漂亮。'):dual('One more try?','再来一局？');
    copy.innerHTML=dual(`${won?'Round cleared':'Training complete'} · ${elapsed.toFixed(1)}s survived · ${dodged} attacks dodged.`,`${won?'挑战成功':'训练结束'} · 坚持 ${elapsed.toFixed(1)} 秒 · 成功躲避 ${dodged} 次。`);
    startButton.innerHTML=dual('Play again','再来一局')+' <span aria-hidden="true">↻</span>';
    setStatus(won?'45 seconds survived. Challenge complete.':'Three hits. Take a breath and try again.',won?'坚持 45 秒，挑战完成。':'受到三次攻击，休息一下，再试一次。');
    updateHUD(true);draw();startButton.focus({preventScroll:true});
  }
  function collide(h) {
    h.touched=true;
    if(h.hit||player.invincible>0)return;
    h.hit=true;hp--;player.invincible=1.1;burst(player.x,player.y,'#eaa5bd',16);
    setStatus(hp?`${hp} ${hp===1?'life':'lives'} left. Keep moving.`:'Round complete.',hp?`还剩 ${hp} 次机会，继续移动。`:'本局结束。');
    if(hp<=0)finish(false);
  }
  function update(dt) {
    player.invincible=Math.max(0,player.invincible-dt);moveMarker=Math.max(0,moveMarker-dt*.5);
    let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    const keyboard=!!(dx||dy);if(!keyboard){dx=target.x-player.x;dy=target.y-player.y;}
    const distance=length(dx,dy),step=keyboard?290*dt:Math.min(distance,290*dt);
    if(distance>.5){lastDirection={x:dx/distance,y:dy/distance};player.x=clamp(player.x+dx/distance*step,EDGE+player.radius,W-EDGE-player.radius);player.y=clamp(player.y+dy/distance*step,EDGE+player.radius,H-EDGE-player.radius);player.facing=Math.atan2(dy,dx);}
    if(keyboard)target={x:player.x,y:player.y};
    spawnIn-=dt;if(spawnIn<=0){spawn();spawnIn=.95-(elapsed/ROUND)*.43;}
    for(const h of hazards){
      const oldAge=h.age;h.age+=dt;
      if(h.age<h.warning)continue;
      if(h.type==='line'){
        const activeDt=Math.min(dt,h.age-h.warning),oldX=h.x,oldY=h.y;h.x+=h.dx*h.speed*activeDt;h.y+=h.dy*h.speed*activeDt;
        if(segmentDistanceSquared(player.x,player.y,oldX,oldY,h.x,h.y)<=(player.radius+6)**2)collide(h);
      }else if(h.age<=h.warning+h.active||oldAge<h.warning){
        const hit=h.type==='circle'?length(player.x-h.x,player.y-h.y)<=h.radius+player.radius:intersectsCone(player,h);
        if(hit)collide(h);
      }
      if(mode!=='running')return;
    }
    hazards=hazards.filter(h=>{const done=h.type==='line'?(h.x<0||h.x>W||h.y<0||h.y>H||h.age>5):h.age>h.warning+h.active;if(done&&!h.touched)dodged++;return!done;});
    particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;return p.life>0;});trails=trails.filter(t=>(t.life-=dt)>0);
  }
  function frame(now) {
    raf=0;if(destroyed||mode!=='running')return;
    const delta=lastFrame?(now-lastFrame)/1000:0;lastFrame=now;
    ({elapsed,cooldown}=advanceRoundClock(elapsed,cooldown,delta));
    if(elapsed>=ROUND-1e-7){elapsed=ROUND;finish(true);return;}
    const steps=simulationSteps(delta);
    for(const dt of steps){if(mode!=='running')break;update(dt);}
    updateHUD();draw();
    if(mode==='running')raf=requestAnimationFrame(frame);
  }
  function start() {
    if(destroyed)return;
    cancelAnimationFrame(raf);mode='running';elapsed=0;hp=3;dodged=0;cooldown=0;spawnIn=1.3;wave=0;lastFrame=performance.now();hazards=[];particles=[];trails=[];keys.clear();
    player={x:W/2,y:H/2,radius:12,facing:-Math.PI/2,invincible:0};target={x:player.x,y:player.y};lastDirection={x:0,y:-1};overlay.hidden=true;setStatus('Watch the warnings. You have three lives.','留意预警，你有三次机会。');updateHUD(true);canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);
  }
  function pause(automatic=false) {
    if(mode!=='running')return;mode='paused';keys.clear();cancelAnimationFrame(raf);raf=0;overlay.hidden=false;
    title.innerHTML=dual('Take a breath.','稍作休息。');copy.innerHTML=automatic?dual('The round paused while this tab was hidden. Resume when you are ready.','切换标签页后，本局已暂停。准备好后继续。'):dual('Your round is paused. Pick up exactly where you left off.','本局已暂停，点击继续即可回到训练场。');startButton.innerHTML=dual('Resume training','继续挑战')+' <span aria-hidden="true">↗</span>';updateHUD(true);draw();
  }
  function resume() {
    if(mode!=='paused'||document.hidden)return;mode='running';overlay.hidden=true;lastFrame=performance.now();setStatus('Back in the arena. Keep moving.','回到训练场，继续移动。');updateHUD(true);canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);
  }
  function dash() {
    if(mode!=='running'||cooldown>0)return;
    let direction={x:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y:(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)};
    if(!length(direction.x,direction.y)){direction={x:target.x-player.x,y:target.y-player.y};if(length(direction.x,direction.y)<2)direction=lastDirection;}
    const destination=dashDestination(player,direction),old={x:player.x,y:player.y};
    if(!reducedMotion)for(let i=0;i<8;i++)trails.push({x:old.x+(destination.x-old.x)*i/8,y:old.y+(destination.y-old.y)*i/8,life:.28});
    player.x=destination.x;player.y=destination.y;player.facing=Math.atan2(direction.y,direction.x);target={...destination};cooldown=5;moveMarker=0;burst(player.x,player.y,'#92e5f3',8);updateHUD(true);draw();
  }
  function point(event) {
    const rect=canvas.getBoundingClientRect();
    target={x:clamp((event.clientX-rect.left)/rect.width*W,EDGE+player.radius,W-EDGE-player.radius),y:clamp((event.clientY-rect.top)/rect.height*H,EDGE+player.radius,H-EDGE-player.radius)};moveMarker=1;
  }
  listen(startButton,'click',()=>mode==='paused'?resume():start());
  listen(pauseButton,'click',()=>mode==='paused'?resume():pause());listen(dashButton,'click',()=>{dash();if(mode==='running')canvas.focus({preventScroll:true});});
  listen(canvas,'pointerdown',event=>{if(mode!=='running'||(event.button!==0&&event.button!==2))return;event.preventDefault();canvas.focus({preventScroll:true});pointer=event.pointerId;point(event);try{canvas.setPointerCapture?.(event.pointerId);}catch{/* Pointer already released; the destination remains valid. */}});
  listen(canvas,'pointermove',event=>{if(mode==='running'&&pointer===event.pointerId)point(event);});
  const release=event=>{if(pointer===event.pointerId){pointer=null;if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);}};
  listen(canvas,'pointerup',release);listen(canvas,'pointercancel',release);listen(canvas,'lostpointercapture',()=>{pointer=null;});listen(canvas,'contextmenu',event=>event.preventDefault());
  const movement=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  listen(keyboardScope,'keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    const key=event.key.toLowerCase();
    if(key==='p'&&(mode==='running'||mode==='paused')){event.preventDefault();mode==='running'?pause():resume();return;}
    if(mode!=='running')return;
    if(movement.includes(key)){event.preventDefault();keys.add(key);}
    else if(event.code==='Space'&&!event.target?.closest?.('button,a')){event.preventDefault();if(!event.repeat)dash();}
  });
  listen(document,'keyup',event=>keys.delete(event.key.toLowerCase()));listen(canvas,'blur',()=>keys.clear());
  listen(document,'visibilitychange',()=>{if(document.hidden)pause(true);});
  // Changing window focus is not the same as hiding the game. Clear held keys, keep playing.
  listen(window,'blur',()=>{keys.clear();pointer=null;});
  const resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;resizeObserver?.observe(canvas);if(!resizeObserver)listen(window,'resize',resize);
  resize();updateHUD(true);
  return {destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);raf=0;listeners.forEach(remove=>remove());resizeObserver?.disconnect();keys.clear();hazards=[];particles=[];trails=[];container.innerHTML='';}};
}
