import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('asset-parts/manifest.json','utf8'));
for(const [target,{parts,sha256}] of Object.entries(manifest)){
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const handle=fs.openSync(target,'w');const hash=crypto.createHash('sha256');
  for(const part of parts){const data=fs.readFileSync(part);fs.writeSync(handle,data);hash.update(data);}
  fs.closeSync(handle);
  if(hash.digest('hex')!==sha256)throw new Error(`Asset mismatch: ${target}`);
}
console.log('Original large assets restored without compression.');
