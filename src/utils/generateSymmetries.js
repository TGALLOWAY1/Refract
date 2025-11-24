/**
 * Generates 4 symmetrical patterns from an image based on a midpoint.
 * Each pattern uses one quadrant as the source and mirrors it to create a full image.
 * 
 * @param {HTMLImageElement} imageElement - The source image element
 * @param {Object} midpoint - Normalized coordinates { x: 0-1, y: 0-1 }
 * @returns {Array<ImageData>} Array of 4 ImageData objects representing the symmetrical patterns
 */
export function generateSymmetries(imageElement, midpoint) {
  if (!imageElement || !midpoint) return []

  const imgWidth = imageElement.width
  const imgHeight = imageElement.height

  // Convert normalized coordinates to pixel coordinates
  const midX = midpoint.x * imgWidth
  const midY = midpoint.y * imgHeight

  // Create a temporary canvas to work with the original image
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = imgWidth
  tempCanvas.height = imgHeight
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(imageElement, 0, 0)

  // Get the source image data
  const sourceImageData = tempCtx.getImageData(0, 0, imgWidth, imgHeight)

  // Define quadrants based on midpoint
  const quadrants = [
    {
      name: 'topLeft',
      sourceX: 0,
      sourceY: 0,
      sourceWidth: midX,
      sourceHeight: midY
    },
    {
      name: 'topRight',
      sourceX: midX,
      sourceY: 0,
      sourceWidth: imgWidth - midX,
      sourceHeight: midY
    },
    {
      name: 'bottomLeft',
      sourceX: 0,
      sourceY: midY,
      sourceWidth: midX,
      sourceHeight: imgHeight - midY
    },
    {
      name: 'bottomRight',
      sourceX: midX,
      sourceY: midY,
      sourceWidth: imgWidth - midX,
      sourceHeight: imgHeight - midY
    }
  ]

  // Generate symmetrical pattern for each quadrant
  return quadrants.map(quadrant => {
    return createSymmetricalPattern(
      sourceImageData,
      imgWidth,
      imgHeight,
      quadrant
    )
  })
}

/**
 * Creates a full symmetrical pattern by mirroring a quadrant.
 * The quadrant is mirrored both horizontally and vertically to fill all 4 quadrants.
 * 
 * @param {ImageData} sourceImageData - The full source image data
 * @param {number} imgWidth - Original image width
 * @param {number} imgHeight - Original image height
 * @param {Object} quadrant - Quadrant definition with source coordinates and dimensions
 * @returns {ImageData} Complete symmetrical pattern
 */
function createSymmetricalPattern(sourceImageData, imgWidth, imgHeight, quadrant) {
  // Create a source canvas with the full image
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = imgWidth
  sourceCanvas.height = imgHeight
  const sourceCtx = sourceCanvas.getContext('2d')
  sourceCtx.putImageData(sourceImageData, 0, 0)

  // Extract the source quadrant to a separate canvas
  const quadrantCanvas = document.createElement('canvas')
  quadrantCanvas.width = quadrant.sourceWidth
  quadrantCanvas.height = quadrant.sourceHeight
  const quadrantCtx = quadrantCanvas.getContext('2d')
  
  // Draw the quadrant region from the source
  quadrantCtx.drawImage(
    sourceCanvas,
    quadrant.sourceX,
    quadrant.sourceY,
    quadrant.sourceWidth,
    quadrant.sourceHeight,
    0,
    0,
    quadrant.sourceWidth,
    quadrant.sourceHeight
  )

  // Create output canvas for the full symmetrical pattern
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = imgWidth
  outputCanvas.height = imgHeight
  const outputCtx = outputCanvas.getContext('2d')

  // Fill background
  outputCtx.fillStyle = '#1f2937'
  outputCtx.fillRect(0, 0, imgWidth, imgHeight)

  // Place quadrant in its original position
  outputCtx.drawImage(quadrantCanvas, quadrant.sourceX, quadrant.sourceY)

  // Mirror horizontally (flip on Y-axis) - creates the opposite horizontal quadrant
  outputCtx.save()
  outputCtx.scale(-1, 1)
  outputCtx.drawImage(
    quadrantCanvas,
    -quadrant.sourceX - quadrant.sourceWidth,
    quadrant.sourceY
  )
  outputCtx.restore()

  // Mirror vertically (flip on X-axis) - creates the opposite vertical quadrant
  outputCtx.save()
  outputCtx.scale(1, -1)
  outputCtx.drawImage(
    quadrantCanvas,
    quadrant.sourceX,
    -quadrant.sourceY - quadrant.sourceHeight
  )
  outputCtx.restore()

  // Mirror both (flip on both axes) - creates the diagonal opposite quadrant
  outputCtx.save()
  outputCtx.scale(-1, -1)
  outputCtx.drawImage(
    quadrantCanvas,
    -quadrant.sourceX - quadrant.sourceWidth,
    -quadrant.sourceY - quadrant.sourceHeight
  )
  outputCtx.restore()

  return outputCtx.getImageData(0, 0, imgWidth, imgHeight)
}

