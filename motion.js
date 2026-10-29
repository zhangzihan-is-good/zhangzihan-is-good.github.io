'use strict';
(() => {
  const surface = document.querySelector('.portrait-surface');
  const hero = document.querySelector('.hero-visual');
  const orbit = document.querySelector('.portrait-orbits');
  if (!surface || !hero || !orbit || hero.querySelector('.motion-toggle')) return;

  const NS = 'http://www.w3.org/2000/svg';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  try { userPaused = localStorage.getItem('zz-motion-paused') === 'true'; } catch (_) {}
  let heroVisible = true;
  let mapVisible = true;

  function svgElement(name, attributes) {
    const element = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  // These are decorative signal paths, not recorded EEG or measured brain activity.
  function ellipsePath(angle) {
    const radians = angle * Math.PI / 180;
    const dx = 191 * Math.cos(radians);
    const dy = 191 * Math.sin(radians);
    const start = `${210 + dx} ${200 + dy}`;
    const end = `${210 - dx} ${200 - dy}`;
    return `M ${start} A 191 125 ${angle} 1 0 ${end} A 191 125 ${angle} 1 0 ${start}`;
  }

  [-34, 34].forEach((angle, index) => {
    const particle = svgElement('g', {class: `motion-particle motion-particle-${index + 1}`});
    particle.appendChild(svgElement('circle', {r: index ? '5' : '6', class: 'motion-particle-core'}));
    particle.appendChild(svgElement('circle', {r: index ? '10' : '12', class: 'motion-particle-halo'}));
    particle.appendChild(svgElement('animateMotion', {
      path: ellipsePath(angle), dur: index ? '14s' : '11s',
      begin: index ? '-4s' : '-1s', repeatCount: 'indefinite', calcMode: 'paced'
    }));
    orbit.appendChild(particle);
  });
  orbit.classList.add('motion-orbits');

  const wave = surface.querySelector('.signal-line svg');
  const originalWave = wave?.querySelector('path');
  if (wave && originalWave) {
    const trace = originalWave.cloneNode(false);
    trace.setAttribute('class', 'motion-wave');
    trace.setAttribute('pathLength', '100');
    wave.appendChild(trace);
  }

  const row = document.createElement('div');
  row.className = 'motion-controls';
  row.innerHTML = '<button class="motion-toggle" type="button" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path class="motion-pause-icon" d="M7 5v10M13 5v10"/><path class="motion-play-icon" d="m7 5 8 5-8 5Z"/></svg><span class="motion-toggle-label"></span></button>';
  hero.appendChild(row);
  const toggle = row.querySelector('button');
  const label = row.querySelector('.motion-toggle-label');

  const map = document.querySelector('.research-map');
  const mapSvg = map?.querySelector('.map-links');
  const routes = {
    eeg: 'M320 200C250 200 210 95 145 95',
    brain: 'M320 200C390 200 420 95 500 95',
    nlp: 'M320 200C250 200 210 305 145 305',
    medical: 'M320 200C390 200 420 305 500 305'
  };
  const routeElements = {};
  if (mapSvg) Object.entries(routes).forEach(([id, path]) => {
    const route = svgElement('path', {d: path, class: 'motion-route', pathLength: '100'});
    routeElements[id] = route;
    mapSvg.appendChild(route);
  });

  function update() {
    const allowed = !userPaused && !media.matches && !document.hidden;
    surface.classList.toggle('motion-active', allowed && heroVisible);
    map?.classList.toggle('motion-active', allowed && mapVisible);
    Object.values(routeElements).forEach(route => route.getAnimations().forEach(animation => {
      if (allowed && mapVisible) {
        if (animation.playState === 'paused') animation.play();
      } else if (animation.playState === 'running') animation.pause();
    }));
    if (typeof orbit.pauseAnimations === 'function') {
      if (allowed && heroVisible) orbit.unpauseAnimations();
      else orbit.pauseAnimations();
    }
    toggle.disabled = media.matches;
    toggle.setAttribute('aria-pressed', String(userPaused || media.matches));
    toggle.dataset.paused = String(userPaused || media.matches);
    const reduced = media.matches;
    const en = reduced ? 'Motion off' : userPaused ? 'Play motion' : 'Pause motion';
    const zh = reduced ? '动画已关闭' : userPaused ? '播放动画' : '暂停动画';
    label.innerHTML = `<span class="en" lang="en">${en}</span><span class="zh" lang="zh-CN">${zh}</span>`;
    toggle.setAttribute('aria-label', `${en} / ${zh}`);
    toggle.title = reduced ? 'Reduced motion preference is enabled / 已遵循系统减少动态效果设置' : '';
  }

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('zz-motion-paused', String(userPaused)); } catch (_) {}
    update();
  });
  document.addEventListener('visibilitychange', update);
  media.addEventListener('change', update);

  if (map) map.addEventListener('click', event => {
    const node = event.target.closest('.map-node[data-direction]');
    if (!node || userPaused || media.matches || document.hidden) return;
    Object.values(routeElements).forEach(route => route.classList.remove('is-signaling'));
    const selected = routeElements[node.dataset.direction];
    if (selected) {
      // Restart a short, local pulse without reading or changing layout.
      selected.getAnimations().forEach(animation => animation.cancel());
      selected.classList.add('is-signaling');
      selected.animate([
        {strokeDashoffset: '110', opacity: 0},
        {strokeDashoffset: '100', opacity: 1, offset: 0.12},
        {strokeDashoffset: '-10', opacity: 1, offset: 0.88},
        {strokeDashoffset: '-20', opacity: 0}
      ], {duration: 1400, easing: 'linear', iterations: 2});
    }
    const panel = document.querySelector('.direction-panel');
    panel?.animate([{opacity: 0.65, transform: 'translateY(5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 260, easing: 'ease-out'});
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === map) mapVisible = entry.isIntersecting;
      });
      update();
    }, {threshold: 0.05});
    observer.observe(hero);
    if (map) observer.observe(map);
  }
  update();
})();
