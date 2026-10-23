/**
 * เครื่องมือคำนวณและแปลงหน่วยการเกษตรไทย (Thai Agricultural Units & Financial Engine)
 */

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
    unitName: 'กก.'
  },
  'ข้าว': {
    id: 'ข้าว',
    name: '🌾 ข้าวนาปี / ข้าวนาปรัง',
    icon: '🌾',
    daysToHarvest: 120, // 4 เดือน
    durationLabel: '4 เดือน (120 วัน)',
    defaultYieldKgPerRai: 500,
    defaultPricePerKg: 14.5,
    unitName: 'ตัน'
  },
  'ข้าวโพด': {
    id: 'ข้าวโพด',
    name: '🌽 ข้าวโพดเลี้ยงสัตว์',
    icon: '🌽',
    daysToHarvest: 105, // 3.5 เดือน
    durationLabel: '3.5 เดือน (105 วัน)',
    defaultYieldKgPerRai: 1000,
    defaultPricePerKg: 9.5,
    unitName: 'ตัน'
  },
  'มันสำปะหลัง': {
    id: 'มันสำปะหลัง',
    name: '🥔 มันสำปะหลัง',
    icon: '🥔',
    daysToHarvest: 270, // 9 เดือน
    durationLabel: '9 เดือน (270 วัน)',
    defaultYieldKgPerRai: 4000,
    defaultPricePerKg: 3.2,
    unitName: 'ตัน'
  },
  'อ้อย': {
    id: 'อ้อย',
    name: '🎋 อ้อยโรงงาน',
    icon: '🎋',
    daysToHarvest: 365, // 1 ปี (12 เดือน)
    durationLabel: '1 ปี (12 เดือน / 365 วัน)',
    defaultYieldKgPerRai: 12000,
    defaultPricePerKg: 1.2,
    unitName: 'ตัน'
  },
  'ยางพารา': {
    id: 'ยางพารา',
    name: '🌲 ยางพารา (รอบกรีดเก็บผลผลิต)',
    icon: '🌲',
    daysToHarvest: 240, // 8 เดือน (รอบฤดูกาลเปิดกรีดยางประจำปี)
    durationLabel: 'รอบฤดูเปิดกรีด 8 เดือน (240 วัน)',
    defaultYieldKgPerRai: 300,
    defaultPricePerKg: 65.0,
    unitName: 'กก.'
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
