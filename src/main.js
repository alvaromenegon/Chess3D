
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
import ChessFactory from './rendering/factory.js';
import { ResourceManager } from './core/loading.js';
import { WIREFRAME, SHADOW, BLACK, WHITE, FEEDBACK, DEBUG, BOARD_SIZE, PIECE_SIZE, FLOOR_SIZE, COLS, ROWS, LOADING_BAR_SCALE } from './core/constants.js';
/*
* Carregar os módulos do THREE.js
* e armazenas como objetos de window
* para serem acessados globalmente
*/
console.log("THREE revision: ", THREE.REVISION);
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;
// fazer o mesmo para jquery
window.$ = $;

/* Mover algumas das funções em closure para módulos JS */
/* E mover como funções globais para compatibilidade */
const resourceManager = new ResourceManager();
const chessFactory = new ChessFactory(resourceManager);
window.resourceManager = resourceManager;
window.pgnUtils = pgnUtils;
window.cloneAndTileTexture = cloneAndTileTexture;
window.tileTextureAndRepeat = tileTextureAndRepeat;
window.cloneTexture = cloneTexture;

window.createChessBoard = chessFactory.createChessBoard;
window.createFloor = chessFactory.createFloor;
window.getSelectedMaterial = chessFactory.getSelectedMaterial;
window.getValidCellMaterial = chessFactory.getValidCellMaterial;
window.createPiece = chessFactory.createPiece;

/* Classes */
window.Piece = Piece;
window.Cell = Cell;
window.Move = Move;

/* Variáveis globais */
window.WIREFRAME = WIREFRAME;
window.SHADOW = SHADOW;
window.BLACK = BLACK;
window.WHITE = WHITE;
window.FEEDBACK = FEEDBACK;
window.DEBUG = DEBUG;
window.BOARD_SIZE = BOARD_SIZE;
window.PIECE_SIZE = PIECE_SIZE;
window.FLOOR_SIZE = FLOOR_SIZE;
window.COLS = COLS;
window.ROWS = ROWS;
window.LOADING_BAR_SCALE = LOADING_BAR_SCALE;

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
    window.resourceManager.loadResources().then(() => {
        console.log('Recursos carregados');        
    }).catch((error) => {
        alert('Erro ao carregar recursos. Verifique o console para mais detalhes.');
        console.error('Erro ao carregar recursos:', error);
    });
}
// carregar o restante dos scripts

loadScripts('./src/AI/garbochess.js'); // Carregar o AI do GarboChess
loadScripts('./src/gui/gui.js');
loadScripts('./src/core/chess.js');

export { resourceManager };