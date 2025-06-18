
import * as THREE from 'three';
import Cell from '../core/Cell.js';
import { cloneAndTileTexture } from '../utils/three-extend.js';
import { COLS, ROWS, SHADOW, WIREFRAME } from '../core/constants.js';

/**
 *  Factory class for creating chess-related objects such as chess boards, floors, and materials.
 *  This class uses a ResourceManager to manage textures and meshes.
 *  @class ChessFactory
 *  @param {ResourceManager} resourceManager - The ResourceManager instance to manage resources.
 *  @description This class provides methods to create a chess board, floor, and materials for cells and pieces.
 */
class ChessFactory {
    /* List<THREE.MeshPhongMaterial> */#materials
    constructor(resourceManager) {
        this.resourceManager = resourceManager;
    }
    createChessBoard = (size) => {
        const normTexture = this.resourceManager.getTexture('wood_N.jpg');
        const specTexture = this.resourceManager.getTexture('wood_S.jpg');
        // contains everything that makes the board
        var lChessBoard = new THREE.Object3D();

        var cellSize = size / COLS;
        var square, cell;

        for (var i = 0; i < ROWS * COLS; i++) {
            var row = Math.floor(i / COLS);
            var cell = Cell.fromIndex(i);
            square = this.#createCell(cellSize, 1 - (i + row) % 2);
            square.position.copy(cell.getWorldPosition());
            square.name = cell.position;
            lChessBoard.add(square);
        }

        // some fake inner environment color for reflexion
        var innerBoard = this.resourceManager.getMesh('innerBoard').clone();
        innerBoard.material = new THREE.MeshBasicMaterial({
            color: 0x783e12
        });
        innerBoard.scale.set(size, size, size);

        /// board borders
        const tiling = 6;

        const wood = cloneAndTileTexture(this.resourceManager.getTexture('wood-0.jpg'), tiling);
        const spec = cloneAndTileTexture(specTexture, tiling);
        const norm = cloneAndTileTexture(normTexture, tiling);

        var board = this.resourceManager.getMesh('board').clone();
        board.material =
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: wood,
                specular: 0xffffff,
                specularMap: spec,
                normalMap: norm,
                shininess: 60,
                normalScale: new THREE.Vector2(0.2, 0.2)
            });
        var hCorrection = 0.62; // yeah I should just create a better geometry
        board.scale.set(size, size * hCorrection, size);
        lChessBoard.height = board.geometry.boundingBox.min.y * board.scale.y;

        if (SHADOW) {
            board.receiveShadow = true;
            board.castShadow = true;
        }

        lChessBoard.add(innerBoard).add(board)
        lChessBoard.name = "chessboard";

        return lChessBoard;
    }

    createFloor = (chessboardSize) => {
        const geometry = new THREE.PlaneGeometry(chessboardSize * 3, chessboardSize * 3);
        const texture = cloneAndTileTexture(this.resourceManager.getTexture('floor.jpg'), 4);
        const material = new THREE.MeshBasicMaterial({ map: texture, color: 0x004400, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x += Math.PI / 2;

        if (SHADOW) {
            floor.receiveShadow = true;
        }

        floor.name = "floor";
        return floor;
    }
    /**  Em vez de criar e armazenar globalmente 
    * apenas retornar o material em cada chamada
    * para evitar poluir o escopo global
    * e melhorar a modularidade e performance
    *  @param {string | number} color - the color of the cell, '0' - BLACK or '1' - WHITE
    *  @returns {THREE.MeshPhongMaterial} - the material for the cell
    *  @description Creates a material for the cell with the specified color.
    */
    getValidCellMaterial = (color) => {
        // createValidCellMaterial() {
        const normTexture = this.resourceManager.getTexture('wood_N.jpg');
        const specTexture = this.resourceManager.getTexture('wood_S.jpg');
        const tiling = 2;
        // common textures
        const diff = cloneAndTileTexture(this.resourceManager.getTexture(`wood-${color}.jpg`), tiling);
        const norm = cloneAndTileTexture(normTexture, tiling);
        const spec = cloneAndTileTexture(specTexture, tiling);

        return new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            specular: 0x999999,
            shininess: 60.0,
            wireframe: WIREFRAME,
            map: diff,
            specularMap: spec,
            normalMap: norm
        });
    }

    /**
     * 
     * @param {string | number} color - the color of the cell, '0' - BLACK or '1' - WHITE
     * @returns {THREE.MeshPhongMaterial} - the material for the selected piece
     * @description Creates a material for the selected piece with a green highlight.
     */
    getSelectedMaterial = (color) => {
        const normTexture = this.resourceManager.getTexture('wood_N.jpg');
        const specTexture = this.resourceManager.getTexture('wood_S.jpg');
        const tiling = 4;
        // common textures
        const norm = cloneAndTileTexture(normTexture, tiling);
        const spec = cloneAndTileTexture(specTexture, tiling);
        const diff = cloneAndTileTexture(this.resourceManager.getTexture(`wood-${color}.jpg`), tiling);

        const selectedMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x009900,
            specular: 0x999999,
            shininess: 60.0,
            wireframe: WIREFRAME,
            transparent: false,
            map: diff,
            specularMap: spec,
            normalMap: norm
            //opacity:0.4
        });
        selectedMaterial.normalScale.set(0.3, 0.3);
        return selectedMaterial;
    }

    #createCell = (size, color) => {
        const normTexture = this.resourceManager.getTexture('wood_N.jpg');
        const specTexture = this.resourceManager.getTexture('wood_S.jpg');
        const tiling = 2;
        // common textures
        const norm = cloneAndTileTexture(normTexture, tiling);
        const spec = cloneAndTileTexture(specTexture, tiling);
        const diff = cloneAndTileTexture(this.resourceManager.getTexture(`wood-${color}.jpg`), tiling);

        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: [0xAAAAAA, 0x444444][color],
            shininess: 20.0,
            wireframe: WIREFRAME,
            map: diff,
            specularMap: spec,
            normalMap: norm,
        });

        // container for the cell and its reflexion
        var geo = new THREE.PlaneGeometry(size, size);

        // randomize uv offset to ad a bit of variety
        var randU = Math.random();
        var randV = Math.random();

        const uvAttribute = geo.getAttribute('uv');
        var uv = new THREE.Vector2();
        for (let i = 0; i < uvAttribute.count; i++) {
            uv.fromBufferAttribute(uvAttribute, i);
            uvAttribute.setXY(i, uv.x += randU, uv.y += randV);
        }

        var cell = new THREE.Mesh(geo, material);

        if (SHADOW) {
            cell.receiveShadow = true;
        }

        // by default PlaneGeometry is vertical
        cell.rotation.x = -Math.PI / 2;
        cell.color = color;
        return cell;
    }

    createPiece(name, color) {
        const size = BOARD_SIZE / COLS * PIECE_SIZE;
        // container for the piece and its reflexion
        var piece = new THREE.Object3D();
        const normTexture = resourceManager.getTexture('wood_N.jpg');
        const specTexture = resourceManager.getTexture('wood_S.jpg');

        // common textures
        const tiling = 4;
        const map = this.resourceManager.getTexture(`wood-${color}.jpg`);
        const norm = cloneAndTileTexture(normTexture, tiling);
        const spec = cloneAndTileTexture(specTexture, tiling);
        // base material for all the piece (only lightmap changes)
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0xaaaaaa,
            shininess: 60.0,
            map: map,
            normalMap: norm,
            specularMap: spec,
            wireframe: WIREFRAME
        });
        material.normalScale.set(0.3, 0.3);

        var mesh = resourceManager.getMesh(name).clone();

        mesh.material = material;

        if (SHADOW) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        mesh.scale.set(size, size, size);
        // rotacionar apenas o cavalo porque é o único que precisa
        // e a rotação original não estava funcionando
        if (name === 'knight') {
            mesh.rotation.z += (color == WHITE) ? Math.PI / 2 : -Math.PI / 2;
        }

        piece.add(mesh);

        piece.name = name;
        piece.color = color;

        return piece;
    }
}

export default ChessFactory;