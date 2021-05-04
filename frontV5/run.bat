@ECHO OFF

CALL npm install

SET NODE_ENV=production
::SET NODE_ENV=dev
.\node_modules\.bin\ts-node fuse.ts
