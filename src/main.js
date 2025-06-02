
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/*
* Carregar os módulos do THREE.js
* e armazenas como objetos de window
* para serem acessados globalmente
*/

console.log("THREE.js old version:", window.THREE.REVISION);
console.log("THREE new version:", THREE.REVISION);
window.THREE = THREE; // Manter assim por enquanto para não quebrar o código existente
window.OrbitControls = OrbitControls; // E salvar o novo nome também para poder atualizar o código no futuro aos poucos
window.GLTFLoader = GLTFLoader;