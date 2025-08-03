const worker = new Worker(new URL('terrain-worker.js', import.meta.url), { type: 'module' });

const x = 0, z = 0;

worker.postMessage({ scriptPath: './terrain-generation.js' });

let count = 0;

worker.onmessage = (event) => {
  console.log(event.data);
  count++;

  if (count > 20) return;

  worker.postMessage({ x, z, size: 128, segments: 56 });
};
