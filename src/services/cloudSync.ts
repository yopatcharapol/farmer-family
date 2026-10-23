import { db } from '../db/db';
import { Transaction, CropCycle } from '../types';
import { getTodayIso } from '../utils/thaiAgUnits';

/**
 * บริการซิงค์ข้อมูลสองทางกับ Google Sheets (Two-Way Cloud Sync)
 * ช่วยให้อุปกรณ์ของ พ่อ, แม่, พี่, และเรา มีข้อมูลตรงกัน 100%
 */

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyL_T7Us7Irx9FI0eP_XjwPv6tDSdmx4zPHZGOFVq2RWocVJT_m-upr_dmijpYSemGHmQ/exec';

// แปลงรูปแบบวันที่เป็น YYYY-MM-DD เสมอ
function toIsoDate(val: any): string {
  if (!val) return getTodayIso();
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return getTodayIso();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 1. ดึงข้อมูลล่าสุดจาก Google Sheets ลงมาที่เครื่อง (และส่งแปลงในเครื่องที่ยังไม่มีขึ้นไป)
export async function syncFromGoogleSheets(webhookUrl: string): Promise<{ success: boolean; message: string; count: number }> {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่าลิงก์ Google Sheets Webhook', count: 0 };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    let newTxCount = 0;

    // 1.1 ซิงค์แปลงเพาะปลูก (Cycles) จาก Google Sheets ลงเครื่อง
    if (data.cycles && Array.isArray(data.cycles) && data.cycles.length > 0) {
      for (const c of data.cycles) {
        if (!c.id) continue;
        const normalizedCycle: CropCycle = {
          id: String(c.id),
          name: String(c.name || 'แปลงเพาะปลูก'),
          cropType: String(c.cropType || 'ผักกาด'),
          totalAreaRai: Number(c.totalAreaRai) || 0.5,
          areaRai: Number(c.areaRai) || 0,
          areaNgan: Number(c.areaNgan) || 0,
          areaSqWa: Number(c.areaSqWa) || 0,
          startDate: toIsoDate(c.startDate),
          expectedHarvestDate: toIsoDate(c.expectedHarvestDate),
          expectedYieldKg: Number(c.expectedYieldKg) || 0,
          targetPricePerKg: Number(c.targetPricePerKg) || 0,
          status: 'active',
          createdAt: Number(c.createdAt) || Date.now()
        };
        await db.cycles.put(normalizedCycle);
      }
    }

    // 1.2 ซิงค์รายการบันทึก (Transactions) จาก Google Sheets ลงเครื่อง
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      for (const t of data.transactions) {
        if (!t.id && !t.title) continue;
        const txId = String(t.id || `tx-${Date.now()}-${Math.random()}`);
        const normalizedTx: Transaction = {
          id: txId,
          cycleId: String(t.cycleId || 'default'),
          type: String(t.type).trim() === 'income' ? 'income' : 'expense',
          category: (t.category as any) || (t.type === 'income' ? 'main_crop' : 'labor'),
          categoryLabel: String(t.categoryLabel || 'ทั่วไป'),
          title: String(t.title || 'รายการ'),
          amount: Number(t.amount) || 0,
          quantity: Number(t.quantity) || 1,
          unit: String(t.unit || ''),
          unitPrice: Number(t.unitPrice) || 0,
          recordedBy: (t.recordedBy as any) || 'me',
          date: toIsoDate(t.date),
          notes: String(t.notes || ''),
          synced: true,
          createdAt: Number(t.createdAt) || Date.now()
        };
        await db.transactions.put(normalizedTx);
        newTxCount++;
      }
    }

    // 1.3 ส่งแปลงในเครื่องที่ Google Sheets ยังไม่มีขึ้นไปอัตโนมัติ (Reconciliation)
    const localCycles = await db.cycles.toArray();
    for (const lc of localCycles) {
      const remoteHas = data.cycles?.some((rc: any) => rc.id === lc.id);
      if (!remoteHas) {
        await pushCycleToGoogleSheets(targetUrl, lc);
      }
    }

    return {
      success: true,
      message: `ซิงค์สำเร็จ! ข้อมูลตรงกันแล้ว (${newTxCount} รายการ)`,
      count: newTxCount
    };
  } catch (err: any) {
    console.error('Sync Error:', err);
    return {
      success: false,
      message: 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
      count: 0
    };
  }
}

// 2. ส่ง Transaction ขึ้น Google Sheets
export async function pushTransactionToGoogleSheets(webhookUrl: string, transaction: Transaction) {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) return;
  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_transaction',
        ...transaction
      })
    });
  } catch (e) {
    console.warn('Silent push failed (offline):', e);
  }
}

// 3. ส่งแปลงปลูก (Cycle) ขึ้น Google Sheets
export async function pushCycleToGoogleSheets(webhookUrl: string, cycle: CropCycle) {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) return;
  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_cycle',
        ...cycle
      })
    });
  } catch (e) {
    console.warn('Silent cycle push failed (offline):', e);
  }
}

// 4. สคริปต์ Google Apps Script ฉบับสมบูรณ์
export const FULL_APPS_SCRIPT_CODE = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  
  var transactions = [];
  if (rows.length > 1) {
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0] && !r[4]) continue;
      transactions.push({
        id: String(r[0] || ('tx-' + i)),
        date: String(r[1] ? formatDateIso(r[1]) : ''),
        type: String(r[2]).trim() === 'รายรับ' ? 'income' : 'expense',
        categoryLabel: String(r[3] || 'ทั่วไป'),
        title: String(r[4] || 'รายการ'),
        amount: Number(r[5]) || 0,
        quantity: Number(r[6]) || 1,
        unit: String(r[7] || ''),
        recordedBy: mapRecorder(r[8]),
        notes: String(r[9] || ''),
        cycleId: String(r[10] || 'default'),
        createdAt: new Date(r[0]).getTime() || (Date.now() - (rows.length - i) * 60000)
      });
    }
  }

  // ดึงแปลงเพาะปลูก
  var cycleSheet = ss.getSheetByName("แปลงปลูก");
  var cycles = [];
  if (cycleSheet) {
    var cRows = cycleSheet.getDataRange().getValues();
    for (var j = 1; j < cRows.length; j++) {
      var cr = cRows[j];
      if (!cr[0]) continue;
      cycles.push({
        id: String(cr[0]),
        name: String(cr[1]),
        cropType: String(cr[2]),
        totalAreaRai: Number(cr[3]) || 1,
        areaRai: Number(cr[4]) || Number(cr[3]) || 1,
        areaNgan: Number(cr[5]) || 0,
        areaSqWa: Number(cr[6]) || 0,
        startDate: cr[7] ? formatDateIso(cr[7]) : '',
        expectedHarvestDate: cr[8] ? formatDateIso(cr[8]) : '',
        expectedYieldKg: Number(cr[9]) || 0,
        targetPricePerKg: Number(cr[10]) || 0,
        status: 'active',
        createdAt: Date.now()
      });
    }
  }

  var output = {
    result: 'success',
    transactions: transactions,
    cycles: cycles
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === 'add_cycle') {
    var cycleSheet = ss.getSheetByName("แปลงปลูก");
    if (!cycleSheet) {
      cycleSheet = ss.insertSheet("แปลงปลูก");
      cycleSheet.appendRow(["รหัสแปลง (ID)", "ชื่อแปลง", "ชนิดพืช", "ไร่รวม", "ไร่", "งาน", "วา", "วันเริ่มปลูก", "วันคาดเก็บเกี่ยว", "ผลผลิตคาดการณ์", "ราคาเป้าหมาย"]);
    }
    cycleSheet.appendRow([
      data.id, data.name, data.cropType, data.totalAreaRai,
      data.areaRai, data.areaNgan, data.areaSqWa,
      data.startDate, data.expectedHarvestDate,
      data.expectedYieldKg, data.targetPricePerKg
    ]);
  } else {
    var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["รหัสรายการ (ID)", "วันที่ทำรายการ", "ประเภท", "หมวดหมู่", "ชื่อรายการ", "ยอดเงิน (บาท)", "จำนวน", "หน่วย", "ผู้บันทึก", "หมายเหตุ", "รหัสแปลง"]);
    }
    sheet.appendRow([
      data.id || new Date().toISOString(),
      data.date,
      data.type === 'expense' ? 'รายจ่าย' : 'รายรับ',
      data.categoryLabel,
      data.title,
      data.amount,
      data.quantity || 1,
      data.unit || '',
      data.recordedBy === 'dad' ? 'พ่อ' : data.recordedBy === 'mom' ? 'แม่' : data.recordedBy === 'sibling' ? 'พี่' : 'เรา',
      data.notes || '',
      data.cycleId || ''
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function mapRecorder(val) {
  if (val === 'พ่อ') return 'dad';
  if (val === 'แม่') return 'mom';
  if (val === 'พี่') return 'sibling';
  return 'me';
}

function formatDateIso(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val);
}`;
