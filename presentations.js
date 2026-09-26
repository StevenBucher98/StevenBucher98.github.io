// Load the video archive.
(function () {
  let allPresentations = [];

  function formatDate(iso) {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.valueOf())
      ? iso
      : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function renderPresentation(presentation) {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.innerHTML = `
      <a class="video-thumbnail" href="${presentation.url}" target="_blank" rel="noopener" aria-label="Watch ${presentation.title}">
        <img src="${presentation.thumbnail}" alt="" loading="lazy">
        <span class="play-icon" aria-hidden="true">▶</span>
      </a>
      <div class="video-info">
        <time datetime="${presentation.date}">${formatDate(presentation.date)}</time>
        <h2><a href="${presentation.url}" target="_blank" rel="noopener">${presentation.title}</a></h2>
        <p>${presentation.description}</p>
      </div>
    `;
    return card;
  }

  function renderPresentations() {
    const container = document.getElementById('presentations-container');
    if (!container) return;
    const presentations = [...allPresentations].sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = '';

    if (presentations.length === 0) {
      container.innerHTML = '<p class="muted">No videos found.</p>';
      return;
    }

    presentations.forEach(p => container.appendChild(renderPresentation(p)));

    const countEl = document.getElementById('presentation-count');
    if (countEl) {
      countEl.textContent = `${presentations.length} recording${presentations.length !== 1 ? 's' : ''}, newest first`;
    }
  }

  async function loadPresentations() {
    try {
      const response = await fetch('data/presentations.json');
      if (!response.ok) throw new Error(`Videos request failed with ${response.status}`);
      allPresentations = await response.json();
      renderPresentations();
    } catch (error) {
      console.error('Failed to load videos.', error);
      const container = document.getElementById('presentations-container');
      if (container) {
        container.innerHTML = '<p class="muted">Videos are unavailable right now.</p>';
      }
    }
  }

  function init() {
    if (document.getElementById('presentations-container')) {
      loadPresentations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
