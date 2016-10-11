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

const FIGURE_HEIGHT = 1.6;

/**
 * Responsible for rendering a stick figure with the arm model from a third
 * person view. Takes in a calculated pose of the controller.
 */
export default class DaydreamSimulator {

  constructor(model) {
    this.model = model;

    let scene = new THREE.Scene();

    let aspect = window.innerWidth / window.innerHeight;
    let camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    camera.position.set(0, FIGURE_HEIGHT*2, 0);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({antialiasing: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enablePan = false;
    controls.minZoom = 1;
    controls.maxZoom = 2;
    controls.target.set(0, FIGURE_HEIGHT/2, 0);

    document.body.appendChild(renderer.domElement);

    // Create the stick figure.
    this.root = this.createStickFigure_()
    scene.add(this.root);

    // Create the articulated arm and elbow.
    this.forearm = this.createBone_();
    this.wrist = this.createBone_();
    scene.add(this.forearm);
    scene.add(this.wrist);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
  }


  render() {
    // Draw the stick figure guy according to the arm model.
    let pose = this.model.getPose();
    let wristPos = this.model.getWristPosition();
    let elbowPos = this.model.getElbowPosition();

    let dir = new THREE.Vector3().subVectors(wristPos, elbowPos);
    this.forearm.position.copy(elbowPos);
    this.forearm.setDirection(dir.normalize());
    this.forearm.setLength(this.model.getForearmLength());
    this.forearm.setColor(new THREE.Color(0xff0000));

    dir.set(0, 0, -1);
    dir.applyQuaternion(pose.orientation);
    this.wrist.position.copy(wristPos);
    this.wrist.setDirection(dir);
    this.wrist.setColor(new THREE.Color(0xff00ff));
    this.wrist.setLength(0.1);

    this.root.quaternion.copy(this.model.rootQ);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }


  createStickFigure_() {
    let innerGeometry = new THREE.BoxGeometry(0.1, FIGURE_HEIGHT, 0.1);
    let innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.8
    });

    innerGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, FIGURE_HEIGHT / 2, 0));
    let inner = new THREE.Mesh(innerGeometry, innerMaterial);

    return inner;
  }

  createBone_() {
    // Params: dir, origin, length, hex, headLength, headWidth.
    let arrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(),
        1, 0xffffff, 0.1, 0.05);
    arrow.scale.set(5, 1, 5);
    return arrow;
  }

}
