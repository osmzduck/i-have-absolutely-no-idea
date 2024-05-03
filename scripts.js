import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as CANNON from 'cannon-es';

// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the sport car model
const loader = new GLTFLoader();
let carModel;
loader.load('sportcar.017.glb', (gltf) => {
  carModel = gltf.scene;
  carModel.scale.set(0.5, 0.5, 0.5);
  carModel.position.set(0, 0, 0);
  scene.add(carModel);
});

// Create the environment
const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
const skyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    skyColor: { value: new THREE.Color(0x87ceeb) },
    horizonColor: { value: new THREE.Color(0xffffff) },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 skyColor;
    uniform vec3 horizonColor;
    varying vec3 vWorldPosition;
    void main() {
      vec3 direction = normalize(vWorldPosition);
      float t = 0.5 * (1.0 + dot(vec3(0.0, 1.0, 0.0), direction));
      gl_FragColor = vec4(mix(horizonColor, skyColor, t), 1.0);
    }
  `,
  side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('waternormals.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

const terrainGeometry = new THREE.PlaneGeometry(1000, 1000);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x9c7653 });
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -1;
scene.add(terrain);

// Set up lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Set up camera and controls
camera.position.set(0, 2, 5);
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Set up physics
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const carBodyShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const carBodyMaterial = new CANNON.Material();
const carBody = new CANNON.Body({
  mass: 1000,
  material: carBodyMaterial,
  shape: carBodyShape,
});
world.addBody(carBody);

const wheelMaterial = new CANNON.Material();
const wheelShape = new CANNON.Sphere(0.4);
const wheelBodies = [];
const wheelPositions = [
  new CANNON.Vec3(1, 0, 1.5),
  new CANNON.Vec3(-1, 0, 1.5),
  new CANNON.Vec3(1, 0, -1.5),
  new CANNON.Vec3(-1, 0, -1.5),
];
for (let i = 0; i < 4; i++) {
  const wheelBody = new CANNON.Body({
    mass: 10,
    material: wheelMaterial,
    shape: wheelShape,
  });
  wheelBody.position.copy(wheelPositions[i]);
  wheelBodies.push(wheelBody);
  world.addBody(wheelBody);
}

// Set up car controls
const maxSteerVal = 0.5;
const maxForce = 1000;
const brakeForce = 1000000;
const wheelConstraints = [];
for (let i = 0; i < 4; i++) {
  const wheelConstraint = new CANNON.HingeConstraint(carBody, wheelBodies[i], {
    pivotA: wheelPositions[i],
    axisA: new CANNON.Vec3(0, 1, 0),
    maxForce: maxForce,
  });
  wheelConstraints.push(wheelConstraint);
  world.addConstraint(wheelConstraint);
}

const accelerate = (force) => {
  wheelBodies.forEach((wheelBody) => {
    wheelBody.applyLocalForce(new CANNON.Vec3(0, 0, -force), new CANNON.Vec3(0, 0, 0));
  });
};

const brake = (force) => {
  wheelBodies.forEach((wheelBody) => {
    wheelBody.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0));
  });
};

const steer = (angle) => {
  wheelConstraints[0].axisA.z = angle;
  wheelConstraints[1].axisA.z = angle;
};

// Set up keyboard controls
const keysPressed = {};
document.addEventListener('keydown', (event) => {
  keysPressed[event.code] = true;
});
document.addEventListener('keyup', (event) => {
  keysPressed[event.code] = false;
});

// Update physics and render the scene
const clock = new THREE.Clock();
let delta;
const animate = () => {
  requestAnimationFrame(animate);
  delta = clock.getDelta();
  world.step(delta);

  if (carModel) {
    carModel.position.copy(carBody.position);
    carModel.quaternion.copy(carBody.quaternion);
  }

  // Update car controls based on user input
  if (keysPressed['KeyW']) {
    accelerate(maxForce);
  }
  if (keysPressed['KeyS']) {
    brake(brakeForce);
  }
  if (keysPressed['KeyA']) {
    steer(maxSteerVal);
  }
  if (keysPressed['KeyD']) {
    steer(-maxSteerVal);
  }

  water.material.uniforms['time'].value += delta;
  renderer.render(scene, camera);
};

animate();
