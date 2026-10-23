import React, { useState } from 'react';
import { X, Download, Upload, Cloud, Copy, Check, Trash2 } from 'lucide-react';
import { db, clearAllData } from '../db/db';

interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetWebhookUrl?: string;
  onSaveWebhookUrl: (url: string) => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  googleSheetWebhookUrl = '',
  onSaveWebhookUrl
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState<string>(googleSheetWebhookUrl);
  const [copied, setCopied] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // 1. ส่งออกไฟล์สำรองข้อมูล (JSON)
  const handleExportBackup = async () => {
    try {
      const cycles = await db.cycles.toArray();
      const transactions = await db.transactions.toArray();
      const settings = await db.settings.toArray();

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        cycles,
        transactions,
        settings
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `สำรองข้อมูลฟาร์ม_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      alert('✅ สำรองข้อมูลเรียบร้อยแล้ว! ไฟล์ถูกบันทึกลงในเครื่องของคุณ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล');
    }
  };

  // 2. นำเข้าไฟล์สำรองข้อมูล
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.cycles && data.transactions) {
          if (confirm('⚠️ การกู้คืนข้อมูลจะนำข้อมูลจากไฟล์มาทับในเครื่อง ต้องการดำเนินการต่อหรือไม่?')) {
            await db.cycles.clear();
            await db.transactions.clear();
            await db.cycles.bulkAdd(data.cycles);
            await db.transactions.bulkAdd(data.transactions);
            alert('✅ นำเข้าข้อมูลสำเร็จแล้ว! หน้าเว็บจะรีโหลดใหม่');
            window.location.reload();
          }
        } else {
          alert('รูปแบบไฟล์ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('ไม่สามารถอ่านไฟล์สำรองข้อมูลนี้ได้');
      }
    };
    reader.readAsText(file);
  };

  // สคริปต์ Google Apps Script สำหรับให้ผู้ใช้ก๊อปไปวางใน Google Sheet
  const gasSampleCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // บันทึกแถวใหม่
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
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasSampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    onSaveWebhookUrl(url);
    alert('✅ บันทึกลิงก์ Google Sheets Webhook เรียบร้อย');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold">สำรองข้อมูล & เชื่อมต่อคลาวด์</h2>
              <p className="text-xs text-slate-300">ความปลอดภัยของข้อมูลฟาร์ม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 btn-touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
          
          {/* หมวดที่ 1: ดาวน์โหลดสำรองข้อมูลลงเครื่อง (ฟรี 100% ไม่ต้องใช้อินเทอร์เน็ต) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span>💾</span> สำรองข้อมูลลงโทรศัพท์ / คอมพิวเตอร์
            </h3>
            <p className="text-slate-500 text-[11px] mb-3">
              ข้อมูลทั้งหมดอยู่ในเครื่องคุณ สามารถกดดาวน์โหลดเก็บไว้ หรือนำไปย้ายเครื่องได้ตลอดเวลา
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active"
              >
                <Download className="w-4 h-4" />
                <span>สำรองข้อมูล (เซฟไฟล์)</span>
              </button>

              <label className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs btn-touch-active text-center">
                <Upload className="w-4 h-4" />
                <span>กู้คืนข้อมูล (เปิดไฟล์)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* หมวดที่ 2: เชื่อมต่อ Google Sheets อัตโนมัติ (Zero-Server Cloud Sync) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600" />
                ซิงค์เข้า Google Sheet อัตโนมัติ
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                ฟรีตลอดชีพ
              </span>
            </div>

            <p className="text-slate-500 text-[11px]">
              ส่งสำเนาทุกรายการเข้า Google Sheets ใน Google Drive ของคุณทันทีเมื่อมีเน็ต เพื่อให้คุณเปิดดูจากคอมได้ตลอดเวลา
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                ลิงก์ Webhook จาก Google Apps Script:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono"
                />
                <button
                  onClick={handleSaveUrl}
                  className="px-3 bg-slate-800 text-white rounded-xl font-bold btn-touch-active"
                >
                  บันทึก
                </button>
              </div>
            </div>

            {/* โค้ด Apps Script สำเร็จรูป */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700 text-[11px]">
                  โค้ด Google Apps Script สั้นๆ (ก๊อปไปวางในชีท):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-2 rounded-xl text-[10px] overflow-x-auto max-h-24 font-mono">
                {gasSampleCode}
              </pre>
            </div>
          </div>

          {/* หมวดที่ 3: ล้างข้อมูลทั้งหมดในเครื่อง (เริ่มต้นใหม่เป็น 0) */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              ล้างข้อมูลในเครื่องให้เป็น 0 (เริ่มต้นใหม่)
            </h3>
            <p className="text-rose-600 text-[11px]">
              ใช้เมื่อต้องการลบแปลงและรายการบันทึกทั้งหมดออก เพื่อเริ่มจดบันทึกของจริง
            </p>
            <button
              onClick={async () => {
                if (confirm('⚠️ ยืนยันการล้างข้อมูลทั้งหมดในเครื่องให้เป็น 0 หรือไม่?\n\n(แปลงและรายการบันทึกทั้งหมดจะถูกลบออกเพื่อเริ่มต้นใหม่)')) {
                  await clearAllData();
                  alert('✅ ล้างข้อมูลในเครื่องเรียบร้อยแล้ว');
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active text-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างข้อมูลทั้งหมดในเครื่องเป็น 0</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-sm btn-touch-active"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};

