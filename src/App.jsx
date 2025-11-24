import { useState } from 'react'
import ImagePrep from './components/ImagePrep'
import SymmetryStudio from './components/SymmetryStudio'

function App() {
  // Workflow step: 1 for 'Prep', 2 for 'Studio'
  const [workflowStep, setWorkflowStep] = useState(1)
  
  // Store the final processed image data passed from Stage 1 to Stage 2
  const [sourceImage, setSourceImage] = useState(null)

  // Handle confirmation from ImagePrep - move to Stage 2
  const handleImageConfirm = (processedImageBlob) => {
    setSourceImage(processedImageBlob)
    setWorkflowStep(2)
  }

  // Handle back button - return to Stage 1
  const handleBack = () => {
    setWorkflowStep(1)
    // Optionally clear sourceImage when going back
    // setSourceImage(null)
  }

  // Conditional rendering based on workflow step
  if (workflowStep === 1) {
    return <ImagePrep onConfirm={handleImageConfirm} />
  }

  if (workflowStep === 2) {
    return <SymmetryStudio sourceImage={sourceImage} onBack={handleBack} />
  }

  // Fallback (should not reach here)
  return null
}

export default App

