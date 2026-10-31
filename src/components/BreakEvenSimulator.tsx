import React, { useState } from 'react';
import { CropCycle } from '../types';
import { formatMoney, calculateBreakEvenPrice } from '../utils/thaiAgUnits';
import { Sparkles } from 'lucide-react';

interface BreakEvenSimulatorProps {
  currentCycle: CropCycle;
  totalExpense: number;
}

export const BreakEvenSimulator: React.FC<BreakEvenSimulatorProps> = ({
  currentCycle,
  totalExpense
}) => {
  const defaultYield = currentCycle.expectedYieldKg || (currentCycle.totalAreaRai * 400); // ดีฟอลต์ 400 กก./ไร่
  const [expectedYieldKg, setExpectedYieldKg] = useState<number>(defaultYield);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(currentCycle.targetPricePerKg || 14.0);

  const breakEvenPrice = calculateBreakEvenPrice(totalExpense, expectedYieldKg);
  const projectedRevenue = expectedYieldKg * simulatedPrice;
  const projectedProfit = projectedRevenue - totalExpense;
  const profitPerRai = currentCycle.totalAreaRai > 0 ? projectedProfit / currentCycle.totalAreaRai : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-base">🎯</span>
        <h3 className="font-bold text-slate-900 text-sm">วิเคราะห์จุดคุ้มทุน & จำลองราคาขาย</h3>
      </div>

      {/* กล่องสรุปจุดคุ้มทุน */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3">
        <div className="text-xs text-amber-800 font-semibold mb-0.5">
          ราคาขายขั้นต่ำเพื่อ "ไม่ขาดทุน" (จุดคุ้มทุน):
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-amber-900">
            {breakEvenPrice > 0 ? breakEvenPrice.toFixed(2) : '0.00'}
          </span>
          <span className="text-xs font-bold text-amber-800">บาท / กิโลกรัม</span>
          <span className="text-[11px] text-amber-700 ml-auto font-medium">
            (ตันละ {formatMoney(breakEvenPrice * 1000)} บ.)
          </span>
        </div>
        <div className="text-[11px] text-amber-700 mt-1">
          คำนวณจาก: ต้นทุนรวม {formatMoney(totalExpense)} บ. ÷ ผลผลิตคาดการณ์ {formatMoney(expectedYieldKg)} กก.
        </div>
      </div>

      {/* ตัวจำลองราคาตลาด (What-If Simulator) */}
      <div className="space-y-3 bg-slate-50 rounded-2xl p-3 border border-slate-200">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ลองเลื่อนราคาขาย ณ วันเกี่ยว:
          </span>
          <span className="text-emerald-700 font-black text-base">
            {simulatedPrice.toFixed(2)} บ./กก.
          </span>
        </div>

        {/* แถบเลื่อนราคา Slider */}
        <input
          type="range"
          min="5.0"
          max="25.0"
          step="0.25"
          value={simulatedPrice}
          onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>5 บ./กก. (5,000/ตัน)</span>
          <span>15 บ./กก.</span>
          <span>25 บ./กก. (25,000/ตัน)</span>
        </div>

        {/* ผลลัพธ์กำไรคาดการณ์ */}
        <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">รายรับที่จะได้ทั้งหมด:</span>
            <span className="font-bold text-slate-800 text-sm">
              {formatMoney(projectedRevenue)} บ.
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 block">กำไรสุทธิคาดการณ์:</span>
            <span
              className={`font-black text-base ${
                projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {projectedProfit >= 0 ? '+' : ''}
              {formatMoney(projectedProfit)} บ.
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 text-right">
          (เฉลี่ยเหลือกำไร <strong className={profitPerRai >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatMoney(profitPerRai)}</strong> บาท/ไร่)
        </div>
      </div>
    </div>
  );
};

