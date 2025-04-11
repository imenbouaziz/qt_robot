import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

let scene, camera, renderer, model;
let mixer;
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
let headMesh = null;
const qtScale = 2.7;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const canvas = document.getElementById("sceneCanvas");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  //Tonemapping
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.45;

  // Lumières
  const ambientLight = new THREE.AmbientLight("#7a7bbe", 0.5);
  scene.add(ambientLight);

  //Environemment lumineux
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const envMap = pmremGenerator.fromScene(environment).texture;
  
  scene.environment = envMap;
  
  // Charger le modèle
  const loader = new GLTFLoader();
  loader.load(
    "/static/models/QTAnim.glb",
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      console.log("✅ Modèle chargé :", model);

      // Centrer le modèle
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.sub(center);
      model.position.y -= 4.8; // Descendre le modèle
      model.position.x -= 9.5;
      model.rotateY(-50);
      model.scale.set(qtScale,qtScale,qtScale);

      // Caméra auto-adaptée
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;

      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, 0);

      // Trouver la tête
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.metalness = 0.7; 
          child.material.roughness = 0.4; // 0 brillant - 1 pas brillant
          child.material.envMapIntensity = 1; // pour qu’il capte bien la lumière
          child.material.envMap = envMap;
          child.material.needsUpdate = true;
          if (child.name.toLowerCase().includes("head")){
            headMesh = child;
            const textureLoader = new THREE.TextureLoader();
            const metalnessMap = textureLoader.load("/static/textures/QT-Head-MetallicMap.png", (texture) => {
              texture.flipY = false;
              headMesh.material.metalnessMap = metalnessMap;
            });
            console.log("🧠 Mesh de tête détecté :", headMesh.name);
          }
        }
      });

      mixer = new THREE.AnimationMixer(model);
      mixer._clips = gltf.animations;

      playAnimation("Wave_Baked","HappySmile");

    },
    undefined,
    (error) => {
      console.error("❌ Erreur chargement modèle :", error);
    }
  );

  animate();
}

let currentAction = null;
let isInAnimation = false;


function playAnimation(name, expressionName = null) {
  if (name != "Idle_Baked" && isInAnimation){
    return;
  }

  if (expressionName) {
    setExpression(expressionName);
  }

  if (!mixer || !model) {
    console.warn("⏯️ Mixer ou modèle non prêt");
    return;
  }

  const clip = THREE.AnimationClip.findByName(mixer._clips, name);
  if (!clip) {
    console.warn(`❌ Animation '${name}' non trouvée.`);
    return;
  }

  const newAction = mixer.clipAction(clip);

  if (name === "Idle_Baked") {
    newAction.setLoop(THREE.LoopRepeat);
    newAction.clampWhenFinished = false;
  } else {
    isInAnimation = true;
    newAction.setLoop(THREE.LoopOnce);
    newAction.clampWhenFinished = true;
  }

  if (currentAction && currentAction !== newAction) {
    currentAction.fadeOut(0.3);
  }

  newAction.reset().fadeIn(0.3).play();
  currentAction = newAction;
  
  if (name !== "Idle_Baked") {
    mixer.addEventListener("finished", function onFinish() {
      mixer.removeEventListener("finished", onFinish);
      isInAnimation = false;
      playAnimation("Idle_Baked", "Eager");
    });
  }

  console.log(`🎬 Animation '${name}' lancée avec expression '${expressionName || 'aucune'}'`);
}


// Fonction pour changer l'expression du visage
function setExpression(expressionName) {
  if (!headMesh) {
    console.warn("🧠 Tête non encore initialisée.");
    return;
  }
  console.log("🧪 Material tête :", headMesh.material);
  const texturePath = `/static/textures/QT-Head-Tex-${expressionName}.png`;

  textureLoader.load(
    texturePath,
    (texture) => {
      texture.flipY = false;
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      headMesh.material.map = texture;
      headMesh.material.needsUpdate = true;
      console.log(`😊 Expression '${expressionName}' appliquée.`);
    },
    undefined,
    (err) => {
      console.error("❌ Impossible de charger la texture :", err);
    }
  );
}

// Animation boucle
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();

//Rends setExpression accessible globalement
window.setExpression = setExpression;
window.playAnimation = playAnimation;