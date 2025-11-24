import { useState } from 'react'
import Sidebar from './components/Sidebar'
import CanvasDisplay from './components/CanvasDisplay'

function App() {
  // Store the original high-resolution image data
  const [originalImage, setOriginalImage] = useState(null)
  
  // Midpoint in normalized coordinates (0 to 1)
  // Initially set to geometric center
  const [midpoint, setMidpoint] = useState({ x: 0.5, y: 0.5 })

  const handleImageUpload = (imageFile) => {
    setOriginalImage(imageFile)
    // Reset midpoint to center when new image is uploaded
    setMidpoint({ x: 0.5, y: 0.5 })
  }

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      <Sidebar 
        onImageUpload={handleImageUpload}
        originalImage={originalImage}
        midpoint={midpoint}
        onMidpointChange={setMidpoint}
      />
      <CanvasDisplay originalImage={originalImage} />
    </div>
  )
}

export default App

