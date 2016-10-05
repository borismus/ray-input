import dat from 'dat-gui';
import DaydreamSimulator from './daydream-simulator';
import DaydreamArmModel from '../daydream-arm-model';

var simulator;
var model;
var controllerOrientation = new THREE.Quaternion();
var headOrientation = new THREE.Quaternion();
var headPosition = new THREE.Vector3(0, 1.6, 0);
var params;

function onLoad() {
  model = new DaydreamArmModel();
  simulator = new DaydreamSimulator(model);

  buildGui();

  render();
}

var SimulatorParams = function() {
  this.controllerPitch = 0;
  this.controllerYaw = 0;
  this.headPitch = 0;
  this.headYaw = 0;
};

function buildGui() {
  params = new SimulatorParams();
  var gui = new dat.GUI();
  gui.add(params, 'controllerPitch', -90, 90);
  gui.add(params, 'controllerYaw', -180, 180);
  gui.add(params, 'headPitch', -90, 90);
  gui.add(params, 'headYaw', -180, 180);
}

function render() {
  // Get simulated orientation and camera direction.
  var controllerEuler = new THREE.Euler(
    THREE.Math.degToRad(params.controllerPitch),
    THREE.Math.degToRad(params.controllerYaw), 0, 'YXZ')
  controllerOrientation.setFromEuler(controllerEuler);

  var headEuler = new THREE.Euler(
    THREE.Math.degToRad(params.headPitch),
    THREE.Math.degToRad(params.headYaw), 0, 'YXZ')
  headOrientation.setFromEuler(headEuler);

  // Feed orientation into arm model.
  model.setControllerOrientation(controllerOrientation);
  model.setHeadOrientation(headOrientation);
  model.setHeadPosition(headPosition);
  model.update();

  // Update the simulator.
  simulator.render();

  requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);
