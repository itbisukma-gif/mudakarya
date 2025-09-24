
'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { BankAccount } from '@/lib/types';

// Helper to create client and handle build-time errors
function getSupabase() {
    try {
        return createServiceRoleClient();
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Supabase client could not be created, likely during build time.');
        }
        return null;
    }
}

export async function getServiceCosts() {
    const supabase = getSupabase();
    if (!supabase) {
        // Return a default, safe object during build time
        return { data: { driver: 0, matic: 0, fuel: 0 }, error: null };
    }
    const { data, error } = await supabase.from('service_costs').select('*');
    if (error) {
        console.error('Error fetching service costs:', error);
        // Return default values on error to prevent NaN issues
        return { data: { driver: 0, matic: 0, fuel: 0 }, error };
    }

    const initialCosts = {
        driver: 0,
        matic: 0,
        fuel: 0,
    };

    // Reduce the fetched data into the initialCosts object
    const costs = data.reduce((acc, item) => {
        if (item.name in acc) {
            acc[item.name as keyof typeof initialCosts] = item.cost;
        }
        return acc;
    }, initialCosts);
    
    return { data: costs, error: null };
}


export async function updateServiceCost(name: 'driver' | 'matic' | 'fuel', cost: number) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };
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

export async function addBankAccount(account: Omit<BankAccount, 'id'>) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: { message: "Supabase client not available." } };
    const { data, error } = await supabase.from('bank_accounts').insert(account).select().single();

    if (error) {
        console.error('Error adding bank account:', error);
        return { data: null, error };
    }
    revalidatePath('/dashboard/keuangan');
    return { data, error: null };
}

export async function deleteBankAccount(id: number) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Supabase client not available." } };
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);

    if (error) {
        console.error('Error deleting bank account:', error);
        return { error };
    }
    revalidatePath('/dashboard/keuangan');
    return { error: null };
}
