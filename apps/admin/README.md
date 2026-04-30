# Nishabdha Admin Dashboard

Admin dashboard for managing the Nishabdha e-commerce platform.

## Features

- **Products Management**: Create, edit, delete products with drag-and-drop image upload to Supabase Storage
- **Orders Management**: View orders, update status (Processing → Shipped → Delivered), add tracking numbers
- **Customers**: View all registered customers and their order history
- **Payments**: View successful payments with links to Cashfree dashboard
- **Studio Bookings**: Manage studio space bookings, confirm/cancel, add admin notes

## Tech Stack

- **Vite + React + TypeScript**: Fast development and type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Supabase Auth**: Admin authentication
- **Supabase Storage**: Product image uploads

## Setup

### 1. Install Dependencies

```bash
cd apps/admin
pnpm install
```

### 2. Environment Variables

Create `.env` file in `apps/admin/`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000/api
```

Get these values from your Supabase project settings.

### 3. Supabase Setup

#### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket named `product-images`
3. Set bucket to **Public**

#### Create Admin User

In Supabase SQL Editor, run:

```sql
-- Create admin user in Supabase Auth
-- (Use Supabase Dashboard → Authentication → Users → Add User)
-- Then insert into your Admin table:

INSERT INTO "Admin" (id, "supabaseUid", email, name, role, "isActive")
VALUES (
  gen_random_uuid()::text,
  'your_supabase_user_uid',
  'admin@nishabdha.com',
  'Admin Name',
  'SUPER_ADMIN',
  true
);
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:5173

### 5. Login

Use the Supabase admin credentials you created.

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn UI components
│   ├── ProductFormModal.tsx
│   └── OrderDetailModal.tsx
├── contexts/
│   └── AuthContext.tsx  # Supabase auth management
├── layouts/
│   └── DashboardLayout.tsx  # Sidebar + topbar layout
├── lib/
│   ├── api.ts           # API client functions
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Utility functions
├── pages/
│   ├── Login.tsx
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── Customers.tsx
│   ├── Payments.tsx
│   └── StudioBookings.tsx
├── App.tsx              # Routing setup
└── main.tsx             # Entry point
```

## Usage

### Managing Products

1. Click "Add Product" to create new product
2. Fill in details: name, description, type, price
3. Drag and drop images or click to browse
4. Images are uploaded to Supabase Storage on save
5. Edit or delete products from the table

### Managing Orders

1. View all orders with status filters
2. Click on an order to see details
3. Update order status: Pending → Processing → Shipped → Delivered
4. Add tracking numbers for shipped orders
5. View payment details and link to Cashfree

### Managing Studio Bookings

1. View all bookings with status filters
2. Click "Manage" to update booking status
3. Add admin notes for internal reference
4. Confirm or cancel bookings

## Role-Based Access Control (RBAC)

Four admin roles supported:

- **SUPER_ADMIN**: Full access to everything
- **CONTENT_MANAGER**: Manage products, collections
- **ORDER_MANAGER**: Manage orders, customers
- **STUDIO_MANAGER**: Manage studio bookings

RBAC enforcement happens on the backend API.

## Build for Production

```bash
pnpm build
```

Output will be in `dist/` directory.

## Deployment

Deploy the `dist/` folder to any static hosting:

- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

Make sure to set environment variables in your hosting platform.

## API Integration

The admin dashboard connects to your backend API at `VITE_API_URL`.

Required API endpoints:
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin auth)
- `PATCH /api/products/:id` - Update product (admin auth)
- `DELETE /api/products/:id` - Delete product (admin auth)
- `GET /api/orders` - List orders (admin auth)
- `PATCH /api/orders/:id/status` - Update order status (admin auth)
- `GET /api/customers` - List customers (admin auth)
- `GET /api/studio-bookings` - List bookings (admin auth)
- `PATCH /api/studio-bookings/:id` - Update booking (admin auth)

All admin endpoints require `Authorization: Bearer <supabase_token>` header.
