// scripts.js

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es@0.18.0';
import CannonDebugger from 'https://cdn.skypack.dev/cannon-es-debugger@0.1.4';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/PointerLockControls.js';

// Set up the Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the physics world using Cannon.js
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

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
const floorMaterial = new CANNON.Material('floorMaterial');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, floorMaterial, {
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

  const wheelGeometry = new THREE.SphereGeometry(wheelOptions.radius, 16, 16);
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelVisuals.push(wheelMesh);
  scene.add(wheelMesh);
}

// Position the wheels
const frontLeftWheelBody = wheelBodies[0];
frontLeftWheelBody.position.set(1, 0, 1.5);
const frontRightWheelBody = wheelBodies[1];
frontRightWheelBody.position.set(-1, 0, 1.5);
const rearLeftWheelBody = wheelBodies[2];
rearLeftWheelBody.position.set(1, 0, -1.5);
const rearRightWheelBody = wheelBodies[3];
rearRightWheelBody.position.set(-1, 0, -1.5);

// Load the 3D car model
const loader = new GLTFLoader();
let carModel;
loader.load(
  'path/to/car-model.gltf',
  (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(0.5, 0.5, 0.5);
    scene.add(carModel);
  },
  (progress) => {
    console.log(`Loading car model: ${(progress.loaded / progress.total) * 100}%`);
  },
  (error) => {
    console.error('Error loading car model:', error);
  }
);

// Set up the camera to follow the car
const controls = new PointerLockControls(camera, document.body);
camera.position.set(0, 2, 5);
controls.getObject().position.set(0, 2, 5);
scene.add(controls.getObject());

// Set up the 3D environment
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
scene.add(floorMesh);

const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({ mass: 0, material: floorMaterial });
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(floorBody);

// Set up the car controls
const maxSteerVal = Math.PI / 8;
const maxForce = 500;
const brakeForce = 1000000;

const wheelDirectionCS0 = new CANNON.Vec3(0, -1, 0);
const wheelAxleCS = new CANNON.Vec3(-1, 0, 0);

const engineForce = 0;
const brakingForce = 0;
const steeringValue = 0;

const updateDrive = () => {
  const frontLeftWheelBody = wheelBodies[0];
  const frontRightWheelBody = wheelBodies[1];

  const force = maxForce * engineForce;
  const steer = maxSteerVal * steeringValue;

  frontLeftWheelBody.applyLocalForce(new CANNON.Vec3(0, force, 0), new CANNON.Vec3(0, 0, 0));
  frontRightWheelBody.applyLocalForce(new CANNON.Vec3(0, force, 0), new CANNON.Vec3(0, 0, 0));

  frontLeftWheelBody.applyLocalTorque(new CANNON.Vec3(0, 0, -steer * force));
  frontRightWheelBody.applyLocalTorque(new CANNON.Vec3(0, 0, -steer * force));

  for (let i = 0; i < wheelBodies.length; i++) {
    const wheelBody = wheelBodies[i];
    wheelBody.applyLocalForce(new CANNON.Vec3(0, -brakingForce, 0), new CANNON.Vec3(0, 0, 0));
  }
};

// Handle user input for car control
const keyMap = {};
const onDocumentKey = (event) => {
  const keyCode = event.which;
  keyMap[keyCode] = event.type === 'keydown';
};
document.addEventListener('keydown', onDocumentKey, false);
document.addEventListener('keyup', onDocumentKey, false);

const updateKeyboard = () => {
  const UP = 38;
  const DOWN = 40;
  const LEFT = 37;
  const RIGHT = 39;
  const SPACE = 32;

  if (keyMap[UP]) {
    engineForce = 1;
  } else if (keyMap[DOWN]) {
    engineForce = -1;
  } else {
    engineForce = 0;
  }

  if (keyMap[LEFT]) {
    steeringValue = -1;
  } else if (keyMap[RIGHT]) {
    steeringValue = 1;
  } else {
    steeringValue = 0;
  }

  if (keyMap[SPACE]) {
    brakingForce = brakeForce;
  } else {
    brakingForce = 0;
  }
};

// Implement collision detection
const contactNormal = new CANNON.Vec3();
const upAxis = new CANNON.Vec3(0, 1, 0);

const updateCollisions = () => {
  const contacts = world.contacts;
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    if (contact.bi === chassisBody || contact.bj === chassisBody) {
      contact.ni.negate(contactNormal);
      const dot = contactNormal.dot(upAxis);
      if (dot > 0.5) {
        // Car is colliding with something beneath it
        contact.disable();
      }
    }
  }
};

// Create a mini-map
const miniMapSize = 200;
const miniMapMargin = 10;
const miniMap = document.createElement('canvas');
miniMap.width = miniMapSize;
miniMap.height = miniMapSize;
miniMap.style.position = 'absolute';
miniMap.style.right = miniMapMargin + 'px';
miniMap.style.bottom = miniMapMargin + 'px';
miniMap.style.border = '1px solid white';
document.body.appendChild(miniMap);

const miniMapCtx = miniMap.getContext('2d');

const updateMiniMap = () => {
  miniMapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  miniMapCtx.fillRect(0, 0, miniMapSize, miniMapSize);

  const carPosition = chassisBody.position;
  const carRotation = chassisBody.quaternion;

  const carX = Math.floor((carPosition.x + 50) * (miniMapSize / 100));
  const carY = Math.floor((carPosition.z + 50) * (miniMapSize / 100));

  miniMapCtx.save();
  miniMapCtx.translate(carX, carY);
  miniMapCtx.rotate(carRotation.y);
  miniMapCtx.fillStyle = 'red';
  miniMapCtx.fillRect(-5, -5, 10, 10);
  miniMapCtx.restore();
};

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);

  updateKeyboard();
  updateDrive();
  updateCollisions();
  updateMiniMap();

  world.step(1 / 60);

  if (carModel) {
    carModel.position.copy(chassisBody.position);
    carModel.quaternion.copy(chassisBody.quaternion);
  }

  for (let i = 0; i < wheelBodies.length; i++) {
    wheelVisuals[i].position.copy(wheelBodies[i].position);
    wheelVisuals[i].quaternion.copy(wheelBodies[i].quaternion);
  }

  controls.update(Date.now() - time);
  renderer.render(scene, camera);

  time = Date.now();
};

let time = Date.now();
animate();
