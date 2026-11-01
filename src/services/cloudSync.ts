import { db, purgeGhostTransactions } from '../db/db';
import { Transaction, CropCycle } from '../types';
import { getTodayIso } from '../utils/thaiAgUnits';

/**
 * บริการซิงค์ข้อมูลสองทางกับ Google Sheets (Two-Way Cloud Sync)
 * พร้อมระบบคัดกรองและป้องกันรายการผี 0 บ. (Ghost Records Protection)
 */

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyL_T7Us7Irx9FI0eP_XjwPv6tDSdmx4zPHZGOFVq2RWocVJT_m-upr_dmijpYSemGHmQ/exec';

// บันทึก ID รายการที่เคยถูกลบ เพื่อป้องกันการดึงกลับมาทับซ้ำ (Tombstone Protection)
export function markTransactionAsDeleted(id: string) {
  try {
    const raw = localStorage.getItem('farmer_deleted_tx_ids') || '[]';
    const list: string[] = JSON.parse(raw);
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem('farmer_deleted_tx_ids', JSON.stringify(list.slice(-500)));
    }
  } catch (e) {}
}

export function isTransactionDeleted(id: string): boolean {
  try {
    const raw = localStorage.getItem('farmer_deleted_tx_ids') || '[]';
    const list: string[] = JSON.parse(raw);
    return list.includes(id);
  } catch (e) {
    return false;
  }
}

// แปลงรูปแบบวันที่เป็น YYYY-MM-DD เสมอ
function toIsoDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 1. ดึงข้อมูลล่าสุดจาก Google Sheets ลงมาที่เครื่อง
export async function syncFromGoogleSheets(webhookUrl: string): Promise<{ success: boolean; message: string; count: number }> {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่าลิงก์ Google Sheets Webhook', count: 0 };
  }

  try {
    // ล้างรายการผี 0 บาทในเครื่องก่อนเริ่มซิงค์
    await purgeGhostTransactions();

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
    let primaryCycleId = '';
    if (data.cycles && Array.isArray(data.cycles) && data.cycles.length > 0) {
      const cleanCycles = data.cycles.filter((c: any) => c.name && !c.name.includes('?'));
      const listToSync = cleanCycles.length > 0 ? cleanCycles : data.cycles;

      for (const c of listToSync) {
        if (!c.id) continue;
        let cName = String(c.name || 'แปลงเพาะปลูก');
        let cCrop = String(c.cropType || 'ผักกาด');
        
        if (cName.includes('?')) {
          cName = 'แปลง - ผักกาด (26/10/2569)';
          cCrop = 'ผักกาด';
        }

        const normalizedCycle: CropCycle = {
          id: String(c.id),
          name: cName,
          cropType: cCrop,
          totalAreaRai: Number(c.totalAreaRai) || 0.5,
          areaRai: Number(c.areaRai) || 0,
          areaNgan: Number(c.areaNgan) || 2,
          areaSqWa: Number(c.areaSqWa) || 0,
          startDate: toIsoDate(c.startDate) || getTodayIso(),
          expectedHarvestDate: toIsoDate(c.expectedHarvestDate) || getTodayIso(),
          expectedYieldKg: Number(c.expectedYieldKg) || 1250,
          targetPricePerKg: Number(c.targetPricePerKg) || 15,
          status: c.status === 'closed' ? 'closed' : 'active',
          finalProfit: c.finalProfit !== undefined ? Number(c.finalProfit) : undefined,
          createdAt: Number(c.createdAt) || Date.now(),
          updatedAt: Number(c.updatedAt) || Date.now()
        };
        await db.cycles.put(normalizedCycle);
        if (!primaryCycleId && normalizedCycle.status === 'active') {
          primaryCycleId = normalizedCycle.id;
        }
      }
    }

    if (!primaryCycleId) {
      const firstCycle = await db.cycles.where('status').equals('active').first();
      if (firstCycle) primaryCycleId = firstCycle.id;
    }

    // 1.2 ซิงค์รายการบันทึก (Transactions) จาก Google Sheets ลงเครื่อง พร้อมคัดกรองรายการผี 0 บ.
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      for (const t of data.transactions) {
        if (!t.id) continue;
        const txId = String(t.id);

        // ตรวจสอบว่าเคยลบรายการนี้ไปแล้วหรือไม่
        if (isTransactionDeleted(txId)) {
          continue;
        }

        // คัดกรองรายการผี 0 บาท ที่ไม่มีข้อมูลจริงทิ้งเด็ดขาด
        const amt = Number(t.amount) || 0;
        const titleStr = String(t.title || '').trim();
        const catStr = String(t.categoryLabel || '').trim();
        const dateRaw = String(t.date || '').trim();

        if (
          (amt === 0 && (titleStr === 'รายการ' || titleStr === '' || catStr === 'ทั่วไป' || !dateRaw)) ||
          txId === 'test-dummy-id'
        ) {
          // ข้ามแถวผี 0 บาท ไม่บันทึกลง IndexedDB
          continue;
        }

        // ตรวจสอบว่าในเครื่องมีรายการนี้ที่ติด pending_update หรือ pending_delete หรือไม่
        const localTx = await db.transactions.get(txId);
        if (localTx && (localTx.syncStatus === 'pending_update' || localTx.syncStatus === 'pending_delete' || localTx.isDeleted)) {
          continue;
        }

        let txCycleId = String(t.cycleId || 'default');
        if (txCycleId === 'default' && primaryCycleId) {
          txCycleId = primaryCycleId;
        }

        const normalizedTx: Transaction = {
          id: txId,
          cycleId: txCycleId,
          type: String(t.type).trim() === 'income' ? 'income' : 'expense',
          category: (t.category as any) || (t.type === 'income' ? 'main_crop' : 'labor'),
          categoryLabel: String(t.categoryLabel || 'ทั่วไป'),
          title: titleStr || 'รายการ',
          amount: amt,
          quantity: Number(t.quantity) || 1,
          unit: String(t.unit || ''),
          unitPrice: Number(t.unitPrice) || 0,
          recordedBy: String(t.recordedBy || 'me'),
          paidBy: String(t.paidBy || t.recordedBy || 'dad'),
          paymentStatus: t.paymentStatus === 'credit' ? 'credit' : 'paid',
          creditorName: t.creditorName ? String(t.creditorName) : undefined,
          date: toIsoDate(t.date) || getTodayIso(),
          notes: String(t.notes || ''),
          harvestWeight: t.harvestWeight ? Number(t.harvestWeight) : undefined,
          synced: true,
          syncStatus: 'synced',
          isDeleted: false,
          createdAt: Number(t.createdAt) || Date.now(),
          updatedAt: Number(t.updatedAt) || Date.now()
        };
        await db.transactions.put(normalizedTx);
        newTxCount++;
      }
    }

    // ปรับรายการเดิมในเครื่องที่ cycleId ยังเป็น 'default' ให้เชื่อมกับแปลงหลักทันที
    if (primaryCycleId) {
      await db.transactions.where('cycleId').equals('default').modify({ cycleId: primaryCycleId });
    }

    // ตรวจสอบล้างรายการผี 0 บาทรอบสุดท้าย
    await purgeGhostTransactions();

    return {
      success: true,
      message: `ซิงค์สำเร็จ! อัปเดตข้อมูลตรงกันเรียบร้อย (${newTxCount} รายการ)`,
      count: newTxCount
    };
  } catch (err: any) {
    console.error('Sync Error:', err);
    return {
      success: false,
      message: 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบสัญญาณเน็ต',
      count: 0
    };
  }
}

// 2. ส่ง Transaction เดี่ยว (INSERT)
export async function pushTransactionToGoogleSheets(webhookUrl: string, transaction: Transaction): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) return false;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await db.transactions.update(transaction.id, { syncStatus: 'pending' });
    return false;
  }

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

    await db.transactions.update(transaction.id, {
      syncStatus: 'synced',
      synced: true
    });
    return true;
  } catch (e) {
    console.warn('Push transaction failed (will retry):', e);
    await db.transactions.update(transaction.id, { syncStatus: 'failed' });
    return false;
  }
}

// 2.1 ส่งคำสั่งแก้ไขรายการ (UPDATE)
export async function updateTransactionInGoogleSheets(webhookUrl: string, transaction: Transaction): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) return false;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await db.transactions.update(transaction.id, { syncStatus: 'pending_update' });
    return false;
  }

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_transaction',
        ...transaction
      })
    });

    await db.transactions.update(transaction.id, {
      syncStatus: 'synced',
      synced: true
    });
    return true;
  } catch (e) {
    console.warn('Update transaction in sheets failed:', e);
    await db.transactions.update(transaction.id, { syncStatus: 'pending_update' });
    return false;
  }
}

// 2.2 ส่งคำสั่งลบรายการ (DELETE) พร้อมบันทึก Tombstone กันเด้งกลับ
export async function deleteTransactionFromGoogleSheets(webhookUrl: string, transactionId: string): Promise<boolean> {
  // บันทึก ID รายการที่ถูกลบลง Tombstone ทันที
  markTransactionAsDeleted(transactionId);
  await db.transactions.delete(transactionId);

  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) return true;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete_transaction',
        id: transactionId
      })
    });
    return true;
  } catch (e) {
    console.warn('Delete transaction from sheets failed (offline):', e);
    return false;
  }
}

// 2.3 ประมวลผลคิวรอส่งข้อมูล (Flush Offline Sync Queue)
export async function syncPendingQueue(webhookUrl: string): Promise<{ syncedCount: number; failedCount: number; message: string }> {
  const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
  if (!targetUrl) {
    return { syncedCount: 0, failedCount: 0, message: 'ยังไม่ได้ระบุลิงก์ Webhook' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0, message: 'ไม่มีสัญญาณเน็ต กำลังรอเชื่อมต่อ...' };
  }

  let syncedCount = 0;

  // 1. ส่งรายการที่รอการลบ (pending_delete)
  const pendingDeletes = await db.transactions
    .filter(t => t.syncStatus === 'pending_delete' || t.isDeleted === true)
    .toArray();

  for (const delTx of pendingDeletes) {
    try {
      markTransactionAsDeleted(delTx.id);
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete_transaction', id: delTx.id })
      });
      await db.transactions.delete(delTx.id);
      syncedCount++;
    } catch (e) {
      // ignore
    }
  }

  // 2. ส่งรายการที่รอการแก้ไข (pending_update)
  const pendingUpdates = await db.transactions
    .filter(t => t.syncStatus === 'pending_update' && !t.isDeleted)
    .toArray();

  for (const updTx of pendingUpdates) {
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update_transaction', ...updTx })
      });
      await db.transactions.update(updTx.id, { syncStatus: 'synced', synced: true });
      syncedCount++;
    } catch (e) {
      // ignore
    }
  }

  // 3. ส่งรายการใหม่ที่ค้างส่ง (pending หรือ failed)
  const pendingAdds = await db.transactions
    .filter(t => (t.syncStatus === 'pending' || t.syncStatus === 'failed' || !t.synced) && !t.isDeleted && Number(t.amount) > 0)
    .toArray();

  if (pendingAdds.length > 0) {
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'batch_sync', transactions: pendingAdds })
      });
      const addIds = pendingAdds.map(t => t.id);
      await db.transactions.where('id').anyOf(addIds).modify({ syncStatus: 'synced', synced: true });
      syncedCount += pendingAdds.length;
    } catch (e) {
      // ignore
    }
  }

  if (syncedCount > 0) {
    return {
      syncedCount,
      failedCount: 0,
      message: `ซิงค์คิวสำเร็จ! ส่งข้อมูลเข้า Google Sheets แล้ว ${syncedCount} รายการ`
    };
  }

  return {
    syncedCount: 0,
    failedCount: 0,
    message: 'ไม่มีข้อมูลค้างส่ง ข้อมูลเป็นปัจจุบันแล้ว'
  };
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

// 4. สคริปต์ Google Apps Script ฉบับสมบูรณ์ (พร้อมระบบตัดรายการผี 0 บ. อัตโนมัติ)
export const FULL_APPS_SCRIPT_CODE = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  
  var transactions = [];
  if (rows.length > 1) {
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue;
      
      var amt = Number(r[5]) || 0;
      var title = String(r[4] || '').trim();
      var dateStr = String(r[1] ? formatDateIso(r[1]) : '').trim();
      var rId = String(r[0] || '');
      
      // กรองแถวผี 0 บาท หรือแถวที่ไม่มีข้อมูลจริงทิ้งเด็ดขาด
      if ((amt === 0 && (title === 'รายการ' || title === '' || !dateStr)) || rId === 'test-dummy-id') {
        continue;
      }

      transactions.push({
        id: rId || ('tx-' + i),
        date: dateStr,
        type: String(r[2]).trim() === 'รายรับ' ? 'income' : 'expense',
        categoryLabel: String(r[3] || 'ทั่วไป'),
        title: title || 'รายการ',
        amount: amt,
        quantity: Number(r[6]) || 1,
        unit: String(r[7] || ''),
        recordedBy: mapRecorder(r[8]),
        notes: String(r[9] || ''),
        cycleId: String(r[10] || 'default'),
        paymentStatus: String(r[11] || 'paid'),
        creditorName: String(r[12] || ''),
        paidBy: mapRecorder(r[13] || r[8]),
        harvestWeight: Number(r[14]) || 0,
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
      var cName = String(cr[1] || '');
      if (cName.indexOf('?') !== -1) continue;
      cycles.push({
        id: String(cr[0]),
        name: cName,
        cropType: String(cr[2] || 'ผักกาด'),
        totalAreaRai: Number(cr[3]) || 0.5,
        areaRai: Number(cr[4]) || 0,
        areaNgan: Number(cr[5]) || 2,
        areaSqWa: Number(cr[6]) || 0,
        startDate: cr[7] ? formatDateIso(cr[7]) : '',
        expectedHarvestDate: cr[8] ? formatDateIso(cr[8]) : '',
        expectedYieldKg: Number(cr[9]) || 0,
        targetPricePerKg: Number(cr[10]) || 0,
        status: String(cr[11] || 'active'),
        finalProfit: Number(cr[12]) || 0,
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
  var action = data.action;

  // 1. จัดการแปลงปลูก (Cycle)
  if (action === 'add_cycle' || action === 'update_cycle') {
    var cycleSheet = ss.getSheetByName("แปลงปลูก");
    if (!cycleSheet) {
      cycleSheet = ss.insertSheet("แปลงปลูก");
      cycleSheet.appendRow(["รหัสแปลง (ID)", "ชื่อแปลง", "ชนิดพืช", "ไร่รวม", "ไร่", "งาน", "วา", "วันเริ่มปลูก", "วันคาดเก็บเกี่ยว", "ผลผลิตคาดการณ์", "ราคาเป้าหมาย", "สถานะ", "กำไรสุทธิ"]);
    }
    var rowIdx = findRowById(cycleSheet, data.id);
    var cycleRow = [
      data.id, data.name, data.cropType, Number(data.totalAreaRai) || 0,
      Number(data.areaRai) || 0, Number(data.areaNgan) || 0, Number(data.areaSqWa) || 0,
      data.startDate, data.expectedHarvestDate,
      Number(data.expectedYieldKg) || 0, Number(data.targetPricePerKg) || 0,
      data.status || 'active', Number(data.finalProfit) || 0
    ];
    if (rowIdx > 0) {
      cycleSheet.getRange(rowIdx, 1, 1, cycleRow.length).setValues([cycleRow]);
    } else {
      cycleSheet.appendRow(cycleRow);
    }
    return ContentService.createTextOutput(JSON.stringify({result: 'success'})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. จัดการแผ่นงาน "รายการ" (Transactions)
  var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["รหัสรายการ (ID)", "วันที่", "ประเภท", "หมวดหมู่", "ชื่อรายการ", "ยอดเงิน", "จำนวน", "หน่วย", "ผู้บันทึก", "หมายเหตุ", "รหัสแปลง", "การจ่ายเงิน", "เจ้าหนี้/ร้านค้า", "คนควักเงิน", "น้ำหนักสุทธิ(กก)"]);
  }

  // 2.1 ลบรายการเดี่ยว (DELETE)
  if (action === 'delete_transaction') {
    var delRow = findRowById(sheet, data.id);
    if (delRow > 0) {
      sheet.deleteRow(delRow);
    }
    return ContentService.createTextOutput(JSON.stringify({result: 'success', action: 'deleted'})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2.2 กวาดล้างรายการผี 0 บาททั้งหมดในแผ่นงาน (CLEAN GHOSTS)
  if (action === 'clean_ghosts') {
    var lastRow = sheet.getLastRow();
    var deletedCount = 0;
    if (lastRow > 1) {
      for (var r = lastRow; r >= 2; r--) {
        var rowValues = sheet.getRange(r, 1, 1, 6).getValues()[0];
        var rId = String(rowValues[0] || '');
        var rTitle = String(rowValues[4] || '').trim();
        var rAmt = Number(rowValues[5]) || 0;
        if ((rAmt === 0 && (rTitle === 'รายการ' || rTitle === '')) || rId === 'test-dummy-id') {
          sheet.deleteRow(r);
          deletedCount++;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({result: 'success', cleaned: deletedCount})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2.3 แก้ไขรายการ (UPDATE)
  if (action === 'update_transaction') {
    var updRow = findRowById(sheet, data.id);
    var rowData = formatTxRow(data);
    if (updRow > 0) {
      sheet.getRange(updRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return ContentService.createTextOutput(JSON.stringify({result: 'success', action: 'updated'})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2.4 บันทึกแบบชุด (BATCH SYNC)
  if (action === 'batch_sync' && Array.isArray(data.transactions)) {
    var existingIds = getExistingIds(sheet);
    var rowsToAppend = [];
    for (var i = 0; i < data.transactions.length; i++) {
      var t = data.transactions[i];
      if (!t.id || existingIds[t.id]) continue;
      if (Number(t.amount) === 0 && (String(t.title).trim() === 'รายการ' || !t.title)) continue;
      existingIds[t.id] = true;
      rowsToAppend.push(formatTxRow(t));
    }
    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    }
    return ContentService.createTextOutput(JSON.stringify({result: 'success', added: rowsToAppend.length})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2.5 บันทึกเดี่ยว (ADD) - ห้ามบันทึกรายการ 0 บาทที่มีชื่อว่า 'รายการ'
  if (Number(data.amount) === 0 && (String(data.title).trim() === 'รายการ' || !data.title)) {
    return ContentService.createTextOutput(JSON.stringify({result: 'skipped_ghost'})).setMimeType(ContentService.MimeType.JSON);
  }

  var existRow = findRowById(sheet, data.id);
  if (existRow > 0) {
    sheet.getRange(existRow, 1, 1, formatTxRow(data).length).setValues([formatTxRow(data)]);
  } else {
    sheet.appendRow(formatTxRow(data));
  }
  
  return ContentService.createTextOutput(JSON.stringify({result: 'success'})).setMimeType(ContentService.MimeType.JSON);
}

// ฟังก์ชันสำหรับกดรันใน Google Apps Script เพื่อล้างแถวผี 0 บ. ทันที
function cleanGhostRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var count = 0;
  for (var r = lastRow; r >= 2; r--) {
    var rowValues = sheet.getRange(r, 1, 1, 6).getValues()[0];
    var rTitle = String(rowValues[4] || '').trim();
    var rAmt = Number(rowValues[5]) || 0;
    var rId = String(rowValues[0] || '');
    if ((rAmt === 0 && (rTitle === 'รายการ' || rTitle === '')) || rId === 'test-dummy-id') {
      sheet.deleteRow(r);
      count++;
    }
  }
  Logger.log("Deleted " + count + " ghost rows");
}

function formatTxRow(data) {
  return [
    data.id || ('tx-' + Date.now()),
    data.date || '',
    data.type === 'expense' ? 'รายจ่าย' : 'รายรับ',
    data.categoryLabel || 'ทั่วไป',
    data.title || 'รายการ',
    Number(data.amount) || 0,
    Number(data.quantity) || 1,
    data.unit || '',
    mapRecorderName(data.recordedBy),
    data.notes || '',
    data.cycleId || '',
    data.paymentStatus === 'credit' ? 'เงินเชื่อ' : 'เงินสด',
    data.creditorName || '',
    mapRecorderName(data.paidBy || data.recordedBy),
    Number(data.harvestWeight) || 0
  ];
}

function findRowById(sheet, id) {
  if (!id) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 2;
    }
  }
  return -1;
}

function getExistingIds(sheet) {
  var ids = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (values[i][0]) ids[String(values[i][0])] = true;
    }
  }
  return ids;
}

function mapRecorderName(val) {
  if (val === 'dad') return 'พ่อ';
  if (val === 'mom') return 'แม่';
  if (val === 'sibling') return 'พี่';
  if (val === 'me') return 'เรา';
  return val || 'เรา';
}

function mapRecorder(val) {
  if (val === 'พ่อ') return 'dad';
  if (val === 'แม่') return 'mom';
  if (val === 'พี่') return 'sibling';
  if (val === 'เรา') return 'me';
  return val || 'me';
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
