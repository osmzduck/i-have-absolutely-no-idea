import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Water
const waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  alpha: 1.0,
  sunDirection: directionalLight.position.clone().normalize(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Terrain
const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;
scene.add(ground);

// Car model
const loader = new GLTFLoader();
let car;
loader.load('models/sportcar.017.glb', function (gltf) {
  car = gltf.scene;
  car.scale.set(2, 2, 2);
  car.position.y = -5;
  scene.add(car);
});

// Physics
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});
const carBody = new CANNON.Body({
  mass: 1500, // kg
  shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)),
});
carBody.position.set(0, 5, 0);
world.addBody(carBody);

// Camera controls
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener('click', function () {
  controls.lock();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);
  if (car) car.position.copy(carBody.position);
  controls.update();
  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}
animate();
