
import * as THREE from 'three';
import $ from 'jquery';
import { pgnUtils } from './utils/pgnUtils.js';
import ChessFactory from './rendering/factory.js';
import { ResourceManager } from './core/loading.js';
import { LEVELS } from './core/constants.js';
import { load, saveGame } from './core/game.js';
import ChessGui from './gui/gui.js';
import Chess from './core/chess.js';
/*
* Armazenar funções de módulos e variáveis globais
* no escopo global do window
* para que possam ser acessadas por scripts
*/
console.log("THREE revision: ", THREE.REVISION);
window.$ = $;
const resourceManager = new ResourceManager();
window.resourceManager = resourceManager;
window.pgnUtils = pgnUtils;

// Funções de jogo
window.loadGame = load;
window.saveGame = saveGame;

// GUI
window.ChessGui = ChessGui;

// Classe principal do jogo
window.Chess = Chess;

/* Variáveis globais */
window.levels = LEVELS;

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

export { resourceManager };