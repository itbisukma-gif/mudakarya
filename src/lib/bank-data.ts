import type { ComboboxItem } from "@/components/ui/combobox";
import logos from './logo-urls.json';

export const bankList: ComboboxItem[] = [
    { value: 'bca', label: 'BCA', logo: logos['bca'] },
    { value: 'mandiri', label: 'Mandiri', logo: logos['mandiri'] },
    { value: 'bni', label: 'BNI', logo: logos['bni'] },
    { value: 'bri', label: 'BRI', logo: logos['bri'] },
    { value: 'cimb', label: 'CIMB Niaga', logo: logos['cimb-niaga'] },
    { value: 'danamon', label: 'Danamon', logo: logos['danamon'] },
];
