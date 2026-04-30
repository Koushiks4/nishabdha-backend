import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button } from './ui/button'
import { X, Upload, Plus, Trash2 } from 'lucide-react'

interface ProductFormModalProps {
  product?: any
  onClose: () => void
}

interface Variant {
  id?: string
  name: string
  sku: string
  price: string
  stockQuantity: string
  lowStockThreshold: string
  size: string
  material: string
  frame: string
  color: string
}

export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    type: product?.type || 'ARTWORK',
    status: product?.status || 'DRAFT',
    basePrice: product?.basePrice || '',
    compareAtPrice: product?.compareAtPrice || '',
    category: product?.category || '',
    tags: product?.tags?.join(', ') || '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product?.images?.map((img: any) => img.url) || []
  )
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.map((v: any) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price?.toString() || '',
      stockQuantity: v.stockQuantity?.toString() || '0',
      lowStockThreshold: v.lowStockThreshold?.toString() || '5',
      size: v.size || '',
      material: v.material || '',
      frame: v.frame || '',
      color: v.color || '',
    })) || []
  )
  const [uploading, setUploading] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (product) {
        return api.updateProduct(product.id, data)
      } else {
        return api.createProduct(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    }
  })

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )
    handleFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files: File[]) => {
    setImages(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    setVariants(prev => [...prev, {
      name: '',
      sku: `${formData.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
      price: formData.basePrice,
      stockQuantity: '0',
      lowStockThreshold: '5',
      size: '',
      material: '',
      frame: '',
      color: '',
    }])
  }

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      // Upload images to Supabase Storage
      const uploadedImageUrls = []
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileName = `${Date.now()}-${i}-${file.name}`
        const url = await api.uploadImage(file, fileName)
        uploadedImageUrls.push({ url, altText: formData.name, sortOrder: i })
      }

      // Combine existing images with newly uploaded ones
      const allImages = [
        ...(product?.images || []),
        ...uploadedImageUrls
      ]

      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: allImages,
        variants: variants.map(v => ({
          ...(v.id && { id: v.id }),
          name: v.name,
          sku: v.sku,
          price: v.price ? parseFloat(v.price) : null,
          stockQuantity: parseInt(v.stockQuantity) || 0,
          lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
          size: v.size || null,
          material: v.material || null,
          frame: v.frame || null,
          color: v.color || null,
        }))
      }

      await saveMutation.mutateAsync(productData)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {product ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="ARTWORK">Artwork</option>
                  <option value="MERCHANDISE">Merchandise</option>
                  <option value="CREATOR_KIT">Creator Kit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Compare At Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="art, canvas, modern"
              />
            </div>

            {/* Product Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Product Variants</label>
                <Button type="button" size="sm" onClick={addVariant}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No variants added. Click "Add Variant" to create product variations.</p>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Variant {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Variant Name</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            placeholder="e.g., Small Canvas"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">SKU</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            placeholder="PROD-001"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            placeholder="Leave empty to use base price"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Stock Quantity</label>
                          <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(index, 'stockQuantity', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Size</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.size}
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                            placeholder="e.g., 24x36"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Material</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.material}
                            onChange={(e) => updateVariant(index, 'material', e.target.value)}
                            placeholder="e.g., Canvas"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Frame</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.frame}
                            onChange={(e) => updateVariant(index, 'frame', e.target.value)}
                            placeholder="e.g., Oak Wood"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">Color</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                            value={variant.color}
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            placeholder="e.g., Black"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop images here, or{' '}
                  <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                    browse
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || saveMutation.isPending}>
                {uploading ? 'Uploading...' : saveMutation.isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
