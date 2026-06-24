import { Experience } from '@go-tech-frontend/three';

declare global {
  interface Window {
    _experience: Experience | null; // 或者更具体的类型，如果知道 Experience 类的具体类型
  }
}
