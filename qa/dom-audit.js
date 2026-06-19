(() => {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const docW = document.documentElement.scrollWidth;

  const visible = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  const overflow = [...document.querySelectorAll('body *')]
    .filter(visible)
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.left < -1 || r.right > vw + 1)
    .map(({ el, r }) => ({
      tag: el.tagName,
      id: el.id || null,
      className: String(el.className || '').slice(0, 160),
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width)
    }));

  const suspiciousWhitespace = [...document.querySelectorAll('section, [data-qa-section]')]
    .filter(visible)
    .map(el => {
      const r = el.getBoundingClientRect();
      const children = [...el.children].filter(visible);
      const occupiedBottom = children.length
        ? Math.max(...children.map(c => c.getBoundingClientRect().bottom))
        : r.top;
      return {
        id: el.id || null,
        qa: el.dataset.qaSection || null,
        height: Math.round(r.height),
        unusedBottom: Math.round(r.bottom - occupiedBottom)
      };
    })
    .filter(x => x.height > vh * 0.8 && x.unusedBottom > vh * 0.25);

  const smallTargets = [...document.querySelectorAll('button,a,input,[role="button"],summary')]
    .filter(visible)
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width < 36 || r.height < 36)
    .map(({ el, r }) => ({
      label: (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 100),
      width: Math.round(r.width),
      height: Math.round(r.height)
    }));

  return {
    viewport: { width: vw, height: vh },
    documentWidth: docW,
    horizontalOverflow: docW > vw + 1,
    overflow,
    suspiciousWhitespace,
    smallTargets
  };
})()
