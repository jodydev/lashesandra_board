# Bucket Storage per foto profilo clienti

L’app carica le foto profilo su Supabase Storage nel bucket **client-avatars**.

## 1. Creare il bucket dalla Dashboard

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard) → il tuo progetto.
2. **Storage** → **New bucket**.
3. Imposta:
   - **Name:** `client-avatars`
   - **Public bucket:** Sì (le foto sono accessibili via URL pubblico).
   - Opzionale: **File size limit** 2 MB, **Allowed MIME types** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
4. **Create bucket**.

## 2. Applicare la migration

La migration aggiunge la colonna `foto_url` alle tabelle clienti e le policy RLS per lo storage:

```bash
# Con Supabase CLI (dal repo)
supabase db push
```

Oppure esegui manualmente il contenuto di  
`supabase/migrations/20250304100000_client_avatar_storage.sql`  
nel SQL Editor della Dashboard (prima crea il bucket come al punto 1).

## Comportamento in app

- In **ClientForm** l’utente può scegliere una foto con “Aggiungi foto”.
- Al salvataggio del cliente la foto viene caricata in  
  `client-avatars/{client_id}/avatar.{ext}`  
  e l’URL pubblico viene salvato in `foto_url` del cliente.
- Formati ammessi: JPEG, PNG, WebP, GIF. Dimensione massima: 2 MB.
