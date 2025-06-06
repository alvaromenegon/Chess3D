const grayscaleShader = {
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main() {
    vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(gray), color.a);
    }`
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const grayscalePass = new ShaderPass(grayscaleShader);
composer.addPass(grayscalePass);

function animateGameOver() {
    requestAnimationFrame(animateGameOver);
    composer.render();
}

window.animateGameOver = animateGameOver;