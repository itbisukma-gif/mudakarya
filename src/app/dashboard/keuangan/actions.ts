'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getServiceCosts() {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('service_costs').select('*');
    if (error) {
        console.error('Error fetching service costs:', error);
        return { data: null, error };
    }
    // Transform array to object for easier access, e.g., { driver: 150000, ... }
    const costs = data.reduce((acc, item) => {
        acc[item.name] = item.cost;
        return acc;
    }, {} as { [key: string]: number });
    return { data: costs, error: null };
}

export async function updateServiceCost(name: 'driver' | 'matic' | 'fuel', cost: number) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('service_costs')
        .update({ cost })
        .eq('name', name)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating ${name} cost:`, error);
        return { data: null, error };
    }
    
    revalidatePath('/dashboard/keuangan');
    return { data, error: null };
}
