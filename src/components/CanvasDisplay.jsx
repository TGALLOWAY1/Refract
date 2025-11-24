import { useEffect, useRef, useState, useCallback } from 'react'
import { debounce } from '../utils/debounce'

function CanvasDisplay({ originalImage, midpoint, onMidpointChange, rotation, zoom }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  // Local state for crosshair position - only updates CSS, doesn't trigger heavy calculations
  const [crosshairPosition, setCrosshairPosition] = useState(midpoint)

  // Calculate display size to fit canvas while maintaining aspect ratio
  useEffect(() => {
    const updateDisplaySize = () => {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      if (originalImage) {
        const imageAspect = originalImage.width / originalImage.height
        const containerAspect = containerWidth / containerHeight

        let displayWidth, displayHeight

        if (imageAspect > containerAspect) {
          // Image is wider - fit to width
          displayWidth = containerWidth
          displayHeight = containerWidth / imageAspect
        } else {
          // Image is taller - fit to height
          displayHeight = containerHeight
          displayWidth = containerHeight * imageAspect
        }

        setDisplaySize({ width: displayWidth, height: displayHeight })
      } else {
        setDisplaySize({ width: containerWidth, height: containerHeight })
      }
    }

    updateDisplaySize()
    window.addEventListener('resize', updateDisplaySize)
    return () => window.removeEventListener('resize', updateDisplaySize)
  }, [originalImage])

  // Render image to canvas with rotation and zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !originalImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to display size
    canvas.width = displaySize.width
    canvas.height = displaySize.height

    // Clear canvas
    ctx.fillStyle = '#1f2937' // gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (displaySize.width > 0 && displaySize.height > 0) {
      ctx.save()

      // Move to center for rotation and zoom
      const centerX = displaySize.width / 2
      const centerY = displaySize.height / 2
      ctx.translate(centerX, centerY)

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180)

      // Apply zoom (scale around center)
      ctx.scale(zoom, zoom)

      // Draw image centered
      ctx.drawImage(
        originalImage.imageElement,
        -displaySize.width / 2,
        -displaySize.height / 2,
        displaySize.width,
        displaySize.height
      )

      ctx.restore()
    }
  }, [originalImage, displaySize, rotation, zoom])

  // Convert screen coordinates to normalized image coordinates
  const screenToNormalized = useCallback((screenX, screenY) => {
    if (!originalImage || displaySize.width === 0 || displaySize.height === 0) {
      return { x: 0.5, y: 0.5 }
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0.5, y: 0.5 }

    // Get relative position within canvas
    const relativeX = screenX - rect.left
    const relativeY = screenY - rect.top

    // Convert to normalized coordinates (0 to 1)
    const normalizedX = Math.max(0, Math.min(1, relativeX / rect.width))
    const normalizedY = Math.max(0, Math.min(1, relativeY / rect.height))

    return { x: normalizedX, y: normalizedY }
  }, [originalImage, displaySize])

  // Debounced update for heavy symmetry calculation (150ms as specified)
  const debouncedUpdateMidpointRef = useRef(
    debounce((newMidpoint) => {
      onMidpointChange(newMidpoint)
    }, 150)
  )

  // Update debounced function when onMidpointChange changes
  useEffect(() => {
    debouncedUpdateMidpointRef.current = debounce((newMidpoint) => {
      onMidpointChange(newMidpoint)
    }, 150)
  }, [onMidpointChange])

  // Handle mouse down on crosshair
  const handleMouseDown = useCallback((e) => {
    if (!originalImage) return
    setIsDragging(true)
    const normalized = screenToNormalized(e.clientX, e.clientY)
    // Update crosshair position instantly (CSS only)
    setCrosshairPosition(normalized)
  }, [originalImage, screenToNormalized])

  // Handle mouse move while dragging - ONLY update CSS position (instant, 60fps)
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !originalImage) return
    const normalized = screenToNormalized(e.clientX, e.clientY)
    // Only update crosshair CSS position - no heavy calculations
    setCrosshairPosition(normalized)
  }, [isDragging, originalImage, screenToNormalized])

  // Handle mouse up - trigger heavy calculation with debounce
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Trigger heavy symmetry calculation on mouseup with debounce
      debouncedUpdateMidpointRef.current(crosshairPosition)
    }
    setIsDragging(false)
  }, [isDragging, crosshairPosition])

  // Sync crosshair position with midpoint when not dragging (e.g., when changed from sidebar)
  useEffect(() => {
    if (!isDragging) {
      setCrosshairPosition(midpoint)
    }
  }, [midpoint, isDragging])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden">
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center relative"
      >
        {originalImage ? (
          <div className="relative" style={{ width: `${displaySize.width}px`, height: `${displaySize.height}px` }}>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`
              }}
            />
            {/* Crosshair overlay - lightweight div layer for instant CSS updates */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`
              }}
            >
              {/* Vertical line */}
              <div
                className="absolute bg-white opacity-60 pointer-events-auto cursor-move hover:opacity-80 transition-opacity"
                style={{
                  left: `${crosshairPosition.x * 100}%`,
                  top: 0,
                  width: '2px',
                  height: '100%',
                  transform: 'translateX(-50%)'
                }}
                onMouseDown={handleMouseDown}
              />
              {/* Horizontal line */}
              <div
                className="absolute bg-white opacity-60 pointer-events-auto cursor-move hover:opacity-80 transition-opacity"
                style={{
                  left: 0,
                  top: `${crosshairPosition.y * 100}%`,
                  width: '100%',
                  height: '2px',
                  transform: 'translateY(-50%)'
                }}
                onMouseDown={handleMouseDown}
              />
              {/* Center point */}
              <div
                className="absolute bg-white border-2 border-gray-900 rounded-full pointer-events-auto cursor-move hover:scale-110 transition-transform"
                style={{
                  left: `${crosshairPosition.x * 100}%`,
                  top: `${crosshairPosition.y * 100}%`,
                  width: '12px',
                  height: '12px',
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={handleMouseDown}
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-lg">No image loaded</p>
            <p className="text-sm mt-2">Upload an image to get started</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default CanvasDisplay

