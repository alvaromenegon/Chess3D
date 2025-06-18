
// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* jslint newcap: true */
/* global THREE,  $, document, window, console */
/* global LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
/* global SearchAndRedraw, UIPlayMove, camera, levels, g_allMoves:true, promotion:true, g_backgroundEngine:true, validMoves, InitializeBackgroundEngine, EnsureAnalysisStopped, newGame, redrawBoard, parsePGN, g_playerWhite:true */
/*global Search,FormatSquare,GenerateMove,MakeMove,GetMoveSAN,MakeSquare,UnmakeMove, FormatMove, ResetGame, GetFen, GetMoveFromString, alert, InitializeFromFen, GenerateValidMoves */
/*global g_inCheck,g_board,g_pieceList, g_toMove, g_timeout:true,g_maxply:true */
/*global moveflagCastleKing, moveflagCastleQueen, moveflagEPC, moveflagPromotion, colorWhite*/
/*global moveflagPromoteQueen,moveflagPromoteRook,moveflagPromoteBishop,moveflagPromoteKnight*/
/*global piecePawn, pieceKnight, pieceBishop, pieceRook, pieceQueen, pieceKing */
"use strict";

(function () {

	// jQuery pgn textarea
	var $moveList = $("#moveList");
	// jQuery check feedback
	var $info;
	/* compatibilidade com o antigo código */
	const pgnUtils = window.pgnUtils || {};
	pgnUtils.setOnUpdatePGN(updatePGN);
	if (!pgnUtils) {
		throw new Error("pgnUtils is not defined");
	}
	const loadPGN = (pgn) => {
		clearPGN();
		pgnUtils.loadPGN(pgn);
		// fechar o menu
		$("#gui").addClass("hidden");
		$("#openMenu").removeClass("hidden");
		$("#pause").remove();
	}

	function initInfo() {
		// create the DOM element
		// to display Chc
		$info = $("<div>")
			.attr("id", "info")
			.addClass("hidden")
			.text("Check")
			.appendTo($("body"))
	}
	/**
	 * Escurece um pouco a tela por trás do menu
	 * e remove o hidden
	 */
	function openMenu() {
		$("#gui").removeClass("hidden");
		let pause = $("<div>");
		pause.attr("id", "pause")
			.css("position", "absolute")
			.css("top", "0")
			.css("left", "0")
			.css("width", "100%")
			.css("height", "100%")
			.css("background-color", "rgba(0, 0, 0, 0.5)")
			.css("z-index", "13")
			.appendTo($("body"));
		$("#openMenu").addClass("hidden");
		$("#closeMenu").removeClass("hidden").on("click", function () {
			$("#gui").addClass("hidden");
			pause.remove();
			$("#openMenu").removeClass("hidden");
			$("#closeMenu").addClass("hidden");
		});
	}


	function initGUI() {
		$("#openMenu").on("click", openMenu);
		$("#promotionSelect").on("change", changePromo);
		$("#btn-newGame").on("click", newGameDialog);
		$("#btn-loadGame").on("click", loadDialog);
		$("#uploadFile").on("change", load);
		$("#btn-saveGame").on("click", save);
		$("#btn-undo").on("click", undo);
	}

	function handleCancelClick() {
		$("#cancelNewGameButton").on("click", function () {
			// close the dialog
			$dialog.addClass("hidden");
			// remove the event listeners
			$("#startGameButton").off("click");
			$("#cancelNewGameButton").off("click");
			$("#startColorSelect").off("change");
			$("#difficultySelect").off("change");
		});
	}

	function handleLoadGameClick($dialog) {
		$("#loadGameButton").on("click", function (event) {
			// close the dialog
			$dialog.addClass("hidden");
			// remove the event listeners
			$("#startGameButton").off("click");
			$("#cancelNewGameButton").off("click");
			$("#startColorSelect").off("change");
			$("#difficultySelect").off("change");
			loadDialog();
		});
	}

	function initializeStartColor() {
		var $whiteRadio = $("#white");
		var $blackRadio = $("#black");
		// set the default color to white
		$whiteRadio.prop("checked", true);
		$whiteRadio.on("change", changeStartPlayer);
		$blackRadio.on("change", changeStartPlayer);
	}

	function initializeDifficulty() {
		var $levelSelect = $("#difficultySelect");
		// set the default level to 0
		$levelSelect.val(0);

		$levelSelect.on("change", function (event) {
			var level = $(event.currentTarget).val();
			if (levels[level - 1] !== undefined) {
				g_timeout = levels[level - 1].timeout;
				g_maxply = levels[level - 1].maxply;
			}
			// update the info text
			$("#difficulty").text(level);
		});
	}


	function newGameDialog() {
		g_playerWhite = true; // default to white
		hideCheckmate();
		var $dialog = $("#newGameDialog");
		// show the dialog
		$dialog.removeClass("hidden");
		initializeDifficulty();
		initializeStartColor();
		handleNewGameClick($dialog, newGame);
		handleCancelClick();
		handleLoadGameClick($dialog);
	}

	function showGameButtons() {
		displayPlayerTurn(g_playerWhite);
		$("#difficultyLevel").text("0");
		$("#game-info").removeClass("hidden");
		$("#openMenu").removeClass("hidden");
	}

	/*
	 * GAME CONTROL
	 */
	function newGame(level) {
		console.log(g_playerWhite);
		// change AI parameters according to level
		if (levels[level] !== undefined) {
			g_timeout = levels[level].timeout;
			g_maxply = levels[level].maxply;
		}

		EnsureAnalysisStopped();
		ResetGame();
		if (InitializeBackgroundEngine()) {
			g_backgroundEngine.postMessage("go");
		}

		g_allMoves = [];
		clearPGN();
		redrawBoard();
		// removeStandbyAnimation();

		if (g_playerWhite) {
			camera.position.x = 0;
			camera.position.z = 100; // camera on white side
		} else {
			SearchAndRedraw();
			camera.position.x = 0;
			camera.position.z = -100; // camera on black side
		}		
		showGameButtons();
	}

	function changeStartPlayer(event) {
		g_playerWhite = $("#white").is(":checked");
		if (g_playerWhite) {
			camera.position.x = 0;
			camera.position.z = 100; // camera on white side
		} else {
			camera.position.x = 0;
			camera.position.z = -100; // camera on black side
		}
		redrawBoard();
	}

	function undo() {
		hideCheckmate();
		if (g_allMoves.length === 0) {
			return;
		}

		if (g_backgroundEngine !== null) {
			g_backgroundEngine.terminate();
			g_backgroundEngine = null;
		}

		UnmakeMove(g_allMoves[g_allMoves.length - 1]);
		g_allMoves.pop();
		pgnUtils.g_pgn.pop();
		pgnUtils.g_pgn.pop();
		updatePGN(pgnUtils.getPGN());

		if (g_playerWhite !== Boolean(g_toMove) && g_allMoves.length !== 0) {
			UnmakeMove(g_allMoves[g_allMoves.length - 1]);
			g_allMoves.pop();
		}

		redrawBoard();
	}

	/* "clica" no botão de carregar */
	function loadDialog() {
		$("#uploadFile").trigger("click");
	}

	function load(evt) {

		//Retrieve the first (and only!) File from the FileList object
		var file = evt.target.files[0];

		if (file) {
			var reader = new FileReader();
			reader.onload = function (e) {
				var contents = e.target.result;
				loadPGN(contents);
			};
			reader.readAsText(file);
			clearPGN();
			showGameButtons();			
		} else {
			alert("Failed to load file");
		}

	}

	function clearPGN() {
		$("pgn").val("");
		pgnUtils.g_pgn = [];
	}

	function updatePGN(pgn) {
		$moveList.val(pgn);
		$moveList.scrollTop($moveList[0].scrollHeight);
	}

	function save() {
		const today = new Date();
		const dateFormat = today.toISOString().split('T')[0]; // YYYY-MM-DD
		const timeFormat = today.toTimeString().split(' ')[0]; // HH:MM:SS
		var filename = `chess3dSave-${dateFormat}-${timeFormat}.pgn`;
		var a = document.createElement("a");

		if (typeof a.download === "undefined") {
			var str = 'data:text/html,' + encodeURIComponent("<p><a download='" + filename + "' href=\"data:application/json," +
				encodeURIComponent(pgnUtils.getPGN()) +
				"\">Download link</a></p>");
			window.open(str);
		} else {
			// auto download
			var body = document.body;
			a.textContent = filename;
			a.href = "data:application/json," + encodeURIComponent(pgnUtils.getPGN());
			a.download = filename;
			body.appendChild(a);
			a.click();
			body.removeChild(a);
		}

	}

	function changePromo(event) {
		var choice = $(event.currentTarget).val();
		switch (choice) {
			case "queen":
				promotion = moveflagPromoteQueen;
				break;
			case "rook":
				promotion = moveflagPromoteRook;
				break;
			case "bishop":
				promotion = moveflagPromoteBishop;
				break;
			case "knight":
				promotion = moveflagPromoteKnight;
				break;
		}
	}

	function hideCheckmate() {
		$("#game-over-overlay").addClass("hidden");
		$("canvas").css("filter", "none");
		$("#new-game").off("click");
		$("#gameOverMessage").removeClass("checkmate stalemate");
	}
	// Aplica um filtro sepia
	// exibe a mensagem "Checkmate" ou "Stalemate"
	// no centro da tela, e exibe os botões de
	// reiniciar ou voltar a jogada (undo)
	// Verifica quem está em cheeck (jogador ou IA)
	function displayCheckmate(message) {
		// verificar se o jogador venceu ou perdeu
		if (whoIsInCheck()) {
			//Player lost
			$("canvas").css("filter", "sepia(100%)");
			$("#game-over-overlay").removeClass("hidden");
			$("#game-over-overlay").addClass("lose");
			$("#game-over-overlay").removeClass("win");
		} else {
			// Player won
			$("canvas").css("filter", "sepia(0%)");
			$("#game-over-overlay").removeClass("hidden");
			$("#game-over-overlay").addClass("win");
			$("#game-over-overlay").removeClass("lose");
		}

		$("#newGame").on("click", newGameDialog);
		$("#undoMove").on("click", undo);
		$("#gameOverMessage").text(message)

		if (message === "Checkmate") {
			$("#gameOverMessage").addClass("checkmate");
		} else {
			$("#gameOverMessage").addClass("stalemate");
		}
	}
	
	function whoIsInCheck() {
		const playerColor = g_playerWhite ? WHITE : BLACK;
		const turn = g_toMove === 8 ? WHITE : BLACK;
		if (g_inCheck) {
			if (turn === playerColor) {				
				return true; // player is in check
			} else {				
				return false; // AI is in check
			}
		} else {
			throw new Error("No check detected");
		}
	}

	function displayCheck() {
		if (validMoves.length === 0) {
			// no valid moves means checkmate or stalemate
			if (g_inCheck) {
				displayCheckmate("Checkmate");
			} else {
				displayCheckmate("Stalemate");
			}
			return;
		} else if (g_inCheck) {
			$info.text(whoIsInCheck()? "You are in check!" : "Opponent is in check!");
			$info.removeClass('hidden');
		} else {
			$info.addClass('hidden');
		}
	}

	function displayPlayerTurn() {
		console.log('color to play: ', Boolean(g_toMove) ? 'white' : 'black');
		if (Boolean(g_toMove)) {
			$("#turn").text("White");
		} else {
			$("#turn").text("Black");
		}
	}

	window.initGUI = initGUI;
	window.initInfo = initInfo;
	window.clearPGN = clearPGN;
	window.addToPGN = pgnUtils.addToPGN;
	window.displayCheck = displayCheck;
	window.newGame = newGame;
	window.showNewGameOptions = function showNewGameOptions() {
		$("#btn-newGame").trigger("click");
	}
	window.displayPlayerTurn = displayPlayerTurn;

})();

function handleNewGameClick($dialog, newGame) {
	// const color = $("white").is(":checked") ? WHITE : BLACK;
	$("#startGameButton").on("click", function (event) {
		const level = $("#difficultySelect").val();
		// close the dialog
		$dialog.addClass("hidden");
		$("#gui").addClass("hidden");
		$("#pause").remove();
		$("#openMenu").removeClass("hidden");
		$("#closeMenu").addClass("hidden");
		$("#difficultyLevel").text(level);
		newGame(level);
	});
}

function updateBar(p) {
	let $bar = $('#progressbar');
	let $label = $('#progressbar-label');
	$bar.val(p * 100);
	$label.text(Math.round(p * 100) + '%');
}

window.removeLoader = () => {
	$('#loading').remove();
}