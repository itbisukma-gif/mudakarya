'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { BankAccount } from '@/lib/types';

export async function GET(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ data: { driver: 0, matic: 0, fuel: 0 }, error: null });
    }
    const { data, error } = await supabase.from('service_costs').select('*');
    if (error) {
        console.error('Error fetching service costs:', error);
        return NextResponse.json({ data: { driver: 0, matic: 0, fuel: 0 }, error });
    }

    const initialCosts = { driver: 0, matic: 0, fuel: 0 };
    const costs = data.reduce((acc, item) => {
        if (item.name in acc) {
            acc[item.name as keyof typeof initialCosts] = item.cost;
        }
        return acc;
    }, initialCosts);
    
    return NextResponse.json({ data: costs });
}

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { name, cost } = await request.json();
    
    const { data, error } = await supabase
        .from('service_costs')
        .update({ cost })
        .eq('name', name)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating ${name} cost:`, error);
        return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({ data });
}
