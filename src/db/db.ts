import Dexie, { Table } from 'dexie';
import {
  CropCycle,
  Transaction,
  AppSettings,
  PlotLog,
  InventoryItem,
  DEFAULT_FAMILY_MEMBERS
} from '../types';

export class FarmDatabase extends Dexie {
  cycles!: Table<CropCycle, string>;
  transactions!: Table<Transaction, string>;
  plotLogs!: Table<PlotLog, string>;
  inventory!: Table<InventoryItem, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('FarmFamilyDB');

    // Version 1: โครงสร้างแรกเริ่ม
    this.version(1).stores({
      cycles: 'id, name, status, startDate, createdAt',
      transactions: 'id, cycleId, type, category, recordedBy, date, createdAt',
      settings: 'id'
    });

    // Version 2: เพิ่ม syncStatus สำหรับระบบออฟไลน์
    this.version(2).stores({
      cycles: 'id, name, status, startDate, createdAt',
      transactions: 'id, cycleId, type, category, recordedBy, date, syncStatus, createdAt',
      settings: 'id'
    }).upgrade(tx => {
      return tx.table('transactions').toCollection().modify((t: any) => {
        if (!t.syncStatus) {
          t.syncStatus = t.synced ? 'synced' : 'pending';
        }
      });
    });

    // Version 3: รองรับ 21 ฟีเจอร์ใหม่ครบวงจร
    this.version(3).stores({
      cycles: 'id, name, status, startDate, createdAt, closedAt',
      transactions: 'id, cycleId, type, category, recordedBy, paidBy, paymentStatus, date, syncStatus, isDeleted, createdAt, updatedAt',
      plotLogs: 'id, plotId, date, eventType, createdAt',
      inventory: 'id, itemName, category, updatedAt',
      settings: 'id'
    }).upgrade(async (tx) => {
      await tx.table('transactions').toCollection().modify((t: any) => {
        if (!t.paymentStatus) t.paymentStatus = 'paid';
        if (!t.paidBy) t.paidBy = t.recordedBy || 'dad';
        if (t.isDeleted === undefined) t.isDeleted = false;
        if (!t.updatedAt) t.updatedAt = t.createdAt || Date.now();
        if (!t.syncStatus) t.syncStatus = t.synced ? 'synced' : 'pending';
      });

      await tx.table('cycles').toCollection().modify((c: any) => {
        if (!c.status) c.status = 'active';
      });

      await tx.table('settings').toCollection().modify((s: any) => {
        if (!s.fontSizeScale) s.fontSizeScale = 'normal';
        if (!s.resetPin) s.resetPin = '1234';
        if (!s.familyMembers || s.familyMembers.length === 0) {
          s.familyMembers = DEFAULT_FAMILY_MEMBERS;
        }
      });
    });
  }
}

export const db = new FarmDatabase();

// ฟังก์ชันล้างข้อมูลทั้งหมดในฐานข้อมูล (ต้องใช้ PIN ยืนยัน)
export async function clearAllData() {
  await db.transactions.clear();
  await db.cycles.clear();
  await db.plotLogs.clear();
  await db.inventory.clear();
  await db.settings.update('default', { activeCycleId: '' });
  try {
    localStorage.removeItem('farmer_deleted_tx_ids');
    localStorage.removeItem('farmer_deleted_cycle_ids');
    localStorage.removeItem('farmer_pending_cycle_deletes');
  } catch (e) {}
}

// ฟังก์ชันกวาดล้างรายการผี 0 บ. (Ghost Transactions Purge)
export async function purgeGhostTransactions(): Promise<number> {
  const ghosts = await db.transactions
    .filter(t => (
      Number(t.amount) === 0 && (
        !t.title ||
        t.title === 'รายการ' ||
        t.title === 'ทั่วไป' ||
        t.id === 'test-dummy-id' ||
        t.categoryLabel === 'ทั่วไป'
      )
    ) || t.isDeleted === true)
    .toArray();

  if (ghosts.length > 0) {
    const ids = ghosts.map(g => g.id);
    await db.transactions.bulkDelete(ids);
  }
  return ghosts.length;
}

// ฟังก์ชันกวาดล้างแปลงที่ถูกลบและแปลงผีชื่อเสีย '?' (Purge Deleted & Corrupted Cycles)
export async function purgeDeletedCycles(): Promise<number> {
  let count = 0;
  try {
    const raw = localStorage.getItem('farmer_deleted_cycle_ids') || '[]';
    const deletedIds: string[] = JSON.parse(raw);

    const badCycles = await db.cycles
      .filter(c => (
        deletedIds.includes(c.id) ||
        c.status === 'deleted' ||
        (c as any).isDeleted === true ||
        c.name.includes('?') ||
        c.name === '???? - ??????'
      ))
      .toArray();

    if (badCycles.length > 0) {
      count = badCycles.length;
      const ids = badCycles.map(c => c.id);
      await db.cycles.bulkDelete(ids);

      // กวาดล้างรายการบัญชีและบันทึกแปลงที่ผูกกับแปลงที่ถูกลบ
      for (const id of ids) {
        await db.transactions.where('cycleId').equals(id).delete();
        await db.plotLogs.where('plotId').equals(id).delete();
      }
    }
  } catch (e) {
    console.error('Error in purgeDeletedCycles:', e);
  }
  return count;
}

// ฟังก์ชันสแกนและซ่อมแซมข้อมูลอัตโนมัติ (Data Integrity & Auto-Repair)
export async function repairDataIntegrity(): Promise<{ repairedCount: number; details: string[] }> {
  let repairedCount = 0;
  const details: string[] = [];

  // 1. กวาดล้างรายการผี 0 บาท และแปลงที่ถูกลบ
  const purgedGhosts = await purgeGhostTransactions();
  if (purgedGhosts > 0) {
    repairedCount += purgedGhosts;
    details.push(`กวาดล้างรายการผี 0 บ. ออกจากระบบ ${purgedGhosts} รายการ`);
  }

  const purgedCycles = await purgeDeletedCycles();
  if (purgedCycles > 0) {
    repairedCount += purgedCycles;
    details.push(`กวาดล้างแปลงที่ถูกลบ/แปลงผีชื่อเสีย '?' ออกจากระบบ ${purgedCycles} แปลง`);
  }

  // 2. ซ่อมแซม Transactions ที่มี NaN หรือฟิลด์สำคัญตกหล่น
  const allTxs = await db.transactions.toArray();
  for (const t of allTxs) {
    let modified = false;
    const updates: Partial<Transaction> = {};

    if (isNaN(t.amount) || t.amount === null || t.amount === undefined) {
      updates.amount = 0;
      modified = true;
    }
    if (!t.paymentStatus) {
      updates.paymentStatus = 'paid';
      modified = true;
    }
    if (!t.paidBy) {
      updates.paidBy = t.recordedBy || 'dad';
      modified = true;
    }
    if (t.isDeleted === undefined) {
      updates.isDeleted = false;
      modified = true;
    }
    if (!t.updatedAt) {
      updates.updatedAt = t.createdAt || Date.now();
      modified = true;
    }
    if (!t.date || t.date.length < 10) {
      updates.date = new Date().toISOString().slice(0, 10);
      modified = true;
    }

    if (modified) {
      await db.transactions.update(t.id, updates);
      repairedCount++;
      details.push(`ซ่อมแซมรายการ "${t.title || t.id}" ที่ข้อมูลไม่สมบูรณ์`);
    }
  }

  // 3. ซ่อมแซม สต็อก Inventory ที่ติดลบ
  const invItems = await db.inventory.toArray();
  for (const item of invItems) {
    if (item.remaining < 0) {
      await db.inventory.update(item.id, { remaining: 0, updatedAt: Date.now() });
      repairedCount++;
      details.push(`ปรับยอดสต็อก "${item.itemName}" จากติดลบเป็น 0`);
    }
  }

  // 4. ตรวจสอบแปลงที่ชื่อเสีย ???? ทำการกวาดล้างทิ้งเด็ดขาด
  const badCyclesCount = await purgeDeletedCycles();
  if (badCyclesCount > 0) {
    repairedCount += badCyclesCount;
    details.push(`กวาดล้างแปลงที่ชื่อเสียหรือถูกลบตกค้าง ${badCyclesCount} แปลง`);
  }

  return { repairedCount, details };
}

// เริ่มต้นระบบแบบคลีน 100% พร้อม Backward Compatibility
export async function initializeDatabase() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      await navigator.storage.persist();
    } catch (e) {
      // ignore
    }
  }

  // ล้างรายการผี 0 บาท และแปลงที่ถูกลบทันทีตอนเปิดแอป
  try {
    await purgeGhostTransactions();
    await purgeDeletedCycles();
  } catch (e) {
    // ignore
  }

  // ล้างข้อมูลตัวอย่างเดิม (mock data)
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
  const defaultWebhook = 'https://script.google.com/macros/s/AKfycbyL_T7Us7Irx9FI0eP_XjwPv6tDSdmx4zPHZGOFVq2RWocVJT_m-upr_dmijpYSemGHmQ/exec';

  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      activeMemberId: 'dad',
      activeCycleId: '',
      googleSheetWebhookUrl: defaultWebhook,
      autoSync: true,
      highContrast: false,
      soundEnabled: false,
      fontSizeScale: 'normal',
      resetPin: '1234',
      familyMembers: DEFAULT_FAMILY_MEMBERS
    });
  } else {
    const current = await db.settings.get('default');
    if (current) {
      const updates: Partial<AppSettings> = {};
      if (!current.fontSizeScale) updates.fontSizeScale = 'normal';
      if (!current.resetPin) updates.resetPin = '1234';
      if (!current.familyMembers || current.familyMembers.length === 0) {
        updates.familyMembers = DEFAULT_FAMILY_MEMBERS;
      }
      if (!current.googleSheetWebhookUrl || !current.googleSheetWebhookUrl.includes('AKfycb')) {
        updates.googleSheetWebhookUrl = defaultWebhook;
      }
      if (Object.keys(updates).length > 0) {
        await db.settings.update('default', updates);
      }
    }
  }
}
