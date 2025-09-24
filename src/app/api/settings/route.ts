'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    
    const { type, data: updateData } = await request.json();

    let error;
    if (type === 'contact') {
        const { error: contactError } = await supabase.from('contact_info').update(updateData).eq('id', 1);
        error = contactError;
    } else if (type === 'terms') {
        const { error: termsError } = await supabase.from('terms_content').update(updateData).eq('id', 1);
        error = termsError;
    } else {
        return NextResponse.json({ error: { message: "Invalid settings type." } }, { status: 400 });
    }

    if(error) {
        console.error(`Error updating ${type} settings:`, error);
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ error: null });
}
