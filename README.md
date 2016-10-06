Ray.js: generalized VR input
============================

Ray.js is a JavaScript library that provides an input abstraction for
interacting with 3D VR content in the browser. It supports a variety of
environments:

- On desktop, look around by dragging, interact by clicking.
- On mobile, look around via magic window or touch pan, interact by tapping.
- In Cardboard (3DOF head), use a reticle to interact with objects.
- In Daydream (3DOF head / 3DOF hand), use the Daydream controller to interact with objects.
- In Vive (6DOF head / 6DOF hand), use the Vive controller to interact with objects.


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
    input.on('action', (opt_object) => {
      // Reports an action, regardless of whether this specific object was
      // selected at the time.
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
