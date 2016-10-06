Ray.js: generalized VR input
============================

Ray.js is a JavaScript library that provides an input abstraction for
interacting with 3D VR content in the browser. It supports a variety of
environments: desktop, mobile, and VR. In VR mode, behavior depends on if
there's a motion controller, and whether the controller has positional tracking
in addition to orientation tracking. For a higher level description of the
library, see [Cross device 3D input][smus].

[smus]: http://smus.com/ray-js-cross-device-3d-input

Ray.js depends on THREE.js. You register interactive objects with Ray.js and
subscribe to events on those objects. Events include:

- `action`: an object is activated (eg. clicked)
- `release`: an object is deactivated (eg. finger lifted)
- `cancel`: something stops activation (eg. you mouse-scroll to look around)
- `select`: an object is selected (eg. hovered on, looked at)
- `deselect`: an object is no longer selected (eg. blurred, looked away from)


## Usage

Get the module from npm:

    npm install ray.js

Then, in your code, import the ES6 module (require and standalone mode should
also work):

    import RayInput from 'ray-input'

## API

How to instantiate the input library:

    var input = new RayInput();

How to register objects that can be interacted with:

    input.add(object);

    // Register a callback whenever an object is acted on.
    input.on('action', (opt_mesh) => {
      // Called when an object was activated. If there is a selected object,
      // opt_mesh is that object.
    });

    // Register a callback when an object is selected.
    input.on('select', (mesh) => {
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

How to customize the ray:

    // Forces the ray to be visible.
    input.setRayVisible(true);
