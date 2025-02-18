// Select the canvas
const canvas = document.getElementById('robotCanvas');

// Set up the scene
const scene = new THREE.Scene();

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the head (a sphere)
const headGeometry = new THREE.SphereGeometry(2, 32, 32);
const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc99 });
const head = new THREE.Mesh(headGeometry, headMaterial);
scene.add(head);

// Create eyes (two smaller spheres)
const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.6, 0.5, 1.8);
rightEye.position.set(0.6, 0.5, 1.8);
scene.add(leftEye, rightEye);

// Create mouth (torus shape)
const mouthGeometry = new THREE.TorusGeometry(0.6, 0.1, 16, 100);
const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
mouth.rotation.x = Math.PI / 2;
mouth.position.set(0, -1, 1.8);
scene.add(mouth);

// Store current expression
let expression = 'happy';

// Function to update expression (mouth shape and eye movement)
function setExpression(expr) {
    expression = expr;
    if (expression === 'happy') {
        mouth.scale.set(1, 0.5, 1); // Smile
        leftEye.position.set(-0.6, 0.5, 1.8); // Eye position
        rightEye.position.set(0.6, 0.5, 1.8);
    } else if (expression === 'sad') {
        mouth.scale.set(1, -0.5, 1); // Frown
        leftEye.position.set(-0.6, 0.5, 1.8);
        rightEye.position.set(0.6, 0.5, 1.8);
    } else if (expression === 'angry') {
        mouth.scale.set(1, 0.3, 1); // Angry mouth
        leftEye.position.set(-0.8, 0.7, 1.8); // Eye position for anger
        rightEye.position.set(0.8, 0.7, 1.8);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    head.rotation.y += 0.01; // Rotate head slightly for effect
    renderer.render(scene, camera);
}
animate();
