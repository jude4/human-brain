import * as THREE from 'three';

/** A restrained, nonmetallic tissue finish. Grain is artistic, not histology. */
export function createCortexMaterial(){
 const material=new THREE.MeshPhysicalMaterial({
  color:'#d9b5aa',vertexColors:true,roughness:.76,metalness:0,
  clearcoat:.025,clearcoatRoughness:.65,sheen:.18,
  sheenColor:new THREE.Color('#d9a19b'),sheenRoughness:.85,
  side:THREE.DoubleSide,transparent:true,
 });
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vTissuePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTissuePosition = position;');
  shader.fragmentShader=`
   varying vec3 vTissuePosition;
   float tissueHash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float tissueNoise(vec3 p){
    vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(tissueHash(i),tissueHash(i+vec3(1,0,0)),f.x),mix(tissueHash(i+vec3(0,1,0)),tissueHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(tissueHash(i+vec3(0,0,1)),tissueHash(i+vec3(1,0,1)),f.x),mix(tissueHash(i+vec3(0,1,1)),tissueHash(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float tissueGrain=tissueNoise(vTissuePosition*110.);
   float tissueMottle=tissueNoise(vTissuePosition*9.);
   diffuseColor.rgb *= .965 + .035*tissueMottle + .018*(tissueGrain-.5);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor = clamp(roughnessFactor + .07*(tissueGrain-.5), .35, 1.);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   // Derivative-based micro-relief follows object coordinates without UV seams.
   vec3 sigmaX=dFdx(-vViewPosition),sigmaY=dFdy(-vViewPosition);
   vec3 r1=cross(sigmaY,normal),r2=cross(normal,sigmaX);
   float determinant=dot(sigmaX,r1);
   float height=tissueGrain*.00065;
   vec3 gradient=sign(determinant)*(dFdx(height)*r1+dFdy(height)*r2);
   if(abs(determinant)>1.e-10)normal=normalize(abs(determinant)*normal-gradient);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   // Gentle warm edge scattering approximation; not a tissue simulation.
   float tissueEdge=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.);
   outgoingLight += diffuseColor.rgb*vec3(1.,.48,.38)*tissueEdge*.10;
   #include <opaque_fragment>
  `);
 };
 material.customProgramCacheKey=()=> 'neuroverse-tissue-v1';
 return material;
}
