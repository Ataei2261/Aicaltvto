/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)])
    .replace(/\./g, '٫'); // Persian decimal marker
}

export function toEnglishDigits(str: string): string {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let res = str.replace(/٫/g, '.'); // Replace Persian decimal separator with English dot
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  return res;
}

export function formatRial(value: number): string {
  const rounded = Math.round(value);
  const formattedString = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${toPersianDigits(formattedString)} ریال`;
}

export function formatDecimal(value: number, decimals: number = 2): string {
  // Precise formatting to a maximum of `decimals` decimal places, preserving non-zeros
  const formatted = Number(value.toFixed(decimals)).toString();
  return toPersianDigits(formatted);
}

export const formatToFarsi = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return "-";
  
  // 1. Convert to string using standard Farsi locale
  let persianStr = Number(parsed).toLocaleString('fa-IR');
  
  // 2. Replace standard commas/spaces with the Arabic/Persian Decimal Separator (U+066B)
  persianStr = persianStr.replace(/,/g, '٬');
  
  // 3. Wrap in Left-to-Right Marks (U+200E) to lock the layout in Word
  return '\u200E' + persianStr + '\u200E';
};

export const formatDateForWord = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  
  // 1. Convert to string (just in case) and split by the slash
  const parts = String(dateString).split('/');
  
  // 2. If it is a standard 3-part date (Year, Month, Day)
  if (parts.length === 3) {
    // Reverse the array elements and join them back
    // e.g., ["1405", "03", "12"] becomes "12/03/1405"
    return parts.reverse().join('/');
  }
  
  // Fallback if the format is unexpected
  return String(dateString);
};

