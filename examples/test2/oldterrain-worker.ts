import { simplifyGeometry } from '@three.ez/simplify-geometry';
import { BufferGeometry } from 'three';
import { generateChunkGeometryCallback } from '../test/terrain.js';

// TODO: use array only instead
// TODO: add LOD levels count parameter

let generateChunkGeometry: generateChunkGeometryCallback | null = null;

onmessage = async function (e) {
  const data = e.data;

  if (data.scriptPath !== undefined) {
    console.log('loading script', data.scriptPath);
    const module = await import(data.scriptPath);
    generateChunkGeometry = module.generateChunkGeometry;
    postMessage('ok'); // remove;
    return;
  }

  const { x, z, size, segments } = data; // TODO size and segments should be passed one

  const geometry = generateChunkGeometry(x, z, size, segments);
  const geometries: BufferGeometry[] = [];

  for (let i = 0; i < 4; i++) {
    geometries.push(await simplifyGeometry(geometries[i - 1] ?? geometry, { ratio: 0.5, lockBorder: true }));
  }

  postMessage({
    x, z,
    position: geometry.attributes.position.array,
    indexes: geometries.map((x) => x.index.array)
  });
};
