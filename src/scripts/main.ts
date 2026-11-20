/* Hush landing — interactions */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- navigation ---------- */

function initNav() {
  const header = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!toggle || !panel) return;

  let lastFocus: HTMLElement | null = null;
  let closeTimer = 0;

  const focusables = () =>
    Array.from(
      panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex="0"]')
    ).filter((el) => el.offsetParent !== null);

  const open = () => {
    window.clearTimeout(closeTimer);
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', panel.dataset.close ?? 'Close menu');
    document.body.classList.add('menu-open');
    focusables()[0]?.focus();
  };

  const close = () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', panel.dataset.open ?? 'Open menu');
    document.body.classList.remove('menu-open');
    closeTimer = window.setTimeout(() => {
      panel.hidden = true;
    }, 220);
    lastFocus?.focus();
  };

  toggle.addEventListener('click', () => {
    if (panel.hidden) open();
    else close();
  });

  panel.querySelector('[data-menu-close]')?.addEventListener('click', close);
  panel.querySelectorAll('[data-menu-link]').forEach((link) => link.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (panel.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && !panel.hidden) close();
  });
}

/* ---------- interactive dictation demo ---------- */

function initDemo() {
  const stage = document.querySelector<HTMLElement>('[data-demo]');
  const hold = stage?.querySelector<HTMLButtonElement>('[data-hold]');
  const hud = stage?.querySelector<HTMLElement>('.js-hud');
  const typed = stage?.querySelector<HTMLElement>('.js-typed');
  const live = stage?.querySelector<HTMLElement>('[data-demo-live]');
  if (!stage || !hold || !hud || !typed) return;

  const fullText = stage.dataset.typed ?? '';
  const labels = {
    listen: stage.dataset.listen ?? 'Listening',
    think: stage.dataset.think ?? 'Transcribing',
    done: stage.dataset.done ?? 'Done',
    pasted: stage.dataset.pasted ?? 'Pasted at the cursor',
  };

  let holding = false;
  let interacting = false;
  let timers: number[] = [];
  let autoTimer = 0;

  const clearTimers = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
    window.clearTimeout(autoTimer);
  };

  const later = (fn: () => void, delay: number) => {
    timers.push(window.setTimeout(fn, delay));
  };

  const setState = (state: 'listening' | 'thinking' | 'done') => {
    hud.dataset.state = state;
    if (live) {
      live.textContent =
        state === 'listening' ? labels.listen : state === 'thinking' ? labels.think : labels.done;
    }
  };

  const reset = () => {
    clearTimers();
    holding = false;
    stage.classList.remove('is-running', 'is-pasted', 'has-text', 'is-hud-visible');
    typed.textContent = '';
    setState('listening');
  };

  const typeText = () => {
    const chars = Array.from(fullText);
    let index = 0;
    setState('thinking');

    const step = () => {
      if (index >= chars.length) {
        stage.classList.add('is-pasted', 'has-text');
        setState('done');
        if (live) live.textContent = labels.pasted;
        later(() => {
          stage.classList.remove('is-hud-visible');
          setState('listening');
        }, 900);
        return;
      }
      const char = chars[index++];
      typed.textContent += char;
      stage.classList.add('has-text');
      const pause = /[.!?—]/.test(char) ? 180 : char === ',' ? 90 : 24 + Math.random() * 24;
      later(step, pause);
    };

    later(step, 540);
  };

  const finish = () => {
    if (!holding) return;
    holding = false;
    stage.classList.remove('is-running');
    setState('thinking');
    later(typeText, 520);
  };

  const start = () => {
    if (holding) return;
    interacting = true;
    clearTimers();
    holding = true;
    stage.classList.add('is-running', 'is-hud-visible');
    stage.classList.remove('has-text', 'is-pasted');
    typed.textContent = '';
    setState('listening');
  };

  const runAuto = () => {
    if (interacting || document.hidden) return;
    if (reduceMotion.matches) {
      stage.classList.add('has-text', 'is-pasted');
      typed.textContent = fullText;
      setState('done');
      return;
    }
    autoTimer = window.setTimeout(() => {
      if (interacting) return;
      start();
      autoTimer = window.setTimeout(() => finish(), 1600);
    }, 1200);
  };

  if (reduceMotion.matches) {
    stage.classList.add('has-text', 'is-pasted');
    typed.textContent = fullText;
    setState('done');
  } else {
    typed.textContent = '';
    stage.classList.remove('has-text', 'is-pasted');
    setState('listening');
    runAuto();
  }

  hold.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    hold.setPointerCapture?.(event.pointerId);
    start();
  });
  hold.addEventListener('pointerup', finish);
  hold.addEventListener('pointercancel', finish);
  hold.addEventListener('pointerleave', finish);

  hold.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) return;
    event.preventDefault();
    start();
  });
  hold.addEventListener('keyup', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    finish();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && holding) reset();
  });
}

/* ---------- themes ---------- */

const THEMES = ['system', 'daylight', 'sand', 'graphite', 'midnight'] as const;

function initThemes() {
  const picker = document.querySelector<HTMLElement>('[data-theme-picker]');
  const shot = document.querySelector<HTMLElement>('[data-theme-shot]');
  if (!picker || !shot) return;

  const buttons = Array.from(picker.querySelectorAll<HTMLButtonElement>('[data-theme]'));
  const images = Array.from(shot.querySelectorAll<HTMLImageElement>('[data-theme-image]'));
  const name = shot.querySelector<HTMLElement>('[data-theme-name]');

  const apply = (theme: string, focus = false) => {
    if (!THEMES.includes(theme as (typeof THEMES)[number])) return;
    buttons.forEach((button) => {
      const active = button.dataset.theme === theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
      if (active && name) name.textContent = button.textContent?.trim() ?? '';
    });
    images.forEach((image) => {
      image.classList.toggle('is-active', image.dataset.themeImage === theme);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.theme ?? 'system'));
  });

  picker.addEventListener('keydown', (event) => {
    const current = buttons.findIndex((button) => button.getAttribute('aria-checked') === 'true');
    if (current === -1) return;
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    apply(buttons[next].dataset.theme ?? 'system', true);
  });
}

/* ---------- copy command ---------- */

function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    const label = button.querySelector('[data-copy-label]');
    const original = label?.textContent ?? button.textContent ?? '';
    const copied = button.dataset.copied ?? 'Copied';
    let timer = 0;

    button.addEventListener('click', async () => {
      const value = button.dataset.copy ?? '';
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const area = document.createElement('textarea');
        area.value = value;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.append(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      button.classList.add('is-copied');
      if (label) label.textContent = copied;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.classList.remove('is-copied');
        if (label) label.textContent = original;
      }, 2000);
    });
  });
}

/* ---------- FAQ ---------- */

function initFaq() {
  document.querySelectorAll<HTMLElement>('[data-faq]').forEach((root) => {
    root.querySelectorAll<HTMLButtonElement>('[data-faq-button]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest<HTMLElement>('.faq-item');
        if (!item) return;
        const open = item.classList.toggle('is-open');
        button.setAttribute('aria-expanded', String(open));
      });
    });
  });
}

initNav();
initDemo();
initThemes();
initCopy();
initFaq();
