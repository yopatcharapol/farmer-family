/**
 * เครื่องมือคำนวณและแปลงหน่วยการเกษตรไทย (Thai Agricultural Units & Financial Engine)
 */

import { CareStage, Transaction, CropCycle } from '../types';

// ข้อมูลอายุเก็บเกี่ยวและค่ามาตรฐานของพืชแต่ละชนิด
export interface CropTypeConfig {
  id: string;
  name: string;
  icon: string;
  daysToHarvest: number;
  durationLabel: string;
  defaultYieldKgPerRai: number;
  defaultPricePerKg: number;
  unitName: string;
  defaultStages: CareStage[];
}

export const CROP_CONFIGS: Record<string, CropTypeConfig> = {
  'ผักกาด': {
    id: 'ผักกาด',
    name: '🥬 ผักกาด / พืชผักระยะสั้น',
    icon: '🥬',
    daysToHarvest: 30, // 1 เดือน (30 วัน)
    durationLabel: '1 เดือน (ประมาณ 30-35 วัน)',
    defaultYieldKgPerRai: 2500,
    defaultPricePerKg: 15.0,
    unitName: 'กก.',
    defaultStages: [
      { id: 's1', day: 3, label: 'เพาะงอก / ต้นกล้าตั้งตัว' },
      { id: 's2', day: 10, label: 'ใส่ปุ๋ยเร่งใบ / พ่นฮอร์โมน' },
      { id: 's3', day: 20, label: 'ตรวจโรคแมลง / ปุ๋ยรอบสอง' },
      { id: 's4', day: 30, label: 'เก็บเกี่ยวผลผลิต' }
    ]
  },
  'ข้าว': {
    id: 'ข้าว',
    name: '🌾 ข้าวนาปี / ข้าวนาปรัง',
    icon: '🌾',
    daysToHarvest: 120, // 4 เดือน
    durationLabel: '4 เดือน (120 วัน)',
    defaultYieldKgPerRai: 500,
    defaultPricePerKg: 14.5,
    unitName: 'ตัน',
    defaultStages: [
      { id: 'r1', day: 15, label: 'ระยะกล้าตั้งตัว (คุมหญ้า/ทดน้ำ)' },
      { id: 'r2', day: 25, label: 'ระยะแตกกอ (ใส่ปุ๋ยแต่งหน้า 1 เร่งต้น)' },
      { id: 'r3', day: 60, label: 'ระยะสร้างรวงอ่อน/ตั้งท้อง (ใส่ปุ๋ยรับรวง)' },
      { id: 'r4', day: 90, label: 'ระยะออกรวง / ก้มรวง' },
      { id: 'r5', day: 120, label: 'วันเก็บเกี่ยวเกี่ยวข้าว' }
    ]
  },
  'ข้าวโพด': {
    id: 'ข้าวโพด',
    name: '🌽 ข้าวโพดเลี้ยงสัตว์',
    icon: '🌽',
    daysToHarvest: 105, // 3.5 เดือน
    durationLabel: '3.5 เดือน (105 วัน)',
    defaultYieldKgPerRai: 1000,
    defaultPricePerKg: 9.5,
    unitName: 'ตัน',
    defaultStages: [
      { id: 'c1', day: 15, label: 'ระยะต้นกล้า 4-5 ใบ' },
      { id: 'c2', day: 25, label: 'ใส่ปุ๋ยแต่งหน้าครั้งที่ 1 (พูนโคน)' },
      { id: 'c3', day: 50, label: 'ระยะแทงช่อดอกตัวผู้/ออกไหม (ปุ๋ยเร่งฝัก)' },
      { id: 'c4', day: 80, label: 'ระยะสร้างเมล็ด / ฝักแก่' },
      { id: 'c5', day: 105, label: 'เก็บเกี่ยวหักข้าวโพด' }
    ]
  },
  'มันสำปะหลัง': {
    id: 'มันสำปะหลัง',
    name: '🥔 มันสำปะหลัง',
    icon: '🥔',
    daysToHarvest: 270, // 9 เดือน
    durationLabel: '9 เดือน (270 วัน)',
    defaultYieldKgPerRai: 4000,
    defaultPricePerKg: 3.2,
    unitName: 'ตัน',
    defaultStages: [
      { id: 'm1', day: 30, label: 'ท่อนพันธุ์แตกตา / กำจัดวัชพืชรอบ 1' },
      { id: 'm2', day: 60, label: 'ใส่ปุ๋ยเร่งต้นและราก' },
      { id: 'm3', day: 120, label: 'ใส่ปุ๋ยระเบิดหัว / สะสมแป้ง' },
      { id: 'm4', day: 270, label: 'ระยะขุดถอนหัวมัน' }
    ]
  },
  'ยางพารา': {
    id: 'ยางพารา',
    name: '🌲 ยางพารา (รอบกรีดเก็บผลผลิต)',
    icon: '🌲',
    daysToHarvest: 240, // 8 เดือน (รอบฤดูกาลเปิดกรีดยางประจำปี)
    durationLabel: 'รอบฤดูเปิดกรีด 8 เดือน (240 วัน)',
    defaultYieldKgPerRai: 300,
    defaultPricePerKg: 65.0,
    unitName: 'กก.',
    defaultStages: [
      { id: 'y1', day: 1, label: 'เปิดกรีดหน้ายางต้นฤดู' },
      { id: 'y2', day: 60, label: 'ใส่ปุ๋ยบำรุงหน้ายางรอบแรก' },
      { id: 'y3', day: 180, label: 'ใส่ปุ๋ยบำรุงต้นรอบปลายฝน' },
      { id: 'y4', day: 240, label: 'พักหน้ายาง / ปิดกรีดผลัดใบ' }
    ]
  }
};

// ฟังก์ชันคำนวณวันเก็บเกี่ยวอัตโนมัติ: วันเริ่มปลูก + จำนวนวัน -> วันที่เก็บเกี่ยว (YYYY-MM-DD)
export function calculateHarvestDate(startDateIso: string, days: number): string {
  if (!startDateIso) return '';
  const d = new Date(startDateIso);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// คำนวณจำนวนวันที่ปลูกมาแล้ว (Crop Age in Days)
export function calculateDaysElapsed(startDateIso: string): number {
  if (!startDateIso) return 0;
  const start = new Date(startDateIso);
  const now = new Date();
  // เคลียร์เวลาให้ตรงกันเที่ยงคืน
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// 1. การแปลงหน่วยพื้นที่ไทย
// 1 ไร่ = 4 งาน = 400 ตารางวา = 1,600 ตารางเมตร
export function calculateTotalRai(rai: number = 0, ngan: number = 0, sqWa: number = 0): number {
  const total = (Number(rai) || 0) + ((Number(ngan) || 0) / 4) + ((Number(sqWa) || 0) / 400);
  return Number(total.toFixed(2));
}

export function formatAreaThai(rai: number = 0, ngan: number = 0, sqWa: number = 0): string {
  const parts: string[] = [];
  if (rai > 0) parts.push(`${rai} ไร่`);
  if (ngan > 0) parts.push(`${ngan} งาน`);
  if (sqWa > 0) parts.push(`${sqWa} ตร.ว.`);
  return parts.length > 0 ? parts.join(' ') : '0 ไร่';
}

// 2. การแปลงหน่วยชั่งตวงผลผลิตไทย (เน้นข้าวเปลือก/พืชไร่)
// 1 เกวียน = 100 ถัง = 1,000 กก. (1 ตัน)
export const UNIT_CONVERSIONS = {
  kwianToKg: (kwian: number) => kwian * 1000,
  tonToKg: (ton: number) => ton * 1000,
  thangToKg: (thang: number, kgPerThang: number = 10) => thang * kgPerThang,
  kgToTon: (kg: number) => Number((kg / 1000).toFixed(2)),
  kgToKwian: (kg: number) => Number((kg / 1000).toFixed(2)),
  kgToThang: (kg: number, kgPerThang: number = 10) => Number((kg / kgPerThang).toFixed(1)),
};

// 3. การคำนวณทางการเงินและการเกษตร
export function calculateBreakEvenPrice(totalCost: number, expectedYieldKg: number): number {
  if (!expectedYieldKg || expectedYieldKg <= 0) return 0;
  return Number((totalCost / expectedYieldKg).toFixed(2));
}

export function calculateCostPerRai(totalCost: number, totalRai: number): number {
  if (!totalRai || totalRai <= 0) return 0;
  return Number((totalCost / totalRai).toFixed(0));
}

export function calculateProfit(totalIncome: number, totalCost: number): number {
  return totalIncome - totalCost;
}

// 4. การแสดงผลวันที่และตัวเลขสำหรับคุณพ่อคุณแม่
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatNumber(val: number, decimals: number = 1): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(val || 0);
}

export function formatDateThai(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  return `${day} ${month} ${year}`;
}

export function formatDateSlashThai(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==========================================
// 5. เครื่องคิดเลขความชื้นและสิ่งเจือปน (Moisture & Impurity Deduction)
// ==========================================
export interface MoistureCalcInput {
  grossWeightKg: number;        // น้ำหนักชั่งรวม (กก.)
  measuredMoisture: number;      // ความชื้นที่วัดได้ (%)
  standardMoisture: number;      // ความชื้นมาตรฐาน (เช่น 15% ข้าว, 14.5% ข้าวโพด)
  deductionRatePercent: number;  // อัตราหักน้ำหนักต่อ 1% ความชื้นเกิน (เช่น 1.5% ต่อ 1% เกิน)
  impurityPercent: number;       // สิ่งเจือปน (%)
  pricePerUnit: number;          // ราคาต่อหน่วย (บาท)
  priceUnit: 'kg' | 'ton';       // บาทต่อ กก. หรือ บาทต่อ ตัน
}

export interface MoistureCalcResult {
  moistureExcess: number;           // ความชื้นส่วนเกิน (%)
  moistureDeductionWeightKg: number; // น้ำหนักที่ถูกหักจากความชื้น (กก.)
  impurityDeductionWeightKg: number; // น้ำหนักที่ถูกหักจากสิ่งเจือปน (กก.)
  totalDeductionWeightKg: number;    // น้ำหนักหักรวม (กก.)
  netWeightKg: number;              // น้ำหนักสุทธิหลังหัก (กก.)
  netWeightTon: number;             // น้ำหนักสุทธิ (ตัน)
  pricePerKg: number;               // ราคาต่อ กก.
  totalAmount: number;              // จำนวนเงินสุทธิที่ได้จริง (บาท)
}

export function calculateMoistureDeduction(input: MoistureCalcInput): MoistureCalcResult {
  const gross = Math.max(0, Number(input.grossWeightKg) || 0);
  const measured = Math.max(0, Number(input.measuredMoisture) || 0);
  const standard = Math.max(0, Number(input.standardMoisture) || 15);
  const rate = Math.max(0, Number(input.deductionRatePercent) || 1.5);
  const impurity = Math.max(0, Number(input.impurityPercent) || 0);

  // ความชื้นเกินมาตรฐาน
  const moistureExcess = Math.max(0, measured - standard);
  // เปอร์เซ็นต์หักความชื้น
  const moistureDeductPct = moistureExcess * rate;
  const moistureDeductionWeightKg = Math.round((gross * moistureDeductPct) / 100);

  // หักสิ่งเจือปน
  const impurityDeductionWeightKg = Math.round((gross * impurity) / 100);

  const totalDeductionWeightKg = moistureDeductionWeightKg + impurityDeductionWeightKg;
  const netWeightKg = Math.max(0, gross - totalDeductionWeightKg);
  const netWeightTon = Number((netWeightKg / 1000).toFixed(3));

  const pricePerKg = input.priceUnit === 'ton'
    ? (Number(input.pricePerUnit) || 0) / 1000
    : Number(input.pricePerUnit) || 0;

  const totalAmount = Math.round(netWeightKg * pricePerKg);

  return {
    moistureExcess: Number(moistureExcess.toFixed(1)),
    moistureDeductionWeightKg,
    impurityDeductionWeightKg,
    totalDeductionWeightKg,
    netWeightKg,
    netWeightTon,
    pricePerKg: Number(pricePerKg.toFixed(2)),
    totalAmount
  };
}

// ==========================================
// 6. เครื่องคิดเลขขายยางพารา (% DRC & ส่วนแบ่งคนกรีด)
// ==========================================
export interface RubberCalcInput {
  freshLatexKg: number;       // น้ำหนักน้ำยางสด (กก.)
  drcPercent: number;         // เนื้อยางแห้ง % DRC (เช่น 32%)
  pricePerKgDry: number;      // ราคาประมูลยางแห้ง (บาท/กก.)
  ownerSharePercent: number;  // สัดส่วนเจ้าของสวน (%) เช่น 60
}

export interface RubberCalcResult {
  dryRubberKg: number;        // น้ำหนักเนื้อยางแห้ง (กก.)
  totalRevenue: number;       // เงินรวมทั้งหมด (บาท)
  ownerShare: number;         // เงินส่วนเจ้าของสวน (บาท)
  tapperShare: number;        // เงินส่วนคนกรีด (บาท)
  tapperPercent: number;      // สัดส่วนคนกรีด (%)
}

export function calculateRubberYield(input: RubberCalcInput): RubberCalcResult {
  const fresh = Math.max(0, Number(input.freshLatexKg) || 0);
  const drc = Math.max(0, Number(input.drcPercent) || 0);
  const price = Math.max(0, Number(input.pricePerKgDry) || 0);
  const ownerPct = Math.min(100, Math.max(0, Number(input.ownerSharePercent) || 60));
  const tapperPct = 100 - ownerPct;

  // เนื้อยางแห้ง (กก.) = น้ำยางสด x (% DRC / 100)
  const dryRubberKg = Number(((fresh * drc) / 100).toFixed(2));
  const totalRevenue = Math.round(dryRubberKg * price);
  const ownerShare = Math.round((totalRevenue * ownerPct) / 100);
  const tapperShare = totalRevenue - ownerShare;

  return {
    dryRubberKg,
    totalRevenue,
    ownerShare,
    tapperShare,
    tapperPercent: tapperPct
  };
}

// ==========================================
// 7. เครื่องคิดเลขผสมปุ๋ยสั่งตัดลดต้นทุน (N-P-K Fertilizer Mixing)
// ==========================================
// แม่ปุ๋ยมาตรฐาน:
// Urea: 46-0-0 (N=46%)
// DAP: 18-46-0 (N=18%, P=46%)
// MOP: 0-0-60 (K=60%)
export interface FertilizerMixInput {
  targetN: number;            // N สูตรเป้าหมาย เช่น 16
  targetP: number;            // P สูตรเป้าหมาย เช่น 16
  targetK: number;            // K สูตรเป้าหมาย เช่น 8
  batchWeightKg: number;      // น้ำหนักรวมที่ต้องการผสม เช่น 100 กก. (2 กระสอบ)
  ureaPricePer50Kg: number;   // ราคา 46-0-0 (บาท/กระสอบ 50 กก.)
  dapPricePer50Kg: number;    // ราคา 18-46-0 (บาท/กระสอบ 50 กก.)
  mopPricePer50Kg: number;    // ราคา 0-0-60 (บาท/กระสอบ 50 กก.)
  readyMadePricePer50Kg?: number; // ราคาปุ๋ยสำเร็จรูปในท้องตลาด (บาท/50 กก.)
}

export interface FertilizerMixResult {
  ureaKg: number;             // น้ำหนักแม่ปุ๋ย 46-0-0 ที่ต้องใช้ (กก.)
  dapKg: number;              // น้ำหนักแม่ปุ๋ย 18-46-0 ที่ต้องใช้ (กก.)
  mopKg: number;              // น้ำหนักแม่ปุ๋ย 0-0-60 ที่ต้องใช้ (กก.)
  fillerKg: number;           // สารตัวเติม / ดินหรือแกลบดำ (กก.)
  totalRawKg: number;         // รวมน้ำหนักแม่ปุ๋ย (กก.)
  totalCost: number;          // ต้นทุนรวมที่ผสมเอง (บาท)
  costPer50Kg: number;        // ต้นทุนเฉลี่ยต่อ 1 กระสอบ 50 กก. (บาท)
  savingsVsReadyMade: number; // ประหยัดได้กี่บาทต่อชุด
  isPossible: boolean;        // สูตรนี้ผสมได้จริงหรือไม่ (ไม่เกิน 100%)
  errorMessage?: string;
}

export function calculateFertilizerMix(input: FertilizerMixInput): FertilizerMixResult {
  const batch = Math.max(1, Number(input.batchWeightKg) || 100);
  const nReqKg = (Number(input.targetN) / 100) * batch;
  const pReqKg = (Number(input.targetP) / 100) * batch;
  const kReqKg = (Number(input.targetK) / 100) * batch;

  // 1. หา DAP (18-46-0) จากความต้องการ P
  const dapKg = Number((pReqKg / 0.46).toFixed(1));
  // ไนโตรเจนที่ได้แถมมาจาก DAP
  const nFromDap = dapKg * 0.18;

  // 2. หา ยูเรีย (46-0-0) จากไนโตรเจนส่วนที่ยังขาด
  const nRemaining = Math.max(0, nReqKg - nFromDap);
  const ureaKg = Number((nRemaining / 0.46).toFixed(1));

  // 3. หา MOP (0-0-60) จากความต้องการ K
  const mopKg = Number((kReqKg / 0.60).toFixed(1));

  const totalRawKg = Number((ureaKg + dapKg + mopKg).toFixed(1));
  const fillerKg = Number(Math.max(0, batch - totalRawKg).toFixed(1));

  const isPossible = totalRawKg <= batch;

  // ราคาต่อ กก. ของแม่ปุ๋ยแต่ละชนิด
  const ureaPerKg = (Number(input.ureaPricePer50Kg) || 850) / 50;
  const dapPerKg = (Number(input.dapPricePer50Kg) || 1400) / 50;
  const mopPerKg = (Number(input.mopPricePer50Kg) || 900) / 50;

  const totalCost = Math.round(
    (ureaKg * ureaPerKg) + (dapKg * dapPerKg) + (mopKg * mopPerKg)
  );

  const costPer50Kg = Math.round((totalCost / batch) * 50);
  const readyMadePrice = Number(input.readyMadePricePer50Kg) || 1350;
  const readyMadeTotal = (readyMadePrice / 50) * batch;
  const savingsVsReadyMade = Math.max(0, Math.round(readyMadeTotal - totalCost));

  return {
    ureaKg,
    dapKg,
    mopKg,
    fillerKg,
    totalRawKg,
    totalCost,
    costPer50Kg,
    savingsVsReadyMade,
    isPossible,
    errorMessage: isPossible ? undefined : 'สัดส่วนธาตุอาหารสูงเกินไป แม่ปุ๋ยรวมเกินน้ำหนักที่ต้องการ'
  };
}

// ==========================================
// 8. การกระจายบิลรายจ่ายเดียวเข้าหลายแปลง (Split Bill Across Plots)
// ==========================================
export interface SplitPlotAllocation {
  plotId: string;
  plotName: string;
  areaRai: number;
  allocatedAmount: number;
}

export function calculateSplitExpense(
  totalAmount: number,
  plots: Array<{ id: string; name: string; totalAreaRai: number }>,
  splitMethod: 'byArea' | 'equal'
): SplitPlotAllocation[] {
  if (!plots || plots.length === 0) return [];

  const total = Math.max(0, Number(totalAmount) || 0);

  if (splitMethod === 'equal') {
    const perPlot = Math.floor(total / plots.length);
    const remainder = total - (perPlot * plots.length);
    return plots.map((p, idx) => ({
      plotId: p.id,
      plotName: p.name,
      areaRai: p.totalAreaRai,
      allocatedAmount: idx === 0 ? perPlot + remainder : perPlot
    }));
  }

  // หารตามสัดส่วนไร่
  const totalRai = plots.reduce((sum, p) => sum + (Number(p.totalAreaRai) || 0), 0);
  if (totalRai <= 0) {
    return calculateSplitExpense(total, plots, 'equal');
  }

  let accumulated = 0;
  const result: SplitPlotAllocation[] = [];

  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (i === plots.length - 1) {
      // แปลงสุดท้ายเก็บเศษปัดสตางค์
      result.push({
        plotId: p.id,
        plotName: p.name,
        areaRai: p.totalAreaRai,
        allocatedAmount: Math.max(0, total - accumulated)
      });
    } else {
      const share = Math.round((p.totalAreaRai / totalRai) * total);
      accumulated += share;
      result.push({
        plotId: p.id,
        plotName: p.name,
        areaRai: p.totalAreaRai,
        allocatedAmount: share
      });
    }
  }

  return result;
}

// ==========================================
// 9. ตัวจัดข้อความสรุปบัญชีฟาร์มส่งเข้า LINE ครอบครัว
// ==========================================
export function generateLineShareText(params: {
  plotName?: string;
  totalIncome: number;
  totalExpense: number;
  profit: number;
  unpaidDebt: number;
  familySettlement: Array<{ name: string; amount: number }>;
  periodLabel: string;
}): string {
  const { plotName, totalIncome, totalExpense, profit, unpaidDebt, familySettlement, periodLabel } = params;

  const lines: string[] = [
    `🌾 สรุปบัญชีฟาร์มครอบครัว (${periodLabel})`,
    plotName ? `📍 แปลง: ${plotName}` : '📍 ภาพรวมทุกแปลง',
    `📅 ณ วันที่: ${formatDateThai(getTodayIso())}`,
    '-------------------------',
    `🔴 รายจ่ายรวม: ${formatMoney(totalExpense)} บาท`,
    `🟢 รายรับรวม: ${formatMoney(totalIncome)} บาท`,
    `${profit >= 0 ? '✨ กำไรสุทธิ' : '⚠️ ขาดทุนสุทธิ'}: ${profit >= 0 ? '+' : ''}${formatMoney(profit)} บาท`,
  ];

  if (unpaidDebt > 0) {
    lines.push(`💳 หนี้ค้างจ่ายร้านปุ๋ยยา: ${formatMoney(unpaidDebt)} บาท`);
  }

  if (familySettlement && familySettlement.length > 0) {
    lines.push('-------------------------');
    lines.push('👥 ยอดเงินที่คนในบ้านสำรองจ่าย:');
    familySettlement.forEach((s) => {
      lines.push(`• ${s.name}: ออกเงินไป ${formatMoney(s.amount)} บาท`);
    });
  }

  lines.push('-------------------------');
  lines.push('📱 บันทึกผ่าน: farmer-family.vercel.app');

  return lines.join('\n');
}
