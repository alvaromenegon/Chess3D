
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import $ from 'jquery';
import { pgnUtils } from './utils/pgnUtils.js';
import Piece from './core/Piece.js';
import Cell from './core/Cell.js';
import Move from './core/Move.js';
import { cloneAndTileTexture, cloneTexture, tileTextureAndRepeat } from './utils/three-extend.js';
import ChessFactory from './rendering/factory.js';
import { ResourceManager } from './core/loading.js';
import { WIREFRAME, SHADOW, BLACK, WHITE, FEEDBACK, DEBUG, BOARD_SIZE, PIECE_SIZE, FLOOR_SIZE, COLS, ROWS, LOADING_BAR_SCALE, LEVELS } from './core/constants.js';
import { load, saveGame } from './core/game.js';
import ChessGui from './gui/gui.js';
import Chess from './core/chess.js';
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
// const chessFactory = new ChessFactory(resourceManager);
window.resourceManager = resourceManager;
window.pgnUtils = pgnUtils;
window.cloneAndTileTexture = cloneAndTileTexture;
window.tileTextureAndRepeat = tileTextureAndRepeat;
window.cloneTexture = cloneTexture;

// Funções de jogo
window.loadGame = load;
window.saveGame = saveGame;


// GUI
window.displayPlayerTurn = ChessGui.displayPlayerTurn;
window.clearPGN = ChessGui.clearPGN;
window.updatePGN = ChessGui.updatePGN;
window.openMenu = ChessGui.openMenu;
window.showGameButtons = ChessGui.showGameButtons;
window.hideCheckmate = ChessGui.hideCheckmate;
window.displayCheck = ChessGui.displayCheck;
// window.removeLoader = () => $('#loading').remove();

/* Classes */
window.Piece = Piece;
window.Cell = Cell;
window.Move = Move;

window.Chess = Chess;

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
window.levels = LEVELS;

// Função para carregar scripts de forma síncrona
// Isso é necessário para garantir que os scripts sejam carregados na ordem correta
function loadScripts(path) {
    const script = document.createElement('script');
    script.src = path;
    script.async = false;
    script.deferrer = true;
    document.head.appendChild(script);
}

window.onload = async () =>  {
    try{
        await resourceManager.loadResources();
        const factory = new ChessFactory(resourceManager);
        const chess = new Chess(factory,pgnUtils);
        chess.start();
        $('#loading').remove();
        window.chess = chess; // Armazenar a instância de Chess globalmente
        window.newGame = chess.newGame;
        window.undoMove = chess.undoMove;
        window.g_allMoves = chess.g_allMoves;
    } catch (error) {
        alert('Erro ao carregar recursos. Verifique o console para mais detalhes.');
        console.error('Erro ao carregar recursos:', error);
    }
}
// carregar o restante dos scripts

// Carregar as funções e variáveis globais do GarboChess
// A IA em sim será chamada por um Worker
loadScripts('./src/AI/garbochess.js');
// loadScripts('./src/gui/gui.js');
// loadScripts('./src/core/chess.js');

export { resourceManager };