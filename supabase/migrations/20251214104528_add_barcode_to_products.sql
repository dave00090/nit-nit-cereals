/*
  # Add Barcode Field to Products

  ## Changes
  - Add `barcode` field to products table for barcode scanning support
  - Barcode is optional and unique per product
  - Used for quick product lookup via barcode scanner
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode text UNIQUE DEFAULT NULL;
  END IF;
END $$;
