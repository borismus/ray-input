/**
 * TODO(smus): Finish this class, or potentially remove it. Rendering
 * controllers is potentially something that should be handled by another
 * library.
 */
const ControllerTypes = {
  NONE: 0,
  DAYDREAM: 1,
  VIVE: 2,
};

/**
 * Renders a VR controller.
 *
 * TODO(smus): Also render all of the buttons.
 */
export default class ControllerRenderer {

  constructor() {
    this.root = new THREE.Object3D();

    // Add the daydream controller to the root of the object.
    this.daydreamController = this.createDaydreamController_();
    this.root.add(this.daydreamController);

    // The type of controller.
    this.type = ControllerTypes.NONE;
  }

  setType(type) {
    this.type = type;
  }

  getMesh() {
    return this.root;
  }

  setActive(isActive) {
    // Change the texture of the daydream controller.
    var texture = isActive ?
        this.daydreamTextures.active : this.daydreamTextures.inactive;
    // TODO: Fix this ugliness.
    this.daydreamController.children[0].material.map = texture;
  }

  setPosition(position) {
    this.position.copy(position);
  }

  setOrientation(quaternion) {
    this.orientation.copy(quaternion);
  }

  update() {
    // Position the controller at the origin.
    var position = this.daydreamController.position;
    position.copy(ray.direction);
    position.multiplyScalar(1);
    position.add(ray.origin);
    this.daydreamController.position.copy(this.position);
    this.daydreamController.quaternion.copy(this.orientation);
  }

  createDaydreamController_() {
    // Loads a daydream controller model and textures it.
    var loader = new THREE.ObjectLoader();
    var out = new THREE.Object3D();
    loader.load('static/models/ddcontroller.json', function(obj) {
      // The model is ~100 units long.
      obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 50, 0));
      //obj.geometry.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI));
      out.add(obj);
    });

    // Scale to be much smaller.
    out.scale.multiplyScalar(0.01);

    this.daydreamTextures = {
      active: THREE.ImageUtils.loadTexture('static/textures/ddcontroller_touchpad.png'),
      inactive: THREE.ImageUtils.loadTexture('static/textures/ddcontroller_idle.png'),
    };

    return out;
  }

  createViveController_() {
    /*
    var geometry = new THREE.SphereGeometry( 1, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.z = 5;
    return sphere;
    */
  }

}
