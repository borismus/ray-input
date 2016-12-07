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

  function RayController(opt_el) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    var el = opt_el || window;

    // Handle interactions.
    el.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    el.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    el.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    el.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    el.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    el.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

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
      this.isTouchActive = true;
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

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
      this.endDragging_();

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
      this.isTouchActive = false;
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

  function RayInput(camera, opt_el) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default(opt_el);

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

      // Force the renderer to raycast.
      this.renderer.update();
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
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
     * Enables and disables the raycaster. For touch, where finger up means we
     * shouldn't be raycasting.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // If nothing changed, do nothing.
      if (this.isActive == isActive) {
        return;
      }
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;

      if (!isActive) {
        this.moveReticle_(null);
        for (var id in this.selected) {
          var mesh = this.meshes[id];
          delete this.selected[id];
          this.emit('rayout', mesh);
        }
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvb3JpZW50YXRpb24tYXJtLW1vZGVsLmpzIiwic3JjL3JheS1jb250cm9sbGVyLmpzIiwic3JjL3JheS1pbnB1dC5qcyIsInNyYy9yYXktaW50ZXJhY3Rpb24tbW9kZXMuanMiLCJzcmMvcmF5LXJlbmRlcmVyLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqU0E7Ozs7Ozs7Ozs7Ozs7OztBQWVB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QUssZUFBTCxHQUF1QixRQUF2QjtBQUNBLFdBQUssZ0JBQUw7QUFDQTtBQUNEOzs7aUNBRVk7QUFDWDtBQUNBLFVBQUksV0FBVyxJQUFJLE1BQU0sZ0JBQVYsQ0FBMkIsVUFBM0IsRUFBdUMsVUFBdkMsRUFBbUQsQ0FBbkQsRUFBc0QsRUFBdEQsQ0FBZjtBQUNBLFVBQUksV0FBVyxJQUFJLE1BQU0saUJBQVYsQ0FBNEI7QUFDekMsYUFBSyxNQUFNLFVBQU4sQ0FBaUIsV0FBakIsQ0FBNkIsY0FBN0IsQ0FEb0M7QUFFekM7QUFDQSxxQkFBYSxJQUg0QjtBQUl6QyxpQkFBUztBQUpnQyxPQUE1QixDQUFmO0FBTUEsVUFBSSxPQUFPLElBQUksTUFBTSxJQUFWLENBQWUsUUFBZixFQUF5QixRQUF6QixDQUFYOztBQUVBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBOVFrQixXOzs7Ozs7OztRQ3hCTCxRLEdBQUEsUTtRQU1BLE0sR0FBQSxNO0FBckJoQjs7Ozs7Ozs7Ozs7Ozs7O0FBZU8sU0FBUyxRQUFULEdBQW9CO0FBQ3pCLE1BQUksUUFBUSxLQUFaO0FBQ0EsR0FBQyxVQUFTLENBQVQsRUFBVztBQUFDLFFBQUcsMlRBQTJULElBQTNULENBQWdVLENBQWhVLEtBQW9VLDBrREFBMGtELElBQTFrRCxDQUEra0QsRUFBRSxNQUFGLENBQVMsQ0FBVCxFQUFXLENBQVgsQ0FBL2tELENBQXZVLEVBQXE2RCxRQUFRLElBQVI7QUFBYSxHQUEvN0QsRUFBaThELFVBQVUsU0FBVixJQUFxQixVQUFVLE1BQS9CLElBQXVDLE9BQU8sS0FBLytEO0FBQ0EsU0FBTyxLQUFQO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULENBQWdCLFFBQWhCLEVBQTBCLE1BQTFCLEVBQWtDO0FBQ3ZDLFNBQU8sVUFBVSxRQUFWLEdBQXFCLFVBQXJCLEdBQWtDLE1BQXpDO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcbmNvbnN0IEVMQk9XX1dSSVNUX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0wLjI1KTtcbmNvbnN0IFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMC4wNSk7XG5jb25zdCBBUk1fRVhURU5TSU9OX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjA4LCAwLjE0LCAwLjA4KTtcblxuY29uc3QgRUxCT1dfQkVORF9SQVRJTyA9IDAuNDsgLy8gNDAlIGVsYm93LCA2MCUgd3Jpc3QuXG5jb25zdCBFWFRFTlNJT05fUkFUSU9fV0VJR0hUID0gMC40O1xuXG5jb25zdCBNSU5fQU5HVUxBUl9TUEVFRCA9IDAuNjE7IC8vIDM1IGRlZ3JlZXMgcGVyIHNlY29uZCAoaW4gcmFkaWFucykuXG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgYXJtIG1vZGVsIGZvciB0aGUgRGF5ZHJlYW0gY29udHJvbGxlci4gRmVlZCBpdCBhIGNhbWVyYSBhbmRcbiAqIHRoZSBjb250cm9sbGVyLiBVcGRhdGUgaXQgb24gYSBSQUYuXG4gKlxuICogR2V0IHRoZSBtb2RlbCdzIHBvc2UgdXNpbmcgZ2V0UG9zZSgpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcmllbnRhdGlvbkFybU1vZGVsIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGNvbnRyb2xsZXIgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGhlYWQgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuaGVhZFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBoZWFkIHBvc2l0aW9uLlxuICAgIHRoaXMuaGVhZFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBQb3NpdGlvbnMgb2Ygb3RoZXIgam9pbnRzIChtb3N0bHkgZm9yIGRlYnVnZ2luZykuXG4gICAgdGhpcy5lbGJvd1BvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy53cmlzdFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyB0aW1lcyB0aGUgbW9kZWwgd2FzIHVwZGF0ZWQuXG4gICAgdGhpcy50aW1lID0gbnVsbDtcbiAgICB0aGlzLmxhc3RUaW1lID0gbnVsbDtcblxuICAgIC8vIFJvb3Qgcm90YXRpb24uXG4gICAgdGhpcy5yb290USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IHBvc2UgdGhhdCB0aGlzIGFybSBtb2RlbCBjYWxjdWxhdGVzLlxuICAgIHRoaXMucG9zZSA9IHtcbiAgICAgIG9yaWVudGF0aW9uOiBuZXcgVEhSRUUuUXVhdGVybmlvbigpLFxuICAgICAgcG9zaXRpb246IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgdG8gc2V0IGNvbnRyb2xsZXIgYW5kIGhlYWQgcG9zZSAoaW4gd29ybGQgY29vcmRpbmF0ZXMpLlxuICAgKi9cbiAgc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuICAgIHRoaXMuY29udHJvbGxlclEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5oZWFkUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy5oZWFkUG9zLmNvcHkocG9zaXRpb24pO1xuICB9XG5cbiAgc2V0TGVmdEhhbmRlZChpc0xlZnRIYW5kZWQpIHtcbiAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgbWUhXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGEgUkFGLlxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMudGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGNvbnRyb2xsZXIncyBhbmd1bGFyIHZlbG9jaXR5IGlzIGFib3ZlIGEgY2VydGFpbiBhbW91bnQsIHdlIGNhblxuICAgIC8vIGFzc3VtZSB0b3JzbyByb3RhdGlvbiBhbmQgbW92ZSB0aGUgZWxib3cgam9pbnQgcmVsYXRpdmUgdG8gdGhlXG4gICAgLy8gY2FtZXJhIG9yaWVudGF0aW9uLlxuICAgIGxldCBoZWFkWWF3USA9IHRoaXMuZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpO1xuICAgIGxldCB0aW1lRGVsdGEgPSAodGhpcy50aW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgIGxldCBhbmdsZURlbHRhID0gdGhpcy5xdWF0QW5nbGVfKHRoaXMubGFzdENvbnRyb2xsZXJRLCB0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICBsZXQgY29udHJvbGxlckFuZ3VsYXJTcGVlZCA9IGFuZ2xlRGVsdGEgLyB0aW1lRGVsdGE7XG4gICAgaWYgKGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPiBNSU5fQU5HVUxBUl9TUEVFRCkge1xuICAgICAgLy8gQXR0ZW51YXRlIHRoZSBSb290IHJvdGF0aW9uIHNsaWdodGx5LlxuICAgICAgdGhpcy5yb290US5zbGVycChoZWFkWWF3USwgYW5nbGVEZWx0YSAvIDEwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvb3RRLmNvcHkoaGVhZFlhd1EpO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gbW92ZSB0aGUgZWxib3cgdXAgYW5kIHRvIHRoZSBjZW50ZXIgYXMgdGhlIHVzZXIgcG9pbnRzIHRoZVxuICAgIC8vIGNvbnRyb2xsZXIgdXB3YXJkcywgc28gdGhhdCB0aGV5IGNhbiBlYXNpbHkgc2VlIHRoZSBjb250cm9sbGVyIGFuZCBpdHNcbiAgICAvLyB0b29sIHRpcHMuXG4gICAgbGV0IGNvbnRyb2xsZXJFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuY29udHJvbGxlclEsICdZWFonKTtcbiAgICBsZXQgY29udHJvbGxlclhEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKGNvbnRyb2xsZXJFdWxlci54KTtcbiAgICBsZXQgZXh0ZW5zaW9uUmF0aW8gPSB0aGlzLmNsYW1wXygoY29udHJvbGxlclhEZWcgLSAxMSkgLyAoNTAgLSAxMSksIDAsIDEpO1xuXG4gICAgLy8gQ29udHJvbGxlciBvcmllbnRhdGlvbiBpbiBjYW1lcmEgc3BhY2UuXG4gICAgbGV0IGNvbnRyb2xsZXJDYW1lcmFRID0gdGhpcy5yb290US5jbG9uZSgpLmludmVyc2UoKTtcbiAgICBjb250cm9sbGVyQ2FtZXJhUS5tdWx0aXBseSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGJvdyBwb3NpdGlvbi5cbiAgICBsZXQgZWxib3dQb3MgPSB0aGlzLmVsYm93UG9zO1xuICAgIGVsYm93UG9zLmNvcHkodGhpcy5oZWFkUG9zKS5hZGQoSEVBRF9FTEJPV19PRkZTRVQpO1xuICAgIGxldCBlbGJvd09mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgZWxib3dPZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgam9pbnQgYW5nbGVzLiBHZW5lcmFsbHkgNDAlIG9mIHJvdGF0aW9uIGFwcGxpZWQgdG8gZWxib3csIDYwJVxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cbiAgICAvLyB0aGUgd3Jpc3QuXG4gICAgbGV0IHRvdGFsQW5nbGUgPSB0aGlzLnF1YXRBbmdsZV8oY29udHJvbGxlckNhbWVyYVEsIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkpO1xuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcbiAgICBsZXQgbGVycFN1cHByZXNzaW9uID0gMSAtIE1hdGgucG93KHRvdGFsQW5nbGVEZWcgLyAxODAsIDQpOyAvLyBUT0RPKHNtdXMpOiA/Pz9cblxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgd3Jpc3RSYXRpbyA9IDEgLSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCBsZXJwVmFsdWUgPSBsZXJwU3VwcHJlc3Npb24gKlxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xuXG4gICAgbGV0IHdyaXN0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2xlcnAoY29udHJvbGxlckNhbWVyYVEsIGxlcnBWYWx1ZSk7XG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XG4gICAgbGV0IGVsYm93USA9IGNvbnRyb2xsZXJDYW1lcmFRLmNsb25lKCkubXVsdGlwbHkoaW52V3Jpc3RRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xuICAgIC8vIGFuZCBsZW5ndGhzLlxuICAgIC8qXG4gICAgcG9zaXRpb25fID1cbiAgICAgIHJvb3Rfcm90XyAqIChcbiAgICAgICAgY29udHJvbGxlcl9yb290X29mZnNldF8gK1xuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXG4xOiAgICAgIGVsYm93X3JvdCAqIChrQ29udHJvbGxlckZvcmVhcm0gKyAod3Jpc3Rfcm90ICoga0NvbnRyb2xsZXJQb3NpdGlvbikpXG4gICAgICApO1xuICAgICovXG4gICAgbGV0IHdyaXN0UG9zID0gdGhpcy53cmlzdFBvcztcbiAgICB3cmlzdFBvcy5jb3B5KFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcbiAgICB3cmlzdFBvcy5hZGQoRUxCT1dfV1JJU1RfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24oZWxib3dRKTtcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuXG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHRoaXMud3Jpc3RQb3MpO1xuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xuICAgIHBvc2l0aW9uLmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcblxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIFNldCB0aGUgcmVzdWx0aW5nIHBvc2Ugb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICB0aGlzLnBvc2UucG9zaXRpb24uY29weShwb3NpdGlvbik7XG5cbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvc2UgY2FsY3VsYXRlZCBieSB0aGUgbW9kZWwuXG4gICAqL1xuICBnZXRQb3NlKCkge1xuICAgIHJldHVybiB0aGlzLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbWV0aG9kcyBmb3IgcmVuZGVyaW5nIHRoZSBhcm0gbW9kZWwuXG4gICAqL1xuICBnZXRGb3JlYXJtTGVuZ3RoKCkge1xuICAgIHJldHVybiBFTEJPV19XUklTVF9PRkZTRVQubGVuZ3RoKCk7XG4gIH1cblxuICBnZXRFbGJvd1Bvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRXcmlzdFBvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLndyaXN0UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xuICAgIGxldCBoZWFkRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmhlYWRRLCAnWVhaJyk7XG4gICAgaGVhZEV1bGVyLnggPSAwO1xuICAgIGhlYWRFdWxlci56ID0gMDtcbiAgICBsZXQgZGVzdGluYXRpb25RID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoaGVhZEV1bGVyKTtcbiAgICByZXR1cm4gZGVzdGluYXRpb25RO1xuICB9XG5cbiAgY2xhbXBfKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XG4gICAgbGV0IHZlYzEgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbGV0IHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xuICAgIHZlYzIuYXBwbHlRdWF0ZXJuaW9uKHEyKTtcbiAgICByZXR1cm4gdmVjMS5hbmdsZVRvKHZlYzIpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcbmltcG9ydCB7aXNNb2JpbGV9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgRFJBR19ESVNUQU5DRV9QWCA9IDEwO1xuXG4vKipcbiAqIEVudW1lcmF0ZXMgYWxsIHBvc3NpYmxlIGludGVyYWN0aW9uIG1vZGVzLiBTZXRzIHVwIGFsbCBldmVudCBoYW5kbGVycyAobW91c2UsXG4gKiB0b3VjaCwgZXRjKSwgaW50ZXJmYWNlcyB3aXRoIGdhbWVwYWQgQVBJLlxuICpcbiAqIEVtaXRzIGV2ZW50czpcbiAqICAgIGFjdGlvbjogSW5wdXQgaXMgYWN0aXZhdGVkIChtb3VzZWRvd24sIHRvdWNoc3RhcnQsIGRheWRyZWFtIGNsaWNrLCB2aXZlXG4gKiAgICB0cmlnZ2VyKS5cbiAqICAgIHJlbGVhc2U6IElucHV0IGlzIGRlYWN0aXZhdGVkIChtb3VzZXVwLCB0b3VjaGVuZCwgZGF5ZHJlYW0gcmVsZWFzZSwgdml2ZVxuICogICAgcmVsZWFzZSkuXG4gKiAgICBjYW5jZWw6IElucHV0IGlzIGNhbmNlbGVkIChlZy4gd2Ugc2Nyb2xsZWQgaW5zdGVhZCBvZiB0YXBwaW5nIG9uXG4gKiAgICBtb2JpbGUvZGVza3RvcCkuXG4gKiAgICBwb2ludGVybW92ZSgyRCBwb3NpdGlvbik6IFRoZSBwb2ludGVyIGlzIG1vdmVkIChtb3VzZSBvciB0b3VjaCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuICAgIGxldCBlbCA9IG9wdF9lbCB8fCB3aW5kb3c7XG5cbiAgICAvLyBIYW5kbGUgaW50ZXJhY3Rpb25zLlxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5wb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5sYXN0UG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gUG9zaXRpb24gb2YgcG9pbnRlciBpbiBOb3JtYWxpemVkIERldmljZSBDb29yZGluYXRlcyAoTkRDKS5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIEhvdyBtdWNoIHdlIGhhdmUgZHJhZ2dlZCAoaWYgd2UgYXJlIGRyYWdnaW5nKS5cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAvLyBJcyBwb2ludGVyIGFjdGl2ZSBvciBub3QuXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG5cbiAgICAvLyBHYW1lcGFkIGV2ZW50cy5cbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuXG4gICAgaWYgKGdhbWVwYWQpIHtcbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuICAgICAgLy8gSWYgdGhlcmUncyBhIGdhbWVwYWQgY29ubmVjdGVkLCBkZXRlcm1pbmUgaWYgaXQncyBEYXlkcmVhbSBvciBhIFZpdmUuXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zZS5oYXNPcmllbnRhdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cbiAgICAgIGlmIChpc01vYmlsZSgpKSB7XG4gICAgICAgIC8vIEVpdGhlciBDYXJkYm9hcmQgb3IgbWFnaWMgd2luZG93LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBhcmVcbiAgICAgICAgLy8gcHJlc2VudGluZy5cbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LmlzUHJlc2VudGluZykge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG11c3QgYmUgb24gZGVza3RvcC5cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuTU9VU0U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIHVzZSBUT1VDSC5cbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgfVxuXG4gIGdldEdhbWVwYWRQb3NlKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgcmV0dXJuIGdhbWVwYWQucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxuICAgKiBPbmx5IHJlbGV2YW50IG9uIHRvdWNoIGRldmljZXNcbiAgICovXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUb3VjaEFjdGl2ZTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiB8fCBtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRikge1xuICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2FtZXBhZCwgY2hlY2sgZXZlcnkgYW5pbWF0aW9uIGZyYW1lIGZvciBhXG4gICAgICAvLyBwcmVzc2VkIGFjdGlvbi5cbiAgICAgIGxldCBpc0dhbWVwYWRQcmVzc2VkID0gdGhpcy5nZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKTtcbiAgICAgIGlmIChpc0dhbWVwYWRQcmVzc2VkICYmICF0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0dhbWVwYWRQcmVzc2VkICYmIHRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgICAgfVxuICAgICAgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCA9IGlzR2FtZXBhZFByZXNzZWQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgaWYgKCFnYW1lcGFkKSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIHRoZSBidXR0b24gd2FzIG5vdCBwcmVzc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBmb3IgY2xpY2tzLlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ2FtZXBhZC5idXR0b25zLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoZ2FtZXBhZC5idXR0b25zW2pdLnByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG9uTW91c2VEb3duXyhlKSB7XG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyhlKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlXyhlKSB7XG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgfVxuXG4gIG9uTW91c2VVcF8oZSkge1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25Ub3VjaE1vdmVfKGUpIHtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25Ub3VjaEVuZF8oZSkge1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG5cbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueSA9IC0gKGUuY2xpZW50WSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG5cbiAgZW5kRHJhZ2dpbmdfKCkge1xuICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA8IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICB9XG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIGdldFZSR2FtZXBhZF8oKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuXG4gICAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBSYXlSZW5kZXJlciBmcm9tICcuL3JheS1yZW5kZXJlcidcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcblxuLyoqXG4gKiBBUEkgd3JhcHBlciBmb3IgdGhlIGlucHV0IGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSYXlSZW5kZXJlcihjYW1lcmEpO1xuICAgIHRoaXMuY29udHJvbGxlciA9IG5ldyBSYXlDb250cm9sbGVyKG9wdF9lbCk7XG5cbiAgICAvLyBBcm0gbW9kZWwgbmVlZGVkIHRvIHRyYW5zZm9ybSBjb250cm9sbGVyIG9yaWVudGF0aW9uIGludG8gcHJvcGVyIHBvc2UuXG4gICAgdGhpcy5hcm1Nb2RlbCA9IG5ldyBPcmllbnRhdGlvbkFybU1vZGVsKCk7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRvd24nLCB0aGlzLm9uUmF5RG93bl8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXl1cCcsIHRoaXMub25SYXlVcF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXljYW5jZWwnLCB0aGlzLm9uUmF5Q2FuY2VsXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5vblBvaW50ZXJNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdmVyJywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdmVyJywgbWVzaCkgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3V0JywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKSB9KTtcblxuICAgIC8vIEJ5IGRlZmF1bHQsIHB1dCB0aGUgcG9pbnRlciBvZmZzY3JlZW4uXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoMSwgMSk7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycy5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gIH1cblxuICBhZGQob2JqZWN0LCBoYW5kbGVycykge1xuICAgIHRoaXMucmVuZGVyZXIuYWRkKG9iamVjdCwgaGFuZGxlcnMpO1xuICAgIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXSA9IGhhbmRsZXJzO1xuICB9XG5cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlKG9iamVjdCk7XG4gICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIGxldCBtb2RlID0gdGhpcy5jb250cm9sbGVyLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFOlxuICAgICAgICAvLyBEZXNrdG9wIG1vdXNlIG1vZGUsIG1vdXNlIGNvb3JkaW5hdGVzIGFyZSB3aGF0IG1hdHRlcnMuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIG1vdXNlIG1vZGUgcmF5IHJlbmRlcmVyIGlzIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIOlxuICAgICAgICAvLyBNb2JpbGUgbWFnaWMgd2luZG93IG1vZGUuIFRvdWNoIGNvb3JkaW5hdGVzIG1hdHRlciwgYnV0IHdlIHdhbnQgdG9cbiAgICAgICAgLy8gaGlkZSB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG5cbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gdG91Y2ggbW9kZSB0aGUgcmF5IHJlbmRlcmVyIGlzIG9ubHkgYWN0aXZlIG9uIHRvdWNoLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0aGlzLmNvbnRyb2xsZXIuZ2V0SXNUb3VjaEFjdGl2ZSgpKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GOlxuICAgICAgICAvLyBDYXJkYm9hcmQgbW9kZSwgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2F6ZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAvLyBSZXRpY2xlIG9ubHkuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y6XG4gICAgICAgIC8vIERheWRyZWFtLCBvdXIgb3JpZ2luIGlzIHNsaWdodGx5IG9mZiAoZGVwZW5kaW5nIG9uIGhhbmRlZG5lc3MpLlxuICAgICAgICAvLyBCdXQgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBvcmllbnRhdGlvbiBmcm9tIHRoZSBnYW1lcGFkLlxuICAgICAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgdGhlIHJlYWwgYXJtIG1vZGVsLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIERlYnVnIG9ubHk6IHVzZSBjYW1lcmEgYXMgaW5wdXQgY29udHJvbGxlci5cbiAgICAgICAgLy9sZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gdGhpcy5jYW1lcmEucXVhdGVybmlvbjtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGUgY29udHJvbGxlciBpbnRvIHRoZSBjYW1lcmEgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi5tdWx0aXBseShcbiAgICAgICAgICAgIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKSwgTWF0aC5QSSkpO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnogKj0gLTE7XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gRmVlZCBjYW1lcmEgYW5kIGNvbnRyb2xsZXIgaW50byB0aGUgYXJtIG1vZGVsLlxuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldENvbnRyb2xsZXJPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnVwZGF0ZSgpO1xuXG4gICAgICAgIC8vIEdldCByZXN1bHRpbmcgcG9zZSBhbmQgY29uZmlndXJlIHRoZSByZW5kZXJlci5cbiAgICAgICAgbGV0IG1vZGVsUG9zZSA9IHRoaXMuYXJtTW9kZWwuZ2V0UG9zZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG1vZGVsUG9zZS5wb3NpdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihuZXcgVEhSRUUuVmVjdG9yMygpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihtb2RlbFBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GOlxuICAgICAgICAvLyBWaXZlLCBvcmlnaW4gZGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIGNvbnRyb2xsZXIuXG4gICAgICAgIC8vIFRPRE8oc211cykuLi5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBDaGVjayB0aGF0IHRoZSBwb3NlIGlzIHZhbGlkLlxuICAgICAgICBpZiAoIXBvc2Uub3JpZW50YXRpb24gfHwgIXBvc2UucG9zaXRpb24pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgZ2FtZXBhZCBwb3NlLiBDYW5cXCd0IHVwZGF0ZSByYXkuJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHBvc2UucG9zaXRpb24pO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24ob3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gaW50ZXJhY3Rpb24gbW9kZS4nKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIudXBkYXRlKCk7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIuc2V0U2l6ZShzaXplKTtcbiAgfVxuXG4gIGdldE1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0UmV0aWNsZVJheU1lc2goKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRPcmlnaW4oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXREaXJlY3Rpb24oKTtcbiAgfVxuXG4gIGdldFJpZ2h0RGlyZWN0aW9uKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMobG9va0F0LCB0aGlzLmNhbWVyYS51cCk7XG4gIH1cblxuICBvblJheURvd25fKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheURvd25fJyk7XG5cbiAgICAvLyBGb3JjZSB0aGUgcmVuZGVyZXIgdG8gcmF5Y2FzdC5cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICB9XG5cbiAgb25SYXlVcF8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5VXBfJyk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5dXAnLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKGZhbHNlKTtcbiAgfVxuXG4gIG9uUmF5Q2FuY2VsXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlDYW5jZWxfJyk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJywgbWVzaCk7XG4gIH1cblxuICBvblBvaW50ZXJNb3ZlXyhuZGMpIHtcbiAgICB0aGlzLnBvaW50ZXJOZGMuY29weShuZGMpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgSW50ZXJhY3Rpb25Nb2RlcyA9IHtcbiAgTU9VU0U6IDEsXG4gIFRPVUNIOiAyLFxuICBWUl8wRE9GOiAzLFxuICBWUl8zRE9GOiA0LFxuICBWUl82RE9GOiA1XG59O1xuXG5leHBvcnQgeyBJbnRlcmFjdGlvbk1vZGVzIGFzIGRlZmF1bHQgfTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7YmFzZTY0fSBmcm9tICcuL3V0aWwnXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5cbmNvbnN0IFJFVElDTEVfRElTVEFOQ0UgPSAzO1xuY29uc3QgSU5ORVJfUkFESVVTID0gMC4wMjtcbmNvbnN0IE9VVEVSX1JBRElVUyA9IDAuMDQ7XG5jb25zdCBSQVlfUkFESVVTID0gMC4wMjtcbmNvbnN0IEdSQURJRU5UX0lNQUdFID0gYmFzZTY0KCdpbWFnZS9wbmcnLCAnaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUlBQUFBQ0FDQVlBQUFERFBtSExBQUFCZGtsRVFWUjRuTzNXd1hIRVFBd0RRY2luL0ZPV3crQmp1aVBZQjJxNEcyblA5MzNQOVNPNDgyNHpnREFEaURPQXVIZmIzL1VqdUtNQWNRWVFad0J4L2dCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUdFR2NBY2Y0QWNRb1Fad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEh2dHQvMUk3aWpBSEVHRUdjQWNmNEFjUW9RWndCeFRrQ2NBc1FaUUp3VEVLY0FjUW9RcHdCeEJoRG5CTVFwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0J4RGtCY1FvUXB3QnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVLRUdjQWNVNUFuQUxFS1VDY0FzUVpRSndURUtjQWNRWVE1d1RFS1VDY0FjUVpRSncvUUp3Q3hCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVRGN1KzI1ZmdSM0ZDRE9BT0lNSU00ZklFNEI0aFFnVGdIaUZDQk9BZUlVSUU0QjRoUWd6Z0RpRENET0h5Qk9BZUlNSU00QTR2NEIvNUlGOWVENlF4Z0FBQUFBU1VWT1JLNUNZSUk9Jyk7XG5cbi8qKlxuICogSGFuZGxlcyByYXkgaW5wdXQgc2VsZWN0aW9uIGZyb20gZnJhbWUgb2YgcmVmZXJlbmNlIG9mIGFuIGFyYml0cmFyeSBvYmplY3QuXG4gKlxuICogVGhlIHNvdXJjZSBvZiB0aGUgcmF5IGlzIGZyb20gdmFyaW91cyBsb2NhdGlvbnM6XG4gKlxuICogRGVza3RvcDogbW91c2UuXG4gKiBNYWdpYyB3aW5kb3c6IHRvdWNoLlxuICogQ2FyZGJvYXJkOiBjYW1lcmEuXG4gKiBEYXlkcmVhbTogM0RPRiBjb250cm9sbGVyIHZpYSBnYW1lcGFkIChhbmQgc2hvdyByYXkpLlxuICogVml2ZTogNkRPRiBjb250cm9sbGVyIHZpYSBnYW1lcGFkIChhbmQgc2hvdyByYXkpLlxuICpcbiAqIEVtaXRzIHNlbGVjdGlvbiBldmVudHM6XG4gKiAgICAgcmF5b3ZlcihtZXNoKTogVGhpcyBtZXNoIHdhcyBzZWxlY3RlZC5cbiAqICAgICByYXlvdXQobWVzaCk6IFRoaXMgbWVzaCB3YXMgdW5zZWxlY3RlZC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5UmVuZGVyZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9wYXJhbXMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG5cbiAgICB2YXIgcGFyYW1zID0gb3B0X3BhcmFtcyB8fCB7fTtcblxuICAgIC8vIFdoaWNoIG9iamVjdHMgYXJlIGludGVyYWN0aXZlIChrZXllZCBvbiBpZCkuXG4gICAgdGhpcy5tZXNoZXMgPSB7fTtcblxuICAgIC8vIFdoaWNoIG9iamVjdHMgYXJlIGN1cnJlbnRseSBzZWxlY3RlZCAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMuc2VsZWN0ZWQgPSB7fTtcblxuICAgIC8vIFRoZSByYXljYXN0ZXIuXG4gICAgdGhpcy5yYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XG5cbiAgICAvLyBQb3NpdGlvbiBhbmQgb3JpZW50YXRpb24sIGluIGFkZGl0aW9uLlxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHRoaXMub3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgdGhpcy5yb290ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgICAvLyBBZGQgdGhlIHJldGljbGUgbWVzaCB0byB0aGUgcm9vdCBvZiB0aGUgb2JqZWN0LlxuICAgIHRoaXMucmV0aWNsZSA9IHRoaXMuY3JlYXRlUmV0aWNsZV8oKTtcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmV0aWNsZSk7XG5cbiAgICAvLyBBZGQgdGhlIHJheSB0byB0aGUgcm9vdCBvZiB0aGUgb2JqZWN0LlxuICAgIHRoaXMucmF5ID0gdGhpcy5jcmVhdGVSYXlfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJheSk7XG5cbiAgICAvLyBIb3cgZmFyIHRoZSByZXRpY2xlIGlzIGN1cnJlbnRseSBmcm9tIHRoZSByZXRpY2xlIG9yaWdpbi5cbiAgICB0aGlzLnJldGljbGVEaXN0YW5jZSA9IFJFVElDTEVfRElTVEFOQ0U7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gb2JqZWN0IHNvIHRoYXQgaXQgY2FuIGJlIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIGFkZChvYmplY3QpIHtcbiAgICB0aGlzLm1lc2hlc1tvYmplY3QuaWRdID0gb2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXZlbnQgYW4gb2JqZWN0IGZyb20gYmVpbmcgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHZhciBpZCA9IG9iamVjdC5pZDtcbiAgICBpZiAoIXRoaXMubWVzaGVzW2lkXSkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBleGlzdGluZyBtZXNoLCB3ZSBjYW4ndCByZW1vdmUgaXQuXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGN1cnJlbnRseSBzZWxlY3RlZCwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xuICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbb2JqZWN0LmlkXTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cbiAgICBmb3IgKGxldCBpZCBpbiB0aGlzLm1lc2hlcykge1xuICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcbiAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnRlcnNlY3RlZCA9IChpbnRlcnNlY3RzLmxlbmd0aCA+IDApO1xuICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgLy8gSWYgaXQncyBuZXdseSBzZWxlY3RlZCwgc2VuZCByYXlvdmVyLlxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQgJiYgIWlzU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cbiAgICAgIGlmICghaXNJbnRlcnNlY3RlZCAmJiBpc1NlbGVjdGVkKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcbiAgICogc2hvdWxkbid0IGJlIHJheWNhc3RpbmcuXG4gICAqL1xuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcbiAgICAvLyBJZiBub3RoaW5nIGNoYW5nZWQsIGRvIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUgPT0gaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICBsZXQgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVJheWNhc3Rlcl8oKSB7XG4gICAgdmFyIHJheSA9IHRoaXMucmF5Y2FzdGVyLnJheTtcblxuICAgIC8vIFBvc2l0aW9uIHRoZSByZXRpY2xlIGF0IGEgZGlzdGFuY2UsIGFzIGNhbGN1bGF0ZWQgZnJvbSB0aGUgb3JpZ2luIGFuZFxuICAgIC8vIGRpcmVjdGlvbi5cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnJldGljbGUucG9zaXRpb247XG4gICAgcG9zaXRpb24uY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBwb3NpdGlvbi5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgcG9zaXRpb24uYWRkKHJheS5vcmlnaW4pO1xuXG4gICAgLy8gU2V0IHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgcmF5IHNvIHRoYXQgaXQgZ29lcyBmcm9tIG9yaWdpbiB0b1xuICAgIC8vIHJldGljbGUuXG4gICAgdmFyIGRlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIGRlbHRhLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICB0aGlzLnJheS5zY2FsZS55ID0gZGVsdGEubGVuZ3RoKCk7XG4gICAgdmFyIGFycm93ID0gbmV3IFRIUkVFLkFycm93SGVscGVyKHJheS5kaXJlY3Rpb24sIHJheS5vcmlnaW4pO1xuICAgIHRoaXMucmF5LnJvdGF0aW9uLmNvcHkoYXJyb3cucm90YXRpb24pO1xuICAgIHRoaXMucmF5LnBvc2l0aW9uLmFkZFZlY3RvcnMocmF5Lm9yaWdpbiwgZGVsdGEubXVsdGlwbHlTY2FsYXIoMC41KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHJldGljbGUuXG4gICAqL1xuICBjcmVhdGVSZXRpY2xlXygpIHtcbiAgICAvLyBDcmVhdGUgYSBzcGhlcmljYWwgcmV0aWNsZS5cbiAgICBsZXQgaW5uZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShJTk5FUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IGlubmVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjlcbiAgICB9KTtcbiAgICBsZXQgaW5uZXIgPSBuZXcgVEhSRUUuTWVzaChpbm5lckdlb21ldHJ5LCBpbm5lck1hdGVyaWFsKTtcblxuICAgIGxldCBvdXRlckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KE9VVEVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgb3V0ZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHgzMzMzMzMsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIGxldCBvdXRlciA9IG5ldyBUSFJFRS5NZXNoKG91dGVyR2VvbWV0cnksIG91dGVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IHJldGljbGUgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICByZXRpY2xlLmFkZChpbm5lcik7XG4gICAgcmV0aWNsZS5hZGQob3V0ZXIpO1xuICAgIHJldHVybiByZXRpY2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSByZXRpY2xlIHRvIGEgcG9zaXRpb24gc28gdGhhdCBpdCdzIGp1c3QgaW4gZnJvbnQgb2YgdGhlIG1lc2ggdGhhdFxuICAgKiBpdCBpbnRlcnNlY3RlZCB3aXRoLlxuICAgKi9cbiAgbW92ZVJldGljbGVfKGludGVyc2VjdGlvbnMpIHtcbiAgICAvLyBJZiBubyBpbnRlcnNlY3Rpb24sIHJldHVybiB0aGUgcmV0aWNsZSB0byB0aGUgZGVmYXVsdCBwb3NpdGlvbi5cbiAgICBsZXQgZGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICAgIGlmIChpbnRlcnNlY3Rpb25zKSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgY29ycmVjdCBkaXN0YW5jZS5cbiAgICAgIGxldCBpbnRlciA9IGludGVyc2VjdGlvbnNbMF07XG4gICAgICBkaXN0YW5jZSA9IGludGVyLmRpc3RhbmNlO1xuICAgIH1cblxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3JlYXRlUmF5XygpIHtcbiAgICAvLyBDcmVhdGUgYSBjeWxpbmRyaWNhbCByYXkuXG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoUkFZX1JBRElVUywgUkFZX1JBRElVUywgMSwgMzIpO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoR1JBRElFTlRfSU1BR0UpLFxuICAgICAgLy9jb2xvcjogMHhmZmZmZmYsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcblxuICAgIHJldHVybiBtZXNoO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0KG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59XG4iXX0=
