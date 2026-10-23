import React, { useState } from 'react';
import { X, Download, Upload, Cloud, Copy, Check, Trash2, Share2, RefreshCw } from 'lucide-react';
import { db, clearAllData } from '../db/db';
import { FULL_APPS_SCRIPT_CODE, syncFromGoogleSheets, DEFAULT_WEBHOOK_URL } from '../services/cloudSync';

interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetWebhookUrl?: string;
  onSaveWebhookUrl: (url: string) => void;
  onSyncComplete?: () => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  googleSheetWebhookUrl = '',
  onSaveWebhookUrl,
  onSyncComplete
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState<string>(googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string>('');

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FULL_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveUrl = () => {
    onSaveWebhookUrl(url);
    alert('✅ บันทึกลิงก์ Google Sheets เรียบร้อย');
  };

  // 3. ซิงค์ดึงข้อมูลลงมาทันที
  const handleManualSync = async () => {
    if (!url) {
      alert('กรุณากรอกลิงก์ Webhook ก่อนกดซิงค์ครับ');
      return;
    }
    setSyncLoading(true);
    setSyncMsg('กำลังดึงข้อมูลจาก Google Sheets...');
    const res = await syncFromGoogleSheets(url);
    setSyncLoading(false);
    setSyncMsg(res.message);
    if (res.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  // 4. สร้างลิงก์ส่งให้คนในบ้าน (มีรหัสซิงค์ในตัว ไม่ต้องนั่งพิมพ์ URL เอง)
  const handleCopyShareLink = () => {
    if (!url) {
      alert('กรุณาบันทึกลิงก์ Webhook ก่อนคัดลอกลิงก์แชร์ครับ');
      return;
    }
    const origin = window.location.origin;
    const shareLink = `${origin}?sync=${encodeURIComponent(url.trim())}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold">สำรองข้อมูล & ซิงค์ข้ามเครื่อง</h2>
              <p className="text-xs text-slate-300">ซิงค์ให้พ่อแม่เห็นรายการตรงกัน</p>
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
          
          {/* หมวดที่ 1: ซิงค์ข้ามเครื่องผ่าน Google Sheets */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-700" />
                ซิงค์ข้ามเครื่อง (มือถือพ่อ/แม่/พี่/เรา)
              </h3>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                เห็นข้อมูลตรงกัน
              </span>
            </div>

            <p className="text-emerald-800 text-[11px] leading-relaxed">
              เพื่อให้ประวัติการบันทึกและแปลงเพาะปลูกขึ้นโชว์บนมือถือทุกเครื่องพร้อมกัน ให้ใส่ลิงก์ Google Sheets Webhook ด้านล่าง:
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
                  className="px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold btn-touch-active shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </div>

            {/* ปุ่มกดดึงข้อมูล & ปุ่มคัดลอกลิงก์ส่งให้พ่อแม่ */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleManualSync}
                disabled={syncLoading}
                className="py-2.5 px-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs btn-touch-active text-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'กำลังซิงค์...' : 'ดึงข้อมูลชีทตอนนี้'}</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="py-2.5 px-2 bg-white hover:bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs btn-touch-active text-center"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'ส่งลิงก์ให้พ่อแม่ (LINE)'}</span>
              </button>
            </div>

            {syncMsg && (
              <div className="p-2 bg-white rounded-xl border border-emerald-300 text-emerald-800 font-bold text-[11px] text-center">
                {syncMsg}
              </div>
            )}

            {/* โค้ด Apps Script ฉบับสมบูรณ์ */}
            <div className="pt-2 border-t border-emerald-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700 text-[11px]">
                  โค้ด Google Apps Script (รองรับซิงค์ 2 ทาง):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-2 rounded-xl text-[10px] overflow-x-auto max-h-24 font-mono">
                {FULL_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>

          {/* หมวดที่ 2: สำรองข้อมูลลงโทรศัพท์ (ไฟล์ JSON) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span>💾</span> สำรองข้อมูลเป็นไฟล์
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleExportBackup}
                className="py-2.5 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active"
              >
                <Download className="w-4 h-4" />
                <span>สำรอง (เซฟไฟล์)</span>
              </button>

              <label className="py-2.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs btn-touch-active text-center">
                <Upload className="w-4 h-4" />
                <span>กู้คืน (เปิดไฟล์)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* หมวดที่ 3: ล้างข้อมูลทั้งหมดในเครื่อง (เริ่มต้นใหม่เป็น 0) */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              ล้างข้อมูลในเครื่องให้เป็น 0 (เริ่มต้นใหม่)
            </h3>
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
