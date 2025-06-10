class Piece {
    constructor(flag, promo) {
        this.flag = flag;
        this.promo = promo;
    }

    getPieceFlag(){
        return this.flag;
    }
}

export default Piece;