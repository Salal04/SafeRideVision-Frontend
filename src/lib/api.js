// Talks to the Safe Ride Vision inference backend running on Colab, exposed
// through an ngrok tunnel. Kept in one file so the request/response shape is
// easy to adjust to match whatever the notebook actually returns.

const STORAGE_KEY = 'srv_api_base_url'

export function getSavedApiBase() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function saveApiBase(url) {
  try {
    localStorage.setItem(STORAGE_KEY, url.trim())
  } catch {
    /* ignore storage errors */
  }
}

export function normalizeBase(url) {
  return url.trim().replace(/\/+$/, '')
}

// Backend hands back relative paths like "/outputs/<video>/bikes/12/plate_crop.jpg"
// (or, for the main video, sometimes an absolute URL already) — this is the
// one place that turns either shape into something a browser can actually
// fetch, so every consumer (video, csv link, bike photo, plate crop) resolves
// the same way instead of each screen reinventing it slightly differently.
export function resolveUrl(base, path) {
  if (!path) return null
  return /^https?:\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

// `bikes` (new, richer field) falls back to deriving the same shape from the
// older `logs` field, so a backend that hasn't been updated yet still gets a
// usable — just image-less — dossier per bike instead of nothing.
export function normalizeBikes(data, base) {
  const source = Array.isArray(data.bikes)
    ? data.bikes
    : Array.isArray(data.logs)
    ? data.logs
    : []

  return source.map((row) => {
    const toBool = (v) => v === true || String(v).trim().toLowerCase() === 'true'
    const everTurned = toBool(row.ever_turned)
    const signaled = toBool(row.ever_signaled_while_turning)
    return {
      trackId: row.track_id,
      plateNumber: (row.plate_number || '').trim(),
      plateDetected: toBool(row.plate_detected),
      mirrorSeenBoth: toBool(row.mirror_seen_both),
      indicatorSeenBoth: toBool(row.indicator_seen_both),
      everTurned,
      signaled,
      violation: row.violation != null ? Boolean(row.violation) : everTurned && !signaled,
      bikeImageUrl: resolveUrl(base, row.bike_image_url),
      plateImageUrl: resolveUrl(base, row.plate_image_url),
    }
  })
}

export function normalizeSummary(data, bikes) {
  if (data.summary) return data.summary
  // Same fallback spirit as normalizeBikes(): an older backend without a
  // `summary` block still gets one, computed client-side from `bikes`.
  const turned = bikes.filter((b) => b.everTurned).length
  const violations = bikes.filter((b) => b.violation).length
  const platesRead = bikes.filter((b) => b.plateNumber).length
  return {
    total_bikes: bikes.length,
    turned,
    signaled_correctly: turned - violations,
    violations,
    plates_read: platesRead,
    plates_missing: bikes.length - platesRead,
    compliance_rate: turned ? Number(((turned - violations) / turned).toFixed(3)) : null,
  }
}

/**
 * Sends the video to the backend and waits as long as it takes.
 * Deliberately does NOT attach any timeout — Colab inference on longer clips
 * can take several minutes, and we never want the browser to give up early.
 *
 * Expected backend contract (adjust endpoint/field names here if your
 * notebook differs):
 *   POST {apiBase}/process-video   (multipart/form-data)
 *   Always sent:
 *     "video"  -> the video file
 *     "mode"   -> "direct" | "junction"
 *   Sent only when mode === "junction" (user marked one or more junctions on a picked frame):
 *     "fps"            -> fps value used to estimate each junction's frame_number
 *     "junction_count" -> how many junctions were drawn
 *     "junctions"      -> JSON-encoded array, one entry per junction:
 *         {
 *           shape: "rectangle" | "circle" | "polygon",
 *           box: { x, y, width, height },   // bounding box, native frame pixels (all shapes)
 *           points: [{ x, y }, ...] | null, // vertex list, native frame pixels (polygon only)
 *           frame_number, timestamp_sec, frame_width, frame_height,
 *         }
 *     Backward-compatible flat fields describing just the FIRST junction, for
 *     older backends that only understand a single rectangular box:
 *     "frame_number", "timestamp_sec", "frame_width", "frame_height",
 *     "box_x", "box_y", "box_width", "box_height"
 *   Response JSON:
 *     {
 *       "output_video_url"?: string,       // absolute or relative URL
 *       "output_video_base64"?: string,     // raw base64, no data: prefix
 *       "logs"?: Array<Record<string, any>> // one entry per detection/frame event
 *     }
 *   ...or a raw video/* blob response with no logs.
 */
export async function runDetection(apiBase, file, options = {}) {
  const { signal, mode = 'direct', fps, junctions } = options
  const base = normalizeBase(apiBase)
  if (!base) throw new Error('Backend URL is empty. Paste your ngrok URL above first.')

  const form = new FormData()
  form.append('video', file)
  form.append('mode', mode)

  if (mode === 'junction' && Array.isArray(junctions) && junctions.length > 0) {
    form.append('fps', String(fps ?? ''))
    form.append('junction_count', String(junctions.length))
    form.append(
      'junctions',
      JSON.stringify(
        junctions.map((j) => ({
          shape: j.shape,
          box: j.box,
          points: j.shape === 'polygon' ? j.points : null,
          frame_number: Math.round(j.frameNumber ?? 0),
          timestamp_sec: j.timestampSec ?? 0,
          frame_width: j.frameWidth ?? null,
          frame_height: j.frameHeight ?? null,
        }))
      )
    )

    // Older/simpler backends that only understand one rectangular box still
    // get something sensible: the first junction, flattened out.
    const first = junctions[0]
    form.append('frame_number', String(Math.round(first.frameNumber ?? 0)))
    form.append('timestamp_sec', String(first.timestampSec ?? 0))
    form.append('frame_width', String(first.frameWidth ?? ''))
    form.append('frame_height', String(first.frameHeight ?? ''))
    if (first.box) {
      form.append('box_x', String(Math.round(first.box.x)))
      form.append('box_y', String(Math.round(first.box.y)))
      form.append('box_width', String(Math.round(first.box.width)))
      form.append('box_height', String(Math.round(first.box.height)))
    }
  }

  let response
  try {
    response = await fetch(`${base}/process-video`, {
      method: 'POST',
      body: form,
      signal,
      headers: {
        // Same reason as the /videos and video-blob fetches in Upload.jsx:
        // skips ngrok's free-tier HTML "you are about to visit..."
        // interstitial, which has no CORS headers and would otherwise get
        // parsed as the JSON/video response instead of the real one.
        'ngrok-skip-browser-warning': 'true',
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error(
      `Could not reach the backend at ${base}. Make sure the Colab notebook is running, the ngrok tunnel is active, and the URL is correct.`
    )
  }

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      /* noop */
    }
    throw new Error(`Backend returned ${response.status} ${response.statusText}. ${detail.slice(0, 300)}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await response.json()

    let videoUrl = null
    if (data.output_video_url) {
      videoUrl = /^https?:\/\//i.test(data.output_video_url)
        ? data.output_video_url
        : `${base}${data.output_video_url.startsWith('/') ? '' : '/'}${data.output_video_url}`
    } else if (data.output_video_base64) {
      videoUrl = `data:video/mp4;base64,${data.output_video_base64}`
    }

    const logs = Array.isArray(data.logs) ? data.logs : Array.isArray(data.events) ? data.events : []
    const bikes = normalizeBikes(data, base)
    const summary = normalizeSummary(data, bikes)
    const csvDownloadUrl = resolveUrl(base, data.csv_download_url)

    return { videoUrl, logs, bikes, summary, csvDownloadUrl, raw: data }
  }

  if (contentType.startsWith('video/')) {
    const blob = await response.blob()
    return { videoUrl: URL.createObjectURL(blob), logs: [], bikes: [], summary: normalizeSummary({}, []), csvDownloadUrl: null, raw: null }
  }

  // Fallback: try to parse as JSON anyway, otherwise surface raw text.
  const text = await response.text()
  try {
    const data = JSON.parse(text)
    const logs = Array.isArray(data.logs) ? data.logs : []
    const bikes = normalizeBikes(data, base)
    const summary = normalizeSummary(data, bikes)
    const csvDownloadUrl = resolveUrl(base, data.csv_download_url)
    const videoUrl = data.output_video_url || (data.output_video_base64 ? `data:video/mp4;base64,${data.output_video_base64}` : null)
    return { videoUrl, logs, bikes, summary, csvDownloadUrl, raw: data }
  } catch {
    throw new Error('Backend responded with an unrecognized format. Check the Colab server output.')
  }
}
