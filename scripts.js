// scripts.js

import * as THREE from 'https://cdn.skypack.dev/three@0.137.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/controls/PointerLockControls.js';
import { Sky } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/objects/Sky.js';
import { Water } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/objects/Water.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Set up the physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// Set up the car physics
const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 4, 0);
chassisBody.angularVelocity.set(0, 0, 0);
world.addBody(chassisBody);

const wheelOptions = {
  radius: 0.5,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 30,
  suspensionRestLength: 0.3,
  frictionSlip: 5,
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(-1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

const wheelBodies = [];
const wheelVisuals = [];

const wheelMaterial = new CANNON.Material('wheelMaterial');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0,
  contactEquationStiffness: 1000,
});
world.addContactMaterial(wheelGroundContactMaterial);

for (let i = 0; i < 4; i++) {
  const wheelBody = new CANNON.Body({ mass: 1, material: wheelMaterial });
  wheelBody.addShape(new CANNON.Sphere(wheelOptions.radius));
  wheelBodies.push(wheelBody);
  world.addBody(wheelBody);

  const wheelVisual = createWheelVisual(wheelOptions.radius);
  wheelVisual.castShadow = true;
  wheelVisual.receiveShadow = true;
  wheelVisuals.push(wheelVisual);
  scene.add(wheelVisual);
}

// Position the wheels
wheelBodies[0].position.set(1, 0.5, 1.5);
wheelBodies[1].position.set(-1, 0.5, 1.5);
wheelBodies[2].position.set(1, 0.5, -1.5);
wheelBodies[3].position.set(-1, 0.5, -1.5);

// Load the car model
const loader = new GLTFLoader();
let carModel;
loader.load('path/to/car-model.glb', (gltf) => {
  carModel = gltf.scene;
  carModel.scale.set(0.5, 0.5, 0.5);
  carModel.position.y = 0.5;
  carModel.castShadow = true;
  carModel.receiveShadow = true;
  scene.add(carModel);
}, undefined, (error) => {
  console.error('Error loading car model:', error);
});

// Set up the camera controls
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Set up the car controls
const keysPressed = {};
document.addEventListener('keydown', (event) => {
  keysPressed[event.code] = true;
});
document.addEventListener('keyup', (event) => {
  keysPressed[event.code] = false;
});

// Set up the ground
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Set up the sky
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
  elevation: 2,
  azimuth: 180,
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  const sunPosition = new THREE.Vector3(
    Math.cos(phi) * Math.sin(theta),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(theta)
  );

  sky.material.uniforms['sunPosition'].value.copy(sunPosition);
  scene.environment = pmremGenerator.fromScene(sky).texture;
}

updateSun();

// Set up the water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('path/to/waternormals.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Set up the mini-map
const mapWidth = 200;
const mapHeight = 200;
const mapCamera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  1,
  1000
);
mapCamera.position.set(0, 500, 0);
mapCamera.lookAt(0, 0, 0);
const mapRenderer = new THREE.WebGLRenderer({ alpha: true });
mapRenderer.setSize(mapWidth, mapHeight);
document.getElementById('mini-map').appendChild(mapRenderer.domElement);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update car physics
  if (keysPressed['KeyW']) {
    chassisBody.applyLocalImpulse(new CANNON.Vec3(0, 0, -5), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyS']) {
    chassisBody.applyLocalImpulse(new CANNON.Vec3(0, 0, 5), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyA']) {
    chassisBody.applyLocalTorque(new CANNON.Vec3(0, -5, 0));
  }
  if (keysPressed['KeyD']) {
    chassisBody.applyLocalTorque(new CANNON.Vec3(0, 5, 0));
  }

  // Update physics world
  world.step(1 / 60);

  // Update car model position and rotation
  if (carModel) {
    carModel.position.copy(chassisBody.position);
    carModel.quaternion.copy(chassisBody.quaternion);
  }

  // Update wheel visuals
  for (let i = 0; i < wheelBodies.length; i++) {
    wheelVisuals[i].position.copy(wheelBodies[i].position);
    wheelVisuals[i].quaternion.copy(wheelBodies[i].quaternion);
  }

  // Update camera position and rotation
  controls.update();

  // Render the scene
  renderer.render(scene, camera);

  // Render the mini-map
  mapRenderer.render(scene, mapCamera);
}

animate();

// Helper function to create wheel visuals
function createWheelVisual(radius) {
  const wheelGeometry = new THREE.CylinderGeometry(radius, radius, 0.4, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelMesh.rotation.x = Math.PI / 2;
  return wheelMesh;
}

// Loading screen
const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.querySelector('.progress-bar');

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = itemsLoaded / itemsTotal;
  progressBar.style.transform = `scaleX(${progress})`;
};

loadingManager.onLoad = () => {
  loadingScreen.style.display = 'none';
};

// Pointer lock controls
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

controls.addEventListener('lock', () => {
  instructions.style.display = 'none';
  blocker.style.display = 'none';
});

controls.addEventListener('unlock', () => {
  blocker.style.display = 'block';
  instructions.style.display = '';
});

document.addEventListener('click', () => {
  controls.lock();
});
