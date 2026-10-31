import React from 'react';
import { X, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { CropCycle, Transaction } from '../types';
import { formatMoney, formatNumber } from '../utils/thaiAgUnits';

interface PlotComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: CropCycle[];
  transactions: Transaction[];
  onSelectCycle: (cycleId: string) => void;
}

export const PlotComparisonModal: React.FC<PlotComparisonModalProps> = ({
  isOpen,
  onClose,
  cycles,
  transactions,
  onSelectCycle
}) => {
  if (!isOpen) return null;

  // คำนวณตัวเลขของแต่ละแปลง
  const plotStats = cycles.map((cycle) => {
    const plotTxs = transactions.filter((t) => t.cycleId === cycle.id && !t.isDeleted);
    let expense = 0;
    let income = 0;

    plotTxs.forEach((t) => {
      if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'income') income += t.amount;
    });

    const profit = income - expense;
    const totalRai = cycle.totalAreaRai || 1;
    const costPerRai = Math.round(expense / totalRai);
    const profitPerRai = Math.round(profit / totalRai);
    const roi = expense > 0 ? Number(((profit / expense) * 100).toFixed(1)) : 0;

    return {
      cycle,
      expense,
      income,
      profit,
      costPerRai,
      profitPerRai,
      roi
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">ตารางเปรียบเทียบกำไรระหว่างแปลง</h2>
              <p className="text-xs text-emerald-200">ดูว่าแปลงไหนคุ้มค่าและทำกำไรต่อไร่ได้ดีที่สุด</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {plotStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              ยังไม่มีแปลงเพาะปลูกในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">แปลง / พืช</th>
                    <th className="p-2.5 text-center">เนื้อที่</th>
                    <th className="p-2.5 text-right">ต้นทุนรวม</th>
                    <th className="p-2.5 text-right">ต้นทุน/ไร่</th>
                    <th className="p-2.5 text-right">รายรับ</th>
                    <th className="p-2.5 text-right">กำไรสุทธิ</th>
                    <th className="p-2.5 text-right">กำไร/ไร่</th>
                    <th className="p-2.5 text-center">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {plotStats.map((stat) => {
                    const isProfit = stat.profit >= 0;
                    return (
                      <tr
                        key={stat.cycle.id}
                        onClick={() => {
                          onSelectCycle(stat.cycle.id);
                          onClose();
                        }}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="p-2.5 font-bold text-slate-900">
                          <div className="truncate max-w-[130px]">{stat.cycle.name}</div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {stat.cycle.cropType} {stat.cycle.status === 'closed' ? '(ปิดรอบแล้ว)' : ''}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700">
                          {stat.cycle.totalAreaRai} ไร่
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-600">
                          {formatMoney(stat.expense)} บ.
                        </td>
                        <td className="p-2.5 text-right text-slate-600 font-medium">
                          {formatMoney(stat.costPerRai)} บ.
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          {formatMoney(stat.income)} บ.
                        </td>
                        <td className={`p-2.5 text-right font-black ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}{formatMoney(stat.profit)} บ.
                        </td>
                        <td className={`p-2.5 text-right font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}{formatMoney(stat.profitPerRai)} บ.
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isProfit ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {stat.roi}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600 text-[11px]">
            💡 <strong>คำแนะนำ:</strong> แตะที่แถวของแปลงใดก็ได้เพื่อสลับไปดูรายละเอียดและบันทึกรายการของแปลงนั้นทันที
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดหน้าต่างเปรียบเทียบ
          </button>
        </div>
      </div>
    </div>
  );
};
