import * as THREE from 'three';
import grass from './assets/grass.jpg';
import groundAlphaUrl from './assets/path-alpha.png';

let groundMesh;

function createGround(scene, bg) {
  const textureLoader = new THREE.TextureLoader();

  // Load texture and alpha map
  const groundTextureUrl = grass
  const texture = textureLoader.load(groundTextureUrl);
  const alphaMap = textureLoader.load(groundAlphaUrl);

  const length = 2

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  alphaMap.wrapS = alphaMap.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, length)
  alphaMap.repeat.set(1, length)

  const color = bg === "grass" ? 0xccccaa : 0xffffff

  const geometry = new THREE.PlaneGeometry(10, length*10);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    map: texture,
    alphaMap: alphaMap,
    transparent: true,         // Needed for alphaMap to work
    depthWrite: false,         // Optional: helps with transparency rendering
  });

  groundMesh = new THREE.Mesh(geometry, material);
  groundMesh.rotation.x = -Math.PI / 2;  // Make it horizontal
  groundMesh.position.z = 0
  groundMesh.receiveShadow = true;
  groundMesh.name = "ground"

  scene.add(groundMesh);

  return groundMesh
}

export { createGround };
