import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

/**
 * Klien Supabase untuk backend.
 *
 * Modul ini memastikan file `.env` di root project terbaca, kemudian membuat
 * instance Supabase dengan menggunakan URL dan service role key.
 *
 * Environment variable yang digunakan:
 * - `VITE_SUPABASE_URL` — URL project Supabase.
 * - `SUPABASE_SERVICE_ROLE_KEY` — service role key (hanya boleh digunakan di backend).
 */
// Pastikan membaca .env di root project (satu level di atas folder server)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Supabase URL atau SERVICE_ROLE_KEY belum diset di environment variable')
}

/**
 * Instance klien Supabase yang digunakan oleh seluruh layer services/backend.
 *
 * Menggunakan service role key sehingga hanya boleh di-import di sisi server.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey)
