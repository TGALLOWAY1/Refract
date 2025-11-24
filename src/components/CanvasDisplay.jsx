import { useEffect, useRef, useState } from 'react'

function CanvasDisplay({ originalImage }) {
  const canvasRef = useRef(null)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  // Calculate display size to fit canvas while maintaining aspect ratio
  useEffect(() => {
    const updateDisplaySize = () => {
      const container = canvasRef.current?.parentElement
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

  // Render image to canvas
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

    // Draw image scaled to fit
    if (displaySize.width > 0 && displaySize.height > 0) {
      ctx.drawImage(
        originalImage.imageElement,
        0,
        0,
        displaySize.width,
        displaySize.height
      )
    }
  }, [originalImage, displaySize])

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        {originalImage ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{
              width: `${displaySize.width}px`,
              height: `${displaySize.height}px`
            }}
          />
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

