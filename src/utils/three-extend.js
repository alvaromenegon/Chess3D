// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global SHADOW,onOBJLoaded,THREE,console,BLACK,WHITE,WIREFRAME */

/* 
 * few extension or modification to some three.js functionnality 
 * often to avoid some repetitive tasks
 */
// Para a versão do Three 176 serão usadas funções em vez de protótipos
function cloneTexture(texture){    
    var newTexture = texture.clone();
    newTexture.needsUpdate = true;
    return newTexture;
}

function tileTextureAndRepeat(texture, factor) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(factor, factor);
}
/**
 * As funções clone e tile são utilizadas juntas com frequência,
 * então esta função combina ambas para facilitar o uso.
 * @param {*} texture - A textura a ser clonada
 * @param {*} factor - O fator de tiling
 * @returns a texture clonada e com tiling aplicado
 */
function cloneAndTileTexture(texture, factor) {
	var newTexture = cloneTexture(texture);
	tileTextureAndRepeat(newTexture, factor);
	return newTexture;
}