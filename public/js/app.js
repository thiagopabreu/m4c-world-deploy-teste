import * as THREE from './three/three.module.js';
import { GLTFLoader } from './three/jsm/GLTFLoader.js';
import { FBXLoader } from './three/jsm/FBXLoader.js';
import { RGBELoader } from './three/jsm/RGBELoader.js';
import { OrbitControls } from './three/jsm/OrbitControls.js';
import { LoadingBar } from './libs/LoadingBar.js';


class App{
	constructor(){
		this.init();
		// const container = document.createElement( 'div' );
		// document.body.appendChild( container );
		
		// this.camera = new THREE.PerspectiveCamera( 
		// 60, 
		// window.innerWidth/window.innerHeight,
		// 0.1,
		// 100
		// );

        // this.camera.position.set(0,0,4);
		// this.scene = new THREE.Scene();
		// this.scene.background = new THREE.Color ( 0xaaaaaa );

		// const ambient = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 0.3);
		// this.scene.add( ambient );

		// const light = new THREE.DirectionalLight();
		// light.position.set(0.2, 1, 1);
		// this.scene.add(light);

		// this.renderer = new THREE.WebGLRenderer( {antialia: true, alpha: true});
		// this.renderer.setPixelRatio( window.devicePixelRatio);
		// this.renderer.setSize( window.innerWidth, window.innerHeight);
		// container.appendChild(this.renderer.domElement);

		// this.renderer.setAnimationLoop(this.render.bind(this));

		// const geometry = new THREE.BoxBufferGeometry();
		// const material = new THREE.MeshStandardMaterial ({color: 0xff0000});

		// this.mesh = new THREE.Mesh( geometry, material);
		// this.scene.add( this.mesh );
		// const controls = new OrbitControls( this.camera, this.renderer.domElement );

        // window.addEventListener('resize', this.resize.bind(this) );
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 4, 14 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xaaaaaa );
        
		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight( 0xFFFFFF, 1.5 );
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild( this.renderer.domElement );
		this.setEnvironment();
		
        this.loadingBar = new LoadingBar();
        
        // this.loadGLTF();
        this.loadFBX();
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    // resize(){
    //     this.camera.aspect = window.innerWidth / window.innerHeight;
    //     this.camera.updateProjectionMatrix();
    //     this.renderer.setSize( window.innerWidth, window.innerHeight );  
    // }
    
	// render( ) {  
	// 	this.mesh.rotateY(0.01);
	// 	this.renderer.render( this.scene, this.camera );
    // }
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
    
    loadGLTF(){
        const self = this;
        const loader = new GLTFLoader().setPath( '../../assets/');
         
        loader.load(
            'office-chair.glb',
            function(gltf){
                self.chair = gltf.scene;
                const bbox = new THREE.Box3().setFromObject( gltf.scene);
                console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
                self.scene.add( gltf.scene );
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self));
            },
            function(xhr){
                self.loadingBar.progress = (xhr.loaded / xhr.total);
            },
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
                const bbox = new THREE.Box3().setFromObject( object);
                console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
                self.scene.add( object );
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self));
            },
            function(xhr){
                self.loadingBar.progress = (xhr.loaded / xhr.total);
            },
            function(err){
                console.log('An error happened');
            }
        );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.chair.rotateY( 0.01 );
        this.renderer.render( this.scene, this.camera );
    }


////////////////////////////////////////////////////////////////////////////////
	// Socket.io
	////////////////////////////////////////////////////////////////////////////////
	
	// establishes socket connection
	initSocketConnection() {
		console.log("Initializing socket.io...");
		mySocket = io();
	  
		mySocket.on("connect", () => {
		  console.log("My socket ID:", mySocket.id);
		});
	  
		//On connection server sends the client his ID and a list of all keys
		mySocket.on("introduction", (otherClientIds) => {
	  
		  // for each existing user, add them as a client and add tracks to their peer connection
		  for (let i = 0; i < otherClientIds.length; i++) {
			if (otherClientIds[i] != mySocket.id) {
			  let theirId = otherClientIds[i];
	  
			  console.log("Adding client with id " + theirId);
			  peers[theirId] = {};
	  
			  let pc = createPeerConnection(theirId, true);
			  peers[theirId].peerConnection = pc;
	  
			  createClientMediaElements(theirId);
	  
			  myScene.addClient(theirId);
	  
			}
		  }
		});
	  
		// when a new user has entered the server
		mySocket.on("newUserConnected", (theirId) => {
		  if (theirId != mySocket.id && !(theirId in peers)) {
			console.log("A new user connected with the ID: " + theirId);
	  
			console.log("Adding client with id " + theirId);
			peers[theirId] = {};
	  
			createClientMediaElements(theirId);
	  
			myScene.addClient(theirId);
		  }
		});
	  
		mySocket.on("userDisconnected", (clientCount, _id, _ids) => {
		  // Update the data from the server
	  
		  if (_id != mySocket.id) {
			console.log("A user disconnected with the id: " + _id);
			myScene.removeClient(_id);
			removeClientVideoElementAndCanvas(_id);
			delete peers[_id];
		  }
		});
	  
		mySocket.on("signal", (to, from, data) => {
		  // console.log("Got a signal from the server: ", to, from, data);
	  
		  // to should be us
		  if (to != mySocket.id) {
			console.log("Socket IDs don't match");
		  }
	  
		  // Look for the right simplepeer in our array
		  let peer = peers[from];
		  if (peer.peerConnection) {
			peer.peerConnection.signal(data);
		  } else {
			console.log("Never found right simplepeer object");
			// Let's create it then, we won't be the "initiator"
			// let theirSocketId = from;
			let peerConnection = createPeerConnection(from, false);
	  
			peers[from].peerConnection = peerConnection;
	  
			// Tell the new simplepeer that signal
			peerConnection.signal(data);
		  }
		});
	  
		// Update when one of the users moves in space
		mySocket.on("positions", (_clientProps) => {
		  myScene.updateClientPositions(_clientProps);
		});
	  }
	  
	  ////////////////////////////////////////////////////////////////////////////////
	  // Clients / WebRTC
	  ////////////////////////////////////////////////////////////////////////////////
	  
	  // this function sets up a peer connection and corresponding DOM elements for a specific client
	  createPeerConnection(theirSocketId, isInitiator = false) {
		console.log('Connecting to peer with ID', theirSocketId);
		console.log('initiating?', isInitiator);
	  
		let peerConnection = new SimplePeer({ initiator: isInitiator })
		// simplepeer generates signals which need to be sent across socket
		peerConnection.on("signal", (data) => {
		  // console.log('signal');
		  mySocket.emit("signal", theirSocketId, mySocket.id, data);
		});
	  
		// When we have a connection, send our stream
		peerConnection.on("connect", () => {
		  // Let's give them our stream
		  peerConnection.addStream(localMediaStream);
		  console.log("Send our stream");
		});
	  
		// Stream coming in to us
		peerConnection.on("stream", (stream) => {
		  console.log("Incoming Stream");
	  
		  updateClientMediaElements(theirSocketId, stream);
		});
	  
		peerConnection.on("close", () => {
		  console.log("Got close event");
		  // Should probably remove from the array of simplepeers
		});
	  
		peerConnection.on("error", (err) => {
		  console.log(err);
		});
	  
		return peerConnection;
	  }
	  
	  // temporarily pause the outgoing stream
	  disableOutgoingStream() {
		localMediaStream.getTracks().forEach((track) => {
		  track.enabled = false;
		});
	  }
	  // enable the outgoing stream
	  enableOutgoingStream() {
		localMediaStream.getTracks().forEach((track) => {
		  track.enabled = true;
		});
	  }
	  
	  ////////////////////////////////////////////////////////////////////////////////
	  // Three.js
	  ////////////////////////////////////////////////////////////////////////////////
	  
	  onPlayerMove() {
		// console.log('Sending movement update to server.');
	  
	  }
	  
  
	  

	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	// Utilities 🚂
	
	// created <video> element for local mediastream
	createLocalVideoElement() {
		const videoElement = document.createElement("video");
		videoElement.id = "local_video";
		videoElement.autoplay = true;
		videoElement.width = videoWidth;
		videoElement.height = videoHeight;
		// videoElement.style = "visibility: hidden;";
	  
		if (localMediaStream) {
		  let videoStream = new MediaStream([localMediaStream.getVideoTracks()[0]]);
	  
		  videoElement.srcObject = videoStream;
		}
		document.body.appendChild(videoElement);
	  }
	  
	  // created <video> element using client ID
	  createClientMediaElements(_id) {
		console.log("Creating <html> media elements for client with ID: " + _id);
	  
		const videoElement = document.createElement("video");
		videoElement.id = _id + "_video";
		videoElement.autoplay = true;
		// videoElement.style = "visibility: hidden;";
	  
		document.body.appendChild(videoElement);
	  
		// create audio element for client
		let audioEl = document.createElement("audio");
		audioEl.setAttribute("id", _id + "_audio");
		audioEl.controls = "controls";
		audioEl.volume = 1;
		document.body.appendChild(audioEl);
	  
		audioEl.addEventListener("loadeddata", () => {
		  audioEl.play();
		});
	  }
	  
	  updateClientMediaElements(_id, stream) {
	  
		let videoStream = new MediaStream([stream.getVideoTracks()[0]]);
		let audioStream = new MediaStream([stream.getAudioTracks()[0]]);
	  
		const videoElement = document.getElementById(_id + "_video");
		videoElement.srcObject = videoStream;
	  
		let audioEl = document.getElementById(_id + "_audio");
		audioEl.srcObject = audioStream;
	  }
	  
	  // remove <video> element and corresponding <canvas> using client ID
	  removeClientVideoElementAndCanvas(_id) {
		console.log("Removing <video> element for client with id: " + _id);
	  
		let videoEl = document.getElementById(_id + "_video");
		if (videoEl != null) {
		  videoEl.remove();
		}
	  }

	init(){
	// socket.io
	let mySocket;
	
	// array of connected clients
	let peers = {};
	
	// Variable to store our three.js scene:
	let myScene;
	
	// set video width / height / framerate here:
	const videoWidth = 80;
	const videoHeight = 60;
	const videoFrameRate = 15;
	
	// Our local media stream (i.e. webcam and microphone stream)
	let localMediaStream = null;
	
	// Constraints for our local audio/video stream
	let mediaConstraints = {
	  audio: true,
	  video: {
		width: videoWidth,
		height: videoHeight,
		frameRate: videoFrameRate,
	  },
	};
	
	////////////////////////////////////////////////////////////////////////////////
	// Start-Up Sequence:
	////////////////////////////////////////////////////////////////////////////////
	
	window.onload = async () => {
	  console.log("Window loaded.");
	
	  // first get user media
	  localMediaStream = await getMedia(mediaConstraints);
	
	  createLocalVideoElement();
	
	  // then initialize socket connection
	  initSocketConnection();
	
	  // finally create the threejs scene
	  console.log("Creating three.js scene...");
	  myScene = new Scene();
	
	  // start sending position data to the server
	  setInterval(function () {
		mySocket.emit("move", myScene.getPlayerPosition());
	  }, 200);
	};
	
	////////////////////////////////////////////////////////////////////////////////
	// Local media stream setup
	////////////////////////////////////////////////////////////////////////////////
	
	// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	async function getMedia(_mediaConstraints) {
	  let stream = null;
	
	  try {
		stream = await navigator.mediaDevices.getUserMedia(_mediaConstraints);
	  } catch (err) {
		console.log("Failed to get user media!");
		console.warn(err);
	  }
	
	  return stream;
	}
	}
	
}

export { App };