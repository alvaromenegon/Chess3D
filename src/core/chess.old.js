// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* jslint newcap: true */
/* global THREE, $, document, window,  console */
/* global LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
/* global textures, geometries, removeLoader */
/* global initGUI, initInfo, addToPGN, displayCheck, newGame */
/* global initPieceFactory,initCellFactory,createCell,createPiece,createChessBoard, createFloor, createValidCellMaterial,createSelectedMaterial, validCellMaterial, selectedMaterial */
/*global Search,FormatSquare,GenerateMove,MakeMove,GetMoveSAN,MakeSquare,UnmakeMove, FormatMove, ResetGame, GetFen, GetMoveFromString, alert, InitializeFromFen, GenerateValidMoves */
/*global g_inCheck,g_board,g_pieceList, g_toMove, g_timeout:true,g_maxply:true */
/*global moveflagCastleKing, moveflagCastleQueen, moveflagEPC, moveflagPromotion, colorWhite*/
/*global moveflagPromoteQueen,moveflagPromoteRook,moveflagPromoteBishop,moveflagPromoteKnight*/
/*global piecePawn, pieceKnight, pieceBishop, pieceRook, pieceQueen, pieceKing */

"use strict";



var camera;
// list of valid move after each move
// used mostly for cell highlighting
var validMoves = null;
// chess game variables
var g_allMoves = [];
// default promotion
var promotion = moveflagPromoteQueen;

var g_playerWhite = false;
var g_backgroundEngine;

// settings for AI level
var levels = [
	{ timeout: 0, maxply: 1 },
	{ timeout: 12, maxply: 20 },
	{ timeout: 25, maxply: 40 },
	{ timeout: 50, maxply: 60 },
	{ timeout: 100, maxply: 80 },
	{ timeout: 200, maxply: 100 },
	{ timeout: 400, maxply: 120 },
	{ timeout: 800, maxply: 140 },
	{ timeout: 1600, maxply: 160 },
	{ timeout: 3200, maxply: 180 }
];


(function () {
	// general setup
	var scene, renderer;
	var cameraControls, effectController;
	// for picking
	var projector;
	// 3D board representation
	var chessBoard;
	// for proper timing
	var clock = new THREE.Clock();

	var g_backgroundEngineValid = true;

	// array for picking
	var board3D = [];


	// hold current selection
	var selectedPiece = null;
	var selectedCell = null;

	// default values for AI level
	g_timeout = 1600;
	g_maxply = 49;

	function initializeCamera(canvasRatio) { //ok
		camera = new THREE.PerspectiveCamera(45, canvasRatio, 1, 40000);
		// CONTROLS
		cameraControls = new OrbitControls(camera, renderer.domElement);

		// limitations
		cameraControls.minPolarAngle = 0;
		cameraControls.maxPolarAngle = 80 * Math.PI / 180;
		cameraControls.minDistance = 10;
		cameraControls.maxDistance = 200;
		cameraControls.userZoomSpeed = 1.0;
		// default position behind white 
		// (might want to change that according to color selection)
		camera.position.set(0, 100, 100);

		window.camera = camera;
		return camera;
	}

	function initializeSceneLights() { //ok
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

	function initializeScene(floor, spotlight, whiteLight, blackLight) { //ok
		// create and fill the scene with default stuff
		scene = new THREE.Scene();
		scene.add(floor)
			.add(spotlight)
			.add(whiteLight)
			.add(blackLight)
			.add(chessBoard);
	}

	function initializeRenderer(renderer, canvasWidth, canvasHeight) { //ok
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(canvasWidth, canvasHeight);

		if (SHADOW) {
			renderer.shadowMapEnabled = true;
			renderer.shadowMapType = THREE.PCFSoftShadowMap;
			renderer.shadowMapCascade = true;
		}

		// black background
		renderer.setClearColor(0x000000, 1.0);
		document.body.appendChild(renderer.domElement);
		return renderer;
	}
	/*
	 * BASIC SETUP
	 */
	function init() { //ok
		// initialize everything for 3D

		// CANVAS PARAMETERS 
		var canvasWidth = window.innerWidth;
		var canvasHeight = window.innerHeight;
		var canvasRatio = canvasWidth / canvasHeight;

		renderer = initializeRenderer(renderer, canvasWidth, canvasHeight);
		camera = initializeCamera(canvasRatio);
		var { spotlight, whiteLight, blackLight } = initializeSceneLights();

		// we let chessBoard in global scope to use it for picking
		chessBoard = createChessBoard(BOARD_SIZE);
		var floor = createFloor(BOARD_SIZE);

		//floor.position.y = -5*BOARD_SIZE/100;
		floor.position.y = chessBoard.height;

		initializeScene(floor, spotlight, whiteLight, blackLight);

		// for picking
		projector = new THREE.Raycaster();

		// picking event
		document.addEventListener('mousedown', onDocumentMouseDown, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);

		// avoid stretching
		window.addEventListener('resize', onResize, false);

	}

	function onResize() { //ok
		var canvas = renderer.domElement;
		var w = window.innerWidth;
		var h = window.innerHeight;
		renderer.setSize(w, h);
		// have to change the projection
		// else the image will be stretched
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	function animate() { //ok
		window.requestAnimationFrame(animate);
		render();
	}

	function render() { //ok
		var delta = clock.getDelta();
		cameraControls.update(delta);
		renderer.render(scene, camera);
	}

	function UIPlayMove(move, silent) {
		// we play the move here by 
		// adding it to the png list (for display)
		pgnUtils.addToPGN(move);
		// and to the move list (for undos)
		g_allMoves[g_allMoves.length] = move;
		// committing the move
		MakeMove(move);
		// redrawing 
		// silent flag is used when simulating moves for loading PGN
		if (!silent) {
			redrawBoard();
		}
		displayPlayerTurn();
	}

	function checkPromotion(piece, yPosition) { //ok
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

	function playMove(piece, cell) { //ok

		if (piece.cell === undefined || cell.name === undefined) {
			return false;
		}
		// get the positions
		var start = Cell.fromIndex(piece.cell);
		var end = Cell.fromPosition(cell.name);

		var startSquare = MakeSquare(start.y, start.x);
		var endSquare = MakeSquare(end.y, end.x);

		var move = null;
		var p = g_board[startSquare];

		var testPromotion = checkPromotion(p, start.y);

		// check if the move is valid
		// validMoves is global and reevaluated after each move
		for (var i = 0; i < validMoves.length; i++) {
			if (testPromotion) {
				// for promotion we one valid move per promotion type
				// so we have to be more specific and create the entire move
				// with its flag go get it back from validMoves.
				// else it's alway a Rook promotion (flag 0x00).
				if (validMoves[i] === GenerateMove(startSquare, endSquare, moveflagPromotion | promotion)) {
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
			if (InitializeBackgroundEngine()) {
				g_backgroundEngine.postMessage(FormatMove(move));
			}

			// we play the actual move
			UIPlayMove(move, false);

			// make the engine play (setTimeOut is used probably to wait for the last postMessage to kick in)
			// maybe creating a callback from the worker would be better (more reliable)
			setTimeout(SearchAndRedraw, 0);
			return true;
		}
		return false;
	}


	/*
	 * AI CONTROL
	 */
	function EnsureAnalysisStopped() { //ok
		if (g_backgroundEngine) {
			g_backgroundEngine.terminate();
			g_backgroundEngine = null;
		}
	}

	function SearchAndRedraw() { //ok
		// the AI is triggered here
		if (InitializeBackgroundEngine()) {
			g_backgroundEngine.postMessage("search " + g_timeout + "," + g_maxply);
		} else {
			Search(FinishMove, g_maxply, null); // unasynchronous version fall back
		}
	}

	function FinishMove(bestMove, value, timeTaken, ply) { //ok
		// used by the fallback Search
		if (bestMove !== null) {
			UIPlayMove(bestMove, false);
		}
	}

	function InitializeBackgroundEngine() {
		// we initialize the web worker here
		if (!g_backgroundEngineValid) {
			return false;
		}
		if (!g_backgroundEngine) {
			g_backgroundEngineValid = true;
			try {
				g_backgroundEngine = new Worker("src/AI/garbochess.js");
				g_backgroundEngine.onmessage = function (e) {
					if (e.data.match("^pv") == "pv") {
						// legacy
					} else if (e.data.match("^message") == "message") {
						// legacy
						EnsureAnalysisStopped();
					} else if (e.data.match("^console: ") == "console: ") {
						// debugging
						console.log(e.data.substr(9));
					} else {
						// we receive the move from the AI, we play it
						UIPlayMove(GetMoveFromString(e.data), false);
					}
				};
				g_backgroundEngine.error = function (e) {
					alert("Error from background worker:" + e.message);
				};
				// set up the current board position
				g_backgroundEngine.postMessage("position " + GetFen());
			} catch (error) {
				g_backgroundEngineValid = false;
			}
		}
		// return false for fallback
		return g_backgroundEngineValid;
	}

	/*
	 * BOARD
	 */
	function updateBoard3D() { //ok
		// list all the pieces
		board3D = [];
		for (var y = 0; y < ROWS; y++) {
			for (var x = 0; x < COLS; x++) {
				var piece = g_board[MakeSquare(y, x)];
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
					board3D[x + y * COLS] = window.createPiece(pieceName, pieceColor);
				}
			}
		}
	}

	function clearBoard() { //ok
		// remove all pieces from the board
		var cell;
		board3D.forEach(function (piece) {
			scene.remove(piece);
			cell = Cell.fromIndex(piece.cell);
		});
	}

	function fillBoard() { //ok
		// place all the pieces on the board
		var cell;
		board3D.forEach((piece, index) => {
			cell = Cell.fromIndex(index);
			piece.position.copy(cell.getWorldPosition());
			piece.cell = index;
			scene.add(piece);
		});
	}

	function redrawBoard(isNewGame = false) { //ok
		validMoves = GenerateValidMoves();
		/* avoid calling unnecessary functions */
		if (!isNewGame) {
			displayCheck();
			clearBoard();
		}
		updateBoard3D();
		fillBoard();

	}


	/*
	 * PICKING
	 */
	function pickPiece(raycaster) { //ok
		var intersect = null;
		var picked = null;
		// intersect piece
		var hitList = [];
		var hit, piece;
		for (var i in board3D) {
			if ({}.hasOwnProperty.call(board3D, i)) {
				piece = board3D[i];
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
		hitList.forEach(function (hit) {
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

	function pickCell(raycaster) { //ok
		// here we don't need to test the distance since you can't really
		// intersect more than one cell at a time.
		var intersect = raycaster.intersectObject(chessBoard, true);
		if (intersect.length > 0) {
			var pickedCell = intersect[0].object;
			return pickedCell;
		}
		return null;
	}

	function getRay(event) { //ok
		// get the raycaster object from the mouse position
		var zoomLevel = window.devicePixelRatio | 1.0;
		var canvas = renderer.domElement;
		var canvasPosition = canvas.getBoundingClientRect();
		var mouseX = event.clientX * zoomLevel - canvasPosition.left;
		var mouseY = event.clientY * zoomLevel - canvasPosition.top;

		var mouseVector = new THREE.Vector3(
			2 * (mouseX / canvas.width) - 1,
			1 - 2 * (mouseY / canvas.height));

		projector.setFromCamera(mouseVector, camera);
		return projector;
	}

	function onDocumentMouseMove(event) { //ok

		var canvas = renderer.domElement;
		var raycaster = getRay(event);
		var pickedPiece = pickPiece(raycaster);
		var pickedCell = pickCell(raycaster);


		canvas.style.cursor = "default";
		debugger;
		// we are over one of our piece -> hand
		if (pickedPiece !== null) {
			canvas.style.cursor = "pointer";
		}

		// if a cell is selected, we unselect it by default
		if (selectedCell !== null) {
			selectedCell.material = selectedCell.baseMaterial;
		}

		// if a piece is selected and a cell is picked
		if (selectedPiece !== null && pickedCell !== null) {
			var start = Cell.fromIndex(selectedPiece.cell);
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
				selectedCell = pickedCell;
				selectedCell.baseMaterial = selectedCell.material;
				selectedCell.material = window.getValidCellMaterial(selectedCell.color);
				canvas.style.cursor = "pointer";
			}
		}
	}

	function onDocumentMouseDown(event) { //ok

		var canvas = renderer.domElement;
		var raycaster = getRay(event);

		var pickedPiece = pickPiece(raycaster);
		var pickedCell = pickCell(raycaster);

		if (selectedPiece !== null && pickedCell !== null) {
			if (playMove(selectedPiece, pickedCell)) {
				// a move is played, we reset everything
				// any selectedPiece will disappear
				// since we redraw everything
				selectedPiece = null;
				pickedPiece = null;
				pickedCell = null;
			}
		}

		// when a click happen, any selected piece gets unselected
		if (selectedPiece !== null) {
			selectedPiece.children[0].material = selectedPiece.baseMaterial;
			//selectedPiece.children[1].material = selectedPiece.baseMaterial;
		}

		// then if a piece was clicked, we select it
		selectedPiece = pickedPiece;
		// window.selectedPiece = selectedPiece;
		if (selectedPiece !== null) {
			selectedPiece.baseMaterial = selectedPiece.children[0].material;
			selectedPiece.children[0].material = window.getSelectedMaterial(selectedPiece.color);
			//selectedPiece.children[1].material = selectedMaterial[selectedPiece.color];
		}
	}


	// all resources (meshs and textures) are loaded
	function onLoaded() {
		// removeLoader();

		init();
		if (DEBUG) {
			window.scene = scene;
			window.renderer = renderer;
			window.camera = camera;
		}
		redrawBoard(true);
		window.showNewGameOptions();
		animate();
	}

	window.SearchAndRedraw = SearchAndRedraw;
	window.onLoaded = onLoaded;
	window.redrawBoard = redrawBoard;
	window.EnsureAnalysisStopped = EnsureAnalysisStopped;
	window.InitializeBackgroundEngine = InitializeBackgroundEngine;
	window.UIPlayMove = UIPlayMove;

})();


