import type { BankAccount } from './types';
import logos from './logo-urls.json';

// This file contains dummy data for demonstration purposes.
// In a real application, this data would be fetched from a database or API.

export let serviceCosts = {
    driver: 150000,
    matic: 50000,
    fuel: 200000,
};

export let bankAccounts: BankAccount[] = [
    { 
        bankName: 'BCA', 
        accountNumber: '1234567890', 
        accountName: 'PT MudaKarya',
        logoUrl: logos['bca']
    },
    { 
        bankName: 'Mandiri', 
        accountNumber: '0987654321', 
        accountName: 'PT MudaKarya',
        logoUrl: logos['mandiri']
    },
];

// All major data has been migrated to Supabase.
// These can be removed if they are no longer needed for any fallback.
export let orders = [];
export let promotions = [];
export let fleet = [];
export let testimonials = [];
export let gallery = [];
export let features = [];
