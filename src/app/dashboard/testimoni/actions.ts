
'use server';

import { createServiceRoleClient, uploadImageFromDataUri } from '@/utils/supabase/server';
import type { Testimonial, GalleryItem, FeatureItem } from '@/lib/types';

// --- Testimonial Actions ---

export async function upsertTestimonial(testimonialData: Omit<Testimonial, 'created_at'>) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('testimonials').upsert(testimonialData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting testimonial:', error);
        return { data: null, error };
    }
    return { data, error: null };
}


export async function deleteTestimonial(id: string) {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) return { error };
    return { error: null };
}

// --- Gallery Actions ---

export async function addGalleryItem(galleryData: Omit<GalleryItem, 'id' | 'created_at'>) {
    const supabase = createServiceRoleClient();

    try {
        if (galleryData.url && galleryData.url.startsWith('data:image')) {
            galleryData.url = await uploadImageFromDataUri(galleryData.url, 'gallery', `gallery-photo`);
        }
    } catch (uploadError) {
        console.error("Gallery image upload failed:", uploadError);
        return { data: null, error: { message: (uploadError as Error).message } };
    }

    const { data, error } = await supabase.from('gallery').insert(galleryData).select().single();
    if (error) {
        console.error('Error adding gallery item:', error);
        return { data: null, error };
    }
    return { data, error: null };
}

export async function deleteGalleryItem(id: string) {
    const supabase = createServiceRoleClient();
    // First, get the path of the object to delete from storage
    const { data: itemData, error: fetchError } = await supabase.from('gallery').select('url').eq('id', id).single();
    
    if (fetchError) {
        console.error("Error fetching gallery item for deletion:", fetchError);
        return { error: fetchError };
    }

    // Delete from DB
    const { error: deleteDbError } = await supabase.from('gallery').delete().eq('id', id);
    if (deleteDbError) {
        console.error("Error deleting gallery item from DB:", deleteDbError);
        return { error: deleteDbError };
    }

    // If DB deletion is successful, delete from storage
    const bucketName = 'mudakarya-bucket';
    const filePath = itemData.url.substring(itemData.url.indexOf(bucketName) + bucketName.length + 1);
    const { error: deleteStorageError } = await supabase.storage.from(bucketName).remove([filePath]);

    if (deleteStorageError) {
        console.error("Error deleting gallery item from Storage:", deleteStorageError);
        // We don't return an error here because the DB record is already gone, which is the main goal.
    }

    return { error: null };
}


// --- Feature Actions ---

export async function upsertFeature(featureData: Omit<FeatureItem, 'created_at'>) {
    const supabase = createServiceRoleClient();

    try {
        if (featureData.imageUrl && featureData.imageUrl.startsWith('data:image')) {
             featureData.imageUrl = await uploadImageFromDataUri(featureData.imageUrl, 'features', `feature-${featureData.id}`);
        }
    } catch (uploadError) {
        console.error("Feature image upload failed:", uploadError);
        return { data: null, error: { message: (uploadError as Error).message } };
    }

    const { data, error } = await supabase.from('features').upsert(featureData, { onConflict: 'id' }).select().single();
    if (error) {
        console.error('Error upserting feature:', error);
        return { data: null, error };
    }
    return { data, error: null };
}

export async function deleteFeature(id: string) {
    const supabase = createServiceRoleClient();

    const { data: itemData, error: fetchError } = await supabase.from('features').select('imageUrl').eq('id', id).single();
    if (fetchError) {
        console.error("Error fetching feature for deletion:", fetchError);
        return { error: fetchError };
    }

    const { error } = await supabase.from('features').delete().eq('id', id);
    if (error) return { error };

    if(itemData.imageUrl) {
        const bucketName = 'mudakarya-bucket';
        const filePath = itemData.imageUrl.substring(itemData.imageUrl.indexOf(bucketName) + bucketName.length + 1);
        await supabase.storage.from(bucketName).remove([filePath]);
    }
    
    return { error: null };
}
