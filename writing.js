// The article list is ordinary HTML; this module adds its dialog and title filter.
const writingDialog = document.querySelector('#writing-dialog');
const writingTrigger = document.querySelector('#open-writing');

if (writingDialog && writingTrigger) {
  const closeButton = writingDialog.querySelector('[data-writing-close]');
  const search = writingDialog.querySelector('[data-writing-search]');
  const count = writingDialog.querySelector('[data-writing-count]');
  const empty = writingDialog.querySelector('[data-writing-empty]');
  const scroller = writingDialog.querySelector('.writing-dialog-scroll');
  const groups = [...writingDialog.querySelectorAll('.writing-collection')];
  const rows = [...writingDialog.querySelectorAll('.writing-article')];
  let savedOverflow = '';
  let ownsScrollLock = false;
  let returnFocus = null;

  const language = () => document.documentElement.dataset.language || 'both';
  const updateLanguage = () => {
    const lang = language();
    writingDialog.setAttribute('aria-labelledby', lang === 'zh' ? 'writing-title-zh' : lang === 'en' ? 'writing-title-en' : 'writing-title-en writing-title-zh');
    if (search) search.placeholder = lang === 'zh' ? '输入标题关键词' : lang === 'en' ? 'Search article titles' : 'Search titles / 搜索文章标题';
  };
  const filterArticles = () => {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    for (const row of rows) {
      const match = !query || row.querySelector('.writing-article-title').textContent.toLocaleLowerCase().includes(query);
      row.hidden = !match;
      if (match) visible++;
    }
    for (const group of groups) group.hidden = ![...group.querySelectorAll('.writing-article')].some(row => !row.hidden);
    if (count) count.textContent = String(visible).padStart(2, '0');
    if (empty) empty.hidden = visible > 0;
  };
  const finishClose = () => {
    if (ownsScrollLock) {
      document.body.style.overflow = savedOverflow;
      ownsScrollLock = false;
    }
    writingTrigger.setAttribute('aria-expanded', 'false');
    const target = returnFocus;
    returnFocus = null;
    if (document.visibilityState !== 'hidden' && target?.isConnected) target.focus({preventScroll: true});
  };
  const open = () => {
    if (writingDialog.open || document.querySelector('dialog[open]')) return;
    updateLanguage();
    if (search) search.value = '';
    filterArticles();
    returnFocus = document.activeElement;
    writingDialog.showModal();
    savedOverflow = document.body.style.overflow;
    ownsScrollLock = true;
    document.body.style.overflow = 'hidden';
    writingTrigger.setAttribute('aria-expanded', 'true');
    if (scroller) scroller.scrollTop = 0;
    writingDialog.scrollTop = 0;
    closeButton?.focus({preventScroll: true});
  };

  writingTrigger.disabled = false;
  writingTrigger.addEventListener('click', open);
  closeButton?.addEventListener('click', () => writingDialog.close());
  writingDialog.addEventListener('close', finishClose);
  writingDialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault();
      writingDialog.close();
    }
  });
  writingDialog.addEventListener('click', event => {
    if (event.target !== writingDialog) return;
    const rect = writingDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) writingDialog.close();
  });
  search?.addEventListener('input', filterArticles);
  document.addEventListener('zz:language', updateLanguage);
  window.addEventListener('pagehide', () => {
    if (writingDialog.open) writingDialog.close();
    finishClose();
  });
  updateLanguage();
}
