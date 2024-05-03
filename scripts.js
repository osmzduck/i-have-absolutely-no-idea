// scripts.js

// Import necessary libraries
import * as THREE from 'https://cdn.skypack.dev/three@0.137.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.137.0/examples/jsm/controls/PointerLockControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Set up the car physics
const carBody = new CANNON.Body({
  mass: 150,
  shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)),
});
world.addBody(carBody);

// Load the car model from Sketchfab
const loader = new GLTFLoader();
let carModel;
loader.load('https://sketchfab.com/models/6a8f7c1653c745aba3b1ece27c0537ed/embed', (gltf) => {
  carModel = gltf.scene;
  carModel.scale.set(0.5, 0.5, 0.5);
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

// Set up the collision detection
const groundMaterial = new CANNON.Material();
const carMaterial = new CANNON.Material();
const carGroundContactMaterial = new CANNON.ContactMaterial(carMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0.3,
  contactEquationStiffness: 1e8,
  contactEquationRelaxation: 3,
  frictionEquationStiffness: 1e8,
  frictionEquationRegularizationTime: 3,
});
world.addContactMaterial(carGroundContactMaterial);

// Create the ground plane
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

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
document.body.appendChild(mapRenderer.domElement);
mapRenderer.domElement.style.position = 'absolute';
mapRenderer.domElement.style.top = '10px';
mapRenderer.domElement.style.right = '10px';
mapRenderer.domElement.style.border = '2px solid white';

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update car physics
  if (keysPressed['KeyW']) {
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, -500), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyS']) {
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, 500), new CANNON.Vec3(0, 0, 1));
  }
  if (keysPressed['KeyA']) {
    carBody.applyLocalTorque(new CANNON.Vec3(0, -500, 0));
  }
  if (keysPressed['KeyD']) {
    carBody.applyLocalTorque(new CANNON.Vec3(0, 500, 0));
  }

  // Update physics world
  world.step(1 / 60);

  // Update car model position and rotation
  if (carModel) {
    carModel.position.copy(carBody.position);
    carModel.quaternion.copy(carBody.quaternion);
  }

  // Update camera position and rotation
  controls.update();

  // Render the scene
  renderer.render(scene, camera);

  // Render the mini-map
  mapRenderer.render(scene, mapCamera);
}

animate();
