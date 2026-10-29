(() => {
  const root = document.documentElement;
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const themeToggle = document.querySelector('.theme-toggle');
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  const brandLogo = document.querySelector('.brand img');
  const heroLogo = document.querySelector('.hero-logo');
  const particlesContainer = document.getElementById('particles-js');

  if (!document.body.classList.contains('dashboard-page')) {
    const whatsappButton = document.createElement('a');
    whatsappButton.className = 'whatsapp-float';
    whatsappButton.href = 'https://wa.me/971558231400?text=Hello%20Sparks%20Advertising%20Agency';
    whatsappButton.target = '_blank';
    whatsappButton.rel = 'noopener noreferrer';
    whatsappButton.setAttribute('aria-label', 'Chat with Sparks Advertising Agency on WhatsApp');
    whatsappButton.title = 'Chat on WhatsApp';
    whatsappButton.innerHTML = '<svg viewBox="0 0 26 26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.52 3.48A11.82 11.82 0 0 0 3.54 19.83L2 25.5l5.8-1.52a11.83 11.83 0 0 0 5.66 1.44h.01A11.82 11.82 0 0 0 20.52 3.48ZM13.47 23.4h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.44.9.92-3.35-.23-.37a9.83 9.83 0 1 1 8.13 4.4Zm5.4-7.37c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.08-.8.38-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg>';
    document.body.append(whatsappButton);
  }

  if (particlesContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const particlesScript = document.createElement('script');
    particlesScript.src = '/assets/particles.min.js';
    particlesScript.onload = () => {
      if (typeof window.particlesJS !== 'function') return;
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 84, density: { enable: true, value_area: 750 } },
          color: { value: ['#f7941d', '#ffb347', '#d87912'] },
          shape: { type: 'circle' },
          opacity: { value: 0.52, random: true },
          size: { value: 3.8, random: true },
          line_linked: { enable: true, distance: 155, color: '#f7941d', opacity: 0.26, width: 1.2 },
          move: { enable: true, speed: 1.2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
        },
        retina_detect: true
      });
    };
    particlesScript.onerror = () => console.error('Could not load the hero particle animation.');
    document.head.append(particlesScript);
  }

  function updateThemeControl() {
    const dark = root.dataset.theme === 'dark';
    if (brandLogo) brandLogo.src = dark ? (brandLogo.dataset.logoDark || '/assets/logo-dark.png') : (brandLogo.dataset.logoLight || '/assets/logo-light.png');
    if (heroLogo) heroLogo.src = heroLogo.dataset.logoDark || '/assets/logo-dark.png';
    if (!themeToggle) return;
    themeToggle.innerHTML = dark ? '<span aria-hidden="true">☼</span>' : '<span aria-hidden="true">◐</span>';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  }

  updateThemeControl();
  themeToggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('sparks-theme', next); } catch {}
    updateThemeControl();
  });

  menuToggle?.addEventListener('click', () => {
    const open = navigation?.classList.toggle('is-open') || false;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-confirm]') : null;
    if (target && !confirm(target.dataset.confirm)) event.preventDefault();
  });

  async function uploadImage(file) {
    const form = new FormData();
    form.append('image', file);
    const response = await fetch('/admin/uploads', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken || '' },
      body: form
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The image could not be uploaded.');
    return result.path;
  }

  document.querySelectorAll('[data-image-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const wrapper = input.closest('[data-upload-for]');
      const form = input.closest('form');
      const field = wrapper?.dataset.uploadFor;
      const target = form?.elements.namedItem(field);
      const status = wrapper?.querySelector('[data-upload-status]');
      const previews = wrapper?.querySelector('.upload-previews');
      if (!wrapper || !form || !field || !target || !status || !previews || !input.files?.length) return;
      input.disabled = true;
      status.textContent = 'Uploading image…';
      try {
        const uploaded = [];
        for (const file of Array.from(input.files).slice(0, 12)) uploaded.push(await uploadImage(file));
        if (field === 'gallery') {
          target.value = [...new Set(`${target.value}\n${uploaded.join('\n')}`.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))].join('\n');
        } else {
          target.value = uploaded[0];
        }
        for (const source of uploaded) {
          const image = document.createElement('img');
          image.src = source;
          image.alt = 'Uploaded image preview';
          image.loading = 'lazy';
          previews.append(image);
        }
        status.textContent = `${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded. Save the form to publish.`;
      } catch (error) {
        status.textContent = error.message;
      } finally {
        input.disabled = false;
        input.value = '';
      }
    });
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const serviceRotator = document.querySelector('[data-service-rotator]');
  const serviceSlides = serviceRotator ? Array.from(serviceRotator.querySelectorAll('[data-service-slide]')) : [];
  const serviceCategory = serviceRotator?.querySelector('[data-service-category]');
  const serviceTitle = serviceRotator?.querySelector('[data-service-title]');
  const serviceSummary = serviceRotator?.querySelector('[data-service-summary]');
  if (!reducedMotion && !csrfToken && serviceSlides.length > 1 && serviceCategory && serviceTitle && serviceSummary) {
    let activeSlide = 0;
    let titleText = serviceSlides[activeSlide].dataset.title || '';
    let characterIndex = 0;
    let phase = 'typing';
    let animationTimer;
    serviceTitle.setAttribute('aria-label', titleText);
    serviceTitle.setAttribute('aria-live', 'off');
    serviceTitle.classList.add('is-typing');
    serviceTitle.textContent = '';

    const scheduleTyping = (delay) => {
      animationTimer = window.setTimeout(() => {
        animationTimer = undefined;
        typeNextHeadline();
      }, delay);
    };

    const typeNextHeadline = () => {
      if (document.hidden || document.body.classList.contains('site-editing') || serviceTitle.hasAttribute('data-site-editor-static')) return;

      if (phase === 'typing') {
        if (characterIndex < titleText.length) {
          characterIndex += 1;
          serviceTitle.textContent = titleText.slice(0, characterIndex);
          scheduleTyping(85);
          return;
        }
        phase = 'holding';
        scheduleTyping(1800);
        return;
      }

      if (phase === 'holding') {
        phase = 'deleting';
        scheduleTyping(45);
        return;
      }

      if (characterIndex > 0) {
        characterIndex -= 1;
        serviceTitle.textContent = titleText.slice(0, characterIndex);
        scheduleTyping(45);
        return;
      }

      activeSlide = (activeSlide + 1) % serviceSlides.length;
      const slide = serviceSlides[activeSlide];
      serviceCategory.textContent = slide.dataset.category || '';
      serviceSummary.textContent = slide.dataset.summary || '';
      titleText = slide.dataset.title || '';
      serviceTitle.setAttribute('aria-label', titleText);
      phase = 'typing';
      scheduleTyping(250);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.clearTimeout(animationTimer);
        animationTimer = undefined;
      } else if (!animationTimer) {
        typeNextHeadline();
      }
    });
    if (!document.hidden) typeNextHeadline();
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  }

  const editorLaunch = document.querySelector('.website-editor-launch');
  const mainContent = document.querySelector('main');
  const pagePath = location.pathname;
  const styleChoices = {
    color: ['orange', 'light', 'dark'],
    background: ['paper', 'charcoal', 'orange'],
    size: ['small', 'medium', 'large', 'xlarge'],
    spacing: ['compact', 'normal', 'spacious'],
    align: ['left', 'center', 'right'],
    width: ['narrow', 'wide', 'full'],
    font: ['body', 'serif', 'display'],
    corners: ['square', 'soft', 'round']
  };
  const pageEdits = new Map();
  let editorToolbar;
  let selectedElement;
  let editorClickHandler;
  let editorFocusHandler;

  function selectorPath(element) {
    if (element.dataset.siteEditorKey) return element.dataset.siteEditorKey;
    const rootElement = element.closest('main, header, footer');
    if (!rootElement) return '';
    const parts = [];
    let current = element;
    while (current && current !== rootElement) {
      const parent = current.parentElement;
      if (!parent) return '';
      const sameTag = Array.from(parent.children).filter((child) => child.localName === current.localName);
      parts.unshift(`${current.localName}:nth-of-type(${sameTag.indexOf(current) + 1})`);
      current = parent;
    }
    return current === rootElement ? `${rootElement.localName} > ${parts.join(' > ')}` : '';
  }

  function editRecord(element) {
    const selector = selectorPath(element);
    if (!selector) return null;
    if (!pageEdits.has(selector)) pageEdits.set(selector, { selector, styles: {} });
    return pageEdits.get(selector);
  }

  function applyStyles(element, styles = {}) {
    for (const [property, values] of Object.entries(styleChoices)) {
      for (const value of values) element.classList.remove(`site-edit-style-${property}-${value}`);
      if (values.includes(styles[property])) element.classList.add(`site-edit-style-${property}-${styles[property]}`);
    }
  }

  function applyPageEdits(edits) {
    for (const edit of edits) {
      if (!edit || typeof edit.selector !== 'string') continue;
      let element;
      try { element = document.body.querySelector(edit.selector); } catch { continue; }
      if (!element) continue;
      if (typeof edit.html === 'string' && !element.matches('img, input, textarea, select')) {
        element.innerHTML = edit.html;
        if (element.matches('.hero-service-title')) element.setAttribute('data-site-editor-static', 'true');
      }
      if (typeof edit.image === 'string' && element.matches('img')) element.src = edit.image;
      applyStyles(element, edit.styles);
      pageEdits.set(edit.selector, { selector: edit.selector, ...(typeof edit.html === 'string' ? { html: edit.html } : {}), ...(typeof edit.image === 'string' ? { image: edit.image } : {}), styles: edit.styles || {}, ...(Number.isInteger(edit.order) ? { order: edit.order } : {}) });
    }
    const orderedGroups = new Map();
    for (const edit of edits) {
      if (!Number.isInteger(edit.order)) continue;
      let element;
      try { element = document.body.querySelector(edit.selector); } catch { continue; }
      if (!element || element.localName !== 'section' || !element.parentElement) continue;
      const group = orderedGroups.get(element.parentElement) || [];
      group.push({ element, order: edit.order });
      orderedGroups.set(element.parentElement, group);
    }
    for (const [parent, group] of orderedGroups) {
      const sections = Array.from(parent.children).filter((child) => child.localName === 'section');
      if (sections.length !== group.length) continue;
      const marker = document.createComment('website-editor-order');
      parent.insertBefore(marker, sections[0]);
      for (const section of sections) section.remove();
      group.sort((first, second) => first.order - second.order).forEach(({ element }) => parent.insertBefore(element, marker));
      marker.remove();
    }
  }

  function makeEditorToolbar() {
    const toolbar = document.createElement('aside');
    toolbar.className = 'site-editor-toolbar';
    toolbar.setAttribute('aria-label', 'Website visual editor');
    toolbar.innerHTML = `<div class="site-editor-heading"><strong>Edit Website</strong><span data-editor-status>Select an item on the page to edit it.</span></div><div class="site-editor-controls"><button type="button" data-editor-action="text">Edit text</button><label>Image path<input data-editor-image placeholder="/assets/image.png"></label><button type="button" data-editor-action="image">Set image</button><label>Upload image<input type="file" accept="image/png,image/jpeg,image/webp" data-editor-upload></label>${Object.entries(styleChoices).map(([property, values]) => `<label>${property[0].toUpperCase()}${property.slice(1)}<select data-editor-style="${property}"><option value="default">Default</option>${values.map((value) => `<option value="${value}">${value}</option>`).join('')}</select></label>`).join('')}<button type="button" data-editor-action="up">Move section up</button><button type="button" data-editor-action="down">Move section down</button><button type="button" data-editor-action="save" class="site-editor-save">Save changes</button><button type="button" data-editor-action="exit">Exit editor</button></div>`;
    document.body.append(toolbar);
    return toolbar;
  }

  function setEditorStatus(message) {
    const status = editorToolbar?.querySelector('[data-editor-status]');
    if (status) status.textContent = message;
  }

  function selectForEditing(element) {
    selectedElement?.removeAttribute('data-editor-selected');
    selectedElement = element;
    selectedElement.setAttribute('data-editor-selected', 'true');
    const record = editRecord(selectedElement);
    if (!record) return;
    editorToolbar.querySelectorAll('[data-editor-style]').forEach((control) => {
      control.value = record.styles?.[control.dataset.editorStyle] || 'default';
    });
    const imageInput = editorToolbar.querySelector('[data-editor-image]');
    imageInput.value = record.image || (selectedElement.matches('img') ? selectedElement.getAttribute('src') || '' : '');
    setEditorStatus(`Selected ${selectedElement.localName}. Edit text, image, or appearance.`);
  }

  function applySavedOrder() {
    const sections = Array.from(mainContent.querySelectorAll('section'));
    const parents = new Map();
    sections.forEach((section) => {
      const record = pageEdits.get(selectorPath(section));
      if (Number.isInteger(record?.order)) {
        const group = parents.get(section.parentElement) || [];
        group.push({ element: section, order: record.order });
        parents.set(section.parentElement, group);
      }
    });
    for (const [parent, group] of parents) {
      const siblings = Array.from(parent.children).filter((child) => child.localName === 'section');
      if (siblings.length !== group.length) continue;
      const marker = document.createComment('website-editor-order');
      parent.insertBefore(marker, siblings[0]);
      siblings.forEach((section) => section.remove());
      group.sort((first, second) => first.order - second.order).forEach(({ element }) => parent.insertBefore(element, marker));
      marker.remove();
    }
  }

  function enableWebsiteEditor() {
    if (!editorLaunch || !mainContent || !csrfToken || editorToolbar) return;
    document.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, li, img, section').forEach((element) => {
      element.dataset.siteEditorKey = selectorPath(element);
    });
    document.body.classList.add('site-editing');
    const serviceTitleForEditing = mainContent.querySelector('.hero-service-title');
    if (serviceTitleForEditing && !pageEdits.get(selectorPath(serviceTitleForEditing))?.html) {
      serviceTitleForEditing.textContent = serviceTitleForEditing.getAttribute('aria-label') || serviceTitleForEditing.textContent;
    }
    editorToolbar = makeEditorToolbar();
    editorLaunch.hidden = true;
    editorClickHandler = (event) => {
      if (event.target instanceof Element && event.target.closest('.site-editor-toolbar, form, input, textarea, select, button')) return;
      if (event.target instanceof Element && event.target.closest('.main-nav a, .footer-bottom a')) return;
      const target = event.target instanceof Element ? event.target.closest('h1, h2, h3, h4, h5, h6, p, a, li, img, section') : null;
      if (!target || !document.body.contains(target) || target.closest('.site-editor-toolbar')) return;
      event.preventDefault();
      selectForEditing(target);
    };
    document.body.addEventListener('click', editorClickHandler, true);

    editorToolbar.addEventListener('click', async (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-editor-action]') : null;
      if (!button) return;
      const action = button.dataset.editorAction;
      if (action === 'exit') {
        selectedElement?.removeAttribute('contenteditable');
        selectedElement?.removeAttribute('data-editor-selected');
        document.body.querySelectorAll('[data-site-editor-key]').forEach((element) => delete element.dataset.siteEditorKey);
        document.body.classList.remove('site-editing');
        document.body.removeEventListener('click', editorClickHandler, true);
        document.body.removeEventListener('focusout', editorFocusHandler);
        editorToolbar.remove();
        editorToolbar = undefined;
        editorClickHandler = undefined;
        editorFocusHandler = undefined;
        editorLaunch.hidden = false;
        return;
      }
      if (action === 'text') {
        if (!selectedElement || selectedElement.matches('img, input, textarea, select, section')) return setEditorStatus('Select a heading, paragraph, or link to edit its text.');
        selectedElement.contentEditable = selectedElement.isContentEditable ? 'false' : 'true';
        if (selectedElement.isContentEditable) {
          selectedElement.focus();
          setEditorStatus('Edit the text on the page, then save your changes.');
        } else {
          const record = editRecord(selectedElement);
          record.html = selectedElement.innerHTML;
          setEditorStatus('Text updated. Save to publish your changes.');
        }
        return;
      }
      if (action === 'image') {
        if (!selectedElement?.matches('img')) return setEditorStatus('Select an image first.');
        const source = editorToolbar.querySelector('[data-editor-image]').value.trim();
        if (!/^\/assets\/[A-Za-z0-9][A-Za-z0-9._/-]{0,180}$/.test(source) || source.split('/').includes('..')) return setEditorStatus('Use a valid image path from /assets/.');
        selectedElement.src = source;
        editRecord(selectedElement).image = source;
        setEditorStatus('Image updated. Save to publish your changes.');
        return;
      }
      if (action === 'up' || action === 'down') {
        if (!selectedElement || selectedElement.localName !== 'section') return setEditorStatus('Select a page section to move it.');
        const parent = selectedElement.parentElement;
        const siblings = Array.from(parent.children).filter((child) => child.localName === 'section');
        const index = siblings.indexOf(selectedElement);
        const nextIndex = index + (action === 'up' ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= siblings.length) return;
        const neighbor = siblings[nextIndex];
        if (action === 'up') parent.insertBefore(selectedElement, neighbor);
        else parent.insertBefore(neighbor, selectedElement);
        Array.from(parent.children).filter((child) => child.localName === 'section').forEach((section, order) => {
          editRecord(section).order = order;
        });
        setEditorStatus('Section moved. Save to publish the new order.');
        return;
      }
      if (action === 'save') {
        const saveButton = button;
        saveButton.disabled = true;
        setEditorStatus('Saving your website changes…');
        try {
          const response = await fetch('/admin/site-editor/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({ _csrf: csrfToken, path: pagePath, edits: JSON.stringify(Array.from(pageEdits.values())) })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Website changes could not be saved.');
          setEditorStatus('Changes saved and published.');
        } catch (error) {
          setEditorStatus(error.message);
        } finally {
          saveButton.disabled = false;
        }
      }
    });

    editorToolbar.querySelector('[data-editor-upload]')?.addEventListener('change', async (event) => {
      const input = event.currentTarget;
      const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
      if (!file) return;
      if (!selectedElement?.matches('img')) {
        setEditorStatus('Select an image on the page before uploading a replacement.');
        input.value = '';
        return;
      }
      input.disabled = true;
      try {
        const source = await uploadImage(file);
        selectedElement.src = source;
        editRecord(selectedElement).image = source;
        editorToolbar.querySelector('[data-editor-image]').value = source;
        setEditorStatus('Image uploaded. Save to publish your changes.');
      } catch (error) {
        setEditorStatus(error.message);
      } finally {
        input.disabled = false;
        input.value = '';
      }
    });

    editorFocusHandler = (event) => {
      if (event.target === selectedElement && selectedElement?.isContentEditable) {
        const record = editRecord(selectedElement);
        record.html = selectedElement.innerHTML;
        selectedElement.contentEditable = 'false';
        setEditorStatus('Text updated. Save to publish your changes.');
      }
    };
    document.body.addEventListener('focusout', editorFocusHandler);

    editorToolbar.querySelectorAll('[data-editor-style]').forEach((control) => {
      control.addEventListener('change', () => {
        if (!selectedElement) return setEditorStatus('Select an item before changing its appearance.');
        const record = editRecord(selectedElement);
        record.styles ||= {};
        const property = control.dataset.editorStyle;
        if (control.value === 'default') delete record.styles[property];
        else record.styles[property] = control.value;
        applyStyles(selectedElement, record.styles);
        setEditorStatus('Appearance updated. Save to publish your changes.');
      });
    });
  }

  if (mainContent) {
    fetch(`/site-edits?path=${encodeURIComponent(pagePath)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Saved website changes could not be loaded.');
        return response.json();
      })
      .then((edits) => {
        if (!Array.isArray(edits)) throw new Error('Saved website changes have an invalid format.');
        applyPageEdits(edits);
        if (editorLaunch) {
          document.body.querySelectorAll('h1, h2, h3, p, a, img, section').forEach((element) => {
            element.dataset.siteEditorKey = selectorPath(element);
          });
        }
        applySavedOrder();
        if (editorLaunch) editorLaunch.addEventListener('click', enableWebsiteEditor);
        if (editorLaunch && new URLSearchParams(location.search).get('edit') === '1') enableWebsiteEditor();
      })
      .catch((error) => console.error(error));
  }
})();