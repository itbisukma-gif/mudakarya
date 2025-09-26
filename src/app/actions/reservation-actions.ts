
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';

/**
 * Checks if a vehicle is available for a given date range.
 * This function calls a PostgreSQL function in Supabase.
 * @param vehicleId The ID of the vehicle to check.
 * @param startDate The start date of the desired rental period (ISO string).
 * @param endDate The end date of the desired rental period (ISO string).
 * @returns A boolean indicating availability.
 */
export async function checkVehicleAvailability(vehicleId: string, startDate: string, endDate: string) {
    if (!vehicleId || !startDate || !endDate) {
        return { data: false, error: { message: 'Vehicle ID, start date, and end date are required.' } };
    }
    
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('is_vehicle_available', {
        p_vehicle_id: vehicleId,
        p_start_date: startDate,
        p_end_date: endDate,
    });

    if (error) {
        console.error('Error checking vehicle availability:', error);
        return { data: false, error };
    }

    // If data is null, it means no overlapping reservations were found, so the vehicle IS available.
    // The ?? operator handles this: if data is null or undefined, it defaults to true.
    return { data: data ?? true, error: null };
}
