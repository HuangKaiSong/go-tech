import CANNON from 'cannon'
import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import type { TextGeometryParameters } from 'three/examples/jsm/geometries/TextGeometry.js'

import Experience from '../experience.js'
import Float from './float.js'

export default class TextMesh {
  experience: Experience;
  scene: Experience['scene'];
  iMouse: Experience['iMouse'];
  resources: Experience['resources'];
  world: Experience['physics']['world'];
  camera: Experience['camera']['instance'];
  texts: string[];
  font: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  fontOptions: Omit<TextGeometryParameters, 'font'>;
  force: number;
  totalMass: number;
  textGroups: TextGroup[];
  offset: number;
  raycaster: THREE.Raycaster;
  float: Float;
  colors: Array<{ from: THREE.Color; to: THREE.Color }>;
  lastIntersectedObject: THREE.Object3D | null;

  constructor(options: TextMeshOptions = {}) {
    // Global variables
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.iMouse = this.experience.iMouse
    this.resources = this.experience.resources
    this.world = this.experience.physics.world
    this.camera = this.experience.camera.instance

    // Default options
    const defaultOptions: Required<TextMeshOptions> = {
      texts: ['three'],
      font: 'fontSource',
      position: new THREE.Vector3(-3, 10, 4),
      rotation: new THREE.Euler(0, Math.PI / 6, 0),
      fontOptions: {
        size: 2.5,
        depth: 0.3,
        curveSegments: 24,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.2,
        bevelOffset: 0,
        bevelSegments: 20,
      },
      force: 25,
      totalMass: 1,
    }

    const { texts, font, position, rotation, fontOptions, force, totalMass } = {
      ...defaultOptions,
      ...options,
    }

    this.texts = texts
    this.font = font
    this.position = position
    this.rotation = rotation
    this.fontOptions = fontOptions
    this.force = force
    this.totalMass = totalMass

    this.textGroups = []
    this.offset = this.texts.length * 6 * 0.5 // Margin of 6
    this.raycaster = new THREE.Raycaster()
    this.float = new Float({ speed: 1.5, floatIntensity: 2 })
    this.colors = [
      { from: new THREE.Color('#ff699f'), to: new THREE.Color('#a769ff') },
      { from: new THREE.Color('#683fee'), to: new THREE.Color('#527ee1') },
      { from: new THREE.Color('#ee663f'), to: new THREE.Color('#f5678d') },
      { from: new THREE.Color('#ee9ca7'), to: new THREE.Color('#ffdde1') },
      { from: new THREE.Color('#f7971e'), to: new THREE.Color('#ffd200') },
      { from: new THREE.Color('#56ccf2'), to: new THREE.Color('#2f80ed') },
      { from: new THREE.Color('#fc5c7d'), to: new THREE.Color('#6a82fb') },
      { from: new THREE.Color('#dce35b'), to: new THREE.Color('#45b649') },
    ]
    this.lastIntersectedObject = null

    this.resources.on('ready', () => {
      const fontSource = this.resources.items[this.font] as Font | undefined
      if (fontSource) {
        this.setupTextMeshes(fontSource)
        this.setConstraints()
        // this.events();
      }
      else {
        console.error('Font source not loaded')
      }
    })
  }

  setupTextMeshes(fontSource: Font): void {
    // Use this.fontOptions instead of hardcoded fontOptions
    const fontOptions = { ...this.fontOptions, font: fontSource }

    const spaceOffset = 2

    const groundMaterial = new CANNON.Material('ground')
    const letterMaterial = new CANNON.Material('letter')
    const contactMaterial = new CANNON.ContactMaterial(
      groundMaterial,
      letterMaterial,
      {
        friction: 0.002,
        frictionEquationStiffness: 1e6,
        frictionEquationRelaxation: 3,
        restitution: 0.2,
        contactEquationStiffness: 1e20,
        contactEquationRelaxation: 3,
      },
    )
    this.world.addContactMaterial(contactMaterial)
    for (const [index, text] of this.texts.entries()) {
      const words = new THREE.Group() as TextGroup
      words.letterOff = 0

      // Create a ground body for each line of text
      words.ground = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(20, 0.1, 10)),
        position: new CANNON.Vec3(0, this.getOffsetY(index), 0),
        material: groundMaterial,
      })
      this.world.addBody(words.ground)

      const randomColor = this.colors[index + 4]

      for (const [index_, letter] of [...text].entries()) {
        const progress = index_ / (text.length - 1)
        const color = randomColor.from.clone().lerp(randomColor.to, progress)
        const material = new THREE.MeshPhongMaterial({
          color,
          transparent: true,
          opacity: 0.9,
        })
        const transparentMaterial = new THREE.MeshPhongMaterial({
          color: 0x97_DF_5E,
          transparent: true,
          opacity: 0,
          shininess: 200,
          specular: '#ffffff',
        })
        if (letter === ' ') {
          // 如果是空格，只增加偏移量
          words.letterOff += spaceOffset
        }
        else {
          const geometry = new TextGeometry(letter, fontOptions)

          geometry.computeBoundingBox()
          geometry.computeBoundingSphere()
          let temporaryMaterial = material
          if (letter === '&') {
            temporaryMaterial = transparentMaterial
          }
          const mesh = new THREE.Mesh(geometry, temporaryMaterial) as LetterMesh
          mesh.size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3())
          mesh.userData.name = letter

          words.letterOff += mesh.size.x

          const box = new CANNON.Box(
            new CANNON.Vec3(mesh.size.x, mesh.size.y, mesh.size.z).scale(0.5),
          )

          const initialPosition = new CANNON.Vec3(
            words.letterOff,
            this.getOffsetY(index),
            0,
          )

          mesh.body = new CANNON.Body({
            mass: this.totalMass / text.length,
            position: initialPosition,
            material: letterMaterial,
            angularDamping: 0.99,
          }) as CannonBody

          mesh.body.initPosition = initialPosition.clone()
          mesh.body.userData = { name: letter }
          const { center } = mesh.geometry.boundingSphere!
          mesh.body.addShape(
            box,
            new CANNON.Vec3(center.x, center.y, center.z),
          )

          this.world.addBody(mesh.body)
          words.add(mesh)
        }
      }

      // Recenter each body based on the whole string
      for (const letter of words.children as LetterMesh[]) {
        letter.body.position.x -= letter.size.x + words.letterOff * 0.5
      }

      this.textGroups.push(words)
      this.scene.add(words)
    }

    // Center the entire text block
    this.centerTextBlock()

    // Apply position and rotation
    for (const words of this.textGroups) {
      words.position.add(this.position)
      words.rotation.copy(this.rotation)
    }
  }

  setConstraints(): void {
    for (const group of this.textGroups) {
      const letters = group.children as LetterMesh[]
      for (let index = 0; index < letters.length; index++) {
        // 我们获取当前字母和下一个字母（如果不是倒数第二个）
        const letter = letters[index]
        const nextLetter =
          index === letters.length - 1
            ? null
            : letters[index + 1]

        if (!nextLetter)
          continue

        // 使用 ConeTwistConstraint，因为它比其他约束更刚性，适合我们的目的
        const constraint = new CANNON.ConeTwistConstraint(
          letter.body,
          nextLetter.body,
          {
            pivotA: new CANNON.Vec3(letter.size.x, 0, 0),
            pivotB: new CANNON.Vec3(0, 0, 0),
          },
        )

        // 可选，但在我看来这会给我们一个更真实的渲染效果
        constraint.collideConnected = true

        this.world.addConstraint(constraint)
      }
    }
  }

  centerTextBlock(): void {
    const boundingBox = new THREE.Box3()

    for (const words of this.textGroups) {
      boundingBox.expandByObject(words)
    }

    const center = boundingBox.getCenter(new THREE.Vector3())

    for (const words of this.textGroups) {
      words.position.sub(center)
    }
  }

  events(): void {
    window.addEventListener('click', () => this.onClick())
    window.addEventListener('mousemove', () => this.onMouseMove())
  }

  onClick(): void {
    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    )

    if (intersects.length > 0) {
      const object_ = intersects[0]
      const { object, face } = object_

      if (!isMesh(object))
        return
      if (!face)
        return

      const impulse = new THREE.Vector3()
        .copy(face.normal)
        .negate()
        .multiplyScalar(this.force)

      for (const group of this.textGroups) {
        for (const letter of group.children as LetterMesh[]) {
          const { body } = letter
          console.log(body)

          if (letter !== object)
            continue

          // We apply the vector 'impulse' on the base of our body
          body.applyLocalImpulse(
            new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
            new CANNON.Vec3(),
          )
        }
      }
    }
  }

  onMouseMove(): void {
    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    )

    if (intersects.length > 0) {
      const object_ = intersects[0]
      const { object } = object_

      if (!isMesh(object))
        return

      for (const group of this.textGroups) {
        for (const letter of group.children as LetterMesh[]) {
          if (letter === object) {
            const { body } = letter
            const upwardImpulse = new CANNON.Vec3(0, 0.5, 0)
            body.applyImpulse(upwardImpulse, body.position)
            return // 找到并应用力后立即返回
          }
        }
      }
      // // 如果射线命中的对象与上一次不同，才施加力
      // if (object !== this.lastIntersectedObject) {
      //   this.applyUpwardForce(object);
      //   this.lastIntersectedObject = object;
      // }
    }
    else {
      // 如果射线没有命中任何对象，重置 lastIntersectedObject
      this.lastIntersectedObject = null
    }
  }

  applyUpwardForce(object: THREE.Object3D): void {
    for (const group of this.textGroups) {
      for (const letter of group.children as LetterMesh[]) {
        if (letter === object) {
          const { body } = letter
          const upwardImpulse = new CANNON.Vec3(0, 2.5, 0)
          body.applyImpulse(upwardImpulse, body.position)
          return // 找到并应用力后立即返回
        }
      }
    }
  }

  update(): void {
    if (this.float) {
      this.updateFloat()
    }
    if (this.textGroups) {
      this.updateTextGroups()
    }
  }

  updateFloat(): void {
    this.float.update()
  }

  updateTextGroups(): void {
    for (const [index, group] of this.textGroups.entries()) {
      this.updateGroup(group, index)
    }
  }

  updateGroup(group: TextGroup, groupIndex: number): void {
    let shouldReset = false
    let shouldAddGround = false

    for (const [letterIndex, letter] of (group.children as LetterMesh[]).entries()) {
      this.updateLetter(letter)

      if (letter.body.position.y <= -50) {
        shouldReset = true
      }

      if (
        !group.isGroundDisplayed
        && letter.body.position.y + letter.body.initPosition.y <= 10
      ) {
        shouldAddGround = true
      }
    }

    if (shouldReset) {
      this.reset()
    }

    if (shouldAddGround) {
      this.addGroundToGroup(group)
    }
  }

  updateLetter(letter: LetterMesh): void {
    letter.position.copy(letter.body.position)
    letter.quaternion.copy(letter.body.quaternion)
  }

  addGroundToGroup(group: TextGroup): void {
    if (!group.isGroundDisplayed) {
      console.log('Adding ground to group')
      this.world.addBody(group.ground)
      group.isGroundDisplayed = true
    }
  }

  reset(): void {
    for (const group of this.textGroups) {
      group.isGroundDisplayed = false
      this.world.remove(group.ground)

      const randomColor = this.pickRandomColor()

      for (const [index, letter] of (group.children as LetterMesh[]).entries()) {
        const progress = index / (group.children.length - 1)

        letter.body.sleep()
        const { x, y, z } = letter.body.initPosition

        letter.material.color = randomColor.from
          .clone()
          .lerp(randomColor.to, progress)

        letter.material.needsUpdate = true

        letter.body.position.set(x - group.letterOff * 0.5, y, z)
        letter.body.quaternion.set(0, 0, 0, 1)

        letter.body.angularVelocity.setZero()
        letter.body.torque.setZero()
        letter.body.force.setZero()
        letter.body.wakeUp()
      }
    }
  }

  getOffsetY(index: number): number {
    return (this.texts.length - index - 1) * 6 - this.offset
  }

  pickRandomColor(): { from: THREE.Color; to: THREE.Color } {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }
}

interface TextMeshOptions {
  texts?: string[]
  font?: string
  position?: THREE.Vector3
  rotation?: THREE.Euler
  fontOptions?: Omit<TextGeometryParameters, 'font'>
  force?: number
  totalMass?: number
}

type TextGroup = THREE.Group & {
  letterOff: number
  ground: CANNON.Body
  isGroundDisplayed?: boolean
}

type CannonBody = CANNON.Body & {
  initPosition?: CANNON.Vec3
  userData?: { name: string }
}

type LetterMesh = THREE.Mesh<TextGeometry, THREE.MeshPhongMaterial> & {
  body: CannonBody
  size: THREE.Vector3
}

const isMesh = (object: THREE.Object3D): object is THREE.Mesh =>
  (object as THREE.Mesh).isMesh === true
