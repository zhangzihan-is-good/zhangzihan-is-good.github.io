'use strict';
(() => {
  const root = document.documentElement;
  const lang = root.dataset.routeLanguage || root.dataset.language || 'both';
  const label = (en,zh) => lang === 'zh' ? zh : lang === 'en' ? en : en + ' / ' + zh;
  const themeButton = document.getElementById('paper-theme');
  const toast = document.getElementById('paper-toast');
  let toastTimer;
  const timers = new WeakMap();
  const syncTheme = () => themeButton?.setAttribute('aria-pressed',String(root.dataset.theme === 'dark'));
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('zz-theme',root.dataset.theme); } catch (_) {}
    syncTheme();
  });
  function report(message) {
    if (!toast) return;
    clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'),2500);
  }
  async function copy(text,button) {
    let success = false;
    try { await navigator.clipboard.writeText(text); success = true; } catch (_) {
      const input = document.createElement('textarea'); input.value=text;
      input.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(input);input.select();
      try { success=document.execCommand('copy'); } catch (_) {}
      input.remove();button.focus({preventScroll:true});
    }
    if (!success) {report(label('Copy unavailable. Select the citation text.','无法自动复制，请手动选择引用文本。'));return;}
    if (!button.hasAttribute('data-original')) button.dataset.original=button.innerHTML;
    clearTimeout(timers.get(button));button.classList.add('is-copied');button.textContent='✓ '+label('Copied','已复制');
    timers.set(button,setTimeout(() => {button.innerHTML=button.dataset.original;button.classList.remove('is-copied');delete button.dataset.original;},1900));
    report(label('Copied to clipboard','已复制到剪贴板'));
  }
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => {
    const target=document.getElementById(button.dataset.copy);if(target)copy(target.textContent,button);
  }));
  document.querySelectorAll('[data-copy-link]').forEach(button => button.addEventListener('click', () => copy(document.querySelector('link[rel="canonical"]')?.href || location.href,button)));
  syncTheme();
})();
