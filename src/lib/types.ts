export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
  created_by: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reference_id: string | null;
  notes: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}
