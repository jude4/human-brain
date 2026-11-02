"""Convert Nilearn's bundled fsaverage5 GIFTI surfaces to a standalone GLB.
Usage: python3 scripts/convert_brain.py /path/to/nilearn.whl
Only Python's standard library is required.
"""
import math
import sys,zipfile,gzip,base64,zlib,xml.etree.ElementTree as ET,struct,json
from pathlib import Path
z=zipfile.ZipFile(sys.argv[1]); blob=bytearray(); views=[]; accessors=[]; meshes=[]
for side in ['left','right']:
 root=ET.fromstring(gzip.decompress(z.read(f'nilearn/datasets/data/fsaverage5/pial_{side}.gii.gz')))
 arrays=[]
 for a in root.findall('DataArray'):
  raw=zlib.decompress(base64.b64decode(a.find('Data').text)); arrays.append(raw)
 coords=list(struct.iter_unpack('<fff',arrays[0])); coords=[(-y/65,(zz-15)/65,x/65) for x,y,zz in coords]
 # RAS -> viewer: anterior left, superior up, right toward viewer.
 # This reflection requires reversing the triangle winding below.
 arrays[1]=b''.join(struct.pack('<III',a,c,b) for a,b,c in struct.iter_unpack('<III',arrays[1]))
 positions=b''.join(struct.pack('<fff',*p) for p in coords)
 sulc_root=ET.fromstring(gzip.decompress(z.read(f'nilearn/datasets/data/fsaverage5/sulc_{side}.gii.gz')))
 sulc_raw=zlib.decompress(base64.b64decode(sulc_root.find('DataArray/Data').text))
 sulc=[v[0] for v in struct.iter_unpack('<f',sulc_raw)]
 # Actual sulcal-depth data adds cavity shading without altering anatomy.
 colors=bytearray()
 for depth in sulc:
  cavity=1/(1+math.exp(-depth*2.4))
  light=1-.38*cavity
  colors.extend(struct.pack('<fff',light,light*(1-.065*cavity),light*(1-.045*cavity)))
 for raw,target in [(positions,34962),(arrays[1],34963),(colors,34962)]:
  while len(blob)%4: blob.append(0)
  views.append({'buffer':0,'byteOffset':len(blob),'byteLength':len(raw),'target':target}); blob.extend(raw)
 idx=len(accessors)
 accessors.extend([{'bufferView':len(views)-3,'componentType':5126,'count':len(coords),'type':'VEC3','min':[min(p[k] for p in coords) for k in range(3)],'max':[max(p[k] for p in coords) for k in range(3)]},{'bufferView':len(views)-2,'componentType':5125,'count':len(arrays[1])//4,'type':'SCALAR'},{'bufferView':len(views)-1,'componentType':5126,'count':len(coords),'type':'VEC3'}])
 meshes.append({'name':f'{side} cerebral hemisphere','primitives':[{'attributes':{'POSITION':idx,'COLOR_0':idx+2},'indices':idx+1}]})
doc={'asset':{'version':'2.0','generator':'NEUROVERSE / Nilearn fsaverage5'},'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':[{'mesh':0},{'mesh':1}],'meshes':meshes,'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
j=json.dumps(doc,separators=(',',':')).encode(); j+=b' '*((-len(j))%4); blob+=b'\0'*((-len(blob))%4)
result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(blob))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(blob),0x004e4942)+blob
Path('public/models/human-brain.glb').write_bytes(result)
Path('public/models/LICENSE-NILEARN.txt').write_bytes(z.read('nilearn-0.14.1.dist-info/licenses/LICENSE'))
print(f'Wrote {len(result):,} bytes; 20,484 cortical vertices, 40,960 triangles')
