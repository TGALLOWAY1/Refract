/**
 * Generates 4 symmetrical patterns from an image based on a midpoint.
 * Each pattern uses one quadrant as the source and mirrors it to create a full image.
 * 
 * @param {HTMLImageElement} imageElement - The source image element
 * @param {Object} midpoint - Normalized coordinates { x: 0-1, y: 0-1 }
 * @param {number} rotation - Rotation in degrees (-180 to 180)
 * @param {number} zoom - Zoom factor (1.0 = no zoom, >1.0 = zoom in/crop)
 * @param {string} quality - 'preview' (max 1024px) or 'high-res' (full resolution)
 * @returns {Array<ImageData>} Array of 4 ImageData objects representing the symmetrical patterns
 */
export function generateSymmetries(imageElement, midpoint, rotation = 0, zoom = 1.0, quality = 'preview') {
  if (!imageElement || !midpoint) return []

  const originalWidth = imageElement.width
  const originalHeight = imageElement.height

  // For preview quality, scale down to max 1024px while maintaining aspect ratio
  let imgWidth, imgHeight, scaleFactor = 1.0
  
  if (quality === 'preview') {
    const maxDimension = 1024
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      if (originalWidth > originalHeight) {
        scaleFactor = maxDimension / originalWidth
      } else {
        scaleFactor = maxDimension / originalHeight
      }
      imgWidth = Math.round(originalWidth * scaleFactor)
      imgHeight = Math.round(originalHeight * scaleFactor)
    } else {
      imgWidth = originalWidth
      imgHeight = originalHeight
    }
  } else {
    // High-res: use full resolution
    imgWidth = originalWidth
    imgHeight = originalHeight
  }

  // Create a preprocessed canvas with rotation and zoom applied
  const preprocessedCanvas = document.createElement('canvas')
  preprocessedCanvas.width = imgWidth
  preprocessedCanvas.height = imgHeight
  const preprocessedCtx = preprocessedCanvas.getContext('2d')

  // Fill background
  preprocessedCtx.fillStyle = '#1f2937'
  preprocessedCtx.fillRect(0, 0, imgWidth, imgHeight)

  // Apply transformations
  preprocessedCtx.save()
  
  // Move to center for rotation and zoom
  const centerX = imgWidth / 2
  const centerY = imgHeight / 2
  preprocessedCtx.translate(centerX, centerY)

  // Apply rotation
  preprocessedCtx.rotate((rotation * Math.PI) / 180)

  // Apply zoom (scale around center)
  preprocessedCtx.scale(zoom, zoom)

  // Draw image centered (scaled if preview quality)
  if (quality === 'preview' && scaleFactor < 1.0) {
    // Draw scaled down image
    preprocessedCtx.drawImage(
      imageElement,
      -imgWidth / 2,
      -imgHeight / 2,
      imgWidth,
      imgHeight
    )
  } else {
    // Draw full resolution image
    preprocessedCtx.drawImage(
      imageElement,
      -imgWidth / 2,
      -imgHeight / 2,
      imgWidth,
      imgHeight
    )
  }

  preprocessedCtx.restore()

  // Convert normalized coordinates to pixel coordinates
  const midX = midpoint.x * imgWidth
  const midY = midpoint.y * imgHeight

  // Define the 4 source rectangles based on the midpoint
  const sourceRectangles = [
    {
      name: 'topLeft',
      // TL Source: (0, 0) to (midX, midY)
      x: 0,
      y: 0,
      width: midX,
      height: midY
    },
    {
      name: 'topRight',
      // TR Source: (midX, 0) to (width, midY)
      x: midX,
      y: 0,
      width: imgWidth - midX,
      height: midY
    },
    {
      name: 'bottomLeft',
      // BL Source: (0, midY) to (midX, height)
      x: 0,
      y: midY,
      width: midX,
      height: imgHeight - midY
    },
    {
      name: 'bottomRight',
      // BR Source: (midX, midY) to (width, height)
      x: midX,
      y: midY,
      width: imgWidth - midX,
      height: imgHeight - midY
    }
  ]

  // Process each source rectangle to create a full kaleidoscopic pattern
  return sourceRectangles.map((sourceRect, index) => {
    return createPatternFromSource(
      preprocessedCanvas,
      sourceRect,
      imgWidth,
      imgHeight,
      index
    )
  })
}

/**
 * Creates a full symmetrical pattern from a source rectangle.
 * 
 * @param {HTMLCanvasElement} sourceCanvas - The preprocessed source canvas
 * @param {Object} sourceRect - Source rectangle { x, y, width, height, name }
 * @param {number} imgWidth - Full image width
 * @param {number} imgHeight - Full image height
 * @param {number} sourceIndex - Index of the source (0=TL, 1=TR, 2=BL, 3=BR)
 * @returns {ImageData} Complete symmetrical pattern
 */
function createPatternFromSource(sourceCanvas, sourceRect, imgWidth, imgHeight, sourceIndex) {
  // Step 1: Extract the source quadrant to a temporary canvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = sourceRect.width
  tempCanvas.height = sourceRect.height
  const tempCtx = tempCanvas.getContext('2d')
  
  // Draw the quadrant region from the source
  tempCtx.drawImage(
    sourceCanvas,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    sourceRect.width,
    sourceRect.height
  )

  // Step 2: Flip the source to act like a Top-Left tile before applying mirroring
  // TR: flip horizontally, BL: flip vertically, BR: flip both, TL: use as-is
  let sourceTileCanvas = tempCanvas // Default: use as-is for TL
  
  if (sourceIndex === 1) { // Top-Right source - flip horizontally
    const flippedCanvas = document.createElement('canvas')
    flippedCanvas.width = sourceRect.width
    flippedCanvas.height = sourceRect.height
    const flippedCtx = flippedCanvas.getContext('2d')
    
    flippedCtx.save()
    flippedCtx.translate(sourceRect.width, 0)
    flippedCtx.scale(-1, 1)
    flippedCtx.drawImage(tempCanvas, 0, 0)
    flippedCtx.restore()
    
    sourceTileCanvas = flippedCanvas
  } else if (sourceIndex === 2) { // Bottom-Left source - flip vertically
    const flippedCanvas = document.createElement('canvas')
    flippedCanvas.width = sourceRect.width
    flippedCanvas.height = sourceRect.height
    const flippedCtx = flippedCanvas.getContext('2d')
    
    flippedCtx.save()
    flippedCtx.translate(0, sourceRect.height)
    flippedCtx.scale(1, -1)
    flippedCtx.drawImage(tempCanvas, 0, 0)
    flippedCtx.restore()
    
    sourceTileCanvas = flippedCanvas
  } else if (sourceIndex === 3) { // Bottom-Right source - flip both horizontally and vertically
    const flippedCanvas = document.createElement('canvas')
    flippedCanvas.width = sourceRect.width
    flippedCanvas.height = sourceRect.height
    const flippedCtx = flippedCanvas.getContext('2d')
    
    flippedCtx.save()
    flippedCtx.translate(sourceRect.width, sourceRect.height)
    flippedCtx.scale(-1, -1)
    flippedCtx.drawImage(tempCanvas, 0, 0)
    flippedCtx.restore()
    
    sourceTileCanvas = flippedCanvas
  }
  // sourceIndex === 0 (Top-Left) uses tempCanvas as-is, no flipping needed

  // Step 3: Create Pattern Canvas (full size of original image)
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = imgWidth
  patternCanvas.height = imgHeight
  const patternCtx = patternCanvas.getContext('2d')

  // Fill background
  patternCtx.fillStyle = '#1f2937'
  patternCtx.fillRect(0, 0, imgWidth, imgHeight)

  // Step 4: Fill the Pattern Canvas using the mirroring logic
  // Top-Left Quadrant: Draw source at (0,0)
  patternCtx.drawImage(sourceTileCanvas, 0, 0)

  // Top-Right Quadrant: save(), translate(width, 0), scale(-1, 1), draw source at (0,0), restore()
  patternCtx.save()
  patternCtx.translate(imgWidth, 0)
  patternCtx.scale(-1, 1)
  patternCtx.drawImage(sourceTileCanvas, 0, 0)
  patternCtx.restore()

  // Bottom-Left Quadrant: save(), translate(0, height), scale(1, -1), draw source at (0,0), restore()
  patternCtx.save()
  patternCtx.translate(0, imgHeight)
  patternCtx.scale(1, -1)
  patternCtx.drawImage(sourceTileCanvas, 0, 0)
  patternCtx.restore()

  // Bottom-Right Quadrant: save(), translate(width, height), scale(-1, -1), draw source at (0,0), restore()
  patternCtx.save()
  patternCtx.translate(imgWidth, imgHeight)
  patternCtx.scale(-1, -1)
  patternCtx.drawImage(sourceTileCanvas, 0, 0)
  patternCtx.restore()

  return patternCtx.getImageData(0, 0, imgWidth, imgHeight)
}

