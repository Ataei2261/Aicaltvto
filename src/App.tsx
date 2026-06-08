/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CLUSTERS, TABLE_1_ROWS, DECILES, REGISTRATION_EXAM_COST, CERTIFICATE_ISSUANCE_COST } from './data';
import { ClusterType, DecileType, Table1RowState } from './types';
import { Step1Inputs } from './components/Step1Inputs';
import { Table1Section } from './components/Table1Section';
import { SummarySection } from './components/SummarySection';
import { toPersianDigits, formatRial } from './utils/numberUtils';
import { Calculator, Phone } from 'lucide-react';

export default function App() {
  // 1. Initial State Definitions
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [selectedClusterId, setSelectedClusterId] = useState<ClusterType | null>(null);
  const [standardHours, setStandardHours] = useState<number>(0);
  const [dailyHours, setDailyHours] = useState<number>(0);
  
  // Initialize row states as completely unchecked/blank initially
  const [table1RowStates, setTable1RowStates] = useState<Table1RowState[]>(() =>
    TABLE_1_ROWS.map((row) => ({
      id: row.id,
      isApplicant: false,
      isVocational: false,
    }))
  );

  const [selectedDecileId, setSelectedDecileId] = useState<DecileType | null>(null);

  // Editable row weights state
  const [rowWeights, setRowWeights] = useState<{ [id: number]: number }>(() => {
    const initial: { [id: number]: number } = {};
    TABLE_1_ROWS.forEach((row) => {
      initial[row.id] = row.weightPercentage;
    });
    return initial;
  });

  // 2. Calculations
  const currentCluster = CLUSTERS.find((c) => c.id === selectedClusterId);
  const currentDecile = DECILES.find((d) => d.id === selectedDecileId);

  const baseClusterTariff = currentCluster ? currentCluster.tariff : 0;
  const baseHourlyRate = currentCluster ? currentCluster.baseHourlyRate : 0;

  // Compute precise TotalDays, rounding up to the nearest integer
  const totalDays = dailyHours > 0 ? Math.ceil(standardHours / dailyHours) : 0;

  // Weight validation
  const totalWeightSum = TABLE_1_ROWS.reduce((sum, row) => {
    const val = rowWeights[row.id] !== undefined ? rowWeights[row.id] : row.weightPercentage;
    return sum + (val || 0);
  }, 0);
  const hasWeightError = totalWeightSum !== 100;
  const weightErrorAmount = totalWeightSum - 100; // positive is excess, negative is deficit

  // Table 1 detailed row costs and summation
  const calculatedTable1Rows = TABLE_1_ROWS.map((row) => {
    const state = table1RowStates.find((s) => s.id === row.id) || {
      id: row.id,
      isApplicant: false,
      isVocational: false,
    };
    const currentWeight = rowWeights[row.id] !== undefined ? rowWeights[row.id] : row.weightPercentage;
    const rowCost = !hasWeightError && state.isVocational ? (currentWeight / 100) * baseClusterTariff : 0;
    return {
      ...row,
      ...state,
      weightPercentage: currentWeight,
      rowCost,
    };
  });

  const sumOfRowCosts = hasWeightError ? 0 : calculatedTable1Rows.reduce((sum, r) => sum + r.rowCost, 0);
  const dailyTableCost = hasWeightError ? 0 : sumOfRowCosts * totalDays;

  // Table 2 Tiered hourly cost logic matching Step 3 formula EXACTLY
  const getMultiplier = (hours: number): number => {
    if (hours <= 100) {
      return hours;
    } else if (hours <= 200) {
      return 100 + (hours - 100) * 0.5;
    } else if (hours <= 300) {
      return 150 + (hours - 200) * 0.25;
    } else {
      return 175 + (hours - 300) * 0.15;
    }
  };

  const multiplier = getMultiplier(standardHours);
  const totalTieredCost = selectedDecileId === 'decile_1_5' || !selectedDecileId ? 0 : baseHourlyRate * multiplier;

  // Only calculate billing registration & certificate fees if cluster, decile, and hours are selected
  const hasSelections = selectedClusterId !== null && selectedDecileId !== null && standardHours > 0 && dailyHours > 0;
  const registrationExamCost = hasSelections
    ? (selectedClusterId === 'services' ? 1900000 : REGISTRATION_EXAM_COST)
    : 0;
  const certificateIssuanceCost = hasSelections ? CERTIFICATE_ISSUANCE_COST : 0;

  // Final aggregate sum
  const grandTotal = hasSelections && !hasWeightError
    ? dailyTableCost + totalTieredCost + registrationExamCost + certificateIssuanceCost
    : 0;

  // Reset helper
  const handleReset = () => {
    setSelectedClusterId(null);
    setStandardHours(0);
    setDailyHours(0);
    setTable1RowStates(
      TABLE_1_ROWS.map((row) => ({
        id: row.id,
        isApplicant: false,
        isVocational: false,
      }))
    );
    setSelectedDecileId(null);
    setRowWeights(() => {
      const initial: { [id: number]: number } = {};
      TABLE_1_ROWS.forEach((row) => {
        initial[row.id] = row.weightPercentage;
      });
      return initial;
    });
  };

  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 md:p-6 font-sans antialiased text-slate-100" id="welcome-screen" dir="rtl">
        {/* Decorative Top Accent Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 z-50" />
        
        {/* Modern Glassmorphic Dashboard Card */}
        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center text-center space-y-8 animate-fade-in">
          {/* Subtle Ambient Glowing Backgrounds */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl selector-ambient-glow" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl selector-ambient-glow" />

          {/* Institution Primary Branding Emblem - Clean White Circle */}
          <div className="relative z-10 bg-white rounded-full p-4 shadow-xl border border-white/20" id="logo-branding-badge">
            <img 
              src="/logo.png"
              alt="سازمان آموزش فنی و حرفه‌ای کشور"
              className="w-16 h-16 object-contain select-none" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Heading typographic hierarchy */}
          <div className="space-y-4 relative z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 leading-relaxed" id="welcome-headline">
              سامانه هوشمند برآورد هزینه و صدور قرارداد آموزشی
            </h1>
            <h2 className="text-sm sm:text-base font-semibold text-slate-400 tracking-wide" id="welcome-subtitle">
              دستیار مالی و حقوقی مراکز آموزش فنی و حرفه‌ای
            </h2>
          </div>

          {/* Action Section: Centered CTA Proceed Button */}
          <div className="w-full relative z-10 pt-2">
            <button
              type="button"
              onClick={() => setHasEntered(true)}
              className="w-full py-4 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              id="btn-welcome-enter"
            >
              ورود به سامانه
            </button>
          </div>

          {/* Strictly Aligned Footer Section with Pipe Separators */}
          <div className="w-full border-t border-white/10 pt-6 mt-4 text-[11px] sm:text-xs text-slate-400 leading-relaxed space-y-2 relative z-10" id="welcome-footer">
            <p className="font-medium">
              محصول کارگاه هوش مصنوعی مرکز آموزش فنی و حرفه‌ای آزادشهر
            </p>
            <p className="font-medium text-slate-200">
              طراح و توسعه‌دهنده: محمد عطایی محمدی
            </p>
            <p className="font-medium text-slate-300 flex items-center justify-center gap-1.5" dir="ltr">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>09112790490</span>
            </p>
            <p className="font-semibold text-slate-450">
              منطبق با آخرین ضوابط و تعرفه‌های مصوب سال ۱۴۰۵
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans antialiased" id="main-applet" dir="rtl">
      {/* Decorative Top Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 z-50 print:hidden" />

      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        
        {/* Upper Header Brand Layout */}
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex justify-between items-center shadow-md border border-slate-750/30" id="applet-header">
          <div>
            <h1 className="text-lg md:text-xl font-extrabold leading-normal text-white">
              محاسبه‌گر هزینه دوره‌های فنی و حرفه‌ای
            </h1>
            <span className="text-xs text-slate-300 mt-1 block font-semibold">بر اساس آخرین تغییرات سال ۱۴۰۵</span>
          </div>
          {/* TVTO Emblem Logo on the Left */}
          <div className="flex items-center gap-3 select-none" id="tvto-header-logo-container">
            <img 
              src="/logo.png"
              alt="سازمان آموزش فنی و حرفه‌ای کشور"
              className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl shadow-md border border-slate-700/10 object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {/* Master Driver Body Grid */}
        <main className="space-y-6" id="calculator-application-stages">
          
          {/* Top section with equal-height columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch print:flex print:flex-col print:gap-6">
            {/* Column 1: Configs / Controls */}
            <div className="lg:col-span-4 flex flex-col print:w-full">
              <Step1Inputs
                selectedClusterId={selectedClusterId}
                setSelectedClusterId={setSelectedClusterId}
                standardHours={standardHours}
                setStandardHours={setStandardHours}
                dailyHours={dailyHours}
                setDailyHours={setDailyHours}
                selectedDecileId={selectedDecileId}
                setSelectedDecileId={setSelectedDecileId}
              />
            </div>

            {/* Column 2: Big detail tables */}
            <div className="lg:col-span-8 flex flex-col print:w-full">
              <Table1Section
                baseClusterTariff={baseClusterTariff}
                totalDays={totalDays}
                rowStates={table1RowStates}
                setRowStates={setTable1RowStates}
                rowWeights={rowWeights}
                setRowWeights={setRowWeights}
                totalWeightSum={totalWeightSum}
                hasWeightError={hasWeightError}
                weightErrorAmount={weightErrorAmount}
              />
            </div>
          </div>

          {/* Bottom section with Summary billing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12">
              <SummarySection
                selectedClusterName={currentCluster ? currentCluster.name : 'انتخاب نشده'}
                selectedDecileName={currentDecile ? currentDecile.name : 'انتخاب نشده'}
                standardHours={standardHours}
                dailyHours={dailyHours}
                totalDays={totalDays}
                sumOfRowCosts={sumOfRowCosts}
                dailyTableCost={dailyTableCost}
                totalTieredCost={totalTieredCost}
                registrationExamCost={registrationExamCost}
                certificateIssuanceCost={certificateIssuanceCost}
                grandTotal={grandTotal}
                onReset={handleReset}
                calculatedTable1Rows={calculatedTable1Rows}
                baseClusterTariff={baseClusterTariff}
              />
            </div>
          </div>

        </main>

        {/* Outer Global Disclaimer Card */}
        <footer className="text-center text-slate-400 text-xs mt-8 border-t border-slate-200 pt-6 print:hidden" id="applet-footer-acknowledgements">
          <p>
            توسعه‌یافته مطابق آخرین ضوابط و کدهای مالی آموزش عالی و فنی حرفه‌ای برای محاسبات خودکار شعب تابعه تئوری و کارگاهی.
          </p>
          <p className="font-mono text-slate-400/80 text-[10px] mt-1">
            &copy; ۲۰۲۶ تمامی حقوق محاسباتی مادی و معنوی محفوظ است.
          </p>
        </footer>

      </div>
    </div>
  );
}
