'use strict';
(() => {
  const root = document.documentElement;
  const header = document.querySelector('.header');
  const nav = document.querySelector('.desktop-nav');
  const languageSwitch = document.querySelector('.language-switch');
  const filterTabs = document.getElementById('topic-filters');
  if (filterTabs && !filterTabs.querySelector('.filter-active-indicator')) {
    const indicator = document.createElement('span');
    indicator.className = 'filter-active-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    filterTabs.prepend(indicator);
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const navTargets = navLinks.map(link => ({link, target: document.querySelector(link.hash)})).filter(item => item.target);
  let framePending = false;

  function decorateSocialLinks() {
    const paths = {
      'hero-scholar': 'M2 6.5 8 3l6 3.5L8 10 2 6.5ZM4 8v3.5c2 1.5 6 1.5 8 0V8M14 7v5',
      'hero-github': 'm5.5 4-4 4 4 4M10.5 4l4 4-4 4M9 2 7 14',
      email: 'M2 3.5h12v9H2v-9Zm0 1L8 9l6-4.5'
    };
    document.querySelectorAll('.social-links a').forEach(link => {
      if (link.querySelector('.social-icon')) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('social-icon');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', paths[link.id] || paths.email);
      svg.appendChild(path);
      link.prepend(svg);
    });
  }

  function positionIndicators() {
    const active = nav?.querySelector('a.active');
    if (nav) {
      nav.dataset.hasActive = String(Boolean(active));
      nav.style.setProperty('--nav-opacity', active ? '1' : '0');
      if (active) {
        nav.style.setProperty('--nav-x', `${active.offsetLeft}px`);
        nav.style.setProperty('--nav-width', `${active.offsetWidth}px`);
      }
    }
    const selectedLanguage = languageSwitch?.querySelector('[data-lang].active');
    if (selectedLanguage) {
      languageSwitch.style.setProperty('--language-x', `${selectedLanguage.offsetLeft}px`);
      languageSwitch.style.setProperty('--language-width', `${selectedLanguage.offsetWidth}px`);
    }
    const selectedFilter = filterTabs?.querySelector('button.active');
    if (selectedFilter) {
      filterTabs.style.setProperty('--filter-x', `${selectedFilter.offsetLeft}px`);
      filterTabs.style.setProperty('--filter-y', `${selectedFilter.offsetTop}px`);
      filterTabs.style.setProperty('--filter-width', `${selectedFilter.offsetWidth}px`);
      filterTabs.style.setProperty('--filter-height', `${selectedFilter.offsetHeight}px`);
    }
  }

  function updateScrollState() {
    framePending = false;
    header?.classList.toggle('is-compact', scrollY > 90);
    const threshold = (header?.getBoundingClientRect().height || 80) + Math.min(innerHeight * .24, 160);
    let selected = null;
    navTargets.forEach(item => {
      if (item.target.getBoundingClientRect().top <= threshold) selected = item.link;
    });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 30) selected = navLinks.at(-1);
    navLinks.forEach(link => {
      const active = link === selected;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const items = [...document.querySelectorAll('.education-item')];
    let current = null;
    items.forEach(item => {
      const reached = item.getBoundingClientRect().top < innerHeight * .72;
      item.classList.toggle('is-reached', reached);
      if (reached) current = item;
    });
    items.forEach(item => item.classList.toggle('is-current', item === current));
    positionIndicators();
  }

  function scheduleScrollState() {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(updateScrollState);
    }
  }

  function syncMotionState() {
    let paused = false;
    try { paused = localStorage.getItem('zz-motion-paused') === 'true'; } catch (_) {}
    const toggle = document.querySelector('.motion-toggle');
    if (toggle) paused = toggle.dataset.paused === 'true';
    root.dataset.motionPaused = String(paused || reduced.matches);
    document.dispatchEvent(new CustomEvent('zz:motion', {detail: {paused: paused || reduced.matches, reduced: reduced.matches}}));
    if (paused || reduced.matches) document.querySelectorAll('.reveal-ready').forEach(element => element.classList.add('is-revealed'));
  }

  const revealElements = [...document.querySelectorAll('.research-section > .section-heading, .research-explorer, .journey-section > .section-heading, .journey-grid > div, .experience-heading, .experience-item, .writing-strip, .contact-top')];
  if ('IntersectionObserver' in window && !reduced.matches && root.dataset.motionPaused !== 'true') {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: .06, rootMargin: '0px 0px -25px 0px'});
    revealElements.forEach(element => {
      // A direct link must stay immediately readable even before the first observer callback.
      if (element.getBoundingClientRect().top < innerHeight) element.classList.add('is-revealed');
      element.classList.add('reveal-ready');
      observer.observe(element);
    });
  }

  const toggle = document.querySelector('.motion-toggle');
  if (toggle) new MutationObserver(syncMotionState).observe(toggle, {attributes: true, attributeFilter: ['data-paused']});
  reduced.addEventListener('change', syncMotionState);
  window.addEventListener('storage', event => {if (event.key === 'zz-motion-paused') syncMotionState();});
  window.addEventListener('scroll', scheduleScrollState, {passive: true});
  window.addEventListener('resize', scheduleScrollState, {passive: true});
  document.addEventListener('zz:language', () => requestAnimationFrame(() => {
    decorateSocialLinks();
    positionIndicators();
    updateScrollState();
  }));
  document.addEventListener('zz:papers', scheduleScrollState);
  if (document.fonts?.ready) document.fonts.ready.then(scheduleScrollState);
  syncMotionState();
  decorateSocialLinks();
  updateScrollState();
})();
