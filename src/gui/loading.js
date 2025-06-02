// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE, $, document, window,  console */
/* global onLoaded, LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
"use strict";

var geometries = {};
var textures = {};

(function () {
	var $bar, $tips;
	var glow;

	function loadResources() {
		// counter
		var loaded = 0;
		// list of all mesh and texture
		var resources = [
			// 'static/3D/json/knight.json',
			// 'static/3D/json/king.json',
			// 'static/3D/json/queen.json',
			// 'static/3D/json/bishop.json',
			// 'static/3D/json/rook.json',
			// 'static/3D/json/pawn.json',
			// 'static/3D/json/board.json',
			// 'static/3D/json/innerBoard.json',
			'static/3D/glb/knight.glb',
			'static/3D/glb/king.glb',
			'static/3D/glb/queen.glb',
			'static/3D/glb/bishop.glb',
			'static/3D/glb/rook.glb',
			'static/3D/glb/pawn.glb',
			'static/3D/glb/board.glb',
			'static/3D/glb/innerBoard.glb',
			'static/texture/wood-0.jpg',
			'static/texture/wood-1.jpg',
			'static/texture/wood_N.jpg',
			'static/texture/wood_S.jpg',
			'static/texture/knight-ao.jpg',
			'static/texture/rook-ao.jpg',
			'static/texture/king-ao.jpg',
			'static/texture/bishop-ao.jpg',
			'static/texture/queen-ao.jpg',
			'static/texture/pawn-ao.jpg',
			'static/texture/floor.jpg',
			'static/texture/floor_N.jpg',
			'static/texture/floor_S.jpg',
			'static/texture/fakeShadow.jpg'
		];

		/**
		 * A versão atualizada do THREE.js não suporta mais o THREE.JSONLoader
		 * Então, em vez disso, vamos usar o GLTFLoader para carregar os modelos 3D,
		 * e armazenar a geometria carregada no objeto `geometries`.
		 * A mesh poderia ser utilizada diretamente, mas para compatibilidade com o código existente,
		 * vamos manter a estrutura de geometries.
		 * @see https://threejs.org/docs/index.html#examples/en/loaders/GLTFLoader
		 * @param {*} url caminho do arquivo a ser carregado
		 */
		//TODO: Armazenar as meshes em vez de geometries
		function loadGeomety(url) {
			const name = url.replace('static/', '');
			const loader = new window.GLTFLoader();
			loader.load(url, function (gltf) {
				// gltf.scene.children[0] is the mesh
				const geometry = gltf.scene.children[0].geometry;
				geometries[name] = geometry;
				loaded++;
				checkLoad();
			}, undefined, function (error) {
				console.error('An error happened while loading', url, error);
			});

		}

		// for loading mesh

		function loadJSON(url) {
			var loader = new THREE.JSONLoader();
			loader.load(url, function (geometry) {
				const urlWithoutStatic = url.replace('static/', ''); //Remover o static apenas ao salvar no objeto
				//  para compatibilidade com a utilização dos recursos depois e evitar mudar no código todo
				geometries[urlWithoutStatic] = geometry;

				loaded++;
				checkLoad();
			});
		}

		// for loading texture
		function loadImage(url) {
			const urlWithoutStatic = url.replace('static/', ''); //Remover o static apenas ao salvar no objeto
			new window.THREE176.TextureLoader().load(url,
				(texture) => {
					// store the texture in the textures object
					textures[urlWithoutStatic] = texture;
					loaded++;
					checkLoad();
				}, undefined, function (error) {
					console.error('An error happened while loading', url, error);
				});
			// THREE.ImageUtils.loadTexture(
			// 	url,
			// 	THREE.UVMapping(),
			// 	function (texture) {
			// 		textures[urlWithoutStatic] = texture;
			// 		loaded++;
			// 		checkLoad();
			// 	}
			// );
		}

		// load all the resources from the list
		resources.forEach(function (url) {
			switch (url.split('.').pop()) {
				case 'glb':
					loadGeomety(url);
					break;
				// case 'json' :
				// 	loadJSON(url);
				// 	break;
				case 'jpg':
					loadImage(url);
					break;
				default:
					throw 'invalid resource';
			}
		});

		// control the progressBar
		// and fire the onLoaded call back on completion
		function checkLoad() {
			$bar.update(loaded / resources.length);
			if (loaded === resources.length) {
				setTimeout(onLoaded, 0.1);
			}
		}

	}

	function initGlow() {
		// create and set the green glow in the background
		var size = window.innerWidth * LOADING_BAR_SCALE * 1.8;
		glow = document.createElement('canvas');
		glow.width = size;
		glow.height = size;
		document.body.appendChild(glow);
		var ctx = glow.getContext('2d');

		// make it oval
		glow.style.width = size + "px";
		glow.style.height = Math.round(size / 2) + "px";


		var requestId;
		function animate() {
			var dt = getDelta();
			update(dt);
			requestId = window.requestAnimationFrame(animate);
		}

		function update(dt) {

			ctx.clearRect(0, 0, size, size);

			// for the pulse effect
			var cycle = Math.cos(Date.now() / 1000 * Math.PI);
			var maxRadius = size / 2.5;

			function lerp(a, b, p) {
				return a + (b - a) * p;
			}

			var amplitude = maxRadius * 0.015;
			var sizeOffset = cycle * amplitude;
			var radius = maxRadius - amplitude + sizeOffset;
			var saturation = lerp(70, 100, (cycle + 1) / 2);


			var grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, radius);
			// fake a non linear gradient
			grd.addColorStop(0, 'hsla(90,' + saturation + '%,50%,0.5)');
			grd.addColorStop(0.125, 'hsla(90,' + saturation + '%,50%,0.3828125)');
			grd.addColorStop(0.25, 'hsla(90,' + saturation + '%,50%,0.28125)');
			grd.addColorStop(0.375, 'hsla(90,' + saturation + '%,50%,0.1953125)');
			grd.addColorStop(0.5, 'hsla(90,' + saturation + '%,50%,0.125)');
			grd.addColorStop(0.75, 'hsla(90,' + saturation + '%,50%,0.03125)');
			grd.addColorStop(1, 'hsla(90,' + saturation + '%,50%,0.0)');

			// draw the gradient
			ctx.rect(0, 0, size, size);
			ctx.fillStyle = grd;
			ctx.fill();
		}

		glow.remove = function () {
			window.cancelAnimationFrame(requestId);
			this.parentNode.removeChild(this);
		};

		var oldTime;
		function getDelta() {
			var now = Date.now();
			if (oldTime === undefined) {
				oldTime = now;
			}
			var delta = (now - oldTime) / 1000;
			oldTime = now;
			return delta;
		}

		animate();
	}


	function initTips() {
		// list of tips
		var tips = [
			"Aggregating wood fibers",
			"Generating pieces census report",
			"Testing board resistance",
			"Generating Matrix 8x8",
			"Answering Queen's request",
			"Carving a princess for the knight",
			"Sanding the Bishop",
			"Enrolling Pawns",
			"Generating cheat sheet",
			"Mating the king",
			"Planting virtual trees",
			"Asking Deep Blue for advice",
			"Nominating Bishops",
			"Dubbing Knights",
			"Crowning the King",
			"Waxing chessboard",
			"Evaluating the idea of an hexagonal board, and rejecting it",
			"Gathering extra vertices (just in case)",
			"Trimming edges",
			"Intimidating opponent",
			"Learning the rules"
		];

		//jQuery object for tips
		$tips = $('<div>')
			.attr("id", "tips")
			.css("color", "white")
			.appendTo($('body'));

		// how often tips changes (in ms)
		var tipTiming = 5000;


		$tips.update = function () {
			var self = this;
			if (tips.length > 0) {
				var index = Math.floor(Math.random() * tips.length);

				var sentence = tips[index];
				tips.splice(index, 1);
				$(this).text(sentence + "...");
			}
			this.timer = setTimeout(function () { self.update(); }, tipTiming);
		};

		// this little ugliness is just to clear the timer
		// automagically on .remove()
		var tipsRemove = $tips.remove;
		$tips.remove = function () {
			clearTimeout(this.timer);
			tipsRemove.call(this);
		};
		$tips.update();

	}

	function initBar() {
		// jQuery progress bar
		$bar = $('<div>')
			.attr("id", "progressbar")
			.css("width", (LOADING_BAR_SCALE * 100) + "%")
			.appendTo($('body'));

		// jQuery progress bar label
		var $label = $('<div>')
			.attr("id", "progress-label")
			.appendTo($bar);

		// setting up the progressbar
		$bar.progressbar({
			value: false,
			change: function () {
				$label.text($bar.progressbar("value") + "%");
			}
		});

		// avoid rounded corners
		$bar.removeClass('ui-corner-all');
		$bar.children().removeClass('ui-corner-all');
		$bar.children().removeClass('ui-corner-left');


		// that's where the progression happens
		$bar.update = function (p) {
			p = Math.round(p * 100);
			$bar.progressbar("value", p);
			// somehow need to constantly remove it
			$bar.children().removeClass('ui-corner-right');
		};

		$bar.update(0);

	}

	function centering() {
		$bar.position({
			of: window,
			my: "center center",
			at: "center center"
		});
		$tips.position({
			of: $bar,
			my: "center bottom",
			at: "center top-10"
		});
		$(glow).position({
			of: window,
			my: "center center",
			at: "center center"
		});

		window.addEventListener('resize', centering);
	}

	function removeLoader() {
		$bar.remove();
		$tips.remove();
		glow.remove();
		window.removeEventListener('resize', centering);

	}

	window.onload = function () {
		// the page is loaded
		// start the resource loader
		initGlow();
		initTips();
		initBar();
		centering();

		loadResources();
		//$bar.update(1);
	};

	window.removeLoader = removeLoader;
})();