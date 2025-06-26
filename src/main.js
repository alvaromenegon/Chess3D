
import * as THREE from 'three';
import $ from 'jquery';
import { LEVELS } from './core/constants.js';
import { load, saveGame } from './core/game.js';
import ChessGui from './gui/gui.js';
import chess from './core/chess.js';
console.log("THREE revision: ", THREE.REVISION);
window.$ = $;

// Funções de jogo
window.loadGame = load;
window.saveGame = saveGame;

// GUI
window.ChessGui = ChessGui;

/* Variáveis globais */
window.levels = LEVELS;

window.onload = ()=>{
    try{
        chess.init(); // Inicia o jogo quando a página é carregada
    } catch (error) {
        ChessGui.showLoadingFeedback('Failed to initialize the game. Please check the console for details.' + error);
        console.error('Error initializing the game:', error);
    }
}
