/*
 *
 * This uses code from a THREE.js Multiplayer boilerplate made by Or Fleisher:
 * https://github.com/juniorxsound/THREE.Multiplayer
 * Aidan Nelson, April 2020
 *
 */
import { OrbitControls } from './three/jsm/OrbitControls.js';
import { GLTFLoader } from './three/jsm/GLTFLoader.js';
import { FBXLoader } from './three/jsm/FBXLoader.js';
import * as THREE from './three/three.module.js';
import { LoadingBar } from './libs/LoadingBar.js';

export class Scene {
  constructor() {

    //THREE scene
    this.scene = new THREE.Scene();

    //Utility
    this.width = window.innerWidth;
    this.height = window.innerHeight * 0.9;

    // lerp value to be used when interpolating positions and rotations
    this.lerpValue = 0;

    //THREE Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      5000
    );
    this.camera.position.set(0, 3, 6);
    this.scene.add(this.camera);

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    //THREE WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
      alpha: true
    });

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;

    this.renderer.setClearColor(new THREE.Color("lightblue"));
    this.renderer.setSize(this.width, this.height);
    // if(navigator.xr)
    // {
    //   const {xr} = this.renderer
    //   xr.enabled = true
    //   console.log("WebXr Enabled: " + xr.enabled)
      
    // }

    const immersiveOK = navigator.xr.isSessionSupported("immersive-vr");
    if (immersiveOK) {
      console.log('entrou no if')
    } else {
      console.log('entrou no else')
}
  

    // add controls:
    this.controls = new FirstPersonControls(this.scene, this.camera, this.renderer);

    //Push the canvas to the DOM
    let domElement = document.getElementById("canvas-container");
    domElement.append(this.renderer.domElement);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);

    // Helpers
    this.scene.add(new THREE.GridHelper(500, 500));
    this.scene.add(new THREE.AxesHelper(10));

    const light = new THREE.DirectionalLight( 0xFFFFFF, 1.5 );
    light.position.set( 0.2, 1, 1);
    this.scene.add(light);
  
//    this.loadGLTF();
    this.loadFBX();

        

    this.addLights();
    createEnvironment(this.scene);

    // Start the loop
    this.frameCount = 0;
    this.update();
  }

    //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Loaders
      
  loadGLTF(){
    const self = this;
    const loader = new GLTFLoader().setPath( '../../assets/');
     
    loader.load(
        'office-chair.glb',
        function(gltf){
            self.chair = gltf.scene;
            self.chair.scale.set(0.15, 0.15, 0.15);
            self.chair.position.set(5, 0, 0); // position system the loaded gltf file.
            const bbox = new THREE.Box3().setFromObject( gltf.scene);
            console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
            self.scene.add( gltf.scene );
            // self.loadingBar.visible = false;
            self.renderer.setAnimationLoop( self.render.bind(self));
        },
        // function(xhr){
        //     self.loadingBar.progress = (xhr.loaded / xhr.total);
        // },
        function(err){
            console.log('An error happened');
        }
    );
}


loadFBX(){
    const self = this;
    const loader = new FBXLoader().setPath( '../assets/');
     
    loader.load(
        'office-chair.fbx',
        function(object){
            self.chair = object;
            self.chair.scale.set(0.15, 0.15, 0.15);
            self.chair.position.set(5, 0, 0); // position system the loaded fbx file.
            const bbox = new THREE.Box3().setFromObject( object);
            console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
            self.scene.add( object );
            // self.loadingBar.visible = false;
            self.renderer.setAnimationLoop( self.render.bind(self));
        },
        // function(xhr){
        //     self.loadingBar.progress = (xhr.loaded / xhr.total);
        // },
        function(err){
            console.log('An error happened');
        }
    );
}


  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Lighting 💡

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffe6, 0.7));
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Clients 👫

  // add a client meshes, a video element and  canvas for three.js video texture
  addClient(id, peers) {
    let videoMaterial = makeVideoMaterial(id);
    let otherMat = new THREE.MeshNormalMaterial();

    let head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [otherMat,otherMat,otherMat,otherMat,otherMat,videoMaterial]);

    // set position of head before adding to parent object
    head.position.set(0, 0, 0);

    // https://threejs.org/docs/index.html#api/en/objects/Group
    var group = new THREE.Group();
    group.add(head);

    // add group to scene
    this.scene.add(group);
    console.log("before error: " + peers[id].group)
    peers[id].group = group;
    console.log("after error: " + peers[id].group)
    peers[id].previousPosition = new THREE.Vector3();
    peers[id].previousRotation = new THREE.Quaternion();
    peers[id].desiredPosition = new THREE.Vector3();
    peers[id].desiredRotation = new THREE.Quaternion();
  }

  removeClient(id, peers) {
    this.scene.remove(peers[id].group);
  }

  // overloaded function can deal with new info or not
  updateClientPositions(clientProperties, mySocket, peers) {
    this.lerpValue = 0;
    for (let id in clientProperties) {
      if (id != mySocket.id) {

        peers[id].previousPosition.copy(peers[id].group.position);
        peers[id].previousRotation.copy(peers[id].group.quaternion);
        peers[id].desiredPosition = new THREE.Vector3().fromArray(
          clientProperties[id].position
        );
        peers[id].desiredRotation = new THREE.Quaternion().fromArray(
          clientProperties[id].rotation
        );
      }
    }
  }

  interpolatePositions(peers) {
    this.lerpValue += 0.1; // updates are sent roughly every 1/5 second == 10 frames
    for (let id in peers) {
      if (peers[id].group) {
        peers[id].group.position.lerpVectors(peers[id].previousPosition,peers[id].desiredPosition, this.lerpValue);
        peers[id].group.quaternion.slerpQuaternions(peers[id].previousRotation,peers[id].desiredRotation, this.lerpValue);
      }
    }
  }

  updateClientVolumes(peers) {
    for (let id in peers) {
      let audioEl = document.getElementById(id + "_audio");
      if (audioEl && peers[id].group) {
        let distSquared = this.camera.position.distanceToSquared(
          peers[id].group.position
        );

        if (distSquared > 500) {
          audioEl.volume = 0;
        } else {
          // from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
          let volume = Math.min(1, 10 / distSquared);
          audioEl.volume = volume;
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Interaction 🤾‍♀️

  getPlayerPosition() {
    // TODO: use quaternion or are euler angles fine here?
    return [
      [
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ],
      [
        this.camera.quaternion._x,
        this.camera.quaternion._y,
        this.camera.quaternion._z,
        this.camera.quaternion._w,
      ],
    ];
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Rendering 🎥

  update(peers) {
    requestAnimationFrame(() => this.update(peers));
    this.frameCount++;

    updateEnvironment();

    if (this.frameCount % 25 === 0) {
      this.updateClientVolumes(peers);
    }

    this.interpolatePositions(peers);
    this.controls.update();
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Event Handlers 🍽

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = Math.floor(window.innerHeight * 0.9);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// Utilities

function makeVideoMaterial(id) {
  let videoElement = document.getElementById(id + "_video");
  let videoTexture = new THREE.VideoTexture(videoElement);

  let videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    overdraw: true,
    side: THREE.DoubleSide,
  });

  return videoMaterial;
}
