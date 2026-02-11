import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { THREE } from '.';

class Params {
  color = '#000';
  length = 10;
  size = 3;
  visible = true;
  x = 0;
  y = 0;
  z = 100;
  widthSegments = 64;
  heightSegments = 32;
  radius = 16;
}

export type StarrySkyOptions = {
  width?: number;
  height?: number;
  autoStart?: boolean;
  enableControls?: boolean;
};

type CloudParameter = {
  cloud: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
};

export default class StarrySky {
  private container: HTMLElement;
  private width: number;
  private height: number;
  private depth = 1400;

  private scene!: THREE.Scene;
  private sphereGroup!: THREE.Group;
  private sphereGeometry!: THREE.SphereGeometry;
  private sphere!: THREE.Mesh;
  private sphereMaterial!: THREE.MeshPhongMaterial;
  private camera!: THREE.PerspectiveCamera;
  private zAxisNumber = 0;
  private cameraTarget = new THREE.Vector3(0, 0, 0);

  private materials: THREE.PointsMaterial[] = [];
  private parameters: Array<[number[], THREE.Texture, number]> = [];
  private zprogress = 0;
  private zprogressSecond = 0;
  private particlesFirst: THREE.Points[] = [];
  private particlesSecond: THREE.Points[] = [];
  private particlesInitPosition = 0;

  private cloudParameterFirst!: CloudParameter;
  private cloudParameterSecond!: CloudParameter;
  private renderCloudMoveFirst: () => void = () => undefined;
  private renderCloudMoveSecond: () => void = () => undefined;
  private uiAttached = false;

  private stats?: Stats;
  private renderer!: THREE.WebGLRenderer;
  private gui?: GUI;
  private animationId: number | null = null;
  private textures = {
    sky: new URL('./assets/images/sky.png', import.meta.url).href,
    earth: new URL('./assets/images/earth_bg.png', import.meta.url).href,
    cloud: new URL('./assets/images/cloud.png', import.meta.url).href,
    star1: new URL('./assets/images/starflake1.png', import.meta.url).href,
    star2: new URL('./assets/images/starflake2.png', import.meta.url).href,
  };

  constructor(container: HTMLElement, options: StarrySkyOptions = {}) {
    this.container = container;
    const fallbackWidth = container.clientWidth || window.innerWidth;
    const fallbackHeight = container.clientHeight || window.innerHeight;
    this.width = options.width ?? fallbackWidth;
    this.height = options.height ?? fallbackHeight;

    this.init();

    if (options.autoStart ?? true) {
      this.start();
    }

    if (options.enableControls) {
      this.initOrbitControls(true);
    }
  }

  public start() {
    if (this.animationId !== null) {
      return;
    }
    this.animate();
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.stop();
    this.gui.destroy();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    if (this.uiAttached && this.container.contains(this.stats.dom)) {
      this.container.removeChild(this.stats.dom);
    }
  }

  private init() {
    this.initScene();
    this.initCamera();
    this.initSceneBg();
    this.initLight();
    this.initSphereModel();
    this.initSphereGroup();
    this.initSceneStars();
    this.initClouds();
    this.initRenderer();
  }

  private initGUI() {
    const params = new Params();
    params.x = this.sphereGroup.position.x;
    params.y = this.sphereGroup.position.y;
    params.z = this.sphereGroup.position.z;
    params.radius = this.sphereGeometry.parameters.radius;
    params.widthSegments = this.sphereGeometry.parameters.widthSegments;
    params.heightSegments = this.sphereGeometry.parameters.heightSegments;
    params.visible = this.sphereGroup.visible;
    params.color = `#${this.sphereMaterial.color.getHexString()}`;
    this.gui.add(params, 'x', -1500, 1500).onChange((x: number) => {
      this.sphereGroup.position.x = x;
    });
    this.gui.add(params, 'y', -50, 1500).onChange((y: number) => {
      this.sphereGroup.position.y = y;
    });
    this.gui.add(params, 'z', -200, 1000).onChange((z: number) => {
      this.sphereGroup.position.z = z;
    });
    const rebuildSphereGeometry = () => {
      const next = new THREE.SphereGeometry(
        params.radius,
        params.widthSegments,
        params.heightSegments,
      );
      this.sphereGeometry.dispose();
      this.sphereGeometry = next;
      this.sphere.geometry = next;
      this.renderer.render(this.scene, this.camera);
    };
    this.gui.add(params, 'widthSegments', 3, 64).onChange(rebuildSphereGeometry);
    this.gui.add(params, 'heightSegments', 2, 32).onChange(rebuildSphereGeometry);
    this.gui.add(params, 'radius', 5, 30).onChange(rebuildSphereGeometry);
    this.gui.add(params, 'visible').onChange((visible: boolean) => {
      this.sphereGroup.visible = visible;
      this.renderer.render(this.scene, this.camera);
    });
    this.gui.addColor(params, 'color').onChange((color: string) => {
      this.sphereMaterial.color.set(color);
      this.sphereMaterial.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    });
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 0, 10000);
  }

  private initSceneBg() {
    new THREE.TextureLoader().load(this.textures.sky, (texture) => {
      const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
    });
  }

  private initOrbitControls(enabled = false) {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enabled = enabled;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.update();
    if (enabled && !this.uiAttached) {
      this.stats = new Stats();
      this.gui = new GUI();
      this.initGUI();
      this.container.appendChild(this.stats.dom);
      this.uiAttached = true;
    }
  }

  private initCamera() {
    const fov = 15;
    const distance = this.width / 2 / Math.tan(Math.PI / 12);
    this.zAxisNumber = Math.floor(distance - this.depth / 2);
    this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 1, 30000);
    this.camera.position.set(0, 0, this.zAxisNumber);
    this.camera.lookAt(this.cameraTarget);
  }

  private initLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    const lightRightBottom = new THREE.PointLight(0x0655fd, 5, 0);
    lightRightBottom.position.set(0, 100, -200);
    this.scene.add(lightRightBottom);
    this.scene.add(ambientLight);
  }

  private initSphereModel() {
    const material = new THREE.MeshPhongMaterial();
    material.map = new THREE.TextureLoader().load(this.textures.earth);
    material.blendDstAlpha = 201;
    this.sphereGeometry = new THREE.SphereGeometry(50, 64, 32);
    this.sphereMaterial = material;
    this.sphere = new THREE.Mesh(this.sphereGeometry, material);
  }

  private initSphereGroup() {
    this.sphereGroup = new THREE.Group();
    this.sphereGroup.add(this.sphere);
    this.sphereGroup.position.set(-400, 200, -200);
    this.scene.add(this.sphereGroup);
  }

  private initTubeRoute(route: THREE.Vector3[], geometryWidth: number, geometryHeight: number) {
    const curve = new THREE.CatmullRomCurve3(route, false);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 50, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.scene.add(tube);

    const cloudGeometry = new THREE.PlaneGeometry(geometryWidth, geometryHeight);
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load(this.textures.cloud);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    });
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.scene.add(cloud);
    return { cloud, curve };
  }

  private initSceneStars() {
    this.particlesInitPosition = -this.depth / 2;
    this.zprogress = this.particlesInitPosition;
    this.zprogressSecond = this.particlesInitPosition - (this.zAxisNumber + this.depth / 2);
    this.particlesFirst = this.initSceneStar(this.zprogress);
    this.particlesSecond = this.initSceneStar(this.zprogressSecond);
  }

  private initSceneStar(initZposition: number): THREE.Points[] {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const pointsGeometry: THREE.Points[] = [];
    const textureLoader = new THREE.TextureLoader();
    const sprite1 = textureLoader.load(this.textures.star1);
    const sprite2 = textureLoader.load(this.textures.star2);
    this.parameters = [
      [[0.6, 100, 0.75], sprite1, 50],
      [[0, 0, 1], sprite2, 20],
    ];

    for (let i = 0; i < 500; i++) {
      const x = THREE.MathUtils.randFloatSpread(this.width);
      const y = THREE.MathUtils.randFloat(0, this.height / 2);
      const z = THREE.MathUtils.randFloat(-this.depth / 2, this.zAxisNumber);
      vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    for (let i = 0; i < this.parameters.length; i++) {
      const color = this.parameters[i][0];
      const sprite = this.parameters[i][1];
      const size = this.parameters[i][2];

      this.materials[i] = new THREE.PointsMaterial({
        size,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        transparent: true,
      });
      this.materials[i].color.setHSL(color[0], color[1], color[2]);
      const particles = new THREE.Points(geometry, this.materials[i]);
      particles.rotation.x = Math.random() * 0.2 - 0.15;
      particles.rotation.z = Math.random() * 0.2 - 0.15;
      particles.rotation.y = Math.random() * 0.2 - 0.15;
      particles.position.setZ(initZposition);
      pointsGeometry.push(particles);
      this.scene.add(particles);
    }
    return pointsGeometry;
  }

  private renderSphereRotate() {
    if (this.sphere) {
      this.sphereGroup.rotateY(0.001);
    }
  }

  private renderStarMove() {
    const time = Date.now() * 0.00005;
    this.zprogress += 1;
    this.zprogressSecond += 1;

    if (this.zprogress >= this.zAxisNumber + this.depth / 2) {
      this.zprogress = this.particlesInitPosition;
    } else {
      this.particlesFirst.forEach((item) => {
        item.position.setZ(this.zprogress);
      });
    }
    if (this.zprogressSecond >= this.zAxisNumber + this.depth / 2) {
      this.zprogressSecond = this.particlesInitPosition;
    } else {
      this.particlesSecond.forEach((item) => {
        item.position.setZ(this.zprogressSecond);
      });
    }

    for (let i = 0; i < this.materials.length; i++) {
      const color = this.parameters[i][0];
      const h = ((360 * (color[0] + time)) % 360) / 360;
      this.materials[i].color.setHSL(color[0], color[1], parseFloat(h.toFixed(2)));
    }
  }

  private initCloudMove(
    cloudParameter: CloudParameter,
    speed: number,
    scaleSpeed = 0.0006,
    maxScale = 1,
    startScale = 0,
  ) {
    let cloudProgress = 0;
    return () => {
      if (startScale < maxScale) {
        startScale += scaleSpeed;
        cloudParameter.cloud.scale.setScalar(startScale);
      }
      if (cloudProgress > 1) {
        cloudProgress = 0;
        startScale = 0;
      } else {
        cloudProgress += speed;
        const point = cloudParameter.curve.getPoint(cloudProgress);
        if (point && point.x) {
          cloudParameter.cloud.position.set(point.x, point.y, point.z);
        }
      }
    };
  }

  private initClouds() {
    const routeFirst = [
      new THREE.Vector3(-this.width / 2, this.height / 4, -200),
      new THREE.Vector3(-this.width / 4, this.height / 3, -80),
      new THREE.Vector3(0, this.height / 5, 0),
      new THREE.Vector3(this.width / 4, this.height / 3, 80),
      new THREE.Vector3(this.width / 2, this.height / 4, 200),
    ];
    const routeSecond = [
      new THREE.Vector3(-this.width / 3, this.height / 2, -400),
      new THREE.Vector3(-this.width / 6, this.height / 3, -200),
      new THREE.Vector3(0, this.height / 2, -50),
      new THREE.Vector3(this.width / 6, this.height / 3, 120),
      new THREE.Vector3(this.width / 3, this.height / 2, 300),
    ];

    this.cloudParameterFirst = this.initTubeRoute(routeFirst, 120, 60);
    this.cloudParameterSecond = this.initTubeRoute(routeSecond, 200, 100);
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.renderCloudMoveFirst = this.initCloudMove(this.cloudParameterFirst, 0.0002);
    this.renderCloudMoveSecond = this.initCloudMove(this.cloudParameterSecond, 0.0008, 0.001);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.renderSphereRotate();
    this.renderStarMove();
    this.renderCloudMoveFirst();
    this.renderCloudMoveSecond();
    this.renderer.render(this.scene, this.camera);
  };
}
