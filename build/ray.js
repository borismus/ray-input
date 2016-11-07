(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RayInput = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var HEAD_ELBOW_OFFSET = new THREE.Vector3(0.155, -0.465, -0.15);
var ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
var WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
var ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

var ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
var EXTENSION_RATIO_WEIGHT = 0.4;

var MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */

var OrientationArmModel = function () {
  function OrientationArmModel() {
    _classCallCheck(this, OrientationArmModel);

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


  _createClass(OrientationArmModel, [{
    key: 'setControllerOrientation',
    value: function setControllerOrientation(quaternion) {
      this.lastControllerQ.copy(this.controllerQ);
      this.controllerQ.copy(quaternion);
    }
  }, {
    key: 'setHeadOrientation',
    value: function setHeadOrientation(quaternion) {
      this.headQ.copy(quaternion);
    }
  }, {
    key: 'setHeadPosition',
    value: function setHeadPosition(position) {
      this.headPos.copy(position);
    }
  }, {
    key: 'setLeftHanded',
    value: function setLeftHanded(isLeftHanded) {
      // TODO(smus): Implement me!
      this.isLeftHanded = isLeftHanded;
    }

    /**
     * Called on a RAF.
     */

  }, {
    key: 'update',
    value: function update() {
      this.time = performance.now();

      // If the controller's angular velocity is above a certain amount, we can
      // assume torso rotation and move the elbow joint relative to the
      // camera orientation.
      var headYawQ = this.getHeadYawOrientation_();
      var timeDelta = (this.time - this.lastTime) / 1000;
      var angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
      var controllerAngularSpeed = angleDelta / timeDelta;
      if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
        // Attenuate the Root rotation slightly.
        this.rootQ.slerp(headYawQ, angleDelta / 10);
      } else {
        this.rootQ.copy(headYawQ);
      }

      // We want to move the elbow up and to the center as the user points the
      // controller upwards, so that they can easily see the controller and its
      // tool tips.
      var controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
      var controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
      var extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

      // Controller orientation in camera space.
      var controllerCameraQ = this.rootQ.clone().inverse();
      controllerCameraQ.multiply(this.controllerQ);

      // Calculate elbow position.
      var elbowPos = this.elbowPos;
      elbowPos.copy(this.headPos).add(HEAD_ELBOW_OFFSET);
      var elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      elbowOffset.multiplyScalar(extensionRatio);
      elbowPos.add(elbowOffset);

      // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
      // to wrist, but if controller is raised higher, more rotation comes from
      // the wrist.
      var totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
      var totalAngleDeg = THREE.Math.radToDeg(totalAngle);
      var lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

      var elbowRatio = ELBOW_BEND_RATIO;
      var wristRatio = 1 - ELBOW_BEND_RATIO;
      var lerpValue = lerpSuppression * (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

      var wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
      var invWristQ = wristQ.inverse();
      var elbowQ = controllerCameraQ.clone().multiply(invWristQ);

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
      var wristPos = this.wristPos;
      wristPos.copy(WRIST_CONTROLLER_OFFSET);
      wristPos.applyQuaternion(wristQ);
      wristPos.add(ELBOW_WRIST_OFFSET);
      wristPos.applyQuaternion(elbowQ);
      wristPos.add(this.elbowPos);

      var offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      offset.multiplyScalar(extensionRatio);

      var position = new THREE.Vector3().copy(this.wristPos);
      position.add(offset);
      position.applyQuaternion(this.rootQ);

      var orientation = new THREE.Quaternion().copy(this.controllerQ);

      // Set the resulting pose orientation and position.
      this.pose.orientation.copy(orientation);
      this.pose.position.copy(position);

      this.lastTime = this.time;
    }

    /**
     * Returns the pose calculated by the model.
     */

  }, {
    key: 'getPose',
    value: function getPose() {
      return this.pose;
    }

    /**
     * Debug methods for rendering the arm model.
     */

  }, {
    key: 'getForearmLength',
    value: function getForearmLength() {
      return ELBOW_WRIST_OFFSET.length();
    }
  }, {
    key: 'getElbowPosition',
    value: function getElbowPosition() {
      var out = this.elbowPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getWristPosition',
    value: function getWristPosition() {
      var out = this.wristPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getHeadYawOrientation_',
    value: function getHeadYawOrientation_() {
      var headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
      headEuler.x = 0;
      headEuler.z = 0;
      var destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
      return destinationQ;
    }
  }, {
    key: 'clamp_',
    value: function clamp_(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  }, {
    key: 'quatAngle_',
    value: function quatAngle_(q1, q2) {
      var vec1 = new THREE.Vector3(0, 0, -1);
      var vec2 = new THREE.Vector3(0, 0, -1);
      vec1.applyQuaternion(q1);
      vec2.applyQuaternion(q2);
      return vec1.angleTo(vec2);
    }
  }]);

  return OrientationArmModel;
}();

exports.default = OrientationArmModel;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

var DRAG_DISTANCE_PX = 10;

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

var RayController = function (_EventEmitter) {
  _inherits(RayController, _EventEmitter);

  function RayController(renderer) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    _this.renderer = renderer;

    _this.availableInteractions = {};

    // Handle interactions.
    window.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    window.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    window.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    window.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    window.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    window.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

    // The position of the pointer.
    _this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    _this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    _this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    _this.dragDistance = 0;
    // Are we dragging or not.
    _this.isDragging = false;
    // Is pointer active or not.
    _this.isTouchActive = false;

    // Gamepad events.
    _this.gamepad = null;

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then(function (displays) {
        _this.vrDisplay = displays[0];
      });
    }
    return _this;
  }

  _createClass(RayController, [{
    key: 'getInteractionMode',
    value: function getInteractionMode() {
      // TODO: Debugging only.
      //return InteractionModes.DAYDREAM;

      var gamepad = this.getVRGamepad_();

      if (gamepad) {
        var pose = gamepad.pose;
        // If there's a gamepad connected, determine if it's Daydream or a Vive.
        if (pose.hasPosition) {
          return _rayInteractionModes2.default.VR_6DOF;
        }

        if (pose.hasOrientation) {
          return _rayInteractionModes2.default.VR_3DOF;
        }
      } else {
        // If there's no gamepad, it might be Cardboard, magic window or desktop.
        if ((0, _util.isMobile)()) {
          // Either Cardboard or magic window, depending on whether we are
          // presenting.
          if (this.vrDisplay && this.vrDisplay.isPresenting) {
            return _rayInteractionModes2.default.VR_0DOF;
          } else {
            return _rayInteractionModes2.default.TOUCH;
          }
        } else {
          // We must be on desktop.
          return _rayInteractionModes2.default.MOUSE;
        }
      }
      // By default, use TOUCH.
      return _rayInteractionModes2.default.TOUCH;
    }
  }, {
    key: 'getGamepadPose',
    value: function getGamepadPose() {
      var gamepad = this.getVRGamepad_();
      return gamepad.pose;
    }

    /**
     * Get if there is an active touch event going on.
     * Only relevant on touch devices
     */

  }, {
    key: 'getIsTouchActive',
    value: function getIsTouchActive() {
      return this.isTouchActive;
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.size = size;
    }
  }, {
    key: 'update',
    value: function update() {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF || mode == _rayInteractionModes2.default.VR_6DOF) {
        // If we're dealing with a gamepad, check every animation frame for a
        // pressed action.
        var isGamepadPressed = this.getGamepadButtonPressed_();
        if (isGamepadPressed && !this.wasGamepadPressed) {
          this.emit('raydown');
        }
        if (!isGamepadPressed && this.wasGamepadPressed) {
          this.emit('rayup');
        }
        this.wasGamepadPressed = isGamepadPressed;
      }
    }
  }, {
    key: 'getGamepadButtonPressed_',
    value: function getGamepadButtonPressed_() {
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
  }, {
    key: 'onMouseDown_',
    value: function onMouseDown_(e) {
      this.startDragging_(e);
      this.emit('raydown');
    }
  }, {
    key: 'onMouseMove_',
    value: function onMouseMove_(e) {
      this.updatePointer_(e);
      this.updateDragDistance_();
      this.emit('pointermove', this.pointerNdc);
    }
  }, {
    key: 'onMouseUp_',
    value: function onMouseUp_(e) {
      this.endDragging_();
    }
  }, {
    key: 'onTouchStart_',
    value: function onTouchStart_(e) {
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

      this.isTouchActive = true;
      this.emit('pointermove', this.pointerNdc);
      this.emit('raydown');

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
    }
  }, {
    key: 'onTouchMove_',
    value: function onTouchMove_(e) {
      this.updateTouchPointer_(e);
      this.updateDragDistance_();

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
    }
  }, {
    key: 'onTouchEnd_',
    value: function onTouchEnd_(e) {
      this.isTouchActive = false;
      this.endDragging_();

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
    }
  }, {
    key: 'updateTouchPointer_',
    value: function updateTouchPointer_(e) {
      // If there's no touches array, ignore.
      if (e.touches.length === 0) {
        console.warn('Received touch event with no touches.');
        return;
      }
      var t = e.touches[0];
      this.updatePointer_(t);
    }
  }, {
    key: 'updatePointer_',
    value: function updatePointer_(e) {
      // How much the pointer moved.
      this.pointer.set(e.clientX, e.clientY);
      this.pointerNdc.x = e.clientX / this.size.width * 2 - 1;
      this.pointerNdc.y = -(e.clientY / this.size.height) * 2 + 1;
    }
  }, {
    key: 'updateDragDistance_',
    value: function updateDragDistance_() {
      if (this.isDragging) {
        var distance = this.lastPointer.sub(this.pointer).length();
        this.dragDistance += distance;
        this.lastPointer.copy(this.pointer);

        //console.log('dragDistance', this.dragDistance);
        if (this.dragDistance > DRAG_DISTANCE_PX) {
          this.emit('raycancel');
          this.isDragging = false;
        }
      }
    }
  }, {
    key: 'startDragging_',
    value: function startDragging_(e) {
      this.isDragging = true;
      this.lastPointer.set(e.clientX, e.clientY);
    }
  }, {
    key: 'endDragging_',
    value: function endDragging_() {
      if (this.dragDistance < DRAG_DISTANCE_PX) {
        this.emit('rayup');
      }
      this.dragDistance = 0;
      this.isDragging = false;
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'getVRGamepad_',
    value: function getVRGamepad_() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

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
  }]);

  return RayController;
}(_eventemitter2.default);

exports.default = RayController;

},{"./ray-interaction-modes":5,"./util":7,"eventemitter3":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _orientationArmModel = require('./orientation-arm-model');

var _orientationArmModel2 = _interopRequireDefault(_orientationArmModel);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayRenderer = require('./ray-renderer');

var _rayRenderer2 = _interopRequireDefault(_rayRenderer);

var _rayController = require('./ray-controller');

var _rayController2 = _interopRequireDefault(_rayController);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

/**
 * API wrapper for the input library.
 */
var RayInput = function (_EventEmitter) {
  _inherits(RayInput, _EventEmitter);

  function RayInput(camera) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default();

    // Arm model needed to transform controller orientation into proper pose.
    _this.armModel = new _orientationArmModel2.default();

    _this.controller.on('raydown', _this.onRayDown_.bind(_this));
    _this.controller.on('rayup', _this.onRayUp_.bind(_this));
    _this.controller.on('raycancel', _this.onRayCancel_.bind(_this));
    _this.controller.on('pointermove', _this.onPointerMove_.bind(_this));
    _this.renderer.on('rayover', function (mesh) {
      _this.emit('rayover', mesh);
    });
    _this.renderer.on('rayout', function (mesh) {
      _this.emit('rayout', mesh);
    });

    // By default, put the pointer offscreen.
    _this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    _this.handlers = {};
    return _this;
  }

  _createClass(RayInput, [{
    key: 'add',
    value: function add(object, handlers) {
      this.renderer.add(object, handlers);
      this.handlers[object.id] = handlers;
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      this.renderer.remove(object);
      delete this.handlers[object.id];
    }
  }, {
    key: 'update',
    value: function update() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);

      var mode = this.controller.getInteractionMode();
      switch (mode) {
        case _rayInteractionModes2.default.MOUSE:
          // Desktop mouse mode, mouse coordinates are what matters.
          this.renderer.setPointer(this.pointerNdc);
          // Hide the ray and reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In mouse mode ray renderer is always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.TOUCH:
          // Mobile magic window mode. Touch coordinates matter, but we want to
          // hide the reticle.
          this.renderer.setPointer(this.pointerNdc);

          // Hide the ray and the reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In touch mode the ray renderer is only active on touch.
          this.renderer.setActive(this.controller.getIsTouchActive());
          break;

        case _rayInteractionModes2.default.VR_0DOF:
          // Cardboard mode, we're dealing with a gaze reticle.
          this.renderer.setPosition(this.camera.position);
          this.renderer.setOrientation(this.camera.quaternion);

          // Reticle only.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_3DOF:
          // Daydream, our origin is slightly off (depending on handedness).
          // But we should be using the orientation from the gamepad.
          // TODO(smus): Implement the real arm model.
          var pose = this.controller.getGamepadPose();

          // Debug only: use camera as input controller.
          //let controllerOrientation = this.camera.quaternion;
          var controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

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
          var modelPose = this.armModel.getPose();
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

        case _rayInteractionModes2.default.VR_6DOF:
          // Vive, origin depends on the position of the controller.
          // TODO(smus)...
          var pose = this.controller.getGamepadPose();

          // Check that the pose is valid.
          if (!pose.orientation || !pose.position) {
            console.warn('Invalid gamepad pose. Can\'t update ray.');
            break;
          }
          var orientation = new THREE.Quaternion().fromArray(pose.orientation);
          var position = new THREE.Vector3().fromArray(pose.position);

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
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.controller.setSize(size);
    }
  }, {
    key: 'getMesh',
    value: function getMesh() {
      return this.renderer.getReticleRayMesh();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.renderer.getOrigin();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.renderer.getDirection();
    }
  }, {
    key: 'getRightDirection',
    value: function getRightDirection() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);
      return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
    }
  }, {
    key: 'onRayDown_',
    value: function onRayDown_(e) {
      //console.log('onRayDown_');
      this.fireActiveMeshEvent_('onAction');

      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      this.fireActiveMeshEvent_('onRelease');

      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raycancel', mesh);
    }
  }, {
    key: 'fireActiveMeshEvent_',
    value: function fireActiveMeshEvent_(eventName) {
      var mesh = this.renderer.getSelectedMesh();
      if (!mesh) {
        //console.info('No mesh selected.');
        return;
      }
      var handlers = this.handlers[mesh.id];
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
  }, {
    key: 'onPointerMove_',
    value: function onPointerMove_(ndc) {
      this.pointerNdc.copy(ndc);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":2,"./ray-controller":3,"./ray-interaction-modes":5,"./ray-renderer":6,"eventemitter3":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  VR_0DOF: 3,
  VR_3DOF: 4,
  VR_6DOF: 5
};

exports.default = InteractionModes;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

var RETICLE_DISTANCE = 3;
var INNER_RADIUS = 0.02;
var OUTER_RADIUS = 0.04;
var RAY_RADIUS = 0.02;
var GRADIENT_IMAGE = (0, _util.base64)('image/png', 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3WwXHEQAwDQcin/FOWw+BjuiPYB2q4G2nP933P9SO4824zgDADiDOAuHfb3/UjuKMAcQYQZwBx/gBxChCnAHEKEKcAcQoQpwBxChCnAHEGEGcAcf4AcQoQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHHvtt/1I7ijAHEGEGcAcf4AcQoQZwBxTkCcAsQZQJwTEKcAcQoQpwBxBhDnBMQpQJwCxClAnALEKUCcAsQpQJwCxClAnALEKUCcAsQpQJwBxDkBcQoQpwBxChCnAHEKEKcAcQoQpwBxChCnAHEKEGcAcU5AnALEKUCcAsQZQJwTEKcAcQYQ5wTEKUCcAcQZQJw/QJwCxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUDcu+25fgR3FCDOAOIMIM4fIE4B4hQgTgHiFCBOAeIUIE4B4hQgzgDiDCDOHyBOAeIMIM4A4v4B/5IF9eD6QxgAAAAASUVORK5CYII=');

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

var RayRenderer = function (_EventEmitter) {
  _inherits(RayRenderer, _EventEmitter);

  function RayRenderer(camera, opt_params) {
    _classCallCheck(this, RayRenderer);

    var _this = _possibleConstructorReturn(this, (RayRenderer.__proto__ || Object.getPrototypeOf(RayRenderer)).call(this));

    _this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    _this.meshes = {};

    // Which objects are currently selected (keyed on id).
    _this.selected = {};

    // The raycaster.
    _this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    _this.position = new THREE.Vector3();
    _this.orientation = new THREE.Quaternion();

    _this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    _this.reticle = _this.createReticle_();
    _this.root.add(_this.reticle);

    // Add the ray to the root of the object.
    _this.ray = _this.createRay_();
    _this.root.add(_this.ray);

    // How far the reticle is currently from the reticle origin.
    _this.reticleDistance = RETICLE_DISTANCE;
    return _this;
  }

  /**
   * Register an object so that it can be interacted with.
   */


  _createClass(RayRenderer, [{
    key: 'add',
    value: function add(object) {
      this.meshes[object.id] = object;
    }

    /**
     * Prevent an object from being interacted with.
     */

  }, {
    key: 'remove',
    value: function remove(object) {
      var id = object.id;
      if (!this.meshes[id]) {
        // If there's no existing mesh, we can't remove it.
        delete this.meshes[id];
      }
      // If the object is currently selected, remove it.
      if (this.selected[id]) {
        delete this.selected[object.id];
      }
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.isActive) {
        // Do the raycasting and issue various events as needed.
        for (var id in this.meshes) {
          var mesh = this.meshes[id];
          var intersects = this.raycaster.intersectObject(mesh, true);
          if (intersects.length > 1) {
            console.warn('Unexpected: multiple meshes intersected.');
          }
          var isIntersected = intersects.length > 0;
          var isSelected = this.selected[id];

          // If it's newly selected, send rayover.
          if (isIntersected && !isSelected) {
            this.selected[id] = true;
            this.emit('rayover', mesh);
          }

          // If it's no longer intersected, send rayout.
          if (!isIntersected && isSelected) {
            delete this.selected[id];
            this.moveReticle_(null);
            this.emit('rayout', mesh);
          }

          if (isIntersected) {
            this.moveReticle_(intersects);
          }
        }
      } else {
        // Ray not active, rayout selected meshes.
        for (var _id in this.selected) {
          var _mesh = this.meshes[_id];

          delete this.selected[_id];
          this.moveReticle_(null);
          this.emit('rayout', _mesh);
        }
      }
    }

    /**
     * Sets the origin of the ray.
     * @param {Vector} vector Position of the origin of the picking ray.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(vector) {
      this.position.copy(vector);
      this.raycaster.ray.origin.copy(vector);
      this.updateRaycaster_();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.raycaster.ray.origin;
    }

    /**
     * Sets the direction of the ray.
     * @param {Vector} vector Unit vector corresponding to direction.
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(quaternion) {
      this.orientation.copy(quaternion);

      var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      this.raycaster.ray.direction.copy(pointAt);
      this.updateRaycaster_();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.raycaster.ray.direction;
    }

    /**
     * Sets the pointer on the screen for camera + pointer based picking. This
     * superscedes origin and direction.
     *
     * @param {Vector2} vector The position of the pointer (screen coords).
     */

  }, {
    key: 'setPointer',
    value: function setPointer(vector) {
      this.raycaster.setFromCamera(vector, this.camera);
      this.updateRaycaster_();
    }

    /**
     * Gets the mesh, which includes reticle and/or ray. This mesh is then added
     * to the scene.
     */

  }, {
    key: 'getReticleRayMesh',
    value: function getReticleRayMesh() {
      return this.root;
    }

    /**
     * Gets the currently selected object in the scene.
     */

  }, {
    key: 'getSelectedMesh',
    value: function getSelectedMesh() {
      var count = 0;
      var mesh = null;
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

  }, {
    key: 'setReticleVisibility',
    value: function setReticleVisibility(isVisible) {
      this.reticle.visible = isVisible;
    }

    /**
     * Enables or disables the raycasting ray which gradually fades out from
     * the origin.
     */

  }, {
    key: 'setRayVisibility',
    value: function setRayVisibility(isVisible) {
      this.ray.visible = isVisible;
    }

    /**
     * Sets whether or not there is currently action.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;
    }
  }, {
    key: 'updateRaycaster_',
    value: function updateRaycaster_() {
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

  }, {
    key: 'createReticle_',
    value: function createReticle_() {
      // Create a spherical reticle.
      var innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
      var innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);

      var outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
      var outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);

      var reticle = new THREE.Group();
      reticle.add(inner);
      reticle.add(outer);
      return reticle;
    }

    /**
     * Moves the reticle to a position so that it's just in front of the mesh that
     * it intersected with.
     */

  }, {
    key: 'moveReticle_',
    value: function moveReticle_(intersections) {
      // If no intersection, return the reticle to the default position.
      var distance = RETICLE_DISTANCE;
      if (intersections) {
        // Otherwise, determine the correct distance.
        var inter = intersections[0];
        distance = inter.distance;
      }

      this.reticleDistance = distance;
      this.updateRaycaster_();
      return;
    }
  }, {
    key: 'createRay_',
    value: function createRay_() {
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
  }]);

  return RayRenderer;
}(_eventemitter2.default);

exports.default = RayRenderer;

},{"./util":7,"eventemitter3":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMobile = isMobile;
exports.base64 = base64;
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

function isMobile() {
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvb3JpZW50YXRpb24tYXJtLW1vZGVsLmpzIiwic3JjL3JheS1jb250cm9sbGVyLmpzIiwic3JjL3JheS1pbnB1dC5qcyIsInNyYy9yYXktaW50ZXJhY3Rpb24tbW9kZXMuanMiLCJzcmMvcmF5LXJlbmRlcmVyLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqU0E7Ozs7Ozs7Ozs7Ozs7OztBQWVB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LFNBQU8sS0FBUDtBQUNEOztBQUVNLFNBQVMsTUFBVCxDQUFnQixRQUFoQixFQUEwQixNQUExQixFQUFrQztBQUN2QyxTQUFPLFVBQVUsUUFBVixHQUFxQixVQUFyQixHQUFrQyxNQUF6QztBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuY29uc3QgSEVBRF9FTEJPV19PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLjE1NSwgLTAuNDY1LCAtMC4xNSk7XG5jb25zdCBFTEJPV19XUklTVF9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMC4yNSk7XG5jb25zdCBXUklTVF9DT05UUk9MTEVSX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDAuMDUpO1xuY29uc3QgQVJNX0VYVEVOU0lPTl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC4wOCwgMC4xNCwgMC4wOCk7XG5cbmNvbnN0IEVMQk9XX0JFTkRfUkFUSU8gPSAwLjQ7IC8vIDQwJSBlbGJvdywgNjAlIHdyaXN0LlxuY29uc3QgRVhURU5TSU9OX1JBVElPX1dFSUdIVCA9IDAuNDtcblxuY29uc3QgTUlOX0FOR1VMQVJfU1BFRUQgPSAwLjYxOyAvLyAzNSBkZWdyZWVzIHBlciBzZWNvbmQgKGluIHJhZGlhbnMpLlxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGFybSBtb2RlbCBmb3IgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIuIEZlZWQgaXQgYSBjYW1lcmEgYW5kXG4gKiB0aGUgY29udHJvbGxlci4gVXBkYXRlIGl0IG9uIGEgUkFGLlxuICpcbiAqIEdldCB0aGUgbW9kZWwncyBwb3NlIHVzaW5nIGdldFBvc2UoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JpZW50YXRpb25Bcm1Nb2RlbCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gZmFsc2U7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBjb250cm9sbGVyIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmNvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBoZWFkIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmhlYWRRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgaGVhZCBwb3NpdGlvbi5cbiAgICB0aGlzLmhlYWRQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gUG9zaXRpb25zIG9mIG90aGVyIGpvaW50cyAobW9zdGx5IGZvciBkZWJ1Z2dpbmcpLlxuICAgIHRoaXMuZWxib3dQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHRoaXMud3Jpc3RQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgdGltZXMgdGhlIG1vZGVsIHdhcyB1cGRhdGVkLlxuICAgIHRoaXMudGltZSA9IG51bGw7XG4gICAgdGhpcy5sYXN0VGltZSA9IG51bGw7XG5cbiAgICAvLyBSb290IHJvdGF0aW9uLlxuICAgIHRoaXMucm9vdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBwb3NlIHRoYXQgdGhpcyBhcm0gbW9kZWwgY2FsY3VsYXRlcy5cbiAgICB0aGlzLnBvc2UgPSB7XG4gICAgICBvcmllbnRhdGlvbjogbmV3IFRIUkVFLlF1YXRlcm5pb24oKSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2RzIHRvIHNldCBjb250cm9sbGVyIGFuZCBoZWFkIHBvc2UgKGluIHdvcmxkIGNvb3JkaW5hdGVzKS5cbiAgICovXG4gIHNldENvbnRyb2xsZXJPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICB0aGlzLmNvbnRyb2xsZXJRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMuaGVhZFEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRQb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMuaGVhZFBvcy5jb3B5KHBvc2l0aW9uKTtcbiAgfVxuXG4gIHNldExlZnRIYW5kZWQoaXNMZWZ0SGFuZGVkKSB7XG4gICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IG1lIVxuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gaXNMZWZ0SGFuZGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBvbiBhIFJBRi5cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIElmIHRoZSBjb250cm9sbGVyJ3MgYW5ndWxhciB2ZWxvY2l0eSBpcyBhYm92ZSBhIGNlcnRhaW4gYW1vdW50LCB3ZSBjYW5cbiAgICAvLyBhc3N1bWUgdG9yc28gcm90YXRpb24gYW5kIG1vdmUgdGhlIGVsYm93IGpvaW50IHJlbGF0aXZlIHRvIHRoZVxuICAgIC8vIGNhbWVyYSBvcmllbnRhdGlvbi5cbiAgICBsZXQgaGVhZFlhd1EgPSB0aGlzLmdldEhlYWRZYXdPcmllbnRhdGlvbl8oKTtcbiAgICBsZXQgdGltZURlbHRhID0gKHRoaXMudGltZSAtIHRoaXMubGFzdFRpbWUpIC8gMTAwMDtcbiAgICBsZXQgYW5nbGVEZWx0YSA9IHRoaXMucXVhdEFuZ2xlXyh0aGlzLmxhc3RDb250cm9sbGVyUSwgdGhpcy5jb250cm9sbGVyUSk7XG4gICAgbGV0IGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPSBhbmdsZURlbHRhIC8gdGltZURlbHRhO1xuICAgIGlmIChjb250cm9sbGVyQW5ndWxhclNwZWVkID4gTUlOX0FOR1VMQVJfU1BFRUQpIHtcbiAgICAgIC8vIEF0dGVudWF0ZSB0aGUgUm9vdCByb3RhdGlvbiBzbGlnaHRseS5cbiAgICAgIHRoaXMucm9vdFEuc2xlcnAoaGVhZFlhd1EsIGFuZ2xlRGVsdGEgLyAxMClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yb290US5jb3B5KGhlYWRZYXdRKTtcbiAgICB9XG5cbiAgICAvLyBXZSB3YW50IHRvIG1vdmUgdGhlIGVsYm93IHVwIGFuZCB0byB0aGUgY2VudGVyIGFzIHRoZSB1c2VyIHBvaW50cyB0aGVcbiAgICAvLyBjb250cm9sbGVyIHVwd2FyZHMsIHNvIHRoYXQgdGhleSBjYW4gZWFzaWx5IHNlZSB0aGUgY29udHJvbGxlciBhbmQgaXRzXG4gICAgLy8gdG9vbCB0aXBzLlxuICAgIGxldCBjb250cm9sbGVyRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmNvbnRyb2xsZXJRLCAnWVhaJyk7XG4gICAgbGV0IGNvbnRyb2xsZXJYRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyhjb250cm9sbGVyRXVsZXIueCk7XG4gICAgbGV0IGV4dGVuc2lvblJhdGlvID0gdGhpcy5jbGFtcF8oKGNvbnRyb2xsZXJYRGVnIC0gMTEpIC8gKDUwIC0gMTEpLCAwLCAxKTtcblxuICAgIC8vIENvbnRyb2xsZXIgb3JpZW50YXRpb24gaW4gY2FtZXJhIHNwYWNlLlxuICAgIGxldCBjb250cm9sbGVyQ2FtZXJhUSA9IHRoaXMucm9vdFEuY2xvbmUoKS5pbnZlcnNlKCk7XG4gICAgY29udHJvbGxlckNhbWVyYVEubXVsdGlwbHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxib3cgcG9zaXRpb24uXG4gICAgbGV0IGVsYm93UG9zID0gdGhpcy5lbGJvd1BvcztcbiAgICBlbGJvd1Bvcy5jb3B5KHRoaXMuaGVhZFBvcykuYWRkKEhFQURfRUxCT1dfT0ZGU0VUKTtcbiAgICBsZXQgZWxib3dPZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoQVJNX0VYVEVOU0lPTl9PRkZTRVQpO1xuICAgIGVsYm93T2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcbiAgICBlbGJvd1Bvcy5hZGQoZWxib3dPZmZzZXQpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGpvaW50IGFuZ2xlcy4gR2VuZXJhbGx5IDQwJSBvZiByb3RhdGlvbiBhcHBsaWVkIHRvIGVsYm93LCA2MCVcbiAgICAvLyB0byB3cmlzdCwgYnV0IGlmIGNvbnRyb2xsZXIgaXMgcmFpc2VkIGhpZ2hlciwgbW9yZSByb3RhdGlvbiBjb21lcyBmcm9tXG4gICAgLy8gdGhlIHdyaXN0LlxuICAgIGxldCB0b3RhbEFuZ2xlID0gdGhpcy5xdWF0QW5nbGVfKGNvbnRyb2xsZXJDYW1lcmFRLCBuZXcgVEhSRUUuUXVhdGVybmlvbigpKTtcbiAgICBsZXQgdG90YWxBbmdsZURlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcodG90YWxBbmdsZSk7XG4gICAgbGV0IGxlcnBTdXBwcmVzc2lvbiA9IDEgLSBNYXRoLnBvdyh0b3RhbEFuZ2xlRGVnIC8gMTgwLCA0KTsgLy8gVE9ETyhzbXVzKTogPz8/XG5cbiAgICBsZXQgZWxib3dSYXRpbyA9IEVMQk9XX0JFTkRfUkFUSU87XG4gICAgbGV0IHdyaXN0UmF0aW8gPSAxIC0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgbGVycFZhbHVlID0gbGVycFN1cHByZXNzaW9uICpcbiAgICAgICAgKGVsYm93UmF0aW8gKyB3cmlzdFJhdGlvICogZXh0ZW5zaW9uUmF0aW8gKiBFWFRFTlNJT05fUkFUSU9fV0VJR0hUKTtcblxuICAgIGxldCB3cmlzdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNsZXJwKGNvbnRyb2xsZXJDYW1lcmFRLCBsZXJwVmFsdWUpO1xuICAgIGxldCBpbnZXcmlzdFEgPSB3cmlzdFEuaW52ZXJzZSgpO1xuICAgIGxldCBlbGJvd1EgPSBjb250cm9sbGVyQ2FtZXJhUS5jbG9uZSgpLm11bHRpcGx5KGludldyaXN0USk7XG5cbiAgICAvLyBDYWxjdWxhdGUgb3VyIGZpbmFsIGNvbnRyb2xsZXIgcG9zaXRpb24gYmFzZWQgb24gYWxsIG91ciBqb2ludCByb3RhdGlvbnNcbiAgICAvLyBhbmQgbGVuZ3Rocy5cbiAgICAvKlxuICAgIHBvc2l0aW9uXyA9XG4gICAgICByb290X3JvdF8gKiAoXG4gICAgICAgIGNvbnRyb2xsZXJfcm9vdF9vZmZzZXRfICtcbjI6ICAgICAgKGFybV9leHRlbnNpb25fICogYW10X2V4dGVuc2lvbikgK1xuMTogICAgICBlbGJvd19yb3QgKiAoa0NvbnRyb2xsZXJGb3JlYXJtICsgKHdyaXN0X3JvdCAqIGtDb250cm9sbGVyUG9zaXRpb24pKVxuICAgICAgKTtcbiAgICAqL1xuICAgIGxldCB3cmlzdFBvcyA9IHRoaXMud3Jpc3RQb3M7XG4gICAgd3Jpc3RQb3MuY29weShXUklTVF9DT05UUk9MTEVSX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKHdyaXN0USk7XG4gICAgd3Jpc3RQb3MuYWRkKEVMQk9XX1dSSVNUX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKGVsYm93USk7XG4gICAgd3Jpc3RQb3MuYWRkKHRoaXMuZWxib3dQb3MpO1xuXG4gICAgbGV0IG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgb2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcblxuICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weSh0aGlzLndyaXN0UG9zKTtcbiAgICBwb3NpdGlvbi5hZGQob2Zmc2V0KTtcbiAgICBwb3NpdGlvbi5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG5cbiAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBTZXQgdGhlIHJlc3VsdGluZyBwb3NlIG9yaWVudGF0aW9uIGFuZCBwb3NpdGlvbi5cbiAgICB0aGlzLnBvc2Uub3JpZW50YXRpb24uY29weShvcmllbnRhdGlvbik7XG4gICAgdGhpcy5wb3NlLnBvc2l0aW9uLmNvcHkocG9zaXRpb24pO1xuXG4gICAgdGhpcy5sYXN0VGltZSA9IHRoaXMudGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwb3NlIGNhbGN1bGF0ZWQgYnkgdGhlIG1vZGVsLlxuICAgKi9cbiAgZ2V0UG9zZSgpIHtcbiAgICByZXR1cm4gdGhpcy5wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlYnVnIG1ldGhvZHMgZm9yIHJlbmRlcmluZyB0aGUgYXJtIG1vZGVsLlxuICAgKi9cbiAgZ2V0Rm9yZWFybUxlbmd0aCgpIHtcbiAgICByZXR1cm4gRUxCT1dfV1JJU1RfT0ZGU0VULmxlbmd0aCgpO1xuICB9XG5cbiAgZ2V0RWxib3dQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy5lbGJvd1Bvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0V3Jpc3RQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy53cmlzdFBvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpIHtcbiAgICBsZXQgaGVhZEV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5oZWFkUSwgJ1lYWicpO1xuICAgIGhlYWRFdWxlci54ID0gMDtcbiAgICBoZWFkRXVsZXIueiA9IDA7XG4gICAgbGV0IGRlc3RpbmF0aW9uUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKGhlYWRFdWxlcik7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uUTtcbiAgfVxuXG4gIGNsYW1wXyh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgodmFsdWUsIG1pbiksIG1heCk7XG4gIH1cblxuICBxdWF0QW5nbGVfKHExLCBxMikge1xuICAgIGxldCB2ZWMxID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxldCB2ZWMyID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIHZlYzEuYXBwbHlRdWF0ZXJuaW9uKHExKTtcbiAgICB2ZWMyLmFwcGx5UXVhdGVybmlvbihxMik7XG4gICAgcmV0dXJuIHZlYzEuYW5nbGVUbyh2ZWMyKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5pbXBvcnQge2lzTW9iaWxlfSBmcm9tICcuL3V0aWwnXG5cbmNvbnN0IERSQUdfRElTVEFOQ0VfUFggPSAxMDtcblxuLyoqXG4gKiBFbnVtZXJhdGVzIGFsbCBwb3NzaWJsZSBpbnRlcmFjdGlvbiBtb2Rlcy4gU2V0cyB1cCBhbGwgZXZlbnQgaGFuZGxlcnMgKG1vdXNlLFxuICogdG91Y2gsIGV0YyksIGludGVyZmFjZXMgd2l0aCBnYW1lcGFkIEFQSS5cbiAqXG4gKiBFbWl0cyBldmVudHM6XG4gKiAgICBhY3Rpb246IElucHV0IGlzIGFjdGl2YXRlZCAobW91c2Vkb3duLCB0b3VjaHN0YXJ0LCBkYXlkcmVhbSBjbGljaywgdml2ZVxuICogICAgdHJpZ2dlcikuXG4gKiAgICByZWxlYXNlOiBJbnB1dCBpcyBkZWFjdGl2YXRlZCAobW91c2V1cCwgdG91Y2hlbmQsIGRheWRyZWFtIHJlbGVhc2UsIHZpdmVcbiAqICAgIHJlbGVhc2UpLlxuICogICAgY2FuY2VsOiBJbnB1dCBpcyBjYW5jZWxlZCAoZWcuIHdlIHNjcm9sbGVkIGluc3RlYWQgb2YgdGFwcGluZyBvblxuICogICAgbW9iaWxlL2Rlc2t0b3ApLlxuICogICAgcG9pbnRlcm1vdmUoMkQgcG9zaXRpb24pOiBUaGUgcG9pbnRlciBpcyBtb3ZlZCAobW91c2Ugb3IgdG91Y2gpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlDb250cm9sbGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IocmVuZGVyZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuICAgIHRoaXMuYXZhaWxhYmxlSW50ZXJhY3Rpb25zID0ge307XG5cbiAgICAvLyBIYW5kbGUgaW50ZXJhY3Rpb25zLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5wb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5sYXN0UG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gUG9zaXRpb24gb2YgcG9pbnRlciBpbiBOb3JtYWxpemVkIERldmljZSBDb29yZGluYXRlcyAoTkRDKS5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIEhvdyBtdWNoIHdlIGhhdmUgZHJhZ2dlZCAoaWYgd2UgYXJlIGRyYWdnaW5nKS5cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAvLyBJcyBwb2ludGVyIGFjdGl2ZSBvciBub3QuXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG5cbiAgICAvLyBHYW1lcGFkIGV2ZW50cy5cbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuXG4gICAgaWYgKGdhbWVwYWQpIHtcbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuICAgICAgLy8gSWYgdGhlcmUncyBhIGdhbWVwYWQgY29ubmVjdGVkLCBkZXRlcm1pbmUgaWYgaXQncyBEYXlkcmVhbSBvciBhIFZpdmUuXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zZS5oYXNPcmllbnRhdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cbiAgICAgIGlmIChpc01vYmlsZSgpKSB7XG4gICAgICAgIC8vIEVpdGhlciBDYXJkYm9hcmQgb3IgbWFnaWMgd2luZG93LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBhcmVcbiAgICAgICAgLy8gcHJlc2VudGluZy5cbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LmlzUHJlc2VudGluZykge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG11c3QgYmUgb24gZGVza3RvcC5cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuTU9VU0U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIHVzZSBUT1VDSC5cbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgfVxuXG4gIGdldEdhbWVwYWRQb3NlKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgcmV0dXJuIGdhbWVwYWQucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxuICAgKiBPbmx5IHJlbGV2YW50IG9uIHRvdWNoIGRldmljZXNcbiAgICovXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUb3VjaEFjdGl2ZTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiB8fCBtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRikge1xuICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2FtZXBhZCwgY2hlY2sgZXZlcnkgYW5pbWF0aW9uIGZyYW1lIGZvciBhXG4gICAgICAvLyBwcmVzc2VkIGFjdGlvbi5cbiAgICAgIGxldCBpc0dhbWVwYWRQcmVzc2VkID0gdGhpcy5nZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKTtcbiAgICAgIGlmIChpc0dhbWVwYWRQcmVzc2VkICYmICF0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0dhbWVwYWRQcmVzc2VkICYmIHRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgICAgfVxuICAgICAgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCA9IGlzR2FtZXBhZFByZXNzZWQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgaWYgKCFnYW1lcGFkKSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIHRoZSBidXR0b24gd2FzIG5vdCBwcmVzc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBmb3IgY2xpY2tzLlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ2FtZXBhZC5idXR0b25zLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoZ2FtZXBhZC5idXR0b25zW2pdLnByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG9uTW91c2VEb3duXyhlKSB7XG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyhlKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlXyhlKSB7XG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgfVxuXG4gIG9uTW91c2VVcF8oZSkge1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKHQpO1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcblxuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25Ub3VjaE1vdmVfKGUpIHtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25Ub3VjaEVuZF8oZSkge1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueSA9IC0gKGUuY2xpZW50WSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG5cbiAgZW5kRHJhZ2dpbmdfKCkge1xuICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA8IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICB9XG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIGdldFZSR2FtZXBhZF8oKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuXG4gICAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBSYXlSZW5kZXJlciBmcm9tICcuL3JheS1yZW5kZXJlcidcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcblxuLyoqXG4gKiBBUEkgd3JhcHBlciBmb3IgdGhlIGlucHV0IGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgUmF5UmVuZGVyZXIoY2FtZXJhKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBuZXcgUmF5Q29udHJvbGxlcigpO1xuXG4gICAgLy8gQXJtIG1vZGVsIG5lZWRlZCB0byB0cmFuc2Zvcm0gY29udHJvbGxlciBvcmllbnRhdGlvbiBpbnRvIHByb3BlciBwb3NlLlxuICAgIHRoaXMuYXJtTW9kZWwgPSBuZXcgT3JpZW50YXRpb25Bcm1Nb2RlbCgpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXlkb3duJywgdGhpcy5vblJheURvd25fLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5dXAnLCB0aGlzLm9uUmF5VXBfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5Y2FuY2VsJywgdGhpcy5vblJheUNhbmNlbF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdwb2ludGVybW92ZScsIHRoaXMub25Qb2ludGVyTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpIH0pO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCkgfSk7XG5cbiAgICAvLyBCeSBkZWZhdWx0LCBwdXQgdGhlIHBvaW50ZXIgb2Zmc2NyZWVuLlxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKDEsIDEpO1xuXG4gICAgLy8gRXZlbnQgaGFuZGxlcnMuXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICB9XG5cbiAgYWRkKG9iamVjdCwgaGFuZGxlcnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyLmFkZChvYmplY3QsIGhhbmRsZXJzKTtcbiAgICB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF0gPSBoYW5kbGVycztcbiAgfVxuXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZShvYmplY3QpO1xuICAgIGRlbGV0ZSB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF1cbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICBsZXQgbW9kZSA9IHRoaXMuY29udHJvbGxlci5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTpcbiAgICAgICAgLy8gRGVza3RvcCBtb3VzZSBtb2RlLCBtb3VzZSBjb29yZGluYXRlcyBhcmUgd2hhdCBtYXR0ZXJzLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiBtb3VzZSBtb2RlIHJheSByZW5kZXJlciBpcyBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDpcbiAgICAgICAgLy8gTW9iaWxlIG1hZ2ljIHdpbmRvdyBtb2RlLiBUb3VjaCBjb29yZGluYXRlcyBtYXR0ZXIsIGJ1dCB3ZSB3YW50IHRvXG4gICAgICAgIC8vIGhpZGUgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuXG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIHRvdWNoIG1vZGUgdGhlIHJheSByZW5kZXJlciBpcyBvbmx5IGFjdGl2ZSBvbiB0b3VjaC5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodGhpcy5jb250cm9sbGVyLmdldElzVG91Y2hBY3RpdmUoKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjpcbiAgICAgICAgLy8gQ2FyZGJvYXJkIG1vZGUsIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhemUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICAgICAgLy8gUmV0aWNsZSBvbmx5LlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GOlxuICAgICAgICAvLyBEYXlkcmVhbSwgb3VyIG9yaWdpbiBpcyBzbGlnaHRseSBvZmYgKGRlcGVuZGluZyBvbiBoYW5kZWRuZXNzKS5cbiAgICAgICAgLy8gQnV0IHdlIHNob3VsZCBiZSB1c2luZyB0aGUgb3JpZW50YXRpb24gZnJvbSB0aGUgZ2FtZXBhZC5cbiAgICAgICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IHRoZSByZWFsIGFybSBtb2RlbC5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBEZWJ1ZyBvbmx5OiB1c2UgY2FtZXJhIGFzIGlucHV0IGNvbnRyb2xsZXIuXG4gICAgICAgIC8vbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IHRoaXMuY2FtZXJhLnF1YXRlcm5pb247XG4gICAgICAgIGxldCBjb250cm9sbGVyT3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBUcmFuc2Zvcm0gdGhlIGNvbnRyb2xsZXIgaW50byB0aGUgY2FtZXJhIGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAvKlxuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ubXVsdGlwbHkoXG4gICAgICAgICAgICBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCksIE1hdGguUEkpKTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnggKj0gLTE7XG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi56ICo9IC0xO1xuICAgICAgICAqL1xuXG4gICAgICAgIC8vIEZlZWQgY2FtZXJhIGFuZCBjb250cm9sbGVyIGludG8gdGhlIGFybSBtb2RlbC5cbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkT3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0SGVhZFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRDb250cm9sbGVyT3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC51cGRhdGUoKTtcblxuICAgICAgICAvLyBHZXQgcmVzdWx0aW5nIHBvc2UgYW5kIGNvbmZpZ3VyZSB0aGUgcmVuZGVyZXIuXG4gICAgICAgIGxldCBtb2RlbFBvc2UgPSB0aGlzLmFybU1vZGVsLmdldFBvc2UoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihtb2RlbFBvc2UucG9zaXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obmV3IFRIUkVFLlZlY3RvcjMoKSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24obW9kZWxQb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRjpcbiAgICAgICAgLy8gVml2ZSwgb3JpZ2luIGRlcGVuZHMgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBjb250cm9sbGVyLlxuICAgICAgICAvLyBUT0RPKHNtdXMpLi4uXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgcG9zZSBpcyB2YWxpZC5cbiAgICAgICAgaWYgKCFwb3NlLm9yaWVudGF0aW9uIHx8ICFwb3NlLnBvc2l0aW9uKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGdhbWVwYWQgcG9zZS4gQ2FuXFwndCB1cGRhdGUgcmF5LicpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShwb3NlLnBvc2l0aW9uKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGludGVyYWN0aW9uIG1vZGUuJyk7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgdGhpcy5jb250cm9sbGVyLnVwZGF0ZSgpO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5jb250cm9sbGVyLnNldFNpemUoc2l6ZSk7XG4gIH1cblxuICBnZXRNZXNoKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldFJldGljbGVSYXlNZXNoKCk7XG4gIH1cblxuICBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0T3JpZ2luKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0RGlyZWN0aW9uKCk7XG4gIH1cblxuICBnZXRSaWdodERpcmVjdGlvbigpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKCkuY3Jvc3NWZWN0b3JzKGxvb2tBdCwgdGhpcy5jYW1lcmEudXApO1xuICB9XG5cbiAgb25SYXlEb3duXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlEb3duXycpO1xuICAgIHRoaXMuZmlyZUFjdGl2ZU1lc2hFdmVudF8oJ29uQWN0aW9uJyk7XG5cbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJywgbWVzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgfVxuXG4gIG9uUmF5VXBfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheVVwXycpO1xuICAgIHRoaXMuZmlyZUFjdGl2ZU1lc2hFdmVudF8oJ29uUmVsZWFzZScpO1xuXG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5dXAnLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKGZhbHNlKTtcbiAgfVxuXG4gIG9uUmF5Q2FuY2VsXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlDYW5jZWxfJyk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJywgbWVzaCk7XG4gIH1cblxuICBmaXJlQWN0aXZlTWVzaEV2ZW50XyhldmVudE5hbWUpIHtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgaWYgKCFtZXNoKSB7XG4gICAgICAvL2NvbnNvbGUuaW5mbygnTm8gbWVzaCBzZWxlY3RlZC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1ttZXNoLmlkXTtcbiAgICBpZiAoIWhhbmRsZXJzKSB7XG4gICAgICAvL2NvbnNvbGUuaW5mbygnTm8gaGFuZGxlcnMgZm9yIG1lc2ggd2l0aCBpZCAlcy4nLCBtZXNoLmlkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFoYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICAvL2NvbnNvbGUuaW5mbygnTm8gaGFuZGxlciBuYW1lZCAlcyBmb3IgbWVzaC4nLCBldmVudE5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVyc1tldmVudE5hbWVdKG1lc2gpO1xuICB9XG5cbiAgb25Qb2ludGVyTW92ZV8obmRjKSB7XG4gICAgdGhpcy5wb2ludGVyTmRjLmNvcHkobmRjKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEludGVyYWN0aW9uTW9kZXMgPSB7XG4gIE1PVVNFOiAxLFxuICBUT1VDSDogMixcbiAgVlJfMERPRjogMyxcbiAgVlJfM0RPRjogNCxcbiAgVlJfNkRPRjogNVxufTtcblxuZXhwb3J0IHsgSW50ZXJhY3Rpb25Nb2RlcyBhcyBkZWZhdWx0IH07XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2Jhc2U2NH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuXG5jb25zdCBSRVRJQ0xFX0RJU1RBTkNFID0gMztcbmNvbnN0IElOTkVSX1JBRElVUyA9IDAuMDI7XG5jb25zdCBPVVRFUl9SQURJVVMgPSAwLjA0O1xuY29uc3QgUkFZX1JBRElVUyA9IDAuMDI7XG5jb25zdCBHUkFESUVOVF9JTUFHRSA9IGJhc2U2NCgnaW1hZ2UvcG5nJywgJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFJQUFBQUNBQ0FZQUFBRERQbUhMQUFBQmRrbEVRVlI0bk8zV3dYSEVRQXdEUWNpbi9GT1d3K0JqdWlQWUIycTRHMm5QOTMzUDlTTzQ4MjR6Z0RBRGlET0F1SGZiMy9VanVLTUFjUVlRWndCeC9nQnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVHRUdjQWNmNEFjUW9RWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhIdnR0LzFJN2lqQUhFR0VHY0FjZjRBY1FvUVp3QnhUa0NjQXNRWlFKd1RFS2NBY1FvUXB3QnhCaERuQk1RcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndCeERrQmNRb1Fwd0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFS0VHY0FjVTVBbkFMRUtVQ2NBc1FaUUp3VEVLY0FjUVlRNXdURUtVQ2NBY1FaUUp3L1FKd0N4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVURjdSsyNWZnUjNGQ0RPQU9JTUlNNGZJRTRCNGhRZ1RnSGlGQ0JPQWVJVUlFNEI0aFFnemdEaURDRE9IeUJPQWVJTUlNNEE0djRCLzVJRjllRDZReGdBQUFBQVNVVk9SSzVDWUlJPScpO1xuXG4vKipcbiAqIEhhbmRsZXMgcmF5IGlucHV0IHNlbGVjdGlvbiBmcm9tIGZyYW1lIG9mIHJlZmVyZW5jZSBvZiBhbiBhcmJpdHJhcnkgb2JqZWN0LlxuICpcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxuICpcbiAqIERlc2t0b3A6IG1vdXNlLlxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cbiAqIENhcmRib2FyZDogY2FtZXJhLlxuICogRGF5ZHJlYW06IDNET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqXG4gKiBFbWl0cyBzZWxlY3Rpb24gZXZlbnRzOlxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXG4gKiAgICAgcmF5b3V0KG1lc2gpOiBUaGlzIG1lc2ggd2FzIHVuc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfcGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBpbnRlcmFjdGl2ZSAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMubWVzaGVzID0ge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLnNlbGVjdGVkID0ge307XG5cbiAgICAvLyBUaGUgcmF5Y2FzdGVyLlxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXG4gICAgLy8gUG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLCBpbiBhZGRpdGlvbi5cbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgLy8gQWRkIHRoZSByZXRpY2xlIG1lc2ggdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJldGljbGUpO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJheSA9IHRoaXMuY3JlYXRlUmF5XygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yYXkpO1xuXG4gICAgLy8gSG93IGZhciB0aGUgcmV0aWNsZSBpcyBjdXJyZW50bHkgZnJvbSB0aGUgcmV0aWNsZSBvcmlnaW4uXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBhZGQob2JqZWN0KSB7XG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV2ZW50IGFuIG9iamVjdCBmcm9tIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB2YXIgaWQgPSBvYmplY3QuaWQ7XG4gICAgaWYgKCF0aGlzLm1lc2hlc1tpZF0pIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cbiAgICBpZiAodGhpcy5zZWxlY3RlZFtpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW29iamVjdC5pZF07XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAvLyBEbyB0aGUgcmF5Y2FzdGluZyBhbmQgaXNzdWUgdmFyaW91cyBldmVudHMgYXMgbmVlZGVkLlxuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5tZXNoZXMpIHtcbiAgICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICAgIGxldCBpbnRlcnNlY3RzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0KG1lc2gsIHRydWUpO1xuICAgICAgICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlzSW50ZXJzZWN0ZWQgPSAoaW50ZXJzZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgICAvLyBJZiBpdCdzIG5ld2x5IHNlbGVjdGVkLCBzZW5kIHJheW92ZXIuXG4gICAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgaXQncyBubyBsb25nZXIgaW50ZXJzZWN0ZWQsIHNlbmQgcmF5b3V0LlxuICAgICAgICBpZiAoIWlzSW50ZXJzZWN0ZWQgJiYgaXNTZWxlY3RlZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSYXkgbm90IGFjdGl2ZSwgcmF5b3V0IHNlbGVjdGVkIG1lc2hlcy5cbiAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIG9yIG5vdCB0aGVyZSBpcyBjdXJyZW50bHkgYWN0aW9uLlxuICAgKi9cbiAgc2V0QWN0aXZlKGlzQWN0aXZlKSB7XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcbiAgfVxuXG4gIHVwZGF0ZVJheWNhc3Rlcl8oKSB7XG4gICAgdmFyIHJheSA9IHRoaXMucmF5Y2FzdGVyLnJheTtcblxuICAgIC8vIFBvc2l0aW9uIHRoZSByZXRpY2xlIGF0IGEgZGlzdGFuY2UsIGFzIGNhbGN1bGF0ZWQgZnJvbSB0aGUgb3JpZ2luIGFuZFxuICAgIC8vIGRpcmVjdGlvbi5cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnJldGljbGUucG9zaXRpb247XG4gICAgcG9zaXRpb24uY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBwb3NpdGlvbi5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgcG9zaXRpb24uYWRkKHJheS5vcmlnaW4pO1xuXG4gICAgLy8gU2V0IHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgcmF5IHNvIHRoYXQgaXQgZ29lcyBmcm9tIG9yaWdpbiB0b1xuICAgIC8vIHJldGljbGUuXG4gICAgdmFyIGRlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIGRlbHRhLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICB0aGlzLnJheS5zY2FsZS55ID0gZGVsdGEubGVuZ3RoKCk7XG4gICAgdmFyIGFycm93ID0gbmV3IFRIUkVFLkFycm93SGVscGVyKHJheS5kaXJlY3Rpb24sIHJheS5vcmlnaW4pO1xuICAgIHRoaXMucmF5LnJvdGF0aW9uLmNvcHkoYXJyb3cucm90YXRpb24pO1xuICAgIHRoaXMucmF5LnBvc2l0aW9uLmFkZFZlY3RvcnMocmF5Lm9yaWdpbiwgZGVsdGEubXVsdGlwbHlTY2FsYXIoMC41KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHJldGljbGUuXG4gICAqL1xuICBjcmVhdGVSZXRpY2xlXygpIHtcbiAgICAvLyBDcmVhdGUgYSBzcGhlcmljYWwgcmV0aWNsZS5cbiAgICBsZXQgaW5uZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShJTk5FUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IGlubmVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjlcbiAgICB9KTtcbiAgICBsZXQgaW5uZXIgPSBuZXcgVEhSRUUuTWVzaChpbm5lckdlb21ldHJ5LCBpbm5lck1hdGVyaWFsKTtcblxuICAgIGxldCBvdXRlckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KE9VVEVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgb3V0ZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHgzMzMzMzMsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIGxldCBvdXRlciA9IG5ldyBUSFJFRS5NZXNoKG91dGVyR2VvbWV0cnksIG91dGVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IHJldGljbGUgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICByZXRpY2xlLmFkZChpbm5lcik7XG4gICAgcmV0aWNsZS5hZGQob3V0ZXIpO1xuICAgIHJldHVybiByZXRpY2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSByZXRpY2xlIHRvIGEgcG9zaXRpb24gc28gdGhhdCBpdCdzIGp1c3QgaW4gZnJvbnQgb2YgdGhlIG1lc2ggdGhhdFxuICAgKiBpdCBpbnRlcnNlY3RlZCB3aXRoLlxuICAgKi9cbiAgbW92ZVJldGljbGVfKGludGVyc2VjdGlvbnMpIHtcbiAgICAvLyBJZiBubyBpbnRlcnNlY3Rpb24sIHJldHVybiB0aGUgcmV0aWNsZSB0byB0aGUgZGVmYXVsdCBwb3NpdGlvbi5cbiAgICBsZXQgZGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICAgIGlmIChpbnRlcnNlY3Rpb25zKSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgY29ycmVjdCBkaXN0YW5jZS5cbiAgICAgIGxldCBpbnRlciA9IGludGVyc2VjdGlvbnNbMF07XG4gICAgICBkaXN0YW5jZSA9IGludGVyLmRpc3RhbmNlO1xuICAgIH1cblxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3JlYXRlUmF5XygpIHtcbiAgICAvLyBDcmVhdGUgYSBjeWxpbmRyaWNhbCByYXkuXG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoUkFZX1JBRElVUywgUkFZX1JBRElVUywgMSwgMzIpO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoR1JBRElFTlRfSU1BR0UpLFxuICAgICAgLy9jb2xvcjogMHhmZmZmZmYsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcblxuICAgIHJldHVybiBtZXNoO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0KG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59XG4iXX0=
