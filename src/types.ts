/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClusterType = 'industry_agriculture' | 'services' | 'culture_art';

export interface ClusterInfo {
  id: ClusterType;
  name: string;
  tariff: number; // Rial values
  baseHourlyRate: number; // BaseHourlyRate in Rial for Table 2
}

export interface Table1Row {
  id: number;
  name: string;
  weightPercentage: number;
}

export interface Table1RowState {
  id: number;
  isApplicant: boolean; // متقاضی
  isVocational: boolean; // فنی و حرفه‌ای
}

export type DecileType = 'decile_1_5' | 'decile_6_10';

export interface DecileInfo {
  id: DecileType;
  name: string;
}

export interface CalculationResult {
  baseClusterTariff: number;
  standardHours: number;
  dailyHours: number;
  totalDays: number;
  table1Costs: {
    rowId: number;
    name: string;
    weightPercentage: number;
    isApplicant: boolean;
    isVocational: boolean;
    cost: number;
  }[];
  sumOfRowCosts: number;
  dailyTableCost: number;
  selectedDecile: DecileInfo;
  baseHourlyRate: number;
  multiplier: number;
  totalTieredCost: number;
  registrationExamCost: number;
  certificateIssuanceCost: number;
  grandTotal: number;
}
