import { supabase } from '../supabaseClient.js'

// Ambil catatan makanan untuk user dan tanggal tertentu (YYYY-MM-DD)
/**
 * Mengambil daftar catatan makanan dari tabel `food_logs` untuk pengguna dan tanggal tertentu.
 *
 * @async
 * @function getFoodLogsByDate
 * @param {string} userId - ID pengguna pemilik catatan.
 * @param {string} date - Tanggal dalam format `YYYY-MM-DD`.
 * @returns {Promise<object[]>} Promise yang berisi array catatan makanan, atau array kosong jika tidak ada.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 */
export async function getFoodLogsByDate(userId, date) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Tambah catatan makanan baru
/**
 * Menambahkan catatan makanan baru ke tabel `food_logs`.
 *
 * @async
 * @function addFoodLog
 * @param {Object} params - Parameter catatan makanan yang akan disimpan.
 * @param {string} params.userId - ID pengguna.
 * @param {string} params.date - Tanggal konsumsi dalam format `YYYY-MM-DD`.
 * @param {string} params.foodName - Nama makanan custom yang dikonsumsi.
 * @param {number|string} params.calories - Jumlah kalori makanan tersebut.
 * @param {?number} [params.foodId=null] - ID referensi ke tabel `makanan` jika tersedia.
 * @returns {Promise<object>} Promise yang berisi satu baris catatan makanan yang baru dibuat.
 * @throws {Error} Melempar error dari Supabase jika proses insert gagal.
 */
export async function addFoodLog({ userId, date, foodName, calories, foodId = null }) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      date,
      food_name_custom: foodName,
      calories,
      food_id: foodId,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Hapus catatan makanan berdasarkan id
/**
 * Menghapus satu catatan makanan dari tabel `food_logs` berdasarkan ID.
 *
 * @async
 * @function deleteFoodLog
 * @param {number} id - ID catatan makanan yang akan dihapus.
 * @returns {Promise<void>} Promise yang selesai ketika penghapusan berhasil.
 * @throws {Error} Melempar error dari Supabase jika proses delete gagal.
 */
export async function deleteFoodLog(id) {
  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Total kalori dalam rentang tanggal (YYYY-MM-DD)
/**
 * Menghitung total kalori yang dikonsumsi pengguna dalam rentang tanggal tertentu.
 *
 * @async
 * @function getTotalCaloriesInRange
 * @param {string} userId - ID pengguna.
 * @param {string} startDate - Tanggal awal rentang dalam format `YYYY-MM-DD`.
 * @param {string} endDate - Tanggal akhir rentang dalam format `YYYY-MM-DD`.
 * @returns {Promise<number>} Promise yang berisi total kalori (number), 0 jika tidak ada data.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 */
export async function getTotalCaloriesInRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('calories')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error

  return (data || []).reduce((sum, row) => sum + Number(row.calories || 0), 0)
}

// Ringkasan nutrisi harian (protein, karbo, lemak) berdasarkan relasi ke tabel makanan
// Catatan: butuh foreign key food_logs.food_id -> makanan.id di Supabase agar join ini bekerja.
/**
 * Mengambil ringkasan nutrisi harian (protein, karbohidrat, lemak) berdasarkan relasi ke tabel `makanan`.
 *
 * Fungsi ini mengandalkan foreign key `food_logs.food_id -> makanan.id` di Supabase
 * untuk melakukan join dan menjumlahkan nilai nutrisi dari makanan yang dikonsumsi.
 *
 * @async
 * @function getDailyNutritionSummary
 * @param {string} userId - ID pengguna.
 * @param {string} date - Tanggal dalam format `YYYY-MM-DD`.
 * @returns {Promise<{protein: number, carbs: number, fat: number}>} Promise yang berisi objek ringkasan nutrisi.
 */
export async function getDailyNutritionSummary(userId, date) {
  try {
    const { data, error } = await supabase
      .from('food_logs')
      // Sesuaikan field nutrisi dengan kolom di tabel `makanan`.
      // Kolom: proteins, fat, carbohydrate
      .select('calories, makanan!inner(proteins, fat, carbohydrate)')
      .eq('user_id', userId)
      .eq('date', date)

    if (error) {
      console.error('Supabase error getDailyNutritionSummary:', error)
      return { protein: 0, carbs: 0, fat: 0 }
    }

    let protein = 0
    let carbs = 0
    let fat = 0

    for (const row of data || []) {
      const food = row.makanan
      if (!food) continue
      // gunakan `proteins` dan `carbohydrate` sesuai nama kolom di tabel makanan
      protein += Number(food.proteins || 0)
      carbs += Number(food.carbohydrate || 0)
      fat += Number(food.fat || 0)
    }

    return { protein, carbs, fat }
  } catch (err) {
    console.error('Unexpected error getDailyNutritionSummary:', err)
    return { protein: 0, carbs: 0, fat: 0 }
  }
}
