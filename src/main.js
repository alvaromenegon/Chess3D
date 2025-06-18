
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import $ from 'jquery';
import { pgnUtils } from './utils/pgnUtils.js';
import Piece from './core/Piece.js';
import Cell from './core/Cell.js';
import Move from './core/Move.js';
import { cloneAndTileTexture, cloneTexture, tileTextureAndRepeat } from './utils/three-extend.js';
// import { createChessBoard, createFloor, createSelectedMaterial, createValidCellMaterial,initCellFactory,initPieceFactory } from './rendering/factory.js';
import  { ResourceManager } from './core/loading.js';
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

/* Mover algumas das funções em closure para módulos JS */
/* E mover como funções globais para compatibilidade */
window.resourceManager = new ResourceManager();
window.pgnUtils = pgnUtils;
window.cloneAndTileTexture = cloneAndTileTexture;
window.tileTextureAndRepeat = tileTextureAndRepeat;
window.cloneTexture = cloneTexture;
/*
window.createChessBoard = createChessBoard;
window.createFloor = createFloor;
window.createSelectedMaterial = createSelectedMaterial;
window.createValidCellMaterial = createValidCellMaterial;
window.initCellFactory = initCellFactory;
window.initPieceFactory = initPieceFactory;*/

/* Classes */
window.Piece = Piece;
window.Cell = Cell;
window.Move = Move;


/* Variáveis globais */
window.WIREFRAME = false;
window.SHADOW = false;
window.BLACK = 0;
window.WHITE = 1;
window.FEEDBACK = 2;
window.DEBUG = false;
window.BOARD_SIZE = 100;
window.PIECE_SIZE = 0.4;
window.FLOOR_SIZE = 2000;
window.COLS = 8;
window.ROWS = 8;
window.LOADING_BAR_SCALE = 0.3;

// Função para carregar scripts de forma síncrona
// Isso é necessário para garantir que os scripts sejam carregados na ordem correta
function loadScripts(path) {
    const script = document.createElement('script');
    script.src = path;
    script.async = false;
    script.deferrer = true;
    document.head.appendChild(script);
}

window.onload = () => {
    // Carregar os recursos necessários
    // loadResources();    
    window.resourceManager.loadResources().then(({meshes,textures}) => {
        console.log('Recursos carregados:', meshes, textures);
        /* compatibilidade com o código antigo */
        window.geometries = meshes;
        window.textures = textures;
    });
}
// carregar o restante dos scripts

loadScripts('./src/AI/garbochess.js'); // Carregar o AI do GarboChess
loadScripts('./src/rendering/factory.js');
loadScripts('./src/utils/pgnParser.js');
loadScripts('./src/gui/gui.js');
loadScripts('./src/core/chess.js');