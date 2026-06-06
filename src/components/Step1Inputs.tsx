/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CLUSTERS, DECILES } from '../data';
import { ClusterType, DecileType } from '../types';
import { toPersianDigits, toEnglishDigits, formatRial, formatDecimal } from '../utils/numberUtils';

interface Step1InputsProps {
  selectedClusterId: ClusterType | null;
  setSelectedClusterId: (id: ClusterType | null) => void;
  standardHours: number;
  setStandardHours: (hours: number) => void;
  dailyHours: number;
  setDailyHours: (hours: number) => void;
  // Step 2 (Income level & tiered rate) merged properties
  selectedDecileId: DecileType | null;
  setSelectedDecileId: (id: DecileType | null) => void;
}

export const Step1Inputs: React.FC<Step1InputsProps> = ({
  selectedClusterId,
  setSelectedClusterId,
  standardHours,
  setStandardHours,
  dailyHours,
  setDailyHours,
  selectedDecileId,
  setSelectedDecileId,
}) => {
  const currentCluster = CLUSTERS.find(c => c.id === selectedClusterId);

  // React local states for inputs, keeping them format-friendly with toPersianDigits
  const [standardHoursInputVal, setStandardHoursInputVal] = React.useState(standardHours > 0 ? toPersianDigits(standardHours.toString()) : '');
  const [dailyHoursInputVal, setDailyHoursInputVal] = React.useState(dailyHours > 0 ? toPersianDigits(dailyHours.toString()) : '');

  // Keep local string states in sync when standardHours or dailyHours changes (e.g., from reset or default actions)
  React.useEffect(() => {
    setStandardHoursInputVal(standardHours > 0 ? toPersianDigits(standardHours.toString()) : '');
  }, [standardHours]);

  React.useEffect(() => {
    setDailyHoursInputVal(dailyHours > 0 ? toPersianDigits(dailyHours.toString()) : '');
  }, [dailyHours]);

  const handleHoursChangeText = (val: string) => {
    const cleaned = val.replace(/[^0-9۰-۹٠-٩]/g, '');
    setStandardHoursInputVal(toPersianDigits(cleaned));
    
    const englishVal = toEnglishDigits(cleaned);
    const num = parseInt(englishVal, 10);
    setStandardHours(isNaN(num) || num <= 0 ? 0 : num);
  };

  const handleDailyHoursChangeText = (val: string) => {
    let cleaned = val.replace(/[^0-9۰-۹٠-٩.٫]/g, '');
    cleaned = cleaned.replace(/\./g, '٫');
    const sepIndex = cleaned.indexOf('٫');
    if (sepIndex !== -1) {
      cleaned = cleaned.slice(0, sepIndex + 1) + cleaned.slice(sepIndex + 1).replace(/[٫]/g, '');
    }
    
    setDailyHoursInputVal(cleaned);
    
    const englishVal = toEnglishDigits(cleaned);
    if (englishVal === '' || englishVal === '.') {
      setDailyHours(0);
    } else {
      const num = parseFloat(englishVal);
      setDailyHours(isNaN(num) || num <= 0 ? 0 : num);
    }
  };

  // Determine total days (rounded up to nearest integer)
  const totalDays = dailyHours > 0 ? Math.ceil(standardHours / dailyHours) : 0;

  // Preset hours for quick convenience
  const hourPresets = [40, 80, 120, 200, 300];

  // Table 2 tiered calculation logic
  const getMultiplierBreakdown = (hours: number) => {
    let multiplier = 0;
    let description = '';

    if (hours <= 0) {
      return { multiplier: 0, description: 'بدون ساعت دوره آموزشی' };
    }

    if (hours <= 100) {
      multiplier = hours;
      description = `خود ساعت: ${toPersianDigits(hours)}`;
    } else if (hours <= 200) {
      multiplier = 100 + (hours - 100) * 0.5;
      description = `۱۰۰ + (${toPersianDigits(hours - 100)} × ۰٫۵) = ${toPersianDigits(multiplier)}`;
    } else if (hours <= 300) {
      multiplier = 150 + (hours - 200) * 0.25;
      description = `۱۵۰ + (${toPersianDigits(hours - 200)} × ۰٫۲۵) = ${toPersianDigits(multiplier)}`;
    } else {
      multiplier = 175 + (hours - 300) * 0.15;
      description = `۱۷۵ + (${toPersianDigits(hours - 300)} × ۰٫۱۵) = ${toPersianDigits(multiplier)}`;
    }

    return { multiplier, description };
  };

  const baseHourlyRate = currentCluster ? currentCluster.baseHourlyRate : 0;
  const { multiplier, description: formulaText } = getMultiplierBreakdown(standardHours);
  const isDecile6To10 = selectedDecileId === 'decile_6_10';
  const totalTieredCost = isDecile6To10 ? baseHourlyRate * multiplier : 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5 h-full flex flex-col" id="step1-inputs-container">
      {/* Accent Line */}
      <div className="w-10 h-1 bg-blue-600 rounded-full"></div>

      <div>
        <h2 className="text-base font-bold text-slate-800" id="step1-title">تنظیمات اولیه دوره</h2>
        <p className="text-slate-400 text-xs mt-1">خوشه اصلی، ساعت کل، زمان‌بندی و سطح درآمدی متقاضی را مشخص نمایید.</p>
      </div>

      {/* Cluster Selection Radio Items */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-red-600 uppercase tracking-wider">۱. انتخاب خوشه اصلی</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2" id="cluster-cards-grid">
          {CLUSTERS.map((cluster) => {
            const isSelected = cluster.id === selectedClusterId;
            const displayName = cluster.name.replace(/^خوشه\s+/, '');
            return (
              <button
                key={cluster.id}
                id={`cluster-btn-${cluster.id}`}
                type="button"
                onClick={() => setSelectedClusterId(cluster.id)}
                className={`w-full text-right p-2.5 md:p-2 rounded-lg border transition-all cursor-pointer flex flex-row md:flex-col items-center md:items-start justify-between min-w-0 gap-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center md:items-start gap-2 flex-1 md:w-full min-w-0">
                  <div
                    className={`w-3.5 h-3.5 mt-0.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-bold text-slate-800 block leading-tight whitespace-normal break-words">
                      {displayName}
                    </span>
                  </div>
                </div>

                <div className="text-left self-center md:self-start md:pe-5.5 font-sans whitespace-nowrap">
                  <span className={`text-[11px] md:text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>
                    {toPersianDigits(cluster.tariff.toLocaleString())} ریال
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hour Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-red-600" htmlFor="standard-hours-input">
            ۲. ساعت استاندارد آموزشی
          </label>
          <input
            id="standard-hours-input"
            type="text"
            inputMode="numeric"
            value={standardHoursInputVal}
            onChange={(e) => handleHoursChangeText(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="۰"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-red-600" htmlFor="daily-hours-input">
            ۳. میزان ساعت آموزش در هر روز
          </label>
          <input
            id="daily-hours-input"
            type="text"
            inputMode="decimal"
            value={dailyHoursInputVal}
            onChange={(e) => handleDailyHoursChangeText(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="۰٫۰"
          />
        </div>
      </div>



      {/* Calculations Summary Days Box */}
      {dailyHours <= 0 || standardHours <= 0 ? (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs" id="warning-box">
          ساعت معتبر برای تعیین دقیق روزها وارد کنید.
        </div>
      ) : (
        <div className="bg-blue-55/40 p-3 rounded-lg border border-blue-100 flex items-center justify-between" id="metrics-summary">
          <div>
            <span className="text-[10px] text-blue-600 font-bold block mb-0.5">تعداد روز برگزاری دوره:</span>
            <span className="text-[11px] text-slate-500">حاصل تقسیم کل ساعات بر ساعات روزانه</span>
          </div>
          <div className="text-left">
            <span className="text-lg font-extrabold text-blue-900 font-sans">
              {toPersianDigits(totalDays)} <span className="text-xs font-normal text-slate-550 mr-0.5">روز</span>
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-150 my-2"></div>

      {/* Section 3: سطح درآمدی و نرخ پلکانی */}
      <div className="space-y-4" id="merged-decile-section">
        <div>
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider">۴. تعیین دهک متقاضی</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">دهک اقتصادی متقاضی و محاسبات تعدیل ساعتی دوره.</p>
        </div>

        <div className="space-y-3">
          {/* Trainee's Income Decile Dropdown */}
          <div className="space-y-1">
            <label htmlFor="decile-select" className="block text-[10px] font-bold text-slate-400 uppercase">
              دهک اقتصادی متقاضی:
            </label>
            <select
              id="decile-select"
              value={selectedDecileId || ''}
              onChange={(e) => setSelectedDecileId((e.target.value as DecileType) || null)}
              className="w-full bg-white border border-slate-300 font-semibold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-xs text-center"
            >
              <option value="">--لطفا دهک متقاضی را انتخاب کنید--</option>
              {DECILES.map((decile) => (
                <option key={decile.id} value={decile.id}>
                  {decile.name} (شاخص مصوب)
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Rates List */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center text-slate-600">
              <span>نرخ پایه ساعتی خوشه:</span>
              <span className="font-bold font-sans text-slate-800">
                {formatRial(isDecile6To10 ? baseHourlyRate : 0)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>ضریب پلکانی (Multiplier):</span>
              <span className="font-bold font-sans text-slate-800">
                {isDecile6To10 ? formatDecimal(multiplier, 2) : '۰'}
              </span>
            </div>

            {isDecile6To10 && standardHours > 0 && (
              <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 font-mono text-center leading-relaxed">
                فرمول: {formulaText}
              </div>
            )}

            {!isDecile6To10 && (
              <div className="bg-blue-50/50 text-blue-800 p-2 rounded text-[10px] text-center font-bold">
                به دلیل انتخاب دهک حمایت شده (۱-۵)، هزینه آموزش ساعتی صفر ریال منظور می‌شود.
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-blue-600 pt-2 border-t border-slate-100/60">
              <span>میزان افزایش تعرفه بر اساس دهک متقاضی:</span>
              <span className="font-sans font-extrabold text-sm" id="tiered-total-cost-display">
                {formatRial(totalTieredCost)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
