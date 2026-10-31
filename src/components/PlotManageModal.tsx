import React, { useState } from 'react';
import { X, Edit3, CheckCircle, Trash2, Archive, AlertCircle } from 'lucide-react';
import { CropCycle, Transaction } from '../types';
import { calculateTotalRai, formatMoney, formatAreaThai, formatDateThai } from '../utils/thaiAgUnits';
import { db } from '../db/db';
import { pushCycleToGoogleSheets, DEFAULT_WEBHOOK_URL } from '../services/cloudSync';

interface PlotManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCycle?: CropCycle;
  cycles: CropCycle[];
  transactions: Transaction[];
  onSelectCycle: (cycleId: string) => void;
}

export const PlotManageModal: React.FC<PlotManageModalProps> = ({
  isOpen,
  onClose,
  currentCycle,
  cycles,
  transactions,
  onSelectCycle
}) => {
  if (!isOpen || !currentCycle) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentCycle.name);
  const [areaRai, setAreaRai] = useState(String(currentCycle.areaRai || 0));
  const [areaNgan, setAreaNgan] = useState(String(currentCycle.areaNgan || 0));
  const [areaSqWa, setAreaSqWa] = useState(String(currentCycle.areaSqWa || 0));

  // คำนวณรายรับ รายจ่าย กำไร ของแปลงนี้
  const plotTxs = transactions.filter((t) => t.cycleId === currentCycle.id && !t.isDeleted);
  let plotIncome = 0;
  let plotExpense = 0;
  plotTxs.forEach((t) => {
    if (t.type === 'income') plotIncome += t.amount;
    else if (t.type === 'expense') plotExpense += t.amount;
  });
  const plotProfit = plotIncome - plotExpense;

  // บันทึกการแก้ไขแปลง
  const handleSaveEdit = async () => {
    const rai = Number(areaRai) || 0;
    const ngan = Number(areaNgan) || 0;
    const sqWa = Number(areaSqWa) || 0;
    const totalRai = calculateTotalRai(rai, ngan, sqWa);

    const updatedCycle: CropCycle = {
      ...currentCycle,
      name: name.trim() || currentCycle.name,
      areaRai: rai,
      areaNgan: ngan,
      areaSqWa: sqWa,
      totalAreaRai: totalRai,
      updatedAt: Date.now()
    };

    await db.cycles.put(updatedCycle);

    const settings = await db.settings.get('default');
    if (settings?.googleSheetWebhookUrl) {
      pushCycleToGoogleSheets(settings.googleSheetWebhookUrl, updatedCycle);
    }

    setIsEditing(false);
  };

  // ปิดรอบการปลูก (เก็บเกี่ยวเสร็จ ย้ายไปประวัติ)
  const handleCloseCycle = async () => {
    if (confirm(`ยืนยันการ "ปิดรอบการปลูก" ของแปลง "${currentCycle.name}" หรือไม่?\n\nระบบจะสรุปกำไรสุทธิ (${formatMoney(plotProfit)} บาท) และบันทึกเข้าประวัติ`)) {
      const closedCycle: CropCycle = {
        ...currentCycle,
        status: 'closed',
        closedAt: Date.now(),
        finalProfit: plotProfit,
        finalRevenue: plotIncome,
        finalExpense: plotExpense,
        updatedAt: Date.now()
      };

      await db.cycles.put(closedCycle);

      const settings = await db.settings.get('default');
      if (settings?.googleSheetWebhookUrl) {
        pushCycleToGoogleSheets(settings.googleSheetWebhookUrl, closedCycle);
      }

      // สลับไปแปลงอื่นที่ยัง active อยู่
      const otherActive = cycles.find((c) => c.id !== currentCycle.id && c.status === 'active');
      if (otherActive) {
        onSelectCycle(otherActive.id);
      }
      onClose();
    }
  };

  // ลบแปลง
  const handleDeleteCycle = async () => {
    if (confirm(`⚠️ ยืนยันการลบแปลง "${currentCycle.name}" หรือไม่?\n\n(รายการบัญชีที่บันทึกไว้ในแปลงนี้จะถูกลบออกด้วย)`)) {
      await db.cycles.delete(currentCycle.id);
      await db.transactions.where('cycleId').equals(currentCycle.id).delete();
      await db.plotLogs.where('plotId').equals(currentCycle.id).delete();

      const remaining = cycles.filter((c) => c.id !== currentCycle.id);
      if (remaining.length > 0) {
        onSelectCycle(remaining[0].id);
      } else {
        onSelectCycle('');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <h2 className="text-base font-bold">จัดการแปลงเพาะปลูก</h2>
              <p className="text-xs text-emerald-200">แก้ไขข้อมูล, ปิดรอบเก็บเกี่ยว หรือลบแปลง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* ข้อมูลแปลงปัจจุบัน */}
          {!isEditing ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    พืช: {currentCycle.cropType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{currentCycle.name}</h3>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 btn-touch-active shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขแปลง</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">ขนาดพื้นที่:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatAreaThai(currentCycle.areaRai, currentCycle.areaNgan, currentCycle.areaSqWa)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">({currentCycle.totalAreaRai} ไร่)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันเริ่มปลูก:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDateThai(currentCycle.startDate)}
                  </span>
                </div>
              </div>

              {/* สรุปการเงินประจำแปลง */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-1 text-center mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">ต้นทุนสะสม</span>
                  <span className="font-bold text-rose-600 text-xs">-{formatMoney(plotExpense)} บ.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">รายรับที่ได้</span>
                  <span className="font-bold text-emerald-600 text-xs">+{formatMoney(plotIncome)} บ.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">กำไรสุทธิ</span>
                  <span className={`font-black text-xs ${plotProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {plotProfit >= 0 ? '+' : ''}{formatMoney(plotProfit)} บ.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ฟอร์มแก้ไขแปลง */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">แก้ไขข้อมูลแปลง:</span>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 text-xs">ยกเลิก</button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">ชื่อแปลงเพาะปลูก:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">ขนาดพื้นที่แปลง:</label>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <input
                      type="number"
                      value={areaRai}
                      onChange={(e) => setAreaRai(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-bold text-center text-xs"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">ไร่</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={areaNgan}
                      onChange={(e) => setAreaNgan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-bold text-center text-xs"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">งาน</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={areaSqWa}
                      onChange={(e) => setAreaSqWa(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-bold text-center text-xs"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">ตร.ว.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs btn-touch-active"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          )}

          {/* ปุ่มปิดรอบการปลูก (เมื่อเก็บเกี่ยวเสร็จ) */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
            <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-amber-700" />
              <span>ปิดรอบการปลูก (เก็บเกี่ยวเสร็จแล้ว)</span>
            </h4>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              เมื่อเก็บเกี่ยวและขายผลผลิตหมดแล้ว ให้กดปิดรอบเพื่อสรุปผลกำไร-ขาดทุน และเก็บเป็นประวัติย้อนหลัง
            </p>
            <button
              onClick={handleCloseCycle}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs btn-touch-active min-h-[44px]"
            >
              🏁 ปิดรอบการปลูกนี้และสรุปกำไร
            </button>
          </div>

          {/* ปุ่มลบแปลง */}
          <div className="pt-2">
            <button
              onClick={handleDeleteCycle}
              className="w-full py-2.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 btn-touch-active min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>ลบแปลงนี้ทิ้งอย่างถาวร</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
