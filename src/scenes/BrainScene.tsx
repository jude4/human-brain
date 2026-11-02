import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars, useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { regions, type Region } from '../data/regions';
export type Mode='anatomy'|'activity'|'transparent';
interface Props {mode:Mode;paused:boolean;labels:boolean;selected:Region|null;onSelect:(r:Region)=>void;reset:number;reduced:boolean;rotationSpeed:number;separation:number}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="scene-error"><b>3D viewer unavailable</b><p>The local anatomical asset or WebGL could not load. You can still explore all six regions below.</p><button onClick={()=>location.reload()}>Retry viewer</button></div>:this.props.children}}
function Cortex({mode,separation,reduced}: {mode:Mode;separation:number;reduced:boolean}){
 const gltf=useGLTF('/models/human-brain.glb');
 const material=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#c7988d',roughness:.57,metalness:.08,clearcoat:.15,side:THREE.DoubleSide,transparent:true}),[]);
 const clone=useMemo(()=>{const c=gltf.scene.clone();c.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.computeVertexNormals();o.material=material}});return c},[gltf,material]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame((_,dt)=>{const t=reduced?1:1-Math.exp(-dt*4);material.color.lerp(new THREE.Color(mode==='anatomy'?'#c7988d':mode==='activity'?'#3c6d7e':'#78c8db'),t);material.opacity=THREE.MathUtils.lerp(material.opacity,mode==='transparent'?.19:mode==='activity'?.65:1,t);material.emissive.lerp(new THREE.Color(mode==='anatomy'?'#160e16':'#103e50'),t);material.depthWrite=mode!=='transparent';clone.children.forEach((o,i)=>{o.position.z=THREE.MathUtils.lerp(o.position.z,(i===0?-1:1)*separation*.55,t)})});
 return <primitive object={clone}/>;
}
function Signals({mode,paused,reduced}:{mode:Mode;paused:boolean;reduced:boolean}){
 const group=useRef<THREE.Group>(null);const time=useRef(0);
 const paths=useMemo(()=>Array.from({length:20},(_,i)=>{const a=i*2.399;return new THREE.CatmullRomCurve3(Array.from({length:5},(_,j)=>{const b=a+j*.7;return new THREE.Vector3(Math.cos(b)*(1.15-j*.08),Math.sin(j*.9+a)*.9,Math.sin(b)*.86)}))}),[]);
 useFrame((_,dt)=>{if(!paused&&!reduced)time.current+=dt;group.current?.children.forEach((o,i)=>o.position.copy(paths[i].getPoint((time.current*.10+i/20)%1)))});
 return <group visible={mode!=='anatomy'}>{paths.map((p,i)=><Line key={i} points={p.getPoints(30)} color={i%3?'#55d9da':'#b6a0ff'} transparent opacity={mode==='activity'?.28:.15} lineWidth={.7}/>)}<group ref={group}>{paths.map((_,i)=><mesh key={i}><sphereGeometry args={[.025,8,8]}/><meshBasicMaterial color={i%3?'#9ffff5':'#d3b5ff'}/></mesh>)}</group></group>
}
function Hotspot({region,selected,labels,onSelect,animate,separation}:{region:Region;selected:boolean;labels:boolean;animate:boolean;separation:number;onSelect:(r:Region)=>void}){
 const [hover,setHover]=useState(false);const ref=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{if(ref.current)ref.current.scale.setScalar(selected?1.35: hover?1.2:1+(animate?Math.sin(clock.elapsedTime*2)*.08:0))});
 const click=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(region)};
 return <group position={[region.position[0],region.position[1],region.position[2]+(['brainstem','cerebellum'].includes(region.id)?0:separation*.55)]}>
 <mesh ref={ref} onClick={click} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor=''}}><sphereGeometry args={[.065,16,16]}/><meshBasicMaterial color={selected||hover?'#ffffff':region.color} depthTest={false} transparent opacity={.95}/></mesh>
 {<><Line visible={labels||hover||selected} points={[[0,0,0],[region.position[0]<0?-.32:.32,.19,.1],[region.position[0]<0?-.65:.65,.19,.1]]} color={region.color} transparent opacity={selected||hover?.85:.4}/><Html position={[region.position[0]<0?-.68:.68,.2,.1]} center style={{display:labels||hover||selected?'block':'none'}} zIndexRange={[10,0]}><button className={`anatomy-label ${selected?'selected':''}`} style={{color:region.color}} onClick={()=>onSelect(region)}>{region.name}<span>{region.id==='cerebellum'||region.id==='brainstem'?'REFERENCE LOCATION':'EXPLORE REGION'}</span></button></Html></>}
 </group>
}
function World(p:Props){
 const controls=useRef<Controls>(null);
 const cameraGoal=useRef<THREE.Vector3|null>(null);
 const targetGoal=useRef(new THREE.Vector3());
 const transitionTime=useRef(0);
 const dragging=useRef(false);
 const lastInteraction=useRef(-Infinity);
 const firstView=useRef(true);
 const scan=useRef<THREE.Mesh>(null);
 const time=useRef(0);
 useEffect(()=>{
  // Do not fight OrbitControls with a camera transition on the opening frame.
  if(firstView.current){firstView.current=false;return}
  transitionTime.current=0;
  if(!p.selected){cameraGoal.current=new THREE.Vector3(0,.25,5.6);targetGoal.current.set(0,0,0)}
  else {const v=new THREE.Vector3(...p.selected.position);targetGoal.current.copy(v).multiplyScalar(.25);cameraGoal.current=new THREE.Vector3(v.x*.9,.55+v.y*.3,4.5)}
 },[p.selected,p.reset]);
 useFrame(({camera},dt)=>{
  const orbit=controls.current;
  if(orbit){
   orbit.autoRotate=!p.paused&&!p.reduced&&!p.selected&&!dragging.current&&!cameraGoal.current&&performance.now()-lastInteraction.current>1800;
   if(cameraGoal.current){
    transitionTime.current+=dt;
    const blend=p.reduced?1:1-Math.exp(-dt*5);
    camera.position.lerp(cameraGoal.current,blend);
    orbit.target.lerp(targetGoal.current,blend);
    if(p.reduced||transitionTime.current>1.25){camera.position.copy(cameraGoal.current);orbit.target.copy(targetGoal.current);cameraGoal.current=null}
    orbit.update();
   }
  }
  if(!p.paused&&!p.reduced)time.current+=dt;
  if(scan.current){scan.current.position.y=(time.current*.22%3.6)-1.8;scan.current.visible=!p.reduced&&!p.paused&&time.current%16<8}
 });
 return <><ambientLight intensity={.65}/><directionalLight position={[-3,4,5]} intensity={2.7} color="#f6d8cb"/><directionalLight position={[3,1,-2]} intensity={4} color="#578afc"/><pointLight position={[-3,-1,2]} intensity={6} color="#42d7ce"/>
 <Suspense fallback={null}><group><Cortex mode={p.mode} separation={p.separation} reduced={p.reduced}/><Signals mode={p.mode} paused={p.paused} reduced={p.reduced}/>{regions.map(r=><Hotspot key={r.id} region={r} selected={p.selected?.id===r.id} labels={p.labels} animate={!p.paused&&!p.reduced} separation={p.separation} onSelect={p.onSelect}/>)}</group></Suspense>
 <mesh ref={scan} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.6,1.615,90]}/><meshBasicMaterial color="#59dccc" transparent opacity={.15} side={THREE.DoubleSide}/></mesh>
 <Stars radius={30} depth={15} count={550} factor={1.6} saturation={.4} fade speed={p.paused||p.reduced?0:.3}/>
 <OrbitControls ref={controls} enableDamping={!p.paused&&!p.reduced} dampingFactor={.07} minDistance={3} maxDistance={9} autoRotateSpeed={p.rotationSpeed} onStart={()=>{cameraGoal.current=null;dragging.current=true}} onEnd={()=>{dragging.current=false;lastInteraction.current=performance.now()}}/>
 <Orientation controls={controls}/></>
}
function Orientation({controls}:{controls:React.RefObject<Controls|null>}){const ref=useRef<HTMLDivElement>(null);useFrame(()=>{if(ref.current&&controls.current)ref.current.style.transform=`rotate(${controls.current.getAzimuthalAngle()*180/Math.PI}deg)`});return <Html fullscreen style={{pointerEvents:'none'}}><div className="orientation"><div ref={ref} data-testid="orientation-compass">S<span>R</span><i/>L</div><small>ORIENTATION</small></div></Html>}
function Loading(){const {active}=useProgress();return active?<div className='loading-overlay'><div className='loading'><span/>Assembling cortical connections…</div></div>:null}
export default function BrainScene(props:Props){const [supported]=useState(()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}});return <SceneBoundary><Loading/>{supported?<Canvas dpr={[1,1.7]} camera={{position:[0,.25,5.6],fov:window.innerWidth<580?48:38}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><World {...props}/></Canvas>:<div className="scene-error"><b>WebGL is unavailable</b><p>Enable hardware acceleration to explore in 3D. Educational region controls remain available below.</p></div>}</SceneBoundary>}
