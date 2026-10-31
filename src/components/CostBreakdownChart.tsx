import React from 'react';
import { Transaction, ExpenseCategory } from '../types';
import { CATEGORIES } from '../data/presets';
import { formatMoney } from '../utils/thaiAgUnits';

interface CostBreakdownChartProps {
  transactions: Transaction[];
  totalExpense: number;
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  transactions,
  totalExpense
}) => {
  if (totalExpense <= 0) return null;

  // รวมยอดเงินแยกตามหมวดหมู่รายจ่าย
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const costCategories = CATEGORIES.filter((c) => c.type === 'expense');

  // เรียงลำดับจากหมวดที่จ่ายเยอะสุดไปน้อยสุด
  const sortedCategories = costCategories
    .map((cat) => ({
      ...cat,
      total: categoryTotals[cat.id] || 0,
      percentage: totalExpense > 0 ? ((categoryTotals[cat.id] || 0) / totalExpense) * 100 : 0
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📊</span>
          <h3 className="font-bold text-slate-900 text-sm">สัดส่วนต้นทุน 8 หมวดหมู่</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">รวม 8 หมวด</span>
      </div>

      {/* ไฮไลต์หมวดที่จ่ายเงินเยอะที่สุดอันดับ 1 (ตัวหนังสือใหญ่ ชัดเจนสำหรับผู้ใหญ่) */}
      {topCategory && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-300/80 rounded-2xl p-3 mb-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-3xl shrink-0 p-1 bg-white rounded-xl shadow-2xs">{topCategory.icon}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-rose-700 flex items-center gap-1">
                <span>🏆</span> หมวดที่จ่ายเยอะสุดอันดับ 1:
              </div>
              <div className="text-base font-black text-slate-900 truncate">
                {topCategory.name}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className="text-lg font-black text-rose-700 leading-tight">
              {formatMoney(topCategory.total)} <span className="text-xs font-normal text-slate-600">บ.</span>
            </div>
            <div className="text-xs font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md mt-0.5 inline-block">
              {topCategory.percentage.toFixed(0)}% ของรายจ่าย
            </div>
          </div>
        </div>
      )}

      {/* แถบกราฟรวมสัดส่วน (Pure CSS Bar) */}
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-3 shadow-inner">
        {sortedCategories.map((cat, idx) => {
          const colors = [
            'bg-emerald-500',
            'bg-amber-500',
            'bg-blue-500',
            'bg-rose-500',
            'bg-orange-500',
            'bg-purple-500',
            'bg-teal-500',
            'bg-slate-500'
          ];
          return (
            <div
              key={cat.id}
              style={{ width: `${cat.percentage}%` }}
              className={`${colors[idx % colors.length]} transition-all duration-300`}
              title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* รายการแจกแจงแต่ละหมวด */}
      <div className="space-y-2">
        {sortedCategories.map((cat, idx) => (
          <div key={cat.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base">{cat.icon}</span>
              <span className="font-medium text-slate-800 truncate">{cat.name}</span>
              <span className="text-[10px] text-slate-400">({cat.percentage.toFixed(0)}%)</span>
            </div>
            <div className="font-bold text-slate-900 text-right">
              {formatMoney(cat.total)} <span className="font-normal text-slate-500 text-[10px]">บ.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

