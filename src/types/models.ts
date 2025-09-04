export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  zip: string;
}

export interface Discount {
  code: string;
  type: 'membership' | 'volume' | 'amount' | 'other';
  percentage?: number;
  amount?: number;
  description?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  subtotal?: number;
  discounts?: Discount[];
  taxes?: number;
  shipping?: number;
  total?: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  membership: 'bronze' | 'silver' | 'gold' | 'platinum';
  address: Address;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'general' | 'food' | 'electronics' | 'clothing' | 'service';
  price: number;
  stock: number;
  taxRate?: number; // override default
}


