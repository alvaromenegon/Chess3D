function onChangeDifficulty(event) {
    const level = parseInt(event.target.value || 0, 10);
    if (levels[level - 1] !== undefined) {
        g_timeout = levels[level - 1].timeout;
        g_maxply = levels[level - 1].maxply;
    }
    // update the info text
    $("#difficulty").text(level);
}

function onChangePromo(element) {
    const choice = element.value;
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

function onChangeStartPlayer(color) {
    /* color 0 = black, color 1 = white */
    g_playerWhite = Boolean(color);
    if (g_playerWhite) {
        camera.position.x = 0;
        camera.position.z = 100; // camera on white side
    } else {
        camera.position.x = 0;
        camera.position.z = -100; // camera on black side
    }
    redrawBoard();
}