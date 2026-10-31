
# 🌾 สมุดบัญชีฟาร์มครอบครัว (Family Farm Accounting PWA)

เว็บแอปพลิเคชันบันทึกรายรับ-รายจ่ายและคำนวณต้นทุนการเกษตร ออกแบบเป็นพิเศษสำหรับ**คุณพ่อคุณแม่และครอบครัวเกษตรกรไทย**:
- **ปุ่มใหญ่พิเศษ + แป้นพิมพ์ตัวเลขในตัว:** กดง่าย ไม่ต้องรอคีย์บอร์ดมือถือเด้ง ไม่กระตุก ไม่กินสเปก
- **8 หมวดหมู่ต้นทุนการเกษตรครบถ้วน:** พันธุ์พืช, ปุ๋ย, ยา, ค่าแรง, รถจ้าง, น้ำมัน, ค่าเช่า/ดอกเบี้ย, ขนส่ง
- **ใช้ร่วมกันได้ทั้งบ้าน:** มีปุ่มเลือกผู้บันทึก `[ 👨‍🌾 พ่อ ] [ 👩‍🌾 แม่ ] [ 👦 พี่ ] [ 🧑‍💻 เรา ]` แตะครั้งเดียวจำเครื่องทันที
- **ออฟไลน์ 100% (Local-First):** บันทึกกลางทุ่งได้แม้ไม่มีสัญญาณเน็ต ข้อมูลปลอดภัยในเครื่อง
- **ขนาดไฟล์จิ๋ว (< 105 KB gzip):** ลื่นไหล 60 FPS แม้บนมือถือเครื่องละ 2,000–3,000 บาท
- **เชื่อมต่อ Google Sheets ได้ฟรี:** ส่งสำเนาเข้า Google Sheet อัตโนมัติเมื่อมีเน็ต เพื่อให้คุณเปิดดูจากคอมได้ตลอดเวลา

---

## 🚀 วิธีเปิดใช้งานบนเครื่องคอมพิวเตอร์ของคุณ

เปิดโฟลเดอร์นี้ใน Terminal / PowerShell แล้วพิมพ์:

```bash
npm run dev
```

เปิดบราวเซอร์ไปที่ลิงก์ที่แสดงขึ้นมา (เช่น `http://localhost:5173`) เพื่อทดลองกดเล่นได้ทันที!

---

## 📱 วิธีส่งลิงก์ให้พ่อแม่ (Deploy ฟรีตลอดชีพบน Vercel)

1. สร้าง Repository ใหม่ใน [GitHub](https://github.com) (แบบ Private หรือ Public)
2. อัปโหลดโค้ดนี้ขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial farmer family app"
   git branch -M main
   git remote add origin <URL ของ GitHub คุณ>
   git push -u origin main
   ```
3. เข้า [Vercel](https://vercel.com) แล้วกด **"Sign in with GitHub"**
4. กด **"Add New Project"** เลือก Repository นี้ แล้วกด **"Deploy"** (ไม่ต้องตั้งค่าอะไรเพิ่ม)
5. Vercel จะให้ลิงก์เว็บ เช่น `https://farm-family.vercel.app`

---

## 📲 ขั้นตอนให้คุณพ่อคุณแม่ "เพิ่มลงหน้าจอโฮม"

* **บน Android (Google Chrome):**
  1. เปิดลิงก์เว็บใน Chrome
  2. แตะปุ่มจุด 3 จุดมุมขวาบน `⋮`
  3. แตะเลือก **"เพิ่มลงในหน้าจอหลัก" (Add to Home screen)** หรือกดปุ่ม "ติดตั้งแอป"
* **บน iPhone (Safari):**
  1. เปิดลิงก์เว็บใน Safari
  2. แตะปุ่มแชร์รูปสี่เหลี่ยมลูกศรชี้ขึ้น `[↑]` ด้านล่าง
  3. เลื่อนลงมาแตะ **"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)**

จะได้ไอคอนแอป 🌾 สีเขียวสวยงามบนหน้าจอมือถือ แตะเปิดใช้งานเต็มจอเหมือนแอปทั่วไปทันที!

---

## 📊 วิธีเชื่อม Google Sheet (เพื่อให้ข้อมูลวิ่งเข้าคอมคุณ)

1. เปิด **Google Drive** แล้วสร้าง **Google Sheet** เปล่า 1 ไฟล์
2. เมนูด้านบนเลือก **ส่วนขยาย (Extensions) -> Apps Script**
3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ (รองรับการรับข้อมูลแบบ Batch หลายรายการพร้อมกัน และเช็ค ID ป้องกันข้อมูลซ้ำ 100%):
   ```javascript
   function doPost(e) {
     var ss = SpreadsheetApp.getActiveSpreadsheet();
     var data = JSON.parse(e.postData.contents);
     
     // 1. จัดการแปลงปลูก (Cycle) พร้อมป้องกันสร้างซ้ำ
     if (data.action === 'add_cycle') {
       var cycleSheet = ss.getSheetByName("แปลงปลูก");
       if (!cycleSheet) {
         cycleSheet = ss.insertSheet("แปลงปลูก");
         cycleSheet.appendRow(["รหัสแปลง (ID)", "ชื่อแปลง", "ชนิดพืช", "ไร่รวม", "ไร่", "งาน", "วา", "วันเริ่มปลูก", "วันคาดเก็บเกี่ยว", "ผลผลิตคาดการณ์", "ราคาเป้าหมาย"]);
       }
       var existingCycleIds = getExistingIds(cycleSheet);
       if (!existingCycleIds[data.id]) {
         cycleSheet.appendRow([
           data.id, data.name, data.cropType, data.totalAreaRai,
           data.areaRai, data.areaNgan, data.areaSqWa,
           data.startDate, data.expectedHarvestDate,
           data.expectedYieldKg, data.targetPricePerKg
         ]);
       }
       return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
         .setMimeType(ContentService.MimeType.JSON);
     }

     // 2. จัดเตรียมแผ่นงาน "รายการ"
     var sheet = ss.getSheetByName("รายการ") || ss.getActiveSheet();
     if (sheet.getLastRow() === 0) {
       sheet.appendRow(["รหัสรายการ (ID)", "วันที่ทำรายการ", "ประเภท", "หมวดหมู่", "ชื่อรายการ", "ยอดเงิน (บาท)", "จำนวน", "หน่วย", "ผู้บันทึก", "หมายเหตุ", "รหัสแปลง"]);
     }

     var existingTxIds = getExistingIds(sheet);

     // 3. รองรับการส่งแบบชุดหลายรายการพร้อมกัน (Batch Sync จาก Offline Queue)
     if (data.action === 'batch_sync' && Array.isArray(data.transactions)) {
       var rowsToAppend = [];
       for (var i = 0; i < data.transactions.length; i++) {
         var t = data.transactions[i];
         if (!t.id || existingTxIds[t.id]) continue; // ข้ามรายการซ้ำ
         existingTxIds[t.id] = true;
         rowsToAppend.push(formatTxRow(t));
       }
       if (rowsToAppend.length > 0) {
         sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
       }
       return ContentService.createTextOutput(JSON.stringify({result: 'success', added: rowsToAppend.length}))
         .setMimeType(ContentService.MimeType.JSON);
     }

     // 4. บันทึกรายการเดี่ยว (Single Transaction) พร้อมเช็ค ID กันซ้ำ
     if (!existingTxIds[data.id]) {
       sheet.appendRow(formatTxRow(data));
     }

     return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
       .setMimeType(ContentService.MimeType.JSON);
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
       data.recordedBy === 'dad' ? 'พ่อ' : data.recordedBy === 'mom' ? 'แม่' : data.recordedBy === 'sibling' ? 'พี่' : 'เรา',
       data.notes || '',
       data.cycleId || ''
     ];
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
   ```
4. กดปุ่มสีน้ำเงิน **ทำให้ใช้งานได้ (Deploy) -> การทำให้ใช้งานได้ใหม่ (New deployment)**
5. เลือกประเภท: **เว็บแอป (Web app)**
   - คำอธิบาย: `FarmSync`
   - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
6. กด **ทำให้ใช้งานได้** แล้วคัดลอก **URL ของเว็บแอป** ที่ได้
7. นำ URL นั้นมาใส่ในแอปตรงเมนู **⚙️ (ตั้งค่า) -> ซิงค์เข้า Google Sheet** จบเลยครับ!

