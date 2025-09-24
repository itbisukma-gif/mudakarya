'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
  }
  const driverData = await request.json();
  
  const { data, error } = await supabase
      .from('drivers')
      .upsert(driverData, { onConflict: 'id' })
      .select()
      .single();

  if (error) {
      console.error('Error upserting driver:', error);
      return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { driverId } = await request.json();

    const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);
    
    if (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ error: null });
}

export async function PATCH(request: NextRequest) {
    const supabase = createServiceRoleClient();
    if (!supabase) {
        return NextResponse.json({ error: { message: "Supabase client not available." } }, { status: 500 });
    }
    const { driverId, status } = await request.json();

    const { error } = await supabase
        .from('drivers')
        .update({ status })
        .eq('id', driverId);

    if (error) {
        console.error('Error updating driver status:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({ error: null });
}
