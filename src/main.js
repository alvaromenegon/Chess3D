
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import $ from 'jquery';

/*
* Carregar os módulos do THREE.js
* e armazenas como objetos de window
* para serem acessados globalmente
*/
console.log("THREE revision: ", THREE.REVISION);
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;
// Carregar o EffectComposer, RenderPass e ShaderPass
window.EffectComposer = EffectComposer;
window.RenderPass = RenderPass;
window.ShaderPass = ShaderPass;

// fazer o mesmo para jquery
window.$ = $;
window.jQuery = $;

function loadScripts(path) {
    const script = document.createElement('script');
    script.src = path;
    script.async = false;
    script.deferrer = true;
    document.head.appendChild(script);
}
// carregar o restante dos scripts

loadScripts('./src/globals.js'); //variaveis globais
loadScripts('./src/AI/garbochess.js'); // Carregar o AI do GarboChess
loadScripts('./src/lib/jquery/jquery-1.9.1.js'); // Carregar o jQuery 
loadScripts('./src/lib/jquery/jquery-ui-1.10.3.custom.min.js'); // Carregar o jQuery UI
loadScripts('./src/utils/three-extend.js');
loadScripts('./src/gui/loading.js');
loadScripts('./src/core/Cell.js');
loadScripts('./src/rendering/factory.js');
loadScripts('./src/utils/pgnParser.js');
loadScripts('./src/gui/gui.js');
loadScripts('./src/core/chess.js');