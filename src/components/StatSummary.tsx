import React from 'react';
import { formatMoney } from '../utils/thaiAgUnits';
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface StatSummaryProps {
  todayExpense: number;
  totalExpense: number;
  totalIncome: number;
  costPerRai: number;
  totalRai: number;
}

export const StatSummary: React.FC<StatSummaryProps> = ({
  todayExpense,
  totalExpense,
  totalIncome,
  costPerRai,
  totalRai
}) => {
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-2.5 mb-4">
      {/* การ์ดหลัก: ยอดจ่ายรวม & กำไร */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* รายจ่ายรวมรอบนี้ */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span>รายจ่ายรวมรอบนี้</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {formatMoney(totalExpense)} <span className="text-xs font-normal">บาท</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            วันนี้จ่าย: <span className="font-bold">{formatMoney(todayExpense)}</span> บ.
          </div>
        </div>

        {/* รายรับรวมรอบนี้ */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
            <span>รายรับรวมรอบนี้</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            {formatMoney(totalIncome)} <span className="text-xs font-normal">บาท</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            {totalIncome > 0 ? (
              <span>กำไรสุทธิ: <strong className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatMoney(netProfit)}</strong> บ.</span>
            ) : (
              <span>ยังไม่ถึงวันเก็บเกี่ยว</span>
            )}
          </div>
        </div>
      </div>

      {/* แถบสรุปต้นทุนเฉลี่ยต่อไร่ */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs text-xs">
        <span className="text-slate-600 flex items-center gap-1">
          <span>📊</span> ต้นทุนเฉลี่ยต่อไร่ ({totalRai} ไร่):
        </span>
        <span className="font-bold text-slate-900 text-sm">
          {formatMoney(costPerRai)} <span className="text-xs font-normal text-slate-500">บาท/ไร่</span>
        </span>
      </div>
    </div>
  );
};
