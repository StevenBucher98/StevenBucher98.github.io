// presentations.js - loads and displays presentations with filtering and sorting
(function(){
  let allPresentations = [];
  let currentSort = 'newest'; // 'newest' or 'oldest'

  function formatDate(iso){
    try{ 
      const d = new Date(iso); 
      return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); 
    }catch(e){
      return iso;
    }
  }

  function sortPresentations(presentations, sortBy){
    const sorted = [...presentations];
    if (sortBy === 'newest') {
      // Sort by date (descending - newest first)
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      // Sort by date (ascending - oldest first)
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return sorted;
  }



  function renderPresentation(presentation){
    const card = document.createElement('div');
    card.className = 'presentation-card card';
    card.dataset.type = presentation.type;
    card.dataset.date = presentation.date;

    if (presentation.type === 'youtube') {
      // Render YouTube embed
      card.innerHTML = `
        <div class="presentation-embed">
          <iframe src="${presentation.embedUrl}" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen>
          </iframe>
        </div>
        <div class="presentation-info">
          <h3>${presentation.title}</h3>
          <time class="muted">${formatDate(presentation.date)}</time>
          <p>${presentation.description}</p>
        </div>
      `;
    } else if (presentation.type === 'ignite') {
      // Render Ignite presentation with thumbnail
      card.innerHTML = `
        <a href="${presentation.url}" target="_blank" rel="noopener" class="presentation-link">
          <div class="presentation-thumbnail">
            <img src="${presentation.thumbnail}" alt="${presentation.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22225%22%3E%3Crect width=%22400%22 height=%22225%22 fill=%22%23e9f6ef%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%232F855A%22%3EIgnite Session%3C/text%3E%3C/svg%3E'">
            <div class="presentation-overlay">
              <span class="ignite-badge">Microsoft Ignite</span>
            </div>
          </div>
        </a>
        <div class="presentation-info">
          <h3><a href="${presentation.url}" target="_blank" rel="noopener">${presentation.title}</a></h3>
          <time class="muted">${formatDate(presentation.date)}</time>
          <p>${presentation.description}</p>
          <a href="${presentation.url}" target="_blank" rel="noopener" class="btn outline">View Session</a>
        </div>
      `;
    }

    return card;
  }

  function renderPresentations(){
    const container = document.getElementById('presentations-container');
    if (!container) return;

    // Sort presentations
    let presentations = sortPresentations(allPresentations, currentSort);

    // Clear container
    container.innerHTML = '';

    // Render each presentation
    if (presentations.length === 0) {
      container.innerHTML = '<p class="muted">No presentations found matching your criteria.</p>';
      return;
    }

    presentations.forEach(p => {
      const card = renderPresentation(p);
      container.appendChild(card);
    });

    // Update count
    const countEl = document.getElementById('presentation-count');
    if (countEl) {
      countEl.textContent = `Showing ${presentations.length} presentation${presentations.length !== 1 ? 's' : ''}`;
    }
  }

  function setupFilters(){
    // Sort buttons
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentSort = btn.dataset.sort;
        sortButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPresentations();
      });
    });
  }

  async function loadPresentations(){
    try {
      const response = await fetch('data/presentations.json');
      allPresentations = await response.json();
      renderPresentations();
      setupFilters();
    } catch (error) {
      console.error('Failed to load presentations:', error);
      const container = document.getElementById('presentations-container');
      if (container) {
        container.innerHTML = '<p class="muted">Failed to load presentations. Please try again later.</p>';
      }
    }
  }

  function init(){
    // Only run on presentations page
    if (document.getElementById('presentations-container')) {
      loadPresentations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
