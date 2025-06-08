// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE, $, document, window, console */
/* global LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
/* global createCell */

/* 
 * initPieceFactory and initCellFactory need to be called after
 * all ressources are loaded (geometry and texture)
 *
 * they will create the createPiece and createCell function
 * and keep some texture/material objects in a closure to avoid
 * unnecessary cloning
 */

"use strict";
var geometries = {};
var textures = {};
function initPieceFactory() {

	// common textures
	var tiling = 4;
	var colors = [];
	for (var c = 0; c < 2; c++) {
		//Não funciona mais com a versão atualizada do THREE.js
		// Utilizar a função utilitaria que faz os 2
		// colors[c] = textures['texture/wood-'+c+'.jpg'].clone();
		// colors[c].tile(tiling);
		colors[c] = cloneAndTileTexture(textures['texture/wood-' + c + '.jpg'], tiling);
	}
	// var norm = textures['texture/wood_N.jpg'].clone();
	// norm.tile(tiling);
	// var spec = textures['texture/wood_S.jpg'].clone();
	// spec.tile(tiling);
	var norm = cloneAndTileTexture(textures['texture/wood_N.jpg'], tiling);
	var spec = cloneAndTileTexture(textures['texture/wood_S.jpg'], tiling);

	function createPiece(name, color) {
		var size = BOARD_SIZE / COLS * PIECE_SIZE;
		// container for the piece and its reflexion
		var piece = new THREE.Object3D();
		// base material for all the piece (only lightmap changes)
		var material = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			specular: 0xaaaaaa,
			shininess: 60.0,
			map: colors[color],
			normalMap: norm,
			specularMap: spec,
			wireframe: WIREFRAME
		});
		material.normalScale.set(0.3, 0.3);
		// urls of geometry and lightmap
		// var urlGeo = '3D/glb/'+name+'.glb';
		var urlMesh = 'meshes/' + name;
		// var urlAO = 'texture/' + name + '-ao.jpg';

		var mesh = geometries[urlMesh].clone();
		// no need to clone this texture
		// since its pretty specific
		// não funciona mais com a versão atualizada do THREE.js
		// var light = textures[urlAO];
		// light.format = THREE.LuminanceFormat;

		// material.lightMap = light;
		mesh.material = material;

		// var mesh  = new THREE.Mesh(geo,material);
		if (SHADOW) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		mesh.scale.set(size, size, size);
		// we rotate pieces so they face each other (mostly relevant for knight)
		// rotacionar apenas o cavalo porque é o único que precisa
		// e a rotação original não estava funcionando
		if (name === 'knight') {
			mesh.rotation.z += (color == WHITE) ? Math.PI / 2 : -Math.PI / 2;
		}
		// mesh.rotation.y += (color == WHITE) ? -Math.PI / 2 : Math.PI / 2;

		// we create the reflection
		// it's a cloned with a negative scale on the Y axis
		var reflexion = mesh.clone();
		reflexion.scale.y *= -1;
		reflexion.material = reflexion.material.clone();
		reflexion.material.side = THREE.BackSide;
		// debugger;
		piece.add(mesh);
		piece.add(reflexion);

		piece.name = name;
		piece.color = color;

		return piece;
	}

	// make it global
	window.createPiece = createPiece;
}

function initCellFactory() {

	var materials = [];
	var tiling = 2;


	// common textures
	var diff;
	// var norm = textures['texture/wood_N.jpg'].clone();
	// norm.tile(tiling);
	// var spec = textures['texture/wood_S.jpg'].clone();
	// spec.tile(tiling);
	var norm = cloneAndTileTexture(textures['texture/wood_N.jpg'], tiling);
	var spec = cloneAndTileTexture(textures['texture/wood_S.jpg'], tiling);

	for (var c = 0; c < 2; c++) {
		diff = cloneAndTileTexture(textures['texture/wood-' + c + '.jpg'], tiling);
		// diff = textures['texture/wood-'+c+'.jpg'].clone();
		// diff.tile(tiling);

		//common material
		materials[c] = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			specular: [0xAAAAAA, 0x444444][c],
			shininess: 30.0,
			wireframe: WIREFRAME,
			transparent: true,
			map: diff,
			specularMap: spec,
			normalMap: norm,
			//blending: THREE.AdditiveBlending,
			opacity: 0.5
		});
		//materials[c].normalScale.set(0.5,0.5);
	}

	function createCell(size, color) {
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

		var cell = new THREE.Mesh(geo, materials[color]);

		if (SHADOW) {
			cell.receiveShadow = true;
		}

		// by default PlaneGeometry is vertical
		cell.rotation.x = -Math.PI / 2;
		cell.color = color;
		return cell;
	}

	// make it global
	window.createCell = createCell;
}


function createChessBoard(size) {
	// contains everything that makes the board
	var lChessBoard = new THREE.Object3D();

	var cellSize = size / COLS;
	var square, cell;

	for (var i = 0; i < ROWS * COLS; i++) {
		var row = Math.floor(i / COLS);
		cell = new Cell(i);
		square = createCell(cellSize, 1 - (i + row) % 2);
		square.position.copy(cell.getWorldPosition());
		square.name = cell.position;

		lChessBoard.add(square);
	}

	// some fake inner environment color for reflexion
	var innerBoard = geometries['meshes/innerBoard'].clone();
	innerBoard.material = new THREE.MeshBasicMaterial({
		color: 0x783e12
	});
	innerBoard.scale.set(size, size, size);

	/// board borders
	var tiling = 6;

	var wood = cloneAndTileTexture(textures['texture/wood-0.jpg'], tiling);
	var spec = cloneAndTileTexture(textures['texture/wood_S.jpg'], tiling);
	var norm = cloneAndTileTexture(textures['texture/wood_N.jpg'], tiling);

	// var geo = geometries['3D/glb/board.glb'].clone();
	// geo.computeBoundingBox();
	var board = geometries['meshes/board'].clone();
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

	lChessBoard.add(innerBoard);
	lChessBoard.add(board);

	lChessBoard.name = "chessboard";
	return lChessBoard;
}

function createFloor(size, chessboardSize) {
	const geometry = new THREE.PlaneGeometry(chessboardSize * 5, chessboardSize * 5);

    let texture = cloneAndTileTexture(textures['texture/floor.jpg'], 30 * size / 1000);

    const material = new THREE.MeshBasicMaterial({ map: texture, color: 0x004400, side: THREE.DoubleSide });

    const floor = new THREE.Mesh(geometry, material);

    floor.rotation.x += Math.PI / 2;

    if (SHADOW) {
        floor.receiveShadow = true;
    }

    floor.name = "floor";
    return floor;
}

// special highlighting materials
var validCellMaterial = null;
function createValidCellMaterial() {
	validCellMaterial = [];
	var tiling = 2;
	// common textures
	var diff;
	var norm = cloneAndTileTexture(textures['texture/wood_N.jpg'], tiling);
	var spec = cloneAndTileTexture(textures['texture/wood_S.jpg'], tiling);

	for (var c = 0; c < 2; c++) {
		var diff = cloneAndTileTexture(textures['texture/wood-1.jpg'], tiling);

		//common material
		validCellMaterial[c] = new THREE.MeshPhongMaterial({
			color: 0x00ff00,
			specular: 0x999999,
			shininess: 60.0,
			wireframe: WIREFRAME,
			map: diff,
			specularMap: spec,
			normalMap: norm
		});
		//materials[c].normalScale.set(0.5,0.5);
	}
}

var selectedMaterial = null;
function createSelectedMaterial() {
	selectedMaterial = [];
	var tiling = 4;
	// common textures
	var diff;
	// var norm = textures['texture/wood_N.jpg'].clone();
	// norm.tile(tiling);
	// var spec = textures['texture/wood_S.jpg'].clone();
	// spec.tile(tiling);
	var norm = cloneAndTileTexture(textures['texture/wood_N.jpg'], tiling);
	var spec = cloneAndTileTexture(textures['texture/wood_S.jpg'], tiling);

	for (var c = 0; c < 2; c++) {

		// diff = textures['texture/wood-1.jpg'].clone();
		// diff.tile(tiling);
		diff = cloneAndTileTexture(textures['texture/wood-1.jpg'], tiling);

		//common material
		selectedMaterial[c] = new THREE.MeshPhongMaterial({
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
		selectedMaterial[c].normalScale.set(0.3, 0.3);
	}

}