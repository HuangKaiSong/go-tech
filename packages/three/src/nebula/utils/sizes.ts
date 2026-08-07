import type { NebulaQualityProfile } from '../quality';
import EventEmitter from './event-emitter.js';

export default class Sizes extends EventEmitter {
  width: number;
  height: number;
  aspect: number;
  pixelRatio: number;
  maxPixelRatio: number;
  minPixelRatio: number;
  maxRenderPixels: number;

  constructor(quality: NebulaQualityProfile) {
    super();

    // Setup
    this.maxPixelRatio = quality.maxPixelRatio;
    this.minPixelRatio = quality.minPixelRatio;
    this.maxRenderPixels = quality.maxRenderPixels;
    this.width = 0;
    this.height = 0;
    this.aspect = 1;
    this.pixelRatio = 1;

    this.update();

    // Resize event
    window.addEventListener('resize', () => {
      this.update();

      this.trigger('resize');
    });
  }

  update() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    this.pixelRatio = this.getPixelRatio();
  }

  getPixelRatio() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const cappedPixelRatio = Math.min(devicePixelRatio, this.maxPixelRatio);
    const renderPixelRatio = Math.sqrt(this.maxRenderPixels / (this.width * this.height));

    return Math.max(this.minPixelRatio, Math.min(cappedPixelRatio, renderPixelRatio));
  }
}
