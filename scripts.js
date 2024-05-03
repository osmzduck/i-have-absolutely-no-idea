// scripts.js

// Import necessary libraries
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import CannonDebugger from 'https://cdn.skypack.dev/cannon-es-debugger@0.1.4';
import { PointerLockControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/PointerLockControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const cannonDebugger = new CannonDebugger(scene, world);

// Load the 3D car model
const loader = new GLTFLoader();
let carModel;
loader.load('path/to/car-model.gltf', (gltf) => {
  carModel = gltf.scene;
  carModel.scale.set(0.5, 0.5, 0.5);
  scene.add(carModel);
  
  // Set up the car physics body
  const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
  const carBody = new CANNON.Body({ mass: 150 });
  carBody.addShape(carShape);
  carBody.position.copy(carModel.position);
  world.addBody(carBody);
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

// Set up the game loop
const gameLoop = () => {
  // Update the physics world
  world.step(1 / 60);

  // Update the car position and rotation
  if (carModel && carBody) {
    carModel.position.copy(carBody.position);
    carModel.quaternion.copy(carBody.quaternion);
  }

  // Handle car controls
  if (keysPressed['KeyW']) {
    // Accelerate the car
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, -500), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyS']) {
    // Brake the car
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, 500), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyA']) {
    // Steer the car left
    carBody.applyLocalTorque(new CANNON.Vec3(0, -50, 0));
  }
  if (keysPressed['KeyD']) {
    // Steer the car right
    carBody.applyLocalTorque(new CANNON.Vec3(0, 50, 0));
  }

  // Render the scene
  renderer.render(scene, camera);

  // Call the next frame
  requestAnimationFrame(gameLoop);
};

// Start the game loop
gameLoop();

// Set up the mini-map
const mapWidth = 200;
const mapHeight = 200;
const mapRenderer = new THREE.WebGLRenderer({ alpha: true });
mapRenderer.setSize(mapWidth, mapHeight);
document.body.appendChild(mapRenderer.domElement);
mapRenderer.domElement.style.position = 'absolute';
mapRenderer.domElement.style.top = '10px';
mapRenderer.domElement.style.right = '10px';

const mapCamera = new THREE.OrthographicCamera(
  -500, 500, 500, -500, 1, 1000
);
mapCamera.position.set(0, 500, 0);
mapCamera.lookAt(0, 0, 0);

const mapScene = new THREE.Scene();
const mapMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true })
);
mapMesh.rotation.x = -Math.PI / 2;
mapScene.add(mapMesh);

// Update the mini-map
const updateMiniMap = () => {
  mapRenderer.render(mapScene, mapCamera);
  requestAnimationFrame(updateMiniMap);
};
updateMiniMap();

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
