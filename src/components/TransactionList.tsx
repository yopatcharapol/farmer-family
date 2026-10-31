import React, { useState } from 'react';
import {
  Transaction,
  FamilyMember,
  DEFAULT_FAMILY_MEMBERS
} from '../types';
import { CATEGORIES } from '../data/presets';
import { formatMoney, formatDateThai } from '../utils/thaiAgUnits';
import { Trash2, Edit3, Check, Clock, AlertCircle, Search, Filter, Tag } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  familyMembers?: FamilyMember[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onRetrySync?: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  familyMembers = DEFAULT_FAMILY_MEMBERS,
  onDeleteTransaction,
  onEditTransaction,
  onRetrySync
}) => {
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'credit'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // กรองรายการตาม Search & Filter
  const filtered = transactions.filter((t) => {
    if (t.isDeleted) return false;

    // กรองสมาชิก
    if (filterMember !== 'all' && t.recordedBy !== filterMember && t.paidBy !== filterMember) {
      return false;
    }

    // กรองประเภท (รายจ่าย / รายรับ / เงินเชื่อ)
    if (filterType === 'expense' && t.type !== 'expense') return false;
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterType === 'credit' && t.paymentStatus !== 'credit') return false;

    // กรองหมวดหมู่
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;

    // ค้นหาแบบ Real-time (ชื่อรายการ, หมายเหตุ, ร้านค้า)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchNote = (t.notes || '').toLowerCase().includes(q);
      const matchCreditor = (t.creditorName || '').toLowerCase().includes(q);
      const matchCategory = (t.categoryLabel || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNote && !matchCreditor && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 mb-4 font-sans">
      {/* ส่วนหัวและการนับจำนวน */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📝</span>
          <h3 className="font-bold text-slate-900 text-sm">ประวัติรายการบันทึก</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtered.length} รายการ
          </span>
        </div>
      </div>

      {/* [#15] แถบค้นหาแบบ Real-Time */}
      <div className="relative mb-2.5">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อรายการ, สูตรปุ๋ย, ชื่อร้านค้า, หมายเหตุ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-emerald-600 text-slate-800 placeholder:text-slate-400"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* [#15] แถบปุ่มกรองประเภท: ทั้งหมด / รายจ่าย / รายรับ / หนี้เงินเชื่อ */}
      <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'expense', label: '🔴 รายจ่าย' },
          { id: 'income', label: '🟢 รายรับ' },
          { id: 'credit', label: '💳 เงินเชื่อ' }
        ].map((ft) => (
          <button
            key={ft.id}
            type="button"
            onClick={() => setFilterType(ft.id as any)}
            className={`py-1.5 rounded-xl font-bold text-center btn-touch-active transition-all ${
              filterType === ft.id
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* แถบกรองตามคนในบ้าน */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 text-xs no-scrollbar">
        <button
          onClick={() => setFilterMember('all')}
          className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap btn-touch-active ${
            filterMember === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ทุกคน
        </button>
        {familyMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap flex items-center gap-1 btn-touch-active ${
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
        <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
          ไม่พบรายการที่ค้นหา
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const recorder = familyMembers.find((m) => m.id === t.recordedBy);
            const payer = familyMembers.find((m) => m.id === t.paidBy);
            const isExpense = t.type === 'expense';
            const isCredit = t.paymentStatus === 'credit';

            return (
              <div
                key={t.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors shadow-2xs ${
                  isCredit
                    ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                    : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar คนบันทึก */}
                  <div
                    className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs shrink-0"
                    title={`บันทึกโดย ${recorder?.name || t.recordedBy}`}
                  >
                    {recorder?.avatar || '👤'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {t.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                        {t.categoryLabel}
                      </span>
                      {isCredit && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 border border-rose-300 text-rose-800 font-bold shrink-0">
                          💳 เชื่อ {t.creditorName ? `(${t.creditorName})` : ''}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{formatDateThai(t.date)}</span>
                      {payer && payer.id !== t.recordedBy && isExpense && (
                        <span className="text-amber-800 font-semibold">• ออกโดย {payer.name}</span>
                      )}
                      {t.quantity && t.unit && (
                        <span>• {t.quantity} {t.unit}</span>
                      )}
                      {t.harvestWeight && (
                        <span className="text-emerald-700 font-bold">• {t.harvestWeight} กก.</span>
                      )}
                      {t.notes && (
                        <span className="text-slate-600 italic truncate max-w-[150px]">
                          "{t.notes}"
                        </span>
                      )}
                      
                      {/* สถานะซิงค์ */}
                      {t.syncStatus === 'synced' || t.synced ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                          <Check className="w-2.5 h-2.5 text-emerald-600" /> ซิงค์แล้ว
                        </span>
                      ) : t.syncStatus === 'failed' ? (
                        <button
                          type="button"
                          onClick={() => onRetrySync && onRetrySync(t)}
                          className="inline-flex items-center gap-0.5 text-[10px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded font-bold btn-touch-active"
                        >
                          <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> ลองส่งใหม่
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                          <Clock className="w-2.5 h-2.5 text-amber-600" /> รอต่อเน็ต
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ฝั่งขวา: ยอดเงิน + ปุ่มแก้ไข & ลบ */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <div className="text-right mr-1">
                    <div
                      className={`font-black text-xs sm:text-sm ${
                        isExpense ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatMoney(t.amount)}
                      <span className="text-[10px] font-normal ml-0.5">บ.</span>
                    </div>
                  </div>

                  {/* [#1] ปุ่มแก้ไขรายการ */}
                  {onEditTransaction && (
                    <button
                      onClick={() => onEditTransaction(t)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-white btn-touch-active"
                      title="แก้ไขรายการนี้"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* ปุ่มลบรายการ */}
                  <button
                    onClick={() => {
                      if (confirm(`ต้องการลบรายการ "${t.title}" (${formatMoney(t.amount)} บ.) หรือไม่?`)) {
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
