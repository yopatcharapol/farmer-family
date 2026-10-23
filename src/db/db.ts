import Dexie, { Table } from 'dexie';
import { CropCycle, Transaction, AppSettings } from '../types';

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

// ฟังก์ชันล้างข้อมูลทั้งหมดในฐานข้อมูล (ให้เหลือ 0 สำหรับเริ่มใช้งานจริง)
export async function clearAllData() {
  await db.transactions.clear();
  await db.cycles.clear();
  await db.settings.update('default', { activeCycleId: '' });
}

// เริ่มต้นระบบแบบคลีน 100% ไม่มีข้อมูลตัวอย่างจำลอง
export async function initializeDatabase() {
  // ล้างข้อมูลตัวอย่างเดิม (mock data) ถ้ายังค้างอยู่ในเครื่อง
  try {
    const sampleCycle = await db.cycles.get('cycle-rice-2026');
    if (sampleCycle) {
      await db.cycles.delete('cycle-rice-2026');
      await db.transactions.where('cycleId').equals('cycle-rice-2026').delete();
    }
  } catch (e) {
    // ignore
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      activeMemberId: 'dad',
      activeCycleId: '',
      autoSync: false,
      highContrast: false,
      soundEnabled: true
    });
  }
}
