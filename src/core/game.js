import ChessGui from "../gui/gui";

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



export {
    load,
    saveGame,
};