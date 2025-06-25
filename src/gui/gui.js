import $ from 'jquery';


class ChessGui{
    constructor() {}

    static showGameButtons() {
		ChessGui.displayPlayerTurn(g_playerWhite);
		$("#game-info").removeClass("hidden");
		$("#openMenu").removeClass("hidden");
	}

    static loadPGN = (pgn) => {
		ChessGui.clearPGN();
		window.pgnUtils.loadPGN(pgn);
		// fechar o menu
		$("#gui").addClass("hidden");
		$("#openMenu").removeClass("hidden");
		$("#pause").remove();
	}

    /**
	 * Escurece um pouco a tela por trás do menu
	 * e remove o hidden
	 */
	static openMenu() {
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

    static clearPGN() {
		$("#moveList").val("");
		window.pgnUtils.g_pgn = [];
	}

	static updatePGN(pgn) {
        const $moveList = $("#moveList");
		$moveList.val(pgn);
		$moveList.scrollTop($moveList[0].scrollHeight);
	}
    
    static updateProgressBar(p) {
        $('#progressbar').val(p * 100);
        $('#progressbar-label').text(Math.round(p * 100) + '%');
    }

    static displayPlayerTurn() {
		if (Boolean(g_toMove)) {
			$("#turn").text("White");
		} else {
			$("#turn").text("Black");
		}
	}

    static hideCheckmate() {
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
	static displayCheckmate(message) {
		// verificar se o jogador venceu ou perdeu
		if (ChessGui.whoIsInCheck()) {
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

		$("#gameOverMessage").text(message)

		if (message === "Checkmate") {
			$("#gameOverMessage").addClass("checkmate");
		} else {
			$("#gameOverMessage").addClass("stalemate");
		}
	}
	
	static whoIsInCheck() {
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

    static displayCheck(validMoves) {
		const $info = $("#info");
		if (validMoves.length === 0) {
			// no valid moves means checkmate or stalemate
			if (g_inCheck) {
				ChessGui.displayCheckmate("Checkmate");
			} else {
				ChessGui.displayCheckmate("Stalemate");
			}
			return;
		} else if (g_inCheck) {
			$info.text(ChessGui.whoIsInCheck()? "You are in check!" : "Opponent is in check!");
			$info.removeClass('hidden');
		} else {
			$info.addClass('hidden');
		}
	}
}

export default ChessGui;