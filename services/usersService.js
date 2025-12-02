import { supabase } from '../supabaseClient.js'

/**
 * Menyinkronkan data user Firebase ke tabel `users` di Supabase.
 *
 * Alur:
 * - Mengecek apakah sudah ada baris dengan `firebase_uid` yang sama.
 * - Jika ada, mengembalikan `id` yang sudah ada.
 * - Jika belum, membuat baris baru dengan `firebase_uid`, `email`, dan `username`.
 *   Jika `username` tidak diberikan, akan diambil dari bagian sebelum `@` di email.
 *
 * @async
 * @function syncFirebaseUser
 * @param {Object} params - Parameter sinkronisasi user.
 * @param {string} params.firebase_uid - UID user dari Firebase (wajib).
 * @param {string} [params.email] - Alamat email user.
 * @param {string} [params.username] - Username custom (opsional).
 * @returns {Promise<number>} Promise yang berisi ID user di tabel `users`.
 * @throws {Error} Melempar error jika `firebase_uid` kosong atau operasi Supabase gagal.
 */
export async function syncFirebaseUser({ firebase_uid, email, username }) {
  if (!firebase_uid) throw new Error('firebase_uid is required')

  const effectiveUsername = username || (email ? email.split('@')[0] : null)

  // Cek apakah user sudah ada
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', firebase_uid)
    .maybeSingle()

  if (selectError) {
    console.error('Gagal cek user di Supabase (backend):', selectError)
    throw selectError
  }

  if (existing) {
    return existing.id
  }

  // Jika belum ada, insert baru
  const { data, error: insertError } = await supabase
    .from('users')
    .insert({
      firebase_uid,
      email,
      username: effectiveUsername,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Gagal insert user ke Supabase (backend):', insertError)
    throw insertError
  }

  return data.id
}

/**
 * Mengambil target kalori harian pengguna dari kolom `daily_calorie_target`.
 *
 * @async
 * @function getUserDailyCalorieTarget
 * @param {number|string} userId - ID user di tabel `users`.
 * @returns {Promise<number|null>} Promise yang berisi nilai target kalori harian atau `null` jika belum diset.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 */
export async function getUserDailyCalorieTarget(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('daily_calorie_target')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.daily_calorie_target ?? null
}

/**
 * Mengupdate target kalori harian pengguna pada kolom `daily_calorie_target`.
 *
 * Jika `target` bernilai `null` atau `undefined`, nilai di database akan diset ke `null`.
 * Selain itu, nilai akan dikonversi ke `Number` sebelum disimpan.
 *
 * @async
 * @function updateUserDailyCalorieTarget
 * @param {number|string} userId - ID user di tabel `users`.
 * @param {number|string|null} target - Nilai baru target kalori harian.
 * @returns {Promise<number|null>} Promise yang berisi nilai target yang tersimpan (sudah dikonversi) atau `null`.
 * @throws {Error} Melempar error dari Supabase jika operasi update gagal.
 */
export async function updateUserDailyCalorieTarget(userId, target) {
  const value = target == null ? null : Number(target)

  const { error } = await supabase
    .from('users')
    .update({ daily_calorie_target: value })
    .eq('id', userId)

  if (error) throw error
  return value
}
