import { db } from '../db/db';
import { Transaction, CropCycle } from '../types';

/**
 * บริการซิงค์ข้อมูลสองทางกับ Google Sheets (Two-Way Cloud Sync)
 * ช่วยให้อุปกรณ์ของ พ่อ, แม่, พี่, และเรา มีข้อมูลตรงกัน 100%
 */

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyL_T7Us7Irx9FI0eP_XjwPv6tDSdmx4zPHZGOFVq2RWocVJT_m-upr_dmijpYSemGHmQ/exec';

// 1. ดึงข้อมูลล่าสุดจาก Google Sheets ลงมาที่เครื่อง
export async function syncFromGoogleSheets(webhookUrl: string): Promise<{ success: boolean; message: string; count: number }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่าลิงก์ Google Sheets Webhook', count: 0 };
  }

  try {
    const response = await fetch(webhookUrl, {
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

    // ซิงค์แปลงเพาะปลูก (Cycles)
    if (data.cycles && Array.isArray(data.cycles) && data.cycles.length > 0) {
      for (const c of data.cycles) {
        if (!c.id) continue;
        const exists = await db.cycles.get(c.id);
        if (!exists) {
          await db.cycles.add(c);
        }
      }
    }

    // ซิงค์รายการบันทึก (Transactions)
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      for (const t of data.transactions) {
        if (!t.id) continue;
        const exists = await db.transactions.get(t.id);
        if (!exists) {
          await db.transactions.add({
            ...t,
            synced: true
          });
          newTxCount++;
        }
      }
    }

    return {
      success: true,
      message: `ซิงค์สำเร็จ! อัปเดต ${newTxCount} รายการใหม่`,
      count: newTxCount
    };
  } catch (err: any) {
    console.error('Sync Error:', err);
    return {
      success: false,
      message: 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ ตรวจสอบสิทธิ์การเข้าถึงเป็น "ทุกคน (Anyone)"',
      count: 0
    };
  }
}

// 2. ส่ง Transaction ขึ้น Google Sheets
export async function pushTransactionToGoogleSheets(webhookUrl: string, transaction: Transaction) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
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
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_cycle',
        ...cycle
      })
    });
  } catch (e) {
    console.warn('Silent cycle push failed (offline):', e);
  }
}

// 4. สคริปต์ Google Apps Script ฉบับสมบูรณ์ที่รองรับทั้ง GET และ POST
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

  // แปลงเพาะปลูก
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
      data.id,
      data.name,
      data.cropType,
      data.totalAreaRai,
      data.areaRai,
      data.areaNgan,
      data.areaSqWa,
      data.startDate,
      data.expectedHarvestDate,
      data.expectedYieldKg,
      data.targetPricePerKg
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

