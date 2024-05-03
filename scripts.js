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

// Load the sport car 3D model
const loader = new GLTFLoader();
let car;
loader.load('sportcar.017.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(0.5, 0.5, 0.5);
  car.position.set(0, 0.5, 0);
  scene.add(car);
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
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
terrain.position.y = -0.5;
scene.add(terrain);

// Set up lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 20;
scene.add(directionalLight);

// Set up camera and controls
camera.position.set(0, 2, 5);
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Set up physics
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const carShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.3, 1.5));
const carBody = new CANNON.Body({
  mass: 150,
  shape: carShape,
});
carBody.position.set(0, 0.5, 0);
world.addBody(carBody);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
  mass: 0,
  shape: groundShape,
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Set up car controls
const maxSteerVal = 0.5;
const maxForce = 500;
const brakeForce = 1000;

const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24);
const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
frontLeftWheel.position.set(-0.7, 0.3, 1.2);
frontLeftWheel.rotation.z = Math.PI / 2;
car.add(frontLeftWheel);

const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
frontRightWheel.position.set(0.7, 0.3, 1.2);
frontRightWheel.rotation.z = Math.PI / 2;
car.add(frontRightWheel);

const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
backLeftWheel.position.set(-0.7, 0.3, -1.2);
backLeftWheel.rotation.z = Math.PI / 2;
car.add(backLeftWheel);

const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
backRightWheel.position.set(0.7, 0.3, -1.2);
backRightWheel.rotation.z = Math.PI / 2;
car.add(backRightWheel);

let steeringValue = 0;
let engineForce = 0;
let isBreaking = false;

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      engineForce = maxForce;
      break;
    case 'ArrowDown':
      engineForce = -maxForce;
      break;
    case 'ArrowLeft':
      steeringValue = maxSteerVal;
      break;
    case 'ArrowRight':
      steeringValue = -maxSteerVal;
      break;
    case 'Space':
      isBreaking = true;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'ArrowDown':
      engineForce = 0;
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
      steeringValue = 0;
      break;
    case 'Space':
      isBreaking = false;
      break;
  }
});

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);

  // Update physics
  world.step(1 / 60);
  car.position.copy(carBody.position);
  car.quaternion.copy(carBody.quaternion);

  // Apply car controls
  frontLeftWheel.rotation.y = steeringValue;
  frontRightWheel.rotation.y = steeringValue;

  if (isBreaking) {
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, brakeForce), new CANNON.Vec3(0, 0, 0));
  } else {
    carBody.applyLocalForce(new CANNON.Vec3(0, 0, engineForce), new CANNON.Vec3(0, 0, 0));
  }

  // Render the scene
  renderer.render(scene, camera);
};

animate();
