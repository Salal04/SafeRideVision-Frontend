# Safe Ride Vision — Frontend

React + Vite frontend for the Safe Ride Vision project: a computer-vision
pipeline (YOLO detection -> DeepSORT tracking -> mirror detection -> indicator
detection -> orientation model -> per-frame indicator history -> ResNet+LSTM
blink detector -> turn-signal compliance verdict).

## Pages

- **Home (`/`)** - hero + animated detection HUD, feature grid of all 8
  safety measures, pipeline teaser, CTA.
- **How It Works (`/working`)** - a full visual walkthrough of every stage
  in the pipeline, plus the compliance rule explained simply.
- **Run Detection (`/upload`)** - upload a video, send it to your Colab/ngrok
  backend, and view the annotated output video + a compliance log table.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Connecting your Colab / ngrok backend

On the **Run Detection** page, open **Backend connection** and paste the
public ngrok URL your Colab notebook prints when it starts (e.g.
`https://xxxx-xx-xx-xxx-xx.ngrok-free.app`). It's saved in the browser's
`localStorage` so you won't need to re-enter it every visit.

### Expected API contract

All request/response handling lives in **`src/lib/api.js`** - edit that one
file if your notebook's route or response shape is different.

Right now the frontend assumes:

```
POST {your-ngrok-url}/process-video
Content-Type: multipart/form-data
  field "video" = the uploaded file

Response (application/json):
{
  "output_video_url": "https://.../output.mp4",   // OR:
  "output_video_base64": "....",                   // raw base64, no data: prefix
  "logs": [
    { "frame": 128, "bike_id": 42, "orientation": "turn-left",
      "indicator_state": "off", "blinking": false, "violation": true,
      "timestamp": "00:00:05.12" },
    ...
  ]
}
```

The logs table renders whatever keys your backend actually returns - you
don't need to match the example field names exactly, except that a column
whose name contains `violation` will render as an OK/VIOLATION badge instead
of raw text.

If your endpoint instead returns the processed video directly as a
`video/*` response with no JSON, that's handled too (it just won't have a
logs table to show).

### No request timeout

`fetch()` has no built-in timeout, and this app doesn't add one - Colab
inference can legitimately take several minutes on longer clips, so the
upload page just waits, shows an elapsed timer and a rotating pipeline
status list, and lets the user cancel manually if they want to stop waiting.

### CORS

Since the browser calls your ngrok URL directly, make sure your Flask/FastAPI
server on Colab sends permissive CORS headers (e.g. `flask-cors` with
`CORS(app)`), or the request will be blocked by the browser.

## Tech stack

- React 19 + Vite
- React Router
- Tailwind CSS v4
- Framer Motion
- lucide-react icons
