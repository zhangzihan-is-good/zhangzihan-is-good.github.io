'use strict';
(() => {
  const D = window.PROFILE_DATA;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dual = (v) => `<span class="en" lang="en">${esc(v.en)}</span><span class="zh" lang="zh-CN">${esc(v.zh)}</span>`;
  const T = {
    navResearch:{en:'Research',zh:'研究'},navPublications:{en:'Publications',zh:'论文'},navJourney:{en:'Journey',zh:'经历'},navContact:{en:'Contact',zh:'联系'},
    heroEyebrow:{en:'Ph.D. researcher · Brain & intelligence',zh:'博士研究生 · 大脑与智能'},
    heroStatement:{en:'Learning from the brain. Building for intelligence.',zh:'向大脑学习，探索智能的可能。'},
    bio:{en:'I am a Ph.D. student at Harbin Institute of Technology (SCIR). My research spans brain–computer interfaces, brain-inspired AI, language and cognition, and medical AI.',zh:'我是哈尔滨工业大学 SCIR 实验室博士生，研究脑机接口、类脑人工智能、语言与认知及医学人工智能。'},
    exploreWork:{en:'Explore my work',zh:'探索研究'},emailLink:{en:'Email ↗',zh:'邮箱 ↗'},portraitFoot:{en:'Curiosity across disciplines.',zh:'保持好奇，跨越学科。'},
    hit:{en:'Harbin Institute of Technology',zh:'哈尔滨工业大学'},hitDetail:{en:'Ph.D. · SCIR · 2023–present',zh:'计算机科学与技术 · 博士'},ntu:{en:'Nanyang Technological University',zh:'南洋理工大学'},ntuDetail:{en:'CSC Visiting Ph.D. · 2026–2027',zh:'认知神经科学 · 联合培养'},
    researchTitle:{en:'A connected perspective.',zh:'研究方向'},researchIntro:{en:'Connecting biological intelligence and machine learning, from brain signals and cognition to medical applications.',zh:'在生物智能与机器学习的交汇处，探索信号、认知、语言与医学应用。'},
    topicEEG:{en:'Brain–computer interfaces',zh:'脑机接口'},topicBrain:{en:'Brain-inspired AI',zh:'类脑人工智能'},topicNLP:{en:'Language & cognition',zh:'语言与认知'},topicMedical:{en:'Medical AI',zh:'医学人工智能'},clickDirection:{en:'Select a node to explore',zh:'点击节点探索研究'},researchFocus:{en:'Research focus',zh:'研究主题'},relatedWork:{en:'Explore related work',zh:'浏览相关成果'},
    publicationsTitle:{en:'Ideas into research.',zh:'科研成果'},scholarProfile:{en:'Google Scholar profile',zh:'谷歌学术'},year:{en:'Year',zh:'年份'},resetFilters:{en:'Reset filters',zh:'重置筛选'},publicationNote:{en:'Click a title to explore the work',zh:'点击标题查看研究介绍'},noResults:{en:'No matching publications.',zh:'暂无符合条件的论文。'},noResultsHint:{en:'Try a different keyword, topic, or year.',zh:'试试其他关键词、方向或年份。'},
    journeyTitle:{en:'The path so far.',zh:'教育与荣誉'},journeyIntro:{en:'From computer science to cognitive neuroscience. Always learning.',zh:'从计算机科学到认知神经科学，在探索中不断学习。'},educationTitle:{en:'Education',zh:'教育经历'},honorsTitle:{en:'Honors & support',zh:'荣誉与资助'},honorsFoot:{en:'With gratitude for the people and institutions supporting this journey.',zh:'感谢求学路上给予支持的人与机构。'},
    experienceTitle:{en:'Research is only part of the story.',zh:'科研之外'},experienceIntro:{en:'Teaching, reviewing, writing, and sharing what I learn along the way.',zh:'参与教学与审稿，写下思考，也分享所学。'},toolbox:{en:'My toolbox',zh:'工具与技能'},
    hobbiesTitle:{en:'Outside the lab.',zh:'爱好'},
    hobbyCube:{en:'Rubik’s Cube',zh:'魔方'},hobbyFitness:{en:'Fitness',zh:'健身'},hobbyGallery:{en:'Photography',zh:'摄影'},hobbyArena:{en:'League of Legends',zh:'英雄联盟'},
    hobbyCubeLevel:{en:'Advanced amateur',zh:'业余高级'},hobbyFitnessLevel:{en:'Beginner',zh:'小白'},hobbyGalleryLevel:{en:'Beginner',zh:'小白'},hobbyArenaLevel:{en:'Diamond',zh:'钻石'},
    hobbyPlay:{en:'Let’s play',zh:'开始玩'},hobbyExplore:{en:'View gallery',zh:'浏览作品'},
    writingTitle:{en:'Making ideas accessible.',zh:'让知识被更多人看见'},writingIntro:{en:'Technology writing as Zicy · 200,000+ cumulative reads.',zh:'笔名 Zicy · 技术文章累计阅读量 20 万+'},blog:{en:'Personal blog',zh:'个人博客'},techWriting:{en:'Selected writing',zh:'技术文章'},
    contactTitle:{en:'Let’s connect.',zh:'聊聊研究与想法'},contactIntro:{en:'Interested in brain–computer interfaces, brain-inspired AI, language and cognition, or medical AI? I would love to exchange ideas.',zh:'如果你也关注脑机接口、类脑人工智能、语言与认知或医学人工智能，欢迎交流。'},backTop:{en:'Back to top ↑',zh:'返回顶部 ↑'},footerNote:{en:'Built with curiosity.',zh:'保持好奇。'},paperDetails:{en:'Research overview',zh:'研究介绍'}
  };
  const HOME_METADATA = {
    both: {
      title: '张梓寒 Zihan Zhang | 哈尔滨工业大学 | 脑机接口与类脑智能',
      description: '张梓寒 Zihan Zhang，哈尔滨工业大学（HIT）SCIR 博士生，研究脑机接口、类脑人工智能、语言与认知及医学人工智能。',
      locale: 'en_US'
    },
    en: {
      title: 'Zihan Zhang | Harbin Institute of Technology | BCI & Brain-Inspired AI',
      description: 'Zihan Zhang is a Ph.D. student at Harbin Institute of Technology (SCIR), researching brain–computer interfaces, brain-inspired AI, language and cognition, and medical AI.',
      locale: 'en_US'
    },
    zh: {
      title: '张梓寒 | 哈尔滨工业大学 | 脑机接口与类脑智能',
      description: '张梓寒，哈尔滨工业大学社会计算与交互机器人研究中心（SCIR）博士生，研究脑机接口、类脑人工智能、语言与认知及医学人工智能。',
      locale: 'zh_CN'
    }
  };
  const topics = [
    {id:'all',label:{en:'All work',zh:'全部'}},
    {id:'eeg',label:{en:'Brain–computer interfaces',zh:'脑机接口'}},
    {id:'brain',label:{en:'Brain-inspired AI',zh:'类脑人工智能'}},
    {id:'nlp',label:{en:'Language & cognition',zh:'语言与认知'}},
    {id:'medical',label:{en:'Medical AI',zh:'医学人工智能'}}
  ];
  const validLanguages = ['zh','en','both'];
  const canonicalOrigin = 'https://zhangzihan-is-good.github.io';
  const languagePath = l => l === 'both' ? '/' : `/${l}/`;
  const pathLanguage = () => /^\/zh(?:\/|$)/.test(location.pathname) ? 'zh' : /^\/en(?:\/|$)/.test(location.pathname) ? 'en' : 'both';
  const initialLang = new URL(location.href).searchParams.get('lang');
  let language = validLanguages.includes(initialLang) ? initialLang : pathLanguage();
  const paperPath = id => `${languagePath(language)}publications/${encodeURIComponent(id)}/`;
  let filter = 'all', direction = 'eeg', currentPaper = null, toastTimer, hasRendered = false;
  let dialogAnimation = null, dialogGeneration = 0, modalTrigger = null, modalScrollY = 0, originalBodyOverflow = '';
  const dialog = $('#paper-dialog');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reducedMotion.matches && document.documentElement.dataset.motionPaused !== 'true';
  const persist = (key,v) => {try{localStorage.setItem(key,v)}catch(e){}};
  const localized = (en,zh) => language === 'zh' ? zh : language === 'en' ? en : `${en} / ${zh}`;
  const topicLabel = id => topics.find(t=>t.id===id)?.label || {en:id,zh:id};
  const query = () => $('#paper-search').value.trim();
  function highlight(s) {
    const text = String(s ?? ''), q = query();
    if (!q) return esc(text);
    const lower = text.toLowerCase(), target = q.toLowerCase();
    let cursor = 0, result = '', at;
    while ((at = lower.indexOf(target, cursor)) !== -1) {
      result += esc(text.slice(cursor, at)) + '<mark>' + esc(text.slice(at, at + q.length)) + '</mark>';
      cursor = at + q.length;
    }
    return result + esc(text.slice(cursor));
  }
  const authorHTML = s => String(s).split(/(Zihan Zhang)/g).map(part => part === 'Zihan Zhang' ? `<strong>${highlight(part)}</strong>` : highlight(part)).join('');
  const venueLabel = p => p.id === 'cofett' ? 'ACL' : p.id === 'multibcd' ? 'BSPC' : p.type === 'thesis' ? 'Thesis' : p.venue;
  const paperLinks = (p, inDialog = false) => (p.links || [{url:p.url,label:p.linkLabel || {en:'Paper',zh:'论文'}}]).map((link,i) => `<a${inDialog ? ` class="button ${i === 0 ? 'primary' : 'secondary'}"` : ''} href="${esc(link.url)}" target="_blank" rel="noopener">${dual(link.label)} <span class="action-arrow" aria-hidden="true">↗</span></a>`).join('');

  const searchClear = $('#clear-search') || document.createElement('button');
  searchClear.type = 'button'; searchClear.id = 'clear-search'; searchClear.className = 'search-clear';
  searchClear.innerHTML = '<span aria-hidden="true">×</span>';
  searchClear.hidden = true;
  if (!searchClear.isConnected) $('.search-field').appendChild(searchClear);
  let activeFilters = $('#active-filters');
  if (!activeFilters) {
    activeFilters = document.createElement('div'); activeFilters.id = 'active-filters'; activeFilters.className = 'active-filters';
    $('.publication-toolbar').after(activeFilters);
  }

  function translate() {
    $$('[data-t]').forEach(el => {if(T[el.dataset.t]) el.innerHTML=dual(T[el.dataset.t]);});
    $('.hero-statement').innerHTML = '<span class="en" lang="en">Learning from the <em>brain.</em><br>Building for intelligence.</span><span class="zh" lang="zh-CN">向大脑学习，<br class="zh-break">探索智能的可能。</span>';
  }
  function captureReadingAnchor() {
    const top = ($('.header')?.getBoundingClientRect().bottom || 90) + 12;
    const items = $$('.pub-row, .education-item, .honor-group, .experience-item');
    const crossesReadingLine = el => {const r=el.getBoundingClientRect();return r.height>0 && r.top<=top && r.bottom>top;};
    const visibleAhead = el => {const r=el.getBoundingClientRect();return r.height>0 && r.top>top && r.top<innerHeight;};
    const sections = $$('main section[id]');
    const element = items.find(crossesReadingLine) || items.find(visibleAhead) || sections.find(crossesReadingLine) || sections.find(visibleAhead);
    if (!element) return null;
    return {element, paper:element.dataset.paper, top:element.getBoundingClientRect().top};
  }
  function restoreReadingAnchor(anchor) {
    if (!anchor || dialog.open) return;
    const element = anchor.paper ? $(`.pub-row[data-paper="${anchor.paper}"]`) : anchor.element;
    if (element?.isConnected) window.scrollBy({top:element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
  }
  function syncHomeMetadata() {
    const meta=HOME_METADATA[language],canonical=canonicalOrigin+languagePath(language);
    document.title=meta.title;
    const setMeta=(attribute,key,content)=>{
      let element=document.head.querySelector(`meta[${attribute}="${key}"]`);
      if(!element){element=document.createElement('meta');element.setAttribute(attribute,key);document.head.appendChild(element);}
      element.content=content;
    };
    setMeta('name','description',meta.description);
    setMeta('property','og:title',meta.title);setMeta('property','og:description',meta.description);
    setMeta('property','og:url',canonical);setMeta('property','og:locale',meta.locale);
    setMeta('property','og:locale:alternate',language==='zh'?'en_US':'zh_CN');
    setMeta('name','twitter:title',meta.title);setMeta('name','twitter:description',meta.description);
    let canonicalLink=document.head.querySelector('link[rel="canonical"]');
    if(!canonicalLink){canonicalLink=document.createElement('link');canonicalLink.rel='canonical';document.head.appendChild(canonicalLink);}
    canonicalLink.href=canonical;
    const schema=document.getElementById('profile-schema');
    if(schema){
      try{
        const data=JSON.parse(schema.textContent);
        const page=data['@graph']?.find(node=>node['@type']==='ProfilePage');
        if(page){page['@id']=canonical+'#profile';page.url=canonical;page.name=meta.title;page.description=meta.description;page.inLanguage=language==='both'?['en','zh-CN']:language==='zh'?'zh-CN':'en';schema.textContent=JSON.stringify(data);}
      }catch(_){}
    }
  }
  function setLanguage(l, preserve = true, updatePath = true) {
    if (!validLanguages.includes(l)) return;
    const anchor = hasRendered && preserve && !dialog.open ? captureReadingAnchor() : null;
    const modalScroll = dialog.scrollTop;
    const modalPaperTop = currentPaper && dialog.open ? $(`.pub-row[data-paper="${currentPaper.id}"]`)?.getBoundingClientRect().top : null;
    const active = document.activeElement;
    const focusDescriptor = active?.closest('#dialog-body') ? {cite:active.dataset.cite,share:active.dataset.share,href:active.getAttribute('href')} : null;
    language = l;
    if(updatePath){
      const url=new URL(location.href);url.pathname=languagePath(l);url.searchParams.delete('lang');
      if(url.href!==location.href)history.replaceState(history.state,'',url.href);
    }
    document.documentElement.dataset.language=l;
    document.documentElement.lang=l==='zh'?'zh-CN':'en';
    syncHomeMetadata();
    persist('zz-language',l);
    $$('[data-lang]').forEach(b=>{
      const selected=b.dataset.lang===l;b.classList.toggle('active',selected);
      if(b.tagName==='A'){b.href=languagePath(b.dataset.lang);b.removeAttribute('aria-pressed');if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
      else b.setAttribute('aria-pressed',String(selected));
    });
    translate();
    $('#paper-search').placeholder=localized('Search papers','搜索论文');
    searchClear.setAttribute('aria-label',localized('Clear search','清除搜索'));
    $('#year-filter option[value="all"]').textContent=localized('All years','全部年份');
    renderFilters(); renderPapers(); renderDirection();
    if(currentPaper && dialog.open) {
      renderDialog(currentPaper); dialog.scrollTop=modalScroll;
      const updatedPaperTop=$(`.pub-row[data-paper="${currentPaper.id}"]`)?.getBoundingClientRect().top;
      if(modalPaperTop!=null && updatedPaperTop!=null)modalScrollY+=updatedPaperTop-modalPaperTop;
      if (focusDescriptor) {
        const controls = [...$('#dialog-body').querySelectorAll('a,button')];
        controls.find(el=>(focusDescriptor.cite && el.dataset.cite===focusDescriptor.cite)||(focusDescriptor.share && el.dataset.share===focusDescriptor.share)||(focusDescriptor.href && el.getAttribute('href')===focusDescriptor.href))?.focus({preventScroll:true});
      }
    }
    document.dispatchEvent(new CustomEvent('zz:language',{detail:{language}}));
    if (anchor) restoreReadingAnchor(anchor);
    hasRendered = true;
  }
  const links = {'#hero-scholar':'scholar','#hero-github':'github','#publication-scholar':'scholar','#blog-link':'blog','#footer-github':'github','#footer-scholar':'scholar'};
  Object.entries(links).forEach(([s,k])=>{$(s).href=D.profile[k];});
  $('#education-list').innerHTML = D.education.map(e=>`<article class="education-item"><p class="period">${esc(e.period).replace('present','<span class="en">present</span><span class="zh">至今</span>')}</p><h4>${dual(e.school)}</h4><p class="degree">${dual(e.degree)}</p><p class="detail">${dual(e.detail)}</p></article>`).join('');
  const honorYears = [...new Set(D.honors.map(h=>h.year))];
  $('#honors-list').innerHTML = honorYears.map(year=>`<div class="honor-group"><div class="honor-year">${year}</div><div class="honor-items">${D.honors.filter(h=>h.year===year).map(h=>`<div class="honor-item"><div class="title">${dual(h.title)}</div></div>`).join('')}</div></div>`).join('');
  $('#skills-list').innerHTML = D.skills.map((s,i)=>`<div class="skill-item"><button type="button" class="skill-chip" aria-expanded="false" aria-controls="skill-tip-${i}">${esc(s.name)}</button><span class="skill-tip" id="skill-tip-${i}" hidden>${dual(s.level)}</span></div>`).join('');
  $('#experience-list').innerHTML = D.experience.map(e=>`<details class="experience-item" data-expanded="false"><summary aria-expanded="false"><div><span class="period">${esc(e.period).replace('present','<span class="en">present</span><span class="zh">至今</span>')}</span><span class="title">${dual(e.title)}</span></div><span class="expand-icon" aria-hidden="true">+</span></summary><div class="experience-content"><div class="experience-detail">${dual(e.detail)}</div></div></details>`).join('');

  function renderFilters() {
    if(!$('#topic-filters').querySelector('[data-filter]')) $('#topic-filters').innerHTML=topics.map(t=>`<button type="button" data-filter="${t.id}">${dual(t.label)}</button>`).join('');
    $$('#topic-filters button').forEach(b=>{const active=filter===b.dataset.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const chips=[];
    if(filter!=='all')chips.push(`<button type="button" class="filter-chip" data-clear-filter="topic" aria-label="${esc(localized('Remove topic filter','取消研究方向筛选'))}">${dual(topicLabel(filter))}<span aria-hidden="true">×</span></button>`);
    if($('#year-filter').value!=='all')chips.push(`<button type="button" class="filter-chip" data-clear-filter="year" aria-label="${esc(localized('Remove year filter','取消年份筛选'))}">${esc($('#year-filter').value)}<span aria-hidden="true">×</span></button>`);
    activeFilters.innerHTML=chips.join(''); activeFilters.hidden=!chips.length;
  }
  function matchingPapers(){
    const q=query().toLowerCase(), y=$('#year-filter').value;
    return D.publications.filter(p=>(filter==='all'||p.topics.includes(filter))&&(y==='all'||String(p.year)===y)&&(!q||[p.title,p.zhTitle,p.authors,p.venue,String(p.year),...p.topics.map(t=>`${topicLabel(t).en} ${topicLabel(t).zh}`)].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.year-a.year);
  }
  function renderPapers(animate = false){
    const matches=matchingPapers();
    $('#publication-list').innerHTML=matches.map(p=>`<article class="pub-row" data-paper="${p.id}"><div class="pub-meta"><span class="pub-year">${p.year}</span><span class="pub-venue">${highlight(venueLabel(p))}</span></div><div class="pub-main"><a class="pub-title-button" href="${paperPath(p.id)}" data-open="${p.id}" aria-label="${esc(localized('Explore: '+p.title,'查看：'+p.zhTitle))}"><h3 class="en" lang="en">${highlight(p.title)}</h3><p class="pub-title-zh zh" lang="zh-CN">${highlight(p.zhTitle)}</p></a><p class="pub-authors">${authorHTML(p.authors)}</p><p class="pub-citation">${highlight(p.venue)} · ${highlight(p.year)}</p><div class="pub-topics">${p.topics.map(t=>`<span>${dual(topicLabel(t))}</span>`).join('')}</div></div><div class="pub-actions"><div class="pub-primary-actions">${paperLinks(p)}${p.codeUrl?`<a href="${esc(p.codeUrl)}" target="_blank" rel="noopener">${dual({en:'Code',zh:'代码'})} <span class="action-arrow" aria-hidden="true">↗</span></a>`:''}</div><div class="pub-secondary-actions"><button type="button" data-open="${p.id}">${dual({en:'Overview',zh:'研究介绍'})}<span class="action-symbol" aria-hidden="true">+</span></button><button type="button" data-cite="${p.id}">${dual({en:'Cite',zh:'引用'})}<span class="action-symbol" aria-hidden="true">⧉</span></button></div></div></article>`).join('');
    $('#paper-count').innerHTML=dual({en:`${matches.length} of ${D.publications.length} works`,zh:`显示 ${matches.length} / ${D.publications.length} 项成果`});
    $('#empty-papers').hidden=matches.length>0;
    $('#reset-filters').hidden=filter==='all'&&!query()&&$('#year-filter').value==='all';
    searchClear.hidden=!$('#paper-search').value;
    if(animate && motionAllowed()) $('#publication-list').animate([{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});
    document.dispatchEvent(new CustomEvent('zz:papers',{detail:{count:matches.length,filter,year:$('#year-filter').value}}));
  }
  function renderDirection(){
    const r=D.research.find(r=>r.id===direction),idx=D.research.indexOf(r);
    $('#direction-index').textContent=String(idx+1).padStart(2,'0');
    $('#direction-title').innerHTML=dual(r.title);
    $('#direction-detail').innerHTML=dual(r.detail);
    const count=D.publications.filter(p=>r.topics.some(t=>p.topics.includes(t))).length;
    $('#direction-papers').innerHTML=dual({en:`${String(count).padStart(2,'0')} related works in this portfolio`,zh:`本站收录 ${count} 项相关成果`});
    $$('.map-node').forEach(b=>{const active=b.dataset.direction===direction;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.dispatchEvent(new CustomEvent('zz:direction',{detail:{direction}}));
  }
  function reset(){filter='all';$('#paper-search').value='';$('#year-filter').value='all';renderFilters();renderPapers(true);}
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
  const copyTimers = new WeakMap();
  function copiedState(button) {
    if (!button?.isConnected) return;
    clearTimeout(copyTimers.get(button));
    if (!button.dataset.copyOriginal) button.dataset.copyOriginal=button.innerHTML;
    button.classList.add('is-copied');
    button.innerHTML=`<span aria-hidden="true">✓</span><span>${dual({en:'Copied',zh:'已复制'})}</span>`;
    if (!button.hasAttribute('data-copy-original-label')) button.dataset.copyOriginalLabel=button.getAttribute('aria-label') || '';
    button.setAttribute('aria-label',localized('Copied','已复制'));
    copyTimers.set(button,setTimeout(()=>{
      if(button.isConnected){button.innerHTML=button.dataset.copyOriginal;button.classList.remove('is-copied');if(button.dataset.copyOriginalLabel)button.setAttribute('aria-label',button.dataset.copyOriginalLabel);else button.removeAttribute('aria-label');delete button.dataset.copyOriginal;delete button.dataset.copyOriginalLabel;}
    },1900));
  }
  async function copy(text,message,button){
    let success=false;
    try{await navigator.clipboard.writeText(text);success=true;}catch(e){
      const previousFocus=document.activeElement;
      const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
      const parent=dialog.open?dialog:document.body;parent.appendChild(ta);ta.select();
      try{success=document.execCommand('copy');}catch(e){}ta.remove();previousFocus?.focus({preventScroll:true});
    }
    if(success)copiedState(button);
    toast(success?message:localized('Copy unavailable. Select the text in the overview.','无法自动复制，请在研究介绍中手动选择文本。'));
    return success;
  }
  function paperShareURL(p){
    return canonicalOrigin+paperPath(p.id);
  }
  function renderDialog(p){
    $('#dialog-body').innerHTML=`<h2 id="dialog-title" class="en" lang="en">${esc(p.title)}</h2><h2 id="dialog-zh-label" class="dialog-zh-title zh" lang="zh-CN">${esc(p.zhTitle)}</h2><p class="dialog-authors">${String(p.authors).split(/(Zihan Zhang)/g).map(s=>s==='Zihan Zhang'?'<strong>Zihan Zhang</strong>':esc(s)).join('')}</p><p class="dialog-venue">${esc(p.venue)} · ${p.year}</p><div class="dialog-summary"><div class="summary-label">${dual({en:'Research in brief',zh:'研究简述'})}</div>${dual(p.summary)}</div><div class="dialog-actions"><div class="dialog-primary-actions">${paperLinks(p,true)}${p.codeUrl?`<a class="button secondary" href="${esc(p.codeUrl)}" target="_blank" rel="noopener">${dual({en:'Code',zh:'代码'})} <span class="action-arrow" aria-hidden="true">↗</span></a>`:''}</div><div class="dialog-secondary-actions"><button type="button" class="text-button" data-cite="${p.id}">${dual({en:'Copy BibTeX',zh:'复制引用'})} <span aria-hidden="true">⧉</span></button><button type="button" class="text-button" data-share="${p.id}">${dual({en:'Copy link',zh:'复制链接'})} <span aria-hidden="true">↗</span></button></div></div><details class="bib-details"><summary>BibTeX</summary><pre>${esc(p.bibtex)}</pre></details>`;
    dialog.setAttribute('aria-labelledby',language==='zh'?'dialog-zh-label':'dialog-title');
  }
  function openPaper(id, trigger = null){
    if(!dialog.open && document.querySelector('dialog[open]'))return;
    const p=D.publications.find(p=>p.id===id);if(!p)return;
    dialogGeneration++;dialogAnimation?.cancel();
    const wasOpen=dialog.open;
    if(!wasOpen){modalScrollY=scrollY;modalTrigger=trigger;originalBodyOverflow=document.body.style.overflow;}
    currentPaper=p;renderDialog(p);
    if(!wasOpen)dialog.showModal();
    document.body.style.overflow='hidden';dialog.scrollTop=0;dialog.dataset.state='opening';
    $('#close-dialog').focus({preventScroll:true});
    const r=trigger?.getBoundingClientRect(),dr=dialog.getBoundingClientRect();
    const dy=r?Math.max(-40,Math.min(40,r.top+r.height/2-dr.top-dr.height/2)):14;
    const generation=dialogGeneration;
    if(motionAllowed()){
      dialogAnimation=dialog.animate([{opacity:0,transform:`translateY(${dy}px) scale(.975)`},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'});
      dialogAnimation.finished.then(()=>{if(dialogGeneration===generation)dialog.dataset.state='open';}).catch(()=>{});
    }else dialog.dataset.state='open';
  }
  function closePaper(){
    if(!dialog.open||dialog.dataset.state==='closing')return;
    const generation=++dialogGeneration;dialogAnimation?.cancel();dialog.dataset.state='closing';
    const finish=()=>{if(dialogGeneration===generation&&dialog.open)dialog.close();};
    if(motionAllowed()){
      dialogAnimation=dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(10px) scale(.985)'}],{duration:160,easing:'ease-in'});
      dialogAnimation.finished.then(finish).catch(()=>{});
    }else finish();
  }
  function finishDialogClose(){
    const paper=currentPaper;
    document.body.style.overflow=originalBodyOverflow;dialog.dataset.state='closed';currentPaper=null;
    window.scrollTo({top:modalScrollY,behavior:'instant'});
    const trigger=modalTrigger?.isConnected?modalTrigger:paper?$(`.pub-row[data-paper="${paper.id}"] [data-open]`):null;
    trigger?.focus({preventScroll:true});modalTrigger=null;
    const url=new URL(location.href);
    if(paper&&url.searchParams.get('paper')===paper.id){url.searchParams.delete('paper');history.replaceState(history.state,'',url.href);}
  }
  const accordionAnimations=new WeakMap();
  function toggleExperience(details){
    const content=details.querySelector('.experience-content'), summary=details.querySelector('summary');
    const opening=details.dataset.expanded!=='true';
    details.dataset.expanded=String(opening);summary.setAttribute('aria-expanded',String(opening));
    details.querySelector('.expand-icon').textContent=opening?'−':'+';
    const currentHeight=details.open?content.getBoundingClientRect().height:0;
    accordionAnimations.get(details)?.cancel();details.open=true;
    const targetHeight=opening?content.scrollHeight:0;
    if(!motionAllowed()){details.open=opening;content.style.height='';content.style.overflow='';return;}
    content.style.overflow='hidden';
    const animation=content.animate([{height:`${currentHeight}px`,opacity:opening ? .5 : 1},{height:`${targetHeight}px`,opacity:opening?1:0}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'});
    accordionAnimations.set(details,animation);
    animation.finished.then(()=>{if(accordionAnimations.get(details)===animation){details.open=opening;content.style.height='';content.style.overflow='';accordionAnimations.delete(details);}}).catch(()=>{});
  }
  function closeSkillTips(except){
    $$('.skill-chip[aria-expanded="true"]').forEach(button=>{if(button!==except){button.setAttribute('aria-expanded','false');document.getElementById(button.getAttribute('aria-controls')).hidden=true;}});
  }
  const plainLinkClick = (event,link) => !event.defaultPrevented && event.button===0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !link.hasAttribute('download') && (!link.target || link.target==='_self');
  document.addEventListener('click',e=>{
    const lang=e.target.closest('[data-lang]');
    if(lang && (lang.tagName!=='A'||plainLinkClick(e,lang))){if(lang.tagName==='A')e.preventDefault();setLanguage(lang.dataset.lang);}
    const tab=e.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;renderFilters();renderPapers(true);}
    const chip=e.target.closest('[data-clear-filter]');if(chip){if(chip.dataset.clearFilter==='topic')filter='all';else $('#year-filter').value='all';renderFilters();renderPapers(true);}
    const node=e.target.closest('[data-direction]');if(node){direction=node.dataset.direction;renderDirection();}
    const open=e.target.closest('[data-open]');
    if(open && (open.tagName!=='A'||plainLinkClick(e,open))){if(open.tagName==='A')e.preventDefault();openPaper(open.dataset.open,open);}
    const cite=e.target.closest('[data-cite]');if(cite){const p=D.publications.find(p=>p.id===cite.dataset.cite);if(p)copy(p.bibtex,localized('BibTeX copied','已复制 BibTeX 引用'),cite);}
    const share=e.target.closest('[data-share]');if(share){const p=D.publications.find(p=>p.id===share.dataset.share);if(p)copy(paperShareURL(p),localized('Paper link copied','已复制论文链接'),share);}
    const summary=e.target.closest('.experience-item > summary');if(summary){e.preventDefault();toggleExperience(summary.parentElement);}
    const skill=e.target.closest('.skill-chip');closeSkillTips(skill);if(skill){const open=skill.getAttribute('aria-expanded')!=='true';skill.setAttribute('aria-expanded',String(open));document.getElementById(skill.getAttribute('aria-controls')).hidden=!open;}
  });
  document.addEventListener('focusout',e=>{if(e.target.closest('.skill-item'))setTimeout(()=>{if(!document.activeElement?.closest('.skill-item'))closeSkillTips();},0);});
  $('#paper-search').addEventListener('input',()=>renderPapers());
  searchClear.addEventListener('click',e=>{e.preventDefault();$('#paper-search').value='';renderPapers();$('#paper-search').focus();});
  $('#year-filter').addEventListener('change',()=>{renderFilters();renderPapers(true);});
  $('#reset-filters').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);
  $('#explore-direction').addEventListener('click',()=>{filter=direction;$('#paper-search').value='';$('#year-filter').value='all';renderFilters();renderPapers(true);$('#publications').scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});});
  $('#theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;persist('zz-theme',theme);$('meta[name="theme-color"]').content=theme==='dark'?'#1c211e':'#f7f7f2';$('#theme-toggle').setAttribute('aria-pressed',String(theme==='dark'));});
  $('#theme-toggle').setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='dark'));
  $('#copy-email').addEventListener('click',e=>copy(D.profile.email,localized('Email address copied','已复制邮箱地址'),e.currentTarget));
  $('#close-dialog').addEventListener('click',closePaper);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closePaper();});
  dialog.addEventListener('close',finishDialogClose);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePaper();}});
  $('#menu-toggle').addEventListener('click',()=>{const open=$('#mobile-nav').hidden;$('#mobile-nav').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));});
  $$('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!e.defaultPrevented&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable&&!document.querySelector('dialog[open]')){e.preventDefault();$('#publications').scrollIntoView();$('#paper-search').focus({preventScroll:true});}
    if(e.key==='Escape'&&document.activeElement===$('#paper-search')){if($('#paper-search').value){$('#paper-search').value='';renderPapers();}else $('#paper-search').blur();}
    if(e.key==='Escape')closeSkillTips();
  });
  let scrollQueued=false;
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress').style.width=(max>0?scrollY/max*100:0)+'%';scrollQueued=false;});}},{passive:true});
  function applyLocation(){
    const params=new URL(location.href).searchParams,legacyLang=params.get('lang');
    const lang=validLanguages.includes(legacyLang)?legacyLang:pathLanguage();
    if(lang!==language||validLanguages.includes(legacyLang))setLanguage(lang,false,validLanguages.includes(legacyLang));
    const id=params.get('paper'),paper=D.publications.find(p=>p.id===id);
    if(paper){
      filter='all';$('#paper-search').value='';$('#year-filter').value='all';renderFilters();renderPapers();
      requestAnimationFrame(()=>{const row=$(`.pub-row[data-paper="${paper.id}"]`);row?.scrollIntoView({block:'center',behavior:'instant'});openPaper(paper.id,row?.querySelector('[data-open]'));});
    }else if(dialog.open)closePaper();
  }
  window.addEventListener('popstate',applyLocation);
  setLanguage(language,false);
  if(new URL(location.href).searchParams.has('paper'))applyLocation();
})();
