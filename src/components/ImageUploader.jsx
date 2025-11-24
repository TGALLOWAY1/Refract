import { useCallback, useState } from 'react'

function ImageUploader({ onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false)

  // Process a file (used by both file input and drag-and-drop)
  const processFile = useCallback((file) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG or PNG image')
      return
    }

    // Create an Image object to load the file
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Pass the original image file and loaded image to parent
        onImageUpload({
          file: file,
          imageElement: img,
          width: img.width,
          height: img.height
        })
      }
      img.onerror = () => {
        alert('Failed to load image. Please try another file.')
      }
      img.src = e.target.result
    }
    reader.onerror = () => {
      alert('Failed to read file. Please try another file.')
    }
    reader.readAsDataURL(file)
  }, [onImageUpload])

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0]
    processFile(file)
  }, [processFile])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }, [processFile])

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Image Upload</h2>
      
      <label className="block">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-blue-500 hover:bg-gray-750 bg-gray-750/30'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <svg
              className={`mx-auto h-12 w-12 transition-colors ${
                isDragging ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0v-4a4 4 0 00-4-4h-4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-300 font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              JPEG or PNG
            </p>
          </div>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  )
}

export default ImageUploader

