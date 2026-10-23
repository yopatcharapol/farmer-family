import Dexie, { Table } from 'dexie';
import { CropCycle, Transaction, AppSettings } from '../types';
import { getTodayIso } from '../utils/thaiAgUnits';

export class FarmDatabase extends Dexie {
  cycles!: Table<CropCycle, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('FarmFamilyDB');
    this.version(1).stores({
      cycles: 'id, name, status, startDate, createdAt',
      transactions: 'id, cycleId, type, category, recordedBy, date, createdAt',
      settings: 'id'
    });
  }
}

export const db = new FarmDatabase();

// ข้อมูลเริ่มต้นสำหรับสาธิตทันทีที่เปิดแอป (Default Seed Data)
export async function initializeDatabase() {
  const cycleCount = await db.cycles.count();
  if (cycleCount === 0) {
    const defaultCycleId = 'cycle-rice-2026';
    const today = getTodayIso();

    // 1. สร้างรอบปลูกเริ่มต้น: ข้าวหอมมะลิ 105 (แปลงดอนตา 15 ไร่)
    await db.cycles.add({
      id: defaultCycleId,
      name: 'แปลงดอนตา - ข้าวหอมมะลิ 105',
      cropType: 'ข้าว',
      areaRai: 15,
      areaNgan: 0,
      areaSqWa: 0,
      totalAreaRai: 15,
      startDate: today,
      expectedHarvestDate: '2026-11-20',
      expectedYieldKg: 6000, // คาดได้ 6 ตัน (400 กก./ไร่)
      targetPricePerKg: 14.5, // 14.50 บาท/กก. (ตันละ 14,500)
      status: 'active',
      createdAt: Date.now()
    });

    // 2. ตัวอย่างรายการเริ่มต้นจากสมาชิกในครอบครัว
    const sampleTransactions: Transaction[] = [
      {
        id: 'tx-1',
        cycleId: defaultCycleId,
        type: 'expense',
        category: 'machinery',
        categoryLabel: 'รถจ้าง/เครื่องจักร',
        title: 'จ้างรถไถดะเตรียมดิน (15 ไร่)',
        amount: 3750,
        quantity: 15,
        unit: 'ไร่',
        unitPrice: 250,
        recordedBy: 'dad',
        date: today,
        notes: 'รถไถผู้ใหญ่บ้าน',
        synced: false,
        createdAt: Date.now() - 3600000 * 24 * 2
      },
      {
        id: 'tx-2',
        cycleId: defaultCycleId,
        type: 'expense',
        category: 'seeds',
        categoryLabel: 'พันธุ์พืช/กล้า',
        title: 'เมล็ดพันธุ์ข้าวหอมมะลิแท้ (15 ถัง)',
        amount: 4500,
        quantity: 15,
        unit: 'ถัง',
        unitPrice: 300,
        recordedBy: 'mom',
        date: today,
        notes: 'ซื้อจากศูนย์เมล็ดพันธุ์',
        synced: false,
        createdAt: Date.now() - 3600000 * 24
      },
      {
        id: 'tx-3',
        cycleId: defaultCycleId,
        type: 'expense',
        category: 'fuel',
        categoryLabel: 'น้ำมัน/ไฟฟ้า',
        title: 'น้ำมันดีเซลสูบน้ำเข้านา',
        amount: 1000,
        quantity: 30,
        unit: 'ลิตร',
        unitPrice: 33.3,
        recordedBy: 'dad',
        date: today,
        notes: 'ปั๊ม ปตท. หน้าปากซอย',
        synced: false,
        createdAt: Date.now() - 3600000 * 5
      }
    ];

    await db.transactions.bulkAdd(sampleTransactions);

    // 3. ค่าตั้งต้น
    await db.settings.add({
      id: 'default',
      activeMemberId: 'dad', // เริ่มต้นที่พ่อ
      activeCycleId: defaultCycleId,
      autoSync: false,
      highContrast: false,
      soundEnabled: true
    });
  }
}

