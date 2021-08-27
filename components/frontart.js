import * as THREE from 'three'
import Roboto from '../fonts/Roboto.json';
import { centerObjects, leftObjects, mirrorObjects, rightObjects } from './data/modelData';
import React, {  Suspense, useState, useRef } from 'react'
import { Canvas, useFrame, createPortal } from '@react-three/fiber'
import { useGLTF, Stage, Sky, useFBO, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import {CenterModel, MirrorModel, StaticModel} from './models'
import { withRouter } from 'next/router'



// function getQueryVariable(variable) {
//   try { var query = window.location.search.substring(1); } catch {return;};
//   var vars = query.split("&");
//   for (var i=0;i<vars.length;i++) {
//     var pair = vars[i].split("=");
//     if(pair[0] == variable){return pair[1];}
//   }
//   return(false);
// }

// const center = getQueryVariable('center');
// const left = getQueryVariable('left');
// const mirror = getQueryVariable('mirror');
// const right = getQueryVariable('right');


const hydrateObject = (object) => {
  const {materialName, pathname, position, rotation, scale} = object;
  const { scene, nodes, materials } = useGLTF(`./about-pictures/${pathname}.glb`)

  const material = materials[materialName];
  console.log(object);
  const geometry = nodes[pathname].geometry;



  return {
    geometry,
    material,
    position,
    rotation,
    scale,
    scene
  }
}

function MagicMirror({ children, ...props }) {
  const cam = useRef()
  // useFBO creates a WebGL2 buffer for us, it's a helper from the "drei" library
  const fbo = useFBO()
  // The is a separate scene that we create, React will portal into that
  const [scene] = useState(() => new THREE.Scene())
  // Tie this component into the render-loop
  useFrame((state) => {
    // Our portal has its own camera, but we copy the originals world matrix
    cam.current.matrixWorldInverse.copy(state.camera.matrixWorldInverse)
    // Then we set the render-target to the buffer that we have created
    state.gl.setRenderTarget(fbo)
    // We render the scene into it, using the local camera that is clamped to the planes aspect ratio
    state.gl.render(scene, cam.current)
    // And flip the render-target to the default again
    state.gl.setRenderTarget(null)
  })
  return (
    <>
      <mesh {...props}>
        <planeGeometry args={[5, 10]} position={[0,10,10]} />
        {/* The "mirror" is just a boring plane, but it receives the buffer texture */}
        <meshBasicMaterial map={fbo.texture} />
      </mesh>
      <PerspectiveCamera manual ref={cam} fov={100} aspect={3 / 5} onUpdate={(c) => c.updateProjectionMatrix()} />
      {/* This is React being awesome, we portal this components children into the separate scene above */}
      {createPortal(children, scene)}
    </>
  )
}

function Lights() {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={3} color="red" />
      <pointLight intensity={30} position={[2, 30, 10]} color="red" />
      <pointLight intensity={6} position={[3, 1, 10]} color="blue" />
      <pointLight intensity={3} position={[3, 10, 30]} color="red" />
    </>
  )
}

function LoadingText() {
  const textOptions = {
    font: new THREE.FontLoader().parse(Roboto),
    size: .3,
    height: .12
  };

  return (
    <mesh>
      {/* <textGeometry attach='geometry' args={[`${centerObjectRaw.pathname}\n${leftObjectRaw.pathname}\n${rightObjectRaw.pathname}\n${mirrorObjectRaw.pathname}`, textOptions]} /> */}
      <meshStandardMaterial attach='material' />
    </mesh>
  );
}

const Models = ({ query }) => {
  const { center, left, mirror, right } = query;

  const centerObjectPlain = centerObjects.filter(object => object.name === center)[0];
  const leftObjectPlain = leftObjects.filter(object => object.name === left)[0];
  const mirrorObjectPlain = mirrorObjects.filter(object => object.name === mirror)[0];
  const rightObjectPlain = rightObjects.filter(object => object.name === right)[0];

  // debugger
  [centerObjectPlain, leftObjectPlain, mirrorObjectPlain, rightObjectPlain].map(object => {
      useGLTF.preload(`./about-pictures/${object.pathname}.glb`)
      return object;
  })
  
  const [ centerObject, leftObject, mirrorObject, rightObject ]
    = [centerObjectPlain, leftObjectPlain, mirrorObjectPlain, rightObjectPlain].map(hydrateObject);

 
  return (
    <>
      <MagicMirror position={[-13, 3.5, 0]} rotation={[0, 0, 0]}>
        <Lights />
        <Sky sunPosition={[10000, 10, 10000]} />
        <MirrorModel object={mirrorObject} />
      </MagicMirror>
      <StaticModel object={rightObject} />
      <StaticModel object={leftObject} />
      <CenterModel object={centerObject} />
    </>
  )
}

export function FrontArt({ router }) {
  const { query } = router;
  const controls = useRef()
  
  return (
    <div className="front-page_wrapper">
    <Canvas dpr={(1,2)} camera={{ position: [0, 4, 8], fov: 44.5 }} gl={{ alpha: false }}>
      <Lights />
      <Suspense fallback={<LoadingText />}>
        <Stage controls={controls}>
          <Models query={query} />
        </Stage>
      </Suspense>
      <OrbitControls ref={controls} />
    </Canvas>
    </div>
  )
}

export default withRouter(FrontArt)