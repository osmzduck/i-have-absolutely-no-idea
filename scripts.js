// Import necessary libraries
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);
world.broadphase = new CANNON.NaiveBroadphase();

// Cannon Debug Renderer
import { CannonDebugRenderer } from './CannonDebugRenderer.js'; // Ensure you have this module
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

// Ground
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    material: new CANNON.Material({ friction: 0.5, restitution: 0.7 }),
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Car
let car;
const carLoader = new GLTFLoader();
carLoader.load('models/car.glb', function (gltf) {
    car = gltf.scene;
    car.scale.set(2, 2, 2);
    car.castShadow = true;
    car.receiveShadow = false;
    scene.add(car);
    initCarPhysics(car);
}, undefined, function (error) {
    console.error('An error happened while loading the model:', error);
});

function initCarPhysics(car) {
    const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
    const carBody = new CANNON.Body({
        mass: 1500,
        material: new CANNON.Material({ friction: 0.3, restitution: 0.3 }),
        position: new CANNON.Vec3(0, 5, 0),
        shape: carShape
    });
    world.addBody(carBody);
    car.userData.physicsBody = carBody;
}

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener('click', () => controls.lock());

// Handle user input
const velocity = new CANNON.Vec3(0, 0, 0);
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w': velocity.z = -10; break;
        case 's': velocity.z = 10; break;
        case 'a': velocity.x = -10; break;
        case 'd': velocity.x = 10; break;
    }
    car.userData.physicsBody.velocity = velocity;
});

document.addEventListener('keyup', (event) => {
    velocity.set(0, 0, 0);
    car.userData.physicsBody.velocity = velocity;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    if (car) {
        car.position.copy(car.userData.physicsBody.position);
        car.quaternion.copy(car.userData.physicsBody.quaternion);
    }
    cannonDebugRenderer.update(); // Update the debug renderer
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
