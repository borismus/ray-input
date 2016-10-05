import WebVRManager from 'webvr-boilerplate'
import WebVRPolyfill from 'webvr-polyfill'
import RayInput from '../ray-input'

const WIDTH = 2;
const HEIGHT = 2;
const DEFAULT_COLOR = new THREE.Color(0x00FF00);
const HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
const ACTIVE_COLOR = new THREE.Color(0xFF3333);

/**
 * Renders a menu of items that can be interacted with.
 */
export default class MenuRenderer {

  constructor() {
    var scene = new THREE.Scene();

    var aspect = window.innerWidth / window.innerHeight;
    var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    var effect = new THREE.VREffect(renderer);
    var controls = new THREE.VRControls(camera);
    controls.standing = true;

    var manager = new WebVRManager(renderer, effect);
    document.body.appendChild(renderer.domElement);

    // Input manager.
    var rayInput = new RayInput(camera)
    rayInput.setSize(renderer.getSize());
    rayInput.on('action', (opt_mesh) => { this.handleAction_(opt_mesh) });
    rayInput.on('release', (opt_mesh) => { this.handleRelease_(opt_mesh) });
    rayInput.on('cancel', (opt_mesh) => { this.handleCancel_(opt_mesh) });
    rayInput.on('select', (mesh) => { this.setSelected_(mesh, true) });
    rayInput.on('deselect', (mesh) => { this.setSelected_(mesh, false) });

    // Add the ray input mesh to the scene.
    scene.add(rayInput.getMesh());

    this.manager = manager;
    this.camera = camera;
    this.scene = scene;
    this.controls = controls;
    this.rayInput = rayInput;
    this.effect = effect;
    this.renderer = renderer;

    // Add a small fake menu to interact with.
    var menu = this.createMenu_()
    scene.add(menu);

    menu.children.forEach(function(menuItem) {
      console.log('menuItem', menuItem);
      rayInput.add(menuItem);
    });
  }


  render() {
    this.controls.update();
    this.rayInput.update();
    this.effect.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.rayInput.setSize(this.renderer.getSize());
  }

  handleAction_(opt_mesh) {
    this.setAction_(opt_mesh, true);
  }

  handleRelease_(opt_mesh) {
    this.setAction_(opt_mesh, false);
  }

  handleCancel_(opt_mesh) {
    this.setAction_(opt_mesh, false);
  }

  setSelected_(mesh, isSelected) {
    var newColor = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    mesh.material.color = newColor;
  }

  setAction_(opt_mesh, isActive) {
    if (opt_mesh) {
      var newColor = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
      opt_mesh.material.color = newColor;
    }
  }

  createMenu_() {
    var menu = new THREE.Object3D();

    // Create a 2x2 grid of menu items (green rectangles).
    for (var i = 0; i < WIDTH; i++) {
      for (var j = 0; j < HEIGHT; j++) {
        var item = this.createMenuItem_();
        item.position.set(i, j, 0);
        item.scale.set(0.9, 0.9, 0.1);
        menu.add(item);
      }
    }

    menu.position.set(-WIDTH/4, HEIGHT/2, -3);
    return menu;
  }

  createMenuItem_() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({color: DEFAULT_COLOR});
    var cube = new THREE.Mesh(geometry, material);

    return cube;
  }
}
