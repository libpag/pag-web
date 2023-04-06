/////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Tencent is pleased to support the open source community by making libpag available.
//
//  Copyright (C) 2021 THL A29 Limited, a Tencent company. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
//  except in compliance with the License. You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  unless required by applicable law or agreed to in writing, software distributed under the
//  license is distributed on an "as is" basis, without warranties or conditions of any kind,
//  either express or implied. see the license for the specific language governing permissions
//  and limitations under the license.
//
/////////////////////////////////////////////////////////////////////////////////////////////////

var WorkerMessageType = /* @__PURE__ */ ((WorkerMessageType2) => {
  WorkerMessageType2["PAGInit"] = "PAGInit";
  WorkerMessageType2["PAGView_init"] = "PAGView.init";
  WorkerMessageType2["PAGView_duration"] = "PAGView.duration";
  WorkerMessageType2["PAGView_play"] = "PAGView.play";
  WorkerMessageType2["PAGView_pause"] = "PAGView.pause";
  WorkerMessageType2["PAGView_stop"] = "PAGView.stop";
  WorkerMessageType2["PAGView_setRepeatCount"] = "PAGView.setRepeatCount";
  WorkerMessageType2["PAGView_getProgress"] = "PAGView.getProgress";
  WorkerMessageType2["PAGView_currentFrame"] = "PAGView.currentFrame";
  WorkerMessageType2["PAGView_setProgress"] = "PAGView.setProgress";
  WorkerMessageType2["PAGView_scaleMode"] = "PAGView.scaleMode";
  WorkerMessageType2["PAGView_setScaleMode"] = "PAGView.setScaleMode";
  WorkerMessageType2["PAGView_flush"] = "PAGView.flush";
  WorkerMessageType2["PAGView_getDebugData"] = "PAGView.getDebugData";
  WorkerMessageType2["PAGView_destroy"] = "PAGView.destroy";
  WorkerMessageType2["PAGFile_load"] = "PAGFile.load";
  WorkerMessageType2["PAGFile_getTextData"] = "PAGFile.getTextData";
  WorkerMessageType2["PAGFile_replaceText"] = "PAGFile.replaceText";
  WorkerMessageType2["PAGFile_replaceImage"] = "PAGFile.replaceImage";
  WorkerMessageType2["PAGFile_destroy"] = "PAGFile.destroy";
  WorkerMessageType2["PAGImage_fromSource"] = "PAGImage.fromSource";
  WorkerMessageType2["PAGImage_destroy"] = "PAGImage.destroy";
  WorkerMessageType2["VideoReader_constructor"] = "VideoReader.constructor";
  WorkerMessageType2["VideoReader_prepare"] = "VideoReader.prepare";
  WorkerMessageType2["VideoReader_play"] = "VideoReader.play";
  WorkerMessageType2["VideoReader_pause"] = "VideoReader.pause";
  WorkerMessageType2["VideoReader_stop"] = "VideoReader.stop";
  WorkerMessageType2["VideoReader_getError"] = "VideoReader.getError";
  WorkerMessageType2["PAGModule_linkVideoReader"] = "PAGModule.linkVideoReader";
  WorkerMessageType2["TextDocument_delete"] = "TextDocument.delete";
  return WorkerMessageType2;
})(WorkerMessageType || {});

let messageCount = 0;
const generateMessageName = (name) => `${name}_${messageCount++}`;
const postMessage = (worker, message, callback, transfer = []) => {
  return new Promise((resolve) => {
    const name = generateMessageName(message.name);
    const handle = (event) => {
      if (event.data.name === name) {
        worker.removeEventListener("message", handle);
        resolve(callback(...event.data.args));
      }
    };
    worker.addEventListener("message", handle);
    worker.postMessage({ name, args: message.args }, transfer);
  });
};

const VIDEO_DECODE_WAIT_FRAME = 3;
const VIDEO_DECODE_SEEK_TIMEOUT_FRAME = 12;
const VIDEO_PLAYBACK_RATE_MIN = 0.125;
const VIDEO_PLAYBACK_RATE_MAX = 4;

let eventHandlers = {};
const addListener = (node, event, handler, capture = false) => {
  var _a;
  if (!(event in eventHandlers)) {
    eventHandlers[event] = [];
  }
  (_a = eventHandlers[event]) == null ? void 0 : _a.push({ node, handler, capture });
  node.addEventListener(event, handler, capture);
};
const removeListener = (targetNode, event, targetHandler) => {
  var _a;
  if (!(event in eventHandlers))
    return;
  (_a = eventHandlers[event]) == null ? void 0 : _a.filter(({ node, handler }) => node === targetNode && handler === targetHandler).forEach(({ node, handler, capture }) => node.removeEventListener(event, handler, capture));
};
const removeAllListeners = (targetNode, event) => {
  var _a, _b;
  if (!(event in eventHandlers))
    return;
  (_a = eventHandlers[event]) == null ? void 0 : _a.filter(({ node }) => node === targetNode).forEach(({ node, handler, capture }) => node.removeEventListener(event, handler, capture));
  eventHandlers[event] = (_b = eventHandlers[event]) == null ? void 0 : _b.filter(({ node }) => node !== targetNode);
};

const nav = (navigator == null ? void 0 : navigator.userAgent) || "";
const ANDROID = /android|adr/i.test(nav);
const MOBILE = /(mobile)/i.test(nav) && ANDROID;
!(/(mobile)/i.test(nav) || MOBILE) && /Mac OS X/i.test(nav);
const IPHONE = /(iphone|ipad|ipod)/i.test(nav);
const WECHAT = /MicroMessenger/i.test(nav);
const SAFARI = /^((?!chrome|android).)*safari/i.test(nav);
const WORKER = typeof globalThis.importScripts === "function";

let PAGModule;

class BitmapImage {
  constructor(bitmap) {
    this.bitmap = bitmap;
  }
  setBitmap(bitmap) {
    if (this.bitmap) {
      this.bitmap.close();
    }
    this.bitmap = bitmap;
  }
}

class WorkerVideoReader {
  constructor(proxyId) {
    this.bitmap = null;
    this.isSought = false;
    this.isPlaying = false;
    this.bitmapImage = new BitmapImage(null);
    this.proxyId = proxyId;
  }
  prepare(targetFrame, playbackRate) {
    return new Promise((resolve) => {
      postMessage(
        self,
        { name: WorkerMessageType.VideoReader_prepare, args: [this.proxyId, targetFrame, playbackRate] },
        (res) => {
          this.bitmapImage.setBitmap(res);
          resolve();
        }
      );
    });
  }
  getVideo() {
    return this.bitmapImage;
  }
  onDestroy() {
    self.postMessage({ name: "VideoReader.onDestroy", args: [this.proxyId] });
  }
  play() {
    return new Promise((resolve) => {
      postMessage(self, { name: WorkerMessageType.VideoReader_play, args: [this.proxyId] }, () => {
        resolve();
      });
    });
  }
  pause() {
    postMessage(self, { name: WorkerMessageType.VideoReader_pause, args: [this.proxyId] }, () => {
    });
  }
  stop() {
    postMessage(self, { name: WorkerMessageType.VideoReader_stop, args: [this.proxyId] }, () => {
    });
  }
  getError() {
    return new Promise((resolve) => {
      postMessage(self, { name: WorkerMessageType.VideoReader_getError, args: [this.proxyId] }, (res) => {
        resolve(res);
      });
    });
  }
}

const UHD_RESOLUTION = 3840;
const getWechatNetwork = () => {
  return new Promise((resolve) => {
    window.WeixinJSBridge.invoke(
      "getNetworkType",
      {},
      () => {
        resolve();
      },
      () => {
        resolve();
      }
    );
  });
};
const waitVideoCanPlay = (videoElement) => {
  return new Promise((resolve) => {
    const canplayHandle = () => {
      removeListener(videoElement, "canplay", canplayHandle);
      clearTimeout(timer);
      resolve(true);
    };
    addListener(videoElement, "canplay", canplayHandle);
    const timer = setTimeout(() => {
      removeListener(videoElement, "canplay", canplayHandle);
      resolve(false);
    }, 1e3);
  });
};
class VideoReader {
  constructor(mp4Data, width, height, frameRate, staticTimeRanges, isWorker = false) {
    this.isSought = false;
    this.isPlaying = false;
    this.bitmap = null;
    this.videoEl = null;
    this.frameRate = 0;
    this.canplay = false;
    this.staticTimeRanges = null;
    this.disablePlaybackRate = false;
    this.error = null;
    this.player = null;
    this.width = 0;
    this.height = 0;
    this.bitmapCanvas = null;
    this.bitmapCtx = null;
    this.videoEl = document.createElement("video");
    this.videoEl.style.display = "none";
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.preload = "auto";
    this.videoEl.width = width;
    this.videoEl.height = height;
    waitVideoCanPlay(this.videoEl).then(() => {
      this.canplay = true;
    });
    const blob = new Blob([mp4Data], { type: "video/mp4" });
    this.videoEl.src = URL.createObjectURL(blob);
    this.frameRate = frameRate;
    if (IPHONE) {
      this.videoEl.load();
    }
    this.width = width;
    this.height = height;
    this.staticTimeRanges = new StaticTimeRanges(staticTimeRanges);
    if (UHD_RESOLUTION < width || UHD_RESOLUTION < height) {
      this.disablePlaybackRate = true;
    }
    if (!isWorker) {
      this.linkPlayer(PAGModule.currentPlayer);
    }
  }
  static async create(mp4Data, width, height, frameRate, staticTimeRanges) {
    var _a;
    if (WORKER) {
      const proxyId = await new Promise((resolve) => {
        const buffer = mp4Data.buffer.slice(mp4Data.byteOffset, mp4Data.byteOffset + mp4Data.byteLength);
        postMessage(
          self,
          {
            name: WorkerMessageType.VideoReader_constructor,
            args: [buffer, width, height, frameRate, staticTimeRanges, true]
          },
          (res) => {
            resolve(res);
          },
          [buffer]
        );
      });
      const videoReader = new WorkerVideoReader(proxyId);
      (_a = PAGModule.currentPlayer) == null ? void 0 : _a.linkVideoReader(videoReader);
      return videoReader;
    }
    return new VideoReader(mp4Data, width, height, frameRate, staticTimeRanges);
  }
  async prepare(targetFrame, playbackRate) {
    var _a;
    this.setError(null);
    this.isSought = false;
    const { currentTime } = this.videoEl;
    const targetTime = targetFrame / this.frameRate;
    if (currentTime === 0 && targetTime === 0) {
      if (!this.canplay && !SAFARI) {
        await waitVideoCanPlay(this.videoEl);
      } else {
        try {
          await this.play();
        } catch (e) {
          this.setError(e);
        }
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            this.pause();
            resolve();
          });
        });
      }
    } else {
      if (Math.round(targetTime * this.frameRate) === Math.round(currentTime * this.frameRate)) ; else if ((_a = this.staticTimeRanges) == null ? void 0 : _a.contains(targetFrame)) {
        await this.seek(targetTime, false);
        return;
      } else if (Math.abs(currentTime - targetTime) < 1 / this.frameRate * VIDEO_DECODE_WAIT_FRAME) ; else {
        this.isSought = true;
        await this.seek(targetTime);
        return;
      }
    }
    const targetPlaybackRate = Math.min(Math.max(playbackRate, VIDEO_PLAYBACK_RATE_MIN), VIDEO_PLAYBACK_RATE_MAX);
    if (!this.disablePlaybackRate && this.videoEl.playbackRate !== targetPlaybackRate) {
      this.videoEl.playbackRate = targetPlaybackRate;
    }
    if (this.isPlaying && this.videoEl.paused) {
      try {
        await this.play();
      } catch (e) {
        this.setError(e);
      }
    }
  }
  getVideo() {
    return this.videoEl;
  }
  async generateBitmap() {
    var _a, _b;
    if (!this.bitmapCanvas) {
      this.bitmapCanvas = new OffscreenCanvas(this.width, this.height);
      this.bitmapCanvas.width = this.width;
      this.bitmapCanvas.height = this.height;
      this.bitmapCtx = this.bitmapCanvas.getContext("2d");
    }
    (_a = this.bitmapCtx) == null ? void 0 : _a.fillRect(0, 0, this.width, this.height);
    (_b = this.bitmapCtx) == null ? void 0 : _b.drawImage(this.videoEl, 0, 0, this.width, this.height);
    this.bitmap = await createImageBitmap(this.bitmapCanvas);
    return this.bitmap;
  }
  async play() {
    var _a;
    if (!this.videoEl.paused)
      return;
    if (WECHAT && window.WeixinJSBridge) {
      await getWechatNetwork();
    }
    if (document.visibilityState !== "visible") {
      const visibilityHandle = () => {
        if (document.visibilityState === "visible") {
          if (this.videoEl)
            this.videoEl.play();
          window.removeEventListener("visibilitychange", visibilityHandle);
        }
      };
      window.addEventListener("visibilitychange", visibilityHandle);
      throw new Error("The play() request was interrupted because the document was hidden!");
    }
    await ((_a = this.videoEl) == null ? void 0 : _a.play());
  }
  pause() {
    var _a;
    this.isPlaying = false;
    if (this.videoEl.paused)
      return;
    (_a = this.videoEl) == null ? void 0 : _a.pause();
  }
  stop() {
    var _a;
    this.isPlaying = false;
    if (!this.videoEl.paused) {
      (_a = this.videoEl) == null ? void 0 : _a.pause();
    }
    this.videoEl.currentTime = 0;
  }
  getError() {
    return this.error;
  }
  onDestroy() {
    if (this.player) {
      this.player.unlinkVideoReader(this);
    }
    removeAllListeners(this.videoEl, "playing");
    removeAllListeners(this.videoEl, "timeupdate");
    this.videoEl = null;
    this.bitmapCanvas = null;
    this.bitmapCtx = null;
  }
  seek(targetTime, play = true) {
    return new Promise((resolve) => {
      let isCallback = false;
      let timer = null;
      const setVideoState = async () => {
        var _a;
        if (play && this.videoEl.paused) {
          try {
            await this.play();
          } catch (e) {
            this.setError(e);
          }
        } else if (!play && !this.videoEl.paused) {
          (_a = this.videoEl) == null ? void 0 : _a.pause();
        }
      };
      const seekCallback = async () => {
        if (!this.videoEl) {
          this.setError(new Error("Video element doesn't exist!"));
          resolve();
          return;
        }
        removeListener(this.videoEl, "seeked", seekCallback);
        await setVideoState();
        isCallback = true;
        clearTimeout(timer);
        timer = null;
        resolve();
      };
      if (!this.videoEl) {
        this.setError(new Error("Video element doesn't exist!"));
        resolve();
        return;
      }
      addListener(this.videoEl, "seeked", seekCallback);
      this.videoEl.currentTime = targetTime;
      timer = setTimeout(() => {
        if (!isCallback) {
          if (!this.videoEl) {
            this.setError(new Error("Video element doesn't exist!"));
            resolve();
            return;
          } else {
            removeListener(this.videoEl, "seeked", seekCallback);
            setVideoState();
            resolve();
          }
        }
      }, 1e3 / this.frameRate * VIDEO_DECODE_SEEK_TIMEOUT_FRAME);
    });
  }
  setError(e) {
    this.error = e;
  }
  linkPlayer(player) {
    this.player = player;
    if (player) {
      player.linkVideoReader(this);
    }
  }
}
class StaticTimeRanges {
  constructor(timeRanges) {
    this.timeRanges = timeRanges;
  }
  contains(targetFrame) {
    if (this.timeRanges.length === 0)
      return false;
    for (let timeRange of this.timeRanges) {
      if (timeRange.start <= targetFrame && targetFrame < timeRange.end) {
        return true;
      }
    }
    return false;
  }
}

const readFile = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => {
    resolve(reader.result);
  };
  reader.onerror = () => {
    console.error(reader.error.message);
  };
  reader.readAsArrayBuffer(file);
});
const transferToArrayBuffer = (data) => {
  if (data instanceof File) {
    return readFile(data);
  } else if (data instanceof Blob) {
    return readFile(new File([data], ""));
  } else if (data instanceof ArrayBuffer) {
    return Promise.resolve(data);
  }
  return Promise.resolve(null);
};

function destroyVerify(constructor) {
  let functions = Object.getOwnPropertyNames(constructor.prototype).filter(
    (name) => name !== "constructor" && typeof constructor.prototype[name] === "function"
  );
  const proxyFn = (target, methodName) => {
    const fn = target[methodName];
    target[methodName] = function(...args) {
      if (this["isDestroyed"]) {
        console.error(`Don't call ${methodName} of the ${constructor.name} that is destroyed.`);
        return;
      }
      return fn.call(this, ...args);
    };
  };
  functions.forEach((name) => proxyFn(constructor.prototype, name));
}

var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$2(target, key, result);
  return result;
};
let WorkerPAGFile = class {
  constructor(worker, key) {
    this.isDestroyed = false;
    this.worker = worker;
    this.key = key;
  }
  static async load(worker, data) {
    const buffer = await transferToArrayBuffer(data);
    if (!buffer)
      throw new Error(
        "Initialize PAGFile data type error, please put check data type must to be File \uFF5C Blob | ArrayBuffer!"
      );
    return await postMessage(
      worker,
      { name: WorkerMessageType.PAGFile_load, args: [data] },
      (key) => new WorkerPAGFile(worker, key)
    );
  }
  getTextData(editableTextIndex) {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGFile_getTextData, args: [this.key, editableTextIndex] },
      (res) => {
        res.delete = () => {
          return postMessage(
            this.worker,
            { name: WorkerMessageType.TextDocument_delete, args: [res.key] },
            () => void 0
          );
        };
        return res;
      }
    );
  }
  replaceText(editableTextIndex, textData) {
    const textDocument = {};
    for (const key in textData) {
      if (key !== "delete") {
        textDocument[key] = textData[key];
      }
    }
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGFile_replaceText, args: [this.key, editableTextIndex, textDocument] },
      () => void 0
    );
  }
  replaceImage(editableImageIndex, pagImage) {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGFile_replaceImage, args: [this.key, editableImageIndex, pagImage.key] },
      () => void 0
    );
  }
  destroy() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGFile_destroy, args: [this.key] }, () => {
      this.isDestroyed = true;
    });
  }
};
WorkerPAGFile = __decorateClass$2([
  destroyVerify
], WorkerPAGFile);

new Array();
const calculateDisplaySize = (canvas) => {
  const styleDeclaration = globalThis.getComputedStyle(canvas, null);
  const computedSize = {
    width: Number(styleDeclaration.width.replace("px", "")),
    height: Number(styleDeclaration.height.replace("px", ""))
  };
  if (computedSize.width > 0 && computedSize.height > 0) {
    return computedSize;
  } else {
    const styleSize = {
      width: Number(canvas.style.width.replace("px", "")),
      height: Number(canvas.style.height.replace("px", ""))
    };
    if (styleSize.width > 0 && styleSize.height > 0) {
      return styleSize;
    } else {
      return {
        width: canvas.width,
        height: canvas.height
      };
    }
  }
};

var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$1(target, key, result);
  return result;
};
let WorkerPAGView = class {
  constructor(worker, key) {
    this.isDestroyed = false;
    this.worker = worker;
    this.key = key;
  }
  static init(file, canvas, initOptions) {
    const options = __spreadValues(__spreadValues({}, {
      useScale: true,
      useCanvas2D: false,
      firstFrame: true
    }), initOptions);
    if (options.useScale) {
      resizeCanvas(canvas);
    }
    const offscreen = canvas.transferControlToOffscreen();
    return postMessage(
      file.worker,
      { name: WorkerMessageType.PAGView_init, args: [file.key, offscreen, initOptions] },
      (key) => new WorkerPAGView(file.worker, key),
      [offscreen]
    );
  }
  duration() {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_duration, args: [this.key] },
      (res) => res
    );
  }
  play() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGView_play, args: [this.key] }, () => void 0);
  }
  pause() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGView_pause, args: [this.key] }, () => void 0);
  }
  stop() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGView_stop, args: [this.key] }, () => void 0);
  }
  setRepeatCount(repeatCount) {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_setRepeatCount, args: [this.key, repeatCount] },
      () => void 0
    );
  }
  getProgress() {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_getProgress, args: [this.key] },
      (res) => res
    );
  }
  currentFrame() {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_currentFrame, args: [this.key] },
      (res) => res
    );
  }
  setProgress(progress) {
    return postMessage(
      this.worker,
      {
        name: WorkerMessageType.PAGView_setProgress,
        args: [this.key, progress]
      },
      () => void 0
    );
  }
  scaleMode() {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_scaleMode, args: [this.key] },
      (res) => res
    );
  }
  setScaleMode(value) {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_setScaleMode, args: [this.key, value] },
      () => void 0
    );
  }
  flush() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGView_flush, args: [this.key] }, (res) => res);
  }
  getDebugData() {
    return postMessage(
      this.worker,
      { name: WorkerMessageType.PAGView_getDebugData, args: [this.key] },
      (res) => res
    );
  }
  destroy() {
    postMessage(this.worker, { name: WorkerMessageType.PAGView_destroy, args: [this.key] }, () => {
      this.isDestroyed = true;
    });
  }
};
WorkerPAGView = __decorateClass$1([
  destroyVerify
], WorkerPAGView);
const resizeCanvas = (canvas) => {
  const displaySize = calculateDisplaySize(canvas);
  canvas.style.width = `${displaySize.width}px`;
  canvas.style.height = `${displaySize.height}px`;
  canvas.width = displaySize.width * globalThis.devicePixelRatio;
  canvas.height = displaySize.height * globalThis.devicePixelRatio;
};

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
let WorkerPAGImage = class {
  constructor(worker, key) {
    this.isDestroyed = false;
    this.worker = worker;
    this.key = key;
  }
  static async fromSource(worker, source) {
    const width = window.HTMLVideoElement && source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height = window.HTMLVideoElement && source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    const canvas = new OffscreenCanvas(width, height);
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, source.width, source.height);
    const bitmap = await createImageBitmap(canvas);
    return postMessage(
      worker,
      { name: WorkerMessageType.PAGImage_fromSource, args: [bitmap] },
      (key) => new WorkerPAGImage(worker, key),
      [bitmap]
    );
  }
  destroy() {
    return postMessage(this.worker, { name: WorkerMessageType.PAGImage_destroy, args: [this.key] }, () => {
      this.isDestroyed = true;
    });
  }
};
WorkerPAGImage = __decorateClass([
  destroyVerify
], WorkerPAGImage);

const MAX_ACTIVE_WORKER_CONTEXTS = 4;
const videoReaders = [];
const createPAGWorker = (pagWorkerOptions = {}) => {
  let scriptUrl = pagWorkerOptions.locateFile ? pagWorkerOptions.locateFile("libpag.js") : "libpag.js";
  const option = {};
  if (pagWorkerOptions.locateFile) {
    option.fileUrl = pagWorkerOptions.locateFile("libpag.wasm");
  }
  const worker = new Worker(scriptUrl, pagWorkerOptions.workerOptions);
  return postMessage(worker, { name: WorkerMessageType.PAGInit, args: [option] }, () => {
    addGlobalWorkerListener(worker);
    return worker;
  });
};
const addGlobalWorkerListener = (worker) => {
  const handle = (event) => {
    if (event.data.name.includes(WorkerMessageType.VideoReader_constructor)) {
      const videoReader = new VideoReader(
        ...event.data.args
      );
      videoReaders.push(videoReader);
      worker.postMessage({ name: event.data.name, args: [videoReaders.length - 1] });
      return;
    }
    if (event.data.name.includes(WorkerMessageType.VideoReader_prepare)) {
      const [proxyId, targetFrame, playbackRate] = event.data.args;
      videoReaders[proxyId].prepare(targetFrame, playbackRate).then(() => {
        videoReaders[proxyId].generateBitmap().then((bitmap) => {
          worker.postMessage({ name: event.data.name, args: [bitmap] }, [bitmap]);
        });
      });
    }
    if (event.data.name.includes(WorkerMessageType.VideoReader_play)) {
      videoReaders[event.data.args[0]].play().then((res) => {
        worker.postMessage({ name: event.data.name, args: [res] });
      });
    }
    if (event.data.name.includes(WorkerMessageType.VideoReader_pause)) {
      videoReaders[event.data.args[0]].pause();
    }
    if (event.data.name.includes(WorkerMessageType.VideoReader_stop)) {
      videoReaders[event.data.args[0]].stop();
    }
    if (event.data.name.includes(WorkerMessageType.VideoReader_getError)) {
      worker.postMessage({ name: event.data.name, args: [videoReaders[event.data.args[0]].getError()] });
    }
  };
  worker.addEventListener("message", handle);
};

export { MAX_ACTIVE_WORKER_CONTEXTS, WorkerPAGFile, WorkerPAGImage, WorkerPAGView, createPAGWorker };
//# sourceMappingURL=libpag.worker.esm.js.map
