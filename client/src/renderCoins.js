import * as THREE from 'three'
import {
  PointLight,
  DirectionalLight,
  Scene,
  CylinderGeometry,
  MeshBasicMaterial,
  TextureLoader,
  MeshStandardMaterial,
  AmbientLight,
  PlaneGeometry,
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  DirectionalLightHelper
} from 'three';
import CANNON from 'cannon'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

let coins = []
let world
let groundBody
let scene

const initPhysics = () => {
  world = new CANNON.World();
  world.gravity.set(0,-9.81,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
}

const definePhysicsBoundary = () => {
  var leftWallBody = new CANNON.Body({
    mass: 0 // mass == 0 makes the body static
  });
  var leftWallShape = new CANNON.Plane();
  leftWallBody.position.set(-5, 0,0)
  leftWallBody.rotateX(- Math.PI / 2);
  leftWallBody.rotateY(- Math.PI / 2);
  leftWallBody.addShape(leftWallShape);
  world.addBody(leftWallBody);
}

const createGroundPlane = (scene) => {
  const texture = new TextureLoader().load("floor.jpeg")
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 4, 4 );

  const geometry = new PlaneGeometry(150, 150);
  const material = new MeshStandardMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    roughness: 0.5,
    metalness: 0,
    side: THREE.DoubleSide,
    roughnessMap: texture
  });
  const plane = new Mesh(geometry, material);
  plane.receiveShadow = true;
  plane.position.y = 0;
  plane.rotateX(- Math.PI / 2);
  scene.add(plane)

  // Create physics for top plane
  groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    type: CANNON.Body.STATIC
  });
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
  var groundShape = new CANNON.Plane();
  groundBody.addShape(groundShape);
  world.addBody(groundBody);

  // reflector
  const mirrorGeometry = new PlaneGeometry(140, 164);
  const groundMirror = new Reflector(mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x777777
  });
  groundMirror.position.y = -0.001;
  groundMirror.rotateX(- Math.PI / 2);
  scene.add(groundMirror);
}

const makeCoin = (x, y, z) => {
  const geometry = new CylinderGeometry(1, 1, 0.3, 40);
  geometry.computeVertexNormals()
  const texture = new TextureLoader().load("gold.png")

  const material = new MeshStandardMaterial({
    map: texture,
    metalness: 0.9,
    roughness: 0.2,
  })

  const coin = new Mesh(geometry, material)
  coin.name = 'coin';
  // coin.rotation.z = Math.PI / 2;
  const shape = new CANNON.Box(new CANNON.Vec3(1, 0.2, 1));
  const body = new CANNON.Body({
    mass: 2 
  });
  body.position.x = x;
  body.position.y = y;
  body.position.z = z;

  body.addShape(shape);
  body.angularVelocity.set(0, 10, 0);
  body.angularDamping = 0.1;
  world.addBody(body);

  coin.body = body
  coins.push(coin)

  return coin
}

export default (canvas) => {
  initPhysics()
  const scene = new Scene()

  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.x = 2
  camera.position.y = 5
  camera.position.z = 25
  camera.lookAt(0, 5, 0)

  const renderer = new WebGLRenderer({ canvas: canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambientLight = new AmbientLight('white', 2);

  const directionalLight = new DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 0, 8)
  scene.add(directionalLight);


  const directionalLight2 = new DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-10, 4, 10)
  scene.add(directionalLight2);

  const pointLight = new PointLight(0xffffff, 2)
  // Left point light
  const pointLightLeft = new PointLight(0xff4422, 1)
  pointLightLeft.position.set(-1, -1, 3)
  scene.add(pointLightLeft)

  // Top point light
  const pointLightTop = new PointLight(0xdd3311, 1)
  pointLightTop.position.set(0, 3, 2)
  scene.add(pointLightTop)
  pointLight.position.set(20, 20)
  scene.add(pointLight, ambientLight)

  for (let i = 0; i < 30; i++) {
    const coin = makeCoin(0, 0.2 * i + 0.1, 0)
    coin.rotation.y += 2
    scene.add(coin)
  }
  for (let i = 0; i < 20; i++) {
    const coin = makeCoin(3, 0.2 * i + 0.1, 2)
    coin.rotation.y += 2
    scene.add(coin)
  }
  for (let i = 0; i < 50; i++) {
    const coin = makeCoin(-2, 0.2 * i + 0.1, 4)
    coin.rotation.y += 2
    scene.add(coin)
  }

  scene.add(makeCoin(0, 10, 0))


  const coins = scene.children.filter(x => x.name === 'coin')
  createGroundPlane(scene)

  window.scene = scene
  const controls = new OrbitControls(camera, renderer.domElement)
  // Create a closed wavey loop
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, 0, 10),
    new THREE.Vector3(-5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, -5, 5),
    new THREE.Vector3(10, 0, 10)
  ]);

  // const points = curve.getPoints(50);
  // const geometry = new THREE.BufferGeometry().setFromPoints(points)
  // const material = new THREE.LineBasicMaterial({ color: 0xff0000 })
  // const curveObject = new THREE.Line(geometry, material);
  // scene.add(curveObject)


  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;

  // Start the simulation loop
  var lastTime;
  const begun = true;

  function animate(time) {
    if (lastTime !== undefined) {
      var dt = (time - lastTime) / 1000;
      coins.forEach(c => {
        // Copy coordinates from Cannon.js to Three.js
        c.position.copy(c.body.position);
        c.quaternion.copy(c.body.quaternion);
      })

      world.step(fixedTimeStep, dt, maxSubSteps);
    }

    lastTime = time;

    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }

  animate();
  return scene
}