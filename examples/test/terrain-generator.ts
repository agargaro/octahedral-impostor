import { createNoise2D } from 'simplex-noise';
import { PlaneGeometry } from 'three';
import alea from 'alea';

const config = {
  frequency: 0.001,
  amplitude: 150,
  octaves: 4,
  lacunarity: 3,
  gain: 0.2
};

const noiseCallback = createNoise2D(alea(32767));

export function generateChunkGeometry(x: number, z: number, size: number, segments: number): PlaneGeometry {
  x *= size;
  z *= size;

  const geometry = new PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2); // TODO create new plane geometry class to avoid this transformation

  const vertices = geometry.attributes.position.array;
  const octaves = config.octaves;
  let amplitude = config.amplitude;
  let frequency = config.frequency;

  for (let o = 0; o < octaves; o++) {
    for (let i = 0; i < vertices.length; i++) {
      vertices[i * 3 + 1] += noiseCallback((vertices[i * 3] + x) * frequency, (vertices[i * 3 + 2] + z) * frequency) * amplitude;
    }

    amplitude *= config.gain;
    frequency *= config.lacunarity;
  }

  geometry.computeVertexNormals();

  return geometry;
};
