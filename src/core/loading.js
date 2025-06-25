import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ChessGui from '../gui/gui';

class ResourceManager {
	/* int */ #loaded;
	/* List<String> */ #RESOURCES = [
		'3D/glb/knight.glb',
		'3D/glb/king.glb',
		'3D/glb/queen.glb',
		'3D/glb/bishop.glb',
		'3D/glb/rook.glb',
		'3D/glb/pawn.glb',
		'3D/glb/board.glb',
		'3D/glb/innerBoard.glb',
		'texture/wood-0.jpg',
		'texture/wood-1.jpg',
		'texture/wood_N.jpg',
		'texture/wood_S.jpg',
		'texture/knight-ao.jpg',
		'texture/rook-ao.jpg',
		'texture/king-ao.jpg',
		'texture/bishop-ao.jpg',
		'texture/queen-ao.jpg',
		'texture/pawn-ao.jpg',
		'texture/floor.jpg',
		'texture/floor_N.jpg',
		'texture/floor_S.jpg',
		'texture/fakeShadow.jpg'
	];
	constructor(callback) {
		this.meshes = {};
		this.textures = {};
		this.#loaded = 0;
		this.onLoaded = callback;
	}

	getMesh(name) {
		return this.meshes[name] || null;
	}
	getTexture(name) {
		return this.textures[name] || null;
	}
	setMesh(name, mesh) {
		this.meshes[name] = mesh;
	}
	setTexture(name, texture) {
		this.textures[name] = texture;
	}
	getMeshes() {
		return this.meshes;
	}
	getTextures() {
		return this.textures;
	}

	#loadGLB(name, url) {
		const loader = new GLTFLoader();
		return new Promise((resolve, reject) => {
			loader.load(`static/${url}`, (gltf) => {
				const mesh = gltf.scene.children[0];
				mesh.name = name;
				this.setMesh(name, mesh);
				this.#checkLoad(++this.#loaded);
				resolve(mesh);
			}, undefined, (error) => {
				console.error('An error happened while loading', url, error);
				reject(error);
			});
		});
	}

	#loadTexture(name, url) {
		return new Promise((resolve, reject) => {
			new THREE.TextureLoader().load(`static/${url}`, (texture) => {
				this.setTexture(name, texture);
				this.#checkLoad(++this.#loaded);
				resolve(texture);
			}, undefined, (error) => {
				console.error('An error happened while loading', url, error);
				reject(error);
			});
		});

	}

	#checkLoad() {
		ChessGui.updateProgressBar(this.#loaded / this.#RESOURCES.length);
		// if (this.#loaded === this.#RESOURCES.length) {
		// 	setTimeout(this.onLoaded, 0.1);
		// 	/* compatibility with old code */
		// 	// window.geometries = geometries;
		// 	// window.textures = textures;
		// }
	}

	loadResources = async () => {
		for (const url of this.#RESOURCES) {
			switch (url.split('.').pop()) {
				case 'glb':
					const meshName = url.split('/').pop().replace('.glb', '');
					await this.#loadGLB(meshName, url);
					break;
				case 'jpg':
					const textureName = url.split('/').pop();
					await this.#loadTexture(textureName, url);
					break;
				default:
					throw new Error('Invalid resource type: ' + url);
			}
		};
		// Return the ResourceManager instance
		return this;
	}

}

export { ResourceManager };
// function initGlow() {
// 	// create and set the green glow in the background
// 	var size = window.innerWidth * LOADING_BAR_SCALE * 1.8;
// 	glow = document.createElement('canvas');
// 	glow.width = size;
// 	glow.height = size;
// 	document.body.appendChild(glow);
// 	var ctx = glow.getContext('2d');

// 	// make it oval
// 	glow.style.width = size + "px";
// 	glow.style.height = Math.round(size / 2) + "px";


// 	var requestId;
// 	function animate() {
// 		var dt = getDelta();
// 		update(dt);
// 		requestId = window.requestAnimationFrame(animate);
// 	}

// 	function update(dt) {

// 		ctx.clearRect(0, 0, size, size);

// 		// for the pulse effect
// 		var cycle = Math.cos(Date.now() / 1000 * Math.PI);
// 		var maxRadius = size / 2.5;

// 		function lerp(a, b, p) {
// 			return a + (b - a) * p;
// 		}

// 		var amplitude = maxRadius * 0.015;
// 		var sizeOffset = cycle * amplitude;
// 		var radius = maxRadius - amplitude + sizeOffset;
// 		var saturation = lerp(70, 100, (cycle + 1) / 2);


// 		var grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, radius);
// 		// fake a non linear gradient
// 		grd.addColorStop(0, 'hsla(90,' + saturation + '%,50%,0.5)');
// 		grd.addColorStop(0.125, 'hsla(90,' + saturation + '%,50%,0.3828125)');
// 		grd.addColorStop(0.25, 'hsla(90,' + saturation + '%,50%,0.28125)');
// 		grd.addColorStop(0.375, 'hsla(90,' + saturation + '%,50%,0.1953125)');
// 		grd.addColorStop(0.5, 'hsla(90,' + saturation + '%,50%,0.125)');
// 		grd.addColorStop(0.75, 'hsla(90,' + saturation + '%,50%,0.03125)');
// 		grd.addColorStop(1, 'hsla(90,' + saturation + '%,50%,0.0)');

// 		// draw the gradient
// 		ctx.rect(0, 0, size, size);
// 		ctx.fillStyle = grd;
// 		ctx.fill();
// 	}

// 	glow.remove = function () {
// 		window.cancelAnimationFrame(requestId);
// 		this.parentNode.removeChild(this);
// 	};

// 	var oldTime;
// 	function getDelta() {
// 		var now = Date.now();
// 		if (oldTime === undefined) {
// 			oldTime = now;
// 		}
// 		var delta = (now - oldTime) / 1000;
// 		oldTime = now;
// 		return delta;
// 	}

// 	animate();
// }
