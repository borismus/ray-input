import MenuRenderer from './renderer.js';

let renderer;

function onLoad() {
  renderer = new MenuRenderer();

  render();
}

function render() {
  renderer.render();

  requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);
