import { useEffect, useRef } from 'react'

const BLACK_THRESHOLD = 32
const SOFT_THRESHOLD = 84
const RED_DOMINANCE_GAP = 18
const RENDER_SIZE = 160
const SUBJECT_PADDING_RATIO = 0.97

const stripBlackBackground = (data) => {
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const alpha = data[index + 3]
    const brightness = Math.max(red, green, blue)
    const isStrongRed = red > green + RED_DOMINANCE_GAP && red > blue + RED_DOMINANCE_GAP

    if (!isStrongRed && brightness <= BLACK_THRESHOLD) {
      data[index + 3] = 0
      continue
    }

    if (!isStrongRed && brightness < SOFT_THRESHOLD) {
      const ratio = (brightness - BLACK_THRESHOLD) / (SOFT_THRESHOLD - BLACK_THRESHOLD)
      data[index + 3] = Math.max(0, Math.min(255, Math.round(alpha * ratio)))
    }
  }
}

const findOpaqueBounds = (data, width, height, alphaThreshold = 18) => {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]

      if (alpha <= alphaThreshold) continue

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < minX || maxY < minY) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function BrandMark({ className = '' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return undefined

    const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true })
    if (!context) return undefined

    const workingCanvas = document.createElement('canvas')
    const workingContext = workingCanvas.getContext('2d', { alpha: true, willReadFrequently: true })
    if (!workingContext) return undefined

    let rafId = 0
    let frameCallbackId = 0
    let disposed = false

    const cancelScheduledFrame = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }

      if (frameCallbackId && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(frameCallbackId)
        frameCallbackId = 0
      }
    }

    const scheduleFrame = () => {
      if (disposed) return

      if (typeof video.requestVideoFrameCallback === 'function') {
        frameCallbackId = video.requestVideoFrameCallback(() => {
          frameCallbackId = 0
          renderFrame()
        })
        return
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        renderFrame()
      })
    }

    const renderFrame = () => {
      if (disposed) return

      if (video.readyState < 2 || video.paused || video.ended) {
        scheduleFrame()
        return
      }

      const targetSize = Math.round(RENDER_SIZE * (window.devicePixelRatio || 1))

      if (canvas.width !== targetSize || canvas.height !== targetSize) {
        canvas.width = targetSize
        canvas.height = targetSize
      }

      if (workingCanvas.width !== targetSize || workingCanvas.height !== targetSize) {
        workingCanvas.width = targetSize
        workingCanvas.height = targetSize
      }

      const sourceWidth = video.videoWidth || targetSize
      const sourceHeight = video.videoHeight || targetSize
      const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight)
      const drawWidth = sourceWidth * scale
      const drawHeight = sourceHeight * scale
      const offsetX = (targetSize - drawWidth) / 2
      const offsetY = (targetSize - drawHeight) / 2

      workingContext.clearRect(0, 0, targetSize, targetSize)
      workingContext.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

      const frame = workingContext.getImageData(0, 0, targetSize, targetSize)
      stripBlackBackground(frame.data)
      workingContext.putImageData(frame, 0, 0)

      const subjectBounds = findOpaqueBounds(frame.data, targetSize, targetSize)

      context.clearRect(0, 0, targetSize, targetSize)

      if (subjectBounds) {
        const paddedSize = targetSize * SUBJECT_PADDING_RATIO
        const subjectScale = Math.min(paddedSize / subjectBounds.width, paddedSize / subjectBounds.height)
        const finalWidth = subjectBounds.width * subjectScale
        const finalHeight = subjectBounds.height * subjectScale
        const finalX = (targetSize - finalWidth) / 2
        const finalY = (targetSize - finalHeight) / 2

        context.drawImage(
          workingCanvas,
          subjectBounds.x,
          subjectBounds.y,
          subjectBounds.width,
          subjectBounds.height,
          finalX,
          finalY,
          finalWidth,
          finalHeight,
        )
      }

      scheduleFrame()
    }

    const start = () => {
      video.play().catch(() => {})
      cancelScheduledFrame()
      renderFrame()
    }

    video.addEventListener('loadeddata', start)
    video.addEventListener('play', start)
    start()

    return () => {
      disposed = true
      cancelScheduledFrame()
      video.removeEventListener('loadeddata', start)
      video.removeEventListener('play', start)
    }
  }, [])

  return (
    <div className={`brand-mark${className ? ` ${className}` : ''}`} aria-label="Legasus storefront">
      <span className="brand-mark__media" aria-hidden="true">
        <video ref={videoRef} className="brand-mark__source" autoPlay loop muted playsInline preload="auto">
          <source src="/legasus-logo-animation.mp4" type="video/mp4" />
        </video>
        <canvas ref={canvasRef} className="brand-mark__canvas" />
      </span>
      <strong>LEGASUS</strong>
    </div>
  )
}

export default BrandMark
