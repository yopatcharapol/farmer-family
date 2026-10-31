import React from 'react';
import { CropCycle, Transaction } from '../types';
import {
  formatAreaThai,
  formatDateThai,
  calculateDaysElapsed,
  CROP_CONFIGS,
  formatNumber
} from '../utils/thaiAgUnits';
import { ChevronDown, PlusCircle, Settings2, BookOpen, Clock, Sprout } from 'lucide-react';

interface CycleCardProps {
  currentCycle?: CropCycle;
  cycles: CropCycle[];
  transactions?: Transaction[];
  onSelectCycle: (cycleId: string) => void;
  onOpenAddCycle: () => void;
  onOpenManagePlot?: () => void;
  onOpenPlotLogs?: () => void;
}

export const CycleCard: React.FC<CycleCardProps> = ({
  currentCycle,
  cycles,
  transactions = [],
  onSelectCycle,
  onOpenAddCycle,
  onOpenManagePlot,
  onOpenPlotLogs
}) => {
  // ข้อมูลอายุพืชและการเติบโต
  const daysElapsed = currentCycle ? calculateDaysElapsed(currentCycle.startDate) : 0;
  const cropConfig = currentCycle ? CROP_CONFIGS[currentCycle.cropType] : undefined;
  const totalDays = cropConfig?.daysToHarvest || 120;
  const progressPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  // หามะเร็งระยะการดูแล (Milestone)
  let currentStageLabel = 'กำลังเพาะปลูก';
  if (cropConfig?.defaultStages) {
    const sorted = [...cropConfig.defaultStages].sort((a, b) => a.day - b.day);
    for (const s of sorted) {
      if (daysElapsed >= s.day) {
        currentStageLabel = s.label;
      }
    }
  }

  // [#18] คำนวณน้ำหนักผลผลิตสะสมในแปลงนี้ (กก.)
  let cumulativeYieldKg = 0;
  if (currentCycle) {
    transactions
      .filter((t) => t.cycleId === currentCycle.id && t.type === 'income' && !t.isDeleted && t.harvestWeight)
      .forEach((t) => {
        cumulativeYieldKg += t.harvestWeight || 0;
      });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-3 font-sans">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
          <span>แปลงและรอบการปลูกปัจจุบัน</span>
        </span>
        <div className="flex items-center gap-2">
          {currentCycle && onOpenManagePlot && (
            <button
              onClick={onOpenManagePlot}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 btn-touch-active"
              title="แก้ไขหรือปิดรอบแปลงนี้"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>จัดการแปลง</span>
            </button>
          )}
          <button
            onClick={onOpenAddCycle}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 btn-touch-active"
          >
            <PlusCircle className="w-4 h-4" />
            <span>เพิ่มแปลง</span>
          </button>
        </div>
      </div>

      {currentCycle ? (
        <div>
          {/* Dropdown เปลี่ยนแปลงปลูก */}
          <div className="relative mb-2">
            <select
              value={currentCycle.id}
              onChange={(e) => onSelectCycle(e.target.value)}
              className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  🌾 {c.name.includes('?') ? 'แปลงเพาะปลูก' : c.name} ({c.totalAreaRai} ไร่) {c.status === 'closed' ? '(ปิดรอบ)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* รายละเอียดพื้นที่ วันที่ และผลผลิตสะสม */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100">
            <div>
              <span className="text-slate-500 block text-[11px]">ขนาดพื้นที่แปลง:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatAreaThai(currentCycle.areaRai, currentCycle.areaNgan, currentCycle.areaSqWa)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">คาดเก็บเกี่ยว:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatDateThai(currentCycle.expectedHarvestDate)}
              </span>
            </div>
          </div>

          {/* [#16] แถบแสดงอายุพืชและไทม์ไลน์ระยะการดูแล (Progress Bar) */}
          <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>ปลูกมาแล้ว {daysElapsed} วัน</span>
                <span className="text-slate-400 font-normal">({progressPercent}%)</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 truncate max-w-[170px]">
                {currentStageLabel}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>เริ่ม: {formatDateThai(currentCycle.startDate)}</span>
              <span>เป้าหมาย {totalDays} วัน</span>
            </div>
          </div>

          {/* แถบเครื่องมือไดอารี่แปลง & ยอดเก็บเกี่ยวสะสม */}
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            {cumulativeYieldKg > 0 ? (
              <span className="text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg text-[11px]">
                🌾 เก็บเกี่ยวสะสม: {formatNumber(cumulativeYieldKg)} กก.
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">ยังไม่มีรอบเก็บเกี่ยว</span>
            )}

            {onOpenPlotLogs && (
              <button
                type="button"
                onClick={onOpenPlotLogs}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700 flex items-center gap-1 btn-touch-active shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>ไดอารี่แปลง</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-2">ยังไม่มีแปลงเพาะปลูก</p>
          <button
            onClick={onOpenAddCycle}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md btn-touch-active"
          >
            + สร้างแปลงปลูกแรก
          </button>
        </div>
      )}
    </div>
  );
};
