'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { Buffer } from 'buffer';

/**
 * A Server Action to securely upload a file from a data URI to Supabase Storage.
 * This runs on the server and uses the service_role key to bypass RLS policies.
 * @param dataUri The file encoded as a data URI.
 * @param folder The folder within the bucket to upload to.
 * @param fileNamePrefix A prefix for the generated file name.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileAction(dataUri: string, folder: string, fileNamePrefix: string): Promise<string> {
    const supabase = createServiceRoleClient();
    
    // Improved regex to handle various image types
    const matches = dataUri.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.*)$/);

    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Data URI format. Only PNG, JPG, and WEBP are supported.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const fileExtension = mimeType.split('/')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = `${fileNamePrefix}-${Date.now()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('mudakarya-bucket')
        .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: false, // Use false to prevent accidental overwrites
        });

    if (uploadError) {
        console.error(`Supabase server upload error for ${filePath}:`, uploadError);
        throw new Error(`Gagal mengunggah file: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
        .from('mudakarya-bucket')
        .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
    }

    return publicUrlData.publicUrl;
}
