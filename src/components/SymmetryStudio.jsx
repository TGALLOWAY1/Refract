import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import CanvasDisplay from './CanvasDisplay'

function SymmetryStudio({ sourceImage, onBack }) {
  // Convert sourceImage to image object format expected by the app
  const [originalImage, setOriginalImage] = useState(null)
  
  // Midpoint in normalized coordinates (0 to 1)
  const [midpoint, setMidpoint] = useState({ x: 0.5, y: 0.5 })
  
  // Active preview index (0-3, null if none selected)
  const [activePreviewIndex, setActivePreviewIndex] = useState(null)

  // Fixed values - transformations are already baked into the source image
  const rotation = 0
  const zoom = 1.0

  // Load the source image when component mounts or sourceImage changes
  useEffect(() => {
    if (!sourceImage) return

    // If sourceImage is already in the expected format (has imageElement), use it directly
    if (sourceImage.imageElement) {
      setOriginalImage(sourceImage)
      return
    }

    // Otherwise, convert blob/file to image element
    const loadImage = async () => {
      try {
        let imageUrl
        if (sourceImage instanceof Blob) {
          imageUrl = URL.createObjectURL(sourceImage)
        } else if (sourceImage.file) {
          imageUrl = URL.createObjectURL(sourceImage.file)
        } else {
          console.error('Invalid image format')
          return
        }

        const img = new Image()
        img.onload = () => {
          setOriginalImage({
            file: sourceImage.file || sourceImage,
            imageElement: img,
            width: img.width,
            height: img.height
          })
          // Clean up object URL
          URL.revokeObjectURL(imageUrl)
        }
        img.onerror = () => {
          console.error('Failed to load image')
          URL.revokeObjectURL(imageUrl)
        }
        img.src = imageUrl
      } catch (error) {
        console.error('Error loading image:', error)
      }
    }

    loadImage()
  }, [sourceImage])

  // Reset midpoint when new image is loaded
  useEffect(() => {
    if (originalImage) {
      setMidpoint({ x: 0.5, y: 0.5 })
      setActivePreviewIndex(null)
    }
  }, [originalImage])

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      <Sidebar 
        originalImage={originalImage}
        midpoint={midpoint}
        onMidpointChange={setMidpoint}
        activePreviewIndex={activePreviewIndex}
        onActivePreviewChange={setActivePreviewIndex}
        onBack={onBack}
      />
      <CanvasDisplay 
        originalImage={originalImage}
        midpoint={midpoint}
        onMidpointChange={setMidpoint}
        rotation={rotation}
        zoom={zoom}
      />
    </div>
  )
}

export default SymmetryStudio

