
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Buffer } from 'buffer';

export const createClient = () => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Anon Key are required.");
  }

  // Create a server-side client with the user's cookies
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL and Service Role Key are required for admin operations.");
  }

  // Create a server-side client with the service_role key to bypass RLS
  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
        get(name: string) { return undefined; },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
};


export const uploadImageFromDataUri = async (dataUri: string, folder: string, fileNamePrefix: string) => {
    // Use the service role client for all storage operations from the server
    const supabase = createServiceRoleClient();
    const matches = dataUri.match(/^data:(image\/(?:png|jpeg|jpg));base64,(.*)$/);
    
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Data URI format');
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
            upsert: true,
        });

    if (uploadError) {
        console.error(`Supabase upload error for ${filePath}:`, uploadError);
        throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
        .from('mudakarya-bucket')
        .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
    }

    return publicUrlData.publicUrl;
};
