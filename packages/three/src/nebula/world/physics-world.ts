import CANNON from 'cannon'

import Experience from '../experience.js'

export default class PhysicsWorld {
  experience: Experience
  scene: Experience['scene']
  world: CANNON.World
  deltaTime: Experience['time']['delta']

  constructor(gravity = 9.81) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.world = new CANNON.World()
    this.deltaTime = this.experience.time.delta
    // this.world.gravity.set(0, -gravity, 0);
    this.world.gravity.set(0, -gravity, 0)
  }

  update() {
    this.world.step(1 / 60, this.deltaTime, 3)
  }
}