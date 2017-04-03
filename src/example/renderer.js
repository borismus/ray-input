/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    var effect = new THREE.VREffect(renderer);
    var controls = new THREE.VRControls(camera);
    controls.standing = true;

    var manager = new WebVRManager(renderer, effect);
    document.body.appendChild(renderer.domElement);

    // Input manager.
    var rayInput = new RayInput(camera)
    rayInput.setSize(renderer.getSize());
    rayInput.on('raydown', (opt_mesh) => { this.handleRayDown_(opt_mesh) });
    rayInput.on('rayup', (opt_mesh) => { this.handleRayUp_(opt_mesh) });
    rayInput.on('raycancel', (opt_mesh) => { this.handleRayCancel_(opt_mesh) });
    rayInput.on('rayover', (mesh) => { this.setSelected_(mesh, true) });
    rayInput.on('rayout', (mesh) => { this.setSelected_(mesh, false) });

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
    var menu = this.createMenu_();
    scene.add(menu);

    // Add a floor.
    var floor = this.createFloor_();
    scene.add(floor);

    menu.children.forEach(function(menuItem) {
      //console.log('menuItem', menuItem);
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

  handleRayDown_(opt_mesh) {
    this.setAction_(opt_mesh, true);
  }

  handleRayUp_(opt_mesh) {
    this.setAction_(opt_mesh, false);
  }

  handleRayCancel_(opt_mesh) {
    this.setAction_(opt_mesh, false);
  }

  setSelected_(mesh, isSelected) {
    //console.log('setSelected_', isSelected);
    var newColor = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    mesh.material.color = newColor;
  }

  setAction_(opt_mesh, isActive) {
    //console.log('setAction_', !!opt_mesh, isActive);
    if (opt_mesh) {
      var newColor = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
      opt_mesh.material.color = newColor;
      if (!isActive) {
        opt_mesh.material.wireframe = !opt_mesh.material.wireframe;
      }
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

  createFloor_() {
    var boxSize = 10;
    var loader = new THREE.TextureLoader();
    loader.load('img/box.png', onTextureLoaded);
    var out = new THREE.Object3D();

    function onTextureLoaded(texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(boxSize, boxSize);

      var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x015500,
        side: THREE.BackSide
      });

      // Align the skybox to the floor (which is at y=0).
      let skybox = new THREE.Mesh(geometry, material);
      skybox.position.y = boxSize/2;

      out.add(skybox);
    }
    return out;
  }
}
