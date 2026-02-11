import * as THREE from 'three';
import animateParticles from './particle';
import StarrySky from './starrySky';
import Experience from './nebula/experience'

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

export { animateParticles, renderer, StarrySky, THREE, Experience };



