function openNewGameDialog(event) {
    g_playerWhite = true; // default to white
    window.hideCheckmate();
    $("#newGameDialog").removeClass("hidden");
}

function onStartNewGameClick(event) {
    event.preventDefault();
    const level = $("#difficultySelect").val();
    console.log("Starting new game with level:", level);
    // close the dialog
    $("#newGameDialog").addClass("hidden");
    $("#gui").addClass("hidden");
    $("#pause").remove();
    $("#openMenu").removeClass("hidden");
    $("#closeMenu").addClass("hidden");
    $("#difficultyLevel").text(level);
    window.newGame(level);
}

function onCancelClick() {
    $("#newGameDialog").addClass("hidden");
}

function onLoadGameClick() {
    /* "clica" no botão de carregar */
    $("#uploadFile").trigger("click");
    onCancelClick();
}