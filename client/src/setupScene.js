import * as THREE from 'three'
import {
  PointLight,
  DirectionalLight,
  InstancedMesh,
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

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// begin loading textures immediately
const groundTexture = new TextureLoader().load("floor.jpeg")
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(4, 4);

// define coin mesh as reuseable instance inputs
const coinTexture = new TextureLoader().load("gold.png")

const coinGeometry = new CylinderGeometry(1, 1, 0.3, 40);
coinGeometry.computeVertexNormals()

coinMaterial = new MeshStandardMaterial({
  map: texture,
  metalness: 0.9,
  roughness: 0.2,
})


const initPhysics = () => {
  const world = CANNON.world()
  world.gravity.set(0, -9.81, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
  return world;
}

const makeCoin = (x, y, z) => {
  const coin = new InstancedMesh(coinGeometry, coinMaterial)
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

const createAndAddGroundPlane = (scene, world) => {
  const geometry = new PlaneGeometry(150, 150);
  const material = new MeshStandardMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    roughness: 0.5,
    metalness: 0,
    side: THREE.DoubleSide,
    roughnessMap: groundTexture
  });

  const plane = new Mesh(geometry, material);
  plane.receiveShadow = true;
  plane.position.y = 0;
  plane.rotateX(- Math.PI / 2);
  scene.add(plane)

  // Create physics for top plane
  const groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    type: CANNON.Body.STATIC
  });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2
  )
  var groundShape = new CANNON.Plane()
  groundBody.addShape(groundShape)
  world.addBody(groundBody)

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


const addLights = (scene) => {
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
}

const setupCamera = () => {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.x = 2
  camera.position.y = 5
  camera.position.z = 25
  camera.lookAt(0, 5, 0)
  return camera;
}

const setupScene = (numCoins, canvas) => {

  // initialisation

  return {
    scene: this.scene,
    coins: this.coins,
    pausePhysics,
    resumePhysics,
    animate
  }
}

const coinScene = {

}

export default coinScene