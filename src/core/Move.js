class Move {
    constructor(piece, color, from, to, promotion, result, str) {
        this.piece = piece ? piece : "P";
        this.color = color;
        this.from = from;
        this.to = to;
        this.promotion = promotion;
        this.result = result;
        this.str = str;
    }
}

export default Move;