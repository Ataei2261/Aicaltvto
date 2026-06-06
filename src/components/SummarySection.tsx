/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { formatRial, toPersianDigits, formatDecimal, formatToFarsi, formatDateForWord } from '../utils/numberUtils';
import { FileText, ShieldCheck, CheckCircle, Info, Loader2, X, FileSignature, AlertCircle, Trash2 } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface SummarySectionProps {
  selectedClusterName: string;
  selectedDecileName: string;
  standardHours: number;
  dailyHours: number;
  totalDays: number;
  sumOfRowCosts: number;
  dailyTableCost: number;
  totalTieredCost: number;
  registrationExamCost: number;
  certificateIssuanceCost: number;
  grandTotal: number;
  onReset: () => void;
  calculatedTable1Rows: any[];
  baseClusterTariff: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  selectedClusterName,
  selectedDecileName,
  standardHours,
  dailyHours,
  totalDays,
  sumOfRowCosts,
  dailyTableCost,
  totalTieredCost,
  registrationExamCost,
  certificateIssuanceCost,
  grandTotal,
  onReset,
  calculatedTable1Rows,
  baseClusterTariff,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states matching user request exactly
  const [contractForm, setContractForm] = useState({
    mojri_name: '',
    mojri_rep: '',
    mojri_title: '',
    mojri_address: '',
    mojri_phone: '',
    center_name: '',
    level: '',
    boss_name: '',
    course_count: '۱',
    course_name: '',
    standard_code: '',
    target_audience: '',
    start_date: '',
    end_date: '',
    teacher_name: '',
    week_days: '',
    student_count: '',
    studentCountDahak: '0',
    daily_hours: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Decoupled tiered cost calculation helpers
  const toEnglishDigitsComponent = (str: string): string => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /٨/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let res = (str || '').replace(/٫/g, '.');
    for (let i = 0; i < 10; i++) {
      res = res.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return res;
  };

  const getDahakMultiplier = (hours: number): number => {
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

  let componentBaseHourlyCost = 0;
  if (selectedClusterName.includes("صنعت و کشاورزی")) {
    componentBaseHourlyCost = 145000;
  } else if (selectedClusterName.includes("خدمات")) {
    componentBaseHourlyCost = 120000;
  } else if (selectedClusterName.includes("فرهنگ و هنر")) {
    componentBaseHourlyCost = 93750;
  }

  const liveDahakCount = Number(toEnglishDigitsComponent(contractForm.studentCountDahak)) || 0;
  const liveTieredCostPerPerson = liveDahakCount > 0 ? (componentBaseHourlyCost * getDahakMultiplier(standardHours)) : 0;
  const liveTotalTieredCost = liveTieredCostPerPerson * liveDahakCount;

  const handleGenerateDocx = async () => {
    // Validate critical fields
    const requiredFields = [
      'center_name',
      'mojri_name',
      'course_name',
      'student_count',
      'start_date',
      'end_date'
    ];

    const newErrors: Record<string, boolean> = {};
    let isValid = true;
    requiredFields.forEach((field) => {
      if (!contractForm[field as keyof typeof contractForm]?.trim()) {
        newErrors[field] = true;
        isValid = false;
      }
    });

    if (!isValid) {
      setValidationErrors(newErrors);
      setErrorMsg('لطفاً فیلدهای ستاره‌دار الزامی را تکمیل نمایید.');
      return;
    }

    setValidationErrors({});
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/template.docx');
      if (!response.ok) {
        throw new Error('فایل قالب قرارداد (template.docx) پیدا نشد. لطفا مطمئن شوید این فایل در پوشه public قرار دارد.');
      }
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Simple to-English conversion for parsing numeric variables
      const toEnglishDigits = (str: string): string => {
        const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
        let res = str.replace(/٫/g, '.');
        for (let i = 0; i < 10; i++) {
          res = res.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
        }
        return res;
      };

      const parsedStudentCount = Math.max(1, parseInt(toEnglishDigits(contractForm.student_count)) || 15);

      // Math configurations based on calculations + student count
      const baseTariffVal = baseClusterTariff;
      const costPerPersonDay = dailyTableCost;
      
      // 1. Set fixed base fees
      const regFeePerPerson = 300000;
      const consultFeePerPerson = 300000;

      // 2. Calculate Exam Fee based on the selected cluster
      let examFeePerPerson = 0;
      if (selectedClusterName.includes("صنعت و کشاورزی")) {
        examFeePerPerson = 2000000;
      } else if (selectedClusterName.includes("خدمات")) {
        examFeePerPerson = 1300000;
      } else if (selectedClusterName.includes("فرهنگ و هنر")) {
        examFeePerPerson = 2000000;
      }

      // 3. Compute course-related values based on input and calculations
      const totalCourseAmount = Number(sumOfRowCosts) * Number(totalDays) * Number(parsedStudentCount);

      // 4. Multiply individual fees by student count for double check mapping
      const count = Number(toEnglishDigits(contractForm.student_count)) || 0;
      const regFeePerPerson2 = regFeePerPerson * count;
      const consultFeePerPerson2 = consultFeePerPerson * count;
      const totalExamFee = examFeePerPerson * count;

      // 5. Calculate total tiered cost if decile-based increase exists (decoupled from initial decile state!)
      const tieredIncrease = liveTieredCostPerPerson;
      const countDahak = liveDahakCount;
      const totalTieredCostValue = liveTotalTieredCost;

      // 6. Complete the strict contract grand total calculation
      const contractTotalAmount = 
        Number(totalCourseAmount) + 
        Number(regFeePerPerson2) + 
        Number(consultFeePerPerson2) + 
        Number(totalExamFee) + 
        Number(totalTieredCostValue);

      // 7. Standard supporting fees
      const totalRegConsultPerPerson = regFeePerPerson + consultFeePerPerson;
      const totalRegConsultAll = totalRegConsultPerPerson * parsedStudentCount;
      const totalCertFee = certificateIssuanceCost * parsedStudentCount;

      let levelOutput = "";
      if (contractForm.level && contractForm.level.trim() !== "") {
        levelOutput = `مرحله ${contractForm.level}`;
      }

      const docData: Record<string, any> = {
        // Form textual strings
        mojri_name: contractForm.mojri_name,
        center_name: contractForm.center_name,
        khoshe: selectedClusterName,
        level: levelOutput !== "" ? formatToFarsi(levelOutput) : "",
        boss_name: contractForm.boss_name,
        mojri_rep: contractForm.mojri_rep,
        mojri_title: contractForm.mojri_title,
        mojri_address: contractForm.mojri_address,
        mojri_phone: contractForm.mojri_phone,
        course_count: toPersianDigits(contractForm.course_count),
        course_name: contractForm.course_name,
        standard_code: toPersianDigits(contractForm.standard_code),
        target_audience: contractForm.target_audience,
        funding_source: "-",
        payer_type: "-",
        exam_field: "-",
        daily_hours: contractForm.daily_hours,
        start_date: toPersianDigits(formatDateForWord(contractForm.start_date)),
        end_date: toPersianDigits(formatDateForWord(contractForm.end_date)),
        teacher_name: contractForm.teacher_name,
        week_days: contractForm.week_days,
        
        // Calculated details
        standard_hours: formatToFarsi(standardHours),
        student_count: formatToFarsi(parsedStudentCount),
        total_person_hours: formatToFarsi(standardHours * parsedStudentCount),
        grand_total: formatToFarsi(grandTotal * parsedStudentCount),
        reg_fee_per_person: formatToFarsi(regFeePerPerson),
        consult_fee_per_person: formatToFarsi(consultFeePerPerson),
        reg_fee_per_person2: formatToFarsi(regFeePerPerson2),
        consult_fee_per_person2: formatToFarsi(consultFeePerPerson2),
        total_reg_consult_per_person: formatToFarsi(totalRegConsultPerPerson),
        total_reg_consult_all: formatToFarsi(totalRegConsultAll),
        tiered_cost_per_person: formatToFarsi(tieredIncrease),
        "student_count-dahak": formatToFarsi(countDahak),
        total_tiered_cost: formatToFarsi(totalTieredCostValue),
        exam_fee_per_person: formatToFarsi(examFeePerPerson),
        total_exam_fee: formatToFarsi(totalExamFee),
        total_cert_fee: formatToFarsi(totalCertFee),
        total_days: formatToFarsi(totalDays),
        cost_per_person_day: formatToFarsi(costPerPersonDay),
        total_course_amount: formatToFarsi(totalCourseAmount),
        contract_total_amount: formatToFarsi(contractTotalAmount),
        
        cluster_header: "تعرفه‌های مصوب در خوشه انتخابی به ازای هر نفر - روز",
        base_tariff: formatToFarsi(baseTariffVal),
        table1_total: formatToFarsi(sumOfRowCosts),
        table2_total: formatToFarsi(grandTotal),
      };

      calculatedTable1Rows.forEach((row, index) => {
        docData[`req_${index + 1}`] = row.isApplicant ? "☑" : "-";
        docData[`voc_${index + 1}`] = row.isVocational ? "☑" : "-";
        docData[`w_${index + 1}`] = formatToFarsi(row.weightPercentage);
        docData[`row${index + 1}_cost`] = formatToFarsi(row.rowCost || 0);
      });

      doc.render(docData);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      
      const center = contractForm.center_name?.trim() || "";
      const mojri = contractForm.mojri_name?.trim() || "";
      const course = contractForm.course_name?.trim() || "";

      // Combine available parts with a dash
      const rawFileName = [center, mojri, course].filter(Boolean).join(" - ");

      // Sanitize illegal characters for Windows filenames
      let safeFileName = rawFileName.replace(/[\/\\?%*:|"<>]/g, '-').trim();

      // Apply Fallback if empty
      if (!safeFileName) {
        safeFileName = "قرارداد آموزشی";
      }

      const finalFileName = `${safeFileName}.docx`;
      saveAs(out, finalFileName);
      setIsModalOpen(false); // successfully built & closes modal
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'خطایی در تولید سند رخ داده است.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: keyof typeof contractForm, value: string) => {
    let cleanValue = value;
    if (field === 'student_count' || field === 'course_count') {
      // First convert Persian/Arabic digits to English digits
      cleanValue = toEnglishDigitsComponent(value);
      // Strip anything that is not a digit
      cleanValue = cleanValue.replace(/\D/g, '');
      
      // Enforce positive minimum bound (cannot be zero or negative)
      // Accept empty input temporarily so user can erase to type again, but if they enter "0" make it "1" or strip leading zeros.
      if (cleanValue.startsWith('0')) {
        cleanValue = cleanValue.replace(/^0+/, '');
        if (cleanValue === '') {
          cleanValue = '1';
        }
      }
    } else if (field === 'studentCountDahak') {
      // For dahak count, we allow '0' but still only digits are allowed.
      cleanValue = toEnglishDigitsComponent(value);
      cleanValue = cleanValue.replace(/\D/g, '');
      // Strip leading zeros unless it's just '0'
      if (cleanValue.length > 1 && cleanValue.startsWith('0')) {
        cleanValue = cleanValue.replace(/^0+/, '');
        if (cleanValue === '') {
          cleanValue = '0';
        }
      }
    }

    setContractForm(prev => ({ ...prev, [field]: cleanValue }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none" id="summary-section-container">
      {/* Accent line & Title */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800" id="summary-title">هزینه نهایی اجرای دوره برای هر نفر</h2>
          <p className="text-slate-400 text-xs mt-0.5">تفکیک پرداخت و مبالغ نهایی مصوب کل دوره.</p>
        </div>
        <div className="flex gap-2 items-center print:hidden">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileSignature className="w-3.5 h-3.5 animate-pulse" />
            صدور قرارداد
          </button>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            پاک کردن همه مقادیر
          </button>
        </div>
      </div>

      {errorMsg && !isModalOpen && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile info pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">خوشه انتخابی:</span>
          <span className="font-extrabold text-slate-800 text-[13px]">{selectedClusterName}</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">شاخص دهک:</span>
          <span className="font-extrabold text-slate-800 text-[13px]">{selectedDecileName}</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">ساعت استاندارد آموزش:</span>
          <span className="font-black text-slate-900 text-[13px]">{toPersianDigits(standardHours)} ساعت</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">تعداد روز برگزاری دوره:</span>
          <span className="font-black text-slate-900 text-[13px]">
            {dailyHours > 0 && standardHours > 0 ? `${toPersianDigits(totalDays)} روز` : '۰ روز'}
          </span>
        </div>
      </div>

      {/* Piecewise Itemized Costing */}
      <div className="space-y-3 text-[13px] sm:text-[14px]">
        {/* Item 1: Workshop cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۱. مبلغ کل هزینه طول دوره ( حاصلضرب هزینه یک نفر روز در تعداد روز ):</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(dailyTableCost)}</span>
        </div>

        {/* Item 2: Tiered cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۲. هزینه حق الزحمه ارائه خدمات آموزشی ( براساس دهک بندی متقاضی):</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(totalTieredCost)}</span>
        </div>

        {/* Item 3: Reg Cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۳. هزینه ثبت نام /مشاوره/ ورود به آزمون:</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(registrationExamCost)}</span>
        </div>

        {/* Item 4: Issuance Cost */}
        <div className="flex justify-between items-center py-2 text-slate-700">
          <span className="font-extrabold">۴. هزینه صدور گواهینامه:</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(certificateIssuanceCost)}</span>
        </div>
      </div>

      {/* Grand Total Highlight Badge */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl space-y-1 text-center relative overflow-hidden shadow-sm">
        <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-wider">هزینه کل محاسبه شده برای هر نفر:</span>
        <span className="text-2xl font-black font-sans tracking-tight block" id="grand-total-display">
          {formatRial(grandTotal)}
        </span>
        <span className="text-[9px] text-emerald-400 block">تایید شده بر مبنای نرخ‌نامه‌های ابلاغی ۱۴۰۵</span>
      </div>

      {/* Secondary Information */}
      <div className="text-[10px] pt-1.5 print:hidden">
        <span className="text-slate-450 leading-relaxed block">
          امکان ویرایش زنده مقادیر در بالا وجود دارد. 
          <span className="text-blue-600 font-bold mr-1 inline">
            (در صورت عدم باز شدن صفحه چاپ به دلیل مسائل امنیتی مرورگر، لطفا از کلیدهای میانبر <span dir="ltr">Ctrl+P</span> استفاده کنید یا برنامه را در تب جدید باز نمایید.)
          </span>
        </span>
      </div>

      {/* Contract Generation Data-Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">اطلاعات تکمیلی جهت صدور قرارداد</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error messaging inside Modal */}
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-bold">{errorMsg}</span>
              </div>
            )}

            {/* Modal Scrollable Content / Form */}
            <div className="space-y-6 overflow-y-auto pr-1 pl-1 flex-1 pb-4">
              
              {/* Section A: اطلاعات مجری و مرکز */}
              <div className="space-y-4">
                <div className="border-r-4 border-blue-600 pr-3">
                  <h3 className="text-sm font-extrabold text-slate-800">الف. اطلاعات مجری و مرکز</h3>
                  <p className="text-[10px] text-slate-400">اطلاعات حقوقی مربوط به مدیریت و کارگاه آموزشگاه</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      نام مرکز فنی و حرفه‌ای <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractForm.center_name}
                      onChange={(e) => handleInputChange('center_name', e.target.value)}
                      placeholder="مثال: برادران گرگان"
                      className={`w-full p-2.5 bg-slate-50 border ${validationErrors.center_name ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">مرحله (اختیاری)</label>
                    <select
                      value={contractForm.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                    >
                      <option value="">انتخاب کنید...</option>
                      <option value="1">۱</option>
                      <option value="2">۲</option>
                      <option value="3">۳</option>
                      <option value="4">۴</option>
                      <option value="5">۵</option>
                      <option value="6">۶</option>
                      <option value="7">۷</option>
                      <option value="8">۸</option>
                      <option value="9">۹</option>
                      <option value="10">۱۰</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">نام کامل رئیس مرکز</label>
                    <input
                      type="text"
                      value={contractForm.boss_name}
                      onChange={(e) => handleInputChange('boss_name', e.target.value)}
                      placeholder="مثال: علیرضا حسینی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      نام مجری / آموزشگاه <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractForm.mojri_name}
                      onChange={(e) => handleInputChange('mojri_name', e.target.value)}
                      placeholder="مثال: شرکت آموزشی مبتکران"
                      className={`w-full p-2.5 bg-slate-50 border ${validationErrors.mojri_name ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">نماینده مجری</label>
                    <input
                      type="text"
                      value={contractForm.mojri_rep}
                      onChange={(e) => handleInputChange('mojri_rep', e.target.value)}
                      placeholder="مثال: علی علوی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">سمت نماینده</label>
                    <input
                      type="text"
                      value={contractForm.mojri_title}
                      onChange={(e) => handleInputChange('mojri_title', e.target.value)}
                      placeholder="مثال: مدیرعامل / نماینده قانونی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">تلفن مجری</label>
                    <input
                      type="text"
                      value={contractForm.mojri_phone}
                      onChange={(e) => handleInputChange('mojri_phone', e.target.value)}
                      placeholder="مثال: 01732222222"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                    <label className="text-xs font-bold text-slate-600">آدرس دقیق مجری</label>
                    <input
                      type="text"
                      value={contractForm.mojri_address}
                      onChange={(e) => handleInputChange('mojri_address', e.target.value)}
                      placeholder="مثال: استان گلستان، گرگان، خیابان ولیعصر، نبش عدالت دهم"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: مشخصات دوره */}
              <div className="space-y-4">
                <div className="border-r-4 border-emerald-500 pr-3">
                  <h3 className="text-sm font-extrabold text-slate-800">ب. مشخصات دوره آموزشی</h3>
                  <p className="text-[10px] text-slate-400">شناسه استانداردهای آموزشی، مربی و فراگیران</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      عنوان دوره <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractForm.course_name}
                      onChange={(e) => handleInputChange('course_name', e.target.value)}
                      placeholder="مثال: برنامه‌نویسی پایتون"
                      className={`w-full p-2.5 bg-slate-50 border ${validationErrors.course_name ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">کد استاندارد دوره</label>
                    <input
                      type="text"
                      value={contractForm.standard_code}
                      onChange={(e) => handleInputChange('standard_code', e.target.value)}
                      placeholder="مثال: 2513-56-11"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">تعداد دفعات اجرای دوره</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={contractForm.course_count}
                      onChange={(e) => handleInputChange('course_count', e.target.value)}
                      placeholder="مثال: ۱"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">نام مربی محترم</label>
                    <input
                      type="text"
                      value={contractForm.teacher_name}
                      onChange={(e) => handleInputChange('teacher_name', e.target.value)}
                      placeholder="مثال: مهندس محمد رضایی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">گروه جامعه هدف</label>
                    <input
                      type="text"
                      value={contractForm.target_audience}
                      onChange={(e) => handleInputChange('target_audience', e.target.value)}
                      placeholder="مثال: کارآموزان آزاد / شاغلین صنایع"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      تعداد کارآموزان دوره <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={contractForm.student_count}
                      onChange={(e) => handleInputChange('student_count', e.target.value)}
                      placeholder="مثال: ۱۵"
                      className={`w-full p-2.5 bg-slate-50 border ${validationErrors.student_count ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      تعداد افراد دهک بالای ۵
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={contractForm.studentCountDahak}
                      onChange={(e) => handleInputChange('studentCountDahak', e.target.value)}
                      placeholder="مثال: ۰"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                    {liveDahakCount > 0 && (
                      <div className="text-[10px] text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100 space-y-1 font-medium">
                        <div>هزینه افزایشی هر نفر دهک بالای ۵: <span className="font-extrabold">{formatRial(liveTieredCostPerPerson)}</span></div>
                        <div className="font-extrabold text-[#0284c7]">مجموع خدمات آموزشی دهک بالای ۵: {formatRial(liveTotalTieredCost)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section C: زمانبندی و مالی */}
              <div className="space-y-4">
                <div className="border-r-4 border-amber-500 pr-3">
                  <h3 className="text-sm font-extrabold text-slate-800">ج. زمان‌بندی و سیستم مالی</h3>
                  <p className="text-[10px] text-slate-400">تاریخ‌ها و جزئیات تفاهم‌نامه پرداخت</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      تاریخ شروع دوره <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={contractForm.start_date}
                      onChange={(date: any) => {
                        const formatted = date ? date.format("YYYY/MM/DD") : "";
                        handleInputChange('start_date', formatted);
                      }}
                      calendarPosition="bottom-right"
                      inputClass={`w-full p-2.5 bg-slate-50 border ${validationErrors.start_date ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                      placeholder="انتخاب تاریخ شروع"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      تاریخ پایان دوره <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={contractForm.end_date}
                      onChange={(date: any) => {
                        const formatted = date ? date.format("YYYY/MM/DD") : "";
                        handleInputChange('end_date', formatted);
                      }}
                      calendarPosition="bottom-right"
                      inputClass={`w-full p-2.5 bg-slate-50 border ${validationErrors.end_date ? 'border-red-500 ring-2 ring-red-105' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'} rounded-lg text-xs font-semibold text-slate-800 outline-none transition-all`}
                      placeholder="انتخاب تاریخ پایان"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">ایام برگزاری در هفته</label>
                    <input
                      type="text"
                      value={contractForm.week_days}
                      onChange={(e) => handleInputChange('week_days', e.target.value)}
                      placeholder="مثال: روزهای زوج"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">ساعت برگزاری در روز</label>
                    <input
                      type="text"
                      value={contractForm.daily_hours}
                      onChange={(e) => handleInputChange('daily_hours', e.target.value)}
                      placeholder="مثلاً ۸ تا ۱۰"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Sticky Footer Action Bar */}
            <div className="pt-4 border-t border-slate-100 mt-6 shrink-0 flex flex-col sm:flex-row justify-end items-center gap-3">
              <span className="text-[10px] text-slate-400 ml-auto text-right w-full sm:w-auto">پر کردن فیلدهای ستاره‌دار معرفی شده الزامی است.</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateDocx}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال تولید سند...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>تایید و دانلود قرارداد</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative border border-slate-200 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-800">پاک کردن همه مقادیر</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  با این کار کلیه اطلاعات درج شده قرارداد جاری پاک خواهد شد. آیا مطمئن هستید؟
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-slate-250 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                برگشت
              </button>
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                بله، پاک شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
