
// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE,BOARD_SIZE, COLS,ROWS*/
"use strict";
(function () {
	var a = "a".charCodeAt(0);
	// Cell não está definido da melhor forma
	// Mas os construtores não estão padronizados no código original	
	// Então manter assim por enquanto para não quebrar o código existente
	// Evitar mais bugs do que ja tem
	class Cell {
		constructor() {
			this.position = null;
			this.index = null;
			this.x = null;
			this.y = null;
			var coordinates = null;
			console.log("Cell constructor", arguments, arguments.length);
			if (arguments.length === 1) {

				if (typeof (arguments[0]) === "string" && arguments[0].match(/[a-h][1-8]/)) {
					// position like "a1", "b4", "e7"
					this.position = arguments[0];
					coordinates = getCoordinatesFromPosition(
						this.position
					);
					this.x = coordinates.x;
					this.y = coordinates.y;
					this.index = this.x + this.y * COLS;
				} else if (arguments[0] >= 0 && arguments[0] < ROWS * COLS) {
					// array index
					this.index = arguments[0];
					coordinates = getCoordinatesFromIndex(
						this.index
					);
					this.x = coordinates.x;
					this.y = coordinates.y;
					this.position = getPositionFromCoordinates(
						this.x, this.y
					);
				}
			} else if (arguments.length === 2 &&
				isValid(arguments[0], arguments[1])) {
				// x and y position (0-based
				this.x = arguments[0];
				this.y = arguments[1];
				this.index = this.x + this.y * COLS;
				this.position = getPositionFromCoordinates(
					this.x, this.y
				);
			} // Novo construtor para receber posição, x e y
			// que será o padrão após a refatoração da classe Cell 
			else if (arguments.length === 3 &&
				isValid(arguments[1], arguments[2])) {
				// position, x and y
				this.position = arguments[0];
				this.x = arguments[1];
				this.y = arguments[2];
				this.index = this.x + this.y * COLS;
				coordinates = getCoordinatesFromPosition(
					this.position
				);
				if (this.x !== coordinates.x || this.y !== coordinates.y) {
					throw new Error("Invalid coordinates for position");
				}
			}
			
			else {
				throw arguments[0];
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
				const coordinates = getCoordinatesFromPosition(position);
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
				const coordinates = getCoordinatesFromIndex(index);
				const position = getPositionFromCoordinates(coordinates.x, coordinates.y);
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
	}




	// private
	function getPositionFromCoordinates(x, y) {
		return String.fromCharCode(x + a) + (7 - y + 1);
	}

	function getCoordinatesFromPosition(position) {
		return {
			x: position.charCodeAt(0) - a,
			y: 7 - (parseInt(position.charAt(1), 10) - 1)
		};
	}

	function getCoordinatesFromIndex(index) {
		return {
			x: index % COLS,
			y: Math.floor(index / COLS)  // have to flip y since 3D starts from bottom left
		};
	}

	function isValid() {
		if (arguments.length == 2) {
			var x = arguments[0];
			var y = arguments[1];

			return x >= 0 && x < COLS &&
				y >= 0 && y < ROWS;
		}
		return false;
	}

	window.Cell = Cell;

})();