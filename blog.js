// blog.js - list posts found in data/posts.json
(async function(){
  const list = document.getElementById('postsList');
  if (!list) return;
  try{
    const res = await fetch('data/posts.json');
    const posts = await res.json();
    if (!posts.length) { list.innerHTML = '<p class="muted">No posts found.</p>'; return; }
    posts.forEach(p => {
      const el = document.createElement('div'); el.className = 'post-card';
      el.innerHTML = `
        <h3><a href="post.html?slug=${p.slug}">${p.title}</a></h3>
        <time>${new Date(p.date).toLocaleDateString()}</time>
        <p class="muted">${p.summary || ''}</p>
      `;
      list.appendChild(el);
    });
  }catch(e){ console.warn('Failed to load posts', e); list.innerHTML = '<p class="muted">Failed to load posts.</p>'; }
})();
