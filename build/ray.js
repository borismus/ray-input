'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('eventemitter3'));

const HEAD_ELBOW_OFFSET = new THREE.Vector3(0.155, -0.465, -0.15);
const ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
const WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
const ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

const ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
const EXTENSION_RATIO_WEIGHT = 0.4;

const MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */
class DaydreamArmModel {
  constructor() {
    this.isLeftHanded = false;

    // Current and previous controller orientations.
    this.controllerQ = new THREE.Quaternion();
    this.lastControllerQ = new THREE.Quaternion();

    // Current and previous head orientations.
    this.headQ = new THREE.Quaternion();

    // Current head position.
    this.headPos = new THREE.Vector3();

    // Positions of other joints (mostly for debugging).
    this.elbowPos = new THREE.Vector3();
    this.wristPos = new THREE.Vector3();

    // Current and previous times the model was updated.
    this.time = null;
    this.lastTime = null;

    // Root rotation.
    this.rootQ = new THREE.Quaternion();

    // Current pose that this arm model calculates.
    this.pose = {
      orientation: new THREE.Quaternion(),
      position: new THREE.Vector3()
    };
  }

  /**
   * Methods to set controller and head pose (in world coordinates).
   */
  setControllerOrientation(quaternion) {
    this.lastControllerQ.copy(this.controllerQ);
    this.controllerQ.copy(quaternion);
  }

  setHeadOrientation(quaternion) {
    this.headQ.copy(quaternion);
  }

  setHeadPosition(position) {
    this.headPos.copy(position);
  }

  setLeftHanded(isLeftHanded) {
    // TODO(smus): Implement me!
    this.isLeftHanded = isLeftHanded;
  }

  /**
   * Called on a RAF.
   */
  update() {
    this.time = performance.now();

    // If the controller's angular velocity is above a certain amount, we can
    // assume torso rotation and move the elbow joint relative to the
    // camera orientation.
    let headYawQ = this.getHeadYawOrientation_();
    let timeDelta = (this.time - this.lastTime) / 1000;
    let angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
    let controllerAngularSpeed = angleDelta / timeDelta;
    if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
      // Attenuate the Root rotation slightly.
      this.rootQ.slerp(headYawQ, angleDelta / 10)
    } else {
      this.rootQ.copy(headYawQ);
    }

    // We want to move the elbow up and to the center as the user points the
    // controller upwards, so that they can easily see the controller and its
    // tool tips.
    let controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
    let controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
    let extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

    // Controller orientation in camera space.
    let controllerCameraQ = this.rootQ.clone().inverse();
    controllerCameraQ.multiply(this.controllerQ);

    // Calculate elbow position.
    let elbowPos = this.elbowPos;
    elbowPos.copy(this.headPos).add(HEAD_ELBOW_OFFSET);
    let elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
    elbowOffset.multiplyScalar(extensionRatio);
    elbowPos.add(elbowOffset);

    // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
    // to wrist, but if controller is raised higher, more rotation comes from
    // the wrist.
    let totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
    let totalAngleDeg = THREE.Math.radToDeg(totalAngle);
    let lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

    let elbowRatio = ELBOW_BEND_RATIO;
    let wristRatio = 1 - ELBOW_BEND_RATIO;
    let lerpValue = lerpSuppression *
        (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

    let wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
    let invWristQ = wristQ.inverse();
    let elbowQ = controllerCameraQ.clone().multiply(invWristQ);

    // Calculate our final controller position based on all our joint rotations
    // and lengths.
    /*
    position_ =
      root_rot_ * (
        controller_root_offset_ +
2:      (arm_extension_ * amt_extension) +
1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
      );
    */
    let wristPos = this.wristPos;
    wristPos.copy(WRIST_CONTROLLER_OFFSET);
    wristPos.applyQuaternion(wristQ);
    wristPos.add(ELBOW_WRIST_OFFSET);
    wristPos.applyQuaternion(elbowQ);
    wristPos.add(this.elbowPos);

    let offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
    offset.multiplyScalar(extensionRatio);

    let position = new THREE.Vector3().copy(this.wristPos);
    position.add(offset);
    position.applyQuaternion(this.rootQ);

    let orientation = new THREE.Quaternion().copy(this.controllerQ);

    // Set the resulting pose orientation and position.
    this.pose.orientation.copy(orientation);
    this.pose.position.copy(position);

    this.lastTime = this.time;
  }

  /**
   * Returns the pose calculated by the model.
   */
  getPose() {
    return this.pose;
  }

  /**
   * Debug methods for rendering the arm model.
   */
  getForearmLength() {
    return ELBOW_WRIST_OFFSET.length();
  }

  getElbowPosition() {
    let out = this.elbowPos.clone();
    return out.applyQuaternion(this.rootQ);
  }

  getWristPosition() {
    let out = this.wristPos.clone();
    return out.applyQuaternion(this.rootQ);
  }

  getHeadYawOrientation_() {
    let headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
    headEuler.x = 0;
    headEuler.z = 0;
    let destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
    return destinationQ;
  }

  clamp_(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  quatAngle_(q1, q2) {
    let vec1 = new THREE.Vector3(0, 0, -1);
    let vec2 = new THREE.Vector3(0, 0, -1);
    vec1.applyQuaternion(q1);
    vec2.applyQuaternion(q2);
    return vec1.angleTo(vec2);
  }
}

function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

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
 *     select(mesh): This mesh was selected.
 *     deselect(mesh): This mesh was unselected.
 */
class RayRenderer extends EventEmitter {
  constructor(camera, opt_params) {
    super();

    this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    this.meshes = {};

    // Which objects are currently selected (keyed on id).
    this.selected = {};

    // Event handlers for interactive objects (keyed on id).
    this.handlers = {};

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
   * @param {Object} handlers The event handlers to process for selection,
   * deselection, and activation.
   */
  add(object, opt_handlers) {
    this.meshes[object.id] = object;

    // TODO(smus): Validate the handlers, making sure only valid handlers are
    // provided (ie. onSelect, onDeselect, onAction, etc).
    var handlers = opt_handlers || {};
    this.handlers[object.id] = handlers;
  }

  /**
   * Prevent an object from being interacted with.
   */
  remove(object) {
    var id = object.id;
    if (!this.meshes[id]) {
      // If there's no existing mesh, we can't remove it.
      delete this.meshes[id];
      delete this.handlers[id];
    }
    // If the object is currently selected, remove it.
    if (this.selected[id]) {
      var handlers = this.handlers[id]
      if (handlers.onDeselect) {
        handlers.onDeselect(object);
      }
      delete this.selected[object.id];
    }
  }

  update() {
    // Do the raycasting and issue various events as needed.
    for (var id in this.meshes) {
      var mesh = this.meshes[id];
      var handlers = this.handlers[id];
      var intersects = this.raycaster.intersectObject(mesh, true);
      var isIntersected = (intersects.length > 0);
      var isSelected = this.selected[id];

      // If it's newly selected, send onSelect.
      if (isIntersected && !isSelected) {
        this.selected[id] = true;
        if (handlers.onSelect) {
          handlers.onSelect(mesh);
        }
        this.emit('select', mesh);
      }

      // If it's no longer selected, send onDeselect.
      if (!isIntersected && isSelected) {
        delete this.selected[id];
        if (handlers.onDeselect) {
          handlers.onDeselect(mesh);
        }
        this.moveReticle_(null);
        this.emit('deselect', mesh);
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
   * Sets whether or not there is currently action.
   */
  setActive(isActive) {
    // TODO(smus): Show the ray or reticle adjust in response.
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

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  CARDBOARD: 3,
  DAYDREAM: 4,
  VIVE: 5
}

const DRAG_DISTANCE_PX = 10;

/**
 * Enumerates all possible interaction modes. Sets up all event handlers (mouse,
 * touch, etc), interfaces with gamepad API.
 *
 * Emits events:
 *    action: Input is activated (mousedown, touchstart, daydream click, vive
 *    trigger).
 *    release: Input is deactivated (mouseup, touchend, daydream release, vive
 *    release).
 *    cancel: Input is canceled (eg. we scrolled instead of tapping on
 *    mobile/desktop).
 *    pointermove(2D position): The pointer is moved (mouse or touch).
 */
class RayController extends EventEmitter {
  constructor(renderer) {
    super();
    this.renderer = renderer;

    this.availableInteractions = {};

    // Handle interactions.
    window.addEventListener('mousedown', this.onMouseDown_.bind(this));
    window.addEventListener('mousemove', this.onMouseMove_.bind(this));
    window.addEventListener('mouseup', this.onMouseUp_.bind(this));
    window.addEventListener('touchstart', this.onTouchStart_.bind(this));
    window.addEventListener('touchmove', this.onTouchMove_.bind(this));
    window.addEventListener('touchend', this.onTouchEnd_.bind(this));

    // The position of the pointer.
    this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    this.dragDistance = 0;
    // Are we dragging or not.
    this.isDragging = false;

    // Gamepad events.
    this.gamepad = null;
    window.addEventListener('gamepadconnected', this.onGamepadConnected_.bind(this));

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then((displays) => {
        this.vrDisplay = displays[0];
      });
    }
    window.addEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange_.bind(this));
  }

  getInteractionMode() {
    // TODO: Debugging only.
    //return InteractionModes.DAYDREAM;

    var gamepad = this.getVRGamepad_();

    if (gamepad) {
      // If there's a gamepad connected, determine if it's Daydream or a Vive.
      if (gamepad.id == 'Daydream Controller') {
        return InteractionModes.DAYDREAM;
      }

      // TODO: Verify the actual ID.
      if (gamepad.id == 'Vive Controller') {
        return InteractionModes.VIVE;
      }

    } else {
      // If there's no gamepad, it might be Cardboard, magic window or desktop.
      if (isMobile()) {
        // Either Cardboard or magic window, depending on whether we are
        // presenting.
        if (this.vrDisplay && this.vrDisplay.isPresenting) {
          return InteractionModes.CARDBOARD;
        } else {
          return InteractionModes.TOUCH;
        }
      } else {
        // We must be on desktop.
        return InteractionModes.MOUSE;
      }
    }
    // By default, use TOUCH.
    return InteractionModes.TOUCH;
  }

  getGamepadPose() {
    var gamepad = this.getVRGamepad_();
    return gamepad.pose;
  }

  setSize(size) {
    this.size = size;
  }

  update() {
    if (this.getInteractionMode() == InteractionModes.DAYDREAM) {
      // If we're dealing with a gamepad, check every animation frame for a
      // pressed action.
      let isGamepadPressed = this.getGamepadButtonPressed_();
      if (isGamepadPressed && !this.wasGamepadPressed) {
        this.emit('action');
      }
      if (!isGamepadPressed && this.wasGamepadPressed) {
        this.emit('release');
      }
      this.wasGamepadPressed = isGamepadPressed;
    }
  }

  getGamepadButtonPressed_() {
    var gamepad = this.getVRGamepad_();
    if (!gamepad) {
      // If there's no gamepad, the button was not pressed.
      return false;
    }
    // Check for clicks.
    for (var j = 0; j < gamepad.buttons.length; ++j) {
      if (gamepad.buttons[j].pressed) {
        return true;
      }
    }
    return false;
  }

  onMouseDown_(e) {
    this.startDragging_(e);
    this.emit('action');
  }

  onMouseMove_(e) {
    this.updatePointer_(e);
    this.updateDragDistance_();

    this.emit('pointermove', this.pointerNdc);
  }

  onMouseUp_(e) {
    this.endDragging_();
  }

  onTouchStart_(e) {
    var t = e.touches[0];
    this.startDragging_(t);
    this.updateTouchPointer_(e);

    this.emit('pointermove', this.pointerNdc);
    this.emit('action');
  }

  onTouchMove_(e) {
    this.updateTouchPointer_(e);
    this.updateDragDistance_();
  }

  onTouchEnd_(e) {
    this.endDragging_();
  }

  updateTouchPointer_(e) {
    // If there's no touches array, ignore.
    if (e.touches.length === 0) {
      console.warn('Received touch event with no touches.');
      return;
    }
    var t = e.touches[0];
    this.updatePointer_(t);
  }

  updatePointer_(e) {
    // How much the pointer moved.
    this.pointer.set(e.clientX, e.clientY);
    this.pointerNdc.x = (e.clientX / this.size.width) * 2 - 1;
    this.pointerNdc.y = - (e.clientY / this.size.height) * 2 + 1;
  }

  updateDragDistance_() {
    if (this.isDragging) {
      var distance = this.lastPointer.sub(this.pointer).length();
      this.dragDistance += distance;
      this.lastPointer.copy(this.pointer);


      console.log('dragDistance', this.dragDistance);
      if (this.dragDistance > DRAG_DISTANCE_PX) {
        this.emit('cancel');
        this.isDragging = false;
      }
    }
  }

  startDragging_(e) {
    this.isDragging = true;
    this.lastPointer.set(e.clientX, e.clientY);
  }

  endDragging_() {
    if (this.dragDistance < DRAG_DISTANCE_PX) {
      this.emit('release');
    }
    this.dragDistance = 0;
    this.isDragging = false;
  }

  onGamepadConnected_(e) {
    var gamepad = navigator.getGamepads()[e.gamepad.index];
    // TODO: Only care about gamepads that support motion control.
  }

  onVRDisplayPresentChange_(e) {
    console.log('onVRDisplayPresentChange_', e);
  }

  /**
   * Gets the first VR-enabled gamepad.
   */
  getVRGamepad_() {
    var gamepads = navigator.getGamepads();
    for (var i = 0; i < gamepads.length; ++i) {
      var gamepad = gamepads[i];

      // The array may contain undefined gamepads, so check for that as well as
      // a non-null pose.
      if (gamepad && gamepad.pose) {
        return gamepad;
      }
    }
    return null;
  }
}

/**
 * API wrapper for the input library.
 */
class RayInput$1 extends EventEmitter {
  constructor(camera) {
    super();

    this.camera = camera;
    this.renderer = new RayRenderer(camera);
    this.controller = new RayController();

    // Arm model needed to transform controller orientation into proper pose.
    this.armModel = new DaydreamArmModel();

    this.controller.on('action', this.onAction_.bind(this));
    this.controller.on('release', this.onRelease_.bind(this));
    this.controller.on('cancel', this.onCancel_.bind(this));
    this.controller.on('pointermove', this.onPointerMove_.bind(this));
    this.renderer.on('select', (mesh) => { this.emit('select', mesh) });
    this.renderer.on('deselect', (mesh) => { this.emit('deselect', mesh) });

    // By default, put the pointer offscreen
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

    let mode = this.controller.getInteractionMode()
    switch (mode) {
      case InteractionModes.MOUSE:
        // Desktop mouse mode, mouse coordinates are what matters.
        this.renderer.setPointer(this.pointerNdc);
        // TODO: Debug only.
        this.renderer.setRayVisibility(true);
        break;

      case InteractionModes.TOUCH:
        // Mobile magic window mode. Touch coordinates matter, but we want to
        // hide the reticle.
        this.renderer.setPointer(this.pointerNdc);
        this.renderer.setReticleVisibility(false);
        break;

      case InteractionModes.CARDBOARD:
        // Cardboard mode, we're dealing with a gaze reticle.
        this.renderer.setPosition(this.camera.position);
        this.renderer.setOrientation(this.camera.quaternion);
        break;

      case InteractionModes.DAYDREAM:
        // Daydream, our origin is slightly off (depending on handedness).
        // But we should be using the orientation from the gamepad.
        // TODO(smus): Implement the real arm model.
        let pose = this.controller.getGamepadPose();

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
        this.armModel.update();

        // Get resulting pose and configure the renderer.
        let modelPose = this.armModel.getPose();
        this.renderer.setPosition(modelPose.position);
        //this.renderer.setPosition(new THREE.Vector3());
        this.renderer.setOrientation(modelPose.orientation);
        //this.renderer.setOrientation(controllerOrientation);

        // Make the ray and controller visible.
        this.renderer.setRayVisibility(true);
        break;

      case InteractionModes.VIVE:
        // Vive, origin depends on the position of the controller.
        // TODO(smus)...

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

  onAction_(e) {
    console.log('onAction_');
    this.fireActiveMeshEvent_('onAction');

    let mesh = this.renderer.getSelectedMesh();
    this.emit('action', mesh);

    this.renderer.setActive(true);
  }

  onRelease_(e) {
    console.log('onRelease_');
    this.fireActiveMeshEvent_('onRelease');

    let mesh = this.renderer.getSelectedMesh();
    this.emit('release', mesh);

    this.renderer.setActive(false);
  }

  onCancel_(e) {
    console.log('onCancel_');
    let mesh = this.renderer.getSelectedMesh();
    this.emit('cancel', mesh);
  }

  fireActiveMeshEvent_(eventName) {
    let mesh = this.renderer.getSelectedMesh();
    if (!mesh) {
      //console.info('No mesh selected.');
      return;
    }
    let handlers = this.handlers[mesh.id];
    if (!handlers) {
      //console.info('No handlers for mesh with id %s.', mesh.id);
      return;
    }
    if (!handlers[eventName]) {
      //console.info('No handler named %s for mesh.', eventName);
      return;
    }
    handlers[eventName](mesh);
  }

  onPointerMove_(ndc) {
    this.pointerNdc.copy(ndc);
  }
}

/*
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RayInput;
}
*/

module.exports = RayInput$1;