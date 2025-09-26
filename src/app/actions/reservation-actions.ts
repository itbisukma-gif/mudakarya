
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';

/**
 * Checks if a vehicle is available for a given date range.
 * This function queries the reservations table directly to find any overlapping bookings.
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

    // The logic is to find any reservation that overlaps with the desired [startDate, endDate] range.
    // An overlap occurs if:
    // 1. An existing reservation starts during the new range.
    // 2. An existing reservation ends during the new range.
    // 3. An existing reservation completely contains the new range.
    // PostgreSQL's overlap operator (&&) for ranges is ideal, but to do it with standard filters:
    // We look for reservations where the start is before our end, AND the end is after our start.
    
    const { data, error, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('vehicleId', vehicleId)
        .lt('startDate', endDate) // Its start is before our end
        .gt('endDate', startDate); // AND its end is after our start

    if (error) {
        console.error('Error checking vehicle availability:', error);
        // On error, it's safer to assume the vehicle is not available.
        return { data: false, error };
    }
    
    // If count is 0, no overlapping reservations were found, so the vehicle IS available.
    const isAvailable = count === 0;

    return { data: isAvailable, error: null };
}

