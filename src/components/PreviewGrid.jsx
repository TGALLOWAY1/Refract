import { useEffect, useRef, useMemo } from 'react'
import { generateSymmetries } from '../utils/generateSymmetries'

function PreviewGrid({ originalImage, midpoint }) {
  const canvasRef1 = useRef(null)
  const canvasRef2 = useRef(null)
  const canvasRef3 = useRef(null)
  const canvasRef4 = useRef(null)
  
  const canvasRefs = useMemo(() => [canvasRef1, canvasRef2, canvasRef3, canvasRef4], [])

  // Generate symmetrical patterns when image or midpoint changes
  const symmetricalPatterns = useMemo(() => {
    if (!originalImage || !midpoint) return []
    return generateSymmetries(originalImage.imageElement, midpoint)
  }, [originalImage, midpoint])

  // Render each pattern to its corresponding canvas
  useEffect(() => {
    if (!originalImage || symmetricalPatterns.length === 0) return

    const canvasSize = 200 // Size for each preview canvas

    canvasRefs.forEach((canvasRef, index) => {
      const canvas = canvasRef.current
      if (!canvas || !symmetricalPatterns[index]) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      canvas.width = canvasSize
      canvas.height = canvasSize

      // Scale the pattern to fit the preview canvas
      const pattern = symmetricalPatterns[index]
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = pattern.width
      tempCanvas.height = pattern.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.putImageData(pattern, 0, 0)

      // Draw scaled pattern to preview canvas
      ctx.drawImage(tempCanvas, 0, 0, canvasSize, canvasSize)
    })
  }, [symmetricalPatterns, originalImage, canvasRefs])

  if (!originalImage) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm">Upload an image to see symmetry previews</p>
      </div>
    )
  }

  const quadrantLabels = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right']

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Symmetry Previews</h2>
      <div className="grid grid-cols-2 gap-4">
        {canvasRefs.map((canvasRef, index) => (
          <div key={index} className="space-y-2">
            <canvas
              ref={canvasRef}
              className="w-full border border-gray-600 rounded bg-gray-700"
              style={{ aspectRatio: '1 / 1' }}
            />
            <p className="text-xs text-gray-400 text-center">
              {quadrantLabels[index]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PreviewGrid

