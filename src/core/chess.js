import * as THREE from "three";
import $ from "jquery";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Cell from "./Cell";
import ChessFactory from "../rendering/factory";
import { BOARD_SIZE, COLS, DEBUG, levels, SHADOW, BLACK, WHITE, ROWS } from "./constants";
import PGNUtils from "../utils/pgnUtils";
import ChessGui from "../gui/gui";

// list of valid move after each move
// used mostly for cell highlighting
var validMoves = null;

// default promotion
var moveflagPromoteQueen = 0x40 << 16;
var promotion = moveflagPromoteQueen;

/**
 * Main chess module.
 * @param {ChessFactory} factory - The instance of chess factory for creating chess pieces and board.
 * @param {PGNUtils} pgnUtils - The utility functions for handling PGN (Portable Game Notation).
 */
class Chess {
    /**
    * @param {ChessFactory} factory - The instance of chess factory for creating chess pieces and board.
    * @param {PGNUtils} pgnUtils - The utility functions for handling PGN (Portable Game Notation).
    */
    constructor(factory, pgnUtils) {
        this.factory = factory;
        this.pgnUtils = pgnUtils || window.pgnUtils;
        this.scene = new THREE.Scene();
        this.renderer = null;
        this.camera = null;

        this.cameraControls = null;
        // for picking
        this.raycaster = new THREE.Raycaster();
        // 3D board representation
        this.chessBoard = null
        // for proper timing
        this.clock = new THREE.Clock();
        this.g_backgroundEngine = null;
        this.g_backgroundEngineValid = true;

        // array for picking
        this.board3D = [];
        // chess game variables
        this.g_allMoves = [];

        // hold current selection
        this.selectedPiece = null;
        this.selectedCell = null;

        // default values for AI level
        this.g_timeout = 1600;
        this.g_maxply = 49;
    }

    /*
     * AI CONTROL
     */
    EnsureAnalysisStopped = () => {
        if (this.g_backgroundEngine) {
            this.g_backgroundEngine.terminate();
            this.g_backgroundEngine = null;
        }
    }

    InitializeBackgroundEngine = () => {
        // we initialize the web worker here
        if (!this.g_backgroundEngineValid) {
            return false;
        }
        if (!this.g_backgroundEngine) {
            this.g_backgroundEngineValid = true;
            try {
                this.g_backgroundEngine = new Worker("src/AI/garbochess.js");
                this.g_backgroundEngine.onmessage = (e) => {
                    if (e.data.match("^pv") == "pv") {
                        // legacy
                    } else if (e.data.match("^message") == "message") {
                        // legacy
                        this.EnsureAnalysisStopped();
                    } else if (e.data.match("^console: ") == "console: ") {
                        // debugging
                        console.log(e.data.substr(9));
                    } else {
                        // we receive the move from the AI, we play it
                        this.UIPlayMove(GetMoveFromString(e.data), false);
                    }
                };
                this.g_backgroundEngine.error = (e) => {
                    alert("Error from background worker:" + e.message);
                };
                // set up the current board position
                this.g_backgroundEngine.postMessage("position " + GetFen());
            } catch (error) {
                this.g_backgroundEngineValid = false;
            }
        }
        // return false for fallback
        return this.g_backgroundEngineValid;
    }

    initializeCamera(canvasRatio) {
        this.camera = new THREE.PerspectiveCamera(45, canvasRatio, 1, 40000);
        // CONTROLS
        this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);

        // limitations
        this.cameraControls.minPolarAngle = 0;
        this.cameraControls.maxPolarAngle = 80 * Math.PI / 180;
        this.cameraControls.minDistance = 10;
        this.cameraControls.maxDistance = 200;
        this.cameraControls.userZoomSpeed = 1.0;
        // default position behind white 
        // (might want to change that according to color selection)
        this.camera.position.set(0, 100, 100);

        window.camera = this.camera;
        return this.camera;
    }

    initializeSceneLights() {
        var spotlight = new THREE.SpotLight(0xFFFFFF, 50000.0);
        spotlight.position.set(0, 300, 0);
        spotlight.angle = Math.PI / 2;
        spotlight.exponent = 50.0;
        spotlight.target.position.set(0, 0, 0);

        if (SHADOW) {
            spotlight.castShadow = true;
            spotlight.shadowDarkness = 0.5;
            //spotlight.shadowMapWidth = 4096;  // yeah crazy testing
            //spotlight.shadowMapHeight = 4096;
            spotlight.shadowBias = -0.001;
        }


        var whiteLight = new THREE.PointLight(0xFFEEDD, 10000);
        whiteLight.position.set(0, 0, 100);
        var blackLight = new THREE.PointLight(0xFFEEDD, 10000);
        blackLight.position.set(0, 0, -100);
        return { spotlight, whiteLight, blackLight };
    }

    initializeScene(floor, spotlight, whiteLight, blackLight) {
        // fill the scene with default stuff
        this.scene.add(floor)
            .add(spotlight)
            .add(whiteLight)
            .add(blackLight)
            .add(this.chessBoard);
    }

    initializeRenderer = (renderer, canvasWidth, canvasHeight) => {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(canvasWidth, canvasHeight);

        if (SHADOW) {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.shadowMap.autoUpdate = true;
        }

        // black background
        renderer.setClearColor(0x000000, 1.0);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    onResize = () => {
        var w = window.innerWidth;
        var h = window.innerHeight;
        this.renderer.setSize(w, h);
        // have to change the projection
        // else the image will be stretched
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    animate = () => {
        window.requestAnimationFrame(this.animate);
        this.render();
    }

    render = () => {
        var delta = this.clock.getDelta();
        this.cameraControls.update(delta);
        this.renderer.render(this.scene, this.camera);
    }

    /*
     * BASIC SETUP
     * change from init to initGame to avoid confusion
     */
    initGame = () => {
        // initialize everything for 3D

        // CANVAS PARAMETERS 
        var canvasWidth = window.innerWidth;
        var canvasHeight = window.innerHeight;
        var canvasRatio = canvasWidth / canvasHeight;

        this.renderer = this.initializeRenderer(this.renderer, canvasWidth, canvasHeight);
        this.camera = this.initializeCamera(canvasRatio);
        var { spotlight, whiteLight, blackLight } = this.initializeSceneLights();
        // we let chessBoard in global scope to use it for picking
        this.chessBoard = this.factory.createChessBoard(BOARD_SIZE);
        var floor = this.factory.createFloor(BOARD_SIZE);

        //floor.position.y = -5*BOARD_SIZE/100;
        floor.position.y = this.chessBoard.height;

        this.initializeScene(floor, spotlight, whiteLight, blackLight);

        // picking event
        document.addEventListener('mousedown', this.onDocumentMouseDown, false);
        document.addEventListener('mousemove', this.onDocumentMouseMove, false);

        // avoid stretching
        window.addEventListener('resize', this.onResize, false);

    }

    onDocumentMouseMove = (event) => {
        var canvas = this.renderer.domElement;
        var raycaster = this.getRay(event);
        var pickedPiece = this.pickPiece(raycaster);
        var pickedCell = this.pickCell(raycaster);


        canvas.style.cursor = "default";
        // we are over one of our piece -> hand
        if (pickedPiece !== null) {
            canvas.style.cursor = "pointer";
        }

        // if a cell is selected, we unselect it by default
        if (this.selectedCell !== null) {
            this.selectedCell.material = this.selectedCell.baseMaterial;
        }

        // if a piece is selected and a cell is picked
        if (this.selectedPiece !== null && pickedCell !== null && pickedCell?.name !== 'board') {
            var start = Cell.fromIndex(this.selectedPiece.cell);
            var end = Cell.fromPosition(pickedCell.name);

            var move = null;
            // we check if it would be a valid move
            for (var i = 0; i < validMoves.length; i++) {
                if ((validMoves[i] & 0xFF) == MakeSquare(start.y, start.x) &&
                    ((validMoves[i] >> 8) & 0xFF) == MakeSquare(end.y, end.x)
                ) {
                    move = validMoves[i];
                    break;
                }
            }

            // then if a piece was clicked and we are on a valide cell
            // we highlight it and display a hand cursor
            if (pickedCell !== null && move !== null) {
                this.selectedCell = pickedCell;
                this.selectedCell.baseMaterial = this.selectedCell.material;
                this.selectedCell.material = this.factory.getValidCellMaterial(this.selectedCell.color);
                canvas.style.cursor = "pointer";
            }
        }
    }

    onDocumentMouseDown = (event) => {
        var raycaster = this.getRay(event);

        var pickedPiece = this.pickPiece(raycaster);
        var pickedCell = this.pickCell(raycaster);

        if (this.selectedPiece !== null && pickedCell !== null && pickedCell?.name !== 'board') {
            if (this.playMove(this.selectedPiece, pickedCell)) {
                // a move is played, we reset everything
                // any selectedPiece will disappear
                // since we redraw everything
                this.selectedPiece = null;
                pickedPiece = null;
                pickedCell = null;
            }
        }

        // when a click happen, any selected piece gets unselected
        if (this.selectedPiece !== null) {
            this.selectedPiece.children[0].material = this.selectedPiece.baseMaterial;
            //this.selectedPiece.children[1].material = this.selectedPiece.baseMaterial;
        }

        // then if a piece was clicked, we select it
        this.selectedPiece = pickedPiece;
        // window.selectedPiece = selectedPiece;
        if (this.selectedPiece !== null) {
            this.selectedPiece.baseMaterial = this.selectedPiece.children[0].material;
            this.selectedPiece.children[0].material = this.factory.getSelectedMaterial(this.selectedPiece.color);
            //this.selectedPiece.children[1].material = selectedMaterial[this.selectedPiece.color];
        }
    }

    /*
     * BOARD
     */
    updateBoard3D = () => {
        // list all the pieces
        this.board3D = [];
        for (var y = 0; y < ROWS; y++) {
            for (var x = 0; x < COLS; x++) {
                var piece = g_board[window.MakeSquare(y, x)];
                var pieceColor = (piece & colorWhite) ? WHITE : BLACK;
                var pieceName = null;
                switch (piece & 0x7) {
                    case piecePawn:
                        pieceName = "pawn";
                        break;
                    case pieceKnight:
                        pieceName = "knight";
                        break;
                    case pieceBishop:
                        pieceName = "bishop";
                        break;
                    case pieceRook:
                        pieceName = "rook";
                        break;
                    case pieceQueen:
                        pieceName = "queen";
                        break;
                    case pieceKing:
                        pieceName = "king";
                        break;
                }

                if (pieceName !== null) {
                    this.board3D[x + y * COLS] = this.factory.createPiece(pieceName, pieceColor);
                }
            }
        }
    }


    clearBoard = () => {
        // remove all pieces from the board
        this.board3D.forEach((piece) => {
            this.scene.remove(piece);
        });
    }


    fillBoard = () => {
        // place all the pieces on the board
        var cell;
        this.board3D.forEach((piece, index) => {
            cell = Cell.fromIndex(index);
            piece.position.copy(cell.getWorldPosition());
            piece.cell = index;
            this.scene.add(piece);
        });
    }

    #checkPromotion(piece, yPosition) {
        // Aplicar o método de refatoração Extract Variable

        const isPiecePawn = (piece & 0x7) === piecePawn;
        //não muda nada, só para deixar mais claro
        const isWhitePlayer = g_playerWhite;
        const isBlackPlayer = !g_playerWhite;
        // verificar se a peça é branca ou preta
        const isWhitePiece = (piece & 0x8) === colorWhite; // colorWhite é 8

        // se a peça é branca e está na linha 1 (ultima linha antes do final) - linha de promoção dos peões brancos
        // ou a peça é preta e está na linha 6 (ultima linha antes do final) - linha de promoção dos peões pretos
        const isPromotionRow = (yPosition === 1 && isWhitePlayer) || (yPosition === 6 && isBlackPlayer);
        // verificar se a peça é do jogador correto
        const isCorrectColor = (isWhitePiece && isWhitePlayer) || (!isWhitePiece && isBlackPlayer);

        return isPiecePawn && isPromotionRow && isCorrectColor;
    }

    /**
     * 
     * @param {*} piece - A piece object containing the current position and type.
     * @param {*} cell - A cell object representing the target position.
     * @returns {boolean} true if the move was successfully played, false otherwise.
     */
    playMove = (piece, cell) => {

        if (piece.cell === undefined || cell.name === undefined) {
            return false;
        }
        // get the positions
        var start = Cell.fromIndex(piece.cell);
        var end = Cell.fromPosition(cell.name);

        var startSquare = window.MakeSquare(start.y, start.x);
        var endSquare = window.MakeSquare(end.y, end.x);

        var move = null;
        var p = window.g_board[startSquare];

        var testPromotion = this.#checkPromotion(p, start.y);

        // check if the move is valid
        // validMoves is global and reevaluated after each move
        for (var i = 0; i < validMoves.length; i++) {
            if (testPromotion) {
                // for promotion we one valid move per promotion type
                // so we have to be more specific and create the entire move
                // with its flag go get it back from validMoves.
                // else it's alway a Rook promotion (flag 0x00).
                if (validMoves[i] === window.GenerateMove(startSquare, endSquare, moveflagPromotion | promotion)) {
                    move = validMoves[i];
                    break;
                }
            } else {
                // just checking start and end square allows to cover 
                // all other special moves like "en passant" capture and
                // castling
                if ((validMoves[i] & 0xFF) == startSquare &&
                    ((validMoves[i] >> 8) & 0xFF) == endSquare) {
                    move = validMoves[i];
                    break;
                }
            }
        }


        if (!(start.x === end.x && start.y === end.y) && move !== null) {

            // we send the move to our worker
            if (this.InitializeBackgroundEngine()) {
                this.g_backgroundEngine.postMessage(FormatMove(move));
            }

            // we play the actual move
            this.UIPlayMove(move, false);

            // make the engine play (setTimeOut is used probably to wait for the last postMessage to kick in)
            // maybe creating a callback from the worker would be better (more reliable)
            setTimeout(this.SearchAndRedraw, 0);
            return true;
        }
        return false;
    }

    undoMove = () => {
        ChessGui.hideCheckmate();
        if (this.g_allMoves.length === 0) {
            return;
        }

        if (this.g_backgroundEngine !== null) {
            this.g_backgroundEngine.terminate();
            this.g_backgroundEngine = null;
        }

        UnmakeMove(this.g_allMoves[this.g_allMoves.length - 1]);
        this.g_allMoves.pop();
        this.pgnUtils.g_pgn.pop();
        this.pgnUtils.g_pgn.pop();
        ChessGui.updatePGN(this.pgnUtils.getPGN());

        if (g_playerWhite !== Boolean(g_toMove) && this.g_allMoves.length !== 0) {
            UnmakeMove(this.g_allMoves[this.g_allMoves.length - 1]);
            this.g_allMoves.pop();
        }

        this.redrawBoard();
    }

    newGame = (level) => {
        ChessGui.clearPGN();
        ChessGui.hideCheckmate();
        // change AI parameters according to level
        if (levels[level] !== undefined) {
            g_timeout = levels[level].timeout;
            g_maxply = levels[level].maxply;
        }

        this.EnsureAnalysisStopped();
        ResetGame();
        if (this.InitializeBackgroundEngine()) {
            this.g_backgroundEngine.postMessage("go");
        }

        this.g_allMoves = [];

        this.redrawBoard(true);
        // removeStandbyAnimation();

        if (g_playerWhite) {
            this.camera.position.x = 0;
            this.camera.position.z = 100; // camera on white side
        } else {
            this.SearchAndRedraw();
            this.camera.position.x = 0;
            this.camera.position.z = -100; // camera on black side
        }
        ChessGui.showGameButtons();
    }

    redrawBoard = (isNewGame = false) => {
        validMoves = GenerateValidMoves();
        /* avoid calling unnecessary functions */
        if (!isNewGame) {
            ChessGui.displayCheck(validMoves);
        }
        this.clearBoard();
        this.updateBoard3D();
        this.fillBoard();

    }

    UIPlayMove = (move, silent) => {
        // we play the move here by 
        // adding it to the png list (for display)
        this.pgnUtils.addToPGN(move);
        // and to the move list (for undos)
        this.g_allMoves[this.g_allMoves.length] = move;
        // committing the move
        window.MakeMove(move);
        // redrawing 
        // silent flag is used when simulating moves for loading PGN
        if (!silent) {
            this.redrawBoard();
        }
        ChessGui.displayPlayerTurn();
    }

    SearchAndRedraw = () => {
        // the AI is triggered here
        if (this.InitializeBackgroundEngine()) {
            this.g_backgroundEngine.postMessage("search " + g_timeout + "," + g_maxply);
        } else {
            Search(this.FinishMove.bind(this), g_maxply, null); // unasynchronous version fall back
        }
    }


    FinishMove = (bestMove, value, timeTaken, ply) => {
        // used by the fallback Search
        if (bestMove !== null) {
            this.UIPlayMove(bestMove, false);
        }
    }

    /*
     * PICKING
     */
    pickPiece = (raycaster) => {
        var intersect = null;
        var picked = null;
        // intersect piece
        var hitList = [];
        var hit, piece;
        for (var i in this.board3D) {
            if ({}.hasOwnProperty.call(this.board3D, i)) {
                piece = this.board3D[i];
                intersect = raycaster.intersectObject(piece.children[0], true);

                if (intersect.length > 0) {
                    hit = intersect[0];
                    if ((g_playerWhite && hit.object.parent.color === WHITE) ||
                        (!g_playerWhite && hit.object.parent.color === BLACK)) {

                        // only pick the right color
                        hitList.push(hit);
                    }
                }
            }
        }

        // find the closest
        hitList.forEach((hit) => {
            if (picked === null || picked.distance > hit.distance) {
                picked = hit;
            }
        });


        if (picked) {
            return picked.object.parent;
        } else {
            return null;
        }

    }

    pickCell = (raycaster) => {
        // here we don't need to test the distance since you can't really
        // intersect more than one cell at a time.
        var intersect = raycaster.intersectObject(this.chessBoard, true);
        if (intersect.length > 0) {
            var pickedCell = intersect[0].object;
            return pickedCell;
        }
        return null;
    }

    getRay = (event) => {
        // get the raycaster object from the mouse position
        var zoomLevel = window.devicePixelRatio | 1.0;
        var canvas = this.renderer.domElement;
        var canvasPosition = canvas.getBoundingClientRect();
        var mouseX = event.clientX * zoomLevel - canvasPosition.left;
        var mouseY = event.clientY * zoomLevel - canvasPosition.top;

        var mouseVector = new THREE.Vector3(
            2 * (mouseX / canvas.width) - 1,
            1 - 2 * (mouseY / canvas.height));

        this.raycaster.setFromCamera(mouseVector, this.camera);
        return this.raycaster;
    }

    start = () => {
        this.initGame();
        if (DEBUG) {
            window.scene = this.scene;
            window.renderer = this.renderer;
            window.camera = this.camera;
        }
        this.redrawBoard(true);
        $("#btn-newGame").trigger("click");
        this.animate();
    }

};

export default Chess;