import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as CANNON from 'cannon-es';

let camera, scene, renderer, controls;
let carModel, physicsWorld, carBody;
let acceleration = 0;
let steering = 0;
let isMobile = false;

const loader = new GLTFLoader();
const clock = new THREE.Clock();

init();
animate();

function init() {
  // Set up the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

  // Set up the camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Set up the controls
  controls = new PointerLockControls(camera, renderer.domElement);
  document.body.addEventListener('click', () => {
    controls.lock();
  });

  // Set up the lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.top	= 2;
  dirLight.shadow.camera.bottom = - 2;
  scene.add(dirLight);

  // Load the car model
  loader.load('sportcar.017.glb', (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(0.5, 0.5, 0.5);
    carModel.position.y = 0.5;
    scene.add(carModel);
  });

  // Set up the physics world
  physicsWorld = new CANNON.World();
  physicsWorld.gravity.set(0, -9.82, 0);

  // Create the car physics body
  const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
  const chassisBody = new CANNON.Body({ mass: 150 });
  chassisBody.addShape(chassisShape);
  chassisBody.position.set(0, 4, 0);
  physicsWorld.addBody(chassisBody);
  carBody = chassisBody;

  // Set up the environment
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
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
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 15), skyMaterial);
  scene.add(sky);

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('waternormals.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7
  });
  water.rotation.x = - Math.PI / 2;
  scene.add(water);

  const groundTexture = new THREE.TextureLoader().load('grasslight-big.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(25, 25);
  groundTexture.anisotropy = 16;
  groundTexture.encoding = THREE.sRGBEncoding;
  const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), groundMaterial);
  ground.position.y = 0;
  ground.rotation.x = - Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Set up event listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // Check if running on mobile device
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      acceleration = isMobile ? 2 : 1;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      steering = isMobile ? 0.05 : 0.03;
      break;
    case 'ArrowDown':
    case 'KeyS':
      acceleration = isMobile ? -2 : -1;
      break;
    case 'ArrowRight':
    case 'KeyD':
      steering = isMobile ? -0.05 : -0.03;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
    case 'ArrowDown':
    case 'KeyS':
      acceleration = 0;
      break;
    case 'ArrowLeft':
    case 'KeyA':
    case 'ArrowRight':
    case 'KeyD':
      steering = 0;
      break;
  }
}

function updatePhysics() {
  const deltaTime = clock.getDelta();
  physicsWorld.step(1 / 60, deltaTime, 10);

  if (carModel) {
    carModel.position.copy(carBody.position);
    carModel.quaternion.copy(carBody.quaternion);
  }

  // Apply car controls
  const engineForce = acceleration * 500;
  const brakeForce = acceleration < 0 ? -acceleration * 1000 : 0;
  const steeringForce = steering * 0.5;

  carBody.applyLocalForce(new CANNON.Vec3(0, engineForce, 0), new CANNON.Vec3(0, 0, 1));
  carBody.applyLocalForce(new CANNON.Vec3(0, brakeForce, 0), new CANNON.Vec3(0, 0, 0));
  carBody.angularVelocity.y = steeringForce;
}

function animate() {
  requestAnimationFrame(animate);
  updatePhysics();
  renderer.render(scene, camera);
}
