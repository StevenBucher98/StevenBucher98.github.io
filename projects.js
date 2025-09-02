// projects.js - render a grid of projects from data/projects.json
(async function(){
  const container = document.getElementById('projectsList');
  if (!container) return;
  try{
    const res = await fetch('data/projects.json');
    const projects = await res.json();
    projects.forEach(p => {
      const el = document.createElement('div'); el.className='card';
      el.innerHTML = `
        <div class="thumb">${p.image ? '<img src="'+p.image+'" alt="'+p.title+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">' : p.title.charAt(0)}</div>
        <h3>${p.title}</h3>
        <p>${p.summary || ''}</p>
        <div style="display:flex;gap:8px;">
          <a class="btn" href="${p.page || '#'}">Open</a>
          <a class="btn outline" href="project.html?slug=${p.slug}">Details</a>
        </div>
      `;
      container.appendChild(el);
    });
  }catch(e){ console.warn('Failed to load projects', e); container.innerHTML = '<p class="muted">No projects found.</p>'; }
})();
