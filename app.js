/* Stained Glass Low-Poly Generator - app.js

This script:
- accepts an image file via input
- computes an edge map using Sobel on a downscaled version for speed
- generates a set of points biased toward edges and uniformly distributed random points
- uses Delaunator to compute a triangulation
- builds an SVG where each triangle is filled with the sampled color of the source image
- allows downloading the SVG or a PNG rasterization
*/

(() => {
  const fileInput = document.getElementById('fileInput');
  const pointsRange = document.getElementById('pointsRange');
  const edgeBiasRange = document.getElementById('edgeBiasRange');
  const edgeThresholdRange = document.getElementById('edgeThresholdRange');
  const strokeWidthRange = document.getElementById('strokeWidthRange');
  const strokeColor = document.getElementById('strokeColor');
  const generateBtn = document.getElementById('generateBtn');
  const downloadSVGBtn = document.getElementById('downloadSVGBtn');
  const downloadPNGBtn = document.getElementById('downloadPNGBtn');
  const previewContainer = document.getElementById('previewContainer');
  const status = document.getElementById('status');

  const pointsCountLabel = document.getElementById('pointsCountLabel');
  const edgeBiasLabel = document.getElementById('edgeBiasLabel');
  const edgeThresholdLabel = document.getElementById('edgeThresholdLabel');
  const strokeWidthLabel = document.getElementById('strokeWidthLabel');

  // Offscreen canvases
  const originalCanvas = document.createElement('canvas');
  const originalCtx = originalCanvas.getContext('2d');

  const workCanvas = document.createElement('canvas'); // used for point sampling & edge detection
  const workCtx = workCanvas.getContext('2d');

  // Some configuration
  const MAX_WORK_DIM = 900; // working canvas maximum dimension for processing (keeps things fast)

  let currentState = {
    imageLoaded: false,
    origW: 0,
    origH: 0,
    workW: 0,
    workH: 0,
    imageBitmap: null
  };

  function setStatus(s) {
    status.textContent = s;
  }

  function updateLabels() {
    pointsCountLabel.textContent = pointsRange.value;
    edgeBiasLabel.textContent = edgeBiasRange.value + '%';
    edgeThresholdLabel.textContent = edgeThresholdRange.value;
    strokeWidthLabel.textContent = strokeWidthRange.value;
  }

  // compute a normalized sobel magnitude map on the work canvas
  function computeSobel(width, height) {
    const imgData = workCtx.getImageData(0, 0, width, height).data;
    const gray = new Float32Array(width * height);
    // luminance
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      const r = imgData[p], g = imgData[p + 1], b = imgData[p + 2];
      gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const mag = new Float32Array(width * height);
    let max = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        // Sobel kernels
        const gx = -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
                  - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
                  - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
        const gy = -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
                  + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
        const g = Math.hypot(gx, gy);
        mag[i] = g;
        if (g > max) max = g;
      }
    }
    // normalize to 0..255
    if (max > 0) {
      for (let i = 0; i < mag.length; i++) mag[i] = mag[i] / max * 255;
    }
    return mag;
  }

  // generate points biased to edges and with random points
  function generatePoints(opts) {
    const { pointCount, edgeBiasPercent, edgeThreshold } = opts;
    const width = currentState.workW;
    const height = currentState.workH;
    const edgeMag = computeSobel(width, height);

    // collect edge candidates
    const candidates = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const m = edgeMag[i];
        if (m >= edgeThreshold) {
          candidates.push({ x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5), weight: m });
        }
      }
    }
    // sort candidate edges by weight desc to pick the strongest
    candidates.sort((a, b) => b.weight - a.weight);

    const edgeCount = Math.round(pointCount * (edgeBiasPercent / 100));
    const points = [];
    const seen = new Set();

    function addUnique(x, y) {
      const key = `${Math.round(x)}|${Math.round(y)}`;
      if (!seen.has(key)) {
        seen.add(key);
        points.push([x, y]);
      }
    }

    // add strong edge points
    for (let i = 0; i < Math.min(edgeCount, candidates.length); i++) {
      addUnique(candidates[i].x, candidates[i].y);
    }

    // add some border points for better triangulation on edges
    const borderStep = Math.max(2, Math.floor(Math.min(width, height) / 18));
    for (let x = 0; x < width; x += borderStep) {
      addUnique(x, 0);
      addUnique(x, height - 1);
    }
    for (let y = 0; y < height; y += borderStep) {
      addUnique(0, y);
      addUnique(width - 1, y);
    }

    // always include corners
    addUnique(0, 0); addUnique(width - 1, 0); addUnique(width - 1, height - 1); addUnique(0, height - 1);

    // fill up the rest with random points
    while (points.length < pointCount) {
      const x = Math.random() * (width - 1);
      const y = Math.random() * (height - 1);
      addUnique(x, y);
      // safety break
      if (points.length > pointCount * 2) break;
    }

    return points;
  }

  function triangulateAndBuildSVG(points, opts) {
    const { stroke, strokeWidth } = opts;
    // Delaunator expects an array of [x,y]
    const delaunay = Delaunator.from(points);
    const triangles = delaunay.triangles; // indices into points array

    // prepare original image pixel data for fast color sampling
    const origW = currentState.origW;
    const origH = currentState.origH;
    const workW = currentState.workW;
    const workH = currentState.workH;
    const scaleX = origW / workW;
    const scaleY = origH / workH;

    // read original image pixels once
    const origData = originalCtx.getImageData(0, 0, origW, origH).data;

    function sampleColorAtOrig(x, y) {
      // clamp
      const xi = Math.min(origW - 1, Math.max(0, Math.round(x)));
      const yi = Math.min(origH - 1, Math.max(0, Math.round(y)));
      const idx = (yi * origW + xi) * 4;
      return [origData[idx], origData[idx + 1], origData[idx + 2]];
    }

    // build SVG string
    let svg = '';
    svg += `<?xml version="1.0" encoding="utf-8"?>`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${origW}" height="${origH}" viewBox="0 0 ${origW} ${origH}">`;

    // Iterate triangles
    for (let i = 0; i < triangles.length; i += 3) {
      const ia = triangles[i], ib = triangles[i + 1], ic = triangles[i + 2];
      const pa = points[ia], pb = points[ib], pc = points[ic];
      // triangle coordinates scaled to original image
      const ax = Math.round(pa[0] * scaleX), ay = Math.round(pa[1] * scaleY);
      const bx = Math.round(pb[0] * scaleX), by = Math.round(pb[1] * scaleY);
      const cx = Math.round(pc[0] * scaleX), cy = Math.round(pc[1] * scaleY);
      const cxMean = Math.round((ax + bx + cx) / 3);
      const cyMean = Math.round((ay + by + cy) / 3);
      const [r, g, b] = sampleColorAtOrig(cxMean, cyMean);
      svg += `<polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" fill="rgb(${r},${g},${b})" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    }

    svg += '</svg>';
    return svg;
  }

  // main generate wrapper
  function generateLowPoly() {
    try {
      generateBtn.disabled = true;
      setStatus('Generating low-poly...');

      const pointCount = parseInt(pointsRange.value, 10);
      const edgeBiasPercent = parseInt(edgeBiasRange.value, 10);
      const edgeThreshold = parseInt(edgeThresholdRange.value, 10);
      const stroke = strokeColor.value;
      const strokeWidth = parseFloat(strokeWidthRange.value);

      // sample points (on work/resized canvas)
      const points = generatePoints({ pointCount, edgeBiasPercent, edgeThreshold });

      // triangulate and build svg
      const svg = triangulateAndBuildSVG(points, { stroke, strokeWidth });

      // preview the SVG
      previewContainer.innerHTML = svg;

      // enable downloads
      downloadSVGBtn.disabled = false;
      downloadPNGBtn.disabled = false;

      // cache latest svg in a property for download
      currentState.lastSVG = svg;

      setStatus(`Generated ${pointCount} points (${Math.round(points.length)} unique). Triangles: ${Math.round(points.length * 2)}`);
    } catch (err) {
      console.error(err);
      setStatus('Error generating low-poly: ' + err.message);
    } finally {
      generateBtn.disabled = false;
    }
  }

  // Image load & initial prepare
  fileInput.addEventListener('change', (e) => {
    const f = (e.target.files || [])[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      // set original canvas to natural size
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      originalCanvas.width = origW;
      originalCanvas.height = origH;
      originalCtx.drawImage(img, 0, 0);

      // choose a work size capped by MAX_WORK_DIM
      const scale = Math.min(1, MAX_WORK_DIM / Math.max(origW, origH));
      const workW = Math.max(80, Math.round(origW * scale));
      const workH = Math.max(80, Math.round(origH * scale));
      workCanvas.width = workW;
      workCanvas.height = workH;
      workCtx.clearRect(0, 0, workW, workH);
      // draw scaled version for processing
      workCtx.drawImage(img, 0, 0, workW, workH);

      currentState.imageLoaded = true;
      currentState.origW = origW;
      currentState.origH = origH;
      currentState.workW = workW;
      currentState.workH = workH;

      setStatus(`Image loaded: ${origW}x${origH}. Processing size: ${workW}x${workH}`);
      generateBtn.disabled = false;
      downloadSVGBtn.disabled = true;
      downloadPNGBtn.disabled = true;
      previewContainer.innerHTML = `<img src="${url}" alt="uploaded" style="max-width:100%; height:auto; border-radius:6px;" />`;

      // clean up object url
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setStatus('Failed to load image');
    img.src = url;
  });

  // Bind controls
  pointsRange.addEventListener('input', updateLabels);
  edgeBiasRange.addEventListener('input', updateLabels);
  edgeThresholdRange.addEventListener('input', updateLabels);
  strokeWidthRange.addEventListener('input', updateLabels);
  updateLabels();

  generateBtn.addEventListener('click', () => {
    if (!currentState.imageLoaded) return setStatus('Load an image first');
    generateLowPoly();
  });

  downloadSVGBtn.addEventListener('click', () => {
    if (!currentState.lastSVG) return;
    const blob = new Blob([currentState.lastSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lowpoly-stainedglass.svg';
    a.click();
    URL.revokeObjectURL(url);
  });

  downloadPNGBtn.addEventListener('click', () => {
    if (!currentState.lastSVG) return;
    // rasterize the svg to a canvas at the original size
    const img = new Image();
    const svg = currentState.lastSVG;
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = currentState.origW;
      canvas.height = currentState.origH;
      const ctx = canvas.getContext('2d');
      // white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'lowpoly-stainedglass.png';
        a.click();
      }, 'image/png');
    };
    img.onerror = () => alert('Failed to rasterize PNG');
    img.src = url;
  });

})();
