
'use client'

import { useState, useEffect } from 'react';
import logos from '@/lib/logo-urls.json';

// Define a type for the keys of the logos object
type BrandLogoKey = keyof typeof logos;

/**
 * A custom hook to get the vehicle logo URL.
 * It first checks the local `logo-urls.json`.
 * If not found, it attempts to dynamically build and verify URLs from a CDN for both png and svg formats.
 * @param brandName The name of the vehicle brand.
 * @returns An object containing the `logoUrl` string or null if no valid logo is found.
 */
export function useVehicleLogo(brandName?: string | null) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const findLogo = async () => {
            if (!brandName) {
                if (isMounted) setLogoUrl(null);
                return;
            }
            
            const brandKey = brandName.toLowerCase().replace(/ /g, '-') as BrandLogoKey;

            // 1. Check local JSON file first
            if (logos[brandKey]) {
                if (isMounted) setLogoUrl(logos[brandKey]);
                return;
            }

            // 2. If not in JSON, try dynamic fallback
            const formattedBrand = brandName.toLowerCase().replace(/ /g, '-');
            const baseCdnUrl = `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/original/`;

            const urlsToTry = [
                `${baseCdnUrl}${formattedBrand}.png`,
                `${baseCdnUrl}${formattedBrand}.svg`,
            ];

            for (const url of urlsToTry) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    if (response.ok) {
                        // Found a valid URL
                        if (isMounted) {
                            setLogoUrl(url);
                        }
                        return; // Exit after finding the first valid logo
                    }
                } catch (error) {
                    // This can happen due to network errors, CORS (though HEAD shouldn't be an issue), etc.
                    // We'll just continue to the next URL.
                    console.error(`Error checking logo URL ${url}:`, error);
                }
            }
        };

        findLogo();

        return () => {
            isMounted = false;
        };
    }, [brandName]);

    return { logoUrl };
}
