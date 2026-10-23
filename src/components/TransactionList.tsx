import React, { useState } from 'react';
import { Transaction, FamilyMemberId, FAMILY_MEMBERS } from '../types';
import { formatMoney, formatDateThai } from '../utils/thaiAgUnits';
import { Trash2, Filter } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction
}) => {
  const [filterMember, setFilterMember] = useState<FamilyMemberId | 'all'>('all');

  const filtered = transactions.filter((t) => {
    if (filterMember === 'all') return true;
    return t.recordedBy === filterMember;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📝</span>
          <h3 className="font-bold text-slate-900 text-sm">ประวัติรายการบันทึก</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtered.length} รายการ
          </span>
        </div>
      </div>

      {/* แถบฟิลเตอร์กรองตามคนในบ้าน */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 text-xs no-scrollbar">
        <button
          onClick={() => setFilterMember('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap btn-touch-active ${
            filterMember === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ทั้งหมด
        </button>
        {FAMILY_MEMBERS.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center gap-1 btn-touch-active ${
              filterMember === m.id
                ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{m.avatar}</span>
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* รายการประวัติ */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          ยังไม่มีรายการบันทึก {filterMember !== 'all' ? `ของ${FAMILY_MEMBERS.find((m) => m.id === filterMember)?.name}` : ''}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const member = FAMILY_MEMBERS.find((m) => m.id === t.recordedBy);
            const isExpense = t.type === 'expense';

            return (
              <div
                key={t.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar คนบันทึก */}
                  <div
                    className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs shrink-0"
                    title={`บันทึกโดย ${member?.name}`}
                  >
                    {member?.avatar || '👤'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {t.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                        {t.categoryLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{formatDateThai(t.date)}</span>
                      <span>• โดย {member?.name}</span>
                      {t.quantity && t.unit && (
                        <span>• {t.quantity} {t.unit}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        isExpense ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatMoney(t.amount)}
                      <span className="text-[10px] font-normal ml-0.5">บ.</span>
                    </div>
                  </div>

                  {/* ปุ่มลบรายการ */}
                  <button
                    onClick={() => {
                      if (confirm(`ต้องการลบรายการ "${t.title}" หรือไม่?`)) {
                        onDeleteTransaction(t.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white btn-touch-active"
                    title="ลบรายการ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

