@ECHO OFF
cd /d %~dp0
start cmd /k nodemon --trace-uncaught --experimental-modules --experimental-json-modules --max-old-space-size=32768 bot/Manager.js
