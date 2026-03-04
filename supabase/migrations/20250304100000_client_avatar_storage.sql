-- Foto profilo clienti: colonna foto_url + policy Storage per bucket client-avatars
--
-- CREAZIONE BUCKET (una tantum dalla Dashboard Supabase):
--   Storage → New bucket → Nome: client-avatars → Public: Sì
--   Opzionale: File size limit 2MB, Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--

-- Colonna foto_url (URL pubblico della foto su Storage)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE isabelle_clients
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

COMMENT ON COLUMN clients.foto_url IS 'URL pubblico della foto profilo (bucket client-avatars).';
COMMENT ON COLUMN isabelle_clients.foto_url IS 'URL pubblico della foto profilo (bucket client-avatars).';

-- RLS su storage.objects: accesso completamente aperto al bucket client-avatars
-- ATTENZIONE: chiunque abbia la chiave anon può caricare/cancellare file in questo bucket.
DROP POLICY IF EXISTS "Allow anon upload client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public full access client avatars" ON storage.objects;

CREATE POLICY "Allow public full access client avatars"
  ON storage.objects
  FOR ALL
  TO public
  USING (bucket_id = 'client-avatars')
  WITH CHECK (bucket_id = 'client-avatars');
