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

import {base64} from './util'
import EventEmitter from 'eventemitter3'

const RETICLE_DISTANCE = 3;
const INNER_RADIUS = 0.02;
const OUTER_RADIUS = 0.04;
const RAY_RADIUS = 0.02;
const GRADIENT_IMAGE = base64('image/png', 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3WwXHEQAwDQcin/FOWw+BjuiPYB2q4G2nP933P9SO4824zgDADiDOAuHfb3/UjuKMAcQYQZwBx/gBxChCnAHEKEKcAcQoQpwBxChCnAHEGEGcAcf4AcQoQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHHvtt/1I7ijAHEGEGcAcf4AcQoQZwBxTkCcAsQZQJwTEKcAcQoQpwBxBhDnBMQpQJwCxClAnALEKUCcAsQpQJwCxClAnALEKUCcAsQpQJwBxDkBcQoQpwBxChCnAHEKEKcAcQoQpwBxChCnAHEKEGcAcU5AnALEKUCcAsQZQJwTEKcAcQYQ5wTEKUCcAcQZQJw/QJwCxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUDcu+25fgR3FCDOAOIMIM4fIE4B4hQgTgHiFCBOAeIUIE4B4hQgzgDiDCDOHyBOAeIMIM4A4v4B/5IF9eD6QxgAAAAASUVORK5CYII=');

/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */
export default class RayRenderer extends EventEmitter {
  constructor(camera, opt_params) {
    super();

    this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    this.meshes = {};

    // Which objects are currently selected (keyed on id).
    this.selected = {};

    // The raycaster.
    this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();

    this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    this.reticle = this.createReticle_();
    this.root.add(this.reticle);

    // Add the ray to the root of the object.
    this.ray = this.createRay_();
    this.root.add(this.ray);

    // How far the reticle is currently from the reticle origin.
    this.reticleDistance = RETICLE_DISTANCE;
  }

  /**
   * Register an object so that it can be interacted with.
   */
  add(object) {
    this.meshes[object.id] = object;
  }

  /**
   * Prevent an object from being interacted with.
   */
  remove(object) {
    var id = object.id;
    if (this.meshes[id]) {
      // If there's no existing mesh, we can't remove it.
      delete this.meshes[id];
    }
    // If the object is currently selected, remove it.
    if (this.selected[id]) {
      delete this.selected[object.id];
    }
  }

  update() {
    // Do the raycasting and issue various events as needed.
    for (let id in this.meshes) {
      let mesh = this.meshes[id];
      let intersects = this.raycaster.intersectObject(mesh, true);
      if (intersects.length > 1) {
        console.warn('Unexpected: multiple meshes intersected.');
      }
      let isIntersected = (intersects.length > 0);
      let isSelected = this.selected[id];

      // If it's newly selected, send rayover.
      if (isIntersected && !isSelected) {
        this.selected[id] = true;
        if (this.isActive) {
          this.emit('rayover', mesh);
        }
      }

      // If it's no longer intersected, send rayout.
      if (!isIntersected && isSelected) {
        delete this.selected[id];
        this.moveReticle_(null);
        if (this.isActive) {
          this.emit('rayout', mesh);
        }
      }

      if (isIntersected) {
        this.moveReticle_(intersects);
      }
    }
  }

  /**
   * Sets the origin of the ray.
   * @param {Vector} vector Position of the origin of the picking ray.
   */
  setPosition(vector) {
    this.position.copy(vector);
    this.raycaster.ray.origin.copy(vector);
    this.updateRaycaster_();
  }

  getOrigin() {
    return this.raycaster.ray.origin;
  }

  /**
   * Sets the direction of the ray.
   * @param {Vector} vector Unit vector corresponding to direction.
   */
  setOrientation(quaternion) {
    this.orientation.copy(quaternion);

    var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    this.raycaster.ray.direction.copy(pointAt)
    this.updateRaycaster_();
  }

  getDirection() {
    return this.raycaster.ray.direction;
  }

  /**
   * Sets the pointer on the screen for camera + pointer based picking. This
   * superscedes origin and direction.
   *
   * @param {Vector2} vector The position of the pointer (screen coords).
   */
  setPointer(vector) {
    this.raycaster.setFromCamera(vector, this.camera);
    this.updateRaycaster_();
  }

  /**
   * Gets the mesh, which includes reticle and/or ray. This mesh is then added
   * to the scene.
   */
  getReticleRayMesh() {
    return this.root;
  }

  /**
   * Gets the currently selected object in the scene.
   */
  getSelectedMesh() {
    let count = 0;
    let mesh = null;
    for (var id in this.selected) {
      count += 1;
      mesh = this.meshes[id];
    }
    if (count > 1) {
      console.warn('More than one mesh selected.');
    }
    return mesh;
  }

  /**
   * Hides and shows the reticle.
   */
  setReticleVisibility(isVisible) {
    this.reticle.visible = isVisible;
  }

  /**
   * Enables or disables the raycasting ray which gradually fades out from
   * the origin.
   */
  setRayVisibility(isVisible) {
    this.ray.visible = isVisible;
  }

  /**
   * Enables and disables the raycaster. For touch, where finger up means we
   * shouldn't be raycasting.
   */
  setActive(isActive) {
    // If nothing changed, do nothing.
    if (this.isActive == isActive) {
      return;
    }
    // TODO(smus): Show the ray or reticle adjust in response.
    this.isActive = isActive;

    if (!isActive) {
      this.moveReticle_(null);
      for (let id in this.selected) {
        let mesh = this.meshes[id];
        delete this.selected[id];
        this.emit('rayout', mesh);
      }
    }
  }

  updateRaycaster_() {
    var ray = this.raycaster.ray;

    // Position the reticle at a distance, as calculated from the origin and
    // direction.
    var position = this.reticle.position;
    position.copy(ray.direction);
    position.multiplyScalar(this.reticleDistance);
    position.add(ray.origin);

    // Set position and orientation of the ray so that it goes from origin to
    // reticle.
    var delta = new THREE.Vector3().copy(ray.direction);
    delta.multiplyScalar(this.reticleDistance);
    this.ray.scale.y = delta.length();
    var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
    this.ray.rotation.copy(arrow.rotation);
    this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
  }

  /**
   * Creates the geometry of the reticle.
   */
  createReticle_() {
    // Create a spherical reticle.
    let innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
    let innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    let inner = new THREE.Mesh(innerGeometry, innerMaterial);

    let outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
    let outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.3
    });
    let outer = new THREE.Mesh(outerGeometry, outerMaterial);

    let reticle = new THREE.Group();
    reticle.add(inner);
    reticle.add(outer);
    return reticle;
  }

  /**
   * Moves the reticle to a position so that it's just in front of the mesh that
   * it intersected with.
   */
  moveReticle_(intersections) {
    // If no intersection, return the reticle to the default position.
    let distance = RETICLE_DISTANCE;
    if (intersections) {
      // Otherwise, determine the correct distance.
      let inter = intersections[0];
      distance = inter.distance;
    }

    this.reticleDistance = distance;
    this.updateRaycaster_();
    return;
  }

  createRay_() {
    // Create a cylindrical ray.
    var geometry = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32);
    var material = new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture(GRADIENT_IMAGE),
      //color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    var mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }
}
