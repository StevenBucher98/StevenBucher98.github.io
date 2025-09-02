// site.js - injects a simple header and loads small homepage sections (projects/posts)
(function(){
  function createHeader(){
    const header = document.getElementById('site-header') || document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="nav">
        <a class="brand" href="/">Steven Bucher</a>
        <nav>
          <a href="/">Home</a>
          <a href="projects.html">Projects</a>
          <a href="blog.html">Blog</a>
          <a href="presentations.html">Presentations</a>
          <a href="about.html">About</a>
        </nav>
      </div>
    `;
    if (!document.getElementById('site-header')) document.body.insertBefore(header, document.body.firstChild);

    // highlight current location (handle anchors)
    try{
      const links = header.querySelectorAll('nav a');
      const path = location.pathname.split('/').pop() || 'index.html';
      links.forEach(a => {
        const rawHref = a.getAttribute('href') || '';
        const hrefBase = rawHref.split('#')[0] || '';
        // normalize
        let linkFile = hrefBase === '/' || hrefBase === '' ? 'index.html' : hrefBase.split('/').pop();
        if (linkFile === path) {
          a.classList.add('active');
        }
      });
    }catch(e){console.warn(e)}
  }

  function formatDate(iso){
    try{ const d = new Date(iso); return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); }catch(e){return iso}
  }

  async function loadFeatured(){
    // featured projects
    const projectsEl = document.getElementById('projectsGrid');
    if (projectsEl){
      try{
        const res = await fetch('data/projects.json');
        const projects = await res.json();
        const featured = projects.slice(0,6);
        featured.forEach(p => {
          const el = document.createElement('div'); el.className='card';
          el.innerHTML = `
            <div class="thumb">${p.image ? '<img src="'+p.image+'" alt="'+p.title+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">' : 'Preview'}</div>
            <h3>${p.title}</h3>
            <p>${p.summary || ''}</p>
            <a class="btn" href="${p.page || '#'}">View</a>
          `;
          projectsEl.appendChild(el);
        });
      }catch(e){ console.warn('No projects.json or failed to load', e); }
    }

    // latest posts
    const postsEl = document.getElementById('postsList');
    if (postsEl){
      try{
        const res = await fetch('data/posts.json');
        const posts = await res.json();
        const latest = posts.slice(0,6);
        latest.forEach(p => {
          const el = document.createElement('div'); el.className='post-card';
          el.innerHTML = `
            <h3><a href="post.html?slug=${p.slug}">${p.title}</a></h3>
            <time>${formatDate(p.date)}</time>
            <p class="muted">${p.summary || ''}</p>
          `;
          postsEl.appendChild(el);
        });
      }catch(e){ console.warn('No posts.json or failed to load', e); }
    }
  }

  function init(){
    createHeader();
    loadFeatured();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
