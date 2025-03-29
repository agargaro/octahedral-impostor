import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';
import { Asset, Main } from '@three.ez/main';
import { AmbientLight } from 'three';

const main = new Main();
const soldierGLTF = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
soldierGLTF.scene.add(new AmbientLight('white', 5));

const renderTarget = createAlbedo({ renderer: main.renderer, target: soldierGLTF.scene });

//

const width = renderTarget.texture.image.width;
const height = renderTarget.texture.image.height;
const readBuffer = new Uint8Array(width * height * 4);

// Leggi i pixel dal render target
main.renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, readBuffer);

// Crea un canvas per disegnare l'immagine
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(width, height);

// Copia i pixel (invertendo verticalmente)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const destIdx = (x + y * width) * 4;
    const srcIdx = (x + (height - y - 1) * width) * 4; // Flip verticale

    imageData.data[destIdx] = readBuffer[srcIdx];
    imageData.data[destIdx + 1] = readBuffer[srcIdx + 1];
    imageData.data[destIdx + 2] = readBuffer[srcIdx + 2];
    imageData.data[destIdx + 3] = readBuffer[srcIdx + 3];
  }
}

ctx.putImageData(imageData, 0, 0);

// Esporta come PNG
const dataURL = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.href = dataURL;
link.download = 'rendered-texture.png';
link.click();
