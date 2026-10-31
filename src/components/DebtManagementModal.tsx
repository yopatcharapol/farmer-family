import React from 'react';
import { X, CheckCircle, Store, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { formatMoney, formatDateThai } from '../utils/thaiAgUnits';

interface DebtManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onPayOffDebt: (transactionId: string) => void;
}

export const DebtManagementModal: React.FC<DebtManagementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onPayOffDebt
}) => {
  if (!isOpen) return null;

  // กรองเฉพาะรายการที่เป็นเงินเชื่อ/ค้างจ่าย
  const creditTxs = transactions.filter((t) => t.paymentStatus === 'credit' && !t.isDeleted);

  // คำนวณยอดหนี้รวมแยกตามร้านค้า / เจ้าหนี้
  const debtByCreditor: Record<string, { total: number; count: number }> = {};
  let totalDebt = 0;

  creditTxs.forEach((t) => {
    const creditor = t.creditorName?.trim() || 'ร้านค้าทั่วไป / ไม่ระบุชื่อ';
    if (!debtByCreditor[creditor]) {
      debtByCreditor[creditor] = { total: 0, count: 0 };
    }
    debtByCreditor[creditor].total += t.amount;
    debtByCreditor[creditor].count += 1;
    totalDebt += t.amount;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-rose-700 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="text-base font-bold">ยอดหนี้สิน & เงินเชื่อร้านปุ๋ยยา</h2>
              <p className="text-xs text-rose-100">ตรวจสอบยอดค้างจ่าย & กดตัดหนี้เมื่อจ่ายแล้ว</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-rose-800 hover:bg-rose-900 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* การ์ดยอดหนี้รวม */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-900 block">ยอดค้างจ่ายรวมทั้งหมด:</span>
              <span className="text-2xl font-black text-rose-700">
                {formatMoney(totalDebt)} บาท
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                {creditTxs.length} รายการ
              </span>
            </div>
          </div>

          {/* สรุปแยกตามร้านค้า */}
          {Object.keys(debtByCreditor).length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-600" />
                <span>ยอดหนี้แยกตามร้านค้า / เจ้าหนี้:</span>
              </h3>
              <div className="space-y-1.5">
                {Object.entries(debtByCreditor).map(([creditor, data]) => (
                  <div
                    key={creditor}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{creditor}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({data.count} บิล)</span>
                    </div>
                    <span className="font-black text-rose-600 text-sm">
                      {formatMoney(data.total)} บ.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* รายการเงินเชื่อทั้งหมด พร้อมปุ่มกดตัดหนี้ */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs mb-1.5">
              รายการค้างชำระ (แตะเพื่อตัดหนี้เมื่อจ่ายแล้ว):
            </h3>

            {creditTxs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                🎉 ไม่มีรายการหนี้ค้างจ่าย ชำระครบถ้วนแล้ว
              </div>
            ) : (
              <div className="space-y-2">
                {creditTxs.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-rose-400 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">{t.title}</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                          {t.creditorName || 'เงินเชื่อ'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span>{formatDateThai(t.date)}</span>
                        {t.quantity && t.unit && <span> • {t.quantity} {t.unit}</span>}
                        {t.notes && <span className="text-slate-600"> • {t.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-rose-600 text-sm">
                          {formatMoney(t.amount)} บ.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`ยืนยันการจ่ายเงิน "${t.title}" จำนวน ${formatMoney(t.amount)} บาท แล้วหรือไม่?`)) {
                            onPayOffDebt(t.id);
                          }
                        }}
                        className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs btn-touch-active min-h-[40px]"
                        title="กดเมื่อจ่ายเงินสดแล้ว"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>ตัดหนี้</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
