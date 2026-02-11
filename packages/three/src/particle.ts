import { renderer, THREE } from ".";

// 创建场景
const scene = new THREE.Scene();

// 设置相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 10;

const particleCount = 5000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20; // 随机位置，构成 3D 空间中的一个粒子
}

particlesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3),
);

const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.01,
  transparent: true,
  opacity: 0.8,
});


// 创建粒子系统并添加到场景
const particleSystem = new THREE.Points(particlesGeometry, particleMaterial);
scene.add(particleSystem);

export default function animateParticles() {
  particleSystem.rotation.y += 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animateParticles);
}

