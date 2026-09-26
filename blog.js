// Render the blog index from data/posts.json.
(async function () {
  const list = document.getElementById('postsList');
  if (!list) return;
  try {
    const res = await fetch('data/posts.json');
    if (!res.ok) throw new Error(`Posts request failed with ${res.status}`);
    const posts = await res.json();
    if (!posts.length) {
      list.innerHTML = '<p class="muted">No posts yet.</p>';
      return;
    }
    [...posts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(p => {
      const date = new Date(`${p.date}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const el = document.createElement('article');
      el.className = 'post-card';
      const primaryTag = p.tags && p.tags[0];
      el.innerHTML = `
        <div class="post-meta">${date}${primaryTag ? `<span class="tag">${primaryTag}</span>` : ''}</div>
        <h3><a href="post.html?slug=${p.slug}">${p.title}</a></h3>
        <p>${p.summary || ''}</p>
      `;
      list.appendChild(el);
    });
  } catch (error) {
    console.error('Failed to load posts.', error);
    list.innerHTML = '<p class="muted">Posts are unavailable right now.</p>';
  }
}());
