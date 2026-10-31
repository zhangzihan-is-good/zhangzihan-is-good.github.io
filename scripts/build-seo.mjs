#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const exists = async p => { try { await fs.access(p); return true; } catch { return false; } };
const sourceRoot = await exists(path.join(projectRoot, 'dist/content.js')) ? path.join(projectRoot, 'dist') : projectRoot;
const outputRoot = option('--output') ? path.resolve(process.cwd(), option('--output')) : sourceRoot;
const BASE = 'https://zhangzihan-is-good.github.io/';
// Update this only when publishing actual content changes, or pass --lastmod YYYY-MM-DD.
const lastmod = option('--lastmod') || '2026-10-30';
const homeLastmod = option('--home-lastmod') || '2026-10-31';
if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) throw new Error('Invalid --lastmod date');
if (!/^\d{4}-\d{2}-\d{2}$/.test(homeLastmod)) throw new Error('Invalid --home-lastmod date');
const source = await fs.readFile(path.join(sourceRoot, 'content.js'), 'utf8');
const sandbox = {window: {}};
vm.runInNewContext(source, sandbox, {timeout: 1000});
const D = JSON.parse(JSON.stringify(sandbox.window.PROFILE_DATA));
const appSource = await fs.readFile(path.join(sourceRoot, 'app.js'), 'utf8');
function readLiteral(name, delimiter = '{', endDelimiter = '}') {
  const start = appSource.indexOf('const ' + name + ' = ');
  if (start < 0) throw new Error('Missing literal ' + name + ' in app.js');
  let at = appSource.indexOf(delimiter, start), begin = at, depth = 0, quote = '', escaped = false;
  for (; at < appSource.length; at++) {
    const char = appSource[at];
    if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; continue; }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === delimiter) depth++;
    if (char === endDelimiter) depth--;
    if (char === endDelimiter && depth === 0) return vm.runInNewContext('(' + appSource.slice(begin, at + 1) + ')', {}, {timeout: 1000});
  }
  throw new Error('Unclosed literal ' + name);
}
const T = readLiteral('T');
const HOME = readLiteral('HOME_METADATA');
const topics = [
  {id:'all',label:{en:'All work',zh:'全部'}}, {id:'eeg',label:{en:'EEG & BCI',zh:'脑机接口'}},
  {id:'brain',label:{en:'Brain-inspired AI',zh:'类脑智能'}}, {id:'nlp',label:{en:'Language',zh:'语言'}},
  {id:'medical',label:{en:'Multimodal AI',zh:'多模态'}}
];
const languages = ['both','en','zh'];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dual = value => '<span class="en" lang="en">' + esc(value.en) + '</span><span class="zh" lang="zh-CN">' + esc(value.zh) + '</span>';
const prefix = lang => lang === 'both' ? '/' : '/' + lang + '/';
const paperPath = (p, lang) => prefix(lang) + 'publications/' + p.id + '/';
const absolute = p => new URL(p, BASE).href;
const primary = (v, lang) => lang === 'zh' ? v.zh : v.en;
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const personID = BASE + '#person';
const websiteID = BASE + '#website';
const period = value => esc(value).replace('present', '<span class="en" lang="en">present</span><span class="zh" lang="zh-CN">至今</span>');
const authorHTML = value => esc(value).replace(/Zihan Zhang/g, '<strong>Zihan Zhang</strong>');
const topic = id => topics.find(t => t.id === id)?.label || {en:id,zh:id};
const venue = p => p.id === 'cofett' ? 'ACL' : p.id === 'multibcd' ? 'BSPC' : p.type === 'thesis' ? 'Thesis' : p.venue;
const arrow = '<span class="action-arrow" aria-hidden="true">↗</span>';
function officialLinks(p, buttons = false) {
  return (p.links || [{url:p.url,label:p.linkLabel || {en:'Paper',zh:'论文'}}]).map((l, i) => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener"' + (buttons ? ' class="button ' + (i ? 'secondary' : 'primary') + '"' : '') + '>' + dual(l.label) + ' ' + arrow + '</a>').join('');
}
function pubRow(p, lang) {
  return '<article class="pub-row" data-paper="' + esc(p.id) + '"><div class="pub-meta"><span class="pub-year">' + p.year + '</span><span class="pub-venue">' + esc(venue(p)) + '</span></div><div class="pub-main"><a class="pub-title-button" data-open="' + esc(p.id) + '" href="' + paperPath(p,lang) + '"><h3 class="en" lang="en">' + esc(p.title) + '</h3><p class="pub-title-zh zh" lang="zh-CN">' + esc(p.zhTitle) + '</p></a><p class="pub-authors">' + authorHTML(p.authors) + '</p><p class="pub-citation">' + esc(p.venue) + ' · ' + p.year + '</p><div class="pub-topics">' + p.topics.map(id => '<span>' + dual(topic(id)) + '</span>').join('') + '</div></div><div class="pub-actions"><div class="pub-primary-actions">' + officialLinks(p) + (p.codeUrl ? '<a href="' + esc(p.codeUrl) + '" target="_blank" rel="noopener">' + dual({en:'Code',zh:'代码'}) + ' ' + arrow + '</a>' : '') + '</div><div class="pub-secondary-actions"><button type="button" data-open="' + p.id + '">' + dual({en:'Overview',zh:'研究介绍'}) + '<span class="action-symbol" aria-hidden="true">+</span></button><button type="button" data-cite="' + p.id + '">' + dual({en:'Cite',zh:'引用'}) + '<span class="action-symbol" aria-hidden="true">⧉</span></button></div></div></article>';
}
const person = {
  '@type':'Person','@id':personID,name:D.profile.nameEn,alternateName:D.profile.nameZh,url:BASE,
  image:absolute('/assets/portrait.jpg'),jobTitle:'Ph.D. student',
  affiliation:{'@type':'CollegeOrUniversity',name:'Harbin Institute of Technology',alternateName:'哈尔滨工业大学'},
  sameAs:[D.profile.github,D.profile.scholar,D.profile.blog].filter(Boolean),
  knowsAbout:['Brain–computer interfaces','EEG decoding','Brain-inspired artificial intelligence','Natural language processing']
};
function alternates(routes) {
  return '<link rel="alternate" hreflang="en" href="' + absolute(routes.en) + '">\n<link rel="alternate" hreflang="zh-CN" href="' + absolute(routes.zh) + '">\n<link rel="alternate" hreflang="x-default" href="' + absolute(routes.both) + '">';
}
function socialHead(title, description, url, lang, type = 'website') {
  return '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(description) + '">\n<meta property="og:url" content="' + esc(url) + '">\n<meta property="og:type" content="' + type + '">\n<meta property="og:site_name" content="Zihan Zhang · 张梓寒">\n<meta property="og:locale" content="' + (lang === 'zh' ? 'zh_CN' : 'en_US') + '">\n<meta property="og:image" content="' + absolute('/assets/portrait.jpg') + '">\n<meta property="og:image:alt" content="张梓寒 Zihan Zhang">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="' + esc(title) + '">\n<meta name="twitter:description" content="' + esc(description) + '">\n<meta name="twitter:image" content="' + absolute('/assets/portrait.jpg') + '">';
}
function boot(lang) {
  return '<script>try{document.documentElement.dataset.theme=localStorage.getItem("zz-theme")||"light";document.documentElement.dataset.language="' + lang + '";document.documentElement.dataset.motionPaused=String(localStorage.getItem("zz-motion-paused")==="true"||matchMedia("(prefers-reduced-motion:reduce)").matches)}catch(e){}</script>';
}
function injectId(html, id, value) {
  const re = new RegExp('(<([a-z0-9]+)\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</\\2>)', 'i');
  if (!re.test(html)) throw new Error('Missing placeholder #' + id);
  return html.replace(re, (_, open, tag, close) => open + value + close);
}
function hrefForId(html, id, href) {
  const re = new RegExp('<a([^>]*\\bid="' + id + '"[^>]*)>', 'i');
  return html.replace(re, (_, attrs) => '<a' + attrs.replace(/\s+href="[^"]*"/g,'') + ' href="' + esc(href) + '">');
}
function langNav(lang, routeFor) {
  return '<span class="language-active-indicator" aria-hidden="true"></span>' + [{id:'zh',label:'中',aria:'中文'},{id:'en',label:'EN',aria:'English'},{id:'both',label:'对照',aria:'中英文对照'}].map(item => '<a data-lang="' + item.id + '" href="' + routeFor(item.id) + '" aria-label="' + item.aria + '"' + (item.id === lang ? ' class="active" aria-current="page"' : '') + '>' + item.label + '</a>').join('');
}
const template = await fs.readFile(path.join(projectRoot,'templates/homepage.html'),'utf8');
const fontHead = (template.match(/<link[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g) || []).join('\n');
const outputPaths = [];
async function write(relative, content) {
  const file = path.join(outputRoot,relative);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,content);
}
function homepage(lang) {
  let html = template;
  html = html.replace(/<html[^>]*>/,'<html lang="' + (lang === 'zh' ? 'zh-CN' : 'en') + '" data-language="' + lang + '" data-route-language="' + lang + '" data-theme="light">');
  html = html.replace(/(<([a-z0-9]+)\b[^>]*\bdata-t="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/gi, (all,open,tag,key,close) => T[key] ? open + dual(T[key]) + close : all);
  html = html.replace(/(<h2 class="hero-statement"[^>]*>)[\s\S]*?(<\/h2>)/,'$1<span class="en" lang="en">Learning from the <em>brain.</em><br>Building for intelligence.</span><span class="zh" lang="zh-CN">向大脑学习，<br class="zh-break">探索智能的可能。</span>$2');
  const profileLinks = {'hero-scholar':'scholar','hero-github':'github','publication-scholar':'scholar','blog-link':'blog','footer-github':'github','footer-scholar':'scholar'};
  for (const [id,key] of Object.entries(profileLinks)) html=hrefForId(html,id,D.profile[key]);
  html = html.replace(/(<div class="language-switch"[^>]*>)[\s\S]*?(<\/div>)/,(_,open,close) => open + langNav(lang,prefix) + close);
  html = injectId(html,'publication-list',[...D.publications].sort((a,b)=>b.year-a.year).map(p=>pubRow(p,lang)).join('\n'));
  html = injectId(html,'topic-filters',topics.map(t=>'<button type="button" data-filter="' + t.id + '" aria-pressed="' + (t.id==='all') + '"' + (t.id==='all'?' class="active"':'') + '>' + dual(t.label) + '</button>').join(''));
  html = injectId(html,'paper-count',dual({en:D.publications.length+' of '+D.publications.length+' works',zh:'显示 '+D.publications.length+' / '+D.publications.length+' 项成果'}));
  html = injectId(html,'education-list',D.education.map(e=>'<article class="education-item"><p class="period">'+period(e.period)+'</p><h4>'+dual(e.school)+'</h4><p class="degree">'+dual(e.degree)+'</p><p class="detail">'+dual(e.detail)+'</p></article>').join('\n'));
  html = injectId(html,'honors-list',[...new Set(D.honors.map(h=>h.year))].map(year=>'<div class="honor-group"><div class="honor-year">'+year+'</div><div class="honor-items">'+D.honors.filter(h=>h.year===year).map(h=>'<div class="honor-item"><div class="title">'+dual(h.title)+'</div></div>').join('')+'</div></div>').join(''));
  html = injectId(html,'skills-list',D.skills.map((s,i)=>'<div class="skill-item"><button type="button" class="skill-chip" aria-expanded="false" aria-controls="skill-tip-'+i+'">'+esc(s.name)+'</button><span class="skill-tip" id="skill-tip-'+i+'" hidden>'+dual(s.level)+'</span></div>').join(''));
  html = injectId(html,'experience-list',D.experience.map(e=>'<details class="experience-item" data-expanded="false"><summary aria-expanded="false"><div><span class="period">'+period(e.period)+'</span><span class="title">'+dual(e.title)+'</span></div><span class="expand-icon" aria-hidden="true">+</span></summary><div class="experience-content"><div class="experience-detail">'+dual(e.detail)+'</div></div></details>').join(''));
  const first = D.research[0];
  html = injectId(html,'direction-title',dual(first.title));
  html = injectId(html,'direction-detail',dual(first.detail));
  const count = D.publications.filter(p=>first.topics.some(t=>p.topics.includes(t))).length;
  html = injectId(html,'direction-papers',dual({en:String(count).padStart(2,'0')+' related works in this portfolio',zh:'本站收录 '+count+' 项相关成果'}));
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
  const staticResearch = '<noscript><style>.research-explorer,.publication-toolbar,.result-summary,.pub-secondary-actions,#theme-toggle,#menu-toggle{display:none!important}.research-static-notes{display:grid;gap:24px}.research-static-notes p{margin-top:8px}.research-static-notes .zh{display:block;margin-top:6px}</style><div class="research-static-notes">'+D.research.map(r=>'<article><h3>'+dual(r.title)+'</h3><p>'+dual(r.detail)+'</p></article>').join('')+'</div></noscript>';
  html = html.replace(/(\n    <\/section>)(\n    <section class="publications-section)/,'\n'+staticResearch+'$1$2');
  html = html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(HOME[lang].title)+'</title>');
  html = html.replace(/<meta name="description"[^>]*>/,'<meta name="description" content="'+esc(HOME[lang].description)+'">');
  html = html.replace(/\s*<meta property="og:[^"]+"[^>]*>/g,'');
  html = html.replace(/<script>try\{const q=new URLSearchParams[\s\S]*?<\/script>/,boot(lang));
  html = html.replace(/\b(href|src)="(?!https?:|mailto:|#|\/)([^"]+)"/g,(_,attr,resource)=>attr+'="/'+resource+'"');
  html = html.replace(/\b(href|src)="(\/[^"?]+\.(?:css|js))(?:\?[^\"]*)?"/g,'$1="$2?v=hobbies20261031d"');
  const pageURL = absolute(prefix(lang));
  const graph = {'@context':'https://schema.org','@graph':[
    {'@type':'WebSite','@id':websiteID,url:BASE,name:'Zihan Zhang · 张梓寒',alternateName:'张梓寒个人学术主页',inLanguage:['en','zh-CN']},person,
    {'@type':'ProfilePage','@id':pageURL+'#profile',url:pageURL,name:HOME[lang].title,description:HOME[lang].description,inLanguage:lang==='both'?['en','zh-CN']:lang==='zh'?'zh-CN':'en',mainEntity:{'@id':personID},isPartOf:{'@id':websiteID}}
  ]};
  const head = '<link rel="canonical" href="'+pageURL+'">\n'+alternates({both:'/',en:'/en/',zh:'/zh/'})+'\n'+socialHead(HOME[lang].title,HOME[lang].description,pageURL,lang)+'\n<script type="application/ld+json" id="profile-schema">'+json(graph)+'</script>\n';
  html = html.replace('</head>',head+'</head>');
  return html;
}
function paperPage(p,lang) {
  const url=absolute(paperPath(p,lang));
  const title=(lang==='zh'?p.zhTitle:p.title)+' | '+(lang==='zh'?'张梓寒':'Zihan Zhang');
  const description=primary(p.summary,lang);
  const routes=Object.fromEntries(languages.map(l=>[l,paperPath(p,l)]));
  const articleID=absolute(paperPath(p,'both'))+'#work';
  const work={'@type':p.type==='thesis'?'Thesis':'ScholarlyArticle','@id':articleID,headline:lang==='zh'?p.zhTitle:p.title,alternativeHeadline:lang==='zh'?p.title:p.zhTitle,url: absolute(paperPath(p,'both')),description,author:p.authors.split(',').map(name=>({'@type':'Person',name:name.trim(),...(name.trim()==='Zihan Zhang'?{'@id':personID}:{})})),sameAs:p.url,inLanguage:lang==='both'?['en','zh-CN']:lang==='zh'?'zh-CN':'en',mainEntityOfPage:{'@id':url+'#page'}};
  if(p.doi)work.identifier={'@type':'PropertyValue',propertyID:'DOI',value:p.doi};
  if(p.type!=='thesis')work.isPartOf={'@type':p.type==='article'?'Periodical':'CreativeWorkSeries',name:p.venue};
  const schema={'@context':'https://schema.org','@graph':[person,{'@type':'WebPage','@id':url+'#page',url,name:title,description,mainEntity:{'@id':articleID},isPartOf:{'@id':websiteID}},work,{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:lang==='zh'?'张梓寒':'Zihan Zhang',item:absolute(prefix(lang))},{'@type':'ListItem',position:2,name:lang==='zh'?p.zhTitle:p.title,item:url}]}]};
  const meta=['<meta name="citation_title" content="'+esc(p.title)+'">',...p.authors.split(',').map(name=>'<meta name="citation_author" content="'+esc(name.trim())+'">'),'<meta name="citation_publication_date" content="'+p.year+'">','<meta name="citation_abstract_html_url" content="'+url+'">'];
  if(p.doi)meta.push('<meta name="citation_doi" content="'+esc(p.doi)+'">');
  if(p.type==='article')meta.push('<meta name="citation_journal_title" content="'+esc(p.venue)+'">');
  if(p.type==='conference')meta.push('<meta name="citation_conference_title" content="'+esc(p.venue)+'">');
  if(p.type==='thesis')meta.push('<meta name="DC.type" content="Thesis">');
  return '<!doctype html>\n<html lang="'+(lang==='zh'?'zh-CN':'en')+'" data-language="'+lang+'" data-route-language="'+lang+'" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+url+'">'+alternates(routes)+socialHead(title,description,url,lang,'article')+meta.join('\n')+fontHead+'<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=seo20261030"><link rel="stylesheet" href="/readability.css?v=seo20261030"><link rel="stylesheet" href="/polish.css?v=seo20261030"><link rel="stylesheet" href="/paper.css?v=seo20261030">'+boot(lang)+'<script type="application/ld+json">'+json(schema)+'</script><script src="/paper.js?v=seo20261030" defer></script></head><body class="paper-page"><a class="skip" href="#paper-main">Skip to content / 跳转正文</a><header class="header"><div class="header-inner"><a class="brand" href="'+prefix(lang)+'"><span class="brand-symbol" aria-hidden="true">z<span>·</span></span><span>Zihan Zhang<span class="brand-zh">张梓寒</span></span></a><div class="header-tools"><nav class="paper-language" aria-label="Language / 语言">'+langNav(lang,l=>paperPath(p,l))+'</nav><button id="paper-theme" class="paper-theme" type="button" aria-label="Switch color theme / 切换深浅主题">◐</button></div></div></header><main id="paper-main" class="paper-main page-width"><a class="paper-back" href="'+prefix(lang)+'#publications">← '+dual({en:'All publications',zh:'全部科研成果'})+'</a><article class="paper-article"><div class="paper-eyebrow"><span>'+p.year+'</span><span>'+esc(p.venue)+'</span></div><h1 class="paper-title">'+dual({en:p.title,zh:p.zhTitle})+'</h1><p class="paper-authors">'+authorHTML(p.authors)+'</p><div class="paper-topics">'+p.topics.map(id=>'<span>'+dual(topic(id))+'</span>').join('')+'</div><section class="paper-section"><h2>'+dual({en:'Research overview',zh:'研究介绍'})+'</h2><div class="paper-summary">'+dual(p.summary)+'</div></section><section class="paper-section"><h2>'+dual({en:'Publication details',zh:'发表信息'})+'</h2><dl class="paper-facts"><div><dt>'+dual({en:'Venue',zh:'期刊／会议'})+'</dt><dd>'+esc(p.venue)+'</dd></div><div><dt>'+dual({en:'Year',zh:'年份'})+'</dt><dd>'+p.year+'</dd></div>'+(p.doi?'<div><dt>DOI</dt><dd><a href="'+esc(p.type==='thesis'?p.url:'https://doi.org/'+p.doi)+'">'+esc(p.doi)+'</a></dd></div>':'')+'<div><dt>'+dual({en:'Publication type',zh:'成果类型'})+'</dt><dd>'+dual(p.type==='thesis'?{en:'Master’s thesis',zh:'硕士学位论文'}:p.type==='conference'?{en:'Conference paper',zh:'会议论文'}:{en:'Journal article',zh:'期刊论文'})+'</dd></div></dl><div class="paper-links">'+officialLinks(p,true)+(p.codeUrl?'<a class="button secondary" href="'+esc(p.codeUrl)+'" target="_blank" rel="noopener">'+dual({en:'Code',zh:'代码'})+' '+arrow+'</a>':'')+'</div></section><section class="paper-section"><div class="paper-cite-heading"><h2>'+dual({en:'Citation',zh:'引用'})+'</h2><button class="paper-copy" type="button" data-copy="paper-bibtex">'+dual({en:'Copy BibTeX',zh:'复制引用'})+'</button></div><pre class="paper-bibtex" id="paper-bibtex">'+esc(p.bibtex)+'</pre></section><div class="paper-share-row"><button class="paper-copy" type="button" data-copy-link>'+dual({en:'Copy page link',zh:'复制本页链接'})+'</button><a href="'+prefix(lang)+'#contact">'+dual({en:'Contact Zihan Zhang',zh:'联系张梓寒'})+' ↗</a></div></article></main><footer class="paper-footer page-width"><span>© 2026 Zihan Zhang · 张梓寒</span><a href="'+prefix(lang)+'">'+dual({en:'Academic homepage',zh:'个人学术主页'})+' ↗</a></footer><div class="toast" id="paper-toast" role="status" aria-live="polite"></div></body></html>\n';
}
for (const lang of languages) {
  const homePath=prefix(lang);
  await write(homePath==='/'?'index.html':homePath.slice(1)+'index.html',homepage(lang));
  outputPaths.push(homePath);
  for (const p of D.publications) {
    const route=paperPath(p,lang);
    await write(route.slice(1)+'index.html',paperPage(p,lang));
    outputPaths.push(route);
  }
}
await write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+outputPaths.map(route=>'  <url><loc>'+esc(absolute(route))+'</loc><lastmod>'+(['/','/en/','/zh/'].includes(route)?homeLastmod:lastmod)+'</lastmod></url>').join('\n')+'\n</urlset>\n');
await write('robots.txt','User-agent: *\nAllow: /\n\nSitemap: '+BASE+'sitemap.xml\n');
console.log(JSON.stringify({output:outputRoot,pages:outputPaths.length,languages,publications:D.publications.length,lastmod}));
