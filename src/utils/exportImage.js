import { generateSymmetries } from './generateSymmetries'

/**
 * Exports a symmetrical pattern at the original image resolution
 * 
 * @param {HTMLImageElement} imageElement - The original source image element
 * @param {Object} midpoint - Normalized coordinates { x: 0-1, y: 0-1 }
 * @param {number} rotation - Rotation in degrees
 * @param {number} zoom - Zoom factor
 * @param {number} quadrantIndex - Index of the quadrant to export (0-3)
 * @returns {Promise<Blob>} Promise that resolves to a Blob of the exported image
 */
export async function exportHighResImage(imageElement, midpoint, rotation, zoom, quadrantIndex) {
  if (!imageElement || quadrantIndex === null || quadrantIndex < 0 || quadrantIndex > 3) {
    throw new Error('Invalid parameters for export')
  }

  const imgWidth = imageElement.width
  const imgHeight = imageElement.height

  // Generate the pattern at high resolution
  const patterns = generateSymmetries(imageElement, midpoint, rotation, zoom, 'high-res')

  if (!patterns || !patterns[quadrantIndex]) {
    throw new Error('Failed to generate pattern')
  }

  const pattern = patterns[quadrantIndex]

  // Create a canvas at original resolution
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = imgWidth
  exportCanvas.height = imgHeight
  const ctx = exportCanvas.getContext('2d')

  // Create a temporary canvas with the pattern
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = pattern.width
  tempCanvas.height = pattern.height
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.putImageData(pattern, 0, 0)

  // Draw the pattern scaled to original resolution
  ctx.drawImage(tempCanvas, 0, 0, imgWidth, imgHeight)

  // Convert to blob
  return new Promise((resolve, reject) => {
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
}

/**
 * Downloads a blob as a file
 * 
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

