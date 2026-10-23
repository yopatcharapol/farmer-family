import React from 'react';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface ActionButtonsProps {
  onOpenExpense: () => void;
  onOpenIncome: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onOpenExpense,
  onOpenIncome
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* ปุ่มใหญ่บันทึกรายจ่าย (สีแดงส้ม) */}
      <button
        onClick={onOpenExpense}
        className="h-20 bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 px-3 border-2 border-rose-500 btn-touch-active active:scale-95 transition-all"
      >
        <div className="p-2 bg-white/20 rounded-xl">
          <MinusCircle className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <div className="text-xs text-rose-100 font-medium">กดเมื่อควักเงินจ่าย</div>
          <div className="text-lg font-black tracking-tight leading-tight">บันทึกรายจ่าย</div>
        </div>
      </button>

      {/* ปุ่มใหญ่บันทึกรายได้ (สีเขียวชอุ่ม) */}
      <button
        onClick={onOpenIncome}
        className="h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 px-3 border-2 border-emerald-500 btn-touch-active active:scale-95 transition-all"
      >
        <div className="p-2 bg-white/20 rounded-xl">
          <PlusCircle className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <div className="text-xs text-emerald-100 font-medium">กดเมื่อขายได้เงิน</div>
          <div className="text-lg font-black tracking-tight leading-tight">บันทึกรายรับ</div>
        </div>
      </button>
    </div>
  );
};

