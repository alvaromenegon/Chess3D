import ChessGui from "../gui/gui.module";

/*
* GAME CONTROL
*/
function newGame(level) {
    ChessGui.clearPGN();
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
    
    window.redrawBoard();
    // removeStandbyAnimation();

    if (g_playerWhite) {
        camera.position.x = 0;
        camera.position.z = 100; // camera on white side
    } else {
        SearchAndRedraw();
        camera.position.x = 0;
        camera.position.z = -100; // camera on black side
    }
    ChessGui.showGameButtons();
}

function load(evt) {    
    //Retrieve the first (and only!) File from the FileList object
    var file = evt.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            ChessGui.loadPGN(contents);
        };
        reader.readAsText(file);
        ChessGui.clearPGN();
        ChessGui.showGameButtons();
    } else {
        alert("Failed to load file");
    }
}

function saveGame() {
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

function undo() {
    ChessGui.hideCheckmate();
    if (g_allMoves.length === 0) {
        return;
    }

    if (g_backgroundEngine !== null) {
        g_backgroundEngine.terminate();
        g_backgroundEngine = null;
    }

    UnmakeMove(g_allMoves[g_allMoves.length - 1]);
    g_allMoves.pop();
    window.pgnUtils.g_pgn.pop();
    window.pgnUtils.g_pgn.pop();
    ChessGui.updatePGN(window.pgnUtils.getPGN());

    if (g_playerWhite !== Boolean(g_toMove) && g_allMoves.length !== 0) {
        UnmakeMove(g_allMoves[g_allMoves.length - 1]);
        g_allMoves.pop();
    }

    window.redrawBoard();
}

export {
    newGame,
    undo,
    load,
    saveGame,
};