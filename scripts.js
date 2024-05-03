import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as CANNON from 'cannon-es';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load car model
const loader = new GLTFLoader();
let car;
loader.load('sportcar.017.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(0.5, 0.5, 0.5);
  car.position.set(0, 0.5, 0);
  scene.add(car);
});

// Create environment
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

// Set up camera controls
const controls = new PointerLockControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 4;

// Set up physics
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const carBody = new CANNON.Body({
  mass: 150,
  shape: carShape,
});
world.addBody(carBody);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
  mass: 0,
  shape: groundShape,
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Set up car controls
const keysPressed = {};

document.addEventListener('keydown', (event) => {
  keysPressed[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keysPressed[event.code] = false;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update car physics
  if (car) {
    car.position.copy(carBody.position);
    car.quaternion.copy(carBody.quaternion);

    const force = 500;
    const maxSteerVal = 0.3;
    const maxForce = 1000;
    const brakeForce = 1000000;

    if (keysPressed['KeyW']) {
      if (carBody.velocity.length() < maxForce) {
        carBody.applyLocalForce(new CANNON.Vec3(0, 0, -force), new CANNON.Vec3(0, 0, 0));
      }
    }

    if (keysPressed['KeyS']) {
      if (carBody.velocity.length() < maxForce) {
        carBody.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0));
      }
    }

    if (keysPressed['KeyA']) {
      carBody.angularVelocity.y = Math.min(carBody.angularVelocity.y + 0.1, maxSteerVal);
    }

    if (keysPressed['KeyD']) {
      carBody.angularVelocity.y = Math.max(carBody.angularVelocity.y - 0.1, -maxSteerVal);
    }

    if (keysPressed['Space']) {
      carBody.applyLocalForce(new CANNON.Vec3(0, 0, -brakeForce), new CANNON.Vec3(0, 0, 0));
    }
  }

  // Update physics world
  world.step(1 / 60);

  // Update water
  water.material.uniforms['time'].value += 1.0 / 60.0;

  // Render the scene
  renderer.render(scene, camera);
}

animate();
