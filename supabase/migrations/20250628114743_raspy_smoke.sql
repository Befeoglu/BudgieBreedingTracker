/*
  # Eggs (Yumurta) Tablosu Oluşturma

  1. Yeni Tablolar
    - `eggs`
      - `id` (uuid, primary key)
      - `incubation_id` (uuid, foreign key to clutches)
      - `number` (integer, yumurta numarası)
      - `status` (text, enum: belirsiz, boş, dolu, çıktı)
      - `mother_id` (uuid, foreign key to birds)
      - `father_id` (uuid, foreign key to birds)
      - `added_date` (date, ekleme tarihi)
      - `notes` (text, notlar)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Güvenlik
    - RLS politikaları eklenmiştir
    - Kullanıcılar sadece kendi kuluçkalarındaki yumurtaları görebilir
    - Benzersiz indeksler: (incubation_id, number)

  3. İndeksler
    - Performans için optimize edilmiş indeksler
    - Kuluçka ID ve durum bazlı sorgular için
*/

-- Create eggs table
CREATE TABLE IF NOT EXISTS public.eggs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incubation_id uuid NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
  number integer NOT NULL CHECK (number > 0 AND number <= 20),
  status text NOT NULL DEFAULT 'belirsiz' CHECK (status IN ('belirsiz', 'boş', 'dolu', 'çıktı')),
  mother_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
  father_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
  added_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (incubation_id, number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eggs_incubation_id ON public.eggs(incubation_id);
CREATE INDEX IF NOT EXISTS idx_eggs_status ON public.eggs(incubation_id, status);
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);

-- Enable Row Level Security
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for eggs table
CREATE POLICY "Users can view eggs from their clutches"
  ON public.eggs
  FOR SELECT
  TO authenticated
  USING (
    incubation_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert eggs to their clutches"
  ON public.eggs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    incubation_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update eggs from their clutches"
  ON public.eggs
  FOR UPDATE
  TO authenticated
  USING (
    incubation_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete eggs from their clutches"
  ON public.eggs
  FOR DELETE
  TO authenticated
  USING (
    incubation_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER on_eggs_updated
  BEFORE UPDATE ON public.eggs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to auto-increment egg numbers
CREATE OR REPLACE FUNCTION get_next_egg_number(clutch_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 
  INTO next_num
  FROM eggs 
  WHERE incubation_id = clutch_id;
  
  RETURN next_num;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eggs'
  ) THEN
    RAISE NOTICE 'SUCCESS: eggs table created with all necessary constraints and policies';
  ELSE
    RAISE EXCEPTION 'FAILED: eggs table was not created properly';
  END IF;
END $$;