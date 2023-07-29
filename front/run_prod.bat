@ECHO OFF

CALL npm install

SET NODE_ENV=production
.\node_modules\.bin\ts-node fuse.ts
