<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/108b6611-84f3-4b6b-bbc5-09b41b4dbc59

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Running locally
Requires Node.js 20+. The app must be served over http (opening index.html by double-click will NOT work).
- Windows: double-click `start.bat`
- Mac/Linux: `./start.sh`
- Or: `npm install && npm run dev` then open http://localhost:3000

## Run from VS Code
1. Install Node.js (LTS) and restart VS Code.
2. File > Open Folder... and pick this project folder.
3. Press **Ctrl+Shift+B** (runs "Start Dastan AR": installs packages, then starts the server), or open a terminal (Ctrl+`) and run `npm install` then `npm start`.
4. Open http://localhost:3000 (`npm start` opens it for you).
