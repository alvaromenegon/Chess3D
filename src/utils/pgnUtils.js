import ChessGui from "../gui/gui.module";
import Piece from "../core/Piece.js";

class PgnUtils {
    pgn = '';
    fen = null;
    moves = [];
    // list of moves in pgn format
    g_pgn = [];

    constructor() {
        this.pgn = '';
        this.fen = null;
        this.moves = [];
        this.g_pgn = [];
        this.onUpdatePGN = ChessGui.updatePGN;
    }

    //TODO: add the game difficulty and player color to the PGN

    loadPGN(pgn) {
        this.pgn = pgn;
        var parsedPGN = PgnUtils.parsePGN(pgn);
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

    static parsePGN(pgn) {
        String.prototype.removeBrackets = function (open, close) {
            var count = 0;
            var newString = "";
            for (var i = 0; i < this.length; i++) {
                var c = this.charAt(i);
                if (c === open) {
                    count++;
                    continue;
                }
                if (c === close) {
                    count--;
                    continue;
                }
                if (count === 0) {
                    newString += c;
                }
            }
            return newString;
        };

        var moves = {};
        moves.fen = null;
        moves.sequence = [];
        moves.startColor = WHITE;

        var color = WHITE;

        //var re_fen = /[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7} +[wb] +([KQ]{1,2}|-) *([kq]{1,2}|-)( +(([a-h][1-8])|-))? +\d+ +\d+/
        var re_fen = /\[FEN *" *([pnbrqkPNBRQK1-8]+(?:\/[pnbrqkPNBRQK1-8]+){7} +([wb]) +(?:[KQ]{1,2}|-) *(?:[kq]{1,2}|-)(?: +(?:(?:[a-h][1-8])|-))? +\d+ +\d+) *" *\]/;
        var match = pgn.match(re_fen);
        if (match) {
            moves.fen = match[1];
            color = match[2] === "w" ? WHITE : BLACK;
            moves.startColor = color;
        }
        var cleanPGN = pgn
            .removeBrackets("[", "]")		// removes metadata
            .removeBrackets("{", "}")		// removes comments
            .removeBrackets("(", ")")		// removes comments
            .replace(/\$\d+/g, '')			// removes this thing
            .replace(/\d+\.{1,3}/g, '')		// removes move numbers
            .replace(/\s+/g, ' ')			// replaces multiple whitespaces by simple spaces
            .trim()							// removes front and back whitespaces
            .replace(/(0-1)$/g, '')			// result black won
            .replace(/(1-0)$/g, '')			// result white won
            .replace(/(1\/2-1\/2)$/g, '')	// result draw
            .replace(/(\*)$/g, '')			// result ongoing
            .trim()
            .split(' ');                    // split moves 

        // regex for basic moves
        //                     |pieces | |src col/row|  |dest col/row|  promo   |check|
        var re_pieceMove = /^([NBRQK])?([a-h]?[1-8]?)?x?([a-h][1-8])(=[NBRQK])?([+#])?/;
        // regex for castling
        var re_castling = "(O-O(?:-O)?)([+#])?";
        var castling = {
            "O-O": {
                from: ['e8', 'e1'],
                to: ['g8', 'g1']
            },
            "O-O-O": {
                from: ['e8', 'e1'],
                to: ['c8', 'c1']
            }
        };

        cleanPGN.forEach(function (move) {
            var info = [];

            info = move.match(re_pieceMove);
            if (info) {
                moves.sequence.push(new Move(
                    info[1],
                    color,
                    info[2],
                    info[3],
                    info[4],
                    info[5],
                    move
                ));
            }

            info = move.match(re_castling);
            if (info) {
                moves.sequence.push(new Move(
                    "K",
                    color,
                    castling[info[1]].from[color],
                    castling[info[1]].to[color],
                    undefined,
                    info[2],
                    move
                ));
            }
            color = 1 - color;
        });

        return moves;
    }

}

export const pgnUtils = new PgnUtils();
export const parsePGN = (pgn) => {
    return PgnUtils.parsePGN(pgn);
}