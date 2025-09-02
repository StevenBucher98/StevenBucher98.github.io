#!/usr/bin/env node
// Node script to build data/posts.json by scanning content/posts/*.md
const fs = require('fs').promises;
const path = require('path');
(async function(){
  try{
    const postsDir = path.join(__dirname, '..', 'content', 'posts');
    const outDir = path.join(__dirname, '..', 'data');
    const files = await fs.readdir(postsDir);
    const posts = [];
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const filepath = path.join(postsDir, f);
      const text = await fs.readFile(filepath, 'utf8');
      let title = '';
      let date = '';
      let summary = '';
      let tags = [];

      // parse simple frontmatter (between lines starting with ---)
      if (text.startsWith('---')){
        const end = text.indexOf('\n---', 3);
        if (end !== -1) {
          const fmText = text.slice(3, end+1).trim();
          const lines = fmText.split(/\r?\n/);
          for (const line of lines){
            const idx = line.indexOf(':');
            if (idx === -1) continue;
            const key = line.slice(0, idx).trim();
            let val = line.slice(idx+1).trim();
            // try to parse JSON arrays
            if (val.startsWith('[') || val.startsWith('{')){
              try { val = JSON.parse(val); } catch(e){}
            }
            // remove quotes if present
            if (typeof val === 'string' && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\'')))){
              val = val.slice(1,-1);
            }
            if (key === 'title') title = val;
            if (key === 'date') date = val;
            if (key === 'summary') summary = val;
            if (key === 'tags') tags = Array.isArray(val) ? val : String(val).split(/,\s*/);
          }
        }
      }

      const slug = f.replace(/\.md$/, '');
      // fallback title
      if (!title) title = slug;
      // fallback date: try from filename
      if (!date) {
        // if filename contains YYYY-MM-DD leading
        const m = slug.match(/(\d{4}-\d{2}-\d{2})/);
        if (m) date = m[1]; else date = (new Date()).toISOString().slice(0,10);
      }

      posts.push({ slug, title, date, summary, tags, file: path.posix.join('content','posts', f) });
    }

    posts.sort((a,b) => new Date(b.date) - new Date(a.date));
    await fs.mkdir(outDir, { recursive:true });
    await fs.writeFile(path.join(outDir, 'posts.json'), JSON.stringify(posts, null, 2), 'utf8');
    console.log('Wrote data/posts.json with', posts.length, 'posts');
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
