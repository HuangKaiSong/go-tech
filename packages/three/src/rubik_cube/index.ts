import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let instance: RubikCube | null = null;

type Move = 'R' | 'L' | 'U' | 'D' | 'F' | 'B';
type Axis = 'x' | 'y' | 'z';

interface RotationState {
  move: Move;
  axis: Axis;
  layer: number;
  direction: 1 | -1;
  pivot: THREE.Group;
  cubies: THREE.Mesh[];
  targetAngle: number;
  currentAngle: number;
}

interface DragState {
  move: Move;
  rotationSign: 1 | -1;
  axisVector: THREE.Vector3;
  samplePoint: THREE.Vector3;
  startX: number;
  startY: number;
}

const CUBE_ORDER = 3;
const HALF = (CUBE_ORDER - 1) / 2;
const CUBIE_SIZE = 0.92;
const CUBIE_GAP = 0.08;
const STEP = CUBIE_SIZE + CUBIE_GAP;
const TURN_SPEED = Math.PI * 3.2;

export default class RubikCube {
  canvas!: HTMLCanvasElement;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  cubeGroup!: THREE.Group;
  cubies: THREE.Mesh[] = [];
  clock!: THREE.Clock;
  animationFrameId: number | null = null;
  activeRotation: RotationState | null = null;
  moveQueue: Array<{ move: Move; direction: 1 | -1 }> = [];
  isInitialized = false;
  raycaster = new THREE.Raycaster();
  pointerNdc = new THREE.Vector2();
  dragState: DragState | null = null;
  controlsWasEnabled = true;
  onResize = () => this.resize();
  onKeydown = (event: KeyboardEvent) => this.handleKeydown(event);
  onPointerDown = (event: PointerEvent) => this.handlePointerDown(event);
  onPointerUp = (event: PointerEvent) => this.handlePointerUp(event);
  onPointerCancel = () => this.handlePointerCancel();

  constructor(canvas?: HTMLCanvasElement) {
    if (instance) {
      return instance;
    }

    instance = this;

    (window as any).RubikCube = this;

    const resolvedCanvas = canvas ?? document.querySelector('canvas');
    if (!(resolvedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('RubikCube requires an HTMLCanvasElement.');
    }

    this.canvas = resolvedCanvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111318);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(5.2, 5.1, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 16;
    this.controls.target.set(0, 0, 0);

    this.cubeGroup = new THREE.Group();
    this.clock = new THREE.Clock();
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    this.addLights();
    this.createRubikCube();

    this.scene.add(this.cubeGroup);
    this.camera.lookAt(0, 0, 0);
    this.controls.update();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeydown);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);

    this.tick();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  update() {
    const delta = this.clock.getDelta();

    if (!this.activeRotation && this.moveQueue.length > 0) {
      const next = this.moveQueue.shift();
      if (next) {
        this.startRotation(next.move, next.direction);
      }
    }

    if (this.activeRotation) {
      this.updateRotation(delta);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeydown);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);
    this.controls.dispose();
    this.renderer.dispose();
    this.isInitialized = false;
  }

  rotate(move: Move, direction: 1 | -1 = 1) {
    this.moveQueue.push({ move, direction });
  }

  scramble(steps = 24) {
    const moves: Move[] = ['R', 'L', 'U', 'D', 'F', 'B'];
    for (let i = 0; i < steps; i += 1) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const direction = Math.random() > 0.5 ? 1 : -1;
      this.moveQueue.push({ move, direction });
    }
  }

  private tick() {
    this.update();
    this.animationFrameId = window.requestAnimationFrame(() => this.tick());
  }

  private addLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2a2a35, 0.55);
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.15);
    mainLight.position.set(5, 9, 6);

    this.scene.add(hemiLight, ambient, mainLight);
  }

  private createRubikCube() {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

    for (let x = -HALF; x <= HALF; x += 1) {
      for (let y = -HALF; y <= HALF; y += 1) {
        for (let z = -HALF; z <= HALF; z += 1) {
          const materials = this.createCubieMaterials(x, y, z);
          const cubie = new THREE.Mesh(geometry, materials);
          cubie.position.set(x * STEP, y * STEP, z * STEP);
          cubie.userData.grid = new THREE.Vector3(x, y, z);
          this.cubies.push(cubie);
          this.cubeGroup.add(cubie);
        }
      }
    }
  }

  private createCubieMaterials(x: number, y: number, z: number) {
    const body = 0x1c1c1c;
    const up = 0xffffff;
    const down = 0xffe45d;
    const right = 0xd1302d;
    const left = 0xf1782c;
    const front = 0x1d9f4f;
    const back = 0x265ee8;

    const sideColor = (condition: boolean, color: number) => new THREE.MeshStandardMaterial({
      color: condition ? color : body,
      roughness: 0.6,
      metalness: 0.05,
    });

    return [
      sideColor(x === HALF, right),
      sideColor(x === -HALF, left),
      sideColor(y === HALF, up),
      sideColor(y === -HALF, down),
      sideColor(z === HALF, front),
      sideColor(z === -HALF, back),
    ];
  }

  private handleKeydown(event: KeyboardEvent) {
    const key = event.key.toUpperCase();

    if (key === ' ') {
      event.preventDefault();
      this.scramble();
      return;
    }

    if (!['R', 'L', 'U', 'D', 'F', 'B'].includes(key)) {
      return;
    }

    const direction = event.shiftKey ? -1 : 1;
    this.rotate(key as Move, direction);
  }

  private handlePointerDown(event: PointerEvent) {
    if (this.activeRotation) {
      return;
    }

    const hit = this.pickCubie(event.clientX, event.clientY);
    if (!hit) {
      this.dragState = null;
      return;
    }

    const { cubie, faceNormal } = hit;
    const axis = this.getDominantAxis(faceNormal);
    const layer = cubie.userData.grid[axis] as number;
    if (Math.abs(layer) !== HALF) {
      this.dragState = null;
      return;
    }

    const move = this.getMoveFromAxisLayer(axis, layer);
    const rotationSign = this.getMoveConfig(move).rotationSign;
    const axisVector = this.axisToVector(axis);
    const samplePoint = cubie.getWorldPosition(new THREE.Vector3());

    this.dragState = {
      move,
      rotationSign,
      axisVector,
      samplePoint,
      startX: event.clientX,
      startY: event.clientY,
    };

    this.controlsWasEnabled = this.controls.enabled;
    this.controls.enabled = false;
  }

  private handlePointerUp(event: PointerEvent) {
    if (!this.dragState) {
      return;
    }

    const delta = new THREE.Vector2(
      event.clientX - this.dragState.startX,
      event.clientY - this.dragState.startY,
    );
    if (delta.lengthSq() < 36) {
      this.dragState = null;
      this.controls.enabled = this.controlsWasEnabled;
      return;
    }

    const angleSign = this.getAngleSignFromDrag(
      this.dragState.axisVector,
      this.dragState.samplePoint,
      delta,
    );
    const direction = (angleSign * this.dragState.rotationSign) as 1 | -1;

    this.rotate(this.dragState.move, direction);
    this.dragState = null;
    this.controls.enabled = this.controlsWasEnabled;
  }

  private handlePointerCancel() {
    this.dragState = null;
    this.controls.enabled = this.controlsWasEnabled;
  }

  private startRotation(move: Move, direction: 1 | -1) {
    const config = this.getMoveConfig(move);
    const pivot = new THREE.Group();
    this.cubeGroup.add(pivot);

    const targetCubies = this.cubies.filter((cubie) => {
      const value = cubie.userData.grid[config.axis] as number;
      return value === config.layer;
    });

    for (const cubie of targetCubies) {
      pivot.attach(cubie);
    }

    this.activeRotation = {
      move,
      axis: config.axis,
      layer: config.layer,
      direction: (direction * config.rotationSign) as 1 | -1,
      pivot,
      cubies: targetCubies,
      targetAngle: (Math.PI / 2) * direction * config.rotationSign,
      currentAngle: 0,
    };
  }

  private updateRotation(delta: number) {
    if (!this.activeRotation) {
      return;
    }

    const { pivot, axis, targetAngle } = this.activeRotation;
    const remain = targetAngle - this.activeRotation.currentAngle;
    const maxStep = TURN_SPEED * delta;
    const step = Math.abs(remain) < maxStep ? remain : Math.sign(remain) * maxStep;

    pivot.rotation[axis] += step;
    this.activeRotation.currentAngle += step;

    if (Math.abs(targetAngle - this.activeRotation.currentAngle) < 1e-5) {
      this.finishRotation();
    }
  }

  private finishRotation() {
    if (!this.activeRotation) {
      return;
    }

    const { pivot, cubies } = this.activeRotation;
    for (const cubie of cubies) {
      this.cubeGroup.attach(cubie);
      this.snapCubieTransform(cubie);
      this.updateGridPosition(cubie);
    }

    this.cubeGroup.remove(pivot);
    this.activeRotation = null;
  }

  private snapCubieTransform(cubie: THREE.Mesh) {
    cubie.position.set(
      this.snap(cubie.position.x),
      this.snap(cubie.position.y),
      this.snap(cubie.position.z),
    );

    cubie.rotation.set(
      this.snapAngle(cubie.rotation.x),
      this.snapAngle(cubie.rotation.y),
      this.snapAngle(cubie.rotation.z),
    );
  }

  private updateGridPosition(cubie: THREE.Mesh) {
    cubie.userData.grid = new THREE.Vector3(
      Math.round(cubie.position.x / STEP),
      Math.round(cubie.position.y / STEP),
      Math.round(cubie.position.z / STEP),
    );
  }

  private snap(value: number) {
    return Math.round(value / STEP) * STEP;
  }

  private snapAngle(angle: number) {
    const quarter = Math.PI / 2;
    return Math.round(angle / quarter) * quarter;
  }

  private pickCubie(clientX: number, clientY: number) {
    this.pointerNdc.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.cubies, false);
    const firstHit = hits[0];
    if (!firstHit || !firstHit.face || !(firstHit.object instanceof THREE.Mesh)) {
      return null;
    }

    const cubie = firstHit.object as THREE.Mesh;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(cubie.matrixWorld);
    const faceNormal = firstHit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

    return { cubie, faceNormal };
  }

  private getDominantAxis(normal: THREE.Vector3): Axis {
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    if (absX >= absY && absX >= absZ) {
      return 'x';
    }
    if (absY >= absX && absY >= absZ) {
      return 'y';
    }
    return 'z';
  }

  private axisToVector(axis: Axis) {
    if (axis === 'x') {
      return new THREE.Vector3(1, 0, 0);
    }
    if (axis === 'y') {
      return new THREE.Vector3(0, 1, 0);
    }
    return new THREE.Vector3(0, 0, 1);
  }

  private getMoveFromAxisLayer(axis: Axis, layer: number): Move {
    if (axis === 'x') {
      return layer > 0 ? 'R' : 'L';
    }
    if (axis === 'y') {
      return layer > 0 ? 'U' : 'D';
    }
    return layer > 0 ? 'F' : 'B';
  }

  private getAngleSignFromDrag(
    axisVector: THREE.Vector3,
    samplePoint: THREE.Vector3,
    dragPixels: THREE.Vector2,
  ): 1 | -1 {
    const radius = samplePoint.clone();
    const projectedRadius = radius.clone().sub(axisVector.clone().multiplyScalar(radius.dot(axisVector)));
    const tangent = axisVector.clone().cross(projectedRadius);

    if (tangent.lengthSq() < 1e-6) {
      return dragPixels.x + dragPixels.y >= 0 ? 1 : -1;
    }

    const p0 = samplePoint.clone().project(this.camera);
    const p1 = samplePoint.clone().add(tangent.normalize().multiplyScalar(0.35)).project(this.camera);
    const motionNdc = new THREE.Vector2(p1.x - p0.x, p1.y - p0.y);

    if (motionNdc.lengthSq() < 1e-7) {
      return dragPixels.x + dragPixels.y >= 0 ? 1 : -1;
    }

    const dragNdc = new THREE.Vector2(
      (dragPixels.x / window.innerWidth) * 2,
      (-dragPixels.y / window.innerHeight) * 2,
    );

    return dragNdc.dot(motionNdc) >= 0 ? 1 : -1;
  }

  private getMoveConfig(move: Move): { axis: Axis; layer: number; rotationSign: 1 | -1 } {
    switch (move) {
      case 'R':
        return { axis: 'x', layer: HALF, rotationSign: -1 };
      case 'L':
        return { axis: 'x', layer: -HALF, rotationSign: 1 };
      case 'U':
        return { axis: 'y', layer: HALF, rotationSign: -1 };
      case 'D':
        return { axis: 'y', layer: -HALF, rotationSign: 1 };
      case 'F':
        return { axis: 'z', layer: HALF, rotationSign: -1 };
      case 'B':
        return { axis: 'z', layer: -HALF, rotationSign: 1 };
      default:
        return { axis: 'x', layer: HALF, rotationSign: 1 };
    }
  }
}
