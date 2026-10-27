# ClipForge — Video Prep Studio

A CompressBase-inspired video preparation app built with Next.js and FFmpeg.wasm. This is an independent implementation and does not use CompressBase's proprietary source code or branding.

## Features
- Drag-and-drop video selection and browser preview
- Quality profiles (smaller file, balanced, higher quality)
- Maximum resolution options and 24/30/60 FPS selection
- Browser-based MP4 encoding using FFmpeg.wasm
- Output preview, approximate size comparison, and download
- No application server upload of the selected video

## Requirements
- Node.js 20 or newer recommended
- A modern desktop browser; FFmpeg.wasm needs WebAssembly support
- Internet access on first processing attempt to load the FFmpeg core from unpkg

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy to Vercel
1. Create a new Git repository and push this project.
2. In Vercel, select **Add New → Project**, import the repository, and keep the detected Next.js settings.
3. Use `npm run build` as the build command and leave the output directory blank/default.
4. Click **Deploy**. No environment variables are required for this starter.

Alternatively, from this directory run `npx vercel` and follow the CLI prompts after authenticating with your own Vercel account.

## Notes / limitations
- Video processing is resource-intensive and browser memory usage may be high for large videos. Test with short clips first.
- FFmpeg core is loaded from unpkg at runtime. For production, consider self-hosting the FFmpeg core assets and reviewing license notices for the exact dependency versions.
- The frame-rate setting re-encodes to the selected rate and may change motion cadence. The resolution option caps the output height; it does not upscale lower-resolution sources.
- This is a starter implementation, not a full reproduction of CompressBase. It does not include TikTok integration, account/authentication, server-side anti-lag processing, video URL extraction, usage quotas, or API-based video analysis.


### 120 FPS output

The frame-rate selector supports 24, 30, 60, and 120 FPS. Selecting 120 FPS sets the FFmpeg output frame rate to 120. For genuine 120 FPS motion, use source footage captured at 120 FPS; converting lower-frame-rate footage can duplicate frames and does not create new motion detail. Browser/WASM encoding performance depends on the device and video resolution.
