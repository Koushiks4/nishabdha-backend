import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button } from './ui/button'
import { X } from 'lucide-react'

interface OrderDetailModalProps {
  order: any
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState(order.status)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')

  const updateStatusMutation = useMutation({
    mutationFn: () => api.updateOrderStatus(order.id, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      onClose()
    }
  })

  const handleSave = () => {
    if (status !== order.status || trackingNumber !== order.trackingNumber) {
      updateStatusMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Order {order.orderNumber}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Email:</strong> {order.customer?.email}</p>
                <p><strong>Phone:</strong> {order.customer?.phone}</p>
                {order.customer?.name && <p><strong>Name:</strong> {order.customer.name}</p>}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p>{order.address?.fullName}</p>
                <p>{order.address?.addressLine1}</p>
                {order.address?.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>{order.address?.city}, {order.address?.state} {order.address?.pincode}</p>
                <p>{order.address?.phone}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-medium mb-4">Order Items</h3>
              <div className="border rounded divide-y">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="p-4 flex justify-between">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{Number(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{Number(order.shippingCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{Number(order.tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>₹{Number(order.total).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-lg font-medium mb-4">Payment Information</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Method:</strong> {order.paymentMethod || 'N/A'}</p>
                <p><strong>Status:</strong> {order.status}</p>
                {order.paidAt && (
                  <p><strong>Paid At:</strong> {new Date(order.paidAt).toLocaleString()}</p>
                )}
                {order.cashfreePaymentId && (
                  <p className="mt-2">
                    <a
                      href={`https://merchant.cashfree.com/orders/${order.cashfreeOrderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View in Cashfree Dashboard →
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div>
              <h3 className="text-lg font-medium mb-4">Update Order Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAYMENT_INITIATED">Payment Initiated</option>
                    <option value="PAID">Paid</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                {(status === 'SHIPPED' || status === 'DELIVERED') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
