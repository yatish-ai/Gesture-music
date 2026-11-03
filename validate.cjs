
const fs=require('fs'); const parser=require('@babel/parser');
for (const f of ['src/App.jsx','src/velocityEngine.js','src/chordRecognition.js','src/instrumentEngine.js']) {
 try { parser.parse(fs.readFileSync(f,'utf8'), {sourceType:'module',plugins:['jsx']}); console.log('OK',f); }
 catch(e){ console.error('FAIL',f,e.message); process.exitCode=1; }
}
