import { test, expect } from '@playwright/test';
test('loads real cortex and exercises exploration controls',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.goto('/');const asset=await page.request.get('/models/human-brain.glb');expect(asset.ok()).toBeTruthy();expect((await asset.body()).subarray(0,4).toString()).toBe('glTF');await expect(page.locator('canvas')).toBeVisible();
 await expect(page.getByText('Assembling cortical connections…')).toHaveCount(0,{timeout:30000});
 await expect(page.getByRole('heading',{name:'A universe. Waiting to be explored.'})).toBeVisible();
 await page.locator('.region-list').getByRole('button',{name:/Frontal lobe/}).click();
 await expect(page.locator('.info-panel h2')).toHaveText('Frontal lobe');
 await expect(page.locator('.info-panel li')).toHaveCount(3);
 await page.getByRole('button',{name:'Neural activity',exact:true}).last().click();await expect(page.locator('.mode-buttons button.active')).toHaveText('Neural activity');
 await page.getByRole('button',{name:'Transparent',exact:true}).click();await expect(page.locator('.mode-buttons button.active')).toHaveText('Transparent');
 await page.getByRole('button',{name:'Hide anatomical labels',exact:true}).click();await expect(page.getByRole('button',{name:'Show anatomical labels'})).toBeVisible();
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();await expect(page.getByRole('button',{name:'Resume animation'})).toBeVisible();
 await page.getByRole('button',{name:'Reset camera',exact:true}).click();await expect(page.locator('.info-panel h2')).toHaveText('A universe.Waiting to be explored.');
 await page.getByRole('button',{name:'Show anatomical labels'}).click();await page.getByRole('button',{name:'Anatomy',exact:true}).click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/neuroverse-desktop.png',fullPage:false});
 await page.getByRole('button',{name:'About',exact:false}).first().click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close about'}).click();
 expect(errors).toEqual([]);
});
test('mobile regions remain usable without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Explore brain regions'}).click();await page.locator('.region-list').getByRole('button',{name:/Brainstem/}).click();await expect(page.locator('.info-panel h2')).toHaveText('Brainstem');await expect(page.getByText('Reference hotspot:')).toBeVisible();
 await page.getByRole('button',{name:'Hide insights'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'/tmp/neuroverse-mobile.png'});
});
