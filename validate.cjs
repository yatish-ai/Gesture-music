const fs = require('fs');
const parser = require('@babel/parser');

const files = [
  'src/App.jsx',
  'src/velocityEngine.js',
  'src/chordRecognition.js',
  'src/instrumentEngine.js',
  'src/components/ParticleHandCanvas.jsx',
  'src/components/TopBar.jsx',
  'src/components/HeroSection.jsx',
  'src/components/HowItWorksSection.jsx',
  'src/components/ExperienceSection.jsx',
  'src/components/InstrumentShowcase.jsx',
  'src/components/StudioSettingsDrawer.jsx',
  'src/components/StudioFooter.jsx',
  'src/components/ActivePerformanceInterface.jsx'
];

for (const f of files) {
  try {
    parser.parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    console.log('OK', f);
  } catch (e) {
    console.error('FAIL', f, e.message);
    process.exitCode = 1;
  }
}
