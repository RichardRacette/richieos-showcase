const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('HTTP document specifies an icon instead of causing a favicon 404',()=>assert.match(fs.readFileSync(path.join(root,'site/index.html'),'utf8'),/<link rel="icon"/));
test('all eight numbered palette labels meet 4.5 to 1 contrast',()=>{
const css=fs.readFileSync(path.join(root,'site/styles.css'),'utf8');
function lum(hex){const c=hex.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
for(let i=0;i<8;i++){const bg=css.match(new RegExp('\\.c'+i+'\\{background:#([a-f0-9]{6})'))[1];let fg='14251f';
for(const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g))if(m[1].split(',').some(s=>s.trim()==='.swatch.c'+i)){const c=m[2].match(/(?:^|;)color:(white|#[a-f0-9]{6})/);if(c)fg=c[1]==='white'?'ffffff':c[1].slice(1)}
const l=[lum(fg),lum(bg)].sort((a,b)=>b-a),ratio=(l[0]+.05)/(l[1]+.05);assert(ratio>=4.5,`color ${i+1}: ${ratio}`)}
});
