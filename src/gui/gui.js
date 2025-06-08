
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
	// list of moves in pgn format
	var g_pgn = [];
	// jQuery check feedback
	var $info;

	function initInfo() {
		// create the DOM element
		// to display Chc
		$info = $("<div>")
			.attr("id", "info")
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
		$("#openMenu").removeClass("hidden").on("click", openMenu);
		$("#game-info").removeClass("hidden");
		$("#promotionSelect").on("change", changePromo);
		$("#btn-newGame").on("click", newGameDialog);
		$("#btn-loadGame").on("click", loadDialog);
		$("#uploadFile").on("change", load);
		$("#btn-saveGame").on("click", save);
		$("#btn-undo").on("click", undo);
	}

	function moveCamera(newPosition) {
		// mover a camera para a nova posição
		// de forma suave
		let startPosition = camera.position.clone();
		let startTime = Date.now();
		let duration = 500; // duração da transição em milissegundos
		function animate() {
			let elapsed = Date.now() - startTime;
			let t = Math.min(elapsed / duration, 1); // normaliza o tempo entre 0 e 1
			camera.position.lerpVectors(startPosition, newPosition, t);
			camera.lookAt(0, 0, 0); // sempre olhar para o centro do tabuleiro
			if (t < 1) {
				requestAnimationFrame(animate);
			}
		}
		requestAnimationFrame(animate);

	}

	function newGameDialog() {
		hideCheckmate();
		var $dialog = $("#newGameDialog");
		// show the dialog
		$dialog.removeClass("hidden");
		var $levelSelect = $("#difficultySelect");
		// set the default level to 0
		$levelSelect.val(0);

		// set the default color to white
		$("#startColorSelect").val(WHITE);
		$levelSelect.on("change", function (event) {
			var level = $(event.currentTarget).val();
			if (levels[level-1] !== undefined) {
				g_timeout = levels[level-1].timeout;
				g_maxply = levels[level-1	].maxply;
			}
			// update the info text
			$("#difficulty").text(level);
		});
		$("#startGameButton").on("click", function (event) {
			var color = $("#white").val();
			if (typeof color === "string"){
				color = (color === "1") ? WHITE : BLACK;
			}
			var level = $("#difficultySelect").val();
			// close the dialog
			$dialog.addClass("hidden");
			$("#gui").addClass("hidden");
			$("#pause").remove();
			$("#openMenu").removeClass("hidden");
			$("#closeMenu").addClass("hidden");
			// start a new game
			newGame(color, level);
		});
		$("#cancelNewGameButton").on("click", function (event) {
			// close the dialog
			$dialog.addClass("hidden");
			// remove the event listeners
			$("#startGameButton").off("click");
			$("#cancelNewGameButton").off("click");
			$("#startColorSelect").off("change");
			$("#difficultySelect").off("change");
		});
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
	/*
	 * GAME CONTROL
	 */
	function newGame(color, level) {
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

		if (color === WHITE) {
			g_playerWhite = true;
			camera.position.x = 0;
			camera.position.z = 100; // camera on white side
		} else {
			g_playerWhite = false;
			SearchAndRedraw();
			camera.position.x = 0;
			camera.position.z = -100; // camera on black side
		}
	}


	function changeStartPlayer(event) {
		g_playerWhite = $(event.currentTarget).val() === "white";
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
		g_pgn.pop();
		g_pgn.pop();
		updatePGN();

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

		} else {
			alert("Failed to load file");
		}

	}

	function loadFEN(fen) {
		g_allMoves = [];
		InitializeFromFen(fen);

		EnsureAnalysisStopped();
		InitializeBackgroundEngine();

		g_playerWhite = !!g_toMove;
		g_backgroundEngine.postMessage("position " + GetFen());

		redrawBoard();
	}

	function loadPGN(pgn) {
		var parsedPGN = parsePGN(pgn);
		var fen = parsedPGN.fen;
		var moves = parsedPGN.sequence;

		g_allMoves = [];
		clearPGN();
		if (fen !== null) {
			loadFEN(fen);
			if (parsedPGN.startColor === BLACK) {
				g_pgn.push("..");
			}
		} else {
			ResetGame();
		}

		function Piece(flag, promo) {
			this.flag = flag;
			this.promo = promo;
		}


		moves.forEach(function (move) {
			var i;
			var formatedMove;
			var vMoves = GenerateValidMoves();
			var pieces = {
				"P": new Piece(piecePawn, null),
				"N": new Piece(pieceKnight, moveflagPromoteKnight),
				"B": new Piece(pieceBishop, moveflagPromoteBishop),
				"R": new Piece(pieceRook, moveflagPromoteRook),
				"Q": new Piece(pieceQueen, moveflagPromoteQueen),
				"K": new Piece(pieceKing, null)
			};

			// get the piece flag
			var piece = pieces[move.piece].flag; // [P,N,B,R,Q,K]
			// ge the color flag
			var color = (move.color === WHITE) ? 0x8 : 0x0;

			// get the from value
			var startList = [];

			// get all square that has this kind of piece
			var pieceIdx = (color | piece) << 4;

			while (g_pieceList[pieceIdx] !== 0) {
				startList.push(new Cell(FormatSquare(g_pieceList[pieceIdx])));
				pieceIdx++;
			}

			var from = move.from;
			if (from !== undefined) {
				// if we have a precision on the starting square like the columns 
				// or even the position directly
				// We will filter the startList using it
				for (i = startList.length - 1; i >= 0; i--) {
					if (from.length === 1) {
						// only the row is given

						if (from.match(/[a-h]/) && startList[i].position.charAt(0) !== from) {
							// different starting row
							startList.splice(i, 1);
						} else if (from.match(/[1-8]/) && startList[i].position.charAt(1) !== from) {
							// different starting line
							startList.splice(i, 1);
						}
					} else if (from.length === 2) {
						// the starting coordinate is given
						// this is then just an extra check
						if (startList[i].position !== from) {
							// different starting coordinate
							startList.splice(i, 1);
						}
					}
				}
			}

			// here we should have a list of starting square
			// only one should make a valid move 
			// paired with the provided destination

			var end = new Cell(move.to);
			var endSquare = MakeSquare(end.y, end.x);

			var promotion = (move.promotion) ? pieces[move.promotion.substr(1)].promo : undefined; // remove the "="


			// take formatedMove and endSquare in a closure
			function checkMove(start) {
				var startSquare = MakeSquare(start.y, start.x);
				if (promotion !== undefined) {
					// we have a promotion so we need to generate a 
					// specific move and check against it
					if (vMoves[i] === GenerateMove(startSquare, endSquare, moveflagPromotion | promotion)) {
						formatedMove = vMoves[i];
					}
				} else {
					// just checking start and end square allows to cover 
					// all other special moves like "en passant" capture and
					// castling
					if ((vMoves[i] & 0xFF) == startSquare &&
						((vMoves[i] >> 8) & 0xFF) == endSquare) {
						formatedMove = vMoves[i];
					}
				}
			}

			// to get the move we will check withing all valide moves
			// which one match the hints given by the pgn

			for (i = 0; i < vMoves.length; i++) {
				startList.forEach(checkMove);
				if (formatedMove) break;
			}

			if (formatedMove) {
				UIPlayMove(formatedMove, false);
			} else {
				console.log(move);
				throw "Invalid PGN";
			}
		});

		if (g_toMove === colorWhite) {
			g_playerWhite = true;
			camera.position.x = 0;
			camera.position.z = 100;
		} else {
			g_playerWhite = false;
			camera.position.x = 0;
			camera.position.z = -100;
		}

		EnsureAnalysisStopped();
		if (InitializeBackgroundEngine()) {
			g_backgroundEngine.postMessage("position " + GetFen());
		}

		redrawBoard();
		// fechar o menu
		$("#gui").addClass("hidden");
		$("#openMenu").removeClass("hidden");
		$("#pause").remove();
	}

	function clearPGN() {
		$("pgn").val("");
		g_pgn = [];
	}

	function addToPGN(move) {
		g_pgn.push(GetMoveSAN(move));
		updatePGN();
	}

	function updatePGN() {

		$moveList.val(getPGN());
		$moveList.scrollTop($moveList[0].scrollHeight);
	}

	function getPGN() {
		var str = "";
		g_pgn.forEach(function (move, i) {
			if (i % 2 === 0) {
				if (move === "..") {
					str += ((i / 2) + 1) + "...";
				} else {
					str += ((i / 2) + 1) + ". " + move;
				}
			} else {
				str += " " + move + "\r\n";
			}
		});
		return str;
	}



	function save() {
		var filename = "chessSave.pgn";
		var a = document.createElement("a");

		if (typeof a.download === "undefined") {
			var str = 'data:text/html,' + encodeURIComponent("<p><a download='" + filename + "' href=\"data:application/json," +
				encodeURIComponent(getPGN()) +
				"\">Download link</a></p>");
			window.open(str);
		} else {
			// auto download
			var body = document.body;
			a.textContent = filename;
			a.href = "data:application/json," + encodeURIComponent(getPGN());
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
	function displayCheckmate(message) {
		$("canvas").css("filter", "sepia(100%)");

		// window.animateGameOver();
		$("#newGame").on("click", newGameDialog);
		$("#undoMove").on("click", undo);
		let $overlay = $("#game-over-overlay");
		$overlay.removeClass("hidden");
		$("#gameOverMessage").text(message);

		if (message === "Checkmate") {
			$("#gameOverMessage").addClass("checkmate");
		} else {
			$("#gameOverMessage").addClass("stalemate");
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
			$info.text('Check');
		} else {
			$info.text('');
		}
		if ($info.text() !== '') {
			$info.show("highlight", {}, 500);
		} else {
			$info.hide();
		}
	}

	/* Exibir uma Animação enquanto o jogo não foi iniciado */
	// function standbyAnimation(scene, renderer, camera) {
	// 	let animate = () => {
	// 		requestAnimationFrame(animate);
	// 		camera.position.x = 50 * Math.cos(Date.now() / 1000);
	// 		camera.position.z = 50 * Math.sin(Date.now() / 1000);
	// 		camera.lookAt(scene.position);
	// 		renderer.render(scene, camera);
	// 	};
	// 	animate();
	// }

	// function removeStandbyAnimation() {
	// 	// remove the animation
	// 	if (scene && renderer && camera) {
	// 		requestAnimationFrame(() => {
	// 			camera.position.set(0, 0, 100);
	// 			camera.lookAt(scene.position);
	// 			renderer.render(scene, camera);
	// 		});
	// 		// reset camera position
	// 	}

	// 	// remove the animation from the scene

	// }

	// window.removeStandbyAnimation = removeStandbyAnimation;

	window.initGUI = initGUI;
	window.initInfo = initInfo;
	window.clearPGN = clearPGN;
	window.addToPGN = addToPGN;
	window.displayCheck = displayCheck;
	window.newGame = newGame;
	// window.standbyAnimation = standbyAnimation;
	window.showNewGameOptions = function showNewGameOptions() {
		$("#btn-newGame").trigger("click");
	}

})();

