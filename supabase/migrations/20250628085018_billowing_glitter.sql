-- Mevcut birds tablosu sütunlarını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'birds'
ORDER BY ordinal_position;

-- Mevcut RLS politikalarını kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('birds', 'users', 'todos');

-- Mevcut tabloları listele
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- auth.uid() fonksiyonunun çalışıp çalışmadığını test et
SELECT auth.uid() as current_user_id;

-- search_path'i kontrol et
SHOW search_path;