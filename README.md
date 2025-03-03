# Docker-helper

A project with the end goal of making the process of setting up a Docker server much easier by allowing users to select, configure, run, and manage Docker containers from a web interface instead of having to deal with docker run commands or docker compose files.

## Run without building

```
npm install //just run in project root, vite should move the frontend dependencies to a node_modules directory within the frontend directory for you upon running for the first time
npm start
```
Then connect on localhost:5173.

## Build and run

```
pkg . --output my-app --targets node18-linux-x64
./my-app
```
Then connect on localhost:5173.

Note: if running in a folder besides the project folder, you must copy backend/, frontend/, package.json, and maybe package-lock.json to that folder and then run npm install again. This is why I want to figure out how to bundle this into an AppImage.
