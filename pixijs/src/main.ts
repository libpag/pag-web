import * as PIXI from 'pixi.js';
import { PAGInit } from 'libpag';
import PAGResource from './PAGResource';

window.onload = async () => {
  const app = new PIXI.Application({
    width: 400,
    height: 300,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
  });
  document.body.appendChild(app.view);

  const PAG = await PAGInit();
  const buffer = await fetch('https://pag.io/file/like.pag').then((res) => res.arrayBuffer());
  const pagFile = await PAG.PAGFile.loadFromBuffer(buffer);

  const baseTexture = new PIXI.BaseTexture(new PAGResource(PAG, pagFile));
  const texture = new PIXI.Texture(baseTexture);

  const sprite = new PIXI.Sprite(texture);
  app.stage.addChild(sprite);
};
