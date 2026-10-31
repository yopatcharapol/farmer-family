import React, { useState } from 'react';
import { X, Download, Upload, Cloud, Copy, Check, Trash2, Share2, RefreshCw, KeyRound, UserPlus, Users } from 'lucide-react';
import { db, clearAllData } from '../db/db';
import { FULL_APPS_SCRIPT_CODE, syncFromGoogleSheets, DEFAULT_WEBHOOK_URL } from '../services/cloudSync';
import { FamilyMember, DEFAULT_FAMILY_MEMBERS } from '../types';

interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetWebhookUrl?: string;
  familyMembers?: FamilyMember[];
  resetPin?: string;
  onSaveWebhookUrl: (url: string) => void;
  onUpdateFamilyMembers?: (members: FamilyMember[]) => void;
  onSyncComplete?: () => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  googleSheetWebhookUrl = '',
  familyMembers = DEFAULT_FAMILY_MEMBERS,
  resetPin = '1234',
  onSaveWebhookUrl,
  onUpdateFamilyMembers,
  onSyncComplete
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState<string>(googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string>('');

  // [#25] จัดการสมาชิกในบ้าน
  const [members, setMembers] = useState<FamilyMember[]>(familyMembers);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('🧑‍🌾');

  // [#25] รหัสผ่านยืนยันการล้างข้อมูล
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');

  // 1. ส่งออกไฟล์สำรองข้อมูล (JSON)
  const handleExportBackup = async () => {
    try {
      const cycles = await db.cycles.toArray();
      const transactions = await db.transactions.toArray();
      const settings = await db.settings.toArray();
      const inventory = await db.inventory.toArray();
      const plotLogs = await db.plotLogs.toArray();

      const backupData = {
        version: 3,
        exportedAt: new Date().toISOString(),
        cycles,
        transactions,
        settings,
        inventory,
        plotLogs
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

  // 1.1 ส่งออกเป็นไฟล์ CSV
  const handleExportCsv = async () => {
    try {
      const transactions = await db.transactions.toArray();
      if (transactions.length === 0) {
        alert('ยังไม่มีรายการบันทึกสำหรับส่งออกไฟล์ CSV');
        return;
      }
      const headers = ['รหัสรายการ', 'วันที่', 'ประเภท', 'หมวดหมู่', 'ชื่อรายการ', 'ยอดเงิน(บาท)', 'จำนวน', 'หน่วย', 'ผู้บันทึก', 'คนจ่ายเงิน', 'การจ่าย', 'เจ้าหนี้', 'หมายเหตุ', 'รหัสแปลง'];
      const rows = transactions.map(t => [
        t.id,
        t.date,
        t.type === 'expense' ? 'รายจ่าย' : 'รายรับ',
        `"${(t.categoryLabel || '').replace(/"/g, '""')}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.amount,
        t.quantity || 1,
        `"${(t.unit || '').replace(/"/g, '""')}"`,
        t.recordedBy,
        t.paidBy || '',
        t.paymentStatus === 'credit' ? 'เงินเชื่อ' : 'เงินสด',
        `"${(t.creditorName || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        t.cycleId || ''
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `บัญชีฟาร์ม_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      alert('✅ ส่งออกไฟล์ CSV เรียบร้อย! เปิดใน Excel ภาษาไทยไม่เพี้ยน');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
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
            if (data.inventory) {
              await db.inventory.clear();
              await db.inventory.bulkAdd(data.inventory);
            }
            if (data.plotLogs) {
              await db.plotLogs.clear();
              await db.plotLogs.bulkAdd(data.plotLogs);
            }
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

  // 4. ส่งลิงก์แชร์
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

  // เพิ่มสมาชิกในบ้าน
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    const updated = [
      ...members,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'สมาชิกในบ้าน',
        avatar: newMemberAvatar
      }
    ];
    setMembers(updated);
    setNewMemberName('');
    setNewMemberRole('');
    if (onUpdateFamilyMembers) onUpdateFamilyMembers(updated);
    await db.settings.update('default', { familyMembers: updated });
  };

  // แก้ไขชื่อสมาชิก
  const handleUpdateMemberName = async (id: string, newName: string) => {
    const updated = members.map((m) => (m.id === id ? { ...m, name: newName } : m));
    setMembers(updated);
    if (onUpdateFamilyMembers) onUpdateFamilyMembers(updated);
    await db.settings.update('default', { familyMembers: updated });
  };

  // ยืนยันรหัส PIN เพื่อล้างข้อมูล
  const handleConfirmPinClear = async () => {
    if (inputPin.trim() === resetPin.trim() || inputPin.trim() === 'CONFIRM') {
      await clearAllData();
      setIsPinModalOpen(false);
      alert('✅ ล้างข้อมูลในเครื่องเรียบร้อยแล้ว หน้าเว็บจะรีโหลดใหม่');
      window.location.reload();
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234 หรือพิมพ์ CONFIRM)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold">สำรองข้อมูล & ตั้งค่าระบบ</h2>
              <p className="text-xs text-slate-300">ซิงค์ข้ามเครื่อง & จัดการสมาชิกในบ้าน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          
          {/* หมวดที่ 1: ซิงค์ข้ามเครื่องผ่าน Google Sheets */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-700" />
                ซิงค์ข้ามเครื่อง (มือถือพ่อ/แม่/พี่/เรา)
              </h3>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                เห็นข้อมูลตรงกัน
              </span>
            </div>

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

            <div className="pt-2 border-t border-emerald-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700 text-[11px]">
                  โค้ด Google Apps Script ฉบับเต็ม (รองรับ Update & Delete):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-2 rounded-xl text-[10px] overflow-x-auto max-h-20 font-mono">
                {FULL_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>

          {/* หมวดที่ 2: [#25] จัดการสมาชิกในครอบครัว */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-700" />
              <span>สมาชิกในครอบครัว (แก้ไขชื่อได้เอง):</span>
            </h3>

            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-xl">{m.avatar}</span>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => handleUpdateMemberName(m.id, e.target.value)}
                    className="flex-1 font-bold text-xs bg-transparent border-b border-dashed border-slate-300 py-0.5 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">{m.role}</span>
                </div>
              ))}
            </div>

            {/* เพิ่มสมาชิกใหม่ */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">เพิ่มสมาชิกในบ้านคนใหม่:</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="ชื่อ เช่น ลุงสมศักดิ์..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl p-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-3 bg-slate-800 text-white rounded-xl font-bold btn-touch-active text-xs"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>

          {/* หมวดที่ 3: สำรองข้อมูลฉุกเฉินและส่งออกไฟล์ (JSON & CSV) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>💾</span> สำรองข้อมูลฉุกเฉิน (ย้ายเครื่อง / เปิดใน Excel)
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleExportBackup}
                className="py-2.5 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>สำรอง (ไฟล์ JSON)</span>
              </button>

              <label className="py-2.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs btn-touch-active text-center min-h-[44px]">
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

            <button
              onClick={handleExportCsv}
              className="w-full py-2.5 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs btn-touch-active text-xs min-h-[44px]"
            >
              <span>📊</span>
              <span>ส่งออกไฟล์ตาราง Excel / CSV (ภาษาไทย)</span>
            </button>
          </div>

          {/* หมวดที่ 4: ล้างข้อมูลทั้งหมดในเครื่อง (ป้องกันด้วย PIN) */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-rose-800 text-xs sm:text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              ล้างข้อมูลทั้งหมดในเครื่องเป็น 0 (มีรหัสล็อก PIN)
            </h3>
            <p className="text-rose-700 text-[11px] leading-relaxed">
              ป้องกันการเผลอกดโดนโดยไม่ตั้งใจ ต้องใส่รหัส PIN เพื่อยืนยันการล้างข้อมูล
            </p>
            <button
              onClick={() => {
                setInputPin('');
                setPinError('');
                setIsPinModalOpen(true);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active text-xs min-h-[44px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>ยืนยันรหัส PIN เพื่อล้างข้อมูล</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>

      {/* Modal ใส่รหัส PIN ก่อนล้างข้อมูล */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-xs w-full p-5 rounded-3xl space-y-3 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
              🔒
            </div>
            <h3 className="font-bold text-slate-900 text-sm">กรอกรหัส PIN ยืนยันการลบ</h3>
            <p className="text-[11px] text-slate-500">
              กรุณากรอกรหัส PIN (ค่าเริ่มต้น 1234 หรือพิมพ์ CONFIRM) เพื่อล้างข้อมูลทั้งหมด
            </p>
            <input
              type="password"
              placeholder="รหัส PIN..."
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              className="w-full text-center text-lg font-black tracking-widest border border-slate-300 rounded-xl p-2"
            />
            {pinError && <div className="text-rose-600 text-[10px] font-bold">{pinError}</div>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmPinClear}
                className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
