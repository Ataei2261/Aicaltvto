/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TABLE_1_ROWS } from '../data';
import { Table1RowState } from '../types';
import { toPersianDigits, toEnglishDigits, formatRial, formatDecimal } from '../utils/numberUtils';
import { Layers, HelpCircle, Check, CircleDot, RefreshCw, AlertTriangle } from 'lucide-react';

interface Table1SectionProps {
  baseClusterTariff: number;
  totalDays: number;
  rowStates: Table1RowState[];
  setRowStates: React.Dispatch<React.SetStateAction<Table1RowState[]>>;
  rowWeights: { [id: number]: number };
  setRowWeights: React.Dispatch<React.SetStateAction<{ [id: number]: number }>>;
  totalWeightSum: number;
  hasWeightError: boolean;
  weightErrorAmount: number;
}

export const Table1Section: React.FC<Table1SectionProps> = ({
  baseClusterTariff,
  totalDays,
  rowStates,
  setRowStates,
  rowWeights,
  setRowWeights,
  totalWeightSum,
  hasWeightError,
  weightErrorAmount,
}) => {
  // Toggle checkbox helper with mutual exclusivity
  const handleCheckboxChange = (rowId: number, field: 'isApplicant' | 'isVocational') => {
    setRowStates((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextVal = !r[field];
          const opponentField = field === 'isApplicant' ? 'isVocational' : 'isApplicant';
          return {
            ...r,
            [field]: nextVal,
            [opponentField]: nextVal ? false : r[opponentField],
          };
        }
        return r;
      })
    );
  };

  // Helper actions for training managers
  const selectAllVocational = () => {
    setRowStates((prev) => prev.map((r) => ({ ...r, isVocational: true, isApplicant: false })));
  };

  const deselectAllVocational = () => {
    setRowStates((prev) => prev.map((r) => ({ ...r, isVocational: false, isApplicant: false })));
  };

  // Calculations
  const calculatedRows = TABLE_1_ROWS.map((row) => {
    const state = rowStates.find((s) => s.id === row.id) || { id: row.id, isApplicant: false, isVocational: false };
    const currentWeight = rowWeights[row.id] !== undefined ? rowWeights[row.id] : row.weightPercentage;
    const rowCost = !hasWeightError && state.isVocational ? (currentWeight / 100) * baseClusterTariff : 0;
    return {
      ...row,
      ...state,
      weightPercentage: currentWeight,
      rowCost,
    };
  });

  const sumOfRowCosts = hasWeightError ? 0 : calculatedRows.reduce((sum, r) => sum + r.rowCost, 0);
  const dailyTableCost = hasWeightError ? 0 : sumOfRowCosts * totalDays;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-full flex flex-col" id="table1-section-container">
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-850" id="table1-title">جدول آنالیز  خدمات آموزشی و فنی</h2>
          <p className="text-slate-450 text-xs mt-0.5">براساس شیوه نامه شماره <span dir="ltr" className="inline-block font-bold">۱۹۴۸۹/۱۰۰</span> مورخ <span dir="ltr" className="inline-block font-bold">۹۸/۶/۴</span></p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap gap-1.5 text-[10px] print:hidden" id="table1-batch-actions">
          <button
            type="button"
            onClick={selectAllVocational}
            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold transition-all cursor-pointer max-w-[140px] sm:max-w-none text-center leading-tight whitespace-normal break-words"
          >
            اجرای کامل دوره توسط فنی و حرفه ای
          </button>
          <button
            type="button"
            onClick={deselectAllVocational}
            className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded font-bold transition-all cursor-pointer"
          >
            لغو انتخاب
          </button>
        </div>
      </div>

      {/* Dynamic Weight Errors and Alerts */}
      {hasWeightError && (
        <div className="p-4 bg-rose-50 border-r-4 border-rose-500 rounded-xl text-rose-800 space-y-2 text-xs sm:text-sm shadow-sm animate-fade-in" id="weight-validation-alert">
          <div className="flex items-center gap-2 font-black text-rose-950">
            <span className="text-rose-600">⚠️</span>
            <span>خطای مجموع وزن‌های آنالیز هزینه</span>
          </div>
          <p className="leading-relaxed font-medium">
            مجموع درصدهای هزینه‌ای باید دقیقاً برابر با <span className="font-bold">۱۰۰ درصد</span> باشد. مجموع فعلی وارد شده:{" "}
            <span className="font-extrabold text-xs sm:text-sm mx-1 text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-md font-mono">{toPersianDigits(totalWeightSum)}٪</span> است.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="font-semibold text-rose-700">
              {weightErrorAmount > 0 ? (
                <>مقدار اضافه (مازاد وزن): <span className="font-black font-mono text-sm sm:text-base text-rose-800 bg-rose-100/40 px-1.5 py-0.5 rounded">{toPersianDigits(weightErrorAmount)}٪</span> روی ردیف‌ها کم کنید.</>
              ) : (
                <>مقدار کمبود (کسری وزن): <span className="font-black font-mono text-sm sm:text-base text-rose-800 bg-rose-100/40 px-1.5 py-0.5 rounded">{toPersianDigits(Math.abs(weightErrorAmount))}٪</span> به ردیف‌ها اضافه کنید.</>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setRowWeights(() => {
                  const initial: { [id: number]: number } = {};
                  TABLE_1_ROWS.forEach((r) => {
                    initial[r.id] = r.weightPercentage;
                  });
                  return initial;
                });
              }}
              className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-750 active:scale-95 duration-100 rounded-lg text-xs font-bold shadow-sm cursor-pointer shrink-0 self-end sm:self-auto"
            >
              بازنشانی به درصد پیش‌فرض (۱۰۰٪)
            </button>
          </div>
        </div>
      )}

      {/* Grid Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-150" id="table1-grid-wrapper">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3 w-8 text-center">ردیف</th>
              <th className="py-2.5 px-3">عنوان فرآیند هزینه‌ای</th>
              <th className="py-2.5 px-3 text-center w-16">وزن (%)</th>
              <th className="py-2.5 px-3 text-center w-16">متقاضی</th>
              <th className="py-2.5 px-3 text-center w-18">فنی‌وحرفه‌ای</th>
              <th className="py-2.5 px-3 text-left w-28">هزینه (ریال)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calculatedRows.map((row, idx) => {
              const active = row.isVocational;
              return (
                <tr
                  key={row.id}
                  id={`table1-row-${row.id}`}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    active ? 'bg-blue-50/10' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-center font-mono text-slate-400">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`block ${active ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {row.name}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center font-bold text-slate-800 font-mono">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={toPersianDigits(row.weightPercentage)}
                        onChange={(e) => {
                          const rawVal = toEnglishDigits(e.target.value).replace(/\D/g, '');
                          const numVal = rawVal === '' ? 0 : parseInt(rawVal, 10);
                          setRowWeights((prev) => ({
                            ...prev,
                            [row.id]: numVal,
                          }));
                        }}
                        className={`w-14 px-1 py-1 text-center font-black text-slate-900 text-[14px] sm:text-[15px] bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                          hasWeightError 
                            ? 'border-rose-400 bg-rose-50/20 text-rose-800 ring-rose-300' 
                            : 'border-slate-300 hover:border-slate-400 focus:border-blue-500'
                        }`}
                      />
                      <span className="text-slate-400 text-xs font-black select-none">%</span>
                    </div>
                  </td>
                  
                  {/* Applicant Toggle Checkbox (Modern checkbox) */}
                  <td className="py-2 px-3 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.isApplicant}
                        onChange={() => handleCheckboxChange(row.id, 'isApplicant')}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all">
                        {row.isApplicant && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </label>
                  </td>

                  {/* Vocational Toggle Checkbox (Modern checkbox) */}
                  <td className="py-2 px-3 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.isVocational}
                        onChange={() => handleCheckboxChange(row.id, 'isVocational')}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all">
                        {row.isVocational && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </label>
                  </td>

                  {/* Calculated Cost of Row */}
                  <td className="py-2 px-3 text-left font-mono font-bold">
                    {hasWeightError ? (
                      <span className="text-rose-500 text-[10px] font-sans font-bold">خطای وزن</span>
                    ) : row.isVocational ? (
                      <span className="text-slate-900">{toPersianDigits(row.rowCost.toLocaleString())}</span>
                    ) : (
                      <span className="text-slate-300 font-normal">۰</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sums and Totals of Table 1 */}
      {hasWeightError ? (
        <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl text-center text-rose-700 font-bold text-xs space-y-1" id="table1-weight-error-placeholder">
          <p className="font-extrabold text-rose-800">محاسبات جدول متوقف شده است.</p>
          <p className="font-medium text-rose-600/90">لطفاً ابتدا مجموع درصدهای آنالیز را برابر ۱۰۰٪ تنظیم کنید تا محاسبات دقیق آنلاین انجام شود.</p>
        </div>
      ) : totalDays <= 0 ? (
        <div className="p-3 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
          جهت مشاهده خروجی‌های مالی، زمان دوره را مشخص کنید.
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs" id="table1-results">
          <div className="flex justify-between items-center text-slate-650">
            <span>جمع هزینه ی یک نفر روز خدمات آموزشی(ریال):</span>
            <span className="font-extrabold font-sans text-slate-800">
              {toPersianDigits(sumOfRowCosts.toLocaleString())} ریال
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-slate-700 font-bold">
            <span className="text-blue-700">مبلغ کل هزینه طول دوره ( حاصلضرب هزینه یک نفر روز در تعداد روز ):</span>
            <span className="text-sm font-extrabold font-sans text-blue-900" id="daily-table-cost-display">
              {toPersianDigits(Math.round(dailyTableCost).toLocaleString())} ریال
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
