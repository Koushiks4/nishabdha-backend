import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'

interface StudioSpace {
  id: string
  name: string
  slug: string
  description: string | null
  features: string[] | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function Studios() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<StudioSpace | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    features: [] as string[],
    imageUrl: '',
    isActive: true,
  })
  const [featureInput, setFeatureInput] = useState('')

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['studio-spaces'],
    queryFn: async () => {
      const response = await api.getStudioSpaces()
      return response.data.spaces as StudioSpace[]
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createStudioSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-spaces'] })
      handleCloseDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateStudioSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-spaces'] })
      handleCloseDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteStudioSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-spaces'] })
    },
  })

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSpace(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      features: [],
      imageUrl: '',
      isActive: true,
    })
    setFeatureInput('')
  }

  const handleOpenDialog = (space?: StudioSpace) => {
    if (space) {
      setEditingSpace(space)
      setFormData({
        name: space.name,
        slug: space.slug,
        description: space.description || '',
        features: space.features || [],
        imageUrl: space.imageUrl || '',
        isActive: space.isActive,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Auto-generate slug from name if not provided
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')

    const submitData = {
      ...formData,
      slug,
      description: formData.description || null,
      features: formData.features.length > 0 ? formData.features : null,
      imageUrl: formData.imageUrl || null,
    }

    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      })
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading studio spaces...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Spaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage available studio spaces for bookings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Studio Space
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSpace ? 'Edit Studio Space' : 'Create Studio Space'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Podcast Studio"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="podcast-studio (auto-generated if empty)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Acoustically treated space with professional-grade equipment..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Features</label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add a feature"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFeature}>
                    Add
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active (visible to customers)
                </label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingSpace
                    ? 'Update'
                    : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Studio Spaces Table */}
      <div className="bg-white shadow-sm rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Space
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Features
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No studio spaces found. Create your first space to get started.
                </td>
              </tr>
            ) : (
              data?.map((space) => (
                <tr key={space.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {space.imageUrl && (
                        <img
                          src={space.imageUrl}
                          alt={space.name}
                          className="w-12 h-12 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {space.name}
                        </div>
                        <div className="text-xs text-gray-500">{space.slug}</div>
                        {space.description && (
                          <div className="text-xs text-gray-400 mt-1 max-w-md truncate">
                            {space.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {space.features && space.features.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {space.features.slice(0, 3).map((feature, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {feature}
                          </span>
                        ))}
                        {space.features.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{space.features.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No features</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {space.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <X className="w-3 h-3 mr-1" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(space)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete "${space.name}"? This action cannot be undone.`
                          )
                        ) {
                          deleteMutation.mutate(space.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
