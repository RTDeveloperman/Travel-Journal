
import { Country } from '../types'; // Assuming Country type is defined in types.ts

export const countriesList: Country[] = [
  { code: '', name: 'انتخاب کنید...', nameEn: 'Select...' },
  { code: 'IR', name: 'ایران', nameEn: 'Iran' },
  { code: 'AF', name: 'افغانستان', nameEn: 'Afghanistan' },
  { code: 'TR', name: 'ترکیه', nameEn: 'Turkey' },
  { code: 'IQ', name: 'عراق', nameEn: 'Iraq' },
  { code: 'PK', name: 'پاکستان', nameEn: 'Pakistan' },
  { code: 'DE', name: 'آلمان', nameEn: 'Germany' },
  { code: 'FR', name: 'فرانسه', nameEn: 'France' },
  { code: 'GB', name: 'بریتانیا', nameEn: 'United Kingdom' },
  { code: 'US', name: 'ایالات متحده آمریکا', nameEn: 'United States' },
  { code: 'CA', name: 'کانادا', nameEn: 'Canada' },
  { code: 'OTHER', name: 'سایر کشورها', nameEn: 'Other' },
];

export const getCountryNameByCode = (code?: string): string => {
  if (!code) return 'ثبت نشده';
  const country = countriesList.find(c => c.code === code);
  return country ? country.name : code; // Return code itself if name not found
};
