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
3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้:
   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var data = JSON.parse(e.postData.contents);
     sheet.appendRow([
       new Date(),
       data.date,
       data.type === 'expense' ? 'รายจ่าย' : 'รายรับ',
       data.categoryLabel,
       data.title,
       data.amount,
       data.quantity || 1,
       data.unit || '',
       data.recordedBy,
       data.notes || ''
     ]);
     return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
4. กดปุ่มสีน้ำเงิน **ทำให้ใช้งานได้ (Deploy) -> การทำให้ใช้งานได้ใหม่ (New deployment)**
5. เลือกประเภท: **เว็บแอป (Web app)**
   - คำอธิบาย: `FarmSync`
   - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
6. กด **ทำให้ใช้งานได้** แล้วคัดลอก **URL ของเว็บแอป** ที่ได้
7. นำ URL นั้นมาใส่ในแอปตรงเมนู **⚙️ (ตั้งค่า) -> ซิงค์เข้า Google Sheet** จบเลยครับ!
