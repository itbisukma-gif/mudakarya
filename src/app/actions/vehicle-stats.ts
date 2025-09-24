
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Menambah (increment) jumlah view_count untuk sebuah kendaraan.
 * Fungsi ini menggunakan RPC (Remote Procedure Call) di Supabase untuk operasi atomik,
 * memastikan tidak ada race condition jika beberapa user melihat secara bersamaan.
 * @param vehicleId ID dari kendaraan yang akan di-increment view count-nya.
 */
export async function incrementViewCount(vehicleId: string) {
  if (!vehicleId) return;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.rpc('increment_view_count', {
      vehicle_id: vehicleId,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      // We don't return an error to the client as this is a background task
    } else {
        revalidatePath(`/mobil/${vehicleId}`);
    }
  } catch (e) {
    console.error('Exception in incrementViewCount:', e);
  }
}

/**
 * Menambah (increment) jumlah booked_count untuk sebuah kendaraan.
 * Fungsi ini menggunakan RPC (Remote Procedure Call) di Supabase untuk operasi atomik.
 * @param vehicleId ID dari kendaraan yang akan di-increment booked count-nya.
 */
export async function incrementBookedCount(vehicleId: string) {
  if (!vehicleId) return;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.rpc('increment_booked_count', {
      vehicle_id: vehicleId,
    });

    if (error) {
      console.error('Error incrementing booked count:', error);
    } else {
        revalidatePath(`/mobil/${vehicleId}`);
    }
  } catch (e) {
    console.error('Exception in incrementBookedCount:', e);
  }
}
