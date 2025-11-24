import { useEffect, useRef, useMemo } from 'react'
import { generateSymmetries } from '../utils/generateSymmetries'

function PreviewGrid({ originalImage, midpoint, rotation, zoom, activePreviewIndex, onActivePreviewChange }) {
  const canvasRef1 = useRef(null)
  const canvasRef2 = useRef(null)
  const canvasRef3 = useRef(null)
  const canvasRef4 = useRef(null)
  
  const canvasRefs = useMemo(() => [canvasRef1, canvasRef2, canvasRef3, canvasRef4], [])

  // Generate symmetrical patterns when image, midpoint, rotation, or zoom changes
  // Use 'preview' quality (max 1024px) for fast rendering
  const symmetricalPatterns = useMemo(() => {
    if (!originalImage || !midpoint) return []
    return generateSymmetries(originalImage.imageElement, midpoint, rotation, zoom, 'preview')
  }, [originalImage, midpoint, rotation, zoom])

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
    <div className="space-y-4 pt-2 border-t border-gray-700">
      <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Symmetry Previews</h2>
      <div className="grid grid-cols-2 gap-3">
        {canvasRefs.map((canvasRef, index) => {
          const isActive = activePreviewIndex === index
          return (
            <div 
              key={index} 
              className="space-y-2 cursor-pointer group"
              onClick={() => onActivePreviewChange(index)}
            >
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className={`w-full border-2 rounded-lg bg-gray-700 transition-all shadow-md ${
                    isActive 
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 shadow-blue-500/20' 
                      : 'border-gray-600 group-hover:border-gray-500 group-hover:shadow-lg'
                  }`}
                  style={{ aspectRatio: '1 / 1' }}
                />
                {isActive && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium shadow-lg">
                    Active
                  </div>
                )}
              </div>
              <p className={`text-xs text-center transition-colors font-medium ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {quadrantLabels[index]}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PreviewGrid

