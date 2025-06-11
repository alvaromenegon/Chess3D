class PgnUtils {
    pgn = '';
    fen = null;
    moves = [];
    // list of moves in pgn format
	g_pgn = [];

    constructor(onUpdatePGN){
        this.pgn = '';
        this.fen = null;
        this.moves = [];
        this.g_pgn = [];
        this.onUpdatePGN = onUpdatePGN || function() {};
    }

    setOnUpdatePGN(callback) {
        this.onUpdatePGN = callback;
    }

    loadPGN(pgn) {
        this.pgn = pgn;
        var parsedPGN = parsePGN(pgn);
        this.fen = parsedPGN.fen;
        this.moves = parsedPGN.sequence;

        g_allMoves = [];
        if (this.fen !== null) {
            this.loadFEN(this.fen);
            if (parsedPGN.startColor === BLACK) {
                this.g_pgn.push("..");
            }
        } else {
            ResetGame();
        }       


        this.moves.forEach(function (move) {
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
            var piece = pieces[move.piece].getPieceFlag(); // [P,N,B,R,Q,K]
            // var piece = pieces[move.piece].flag; // [P,N,B,R,Q,K]
            // ge the color flag
            var color = (move.color === WHITE) ? 0x8 : 0x0;

            // get the from value
            var startList = [];

            // get all square that has this kind of piece
            var pieceIdx = (color | piece) << 4;

            while (g_pieceList[pieceIdx] !== 0) {
                startList.push(Cell.fromPosition(FormatSquare(g_pieceList[pieceIdx])));
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
            console.log('move to:',move.to);
            var end = Cell.fromPosition(move.to);
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
        
    }

    addToPGN(move) {
        this.g_pgn.push(GetMoveSAN(move));
        this.pgn = this.getPGN();
        this.onUpdatePGN(this.pgn);
    }

    getPGN() {
        var str = "";
        this.g_pgn.forEach(function (move, i) {
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
}

export const pgnUtils = new PgnUtils();