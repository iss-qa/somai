#!/bin/sh
# Strip workspace:* deps (already bundled by esbuild) then install
node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
for(const k in p.dependencies){
  if(String(p.dependencies[k]).includes('workspace:'))delete p.dependencies[k];
}
fs.writeFileSync('package.json',JSON.stringify(p,null,2));
"
npm install
