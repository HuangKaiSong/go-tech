import * as THREE from 'three';

import Experience from '../experience.js';
import { getBound } from '../tools/misc.js';

/** Center class for centering and aligning 3D objects */
interface CenterConfig {
  back?: boolean;
  bottom?: boolean;
  disable?: boolean;
  disableX?: boolean;
  disableY?: boolean;
  disableZ?: boolean;
  front?: boolean;
  left?: boolean;
  precise?: boolean;
  right?: boolean;
  top?: boolean;
}

type BoundInfo = ReturnType<typeof getBound>;

export default class Center {
  experience: Experience;
  scene: Experience['scene'];

  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  front: boolean;
  back: boolean;
  disable: boolean;
  disableX: boolean;
  disableY: boolean;
  disableZ: boolean;
  precise: boolean;

  group: THREE.Group;
  groupOuter: THREE.Group;
  groupInner: THREE.Group;

  bound: BoundInfo | undefined;

  /**
   * @param {object} config - Configuration options for centering
   * @param {boolean} [config.top] - Align to top
   * @param {boolean} [config.right] - Align to right
   * @param {boolean} [config.bottom] - Align to bottom
   * @param {boolean} [config.left] - Align to left
   * @param {boolean} [config.front] - Align to front
   * @param {boolean} [config.back] - Align to back
   * @param {boolean} [config.disable] - Disable all centering
   * @param {boolean} [config.disableX] - Disable centering on X axis
   * @param {boolean} [config.disableY] - Disable centering on Y axis
   * @param {boolean} [config.disableZ=false] - Disable centering on Z axis. Default is `false`
   * @param {boolean} [config.precise=true] - Use precise bounding calculation. Default is `true`
   */
  constructor(config: CenterConfig = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    // Set up configuration parameters
    this.top = config.top || false;
    this.right = config.right || false;
    this.bottom = config.bottom || false;
    this.left = config.left || false;
    this.front = config.front || false;
    this.back = config.back || false;
    this.disable = config.disable || false;
    this.disableX = config.disableX || false;
    this.disableY = config.disableY || false;
    this.disableZ = config.disableZ || false;
    this.precise = config.precise === undefined ? true : config.precise;

    // Create groups for nested transformations
    this.group = new THREE.Group();
    this.groupOuter = new THREE.Group();
    this.groupInner = new THREE.Group();

    this.addExisting();
    this.adjustPosition();
  }

  /** Add groups to the scene and set up hierarchy */
  addExisting(): void {
    this.scene.add(this.group);
    this.group.add(this.groupOuter);
    this.groupOuter.add(this.groupInner);
  }

  /**
   * Add objects to the inner group
   *
   * @param {...THREE.Object3D} objects - 3D objects to add
   */
  add(...objects: THREE.Object3D[]): void {
    this.groupInner.add(...objects);
    this.adjustPosition();
  }

  /** Adjust the position of objects based on centering configuration */
  adjustPosition(): void {
    this.groupOuter.matrix.identity();

    const bound = getBound(this.groupInner, this.precise);
    this.bound = bound;

    const { center, depth, height, width } = bound;

    // oxlint-disable-next-line no-nested-ternary
    const vAlign = this.top ? height / 2 : this.bottom ? -height / 2 : 0;
    // oxlint-disable-next-line no-nested-ternary
    const hAlign = this.left ? -width / 2 : this.right ? width / 2 : 0;
    // oxlint-disable-next-line no-nested-ternary
    const dAlign = this.front ? depth / 2 : this.back ? -depth / 2 : 0;

    this.groupOuter.position.set(
      this.disable || this.disableX ? 0 : -center.x + hAlign,
      this.disable || this.disableY ? 0 : -center.y + vAlign,
      this.disable || this.disableZ ? 0 : -center.z + dAlign
    );
  }
}
