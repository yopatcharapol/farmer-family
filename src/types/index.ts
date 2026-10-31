// 1. สมาชิกในครอบครัว (Family Members)
export type FamilyMemberId = string;

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string; // Emoji หรือ Icon
  role: string;
}

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'dad', name: 'พ่อ', avatar: '👨‍🌾', role: 'ดูแลรถไถ / จัดการแปลง' },
  { id: 'mom', name: 'แม่', avatar: '👩‍🌾', role: 'ซื้อปุ๋ยยา / การเงิน' },
  { id: 'sibling', name: 'พี่', avatar: '👦', role: 'ขนส่ง / โดรนพ่นยา' },
  { id: 'me', name: 'เรา', avatar: '🧑‍💻', role: 'บันทึกภาพรวม / วิเคราะห์' }
];

export const FAMILY_MEMBERS = DEFAULT_FAMILY_MEMBERS;

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
  | 'main_crop'    // ขายผลผลิตหลัก (ข้าว, ข้าวโพด, มัน, ยาง, ผัก)
  | 'by_product'   // ผลพลอยได้ (ฟาง, กากถั่ว, มูลสัตว์)
  | 'subsidy';     // เงินอุดหนุนรัฐบาล / ชดเชยภัยพิบัติ

export type TransactionType = 'expense' | 'income';

// สถานะการจ่ายเงิน (สด หรือ เงินเชื่อ)
export type PaymentStatus = 'paid' | 'credit';

// สถานะการซิงค์ข้อมูลไปยัง Cloud / Google Sheets
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'pending_update' | 'pending_delete';

// 3. โครงสร้างรอบการปลูก (Crop Cycle / Plot)
export interface CareStage {
  id: string;
  day: number;
  label: string;
  description?: string;
  done?: boolean;
}

export interface CropCycle {
  id: string;                  // UUID
  name: string;                // เช่น "แปลง - ข้าวหอมมะลิ (แปลงดอนตา)"
  cropType: string;            // ข้าว, ข้าวโพด, มันสำปะหลัง, ยางพารา, ผักกาด
  areaRai: number;             // ไร่
  areaNgan: number;            // งาน
  areaSqWa: number;            // ตารางวา
  totalAreaRai: number;        // ไร่รวม (ทศนิยม)
  startDate: string;           // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  expectedYieldKg?: number;    // ผลผลิตคาดการณ์ (กก.)
  targetPricePerKg?: number;   // ราคาขายเป้าหมาย (บาท/กก.)
  status: 'active' | 'closed' | 'completed' | 'deleted';
  careStages?: CareStage[];    // ระยะการดูแลแปลง
  closedAt?: number;           // วันที่ปิดรอบ (Timestamp)
  finalProfit?: number;        // กำไรสุทธิเมื่อปิดรอบ (บาท)
  finalRevenue?: number;       // รายรับรวมเมื่อปิดรอบ (บาท)
  finalExpense?: number;       // รายจ่ายรวมเมื่อปิดรอบ (บาท)
  createdAt: number;
  updatedAt?: number;
}

// 4. โครงสร้างรายการรายรับ-รายจ่าย (Transaction)
export interface Transaction {
  id: string;
  cycleId: string;             // อ้างอิงรอบการปลูก (Plot ID)
  plotIds?: string[];          // รหัสแปลงกรณีหารบิลหลายแปลง
  type: TransactionType;       // expense | income
  category: ExpenseCategory | IncomeCategory;
  categoryLabel: string;       // ป้ายชื่อภาษาไทย
  title: string;               // เช่น "ปุ๋ยยูเรีย 46-0-0"
  amount: number;              // ยอดเงินรวม (บาท)
  quantity?: number;           // จำนวน (เช่น 2)
  unit?: string;               // หน่วย (เช่น กระสอบ, ลิตร, ไร่)
  unitPrice?: number;          // ราคาต่อหน่วย (บาท)
  recordedBy: string;          // บันทึกโดยใคร (dad/mom/sibling/me หรือ custom ID)
  paidBy?: string;             // คนควักเงินจ่ายจริง (Family member ID)
  paymentStatus?: PaymentStatus; // 'paid' (จ่ายสด) | 'credit' (เงินเชื่อ/แปะหนี้)
  creditorName?: string;       // ชื่อร้านค้า/เจ้าหนี้ (เช่น ร้านเจ๊หมวยเกษตร)
  date: string;                // วันที่ทำรายการ (YYYY-MM-DD)
  notes?: string;              // หมายเหตุ / สูตรปุ๋ย / ชื่อคนงาน
  harvestWeight?: number;      // น้ำหนักผลผลิตสุทธิ (กก.) ตอนขาย
  synced: boolean;             // ซิงค์เข้า Google Sheets แล้วหรือยัง (backward compatibility)
  syncStatus: SyncStatus;      // 'pending' | 'synced' | 'failed' | 'pending_update' | 'pending_delete'
  isDeleted?: boolean;         // Soft-delete flag เพื่อรอส่งไปลบใน Google Sheets
  createdAt: number;
  updatedAt?: number;
}

// 5. โครงสร้างบันทึกกิจกรรมประจำแปลง (Non-financial Plot Log)
export type PlotEventType = 'watering' | 'fertilizer' | 'pest' | 'disease' | 'general';

export interface PlotLog {
  id: string;
  plotId: string;
  date: string;                // YYYY-MM-DD
  eventType: PlotEventType;
  note: string;
  createdAt: number;
}

// 6. โครงสร้างคลังสต็อกฟาร์มแบบง่าย (Mini Farm Inventory)
export interface InventoryItem {
  id: string;
  itemName: string;            // เช่น ปุ๋ยยูเรีย 46-0-0, ยาคุมหญ้า
  category: 'fertilizer' | 'chemical' | 'other';
  unit: string;                // กระสอบ, ขวด, ลิตร, กก.
  totalBought: number;         // ยอดซื้อเข้าทั้งหมด
  totalUsed: number;           // ยอดเบิกใช้ทั้งหมด
  remaining: number;           // คงเหลือในโกดัง
  updatedAt: number;
}

// 7. โครงสร้างแม่แบบรายการใช้บ่อย (Quick Template)
export interface QuickTemplate {
  id: string;
  title: string;
  category: ExpenseCategory;
  categoryLabel: string;
  type: TransactionType;
  defaultAmount?: number;
  defaultUnit?: string;
  defaultQuantity?: number;
  icon: string;
}

// 8. การตั้งค่าระบบ (App Settings)
export type FontSizeScale = 'normal' | 'large' | 'extra-large';

export interface AppSettings {
  id: string;
  activeMemberId: string;
  activeCycleId?: string;
  googleSheetWebhookUrl?: string;
  autoSync: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  fontSizeScale: FontSizeScale;
  resetPin: string;            // ค่าเริ่มต้น '1234'
  familyMembers: FamilyMember[];
}
