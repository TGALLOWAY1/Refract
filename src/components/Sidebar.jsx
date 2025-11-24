import { useState } from 'react'
import PreviewGrid from './PreviewGrid'
import { exportHighResImage, downloadBlob } from '../utils/exportImage'

function Sidebar({ 
  originalImage, 
  midpoint, 
  onMidpointChange,
  activePreviewIndex,
  onActivePreviewChange,
  onBack
}) {
  const [isExporting, setIsExporting] = useState(false)

  // Fixed values - transformations are already baked into the source image
  const rotation = 0
  const zoom = 1.0

  const handleExport = async () => {
    if (activePreviewIndex === null || !originalImage) {
      alert('Please select a preview to export')
      return
    }

    setIsExporting(true)
    try {
      // Generate high-res export (rotation and zoom are already baked, so use 0 and 1.0)
      const blob = await exportHighResImage(
        originalImage.imageElement,
        midpoint,
        rotation,
        zoom,
        activePreviewIndex
      )
      
      const quadrantLabels = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right']
      const filename = `refract-${quadrantLabels[activePreviewIndex].toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      downloadBlob(blob, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export image. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }
  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col shadow-xl">
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Refract</h1>
            <p className="text-sm text-gray-400 mt-1">Symmetry Studio</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              title="Back to Image Prep"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {originalImage && (
          <>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instructions</h3>
              <p className="text-sm text-gray-400">
                Drag the crosshair on the canvas to adjust the symmetry midpoint. Select a preview below to download.
              </p>
            </div>

            <PreviewGrid 
              originalImage={originalImage} 
              midpoint={midpoint}
              rotation={rotation}
              zoom={zoom}
              activePreviewIndex={activePreviewIndex}
              onActivePreviewChange={onActivePreviewChange}
            />
          </>
        )}

        {!originalImage && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No image loaded</p>
          </div>
        )}

        {/* Export Button */}
        {originalImage && (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={handleExport}
              disabled={activePreviewIndex === null || isExporting}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                activePreviewIndex !== null && !isExporting
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isExporting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download High-Res
                </span>
              )}
            </button>
            {activePreviewIndex === null && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Select a preview above to export
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar

