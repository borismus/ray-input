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

import OrientationArmModel from './orientation-arm-model'
import EventEmitter from 'eventemitter3'
import RayRenderer from './ray-renderer'
import RayController from './ray-controller'
import InteractionModes from './ray-interaction-modes'

/**
 * API wrapper for the input library.
 */
export default class RayInput extends EventEmitter {
  constructor(camera, opt_el) {
    super();

    this.camera = camera;
    this.renderer = new RayRenderer(camera);
    this.controller = new RayController(opt_el);

    // Arm model needed to transform controller orientation into proper pose.
    this.armModel = new OrientationArmModel();

    this.controller.on('raydown', this.onRayDown_.bind(this));
    this.controller.on('rayup', this.onRayUp_.bind(this));
    this.controller.on('raycancel', this.onRayCancel_.bind(this));
    this.controller.on('pointermove', this.onPointerMove_.bind(this));
    this.renderer.on('rayover', (mesh) => { this.emit('rayover', mesh) });
    this.renderer.on('rayout', (mesh) => { this.emit('rayout', mesh) });

    // By default, put the pointer offscreen.
    this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    this.handlers = {};
  }

  add(object, handlers) {
    this.renderer.add(object, handlers);
    this.handlers[object.id] = handlers;
  }

  remove(object) {
    this.renderer.remove(object);
    delete this.handlers[object.id]
  }

  update() {
    let lookAt = new THREE.Vector3(0, 0, -1);
    lookAt.applyQuaternion(this.camera.quaternion);

    let mode = this.controller.getInteractionMode();
    switch (mode) {
      case InteractionModes.MOUSE:
        // Desktop mouse mode, mouse coordinates are what matters.
        this.renderer.setPointer(this.pointerNdc);
        // Hide the ray and reticle.
        this.renderer.setRayVisibility(false);
        this.renderer.setReticleVisibility(false);

        // In mouse mode ray renderer is always active.
        this.renderer.setActive(true);
        break;

      case InteractionModes.TOUCH:
        // Mobile magic window mode. Touch coordinates matter, but we want to
        // hide the reticle.
        this.renderer.setPointer(this.pointerNdc);

        // Hide the ray and the reticle.
        this.renderer.setRayVisibility(false);
        this.renderer.setReticleVisibility(false);

        // In touch mode the ray renderer is only active on touch.
        this.renderer.setActive(this.controller.getIsTouchActive());
        break;

      case InteractionModes.VR_0DOF:
        // Cardboard mode, we're dealing with a gaze reticle.
        this.renderer.setPosition(this.camera.position);
        this.renderer.setOrientation(this.camera.quaternion);

        // Reticle only.
        this.renderer.setRayVisibility(false);
        this.renderer.setReticleVisibility(true);

        // Ray renderer always active.
        this.renderer.setActive(true);
        break;

      case InteractionModes.VR_3DOF:
        // Daydream, our origin is slightly off (depending on handedness).
        // But we should be using the orientation from the gamepad.
        // TODO(smus): Implement the real arm model.
        var pose = this.controller.getGamepadPose();

        // Debug only: use camera as input controller.
        //let controllerOrientation = this.camera.quaternion;
        let controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

        // Transform the controller into the camera coordinate system.
        /*
        controllerOrientation.multiply(
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
        controllerOrientation.x *= -1;
        controllerOrientation.z *= -1;
        */

        // Feed camera and controller into the arm model.
        this.armModel.setHeadOrientation(this.camera.quaternion);
        this.armModel.setHeadPosition(this.camera.position);
        this.armModel.setControllerOrientation(controllerOrientation);
        this.armModel.setLeftHanded(this.controller.isLeftHanded);
        this.armModel.update();

        // Get resulting pose and configure the renderer.
        let modelPose = this.armModel.getPose();
        this.renderer.setPosition(modelPose.position);
        //this.renderer.setPosition(new THREE.Vector3());
        this.renderer.setOrientation(modelPose.orientation);
        //this.renderer.setOrientation(controllerOrientation);

        // Show ray and reticle.
        this.renderer.setRayVisibility(true);
        this.renderer.setReticleVisibility(true);

        // Ray renderer always active.
        this.renderer.setActive(true);
        break;

      case InteractionModes.VR_6DOF:
        // Vive, origin depends on the position of the controller.
        // TODO(smus)...
        var pose = this.controller.getGamepadPose();

        // Check that the pose is valid.
        if (!pose.orientation || !pose.position) {
          console.warn('Invalid gamepad pose. Can\'t update ray.');
          break;
        }
        let orientation = new THREE.Quaternion().fromArray(pose.orientation);
        let position = new THREE.Vector3().fromArray(pose.position);

        this.renderer.setOrientation(orientation);
        this.renderer.setPosition(position);

        // Show ray and reticle.
        this.renderer.setRayVisibility(true);
        this.renderer.setReticleVisibility(true);

        // Ray renderer always active.
        this.renderer.setActive(true);
        break;

      default:
        console.error('Unknown interaction mode.');
    }
    this.renderer.update();
    this.controller.update();
  }

  setSize(size) {
    this.controller.setSize(size);
  }

  getMesh() {
    return this.renderer.getReticleRayMesh();
  }

  getOrigin() {
    return this.renderer.getOrigin();
  }

  getDirection() {
    return this.renderer.getDirection();
  }

  getRightDirection() {
    let lookAt = new THREE.Vector3(0, 0, -1);
    lookAt.applyQuaternion(this.camera.quaternion);
    return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
  }

  onRayDown_(e) {
    //console.log('onRayDown_');

    // Force the renderer to raycast.
    this.renderer.update();
    let mesh = this.renderer.getSelectedMesh();
    this.emit('raydown', mesh);

    this.renderer.setActive(true);
  }

  onRayUp_(e) {
    //console.log('onRayUp_');
    let mesh = this.renderer.getSelectedMesh();
    this.emit('rayup', mesh);

    this.renderer.setActive(false);
  }

  onRayCancel_(e) {
    //console.log('onRayCancel_');
    let mesh = this.renderer.getSelectedMesh();
    this.emit('raycancel', mesh);
  }

  onPointerMove_(ndc) {
    this.pointerNdc.copy(ndc);
  }
}
