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
    bio:{en:'I am a Ph.D. student at Harbin Institute of Technology (SCIR). My research connects brain–computer interfaces, brain-inspired AI, and natural language processing.',zh:'我是哈尔滨工业大学 SCIR 实验室博士生，研究脑机接口、类脑人工智能与自然语言处理。'},
    exploreWork:{en:'Explore my work',zh:'探索研究'},emailLink:{en:'Email ↗',zh:'邮箱 ↗'},portraitFoot:{en:'Curiosity across disciplines.',zh:'保持好奇，跨越学科。'},
    hit:{en:'Harbin Institute of Technology',zh:'哈尔滨工业大学'},hitDetail:{en:'Ph.D. · SCIR · 2023–present',zh:'计算机科学与技术 · 博士'},ntu:{en:'Nanyang Technological University',zh:'南洋理工大学'},ntuDetail:{en:'CSC Visiting Ph.D. · 2026–2027',zh:'认知神经科学 · 联合培养'},
    researchTitle:{en:'A connected perspective.',zh:'研究方向'},researchIntro:{en:'At the intersection of biological intelligence and machine learning.',zh:'在生物智能与机器学习的交汇处，探索信号、认知与语言。'},
    topicEEG:{en:'Brain–computer interfaces',zh:'脑机接口'},topicBrain:{en:'Brain-inspired AI',zh:'类脑人工智能'},topicNLP:{en:'Language & cognition',zh:'语言与认知'},topicMedical:{en:'Multimodal AI',zh:'多模态人工智能'},clickDirection:{en:'Select a node to explore',zh:'点击节点探索研究'},researchFocus:{en:'Research focus',zh:'研究主题'},relatedWork:{en:'Explore related work',zh:'浏览相关成果'},
    publicationsTitle:{en:'Ideas into research.',zh:'科研成果'},scholarProfile:{en:'Google Scholar profile',zh:'谷歌学术'},year:{en:'Year',zh:'年份'},resetFilters:{en:'Reset filters',zh:'重置筛选'},publicationNote:{en:'Click a title to explore the work',zh:'点击标题查看研究介绍'},noResults:{en:'No matching publications.',zh:'暂无符合条件的论文。'},noResultsHint:{en:'Try a different keyword, topic, or year.',zh:'试试其他关键词、方向或年份。'},
    journeyTitle:{en:'The path so far.',zh:'教育与荣誉'},journeyIntro:{en:'From computer science to cognitive neuroscience. Always learning.',zh:'从计算机科学到认知神经科学，在探索中不断学习。'},educationTitle:{en:'Education',zh:'教育经历'},honorsTitle:{en:'Honors & support',zh:'荣誉与资助'},honorsFoot:{en:'With gratitude for the people and institutions supporting this journey.',zh:'感谢求学路上给予支持的人与机构。'},
    experienceTitle:{en:'Research is only part of the story.',zh:'科研之外'},experienceIntro:{en:'Teaching, reviewing, writing, and sharing what I learn along the way.',zh:'参与教学与审稿，写下思考，也分享所学。生活中喜欢魔方、健身与摄影。'},toolbox:{en:'My toolbox',zh:'工具与技能'},
    writingTitle:{en:'Making ideas accessible.',zh:'让知识被更多人看见'},writingIntro:{en:'Technology writing as Zicy · 200,000+ cumulative reads.',zh:'笔名 Zicy · 技术文章累计阅读量 20 万+'},blog:{en:'Personal blog',zh:'个人博客'},techWriting:{en:'Selected writing',zh:'技术文章'},
    contactTitle:{en:'Let’s connect.',zh:'聊聊研究与想法'},contactIntro:{en:'Interested in brain-inspired intelligence, BCI, or language? I would love to exchange ideas.',zh:'如果你也关注类脑智能、脑机接口或语言研究，欢迎交流。'},backTop:{en:'Back to top ↑',zh:'返回顶部 ↑'},footerNote:{en:'Built with curiosity.',zh:'保持好奇。'},paperDetails:{en:'Research overview',zh:'研究介绍'}
  };
  const topics = [
    {id:'all',label:{en:'All work',zh:'全部'}},
    {id:'eeg',label:{en:'EEG & BCI',zh:'脑机接口'}},
    {id:'brain',label:{en:'Brain-inspired AI',zh:'类脑智能'}},
    {id:'nlp',label:{en:'Language',zh:'语言'}},
    {id:'medical',label:{en:'Multimodal AI',zh:'多模态'}}
  ];
  let language = ['zh','en','both'].includes(document.documentElement.dataset.language) ? document.documentElement.dataset.language : 'both';
  let filter = 'all', direction = 'eeg', currentPaper = null, toastTimer;
  const persist = (key,v) => {try{localStorage.setItem(key,v)}catch(e){}};
  const localized = (en,zh) => language === 'zh' ? zh : language === 'en' ? en : `${en} / ${zh}`;
  const authorHTML = s => esc(s).replace(/Zihan Zhang/g,'<strong>Zihan Zhang</strong>');
  const venueLabel = p => p.id === 'cofett' ? 'ACL' : p.id === 'multibcd' ? 'BSPC' : p.type === 'thesis' ? 'Thesis' : p.venue;
  const topicLabel = id => topics.find(t=>t.id===id)?.label || {en:id,zh:id};
  const paperLinks = (p, inDialog = false) => (p.links || [{url:p.url,label:p.linkLabel || {en:'Paper',zh:'论文'}}]).map((link,i) => `<a${inDialog ? ` class="button ${i === 0 ? 'primary' : 'secondary'}"` : ''} href="${esc(link.url)}" target="_blank" rel="noopener">${dual(link.label)} ↗</a>`).join('');
  function translate() {
    $$('[data-t]').forEach(el => {if(T[el.dataset.t]) el.innerHTML=dual(T[el.dataset.t]);});
    const statement = $('.hero-statement');
    statement.innerHTML = '<span class="en" lang="en">Learning from the <em>brain.</em><br>Building for intelligence.</span><span class="zh" lang="zh-CN">向大脑学习，<br class="zh-break">探索智能的可能。</span>';
  }
  function setLanguage(l) {
    language = l;
    document.documentElement.dataset.language=l;
    document.documentElement.lang=l==='zh'?'zh-CN':'en';
    persist('zz-language',l);
    $$('[data-lang]').forEach(b=>{b.classList.toggle('active',b.dataset.lang===l);b.setAttribute('aria-pressed',String(b.dataset.lang===l));});
    translate();
    $('#paper-search').placeholder=localized('Search papers','搜索论文');
    $('#year-filter option[value="all"]').textContent=localized('All years','全部年份');
    renderFilters(); renderPapers(); renderDirection();
    if(currentPaper && $('#paper-dialog').open) renderDialog(currentPaper);
  }
  const links = {'#hero-scholar':'scholar','#hero-github':'github','#publication-scholar':'scholar','#blog-link':'blog','#writing-link':'writing','#footer-github':'github','#footer-scholar':'scholar'};
  Object.entries(links).forEach(([s,k])=>{$(s).href=D.profile[k];});
  $('#education-list').innerHTML = D.education.map(e=>`<article class="education-item"><p class="period">${esc(e.period).replace('present','<span class="en">present</span><span class="zh">至今</span>')}</p><h4>${dual(e.school)}</h4><p class="degree">${dual(e.degree)}</p><p class="detail">${dual(e.detail)}</p></article>`).join('');
  $('#honors-list').innerHTML=D.honors.map(h=>`<div class="honor-item"><span class="year">${h.year}</span><div class="title">${dual(h.title)}</div></div>`).join('');
  $('#skills-list').innerHTML=D.skills.map(s=>`<span title="${esc(s.level.en)} / ${esc(s.level.zh)}">${esc(s.name)}</span>`).join('');
  $('#experience-list').innerHTML=D.experience.map((e,i)=>`<details class="experience-item" ${i===0?'open':''}><summary><div><span class="period">${esc(e.period).replace('present','<span class="en">present</span><span class="zh">至今</span>')}</span><span class="title">${dual(e.title)}</span></div><span class="expand-icon" aria-hidden="true">+</span></summary><div class="experience-detail">${dual(e.detail)}</div></details>`).join('');
  function renderFilters() {
    if(!$('#topic-filters').children.length) $('#topic-filters').innerHTML=topics.map(t=>`<button data-filter="${t.id}">${dual(t.label)}</button>`).join('');
    $$('#topic-filters button').forEach(b=>{const active=filter===b.dataset.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function matchingPapers(){
    const q=$('#paper-search').value.trim().toLowerCase();
    const y=$('#year-filter').value;
    return D.publications.filter(p=>(filter==='all'||p.topics.includes(filter))&&(y==='all'||String(p.year)===y)&&(!q||[p.title,p.zhTitle,p.authors,p.venue,String(p.year),...p.topics.map(t=>`${topicLabel(t).en} ${topicLabel(t).zh}`)].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.year-a.year);
  }
  function renderPapers(){
    const matches=matchingPapers();
    $('#publication-list').innerHTML=matches.map(p=>`<article class="pub-row" data-paper="${p.id}"><div class="pub-meta"><span class="pub-year">${p.year}</span><span class="pub-venue">${esc(venueLabel(p))}</span></div><div class="pub-main"><button class="pub-title-button" data-open="${p.id}" aria-label="${esc(localized('Explore: '+p.title,'查看：'+p.zhTitle))}"><h3 class="en" lang="en">${esc(p.title)}</h3><p class="pub-title-zh zh" lang="zh-CN">${esc(p.zhTitle)}</p></button><p class="pub-authors">${authorHTML(p.authors)}</p><p class="pub-citation">${esc(p.venue)} · ${p.year}</p><div class="pub-topics">${p.topics.map(t=>`<span>${dual(topicLabel(t))}</span>`).join('')}</div></div><div class="pub-actions">${paperLinks(p)}${p.codeUrl?`<a href="${esc(p.codeUrl)}" target="_blank" rel="noopener">${dual({en:'Code',zh:'代码'})} ↗</a>`:''}<button data-open="${p.id}">${dual({en:'Overview',zh:'研究介绍'})} +</button><button data-cite="${p.id}">${dual({en:'Cite',zh:'引用'})} ⧉</button></div></article>`).join('');
    $('#paper-count').innerHTML=dual({en:`${matches.length} of ${D.publications.length} works`,zh:`显示 ${matches.length} / ${D.publications.length} 项成果`});
    $('#empty-papers').hidden=matches.length>0;
    $('#reset-filters').hidden=filter==='all'&&!$('#paper-search').value&&$('#year-filter').value==='all';
  }
  function renderDirection(){
    const r=D.research.find(r=>r.id===direction);
    const idx=D.research.indexOf(r);
    $('#direction-index').textContent=String(idx+1).padStart(2,'0');
    $('#direction-title').innerHTML=dual(r.title);
    $('#direction-detail').innerHTML=dual(r.detail);
    const count=D.publications.filter(p=>r.topics.some(t=>p.topics.includes(t))).length;
    $('#direction-papers').innerHTML=dual({en:`${String(count).padStart(2,'0')} related works in this portfolio`,zh:`本站收录 ${count} 项相关成果`});
    $$('.map-node').forEach(b=>{const active=b.dataset.direction===direction;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function reset(){filter='all';$('#paper-search').value='';$('#year-filter').value='all';renderFilters();renderPapers();}
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
  async function copy(text,message){
    let success=false;
    try{await navigator.clipboard.writeText(text);success=true;}catch(e){
      const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
      const parent=$('#paper-dialog').open?$('#paper-dialog'):document.body;parent.appendChild(ta);ta.select();
      try{success=document.execCommand('copy');}catch(e){}ta.remove();
    }
    toast(success?message:localized('Copy unavailable. Select the text in the overview.','无法自动复制，请在研究介绍中手动选择文本。'));
    return success;
  }
  function renderDialog(p){
    $('#dialog-body').innerHTML=`<h2 id="dialog-title" class="en" lang="en">${esc(p.title)}</h2><p class="dialog-zh-title zh" lang="zh-CN">${esc(p.zhTitle)}</p><p class="dialog-authors">${authorHTML(p.authors)}</p><p class="dialog-venue">${esc(p.venue)} · ${p.year}</p><div class="dialog-summary"><div class="summary-label">${dual({en:'Research in brief',zh:'研究简述'})}</div>${dual(p.summary)}</div><div class="dialog-actions">${paperLinks(p,true)}<button class="text-button" data-cite="${p.id}">${dual({en:'Copy BibTeX',zh:'复制引用'})} ⧉</button>${p.codeUrl?`<a class="text-button" href="${esc(p.codeUrl)}" target="_blank" rel="noopener">${dual({en:'Code',zh:'代码'})} ↗</a>`:''}</div><details class="bib-details"><summary>BibTeX</summary><pre>${esc(p.bibtex)}</pre></details>`;
    $('#paper-dialog').setAttribute('aria-labelledby',language==='zh'?'dialog-zh-label':'dialog-title');
    $('.dialog-zh-title').id='dialog-zh-label';
  }
  function openPaper(id){currentPaper=D.publications.find(p=>p.id===id);if(!currentPaper)return;renderDialog(currentPaper);$('#paper-dialog').showModal();document.body.style.overflow='hidden';}
  document.addEventListener('click',e=>{
    const lang=e.target.closest('[data-lang]');if(lang)setLanguage(lang.dataset.lang);
    const tab=e.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;renderFilters();renderPapers();}
    const node=e.target.closest('[data-direction]');if(node){direction=node.dataset.direction;renderDirection();}
    const open=e.target.closest('[data-open]');if(open)openPaper(open.dataset.open);
    const cite=e.target.closest('[data-cite]');if(cite){const p=D.publications.find(p=>p.id===cite.dataset.cite);copy(p.bibtex,localized('BibTeX copied','已复制 BibTeX 引用'));}
  });
  $('#paper-search').addEventListener('input',renderPapers);
  $('#year-filter').addEventListener('change',renderPapers);
  $('#reset-filters').addEventListener('click',reset);
  $('#empty-reset').addEventListener('click',reset);
  $('#explore-direction').addEventListener('click',()=>{filter=direction;$('#paper-search').value='';$('#year-filter').value='all';renderFilters();renderPapers();$('#publications').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  $('#theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;persist('zz-theme',theme);$('meta[name="theme-color"]').content=theme==='dark'?'#1c211e':'#f7f7f2';$('#theme-toggle').setAttribute('aria-pressed',String(theme==='dark'));});
  $('#copy-email').addEventListener('click',()=>copy(D.profile.email,localized('Email address copied','已复制邮箱地址')));
  $('#close-dialog').addEventListener('click',()=>$('#paper-dialog').close());
  $('#paper-dialog').addEventListener('close',()=>{document.body.style.overflow='';currentPaper=null;});
  $('#paper-dialog').addEventListener('click',e=>{if(e.target===$('#paper-dialog')){const r=$('#paper-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#paper-dialog').close();}});
  $('#menu-toggle').addEventListener('click',()=>{const open=$('#mobile-nav').hidden;$('#mobile-nav').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));});
  $$('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$('#paper-dialog').open){e.preventDefault();$('#publications').scrollIntoView();$('#paper-search').focus({preventScroll:true});}if(e.key==='Escape'&&document.activeElement===$('#paper-search')){if($('#paper-search').value){$('#paper-search').value='';renderPapers();}else $('#paper-search').blur();}});
  let scrollQueued=false;
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress').style.width=(max>0?scrollY/max*100:0)+'%';scrollQueued=false;});}},{passive:true});
  if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.desktop-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}});},{rootMargin:'-15% 0px -65% 0px',threshold:0});$$('main section[id]').forEach(s=>obs.observe(s));}
  setLanguage(language);
})();
