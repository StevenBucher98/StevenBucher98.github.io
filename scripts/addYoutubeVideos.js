#!/usr/bin/env node
// scripts/addYoutubeVideos.js
// Usage:
//   node scripts/addYoutubeVideos.js <YOUTUBE_API_KEY> <url1> <url2> ...
// or set YOUTUBE_API_KEY env var and pass urls as args.

const fs = require('fs').promises;

(async function(){
  try{
    const args = process.argv.slice(2);
    const apiKey = args[0] && args[0].startsWith('http') ? null : (args[0] || process.env.YOUTUBE_API_KEY);
    const urls = (apiKey ? args.slice(1) : args);
    if (!apiKey) {
      console.error('Error: You must provide a YouTube Data API key as first arg or as YOUTUBE_API_KEY env var.');
      console.error('\nUsage: node scripts/addYoutubeVideos.js <YOUTUBE_API_KEY> <url1> <url2> ...');
      process.exit(1);
    }
    if (!urls || urls.length === 0) {
      console.error('Error: provide one or more YouTube URLs as arguments.');
      process.exit(1);
    }

    function extractId(url){
      try{
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
        const vid = u.searchParams.get('v'); if (vid) return vid;
        const parts = u.pathname.split('/').filter(Boolean); return parts[parts.length-1];
      }catch(e){
        const m = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
      }
    }

    const ids = urls.map(extractId).filter(Boolean);
    if (ids.length === 0) {
      console.error('No video IDs parsed from the provided URLs.');
      process.exit(1);
    }

    if (!globalThis.fetch) {
      console.error('This script requires Node 18+ with global fetch. If using older Node, please upgrade or run with a fetch polyfill.');
      process.exit(1);
    }

    // read existing list if present
    let existing = [];
    try{
      const prev = await fs.readFile('./data/youtube-videos.json', 'utf8');
      existing = JSON.parse(prev || '[]');
    }catch(e){ /* ignore */ }

    async function fetchDetails(batchIds){
      const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${batchIds.join(',')}&key=${apiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      return (json.items || []).map(it => ({ id: it.id, title: it.snippet.title, channel: it.snippet.channelTitle, publishedAt: it.snippet.publishedAt, thumbnails: it.snippet.thumbnails, description: it.snippet.description }));
    }

    // fetch in batches of 50
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const details = await fetchDetails(batch);
      details.forEach(d => {
        if (!existing.some(x => x.id === d.id)) existing.push(d);
      });
    }

    // sort by publishedAt descending (newest first)
    existing.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    await fs.mkdir('data', { recursive: true });
    await fs.writeFile('data/youtube-videos.json', JSON.stringify(existing, null, 2), 'utf8');
    console.log('Updated data/youtube-videos.json with', existing.length, 'videos.');
  }catch(err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
