import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as character from "./character.js"
import { setupPostProcessing } from './composer.js'
import { createGround } from './ground.js'
import { createBackground } from './background.js'

let scene
let renderer
let animationFrameId

function runGame() {
  const width = document.body.clientWidth
  const height = document.body.clientHeight
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 4, 5);
  camera.lookAt(new THREE.Vector3(0, 1, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height)
  document.body.appendChild(renderer.domElement);
  renderer.domElement.classList.add('three-scene')

  const { composer, pixelPass, noisePass } = setupPostProcessing(renderer, scene, camera);
  scene.background = null
  //console.log(pixelPass, noisePass)
  pixelPass.uniforms.pixelSize.value = 3.0
  noisePass.enabled = true
  noisePass.uniforms.amount.value = 0.5

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);
  controls.minDistance = 5;
  controls.maxDistance = 8;
  controls.minPolarAngle = Math.PI / 4;   // 45 degrees
  controls.maxPolarAngle = Math.PI / 2;   // 90 degrees
  controls.zoomSpeed = 5; // Default is 1. Lower = slower, higher = faster
  controls.enablePan = false
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(5, 10, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const chars = character.loadCharacters(scene, [
    { template: "Fem", pos: [1,0,0] },
    { template: "Male", pos: [-1,0,0] },
  ])
  const ground = createGround(scene, "grass")
  createBackground(scene, "city", [6,11.5,0], [0,-Math.PI/2,0], [30,25], [1.0,1], [1.0,1.0,1.0])
  createBackground(scene, "city", [-3,11.5,-12], [0,0,0], [15,25], [0.5,1], [1.0,1.0,1.0])

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastClickTime = 0

  function handleInputStart(event) {
    // Prevent default touch behavior (like scrolling)
    event.preventDefault();

    let clientX, clientY;

    if (event.touches) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      if (event.button !== 0) return; // Only left mouse button
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const currentTime = performance.now();
    lastClickTime = currentTime;
  }

  function handleInputEnd(event) {
    event.preventDefault(); // Prevent default touch behavior

    let clientX, clientY;

    if (event.changedTouches) {
      // Touch event
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Mouse event
      if (event.button === 2) {
        chant = "";
        hudInfo.innerText = chant;
        return;
      }
      clientX = event.clientX;
      clientY = event.clientY;
    }

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    const currentTime = performance.now();
    const clickTime = currentTime - lastClickTime;
    if (clickTime > 200) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(chars[0].obj, true);

    if (intersects.length > 0) {
      character.playAnimation(chars[0], "Sword Slash");
    } else {
      character.playAnimation(chars[1], "Pistol Fire");
    }
  }

  const canvas = renderer.domElement
  canvas.addEventListener('mouseup', handleInputEnd);
  canvas.addEventListener('mousedown', handleInputStart);

  canvas.addEventListener('touchend', handleInputEnd);
  canvas.addEventListener('touchstart', handleInputStart, { passive: false }); // passive: false is important to allow preventDefault()

  const clock = new THREE.Clock();

  function animate(time) {
    animationFrameId = requestAnimationFrame(animate)
    const delta = clock.getDelta()

    if (chars.length > 0) {
      chars.forEach(c => {
        c.mixer.update(delta)
      })
    }

    controls.update()
    //renderer.render(scene, camera)    
    noisePass.uniforms.time.value = time * 0.001
    composer.render()
  }

  animate();

  window.addEventListener('resize', () => {
    const width = document.body.clientWidth // window.innerWidth
    const height = document.body.clientHeight // widow.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    composer.setSize(width, height)
    pixelPass.uniforms.resolution.value.set(width, height)
  });
}

function removeScene() {
  const container = document.getElementById('three-game');
  const canvas = container ? container.querySelector('canvas') : null;
  // 1. Stop animation loop (assuming you have animationFrameId)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // 2. Dispose of resources
  if (scene) {
    scene.traverse(function (object) {
      if (object.isMesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      if (object.material && object.material.map) object.material.map.dispose();
      if (object.material && object.material.normalMap) object.material.normalMap.dispose();
    });
  }
  // 3. Remove event listeners
  if (canvas) {
    // Remove any event listeners attached to the canvas or window
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousedown');
    window.removeEventListener('mouseup');
    window.removeEventListener('touchstart');
    window.removeEventListener('touchend');
  }
  // 4. Dispose of the renderer
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  // 5. Remove the container (and its children, including the canvas) from the DOM
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  scene = null;
}

export {
  runGame,
  removeScene
}
