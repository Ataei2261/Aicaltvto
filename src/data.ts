/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClusterInfo, Table1Row, DecileInfo } from './types';

export const CLUSTERS: ClusterInfo[] = [
  {
    id: 'industry_agriculture',
    name: 'خوشه صنعت و کشاورزی',
    tariff: 580000,
    baseHourlyRate: 145000,
  },
  {
    id: 'services',
    name: 'خوشه خدمات',
    tariff: 480000,
    baseHourlyRate: 120000,
  },
  {
    id: 'culture_art',
    name: 'خوشه فرهنگ و هنر',
    tariff: 375000,
    baseHourlyRate: 93750,
  },
];

export const DECILES: DecileInfo[] = [
  { id: 'decile_1_5', name: 'دهک ۱ تا ۵' },
  { id: 'decile_6_10', name: 'دهک ۶ تا ۱۰' },
];

export const TABLE_1_ROWS: Table1Row[] = [
  { id: 1, name: 'مربی', weightPercentage: 18 },
  { id: 2, name: 'استاندارد/محتوا (مالکیت معنوی)', weightPercentage: 8 },
  { id: 3, name: 'کارشناس متخصص', weightPercentage: 3 },
  { id: 4, name: 'نیروی پشتیبانی', weightPercentage: 2 },
  { id: 5, name: 'فضا', weightPercentage: 12 },
  { id: 6, name: 'تجهیزات', weightPercentage: 12 },
  { id: 7, name: 'ابزار آلات', weightPercentage: 12 },
  { id: 8, name: 'مواد مصرفی', weightPercentage: 12 },
  { id: 9, name: 'انرژی (سوخت)', weightPercentage: 5 },
  { id: 10, name: 'ارزشیابی حین دوره', weightPercentage: 8 },
  { id: 11, name: 'ایمنی و بهداشت کار', weightPercentage: 5 },
  { id: 12, name: 'مستند سازی الکترونیکی فرایند آموزش', weightPercentage: 3 },
];

export const REGISTRATION_EXAM_COST = 2600000;
export const CERTIFICATE_ISSUANCE_COST = 1500000;
