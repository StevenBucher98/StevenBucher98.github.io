Portfolio website (static)

This folder contains a simple static portfolio website. It includes:

- `index.html` — homepage
- `projects.html` / `project.html` — projects listing and project details
- `blog.html` / `post.html` — blog listing and post pages
- `stainedglass.html` — the interactive Stained Glass low-poly demo you started with
- `styles.css` — global styles
- `site.js` — small site bootstrap (header + featured content)
- `data/` — JSON indexes (projects.json, posts.json)
- `content/posts/` — add markdown files here for blog posts
- `scripts/generatePostsIndex.js` — optional Node script to generate data/posts.json from the markdown files

How to run

1) Quick local server (recommended):

  cd '/Users/stevenbucher/Testing/StainedGlassPage'
  python3 -m http.server 8000

Open http://localhost:8000 in your browser.

2) If you prefer Node and want to regenerate the blog index automatically after adding posts:

  # (optional) install node
  # run the generator once to produce data/posts.json
  node scripts/generatePostsIndex.js

3) How to add new blog posts:

  - Create a new Markdown file under `content/posts/` with a file name like `2025-09-20-my-post.md`.
  - Include optional frontmatter at the top of the file, for example:

    ---
    title: "My Post Title"
    date: "2025-09-20"
    tags: ["notes","work"]
    summary: "A one-line summary for the index."
    ---

  - After adding the file you can either:
    - Run `node scripts/generatePostsIndex.js` to update `data/posts.json` (recommended), or
    - Manually update `data/posts.json` to add a record for your post.

4) To add a new project entry:

  - Edit `data/projects.json` and add a JSON object describing the project. Include a `page` property (e.g., `stainedglass.html`), `summary`, and `slug`.

Notes

- The site is completely static and can be hosted on GitHub Pages, Netlify, or any static host.
- The interactive demo uses an offscreen canvas and client-side triangulation — it runs entirely in the browser.

## About — Steven Bucher

Steven Bucher is a Product Manager at Microsoft. He is early in his career and graduated from Santa Clara University. Steven is interested in solving today’s problems with technology and builds projects that aim for practical, positive impact.

The views expressed on this site are his own and do not represent Microsoft.

Connect:

- LinkedIn: https://www.linkedin.com/in/stevenabucher  (replace this with your exact LinkedIn URL if different)
- GitHub: https://github.com/StevenBucher98

What motivates me

Steven cares about creating products and experiences that have a positive effect on people and communities. Making a real impact through technology motivates the work he does.
