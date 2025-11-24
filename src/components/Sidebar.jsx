import ImageUploader from './ImageUploader'
import PreviewGrid from './PreviewGrid'

function Sidebar({ onImageUpload, originalImage, midpoint, onMidpointChange }) {
  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Refract</h1>
        <p className="text-sm text-gray-400 mt-1">Kaleidoscope Art Generator</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <ImageUploader onImageUpload={onImageUpload} />
        <PreviewGrid originalImage={originalImage} midpoint={midpoint} />
      </div>
    </aside>
  )
}

export default Sidebar

