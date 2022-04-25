import * as PIXI from 'pixi.js';
import { PAGInit } from 'libpag';
import PAGResource from './PAGResource';

window.onload = async () => {
  const app = new PIXI.Application({
    width: 640,
    height: 640,
    backgroundColor: 0x1099bb,
    resolution: 1,
  });
  document.body.appendChild(app.view);
  const PAG = await PAGInit();
  const buffer = await fetch('./snowman.pag').then((res) => res.arrayBuffer());
  const pagFile = await PAG.PAGFile.loadFromBuffer(buffer);

  const pagResource = new PAGResource(PAG, pagFile);
  const baseTexture = new PIXI.BaseTexture(pagResource);
  const texture = new PIXI.Texture(baseTexture);

  const sprite = new PIXI.Sprite(texture);
  app.stage.addChild(sprite);

  document.getElementById('replace')?.addEventListener('click', async () => {
    const image: HTMLImageElement = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.src = './cat.png';
    });
    const pagImage = PAG.PAGImage.fromSource(image);
    pagFile.replaceImage(1, pagImage);
    pagResource.flush();
  });
};
