/*
  # Cereals Shop Management System Schema

  ## Overview
  Complete database schema for managing a cereals shop with inventory, sales, 
  financial tracking, and reporting capabilities.

  ## New Tables

  ### 1. `products`
  Stores all cereal products and inventory items
  - `id` (uuid, primary key) - Unique product identifier
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `category` (text) - Product category (e.g., 'Rice', 'Wheat', 'Corn', 'Mixed')
  - `unit` (text) - Unit of measurement (e.g., 'kg', 'bag', 'packet')
  - `cost_price` (decimal) - Purchase/cost price per unit
  - `selling_price` (decimal) - Selling price per unit
  - `current_stock` (decimal) - Current stock quantity
  - `reorder_level` (decimal) - Minimum stock level before reorder
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `sales`
  Stores sales transactions
  - `id` (uuid, primary key) - Unique sale identifier
  - `sale_number` (text, unique) - Human-readable sale number (e.g., 'SALE-001')
  - `customer_name` (text) - Customer name (optional)
  - `total_amount` (decimal) - Total sale amount
  - `payment_method` (text) - Payment method (Cash, Card, Mobile Money)
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Sale timestamp
  - `created_by` (uuid) - User who created the sale

  ### 3. `sale_items`
  Stores individual items in each sale
  - `id` (uuid, primary key) - Unique item identifier
  - `sale_id` (uuid, foreign key) - Reference to sales table
  - `product_id` (uuid, foreign key) - Reference to products table
  - `product_name` (text) - Product name snapshot
  - `quantity` (decimal) - Quantity sold
  - `unit_price` (decimal) - Price per unit at time of sale
  - `subtotal` (decimal) - Line item total (quantity × unit_price)
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `expenses`
  Tracks business expenses
  - `id` (uuid, primary key) - Unique expense identifier
  - `description` (text) - Expense description
  - `category` (text) - Expense category (e.g., 'Rent', 'Utilities', 'Salaries', 'Stock Purchase')
  - `amount` (decimal) - Expense amount
  - `payment_method` (text) - Payment method
  - `expense_date` (date) - Date of expense
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `stock_movements`
  Tracks all stock adjustments
  - `id` (uuid, primary key) - Unique movement identifier
  - `product_id` (uuid, foreign key) - Reference to products table
  - `movement_type` (text) - Type: 'IN' (addition), 'OUT' (removal), 'ADJUSTMENT', 'SALE'
  - `quantity` (decimal) - Quantity moved (positive for IN, negative for OUT)
  - `reference_id` (uuid) - Reference to related transaction (sale_id, etc.)
  - `notes` (text) - Movement notes
  - `created_at` (timestamptz) - Movement timestamp

  ## Security
  - Enable RLS on all tables
  - Public access for read/write operations (suitable for internal shop system)
  - In production, should be restricted to authenticated users
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'General',
  unit text DEFAULT 'kg',
  cost_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  current_stock decimal(10,2) NOT NULL DEFAULT 0,
  reorder_level decimal(10,2) DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  customer_name text DEFAULT '',
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity decimal(10,2) NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text DEFAULT 'General',
  amount decimal(10,2) NOT NULL,
  payment_method text DEFAULT 'Cash',
  expense_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity decimal(10,2) NOT NULL,
  reference_id uuid,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- Create function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for internal shop system)
-- In production, these should be restricted to authenticated users

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON products FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from products"
  ON products FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to sales"
  ON sales FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to sales"
  ON sales FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to sales"
  ON sales FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from sales"
  ON sales FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to sale_items"
  ON sale_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to sale_items"
  ON sale_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to sale_items"
  ON sale_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from sale_items"
  ON sale_items FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to expenses"
  ON expenses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to expenses"
  ON expenses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to expenses"
  ON expenses FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from expenses"
  ON expenses FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to stock_movements"
  ON stock_movements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to stock_movements"
  ON stock_movements FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to stock_movements"
  ON stock_movements FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from stock_movements"
  ON stock_movements FOR DELETE
  TO public
  USING (true);