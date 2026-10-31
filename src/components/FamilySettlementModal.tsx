import React from 'react';
import { X, Users, Check, Wallet } from 'lucide-react';
import { Transaction, FamilyMember } from '../types';
import { formatMoney } from '../utils/thaiAgUnits';

interface FamilySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  totalIncome: number;
}

export const FamilySettlementModal: React.FC<FamilySettlementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  familyMembers,
  totalIncome
}) => {
  if (!isOpen) return null;

  // กรองเฉพาะรายจ่ายที่จ่ายแล้ว (ไม่รวมเงินเชื่อที่ยังไม่จ่าย)
  const paidExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.paymentStatus !== 'credit' && !t.isDeleted
  );

  // คำนวณยอดเงินที่สมาชิกแต่ละคนสำรองจ่ายไป
  const paidByMember: Record<string, number> = {};
  familyMembers.forEach((m) => {
    paidByMember[m.id] = 0;
  });

  let totalSpent = 0;
  paidExpenses.forEach((t) => {
    const payerId = t.paidBy || t.recordedBy || 'dad';
    paidByMember[payerId] = (paidByMember[payerId] || 0) + t.amount;
    totalSpent += t.amount;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-amber-600 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-base font-bold">เคลียร์เงินคืนคนในบ้าน</h2>
              <p className="text-xs text-amber-100">ดูว่าใครสำรองเงินสดจ่ายค่าปุ๋ยยาไปเท่าไหร่</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-amber-700 hover:bg-amber-800 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* สรุปยอดเงินทุนรวม */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-amber-900 font-bold block">เงินทุนที่คนในบ้านออกไปทั้งหมด:</span>
              <span className="text-xl font-black text-amber-800">{formatMoney(totalSpent)} บาท</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">รายรับที่ขายได้:</span>
              <span className="text-base font-bold text-emerald-700">{formatMoney(totalIncome)} บ.</span>
            </div>
          </div>

          {/* รายการสำรองจ่ายแยกรายบุคคล */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-600" />
              <span>ยอดเงินที่แต่ละคนต้องได้รับคืน:</span>
            </h3>

            {familyMembers.map((m) => {
              const spent = paidByMember[m.id] || 0;
              const percent = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;

              return (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-white rounded-full shadow-2xs border border-slate-200">
                      {m.avatar}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.role}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-amber-900 text-base">
                      {formatMoney(spent)} <span className="text-xs font-normal">บ.</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      ({percent}% ของทุน)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-900 text-[11px] leading-relaxed">
            💡 <strong>แนวทางแบ่งเงิน:</strong> เมื่อขายผลผลิตได้ ให้นำรายรับมาจ่ายคืนเงินต้นให้คนที่ออกเงินสำรองตามยอดด้านบนก่อน ส่วนเงินที่เหลือคือกำไรสุทธิของครอบครัวครับ
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
