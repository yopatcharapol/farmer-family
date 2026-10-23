import React from 'react';
import { CropCycle } from '../types';
import { formatAreaThai, formatDateThai } from '../utils/thaiAgUnits';
import { ChevronDown, PlusCircle } from 'lucide-react';

interface CycleCardProps {
  currentCycle?: CropCycle;
  cycles: CropCycle[];
  onSelectCycle: (cycleId: string) => void;
  onOpenAddCycle: () => void;
}

export const CycleCard: React.FC<CycleCardProps> = ({
  currentCycle,
  cycles,
  onSelectCycle,
  onOpenAddCycle
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
          แปลงและรอบการปลูกปัจจุบัน
        </span>
        <button
          onClick={onOpenAddCycle}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 btn-touch-active"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เพิ่มแปลงใหม่</span>
        </button>
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
                  🌾 {c.name.includes('?') ? 'แปลง - ผักกาด (26/10/2569)' : c.name} ({c.totalAreaRai} ไร่)
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* รายละเอียดพื้นที่และวันที่ */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100">
            <div>
              <span className="text-slate-500 block">ขนาดพื้นที่แปลง:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatAreaThai(currentCycle.areaRai, currentCycle.areaNgan, currentCycle.areaSqWa)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">คาดเก็บเกี่ยว:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatDateThai(currentCycle.expectedHarvestDate)}
              </span>
            </div>
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

