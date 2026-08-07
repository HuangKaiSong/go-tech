import * as THREE from 'three';

import Camera from './camera';
import { type NebulaQualityPreference, type NebulaQualityProfile, resolveNebulaQuality } from './quality';
import Renderer from './renderer';
import sources from './sources';
import Debug from './utils/debug';
import IMouse from './utils/imouse';
import Resources from './utils/resources';
import Sizes from './utils/sizes';
import Stats from './utils/stats';
import Time from './utils/time';
import PhysicsWorld from './world/physics-world';
import World from './world/world';

export interface ExperienceOptions {
  quality?: NebulaQualityPreference;
}

let instance: Experience | null = null;

export default class Experience {
  canvas!: HTMLCanvasElement;
  debug!: Debug;
  stats!: Stats;
  sizes!: Sizes;
  time!: Time;
  scene!: THREE.Scene;
  camera!: Camera;
  renderer!: Renderer;
  resources!: Resources;
  physics!: PhysicsWorld;
  iMouse!: IMouse;
  world!: World;
  quality!: NebulaQualityProfile;
  constructor(canvas?: HTMLCanvasElement, options: ExperienceOptions = {}) {
    // Singleton
    if (instance) {
      // oxlint-disable-next-line no-constructor-return
      return instance;
    }

    instance = this;

    // Global access
    (window as any).Experience = this;

    const resolvedCanvas = canvas ?? document.querySelector('canvas');
    if (!(resolvedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Experience requires an HTMLCanvasElement.');
    }
    this.canvas = resolvedCanvas;
    this.quality = resolveNebulaQuality(options.quality);
    this.canvas.dataset.nebulaQuality = this.quality.tier;

    // Panel
    this.debug = new Debug();
    this.stats = new Stats();
    this.sizes = new Sizes(this.quality);
    this.time = new Time(this.quality.targetFps);
    this.scene = new THREE.Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.resources = new Resources(sources);
    this.physics = new PhysicsWorld();
    this.iMouse = new IMouse();
    this.world = new World();

    this.sizes.on('resize', () => {
      this.resize();
    });

    this.time.on('tick', () => {
      this.update();
    });
  }

  resize(): void {
    this.camera.resize();
    this.world.resize();
    this.renderer.resize();
  }

  update(): void {
    this.camera.update();
    this.world.update();
    this.renderer.update(); // 切换为手动更新
    this.stats.update();
    this.iMouse.update();
  }

  destroy(): void {
    this.sizes.off('resize');
    this.time.stop();
    this.renderer.instance.forceContextLoss();
    this.renderer.instance.dispose();
    this.debug.active && this.debug.ui?.dispose();
    instance = null;
  }
}
