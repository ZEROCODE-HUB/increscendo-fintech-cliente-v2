-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Common fields
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank')),
  holder_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Card fields
  card_type VARCHAR(50),
  last_four VARCHAR(4),
  expiry VARCHAR(5),
  token VARCHAR(255),
  
  -- Bank fields
  bank_name VARCHAR(255),
  last_digits VARCHAR(4),
  clabe VARCHAR(18),
  validation_status VARCHAR(20) CHECK (validation_status IN ('validada', 'pendiente')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id queries
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(user_id, is_default);
CREATE UNIQUE INDEX idx_unique_default_per_user ON payment_methods(user_id) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own payment methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can access all payment methods
CREATE POLICY "Admins can manage all payment methods"
  ON payment_methods
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insert/update
CREATE TRIGGER trg_ensure_single_default_payment
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trg_update_payment_methods_timestamp
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();
