Ray Input: default WebVR interaction
====================================

Ray Input is a JavaScript library that provides an input abstraction for
interacting with 3D VR content in the browser. It supports a variety of
environments: desktop, mobile, and VR. In VR mode, behavior depends on if
there's a motion controller, and whether the controller has positional tracking
in addition to orientation tracking. For a higher level description of the
library, see [sane defaults for VR input][smus].

[smus]: http://smus.com/ray-input-webvr-interaction-patterns/

Ray.js depends on THREE.js. You register interactive objects with Ray.js and
subscribe to events on those objects. Events include:

- `raydown`: an object is activated (eg. clicked)
- `rayup`: an object is deactivated (eg. finger lifted)
- `raycancel`: something stops activation (eg. you mouse-scroll to look around)
- `rayover`: an object is selected (eg. hovered on, looked at)
- `rayout`: an object is no longer selected (eg. blurred, looked away from)


## Usage

Get the module from npm:

    npm install ray-input

Then, in your code, import the ES6 module:

    import RayInput from 'ray-input'

You can also use require.js:

    require('./ray-input')

Or you can use the script standalone, but you may need to use `new
RayInput.default()`:

    <script src="build/ray.min.js"></script>

## API

How to instantiate the input library:

    // Here, camera is an instance of THREE.Camera,
    // If second HTMLElement arg is provided, it will be addEventListener'ed.
    var input = new RayInput(camera, renderer.domElement);

How to register objects that can be interacted with:

    input.add(object);

    // Register a callback whenever an object is acted on.
    input.on('raydown', (opt_mesh) => {
      // Called when an object was activated. If there is a selected object,
      // opt_mesh is that object.
    });

    // Register a callback when an object is selected.
    input.on('rayover', (mesh) => {
      // Called when an object was selected.
    });

How to unregister objects so that they can't be interacted with:

    input.remove(object);

How to set basic attributes on the input system:.

    // Sets the size of the input surface for ray casting. Generally this is
    // the same as the renderer.domElement.
    input.setSize(renderer.getSize());

    // Update the input system in a game loop.
    input.update();


## Future

Open to pull requests that allow customization. Ideas include:

- Adjust the length of the ray.
- Specify the shape of the reticle.
- Support for multiple controllers (especially 6DOF).
- Support for left handed Daydream arm models.
- Support a mode where only the closest object gets ray events. This has some
  implications. For example, when ray moves from background to foreground
  object, the background gets a `rayout`, while the foreground gets a `rayover`.
