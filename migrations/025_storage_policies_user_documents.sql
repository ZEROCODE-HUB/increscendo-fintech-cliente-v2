-- Storage Policies for user-documents bucket

-- Allow users to upload files to their own folder (avatars)
CREATE POLICY "Users can upload avatars to their own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to upload INE documents to their own folder
CREATE POLICY "Users can upload INE documents to their own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'ine'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to update their own INE documents
CREATE POLICY "Users can update their own INE documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'ine'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'ine'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to delete their own INE documents
CREATE POLICY "Users can delete their own INE documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = 'ine'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow admins to upload documents for clients
CREATE POLICY "Admins can upload documents for users" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any documents
CREATE POLICY "Admins can update any documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete any documents
CREATE POLICY "Admins can delete any documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-documents');
