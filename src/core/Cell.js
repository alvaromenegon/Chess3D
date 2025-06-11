/**
 * Classe Cell representa uma posição no tabuleiro de xadrez.
 * Ex: a1, b4, h8, etc.
 * As coordenadas são baseadas em um sistema de 0 a 7 para x e y.
 * As coordenadas x e y são invertidas em relação à notação de xadrez,
 * onde x representa a coluna (a-h) e y representa a linha (1-8).
 * 
 * @class Cell
 * @param {string} position - A posição da célula em notação de xadrez (e.g., "a1", "h8").
 * @param {number} x - A coordenada x (0-7).
 * @param {number} y - A coordenada y (0-7).
 * @throws {Error} Se a posição ou as coordenadas forem inválidas.
 * @example 
 * // Cria uma célula a partir de uma posição
 * const cell = Cell.fromPosition("a1");
 * 
 * // Cria uma célula a partir de coordenadas
 * const cellFromIndex = Cell.fromIndex(0); // Representa a posição "a1"
 * 
 * // Verifica se duas células são iguais
 * cell.equals("a1"); // true
 * cell.equals(0, 0); // true
 */
const a = "a".charCodeAt(0);
class Cell {
	constructor(position, x, y) {
		// position, x and y
		this.position = position;
		this.x = x;
		this.y = y;
		if (!this.#isValid(this.x, this.y)) {
			throw new Error("Invalid coordinates for position");
		}
		this.index = this.x + this.y * COLS;
		this.coordinates = Cell.#getCoordinatesFromPosition(
			this.position
		);
		if (this.x !== this.coordinates.x || this.y !== this.coordinates.y) {
			throw new Error("Invalid coordinates for position");
		}
	}


	// Substituir o construtor por funções factory para cada situação
	// O construtor não está padronizado no código original
	// O novo construtor será padronizado para receber uma posição e as coordenadas x e y

	/**
	 * Cria uma instância de Cell a partir de uma posição em notação de xadrez.
	 * Aceita uma string como "a1", "b4", etc.
	 * @param {*} position - A posição da célula em notação de xadrez (e.g., "a1", "h8").
	 * @returns {} Uma nova instância de Cell.
	 */
	static fromPosition(position) {
		if (typeof position === "string" && position.match(/[a-h][1-8]/)) {
			const coordinates = Cell.#getCoordinatesFromPosition(position);
			return new Cell(position, coordinates.x, coordinates.y);

		} else {
			throw new Error("Invalid position format");
		}
	}

	/**
	 * Cria uma instância de Cell a partir de coordenadas x e y.
	 * @param {number} x - A coordenada x (0-7).
	 * @param {number} y - A coordenada y (0-7).
	 * @returns {} Uma nova instância de Cell.
	 */
	static fromIndex(index) {
		if (index >= 0 && index < ROWS * COLS) {
			const coordinates = Cell.#getCoordinatesFromIndex(index);
			const position = Cell.#getPositionFromCoordinates(coordinates.x, coordinates.y);
			return new Cell(position, coordinates.x, coordinates.y);
		} else {
			throw new Error("Index out of bounds");
		}
	}


	toString() {
		return this.position;
	}
	equals() {
		if (arguments.length === 1) {
			var cell = arguments[0];
			if (cell instanceof Cell) {
				// it's a Cell object
				return cell.position === this.position;
			} else {
				// it's a string position
				return cell === this.position;
			}
		} else if (arguments.length === 2) {
			// it's x,y coordinates
			return this.x === arguments[0] &&
				this.y === arguments[1];
		}

	}
	getWorldPosition() {
		var cs = BOARD_SIZE / ROWS;
		var middle = (BOARD_SIZE - cs) / 2;


		return new THREE.Vector3(
			this.x * cs - middle,
			0,
			(this.y * cs - middle)
		);
	}





	// private
	static #getPositionFromCoordinates(x, y) {
		return String.fromCharCode(x + a) + (7 - y + 1);
	}

	static #getCoordinatesFromPosition(position) {
		return {
			x: position.charCodeAt(0) - a,
			y: 7 - (parseInt(position.charAt(1), 10) - 1)
		};
	}

	static #getCoordinatesFromIndex(index) {
		return {
			x: index % COLS,
			y: Math.floor(index / COLS)  // have to flip y since 3D starts from bottom left
		};
	}

	#isValid(x, y) {
		const isXValidCol = x >= 0 && x < COLS;
		const isYValidRow = y >= 0 && y < ROWS;
		return isXValidCol && isYValidRow;
	}
}

export default Cell;