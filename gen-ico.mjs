import pngToIco from 'png-to-ico';
import { writeFileSync } from 'fs';

// pngToIco default export accepts a file path and auto-generates
// multiple sizes (16, 32, 48, 64, 128, 256) internally
console.log('Converting public/logo.png → public/logo.ico (multi-size)…');

const icoBuffer = await pngToIco('public/logo.png');

writeFileSync('public/logo.ico', icoBuffer);

console.log(`✅ public/logo.ico written: ${icoBuffer.byteLength} bytes`);
