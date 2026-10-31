import React from 'react';
import { formatMoney } from '../utils/thaiAgUnits';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatSummaryProps {
  todayExpense: number;
  totalExpense: number;
  totalIncome: number;
  costPerRai: number;
  totalRai: number;
  viewPeriod: 'cycle' | 'month' | 'all';
  onSelectPeriod: (period: 'cycle' | 'month' | 'all') => void;
  periodLabel: string;
}

export const StatSummary: React.FC<StatSummaryProps> = ({
  todayExpense,
  totalExpense,
  totalIncome,
  costPerRai,
  totalRai,
  viewPeriod,
  onSelectPeriod,
  periodLabel
}) => {
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-2.5 mb-4">
      {/* แถบสลับมุมมองสรุปต้นทุน: รอบแปลงปลูก / เดือนนี้ / ทั้งหมด */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 border border-slate-300/70 shadow-2xs">
        <button
          type="button"
          onClick={() => onSelectPeriod('cycle')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all btn-touch-active ${
            viewPeriod === 'cycle'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🌾 รอบแปลงนี้
        </button>

        <button
          type="button"
          onClick={() => onSelectPeriod('month')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all btn-touch-active ${
            viewPeriod === 'month'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 ประจำเดือนนี้
        </button>

        <button
          type="button"
          onClick={() => onSelectPeriod('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all btn-touch-active ${
            viewPeriod === 'all'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🗓️ ยอดรวมทั้งหมด
        </button>
      </div>

      {/* การ์ดหลัก: ยอดจ่ายรวม & กำไร (ตัวหนังสือใหญ่ ชัดเจน) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* รายจ่ายรวม */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-1">
            <span>รายจ่าย ({periodLabel})</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {formatMoney(totalExpense)} <span className="text-xs font-normal">บาท</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-semibold">
            วันนี้จ่าย: <span className="font-extrabold">{formatMoney(todayExpense)}</span> บ.
          </div>
        </div>

        {/* รายรับรวม */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold mb-1">
            <span>รายรับ ({periodLabel})</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            {formatMoney(totalIncome)} <span className="text-xs font-normal">บาท</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-medium">
            {totalIncome > 0 ? (
              <span>กำไร: <strong className={`font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatMoney(netProfit)}</strong> บ.</span>
            ) : (
              <span>ยังไม่ถึงวันขายผลผลิต</span>
            )}
          </div>
        </div>
      </div>

      {/* แถบสรุปต้นทุนเฉลี่ยต่อไร่ (แสดงเมื่อดูรอบแปลงปลูก) */}
      {totalRai > 0 && viewPeriod === 'cycle' && (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs text-xs">
          <span className="text-slate-600 flex items-center gap-1 font-medium">
            <span>📊</span> ต้นทุนเฉลี่ยต่อไร่ ({totalRai} ไร่):
          </span>
          <span className="font-black text-slate-900 text-sm">
            {formatMoney(costPerRai)} <span className="text-xs font-normal text-slate-500">บาท/ไร่</span>
          </span>
        </div>
      )}
    </div>
  );
};

