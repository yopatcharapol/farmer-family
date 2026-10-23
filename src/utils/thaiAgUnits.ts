/**
 * เครื่องมือคำนวณและแปลงหน่วยการเกษตรไทย (Thai Agricultural Units & Financial Engine)
 */

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
// 1 ถัง (20 ลิตร) ≈ 10-15 กก. ขึ้นกับความชื้น (ค่าเฉลี่ยข้าวเปลือกมาตรฐาน = 10-11 กก.)
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
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  return `${day} ${month} ${year}`;
}

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
