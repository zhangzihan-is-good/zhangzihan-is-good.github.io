'use strict';
(() => {
  const surface = document.querySelector('.portrait-surface');
  const map = document.querySelector('.research-map');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const NS = 'http://www.w3.org/2000/svg';
  const make = (name, attributes = {}) => {
    const el = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
    return el;
  };

  if (surface && !surface.querySelector('.signal-art')) {
    const art = make('svg', {class: 'signal-art', viewBox: '0 0 460 456', preserveAspectRatio: 'none', 'aria-hidden': 'true'});
    art.innerHTML = `
      <defs>
        <radialGradient id="zz-signal-aura"><stop stop-color="currentColor" stop-opacity=".19"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
      </defs>
      <circle class="signal-aura" cx="336" cy="142" r="172"/>
      <g class="signal-ambient-lines">
        <path d="M25 264C82 264 73 107 129 107M333 95C392 95 375 260 432 260"/>
        <path d="M17 158H46L52 149L61 177L70 132L79 169L87 158H112"/>
        <path d="M346 168L378 135L412 165L381 204L346 168L410 212M378 135L381 204M412 165L410 212"/>
        <path d="M38 310H74L94 290M375 293L398 317H429"/>
      </g>
      <g class="signal-ambient-nodes">
        <circle cx="378" cy="135" r="3"/><circle cx="412" cy="165" r="3"/><circle cx="381" cy="204" r="3"/><circle cx="410" cy="212" r="2"/>
        <circle cx="46" cy="158" r="3"/><circle cx="74" cy="310" r="3"/><circle cx="398" cy="317" r="3"/>
      </g>
      <g class="signal-pipeline">
        <path class="signal-track" d="M24 408H38L44 401L50 419L57 391L64 416L71 408H113C141 408 146 408 170 408M170 408L199 390L227 408L199 426L170 408M199 390L199 426M227 408H297M297 408H324"/>
        <path class="signal-flow" pathLength="100" d="M24 408H38L44 401L50 419L57 391L64 416L71 408H113C141 408 146 408 170 408L199 390L227 408H297H324"/>
        <g class="signal-pipeline-nodes"><circle cx="170" cy="408" r="4"/><circle cx="199" cy="390" r="4"/><circle cx="199" cy="426" r="4"/><circle cx="227" cy="408" r="4"/></g>
        <rect class="signal-language-token" x="324" y="392" width="109" height="33" rx="8"/>
      </g>`;
    surface.prepend(art);
    const labels = document.createElement('div');
    labels.className = 'signal-stage-legend';
    labels.setAttribute('aria-hidden', 'true');
    labels.innerHTML = '<span>EEG</span><span><span class="en" lang="en">Representation</span><span class="zh" lang="zh-CN">表征</span></span><span><span class="en" lang="en">Language</span><span class="zh" lang="zh-CN">语言</span></span>';
    surface.appendChild(labels);
    const word = document.createElement('span');
    word.className = 'signal-word-label';
    word.setAttribute('aria-hidden', 'true');
    word.innerHTML = '<span class="en" lang="en">Hello.</span><span class="zh" lang="zh-CN">你好。</span>';
    surface.appendChild(word);
    surface.classList.add('signal-redesigned');

    let pointerFrame = 0;
    let nextPoint = null;
    const resetDepth = () => {
      nextPoint = null;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      surface.style.setProperty('--portrait-x', '0deg');
      surface.style.setProperty('--portrait-y', '0deg');
      surface.style.setProperty('--art-x', '0px');
      surface.style.setProperty('--art-y', '0px');
    };
    surface.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduced.matches || !surface.classList.contains('motion-active')) return;
      const bounds = surface.getBoundingClientRect();
      nextPoint = {x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5};
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!nextPoint) return;
        surface.style.setProperty('--portrait-x', `${(-nextPoint.y * 3).toFixed(2)}deg`);
        surface.style.setProperty('--portrait-y', `${(nextPoint.x * 3).toFixed(2)}deg`);
        surface.style.setProperty('--art-x', `${(nextPoint.x * -7).toFixed(2)}px`);
        surface.style.setProperty('--art-y', `${(nextPoint.y * -7).toFixed(2)}px`);
      });
    });
    surface.addEventListener('pointerleave', resetDepth);
    new MutationObserver(() => { if (!surface.classList.contains('motion-active')) resetDepth(); }).observe(surface, {attributes: true, attributeFilter: ['class']});
    reduced.addEventListener('change', resetDepth);
  }

  if (map && !map.querySelector('.direction-sketch')) {
    const center = map.querySelector('.map-center');
    const sketch = make('svg', {class: 'direction-sketch', viewBox: '0 0 180 130', 'aria-hidden': 'true'});
    sketch.innerHTML = `
      <defs><marker id="zz-sketch-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6"/></marker></defs>
      <g class="sketch-state sketch-eeg">
        <path class="sketch-edge" d="M12 37H21L25 30L30 48L36 23L42 43L47 37H71M12 63H25L30 56L36 73L42 49L48 68L53 63H71M12 89H21L26 81L32 100L38 76L44 94L49 89H71"/>
        <path class="sketch-edge sketch-arrow" d="M76 63H107"/>
        <path class="sketch-flow" pathLength="100" d="M12 63H25L30 56L36 73L42 49L48 68L53 63H71H107"/>
        <rect class="sketch-box" x="116" y="39" width="51" height="47" rx="10"/>
        <path class="sketch-edge" d="M128 53H154M128 63H151M128 73H143"/>
        <circle class="sketch-point" cx="91" cy="63" r="3"/>
      </g>
      <g class="sketch-state sketch-brain">
        <path class="sketch-edge" d="M22 31L68 22L65 64L24 95L22 31L65 64L108 35L152 63L112 98L65 64M68 22L108 35L112 98L24 95M22 31L24 95M108 35L152 63L112 98"/>
        <path class="sketch-flow" pathLength="100" d="M22 31L65 64L108 35L152 63L112 98"/>
        <g class="sketch-points"><circle cx="22" cy="31" r="6"/><circle cx="68" cy="22" r="6"/><circle cx="65" cy="64" r="8"/><circle cx="24" cy="95" r="6"/><circle cx="108" cy="35" r="6"/><circle cx="152" cy="63" r="7"/><circle cx="112" cy="98" r="6"/></g>
      </g>
      <g class="sketch-state sketch-nlp">
        <path class="sketch-edge sketch-arrow" d="M42 62L70 34M42 62L70 91M105 34L133 62M105 91L133 62"/>
        <path class="sketch-flow" pathLength="100" d="M42 62L70 34M105 34L133 62M42 62L70 91M105 91L133 62"/>
        <rect class="sketch-box" x="11" y="49" width="31" height="26" rx="6"/><rect class="sketch-box" x="72" y="20" width="31" height="26" rx="6"/><rect class="sketch-box" x="72" y="78" width="31" height="26" rx="6"/><rect class="sketch-box" x="136" y="49" width="31" height="26" rx="6"/>
        <path class="sketch-writing" d="M19 58H33M19 65H29M80 29H95M80 36H91M80 87H95M80 94H91M144 58H159M144 65H155"/>
      </g>
      <g class="sketch-state sketch-medical">
        <path class="sketch-edge" d="M13 28H24L29 21L34 36L40 16L46 31L50 28H59M17 58H53V81H17ZM21 75L31 64L39 72L44 66L50 75M20 102H53M20 111H44"/>
        <path class="sketch-edge" d="M63 28Q87 28 104 63M59 70H104M59 107Q87 107 104 63"/>
        <path class="sketch-flow" pathLength="100" d="M63 28Q87 28 104 63M59 70H104M59 107Q87 107 104 63H137"/>
        <circle class="sketch-merge" cx="108" cy="63" r="7"/><path class="sketch-edge sketch-arrow" d="M117 63H139"/><rect class="sketch-box" x="142" y="44" width="29" height="38" rx="7"/>
        <path class="sketch-writing" d="M150 55H163M150 63H163M150 71H158"/>
      </g>`;
    if (center) {
      center.insertBefore(sketch, center.querySelector('span'));
      center.classList.add('has-direction-sketch');
    }

    const links = map.querySelector('.map-links');
    const routes = {
      eeg: 'M320 200C250 200 210 95 145 95',
      brain: 'M320 200C390 200 420 95 500 95',
      nlp: 'M320 200C250 200 210 305 145 305',
      medical: 'M320 200C390 200 420 305 500 305'
    };
    for (const [key, d] of Object.entries(routes)) {
      links?.append(make('path', {d, class: `visual-route visual-route-${key}`, pathLength: '100'}));
    }
    let currentMode = '';
    const setDirection = direction => {
      if (!Object.hasOwn(routes, direction) || currentMode === direction) return;
      currentMode = direction;
      map.dataset.visualMode = direction;
      links?.querySelectorAll('.visual-route').forEach(path => path.classList.toggle('is-current', path.classList.contains(`visual-route-${direction}`)));
      const caption = center?.querySelector(':scope > span');
      if (caption) caption.textContent = 'BRAIN × AI';
    };
    const syncDirection = () => setDirection(map.querySelector('.map-node.active')?.dataset.direction || 'eeg');
    document.addEventListener('zz:direction', event => setDirection(event.detail?.direction));
    new MutationObserver(syncDirection).observe(map, {subtree: true, attributes: true, attributeFilter: ['aria-pressed']});
    syncDirection();

    map.querySelectorAll('.map-node').forEach(node => {
      node.addEventListener('pointermove', event => {
        if (!finePointer.matches || reduced.matches || !map.classList.contains('motion-active')) return;
        const bounds = node.getBoundingClientRect();
        node.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
        node.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
      });
    });
  }

  const headline = document.querySelector('.hero-statement');
  let headlineEntered = false;
  const decorateHeadline = () => {
    if (!headline) return;
    headline.querySelectorAll(':scope > .en, :scope > .zh').forEach(languageBlock => {
      if (languageBlock.dataset.headlineWrapped === 'true') return;
      languageBlock.dataset.headlineWrapped = 'true';
      const walker = document.createTreeWalker(languageBlock, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach(node => {
        const pieces = languageBlock.classList.contains('en') ? node.textContent.match(/\S+\s*|\s+/g) : node.textContent.match(/[^，。！？]+[，。！？]?/g);
        if (!pieces) return;
        const fragment = document.createDocumentFragment();
        pieces.forEach(piece => {
          if (!piece.trim()) { fragment.append(document.createTextNode(piece)); return; }
          const span = document.createElement('span');
          span.className = 'headline-fragment';
          span.textContent = piece.trimEnd();
          fragment.append(span);
          const trailing = piece.match(/\s+$/)?.[0];
          if (trailing) fragment.append(document.createTextNode(trailing));
        });
        node.replaceWith(fragment);
      });
    });
  };
  const enterHeadline = () => {
    decorateHeadline();
    if (!headline || headlineEntered) return;
    headlineEntered = true;
    let paused = false;
    try { paused = localStorage.getItem('zz-motion-paused') === 'true'; } catch (_) {}
    if (paused || reduced.matches || document.hidden) return;
    const phrases = [...headline.querySelectorAll('.headline-fragment')].filter(phrase => phrase.getClientRects().length);
    phrases.forEach((phrase, index) => {
      const animation = phrase.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 440, delay: Math.min(index * 40, 400), easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'backwards'});
      const finishMotion = () => animation.finish();
      const toggleObserver = new MutationObserver(() => {
        if (document.querySelector('.motion-toggle')?.dataset.paused === 'true') animation.finish();
      });
      const toggle = document.querySelector('.motion-toggle');
      if (toggle) toggleObserver.observe(toggle, {attributes: true, attributeFilter: ['data-paused']});
      reduced.addEventListener('change', finishMotion, {once: true});
      animation.finished.catch(() => {}).finally(() => {
        toggleObserver.disconnect();
        reduced.removeEventListener('change', finishMotion);
      });
    });
  };
  document.addEventListener('zz:language', enterHeadline);
  if (headline) new MutationObserver(enterHeadline).observe(headline, {childList: true});
  requestAnimationFrame(enterHeadline);
})();
