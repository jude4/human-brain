import { useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Settings2, X } from 'lucide-react';
interface Props {
 touring:boolean; onTour:()=>void; onStep:(direction:number)=>void;
 rotationSpeed:number; onSpeed:(speed:number)=>void;
 separation:number; onSeparation:(amount:number)=>void;
 selectedName?:string; paused:boolean; reduced:boolean;
}
export default function ExplorationTools(p:Props){
 const [settings,setSettings]=useState(false);
 return <div className="exploration-tools">
  <div className="explore-toolbar">
   <button className={p.touring?'tour-active':''} onClick={p.onTour} aria-pressed={p.touring}><Compass size={14}/>{p.touring?'End guided tour':'Take a guided tour'}</button>
   <div className="region-steppers"><button aria-label="Previous brain region" onClick={()=>p.onStep(-1)}><ChevronLeft size={15}/></button><button aria-label="Next brain region" onClick={()=>p.onStep(1)}><ChevronRight size={15}/></button></div>
   <button aria-label="Viewer settings" aria-expanded={settings} onClick={()=>setSettings(v=>!v)}>{settings?<X size={15}/>:<Settings2 size={15}/>}</button>
  </div>
  <div className="rotation-status" role="status">{p.touring?`GUIDED TOUR · ${p.paused?'PAUSED':p.selectedName?.toUpperCase()}`:p.paused?'ANIMATION PAUSED':p.reduced?'REDUCED MOTION':p.selectedName?'REGION FOCUS · DRAG TO EXPLORE':'AUTO-ROTATION ON · DRAG TO TAKE CONTROL'}</div>
  {settings&&<div className="viewer-settings">
   <label htmlFor="rotation-speed">Rotation speed <output>{p.rotationSpeed.toFixed(1)}×</output></label>
   <input id="rotation-speed" type="range" min="0.3" max="2" step="0.1" value={p.rotationSpeed} onChange={e=>p.onSpeed(Number(e.target.value))}/>
   <label htmlFor="hemisphere-spacing">Separate hemispheres <output>{Math.round(p.separation*100)}%</output></label>
   <input id="hemisphere-spacing" type="range" min="0" max="1" step="0.05" value={p.separation} onChange={e=>p.onSeparation(Number(e.target.value))}/>
   <p>Exploded cortical view. Spacing is illustrative; this does not expose additional anatomical structures.</p>
  </div>}
 </div>
}
