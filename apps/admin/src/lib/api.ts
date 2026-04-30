import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

export const api = {
  // Products
  async getProducts() {
    const response = await fetch(`${API_URL}/products`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return response.json()
  },

  async createProduct(data: any) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create product')
    return response.json()
  },

  async updateProduct(id: string, data: any) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update product')
    return response.json()
  },

  async deleteProduct(id: string) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers
    })
    if (!response.ok) throw new Error('Failed to delete product')
    return response.json()
  },

  // Orders (Admin endpoints)
  async getOrders(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString()
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/orders/admin?${query}`, { headers })
    if (!response.ok) throw new Error('Failed to fetch orders')
    return response.json()
  },

  async getOrder(orderNumber: string) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/orders/admin/${orderNumber}`, { headers })
    if (!response.ok) throw new Error('Failed to fetch order')
    return response.json()
  },

  async updateOrderStatus(id: string, status: string, trackingNumber?: string) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/orders/admin/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, trackingNumber })
    })
    if (!response.ok) throw new Error('Failed to update order status')
    return response.json()
  },

  // Customers
  async getCustomers() {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/customers`, { headers })
    if (!response.ok) throw new Error('Failed to fetch customers')
    return response.json()
  },

  // Studio Bookings
  async getBookings(params?: { status?: string }) {
    const query = new URLSearchParams(params as any).toString()
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-bookings?${query}`, { headers })
    if (!response.ok) throw new Error('Failed to fetch bookings')
    return response.json()
  },

  async updateBookingStatus(id: string, status: string, adminNotes?: string) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-bookings/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, adminNotes })
    })
    if (!response.ok) throw new Error('Failed to update booking')
    return response.json()
  },

  // Studio Spaces
  async getStudioSpaces() {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-spaces`, { headers })
    if (!response.ok) throw new Error('Failed to fetch studio spaces')
    return response.json()
  },

  async createStudioSpace(data: any) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-spaces`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create studio space')
    return response.json()
  },

  async updateStudioSpace(id: string, data: any) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-spaces/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update studio space')
    return response.json()
  },

  async deleteStudioSpace(id: string) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_URL}/studio-spaces/${id}`, {
      method: 'DELETE',
      headers
    })
    if (!response.ok) throw new Error('Failed to delete studio space')
    return response.json()
  },

  // Image upload to Supabase Storage
  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, file, {
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return publicUrl
  },

  async deleteImage(path: string) {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path])

    if (error) throw error
  }
}
