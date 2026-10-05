const fs=require('node:fs');const path=require('node:path');
for(const file of ['nodes/CivicDataForge/cdf.svg','credentials/cdf.svg'])fs.copyFileSync(path.join(__dirname,'..',file),path.join(__dirname,'../dist',file));
