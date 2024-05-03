// scripts.js

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/PointerLockControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Load the car model
const loader = new GLTFLoader();
let car;
loader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(10, 10, 10); // Adjust the scale as needed
  scene.add(car);

  // Set up the car physics body
  const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
  const carBody = new CANNON.Body({
    mass: 150,
    shape: carShape,
  });
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

// Set up the animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update the physics world
  world.step(1 / 60);

  // Update the car position and rotation
  if (car) {
    car.position.copy(carBody.position);
    car.quaternion.copy(carBody.quaternion);

    // Apply car controls
    if (keysPressed['KeyW']) {
      carBody.applyLocalForce(new CANNON.Vec3(0, 0, -500), new CANNON.Vec3(0, 0, 0));
    }
    if (keysPressed['KeyS']) {
      carBody.applyLocalForce(new CANNON.Vec3(0, 0, 500), new CANNON.Vec3(0, 0, 0));
    }
    if (keysPressed['KeyA']) {
      carBody.applyLocalTorque(new CANNON.Vec3(0, 500, 0));
    }
    if (keysPressed['KeyD']) {
      carBody.applyLocalTorque(new CANNON.Vec3(0, -500, 0));
    }
  }

  // Update the camera position and rotation
  camera.position.copy(controls.getObject().position);
  camera.quaternion.copy(controls.getObject().quaternion);

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
