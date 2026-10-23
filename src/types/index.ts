// 1. สมาชิกในครอบครัว (Family Members)
export type FamilyMemberId = 'dad' | 'mom' | 'sibling' | 'me';

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  avatar: string; // Emoji หรือ Icon
  role: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'dad', name: 'พ่อ', avatar: '👨‍🌾', role: 'ดูแลรถไถ / จัดการแปลง' },
  { id: 'mom', name: 'แม่', avatar: '👩‍🌾', role: 'ซื้อปุ๋ยยา / การเงิน' },
  { id: 'sibling', name: 'พี่', avatar: '👦', role: 'ขนส่ง / โดรนพ่นยา' },
  { id: 'me', name: 'เรา', avatar: '🧑‍💻', role: 'บันทึกภาพรวม / วิเคราะห์' }
];

// 2. หมวดหมู่ต้นทุนและรายได้ (Categories)
export type ExpenseCategory =
  | 'seeds'        // 1. พันธุ์พืช / เมล็ดพันธุ์
  | 'fertilizer'   // 2. ปุ๋ยและธาตุอาหาร
  | 'chemical'     // 3. ยาและเคมีเกษตร
  | 'labor'        // 4. ค่าแรงคนงาน
  | 'machinery'    // 5. ค่ารถจ้าง / เครื่องจักร
  | 'fuel'         // 6. ค่าน้ำมันและไฟฟ้า
  | 'fixed'        // 7. ค่าเช่าที่ดิน / ดอกเบี้ย
  | 'transport';   // 8. ค่าขนส่ง / กระสอบ

export type IncomeCategory =
  | 'main_crop'    // ขายผลผลิตหลัก (ข้าว, ข้าวโพด, มัน)
  | 'by_product'   // ผลพลอยได้ (ฟาง, กากถั่ว, มูลสัตว์)
  | 'subsidy';     // เงินอุดหนุนรัฐบาล / ชดเชยภัยพิบัติ

export type TransactionType = 'expense' | 'income';

// 3. โครงสร้างรอบการปลูก (Crop Cycle / Plot)
export interface CropCycle {
  id: string;                  // UUID
  name: string;                // เช่น "ข้าวหอมมะลิ 69 (แปลงดอนตา)"
  cropType: string;            // ข้าว, ข้าวโพด, มันสำปะหลัง, ยางพารา, ผักกาด
  areaRai: number;             // ไร่
  areaNgan: number;            // งาน
  areaSqWa: number;            // ตารางวา
  totalAreaRai: number;        // ไร่รวม (ทศนิยม)
  startDate: string;           // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  expectedYieldKg?: number;    // ผลผลิตคาดการณ์ (กก.)
  targetPricePerKg?: number;   // ราคาขายเป้าหมาย (บาท/กก.)
  status: 'active' | 'completed';
  createdAt: number;
}

// 4. โครงสร้างรายการรายรับ-รายจ่าย (Transaction)
export interface Transaction {
  id: string;
  cycleId: string;             // อ้างอิงรอบการปลูก
  type: TransactionType;       // expense | income
  category: ExpenseCategory | IncomeCategory;
  categoryLabel: string;       // ป้ายชื่อภาษาไทย
  title: string;               // เช่น "ปุ๋ยยูเรีย 46-0-0"
  amount: number;              // ยอดเงินรวม (บาท)
  quantity?: number;           // จำนวน (เช่น 2)
  unit?: string;               // หน่วย (เช่น กระสอบ, ลิตร, ไร่)
  unitPrice?: number;          // ราคาต่อหน่วย (บาท)
  recordedBy: FamilyMemberId;  // บันทึกโดยใคร (dad/mom/sibling/me)
  date: string;                // วันที่ (YYYY-MM-DD)
  notes?: string;              // หมายเหตุ
  synced: boolean;             // ซิงค์เข้า Google Sheets แล้วหรือยัง
  createdAt: number;
}

// 5. การตั้งค่าระบบ (App Settings)
export interface AppSettings {
  id: string;
  activeMemberId: FamilyMemberId;
  activeCycleId?: string;
  googleSheetWebhookUrl?: string;
  autoSync: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
}

