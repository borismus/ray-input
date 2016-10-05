import MenuRenderer from './renderer.js';

let renderer;

function onLoad() {
  renderer = new MenuRenderer();

  window.addEventListener('resize', () => { renderer.resize() });

  render();
}

function render() {
  renderer.render();

  requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);
