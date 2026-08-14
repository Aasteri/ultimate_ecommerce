export interface Shop {
  id: number;
  name: string;
  slug: string;
  bio?: string | null;
  logo?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | string;
  rejection_reason?: string | null;
  commission_rate?: number | string | null;
  payout_bank_name?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  approved_at?: string | null;
  created_at?: string;
  user?: { id: number; name: string; email: string };
  products_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  referral_code?: string;
  wallet_balance?: number;
  marketing_opt_in?: boolean;
  shop?: Shop | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number | null;
  published_products_count?: number;
  children?: Category[];
}

export interface ProductFormat {
  id: number;
  format: string;
}

export interface ProductImage {
  id: number;
  path: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description?: string;
  preview_image?: string;
  colors?: string[] | null;
  features?: string[] | null;
  images?: ProductImage[];
  digital_price?: number;
  physical_price?: number;
  is_digital_available: boolean;
  is_physical_available: boolean;
  physical_stock: number;
  width_mm?: number;
  height_mm?: number;
  has_digital_file?: boolean;
  status: string;
  view_count: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  category?: Category;
  formats?: ProductFormat[];
  shop?: Pick<Shop, 'id' | 'name' | 'slug' | 'logo' | 'bio'>;
  shop_id?: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  title: string;
  slug: string;
  preview_image?: string;
  variant_type: 'digital' | 'physical';
  quantity: number;
  unit_price: number;
  line_total: number;
  formats?: string[];
  width_mm?: number;
  height_mm?: number;
  shop_id?: number;
  shop?: { id: number; name: string; slug: string } | null;
}

export interface Cart {
  id: number;
  session_id?: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface ShippingZone {
  id: number;
  name: string;
  regions?: string[];
  rate: number;
  currency: string;
  is_active: boolean;
}

export interface VendorOrder {
  id: number;
  vendor_order_number: string;
  order_id: number;
  shop_id: number;
  subtotal: number;
  shipping_cost: number;
  commission_rate: number;
  commission_amount: number;
  vendor_amount: number;
  status: string;
  created_at: string;
  shop?: Shop;
  order?: Order;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount?: number;
  total: number;
  currency: string;
  shipping_address?: Record<string, string>;
  shipping_discussion_needed?: boolean;
  items?: OrderItem[];
  vendor_orders?: VendorOrder[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  shop_id?: number;
  variant_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  fulfillment_status?: string;
  product_title: string;
}

export interface Download {
  id: number;
  product_id: number;
  download_count: number;
  file_ready?: boolean;
  product?: Product;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export interface Payout {
  id: number;
  shop_id: number;
  amount: number;
  status: string;
  method?: string | null;
  notes?: string | null;
  paid_at?: string | null;
  created_at: string;
  shop?: Shop;
}
