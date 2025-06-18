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
const resourceManager = window.resourceManager;
if (!resourceManager) {
	throw new Error('ResourceManager not initialized. ');
}

function initPieceFactory() {
	const normTexture = resourceManager.getTexture('wood_N.jpg');
	const specTexture = resourceManager.getTexture('wood_S.jpg');

	// common textures
	var tiling = 4;
	var colors = [];
	for (var c = 0; c < 2; c++) {

		colors[c] = cloneAndTileTexture(resourceManager.getTexture('wood-' + c + '.jpg'), tiling);
	}

	var norm = cloneAndTileTexture(normTexture, tiling);
	var spec = cloneAndTileTexture(specTexture, tiling);

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

	// make it global
	window.createPiece = createPiece;
}

function initCellFactory() {
	const normTexture = resourceManager.getTexture('wood_N.jpg');
	const specTexture = resourceManager.getTexture('wood_S.jpg');
	var materials = [];
	var tiling = 2;

	// common textures
	var diff;

	var norm = cloneAndTileTexture(normTexture, tiling);
	var spec = cloneAndTileTexture(specTexture, tiling);

	for (var c = 0; c < 2; c++) {
		diff = cloneAndTileTexture(resourceManager.getTexture('wood-' + c + '.jpg'), tiling);

		//common material
		materials[c] = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			specular: [0xAAAAAA, 0x444444][c],
			shininess: 20.0,
			wireframe: WIREFRAME,
			map: diff,
			specularMap: spec,
			normalMap: norm,
		});
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