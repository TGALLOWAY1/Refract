import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, ArrowRight, X, Grid3x3, Crop, ZoomIn, Move, RotateCcw, Minus, MoreVertical } from 'lucide-react'
import ImageUploader from './ImageUploader'

const VIEWPORT_HEIGHT = 600

/**
 * Maps a 0-100 slider value to a scale range of 0.8x to 1.2x
 * @param {number} value - Slider value (0-100)
 * @returns {number} Scale value (0.8 to 1.2)
 */
function mapZoomToScale(value) {
  // Linear interpolation: 0 -> 0.8, 100 -> 1.2
  return 0.8 + (value / 100) * (1.2 - 0.8)
}

/**
 * Maps a 0-100 slider value to a translate percentage range of -15% to +15%
 * @param {number} value - Slider value (0-100)
 * @returns {number} Translate percentage (-15 to 15)
 */
function mapPanToTranslate(value) {
  // Linear interpolation: 0 -> -15%, 100 -> +15%
  return -15 + (value / 100) * (15 - (-15))
}

function ImagePrep({ onConfirm }) {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [zoom, setZoom] = useState(50) // Default to middle (1.0x scale)
  const [panX, setPanX] = useState(50) // Default to center (0% translate)
  const [panY, setPanY] = useState(50) // Default to center (0% translate)
  const [showGrid, setShowGrid] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const [mirrorAxis, setMirrorAxis] = useState('vertical') // 'vertical' or 'horizontal'
  const [selectedPreview, setSelectedPreview] = useState(null) // 0 for first, 1 for second, null for none
  const [cropInset, setCropInset] = useState({ left: 0, right: 0, top: 0, bottom: 0 }) // Percentages 0-100
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const viewportRef = useRef(null)

  const handleImageUpload = useCallback((imageFile) => {
    setUploadedImage(imageFile)
    // Reset transformations when new image is uploaded
    setZoom(50)
    setPanX(50)
    setPanY(50)
    setCropInset({ left: 0, right: 0, top: 0, bottom: 0 })
  }, [])

  // Handler to update crop inset values
  const handleCropChange = useCallback((side, value) => {
    setCropInset(prev => ({
      ...prev,
      [side]: Math.max(0, Math.min(100, value)) // Clamp between 0-100
    }))
  }, [])

  // Convert screen X coordinate to percentage for crop inset
  const screenXToPercentage = useCallback((screenX) => {
    const viewport = viewportRef.current
    if (!viewport) return 0
    
    const rect = viewport.getBoundingClientRect()
    const relativeX = screenX - rect.left
    const percentage = (relativeX / rect.width) * 100
    return Math.max(0, Math.min(100, percentage))
  }, [])

  // Handle left handle drag start
  const handleLeftDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingLeft(true)
  }, [])

  // Handle right handle drag start
  const handleRightDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingRight(true)
  }, [])

  // Handle mouse move for dragging
  const handleDragMove = useCallback((e) => {
    if (!isDraggingLeft && !isDraggingRight) return
    
    const percentage = screenXToPercentage(e.clientX)
    
    if (isDraggingLeft) {
      // Ensure left doesn't exceed right
      const maxLeft = 100 - cropInset.right
      handleCropChange('left', Math.min(percentage, maxLeft))
    } else if (isDraggingRight) {
      // Ensure right doesn't exceed left
      const maxRight = 100 - cropInset.left
      handleCropChange('right', Math.min(100 - percentage, maxRight))
    }
  }, [isDraggingLeft, isDraggingRight, screenXToPercentage, handleCropChange, cropInset])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDraggingLeft(false)
    setIsDraggingRight(false)
  }, [])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDraggingLeft, isDraggingRight, handleDragMove, handleDragEnd])

  // Calculate transform values using helper functions
  const scale = mapZoomToScale(zoom)
  const translateX = mapPanToTranslate(panX)
  const translateY = mapPanToTranslate(panY)

  const handleConfirm = useCallback(() => {
    if (!uploadedImage) {
      alert('Please upload an image first')
      return
    }
    // Pass the processed image with transformation metadata
    // The image will be baked with transformations in the next stage if needed
    onConfirm({
      ...uploadedImage,
      transform: {
        scale,
        translateX,
        translateY
      },
      mirrorAxis,
      selectedPreview,
      cropInset
    })
  }, [uploadedImage, scale, translateX, translateY, onConfirm])

  const handleClear = useCallback(() => {
    setUploadedImage(null)
    setZoom(50)
    setPanX(50)
    setPanY(50)
  }, [])

  const handleReset = useCallback(() => {
    setZoom(50)
    setPanX(50)
    setPanY(50)
    setCropInset({ left: 0, right: 0, top: 0, bottom: 0 })
  }, [])

  return (
    <div className="min-h-screen w-screen bg-zinc-900 text-gray-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Image Prep</h1>
            <p className="text-lg text-zinc-400">
              Upload and adjust your image for symmetry generation
            </p>
          </div>
          
          {/* Mirror Axis Toggle - Only show when image is uploaded */}
          {uploadedImage && (
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg bg-zinc-800 p-1 border border-zinc-700">
                <button
                  onClick={() => setMirrorAxis('vertical')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                    mirrorAxis === 'vertical'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <MoreVertical className="w-4 h-4" />
                  Vertical Axis
                </button>
                <button
                  onClick={() => setMirrorAxis('horizontal')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                    mirrorAxis === 'horizontal'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Horizontal Axis
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {!uploadedImage && (
          <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        )}

        {/* Viewport and Controls */}
        {uploadedImage && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Viewport Container */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative w-full bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden shadow-xl">
                {/* Viewport - Fixed height with hidden overflow */}
                <div 
                  ref={viewportRef}
                  className="relative"
                  style={{
                    height: `${VIEWPORT_HEIGHT}px`,
                    overflow: 'hidden',
                    backgroundColor: '#1f2937'
                  }}
                >
                  {/* Image with transformations applied */}
                  <img
                    src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.1s ease-out'
                    }}
                  />

                  {/* Symmetry Grid Overlay - Absolutely positioned, doesn't move with image */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* 4x4 Background Grid */}
                      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                        {/* Vertical lines */}
                        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#64748b" strokeWidth="1" />
                        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#64748b" strokeWidth="1" />
                        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#64748b" strokeWidth="1" />
                        {/* Horizontal lines */}
                        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#64748b" strokeWidth="1" />
                        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#64748b" strokeWidth="1" />
                        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#64748b" strokeWidth="1" />
                      </svg>
                      {/* Mirror Axis Line - Cyan/Bright Blue */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Vertical axis line */}
                        {mirrorAxis === 'vertical' && (
                          <div className="absolute w-0.5 h-full bg-cyan-400" style={{ boxShadow: '0 0 4px rgba(34, 211, 238, 0.8)' }} />
                        )}
                        {/* Horizontal axis line */}
                        {mirrorAxis === 'horizontal' && (
                          <div className="absolute h-0.5 w-full bg-cyan-400" style={{ boxShadow: '0 0 4px rgba(34, 211, 238, 0.8)' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Crop Mode Overlay - Curtain style with draggable handles */}
                  {cropMode && (
                    <div className="absolute inset-0 pointer-events-auto">
                      {/* Left Curtain */}
                      {cropInset.left > 0 && (
                        <div
                          className="absolute top-0 bottom-0 bg-black/60"
                          style={{
                            left: 0,
                            width: `${cropInset.left}%`
                          }}
                        />
                      )}
                      
                      {/* Right Curtain */}
                      {cropInset.right > 0 && (
                        <div
                          className="absolute top-0 bottom-0 bg-black/60"
                          style={{
                            right: 0,
                            width: `${cropInset.right}%`
                          }}
                        />
                      )}

                      {/* Left Handle Bar */}
                      <div
                        onMouseDown={handleLeftDragStart}
                        className="absolute top-0 bottom-0 cursor-ew-resize z-10"
                        style={{
                          left: `${cropInset.left}%`,
                          width: '4px',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-full bg-white"
                          style={{
                            boxShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 255, 255, 0.5)'
                          }}
                        />
                      </div>

                      {/* Right Handle Bar */}
                      <div
                        onMouseDown={handleRightDragStart}
                        className="absolute top-0 bottom-0 cursor-ew-resize z-10"
                        style={{
                          right: `${cropInset.right}%`,
                          width: '4px',
                          transform: 'translateX(50%)'
                        }}
                      >
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-full bg-white"
                          style={{
                            boxShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 255, 255, 0.5)'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Viewport</p>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 space-y-6 bg-zinc-800 rounded-lg p-6 border border-zinc-700">
              {/* Toggle Buttons */}
              <div className="flex gap-3 pb-4 border-b border-zinc-700">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    showGrid
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-gray-200'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setCropMode(!cropMode)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    cropMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-gray-200'
                  }`}
                >
                  <Crop className="w-4 h-4" />
                  Crop
                </button>
              </div>

              {/* Zoom Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-gray-300" />
                    <span className="text-sm font-medium text-gray-200">Zoom</span>
                  </div>
                  <span className="text-sm text-zinc-300 font-mono font-semibold">
                    {scale.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${zoom}%, #3f3f46 ${zoom}%, #3f3f46 100%)`
                  }}
                />
              </div>

              {/* Pan X Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-gray-300 rotate-90" />
                    <span className="text-sm font-medium text-gray-200">Pan X</span>
                  </div>
                  <span className="text-sm text-zinc-300 font-mono font-semibold">
                    {translateX > 0 ? '+' : ''}{translateX.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={panX}
                  onChange={(e) => setPanX(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${panX}%, #3f3f46 ${panX}%, #3f3f46 100%)`
                  }}
                />
              </div>

              {/* Pan Y Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-gray-300" />
                    <span className="text-sm font-medium text-gray-200">Pan Y</span>
                  </div>
                  <span className="text-sm text-zinc-300 font-mono font-semibold">
                    {translateY > 0 ? '+' : ''}{translateY.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={panY}
                  onChange={(e) => setPanY(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${panY}%, #3f3f46 ${panY}%, #3f3f46 100%)`
                  }}
                />
              </div>

              {/* Crop Controls Section - Only show when cropMode is active */}
              {cropMode && (
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Crop Controls</h3>
                  
                  {/* Trim Left Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-200">Trim Left</span>
                      <span className="text-sm text-zinc-300 font-mono font-semibold">
                        Left: {cropInset.left.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={cropInset.left}
                      onChange={(e) => handleCropChange('left', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(cropInset.left / 50) * 100}%, #3f3f46 ${(cropInset.left / 50) * 100}%, #3f3f46 100%)`
                      }}
                    />
                  </div>

                  {/* Trim Right Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-200">Trim Right</span>
                      <span className="text-sm text-zinc-300 font-mono font-semibold">
                        Right: {cropInset.right.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={cropInset.right}
                      onChange={(e) => handleCropChange('right', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(cropInset.right / 50) * 100}%, #3f3f46 ${(cropInset.right / 50) * 100}%, #3f3f46 100%)`
                      }}
                    />
                  </div>

                  {/* Reset Crop Button */}
                  <button
                    onClick={() => setCropInset({ left: 0, right: 0, top: 0, bottom: 0 })}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Crop
                  </button>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 rounded-lg font-medium bg-zinc-700 hover:bg-zinc-600 text-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-zinc-700">
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reflection Previews Section */}
        {uploadedImage && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Reflection Previews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview 1 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">
                  {mirrorAxis === 'vertical' ? 'Left Side Mirrored' : 'Top Side Mirrored'}
                </h3>
                <div 
                  onClick={() => setSelectedPreview(0)}
                  className={`relative bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedPreview === 0 ? 'ring-4 ring-blue-500' : 'hover:border-zinc-600'
                  }`}
                  style={{ height: '320px' }}
                >
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/20">
                    <p className="text-xs font-medium text-white">
                      {mirrorAxis === 'vertical' ? 'Left Half → Mirrored' : 'Top Half → Mirrored'}
                    </p>
                  </div>
                  <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                    {mirrorAxis === 'vertical' ? (
                      // Vertical: Left half mirrored to right
                      <>
                        {/* Original left half */}
                        <div
                          className="absolute left-0 top-0 w-1/2 h-full"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Left Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                              transformOrigin: 'center center',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                        {/* Mirrored left half on right */}
                        <div
                          className="absolute right-0 top-0 w-1/2 h-full"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Left Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) scaleX(-1)`,
                              transformOrigin: 'center center',
                              clipPath: 'inset(0 50% 0 0)',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      // Horizontal: Top half mirrored to bottom
                      <>
                        {/* Original top half */}
                        <div
                          className="absolute left-0 top-0 w-full h-1/2"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Top Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                              transformOrigin: 'center center',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                        {/* Mirrored top half on bottom */}
                        <div
                          className="absolute left-0 bottom-0 w-full h-1/2"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Top Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) scaleY(-1)`,
                              transformOrigin: 'center center',
                              clipPath: 'inset(50% 0 0 0)',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview 2 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">
                  {mirrorAxis === 'vertical' ? 'Right Side Mirrored' : 'Bottom Side Mirrored'}
                </h3>
                <div 
                  onClick={() => setSelectedPreview(1)}
                  className={`relative bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedPreview === 1 ? 'ring-4 ring-blue-500' : 'hover:border-zinc-600'
                  }`}
                  style={{ height: '320px' }}
                >
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/20">
                    <p className="text-xs font-medium text-white">
                      {mirrorAxis === 'vertical' ? 'Right Half → Mirrored' : 'Bottom Half → Mirrored'}
                    </p>
                  </div>
                  <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                    {mirrorAxis === 'vertical' ? (
                      // Vertical: Right half mirrored to left
                      <>
                        {/* Original right half */}
                        <div
                          className="absolute right-0 top-0 w-1/2 h-full"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Right Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                              transformOrigin: 'center center',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                        {/* Mirrored right half on left */}
                        <div
                          className="absolute left-0 top-0 w-1/2 h-full"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Right Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) scaleX(-1)`,
                              transformOrigin: 'center center',
                              clipPath: 'inset(0 0 0 50%)',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      // Horizontal: Bottom half mirrored to top
                      <>
                        {/* Original bottom half */}
                        <div
                          className="absolute left-0 bottom-0 w-full h-1/2"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Bottom Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                              transformOrigin: 'center center',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                        {/* Mirrored bottom half on top */}
                        <div
                          className="absolute left-0 top-0 w-full h-1/2"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={uploadedImage.imageElement?.src || URL.createObjectURL(uploadedImage.file)}
                            alt="Bottom Side Mirrored"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) scaleY(-1)`,
                              transformOrigin: 'center center',
                              clipPath: 'inset(50% 0 0 0)',
                              transition: 'transform 0.1s ease-out'
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImagePrep
