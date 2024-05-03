// scripts.js

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/PointerLockControls.js';
import { Water } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js';

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

// Set up the car model and physics body
let car;
const carMass = 150;
const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const carBody = new CANNON.Body({
  mass: carMass,
  shape: carShape,
});
world.addBody(carBody);

// Load the car model
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.skypack.dev/three@0.129.0/examples/js/libs/draco/');
loader.setDRACOLoader(dracoLoader);
loader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(10, 10, 10);
  car.position.y = 1;
  scene.add(car);
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

// Set up the environment
const skyGeometry = new THREE.SphereGeometry(1000, 60, 40);
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
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 skyColor;
    uniform vec3 horizonColor;
    varying vec3 vWorldPosition;
    void main() {
      vec3 direction = normalize(vWorldPosition);
      float t = 0.5 * (1.0 + dot(direction, vec3(0.0, 1.0, 0.0)));
      gl_FragColor = vec4(mix(horizonColor, skyColor, t), 1.0);
    }
  `,
  side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
const waterMaterial = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Set up the terrain
const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x8c8c8c });
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Set up the lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 200, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

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
    const force = 500;
    if (keysPressed['KeyW']) {
      carBody.applyLocalForce(new CANNON.Vec3(0, 0, -force), new CANNON.Vec3(0, 0, 0));
    }
    if (keysPressed['KeyS']) {
      carBody.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0));
    }
    if (keysPressed['KeyA']) {
      carBody.applyLocalTorque(new CANNON.Vec3(0, force * 2, 0));
    }
    if (keysPressed['KeyD']) {
      carBody.applyLocalTorque(new CANNON.Vec3(0, -force * 2, 0));
    }
  }

  // Update the camera position and rotation
  camera.position.copy(controls.getObject().position);
  camera.quaternion.copy(controls.getObject().quaternion);
  
  // Update the water material
  waterMaterial.uniforms.time.value += 1.0 / 60.0;

  // Render the scene
  renderer.render(scene, camera);
}

// Start the experience when the start button is clicked
function startExperience() {
  const blocker = document.getElementById('blocker');
  blocker.style.display = 'none';

// Start the animation loop
animate();

  // Attach the startExperience function to the start button
document.getElementById('startButton').addEventListener('click', startExperience);
