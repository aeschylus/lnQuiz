import * as THREE from 'three'
import {
  PointLight,
  DirectionalLight,
  InstancedMesh,
  Scene,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  TextureLoader,
  MeshStandardMaterial,
  AmbientLight,
  PlaneGeometry,
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  DirectionalLightHelper,
  MeshPhongMaterial,
  Clock,
  Raycaster
} from 'three';
import { LightningStrike } from 'three/examples/jsm/geometries/LightningStrike.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

const addCoinModel = async (scene) => {
  const loader = new GLTFLoader();

  loader.load( 'satcoin.gltf', function ( gltf ) {
    const coinTexture = new TextureLoader().load("gold.png")
    window.rawScene = gltf
    // delete gltf.scene.children[0].children[1]
    gltf.scene.children[0].children.forEach(c => {
      c.material = new MeshStandardMaterial({
        // color: 'orangered',
        map: coinTexture,
        roughness: 0.3,
        metalness: 0.9
      })
      c.material.transparent = true;
      c.material.opacity = 0;
    })
    gltf.scene.scale.set(0.4, 0.4, 0.4)

    for (let x = 0; x < 100; x++) {
      const coinClone = gltf.scene.clone()
      scene.add(coinClone);
    }

  }, undefined, function ( error ) {
    console.error( error );
  } );
}
const createAndAddGroundPlane = (scene) => {
  // begin loading textures immediately
  const groundTexture = new TextureLoader().load("floor.jpeg")
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(4, 4);

  const geometry = new PlaneGeometry(150, 150);
  const material = new MeshStandardMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.7,
    roughness: 0.6,
    metalness: 0,
    side: THREE.DoubleSide,
    roughnessMap: groundTexture
  });

  const plane = new Mesh(geometry, material);
  plane.receiveShadow = true;
  plane.position.y = 0;
  plane.rotateX(- Math.PI / 2);
  scene.add(plane)

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
  const ambientLight = new AmbientLight('white', 1);

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
  camera.position.x = 0
  camera.position.y = 10 
  camera.position.z = 25
  camera.lookAt(0, 5, 0)
  return camera;
}

const createLightning = (scene, camera, renderer) => {
  scene.userData.lightningColor = new THREE.Color(0x00FFFF);
  scene.userData.lightningMaterial = new THREE.MeshBasicMaterial({ 
    color: scene.userData.lightningColor,
    visible: false
   });

  scene.userData.rayParams = {
    sourceOffset: new THREE.Vector3(0, 5, 0),
    destOffset: new THREE.Vector3(10, 10, 0),
    radius0: 0.1,
    radius1: 0.2,
    minRadius: 0.1,
    maxIterations: 7,
    isEternal: true,
    timeScale: 0.7,
    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 3.5,
    subrayDutyCycle: 0.6,
    maxSubrayRecursion: 3,
    ramification: 4,
    recursionProbability: 0.6,
    roughness: 0.85,
    straightness: 0.6
  };

  let lightningStrike;
  let lightningStrikeMesh;

  scene.userData.recreateRay = function () {

    if (lightningStrikeMesh) {

      scene.remove(lightningStrikeMesh);

    }

    lightningStrike = new LightningStrike(scene.userData.rayParams);
    lightningStrikeMesh = new THREE.Mesh(
      lightningStrike,
      scene.userData.lightningMaterial
    );

    lightningStrikeMesh.name ="bolt"

    scene.add(lightningStrikeMesh);
  };

  scene.userData.recreateRay();

  return lightningStrike
}

export default function(canvas) {
  let begun = false
  const numCoins = 100
  const numBolts = 10
  const clock = new Clock()
  const raycaster = new Raycaster()
  const camera = setupCamera()
  const scene = new Scene()
  scene.userData.currentTime = 0

  const renderer = new WebGLRenderer({ canvas: canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputEncoding = THREE.sRGBEncoding
  document.body.appendChild(renderer.domElement)


  addLights(scene)
  createAndAddGroundPlane(scene)
  addCoinModel(scene)
  let lightningBolts = []

  for (let x = 0; x <= numBolts; x++) {
    lightningBolts.push(createLightning(scene, camera))
  }

  const getCoins = () => scene.children.filter(m => m.isGroup)
  const getBolts = () => scene.children.filter(m => m.name === 'bolt')

  function animate() {
    scene.userData.currentTime += 1 * clock.getDelta();
    if (scene.userData.currentTime < 0) {
      scene.userData.currentTime = 0;
    }
    const coins = scene.children.filter(m => m.isGroup)
    if (!begun) {
      coins.forEach((g, i) => {
        g.position.z = 0
        g.rotation.x = Math.PI / 2
        g.position.y = 5
      })
      begun = true;
    }
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  window.scene = scene

  setTimeout(() => {
    animate()
  }, 2000)

  return {
    scene,
    getCoins,
    getBolts,
    clock,
    animate
  }
  return 'hello'
}