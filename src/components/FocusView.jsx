import { useEffect, useRef, useState } from 'react'
import { generateSymmetries } from '../utils/generateSymmetries'
import { downloadBlob } from '../utils/exportImage'

function FocusView({ 
  originalImage, 
  midpoint, 
  rotation, 
  zoom, 
  previewIndex, 
  onClose 
}) {
  const canvasRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingHighRes, setIsGeneratingHighRes] = useState(false)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  // Calculate display size to fit within max-width: 90vw, max-height: 80vh while maintaining aspect ratio
  useEffect(() => {
    if (!originalImage || previewIndex === null) return

    const calculateDisplaySize = () => {
      // Use preview quality for display (max 1024px)
      const patterns = generateSymmetries(
        originalImage.imageElement,
        midpoint,
        rotation,
        zoom,
        'preview'
      )

      if (!patterns || !patterns[previewIndex]) return

      const pattern = patterns[previewIndex]
      const patternWidth = pattern.width
      const patternHeight = pattern.height
      const patternAspect = patternWidth / patternHeight

      // Calculate max dimensions (90vw and 80vh)
      const maxWidth = window.innerWidth * 0.9  // 90vw
      const maxHeight = window.innerHeight * 0.8 // 80vh

      let displayWidth, displayHeight

      if (patternAspect > maxWidth / maxHeight) {
        // Pattern is wider - fit to max width
        displayWidth = maxWidth
        displayHeight = maxWidth / patternAspect
      } else {
        // Pattern is taller - fit to max height
        displayHeight = maxHeight
        displayWidth = maxHeight * patternAspect
      }

      setDisplaySize({ width: displayWidth, height: displayHeight })
    }

    calculateDisplaySize()
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateDisplaySize)
    return () => window.removeEventListener('resize', calculateDisplaySize)
  }, [originalImage, midpoint, rotation, zoom, previewIndex])

  // Generate and render the pattern (preview quality for fast display)
  useEffect(() => {
    if (!originalImage || previewIndex === null || !canvasRef.current || displaySize.width === 0) return

    // Use preview quality for display (max 1024px)
    const patterns = generateSymmetries(
      originalImage.imageElement,
      midpoint,
      rotation,
      zoom,
      'preview'
    )

    if (!patterns || !patterns[previewIndex]) return

    const pattern = patterns[previewIndex]
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas internal size to pattern dimensions
    canvas.width = pattern.width
    canvas.height = pattern.height

    // Set canvas display size to calculated display size
    canvas.style.width = `${displaySize.width}px`
    canvas.style.height = `${displaySize.height}px`

    // Create temporary canvas to render the pattern
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = pattern.width
    tempCanvas.height = pattern.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.putImageData(pattern, 0, 0)

    // Draw the pattern to the display canvas
    ctx.drawImage(tempCanvas, 0, 0)
  }, [originalImage, midpoint, rotation, zoom, previewIndex, displaySize])

  // Generate high-resolution export and download
  const generateHighResExport = async (quadrantIndex) => {
    if (!originalImage || quadrantIndex === null) return

    setIsGeneratingHighRes(true)
    
    try {
      // Generate at full resolution
      const patterns = generateSymmetries(
        originalImage.imageElement,
        midpoint,
        rotation,
        zoom,
        'high-res'
      )

      if (!patterns || !patterns[quadrantIndex]) {
        throw new Error('Failed to generate high-resolution pattern')
      }

      const pattern = patterns[quadrantIndex]
      const imgWidth = originalImage.imageElement.width
      const imgHeight = originalImage.imageElement.height

      // Create canvas at full resolution
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = imgWidth
      exportCanvas.height = imgHeight
      const ctx = exportCanvas.getContext('2d')

      // Create temporary canvas with the pattern
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = pattern.width
      tempCanvas.height = pattern.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.putImageData(pattern, 0, 0)

      // Draw the pattern scaled to original resolution
      ctx.drawImage(tempCanvas, 0, 0, imgWidth, imgHeight)

      // Convert to blob
      const blob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/png',
          1.0 // Maximum quality
        )
      })

      // Download the blob
      const quadrantLabels = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right']
      const filename = `refract-${quadrantLabels[quadrantIndex].toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      downloadBlob(blob, filename)

      // Clear high-res data from memory
      patterns.forEach(pattern => {
        // ImageData is automatically garbage collected, but we can help by clearing references
        if (pattern.data) {
          // ImageData doesn't have a direct clear method, but setting to null helps GC
        }
      })
      
      // Clear canvas references
      exportCanvas.width = 0
      exportCanvas.height = 0
      tempCanvas.width = 0
      tempCanvas.height = 0

    } catch (error) {
      console.error('High-res export failed:', error)
      alert('Failed to generate high-resolution image. Please try again.')
    } finally {
      setIsGeneratingHighRes(false)
    }
  }

  const handleDownload = async () => {
    if (!originalImage || previewIndex === null) return
    await generateHighResExport(previewIndex)
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (previewIndex === null) return null

  const quadrantLabels = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right']

  return (
    <div 
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="flex flex-col items-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh'
          }}
        />
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            disabled={isGeneratingHighRes}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              !isGeneratingHighRes
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGeneratingHighRes ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating High Res...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
        <p className="text-sm text-gray-300">
          {quadrantLabels[previewIndex]}
        </p>
      </div>
    </div>
  )
}

export default FocusView

