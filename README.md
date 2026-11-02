# NEUROVERSE

An immersive React + TypeScript + Three.js brain explorer. No backend or credentials required.

## Run

Use Node 22+ and npm:

```sh
npm ci
npm run dev
```

Development server: port 5173. `npm run build` type-checks and builds into `dist/`; `npm run preview` serves the production bundle.

## Explore

Drag the model to rotate, scroll/pinch to zoom, right-drag or two-finger drag to pan. Select approximate anatomical reference hotspots or use the accessible region list. The bottom controls switch anatomy, illustrative neural activity and transparent modes, toggle labels, pause animation and reset the camera. Reduced-motion preferences disable automatic animation. On mobile, open “Explore brain regions” for the collapsible information panel.

## Interactive exploration

Auto-rotation is enabled on first load at a visible default speed. Dragging takes control immediately; the orbit resumes after 1.8 seconds of inactivity. Region selection holds the view for reading. Pause stops animation and rotation; reduced-motion preferences disable automatic rotation. Reset returns to the full brain and closes a tour.

The viewer toolbar starts a six-region guided tour, advancing every nine seconds (paused by the animation pause button). Previous/next buttons browse regions manually and end the tour. Viewer settings adjust rotation speed and smoothly separate the real hemisphere meshes for an illustrative exploded cortical view. The spacing does not represent anatomical distances or add missing structures.

## Scientific asset and limitations

`public/models/human-brain.glb` contains genuine left/right fsaverage5 pial surfaces bundled in Nilearn 0.14.1, originally reconstructed with FreeSurfer. It has 20,484 vertices and 40,960 triangles; 739 KB uncompressed. The GLB is loaded locally with Drei's GLTFLoader wrapper. Nilearn distribution licence: `public/models/LICENSE-NILEARN.txt` (BSD-3-Clause). Source: https://nilearn.github.io/stable/modules/generated/nilearn.datasets.fetch_surf_fsaverage.html . This is an average cortical surface, not a full individual brain or a segmented atlas.

Hotspots are approximate reference locations, not lobe boundary segmentation. Cerebellum and brainstem reference hotspots intentionally have no invented anatomical meshes. Transparent mode reveals an explicitly illustrative procedural network, not validated internal anatomy. Neural activity is an artistic communication simulation, not measured signals. Education is not diagnostic advice. Content reference: NIH NINDS “Brain Basics: Know Your Brain”.

To reproduce the conversion: `python3 -m pip download nilearn==0.14.1 --no-deps -d /tmp/neuro-assets`, then `python3 scripts/convert_brain.py /tmp/neuro-assets/nilearn-0.14.1-py3-none-any.whl`. The converter requires only Python's standard library. Keep the licence file alongside replacements. For a replacement model, preserve scene coordinates or update region positions in `src/data/regions.ts`; true mesh segmentation requires an explicit anatomical mapping.

## Tests

`npx playwright test` exercises real WebGL loading, region content, viewing modes, labels, pause/reset, About and mobile responsiveness. The configuration uses `/usr/bin/chromium` for this environment; on other machines set `CHROMIUM_PATH` or use Playwright's installed Chromium. Software rendering flags are test-only. The model stays local and fonts are self-hosted.

## Deployment

For Vercel or Netlify: build command `npm run build`, output directory `dist`, Node 22+. This is a static Vite application; no server API or secrets are needed. `netlify.toml` is included. No deployment has been performed by this project setup.
