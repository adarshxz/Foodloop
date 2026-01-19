/**
 * FoodLoop Pristine 3D Theme Engine
 * Focuses on a structured "Geometric Web" for a clean, professional look
 */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three-bg'),
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(80);

const colors = {
    web: 0x64748b, // Slate for better visibility on pastels
    focal: 0x10b981, // Emerald
    background: 0xffffff
};

// Create a structured Geometric Web
const geometry = new THREE.IcosahedronGeometry(40, 1);
const wireframe = new THREE.WireframeGeometry(geometry);
const lineMaterial = new THREE.LineBasicMaterial({
    color: colors.web,
    transparent: true,
    opacity: 0.3
});
const lineSegments = new THREE.LineSegments(wireframe, lineMaterial);
scene.add(lineSegments);

// Add focal points at vertices
const vertexGeo = new THREE.SphereGeometry(0.5, 8, 8);
const vertexMat = new THREE.MeshBasicMaterial({ color: colors.web, transparent: true, opacity: 0.5 });

const positions = geometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
    const sphere = new THREE.Mesh(vertexGeo, vertexMat);
    sphere.position.set(positions[i], positions[i + 1], positions[i + 2]);
    lineSegments.add(sphere);
}

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Subtle rotation
    lineSegments.rotation.y += 0.001;
    lineSegments.rotation.x += 0.0005;

    // Mouse influence
    lineSegments.rotation.y += mouseX * 0.01;
    lineSegments.rotation.x += -mouseY * 0.01;

    renderer.render(scene, camera);
}

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
