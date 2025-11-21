import { Gender, GenderOption } from '../types';

export const genderOptionsList: Gender[] = [
  { code: '', name: 'انتخاب کنید...' },
  { code: 'male', name: 'مرد' },
  { code: 'female', name: 'زن' },
  { code: 'other', name: 'سایر' },
  { code: 'prefer_not_to_say', name: 'ترجیح می‌دهم نگویم' },
];

export const getGenderNameByCode = (code?: GenderOption): string => {
  if (!code) return 'ثبت نشده'; // Simplified condition
  const gender = genderOptionsList.find(g => g.code === code);
  return gender ? gender.name : code;
};