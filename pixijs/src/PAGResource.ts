import type { types as PAGTypes } from 'libpag';
import type { PAGFile } from 'libpag/types/pag-file';
import type { PAGPlayer } from 'libpag/types/pag-player';
import type { PAGSurface } from 'libpag/types/pag-surface';
import { BaseTexture, GLTexture, IAutoDetectOptions, Renderer, Resource } from 'pixi.js';

export default class PAGResource extends Resource {
  private PAG: PAGTypes.PAG;
  private contextID = -1;
  private textureID = -1;
  private pagPlayer: PAGPlayer;
  private pagSurface: PAGSurface | null = null;

  public constructor(PAG: PAGTypes.PAG, pagFile: PAGFile) {
    super(pagFile.width(), pagFile.height());
    this.PAG = PAG;
    this.pagPlayer = PAG.PAGPlayer.create();
    this.pagPlayer.setComposition(pagFile);
  }

  public async upload(
    renderer: Renderer,
    baseTexture: BaseTexture<Resource, IAutoDetectOptions>,
    glTexture: GLTexture & { texture: { name: number } },
  ) {
    const { width, height, PAG } = this;
    glTexture.width = width;
    glTexture.height = height;

    const { gl } = renderer;

    // 注册 context
    if (this.contextID === -1) {
      this.contextID = PAG.GL.registerContext(gl, {
        majorVersion: 2,
        minorVersion: 0,
      });
    }

    if (glTexture.texture.name !== this.textureID) {
      // texture 变化
      if (this.textureID !== -1) {
        // 销毁旧的 surface
        PAG.GL.textures[this.textureID] = -1;
        this.pagSurface?.destroy();
      }
      // 分配内存不然绑定 frameBuffer 会失败
      gl.texImage2D(
        baseTexture.target,
        0,
        baseTexture.format,
        width,
        height,
        0,
        baseTexture.format,
        baseTexture.type,
        null,
      );
      // 注册
      this.textureID = PAG.GL.getNewId(PAG.GL.textures);
      glTexture.texture.name = this.textureID;
      PAG.GL.textures[this.textureID] = glTexture.texture;
      // 生成 surface
      PAG.GL.makeContextCurrent(this.contextID);
      this.pagSurface = PAG.PAGSurface.FromTexture(this.textureID, width, height, false);
      this.pagPlayer.setSurface(this.pagSurface);
    }
    await this.pagPlayer.flush();
    renderer.reset();
    return true;
  }

  public setProgress(progress: number) {
    this.pagPlayer?.setProgress(progress);
    this.update();
  }
}
