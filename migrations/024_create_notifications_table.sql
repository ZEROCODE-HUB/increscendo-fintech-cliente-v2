-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  url VARCHAR(255),
  channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_notifications_users 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT valid_channels 
    CHECK (channels <@ ARRAY['email', 'sms']::TEXT[])
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policy: Admins can insert notifications for users
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
