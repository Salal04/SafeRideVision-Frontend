import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, Settings2, Play, XCircle, Loader2, CheckCircle2,
  AlertTriangle, FileVideo, Clock, ChevronDown, Cog, Download, RotateCcw,
  SendHorizontal, ScanSearch, Crop, Check, ArrowLeft,
  Square, Circle, Hexagon, Undo2, Ban,
  ListVideo, ArrowUpDown, RefreshCw,
} from 'lucide-react'
import { getSavedApiBase, saveApiBase, runDetection } from '../lib/api.js'

const BASE_PIPELINE_STEPS = [
  'Extracting frames',
  'Running YOLO bike detection',
  'DeepSORT tracking bikes',
  'Reading mirror + indicator regions',
  'Scoring orientation per frame',
  'Building indicator history',
  'ResNet + LSTM blink inference',
  'Compiling compliance verdicts',
]

const JUNCTION_PIPELINE_STEPS = [
  'Extracting frames',
  'Matching your junction(s) to frame coordinates',
  'Running YOLO bike detection',
  'DeepSORT tracking bikes',
  'Reading mirror + indicator regions',
  'Scoring orientation per frame',
  'Building indicator history',
  'ResNet + LSTM blink inference',
  'Compiling compliance verdicts',
]

const DEFAULT_FPS = 30

// Distinct colors so multiple junctions drawn on the same frame stay
// visually easy to tell apart, cycling if there are more junctions than colors.
const SHAPE_COLORS = ['#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#fb7185', '#facc15']
const shapeColor = (i) => SHAPE_COLORS[i % SHAPE_COLORS.length]

const SHAPE_TOOLS = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'polygon', label: 'Polygon', icon: Hexagon },
]

function makeJunctionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `j-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function StatusBadge({ status }) {
  const map = {
    true: { cls: 'text-red border-red/40 bg-red/5', label: 'VIOLATION' },
    false: { cls: 'text-green border-green/40 bg-green/5', label: 'OK' },
  }
  const v = map[String(status)]
  if (!v) return <span className="font-mono text-[11px] text-muted-2">—</span>
  return (
    <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${v.cls}`}>{v.label}</span>
  )
}

// `<video src="...">` and `<a href="..." download>` are requests the BROWSER
// makes directly — there's no way to attach a custom header to them. Ngrok's
// free-tier interstitial ("You are about to visit...") only gets skipped when
// the request carries `ngrok-skip-browser-warning`, so those native requests
// get back the warning HTML instead of the actual video bytes: the player
// stays blank/0:00 and "download" saves an HTML file, not the mp4.
// Fix: fetch the video ourselves (with the header), turn the response into a
// blob, and point <video>/<a> at that in-memory blob: URL instead.
function useNgrokVideoBlob(src) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error

  useEffect(() => {
    if (!src) {
      setStatus('idle')
      setBlobUrl(null)
      return
    }

    let cancelled = false
    let objectUrl = null
    setStatus('loading')
    setBlobUrl(null)

    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  return { blobUrl, status }
}

// One card in the "View results" gallery. Pulled out into its own component
// (instead of inline in the .map()) so useNgrokVideoBlob — a hook — can be
// called once per video, each with its own loading/ready/error state.
function VideoCard({ v, resolveVideoUrl }) {
  const remoteUrl = resolveVideoUrl(v.output_video_url)
  const { blobUrl, status } = useNgrokVideoBlob(remoteUrl)

  return (
    <div className="rounded-xl panel-border bg-panel overflow-hidden">
      {status === 'ready' ? (
        <video src={blobUrl} controls preload="metadata" className="w-full max-h-56 bg-black" />
      ) : (
        <div className="w-full h-56 flex items-center justify-center bg-black">
          {status === 'error' ? (
            <span className="text-xs text-red flex items-center gap-1.5">
              <AlertTriangle size={13} /> Could not load video
            </span>
          ) : (
            <Loader2 size={18} className="animate-spin text-cyan" />
          )}
        </div>
      )}
      <div className="p-4 space-y-2.5">
        <p className="text-sm font-medium truncate" title={v.original_filename || v.id}>
          {v.original_filename || v.id}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-2">
          <span className="px-2 py-0.5 rounded border border-line-soft capitalize">{v.mode}</span>
          {v.mode === 'junction' && (
            <span>{v.junction_count} junction{v.junction_count === 1 ? '' : 's'}</span>
          )}
          {v.log_row_count != null && <span>{v.log_row_count} log rows</span>}
          <span className="flex items-center gap-1">
            <Clock size={11} /> {v.received_at_iso ? new Date(v.received_at_iso).toLocaleString() : '—'}
          </span>
        </div>
        {status === 'ready' ? (
          <a
            href={blobUrl}
            download={v.original_filename || 'safe-ride-vision-output.mp4'}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-cyan transition-colors"
          >
            <Download size={13} /> Download
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
            <Download size={13} /> {status === 'error' ? 'Unavailable' : 'Preparing…'}
          </span>
        )}
      </div>
    </div>
  )
}

// Same fix as VideoCard, for the single just-finished result.
function ResultVideoPlayer({ src }) {
  const { blobUrl, status } = useNgrokVideoBlob(src)

  if (status === 'error') {
    return (
      <p className="text-sm text-red flex items-center gap-2">
        <AlertTriangle size={15} /> Could not load the output video from the backend.
      </p>
    )
  }

  if (status !== 'ready') {
    return (
      <div className="w-full h-56 flex items-center justify-center rounded-lg border border-line-soft bg-black">
        <Loader2 size={18} className="animate-spin text-cyan" />
      </div>
    )
  }

  return (
    <>
      <video src={blobUrl} controls className="w-full rounded-lg border border-line-soft max-h-[480px] bg-black" />
      <a
        href={blobUrl}
        download="safe-ride-vision-output.mp4"
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm hover:border-cyan/50 hover:text-cyan transition-colors"
      >
        <Download size={15} /> Download annotated video
      </a>
    </>
  )
}

export default function Upload() {
  const [apiBase, setApiBase] = useState('')
  const [configOpen, setConfigOpen] = useState(true)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('idle') // idle | processing | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  // --- Junction-detection feature state ---
  const [mode, setMode] = useState(null) // null | 'direct' | 'junction'
  const [fps, setFps] = useState(DEFAULT_FPS)
  const [videoDuration, setVideoDuration] = useState(0)
  const [scrubTime, setScrubTime] = useState(0)
  const [frameReady, setFrameReady] = useState(false)
  // One or more junctions can now be marked on the same frame, each with its
  // own shape: { id, shape: 'rectangle'|'circle'|'polygon', box, points?, frameNumber, timestampSec, frameWidth, frameHeight }
  const [junctions, setJunctions] = useState([])
  const [shapeTool, setShapeTool] = useState('rectangle') // 'rectangle' | 'circle' | 'polygon'
  const [polygonPoints, setPolygonPoints] = useState([]) // in-progress polygon vertices, native canvas coords

  // --- "Upload video" / "View results" tabs ---
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'results'
  const [videosList, setVideosList] = useState([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [videosLoaded, setVideosLoaded] = useState(false)
  const [videosError, setVideosError] = useState('')
  const [videosOrder, setVideosOrder] = useState('desc') // 'desc' = newest first

  const abortRef = useRef(null)
  const timerRef = useRef(null)
  const stepTimerRef = useRef(null)
  const fileInputRef = useRef(null)
  const localPreviewUrl = useRef(null)

  const previewVideoRef = useRef(null)
  const frameVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const dragStateRef = useRef(null) // { startX, startY } in native canvas pixel space, while dragging a rectangle/circle

  useEffect(() => {
    const saved = getSavedApiBase()
    if (saved) {
      setApiBase(saved)
      setConfigOpen(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearInterval(stepTimerRef.current)
      if (localPreviewUrl.current) URL.revokeObjectURL(localPreviewUrl.current)
    }
  }, [])

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!f.type.startsWith('video/')) {
      setError('Please choose a video file.')
      return
    }
    setError('')
    setStatus('idle')
    setResult(null)
    setMode(null)
    setJunctions([])
    setShapeTool('rectangle')
    setPolygonPoints([])
    dragStateRef.current = null
    setFrameReady(false)
    setVideoDuration(0)
    setScrubTime(0)
    if (localPreviewUrl.current) URL.revokeObjectURL(localPreviewUrl.current)
    localPreviewUrl.current = URL.createObjectURL(f)
    setFile(f)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files?.[0]
      handleFile(f)
    },
    [handleFile]
  )

  // ---------- Junction frame picking / box drawing ----------

  const drawCurrentFrame = useCallback(() => {
    const video = frameVideoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  }, [])

  // Plain preview <video> shows a black rectangle until a frame is decoded.
  // Nudging currentTime forward a hair forces the browser to render a real
  // frame as the paused "poster", without needing a separate poster image.
  const onPreviewLoadedMetadata = useCallback((e) => {
    const video = e.currentTarget
    try {
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2)
    } catch {
      /* some browsers throw if metadata isn't fully ready yet — safe to ignore */
    }
  }, [])

  const onPreviewError = useCallback((e) => {
    const video = e.currentTarget
    const err = video.error
    const codes = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' }
    console.error('Preview video failed to load:', err && codes[err.code], err)
    setError(
      `Couldn't preview this video in-browser (${err ? codes[err.code] || err.code : 'unknown error'}). ` +
      `The file itself is fine and will still upload/process normally — this is just a preview limitation.`
    )
  }, [])

  const onFrameVideoLoadedMetadata = useCallback(() => {
    const video = frameVideoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    setVideoDuration(video.duration || 0)
    video.currentTime = 0
  }, [])

  const onFrameVideoSeeked = useCallback(() => {
    drawCurrentFrame()
    setFrameReady(true)
  }, [drawCurrentFrame])

  const handleScrub = (e) => {
    const t = Number(e.target.value)
    setScrubTime(t)
    setFrameReady(false)
    if (frameVideoRef.current) frameVideoRef.current.currentTime = t
  }

  // Convert a mouse event's page position into native canvas pixel coordinates
  // (i.e. real frame pixel coordinates, since canvas.width/height === video's
  // native videoWidth/videoHeight).
  const toNativeCoords = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    return {
      x: Math.min(Math.max(x, 0), canvas.width),
      y: Math.min(Math.max(y, 0), canvas.height),
    }
  }

  // Line width scales with the native/displayed canvas ratio so strokes stay
  // crisp whether the video frame is 480p or 4K.
  const computeLineWidth = () => {
    const canvas = canvasRef.current
    if (!canvas) return 2
    const rect = canvas.getBoundingClientRect()
    return Math.max(2, canvas.width / (rect.width || 1)) * 2
  }

  const drawLabelChip = (ctx, text, x, y, color) => {
    const canvas = canvasRef.current
    const fontSize = Math.max(16, (canvas?.width || 640) * 0.016)
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`
    const padX = fontSize * 0.4
    const textWidth = ctx.measureText(text).width
    ctx.globalAlpha = 0.92
    ctx.fillStyle = color
    ctx.fillRect(x - padX / 2, y - fontSize * 1.05, textWidth + padX, fontSize * 1.3)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#0b0f14'
    ctx.fillText(text, x, y - fontSize * 0.2)
  }

  // Draws one finalized junction (rectangle, circle/ellipse, or polygon) onto the canvas.
  const drawJunctionShape = (ctx, junction, label, color, lineWidth) => {
    ctx.save()
    ctx.lineWidth = lineWidth
    ctx.setLineDash([])
    ctx.strokeStyle = color
    ctx.fillStyle = color

    if (junction.shape === 'circle') {
      const { x, y, width, height } = junction.box
      const cx = x + width / 2
      const cy = y + height / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2)
      ctx.globalAlpha = 1
      ctx.stroke()
      ctx.globalAlpha = 0.14
      ctx.fill()
      ctx.globalAlpha = 1
      drawLabelChip(ctx, label, x + 6, y + 20, color)
    } else if (junction.shape === 'polygon' && junction.points?.length >= 3) {
      const pts = junction.points
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.globalAlpha = 1
      ctx.stroke()
      ctx.globalAlpha = 0.14
      ctx.fill()
      ctx.globalAlpha = 1
      pts.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, lineWidth * 1.4, 0, Math.PI * 2)
        ctx.fill()
      })
      drawLabelChip(ctx, label, pts[0].x + 6, pts[0].y + 20, color)
    } else {
      // rectangle (also the fallback for anything malformed)
      const { x, y, width, height } = junction.box
      ctx.globalAlpha = 1
      ctx.strokeRect(x, y, width, height)
      ctx.globalAlpha = 0.14
      ctx.fillRect(x, y, width, height)
      ctx.globalAlpha = 1
      drawLabelChip(ctx, label, x + 6, y + 20, color)
    }
    ctx.restore()
  }

  // Redraws the plain frame plus every finalized junction on top of it.
  // Call this any time `junctions` changes, and as the base before drawing
  // an in-progress drag/polygon on top.
  const renderJunctionsOverlay = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCurrentFrame()
    const ctx = canvas.getContext('2d')
    const lineWidth = computeLineWidth()
    junctions.forEach((j, i) => drawJunctionShape(ctx, j, `#${i + 1}`, shapeColor(i), lineWidth))
  }

  // Dashed in-progress rectangle/circle preview while dragging.
  const drawDragPreview = (ctx, tool, x0, y0, x1, y1) => {
    const lineWidth = computeLineWidth()
    ctx.save()
    ctx.strokeStyle = '#22d3ee'
    ctx.fillStyle = '#22d3ee'
    ctx.lineWidth = lineWidth
    ctx.setLineDash([lineWidth * 2, lineWidth])
    if (tool === 'circle') {
      const cx = (x0 + x1) / 2
      const cy = (y0 + y1) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.12
      ctx.fill()
    } else {
      ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
      ctx.globalAlpha = 0.12
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
    }
    ctx.restore()
  }

  // Dashed open polyline + vertex dots for a polygon that's still being placed.
  const drawOpenPolygon = (ctx, points) => {
    if (!points.length) return
    const lineWidth = computeLineWidth()
    ctx.save()
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = lineWidth
    ctx.setLineDash([lineWidth * 2, lineWidth])
    if (points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, lineWidth * 1.6, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#facc15' : '#22d3ee'
      ctx.fill()
    })
    ctx.restore()
  }

  const drawRubberLine = (ctx, from, to) => {
    const lineWidth = computeLineWidth()
    ctx.save()
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = lineWidth
    ctx.setLineDash([lineWidth * 2, lineWidth * 1.5])
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }

  // Keep the canvas in sync whenever the set of junctions or the in-progress
  // polygon changes (adding, removing, undoing a point, clearing, etc).
  useEffect(() => {
    if (!frameReady) return
    renderJunctionsOverlay()
    if (polygonPoints.length > 0) {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) drawOpenPolygon(ctx, polygonPoints)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junctions, polygonPoints, frameReady])

  const onCanvasMouseDown = (e) => {
    if (!frameReady) return
    const { x, y } = toNativeCoords(e)
    if (shapeTool === 'polygon') {
      // Polygons are placed click-by-click rather than dragged.
      setPolygonPoints((prev) => [...prev, { x, y }])
      return
    }
    dragStateRef.current = { startX: x, startY: y }
  }

  const onCanvasMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (dragStateRef.current) {
      const { x, y } = toNativeCoords(e)
      renderJunctionsOverlay()
      drawDragPreview(ctx, shapeTool, dragStateRef.current.startX, dragStateRef.current.startY, x, y)
      return
    }

    if (shapeTool === 'polygon' && polygonPoints.length > 0) {
      const { x, y } = toNativeCoords(e)
      renderJunctionsOverlay()
      drawOpenPolygon(ctx, polygonPoints)
      drawRubberLine(ctx, polygonPoints[polygonPoints.length - 1], { x, y })
    }
  }

  const finishDrag = (e) => {
    if (!dragStateRef.current) return
    const { x, y } = toNativeCoords(e)
    const { startX, startY } = dragStateRef.current
    dragStateRef.current = null

    const boxX = Math.min(startX, x)
    const boxY = Math.min(startY, y)
    const boxWidth = Math.abs(x - startX)
    const boxHeight = Math.abs(y - startY)

    if (boxWidth < 4 || boxHeight < 4) {
      // Too small to be a real shape (probably just a click) — discard and redraw what we have.
      renderJunctionsOverlay()
      return
    }

    const canvas = canvasRef.current
    setJunctions((prev) => [
      ...prev,
      {
        id: makeJunctionId(),
        shape: shapeTool, // 'rectangle' | 'circle'
        box: { x: boxX, y: boxY, width: boxWidth, height: boxHeight },
        frameNumber: Math.round(scrubTime * fps),
        timestampSec: scrubTime,
        frameWidth: canvas.width,
        frameHeight: canvas.height,
      },
    ])
  }

  const finishPolygon = () => {
    if (polygonPoints.length < 3) return
    const canvas = canvasRef.current
    const xs = polygonPoints.map((p) => p.x)
    const ys = polygonPoints.map((p) => p.y)
    setJunctions((prev) => [
      ...prev,
      {
        id: makeJunctionId(),
        shape: 'polygon',
        points: polygonPoints,
        box: {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        },
        frameNumber: Math.round(scrubTime * fps),
        timestampSec: scrubTime,
        frameWidth: canvas.width,
        frameHeight: canvas.height,
      },
    ])
    setPolygonPoints([])
  }

  const undoPolygonPoint = () => setPolygonPoints((prev) => prev.slice(0, -1))
  const cancelPolygon = () => setPolygonPoints([])

  const removeJunction = (id) => setJunctions((prev) => prev.filter((j) => j.id !== id))

  const clearAllJunctions = () => {
    setJunctions([])
    setPolygonPoints([])
    dragStateRef.current = null
    // Give the DOM a tick to settle, then redraw the plain frame and unlock the scrubber.
    setTimeout(drawCurrentFrame, 0)
  }

  // ---------- Submission ----------

  const runPipeline = async (activeMode, jData) => {
    if (!apiBase.trim()) {
      setError('Paste your ngrok backend URL above before running detection.')
      setConfigOpen(true)
      return
    }
    if (!file) return

    saveApiBase(apiBase)
    setStatus('processing')
    setError('')
    setResult(null)
    setElapsed(0)
    setStepIndex(0)

    const steps = activeMode === 'junction' ? JUNCTION_PIPELINE_STEPS : BASE_PIPELINE_STEPS

    const controller = new AbortController()
    abortRef.current = controller

    timerRef.current = setInterval(() => setElapsed((v) => v + 1), 1000)
    stepTimerRef.current = setInterval(
      () => setStepIndex((v) => (v + 1 < steps.length ? v + 1 : v)),
      4500
    )

    try {
      const res = await runDetection(apiBase, file, {
        signal: controller.signal,
        mode: activeMode,
        ...(activeMode === 'junction' && jData && jData.length > 0
          ? {
              junctions: jData,
              fps,
            }
          : {}),
      })
      clearInterval(timerRef.current)
      clearInterval(stepTimerRef.current)
      setResult(res)
      setStatus('done')
    } catch (err) {
      clearInterval(timerRef.current)
      clearInterval(stepTimerRef.current)
      if (err.name === 'AbortError') {
        setStatus('idle')
      } else {
        setError(err.message || 'Something went wrong while processing the video.')
        setStatus('error')
      }
    }
  }

  const chooseDirect = () => {
    setMode('direct')
    runPipeline('direct', null)
  }

  const chooseJunction = () => {
    setMode('junction')
  }

  const backToModeChoice = () => {
    setMode(null)
    setJunctions([])
    setShapeTool('rectangle')
    setPolygonPoints([])
    dragStateRef.current = null
    setFrameReady(false)
  }

  const cancelProcessing = () => {
    abortRef.current?.abort()
    clearInterval(timerRef.current)
    clearInterval(stepTimerRef.current)
    setStatus('idle')
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    setStatus('idle')
    setMode(null)
    setJunctions([])
    setShapeTool('rectangle')
    setPolygonPoints([])
    dragStateRef.current = null
    setFrameReady(false)
    setVideoDuration(0)
    setScrubTime(0)
    if (localPreviewUrl.current) {
      URL.revokeObjectURL(localPreviewUrl.current)
      localPreviewUrl.current = null
    }
  }

  // ---------- "View results" tab: list of everything the backend has processed ----------

  const fetchVideos = useCallback(
    async (order = videosOrder) => {
      if (!apiBase.trim()) {
        setVideosError('Paste your ngrok backend URL above before viewing results.')
        setConfigOpen(true)
        return
      }
      saveApiBase(apiBase)
      setVideosLoading(true)
      setVideosError('')
      try {
        const base = apiBase.trim().replace(/\/$/, '')
        const res = await fetch(`${base}/videos?order=${order}`, {
          headers: {
            // Skips ngrok's free-tier HTML "you are about to visit..." interstitial,
            // which has no CORS headers and is what actually triggers the CORS error
            // in the browser — the Flask backend's own CORS(app) config is fine.
            'ngrok-skip-browser-warning': 'true',
          },
        })
        if (!res.ok) throw new Error(`Backend returned ${res.status}`)
        const data = await res.json()
        setVideosList(Array.isArray(data.videos) ? data.videos : [])
        setVideosLoaded(true)
      } catch (err) {
        setVideosError(err.message || 'Could not reach the backend to list processed videos.')
      } finally {
        setVideosLoading(false)
      }
    },
    [apiBase, videosOrder]
  )

  const switchToResults = () => {
    setActiveTab('results')
    if (!videosLoaded) fetchVideos()
  }

  const toggleVideosOrder = () => {
    const next = videosOrder === 'desc' ? 'asc' : 'desc'
    setVideosOrder(next)
    fetchVideos(next)
  }

  const resolveVideoUrl = (path) => `${apiBase.trim().replace(/\/$/, '')}${path}`

  const activeSteps = mode === 'junction' ? JUNCTION_PIPELINE_STEPS : BASE_PIPELINE_STEPS
  const logs = result?.logs || []

  return (
    <div className="pt-28 pb-24">
      <section className="max-w-5xl mx-auto px-5 sm:px-8 text-center mb-12">
        <span className="inline-flex items-center gap-2 font-mono text-xs text-amber border border-amber/30 bg-amber/5 rounded-full px-3 py-1.5 mb-6">
          <FileVideo size={12} /> RUN DETECTION
        </span>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl tracking-tight">
          Upload a clip, get a verdict
        </h1>
        <p className="text-muted mt-5 max-w-xl mx-auto leading-relaxed">
          The video is sent to the detection backend running on Colab. Longer
          clips take longer to process — keep this tab open and it will
          come back with the annotated video and a full compliance log.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 space-y-6">
        {/* Tabs: upload a new clip, or browse everything the backend has already processed */}
        <div className="flex items-center gap-2 rounded-xl panel-border bg-panel p-1.5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-mono border transition-colors ${
              activeTab === 'upload'
                ? 'bg-cyan/10 text-cyan border-cyan/30'
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            <UploadCloud size={15} /> Upload video
          </button>
          <button
            onClick={switchToResults}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-mono border transition-colors ${
              activeTab === 'results'
                ? 'bg-cyan/10 text-cyan border-cyan/30'
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            <ListVideo size={15} /> View results
          </button>
        </div>

        {/* Backend config */}
        <div className="rounded-xl panel-border bg-panel overflow-hidden">
          <button
            onClick={() => setConfigOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2 font-mono text-sm">
              <Settings2 size={15} className="text-cyan" />
              Backend connection
              {apiBase && !configOpen && (
                <span className="text-muted-2 text-xs truncate max-w-[220px]">— {apiBase}</span>
              )}
            </span>
            <ChevronDown size={16} className={`text-muted transition-transform ${configOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {configOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-1 border-t border-line-soft">
                  <label className="block text-xs font-mono text-muted-2 mb-2">Colab ngrok URL</label>
                  <input
                    type="text"
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    placeholder="https://xxxx-xx-xx-xxx-xx.ngrok-free.app"
                    className="w-full rounded-md bg-asphalt border border-line focus:border-cyan/60 px-3.5 py-2.5 font-mono text-sm text-text outline-none placeholder:text-muted-2"
                  />
                  <p className="text-xs text-muted-2 mt-2.5 leading-relaxed">
                    This is the public URL your Colab notebook prints when it starts the
                    ngrok tunnel. It's saved locally in your browser so you won't need
                    to paste it again next time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activeTab === 'upload' && (
        <>
        {/* Dropzone */}
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed cursor-pointer transition-colors px-6 py-16 flex flex-col items-center justify-center text-center gap-4 ${
              dragOver ? 'border-cyan bg-cyan/5' : 'border-line hover:border-muted-2 bg-panel/50'
            }`}
          >
            <div className="h-14 w-14 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center">
              <UploadCloud size={26} className="text-cyan" />
            </div>
            <div>
              <p className="font-medium">Drag and drop a ride video here</p>
              <p className="text-sm text-muted mt-1">or click to browse — MP4, MOV, AVI</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected file + mode choice + preview */}
        {file && status === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl panel-border bg-panel p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileVideo size={18} className="text-cyan shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-2 font-mono">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              {mode && (
                <button
                  onClick={backToModeChoice}
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors shrink-0"
                >
                  <ArrowLeft size={13} /> Change mode
                </button>
              )}
            </div>

            {/* Step 1: choose direct vs junction */}
            {!mode && (
              <>
                <video
                  ref={previewVideoRef}
                  src={localPreviewUrl.current}
                  controls
                  preload="metadata"
                  onLoadedMetadata={onPreviewLoadedMetadata}
                  onError={onPreviewError}
                  className="w-full rounded-lg border border-line-soft max-h-80 bg-black mb-5"
                />
                <p className="text-sm text-muted mb-3">How should this clip be processed?</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={chooseDirect}
                    className="flex flex-col items-start gap-2 rounded-lg border border-line hover:border-amber/50 bg-asphalt/40 px-4 py-3.5 text-left transition-colors"
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <SendHorizontal size={16} className="text-amber" /> Send without junction
                    </span>
                    <span className="text-xs text-muted-2 leading-relaxed">
                      Sends the video straight to the backend as-is.
                    </span>
                  </button>
                  <button
                    onClick={chooseJunction}
                    className="flex flex-col items-start gap-2 rounded-lg border border-line hover:border-cyan/50 bg-asphalt/40 px-4 py-3.5 text-left transition-colors"
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <ScanSearch size={16} className="text-cyan" /> Detect junction
                    </span>
                    <span className="text-xs text-muted-2 leading-relaxed">
                      Pick a frame, mark one or more junctions (rectangle, circle, or polygon), then send it all to the backend.
                    </span>
                  </button>
                </div>
                <button
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-red transition-colors"
                >
                  <XCircle size={14} /> Choose another file
                </button>
              </>
            )}

            {/* Step 2 (junction mode): pick frame + draw box */}
            {mode === 'junction' && (
              <div>
                {/* Hidden video used only as a frame source for the canvas */}
                <video
                  ref={frameVideoRef}
                  src={localPreviewUrl.current}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={onFrameVideoLoadedMetadata}
                  onSeeked={onFrameVideoSeeked}
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                />

                {/* Shape tool selector — draw more than one junction, in whichever shape fits it best */}
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="text-xs text-muted-2 font-mono mr-1">Shape:</span>
                  {SHAPE_TOOLS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setShapeTool(id)
                        if (polygonPoints.length > 0) setPolygonPoints([])
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                        shapeTool === id
                          ? 'border-cyan/60 bg-cyan/10 text-cyan'
                          : 'border-line text-muted hover:text-text'
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-muted mb-3">
                  {shapeTool === 'polygon'
                    ? 'Click to place each corner of the junction, then double-click (or Finish polygon) to close the shape.'
                    : 'Scrub to the frame you want, then click-and-drag on it to draw around the junction.'}
                  {' '}You can draw more than one junction on the same frame.
                </p>

                <div className="relative rounded-lg overflow-hidden border border-line-soft bg-black">
                  <canvas
                    ref={canvasRef}
                    className="w-full block cursor-crosshair select-none"
                    onMouseDown={onCanvasMouseDown}
                    onMouseMove={onCanvasMouseMove}
                    onMouseUp={finishDrag}
                    onMouseLeave={(e) => { if (dragStateRef.current) finishDrag(e) }}
                    onDoubleClick={finishPolygon}
                  />
                  {!frameReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 size={22} className="animate-spin text-cyan" />
                    </div>
                  )}
                </div>

                {shapeTool === 'polygon' && polygonPoints.length > 0 && (
                  <div className="flex items-center flex-wrap gap-3 mt-3">
                    <span className="text-xs text-muted-2 font-mono">
                      {polygonPoints.length} point{polygonPoints.length === 1 ? '' : 's'} placed
                      {polygonPoints.length < 3 ? ' (need at least 3)' : ''}
                    </span>
                    <button
                      onClick={undoPolygonPoint}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
                    >
                      <Undo2 size={13} /> Undo point
                    </button>
                    <button
                      onClick={cancelPolygon}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red transition-colors"
                    >
                      <Ban size={13} /> Cancel
                    </button>
                    <button
                      onClick={finishPolygon}
                      disabled={polygonPoints.length < 3}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 text-cyan px-3 py-1.5 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan/20 transition-colors"
                    >
                      <Check size={13} /> Finish polygon
                    </button>
                  </div>
                )}

                {junctions.length === 0 ? (
                  <>
                    <div className="flex items-center gap-3 mt-4">
                      <input
                        type="range"
                        min={0}
                        max={videoDuration || 0}
                        step={0.01}
                        value={scrubTime}
                        onChange={handleScrub}
                        className="flex-1 accent-cyan"
                      />
                      <span className="font-mono text-xs text-muted-2 w-14 text-right">{formatTime(scrubTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <label className="text-xs text-muted-2 font-mono">Video FPS</label>
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value) || DEFAULT_FPS)}
                        className="w-20 rounded-md bg-asphalt border border-line focus:border-cyan/60 px-2 py-1 font-mono text-xs text-text outline-none"
                      />
                      <span className="text-xs text-muted-2 leading-relaxed">
                        used to estimate the frame number sent with your junction(s) (default 30)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted flex items-center gap-2">
                      <Check size={15} className="text-green" /> {junctions.length} junction{junctions.length === 1 ? '' : 's'} set on frame #{junctions[0].frameNumber} ({formatTime(junctions[0].timestampSec)})
                    </p>

                    <div className="space-y-1.5">
                      {junctions.map((j, i) => (
                        <div
                          key={j.id}
                          className="flex items-center gap-2.5 rounded-md border border-line-soft bg-asphalt/40 px-3 py-2 text-xs font-mono"
                        >
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: shapeColor(i) }} />
                          <span className="text-text shrink-0">Junction {i + 1}</span>
                          <span className="text-muted-2 capitalize shrink-0">{j.shape}</span>
                          <span className="text-muted-2 truncate">
                            {j.shape === 'polygon'
                              ? `${j.points.length} points`
                              : `x=${Math.round(j.box.x)}, y=${Math.round(j.box.y)}, w=${Math.round(j.box.width)}, h=${Math.round(j.box.height)}`}
                          </span>
                          <button
                            onClick={() => removeJunction(j.id)}
                            className="ml-auto text-muted hover:text-red transition-colors shrink-0"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-2 font-mono">
                      frame {junctions[0].frameWidth}×{junctions[0].frameHeight}px — draw more shapes above, or run detection.
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => runPipeline('junction', junctions)}
                        className="inline-flex items-center gap-2 rounded-md bg-amber text-asphalt font-semibold px-5 py-2.5 hover:bg-amber-dim hover:text-text transition-colors"
                      >
                        <Play size={16} /> Run Detection
                      </button>
                      <button
                        onClick={clearAllJunctions}
                        className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm text-muted hover:text-text transition-colors"
                      >
                        <Crop size={15} /> Clear all &amp; redraw
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Processing state */}
        {status === 'processing' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl panel-border bg-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="flex items-center gap-2 font-mono text-sm text-cyan">
                <Loader2 size={16} className="animate-spin" /> Processing on backend
              </span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted-2">
                <Clock size={13} /> {formatTime(elapsed)}
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-line overflow-hidden mb-5">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan to-transparent animate-ticker" style={{ animationDuration: '1.8s' }} />
            </div>

            <div className="space-y-2.5">
              {activeSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-3 font-mono text-xs">
                  {i < stepIndex ? (
                    <CheckCircle2 size={14} className="text-green shrink-0" />
                  ) : i === stepIndex ? (
                    <Loader2 size={14} className="text-cyan animate-spin shrink-0" />
                  ) : (
                    <Cog size={14} className="text-muted-2 shrink-0" />
                  )}
                  <span className={i <= stepIndex ? 'text-text' : 'text-muted-2'}>{step}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-2 mt-5 leading-relaxed">
              Video processing runs on a Colab GPU behind an ngrok tunnel and can take
              anywhere from under a minute to several minutes depending on clip length.
              This page will keep waiting — no need to refresh.
            </p>

            <button
              onClick={cancelProcessing}
              className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-red transition-colors"
            >
              <XCircle size={15} /> Cancel
            </button>
          </motion.div>
        )}

        {/* Results */}
        {status === 'done' && result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-xl panel-border bg-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 font-mono text-sm text-green">
                  <CheckCircle2 size={16} /> Processing complete
                </span>
                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted hover:text-cyan transition-colors font-mono">
                  <RotateCcw size={13} /> Run another
                </button>
              </div>

              {result.videoUrl ? (
                <ResultVideoPlayer src={result.videoUrl} />
              ) : (
                <p className="text-sm text-muted">
                  The backend didn't return an output video URL — check the logs below,
                  or the raw response in your browser console.
                </p>
              )}
            </div>

            <div className="rounded-xl panel-border bg-panel overflow-hidden">
              <div className="px-5 py-4 border-b border-line-soft font-mono text-sm flex items-center justify-between">
                <span>Detection log</span>
                <span className="text-muted-2 text-xs">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              {logs.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted text-center">
                  No structured logs were returned for this run.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="text-left text-muted-2 text-xs border-b border-line-soft">
                        {Object.keys(logs[0]).map((k) => (
                          <th key={k} className="px-4 py-2.5 whitespace-nowrap font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((row, i) => (
                        <tr key={i} className="border-b border-line-soft/60 hover:bg-panel-2/60">
                          {Object.entries(row).map(([k, v]) => (
                            <td key={k} className="px-4 py-2.5 whitespace-nowrap text-muted">
                              {k.toLowerCase().includes('violation') ? (
                                <StatusBadge status={v} />
                              ) : (
                                String(v)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
        </>
        )}

        {/* View results tab: everything the backend's public output folder has, sorted */}
        {activeTab === 'results' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="rounded-xl panel-border bg-panel p-4 flex items-center justify-between flex-wrap gap-3">
              <span className="flex items-center gap-2 font-mono text-sm">
                <ListVideo size={15} className="text-cyan" />
                Processed videos
                {videosLoaded && !videosError && (
                  <span className="text-muted-2 text-xs">— {videosList.length} total</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVideosOrder}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-mono text-muted hover:text-text transition-colors"
                >
                  <ArrowUpDown size={13} /> {videosOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                </button>
                <button
                  onClick={() => fetchVideos()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-mono text-muted hover:text-cyan transition-colors"
                >
                  <RefreshCw size={13} className={videosLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {videosError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{videosError}</span>
              </div>
            )}

            {videosLoading && videosList.length === 0 && !videosError && (
              <div className="flex items-center justify-center gap-2 rounded-xl panel-border bg-panel py-16 text-sm text-muted">
                <Loader2 size={16} className="animate-spin text-cyan" /> Loading processed videos…
              </div>
            )}

            {!videosLoading && videosLoaded && videosList.length === 0 && !videosError && (
              <div className="rounded-xl panel-border bg-panel py-16 text-center text-sm text-muted">
                No processed videos yet — run detection on a clip and it'll show up here.
              </div>
            )}

            {videosList.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {videosList.map((v) => (
                  <VideoCard key={v.id} v={v} resolveVideoUrl={resolveVideoUrl} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  )
}
