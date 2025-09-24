'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });

    const testimonialData = await request.json();
    const { data, error } = await supabase.from('testimonials').upsert(testimonialData, { onConflict: 'id' }).select().single();
    
    if (error) {
        console.error('Error upserting testimonial:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });

    const { id } = await request.json();
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ error: null });
}
