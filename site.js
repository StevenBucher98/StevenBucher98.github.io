// Shared navigation, theme, and homepage content.
(function () {
  const themeKey = 'steven-bucher-theme';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.querySelector('.theme-toggle');
    if (button) {
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      button.textContent = theme === 'dark' ? '☀' : '◐';
    }
  }

  function getInitialTheme() {
    const storedTheme = localStorage.getItem(themeKey);
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function createHeader() {
    const header = document.getElementById('site-header') || document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <div class="nav shell">
        <a class="brand" href="index.html"><span class="brand-mark">SB</span> / Steven Bucher</a>
        <nav class="nav-links" aria-label="Primary navigation">
          <a href="blog.html">Blog</a>
          <a href="videos.html">Videos</a>
          <a href="resume.html">Resume</a>
          <a href="contact.html">Contact</a>
        </nav>
        <button class="theme-toggle" type="button" title="Toggle color theme"></button>
      </div>
    `;
    if (!document.getElementById('site-header')) document.body.insertBefore(header, document.body.firstChild);

    try {
      const links = header.querySelectorAll('nav a');
      const path = location.pathname.split('/').pop() || 'index.html';
      links.forEach(a => {
        const rawHref = a.getAttribute('href') || '';
        const hrefBase = rawHref.split('#')[0] || 'index.html';
        const linkFile = hrefBase.split('/').pop();
        if (linkFile === path) {
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
        }
      });
    } catch (error) {
      console.warn('Unable to highlight the current page.', error);
    }

    const toggle = header.querySelector('.theme-toggle');
    toggle.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(themeKey, theme);
      applyTheme(theme);
    });
  }

  function createFooter() {
    if (document.querySelector('.site-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="footer-inner shell">
        <p>© <span data-current-year></span> Steven Bucher. Views are my own.</p>
        <div class="footer-links">
          <a href="https://www.linkedin.com/in/stevenabucher/" target="_blank" rel="noopener">LinkedIn</a>
          <a href="https://github.com/StevenBucher98" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
    footer.querySelector('[data-current-year]').textContent = new Date().getFullYear();
  }

  function formatDate(iso) {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.valueOf())
      ? iso
      : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function loadHomepageContent() {
    const postsEl = document.getElementById('postsList');
    if (postsEl) {
      try {
        const res = await fetch('data/posts.json');
        if (!res.ok) throw new Error(`Posts request failed with ${res.status}`);
        const posts = await res.json();
        const latest = posts.slice(0, 3);
        latest.forEach(p => {
          const el = document.createElement('article');
          el.className = 'post-card';
          const primaryTag = p.tags && p.tags[0];
          el.innerHTML = `
            <div class="post-meta">${formatDate(p.date)}${primaryTag ? `<span class="tag">${primaryTag}</span>` : ''}</div>
            <h3><a href="post.html?slug=${p.slug}">${p.title}</a></h3>
            <p>${p.summary || ''}</p>
          `;
          postsEl.appendChild(el);
        });
      } catch (error) {
        console.error('Failed to load homepage posts.', error);
        postsEl.innerHTML = '<p class="muted">Posts are unavailable right now.</p>';
      }
    }

    const featuredVideo = document.getElementById('featuredVideo');
    if (featuredVideo) {
      try {
        const res = await fetch('data/presentations.json');
        if (!res.ok) throw new Error(`Videos request failed with ${res.status}`);
        const videos = await res.json();
        const video = [...videos].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (!video) return;
        featuredVideo.innerHTML = `
          <a class="featured-video-media" href="${video.url}" target="_blank" rel="noopener" aria-label="Watch ${video.title}">
            <img src="${video.thumbnail}" alt="">
            <span class="play-icon" aria-hidden="true">▶</span>
          </a>
          <div class="featured-video-copy">
            <div class="eyebrow">${formatDate(video.date)}</div>
            <h3>${video.title}</h3>
            <p>${video.description}</p>
          </div>
        `;
      } catch (error) {
        console.error('Failed to load the featured video.', error);
        featuredVideo.innerHTML = '<p class="muted">The featured video is unavailable right now.</p>';
      }
    }
  }

  function init() {
    createHeader();
    createFooter();
    applyTheme(getInitialTheme());
    loadHomepageContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
