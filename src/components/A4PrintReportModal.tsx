import React from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { CropCycle, Transaction, FamilyMember } from '../types';
import { formatMoney, formatDateThai, getTodayIso, formatAreaThai } from '../utils/thaiAgUnits';

interface A4PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCycle?: CropCycle;
  cycles: CropCycle[];
  transactions: Transaction[];
  familyMembers: FamilyMember[];
}

export const A4PrintReportModal: React.FC<A4PrintReportModalProps> = ({
  isOpen,
  onClose,
  currentCycle,
  cycles,
  transactions,
  familyMembers
}) => {
  if (!isOpen) return null;

  // กรองเฉพาะรายการที่ไม่ถูกลบ
  const activeTxs = transactions.filter((t) => !t.isDeleted);

  let totalExpense = 0;
  let totalIncome = 0;

  // สรุปยอดตามหมวดหมู่
  const categorySummary: Record<string, number> = {};

  activeTxs.forEach((t) => {
    if (t.type === 'expense') {
      totalExpense += t.amount;
      categorySummary[t.categoryLabel] = (categorySummary[t.categoryLabel] || 0) + t.amount;
    } else {
      totalIncome += t.amount;
    }
  });

  const netProfit = totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[95vh]">
        {/* Modal Top Actions (ซ่อนตอนพิมพ์) */}
        <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold">เอกสารสรุปบัญชีฟาร์มมาตรฐาน (ขนาด A4)</h2>
              <p className="text-xs text-slate-300">ใช้เป็นหลักฐานยื่นกู้ ธ.ก.ส., สหกรณ์การเกษตร หรือเงินอุดหนุน</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-xs btn-touch-active print-allow"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / เซฟ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white btn-touch-active"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4 Sheet Body */}
        <div className="p-6 overflow-y-auto bg-slate-100 print:bg-white print:p-0 flex-1">
          <div className="max-w-[210mm] mx-auto bg-white p-8 rounded-2xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 text-slate-900 font-sans">
            
            {/* หัวเอกสารทางการ */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                แบบฟอร์มบัญชีต้นทุนการผลิตทางการเกษตรระดับครัวเรือน
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1 text-slate-900">
                สมุดบันทึกรายรับ-รายจ่ายฟาร์มเกษตรกร
              </h1>
              <div className="text-xs text-slate-600 mt-1">
                เอกสารประกอบการพิจารณาสินเชื่อ / การบริหารต้นทุนฟาร์มครอบครัว
              </div>
            </div>

            {/* ข้อมูลทั่วไปของฟาร์ม */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 print:bg-white print:border print:border-slate-300">
              <div>
                <div><strong>ชื่อแปลง/โครงการ:</strong> {currentCycle ? currentCycle.name : 'ภาพรวมทุกแปลง'}</div>
                <div><strong>ชนิดพืชหลัก:</strong> {currentCycle ? currentCycle.cropType : 'พืชผสมผสาน'}</div>
                <div><strong>ขนาดพื้นที่รวม:</strong> {currentCycle ? `${formatAreaThai(currentCycle.areaRai, currentCycle.areaNgan, currentCycle.areaSqWa)} (${currentCycle.totalAreaRai} ไร่)` : 'ทุกแปลง'}</div>
              </div>
              <div className="text-right">
                <div><strong>วันที่ออกรายงาน:</strong> {formatDateThai(getTodayIso())}</div>
                <div><strong>หัวหน้าครอบครัว:</strong> พ่อ / แม่ (เกษตรกรผู้ถือแปลง)</div>
                <div><strong>สถานะแปลง:</strong> {currentCycle?.status === 'closed' ? 'ปิดรอบการผลิตแล้ว' : 'กำลังดำเนินการเพาะปลูก'}</div>
              </div>
            </div>

            {/* ตารางสรุปภาพรวมทางการเงิน */}
            <div className="mb-6">
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-l-4 border-emerald-700 pl-2">
                1. สรุปผลประกอบการทางการเงินสุทธิ
              </h3>
              <table className="w-full text-xs border border-slate-300 text-left">
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="p-2 font-bold w-1/2">รายรับรวมจากการจำหน่ายผลผลิต (ก)</td>
                    <td className="p-2 text-right font-black text-emerald-800 text-sm">
                      +{formatMoney(totalIncome)} บาท
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">ต้นทุนและค่าใช้จ่ายรวมทั้งสิ้น (ข)</td>
                    <td className="p-2 text-right font-black text-rose-700 text-sm">
                      -{formatMoney(totalExpense)} บาท
                    </td>
                  </tr>
                  <tr className={netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}>
                    <td className="p-2.5 font-black text-sm">
                      ผลกำไรสุทธิ (ขาดทุน) (ก - ข)
                    </td>
                    <td className={`p-2.5 text-right font-black text-base ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)} บาท
                    </td>
                  </tr>
                  {currentCycle && currentCycle.totalAreaRai > 0 && (
                    <tr className="bg-slate-50 text-[11px] text-slate-600">
                      <td className="p-2">ต้นทุนเฉลี่ยต่อไร่ ({currentCycle.totalAreaRai} ไร่)</td>
                      <td className="p-2 text-right font-bold">
                        {formatMoney(Math.round(totalExpense / currentCycle.totalAreaRai))} บาท/ไร่
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ตารางแจกแจงต้นทุนแยกตามหมวดหมู่ 8 หมวด */}
            <div className="mb-6">
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-l-4 border-slate-700 pl-2">
                2. การจำแนกต้นทุนการผลิตตามหมวดหมู่ (8 หมวด)
              </h3>
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="p-2 border border-slate-300">หมวดหมู่ค่าใช้จ่าย</th>
                    <th className="p-2 border border-slate-300 text-right">จำนวนเงิน (บาท)</th>
                    <th className="p-2 border border-slate-300 text-right">สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(categorySummary).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-slate-400">ยังไม่มีรายการค่าใช้จ่าย</td>
                    </tr>
                  ) : (
                    Object.entries(categorySummary).map(([cat, amt]) => {
                      const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0';
                      return (
                        <tr key={cat} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-300">{cat}</td>
                          <td className="p-2 border border-slate-300 text-right font-bold">{formatMoney(amt)} บ.</td>
                          <td className="p-2 border border-slate-300 text-right">{pct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ตารางแจกแจงรายการบันทึกสำคัญ 15 รายการล่าสุด */}
            <div className="mb-8">
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-l-4 border-slate-700 pl-2">
                3. บันทึกรายการจริงล่าสุด
              </h3>
              <table className="w-full text-[11px] border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="p-1.5 border border-slate-300">วันที่</th>
                    <th className="p-1.5 border border-slate-300">รายการ</th>
                    <th className="p-1.5 border border-slate-300">หมวด</th>
                    <th className="p-1.5 border border-slate-300 text-right">จำนวนเงิน</th>
                    <th className="p-1.5 border border-slate-300 text-center">ชำระ</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTxs.slice(0, 12).map((t) => (
                    <tr key={t.id} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-300">{formatDateThai(t.date)}</td>
                      <td className="p-1.5 border border-slate-300">
                        {t.title} {t.notes ? `(${t.notes})` : ''}
                      </td>
                      <td className="p-1.5 border border-slate-300">{t.categoryLabel}</td>
                      <td className={`p-1.5 border border-slate-300 text-right font-bold ${
                        t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        {t.paymentStatus === 'credit' ? 'เงินเชื่อ' : 'เงินสด'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ช่องลงชื่อสำหรับเกษตรกรและเจ้าหน้าที่ ธ.ก.ส./พยาน */}
            <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-300 text-xs">
              <div>
                <div className="mb-10">....................................................................</div>
                <div className="font-bold">( ................................................................ )</div>
                <div className="text-slate-600 mt-1">เกษตรกรเจ้าของแปลง / ผู้ยื่นเอกสาร</div>
                <div className="text-slate-400 mt-0.5">วันที่ ........ / ........ / ........</div>
              </div>

              <div>
                <div className="mb-10">....................................................................</div>
                <div className="font-bold">( ................................................................ )</div>
                <div className="text-slate-600 mt-1">เจ้าหน้าที่ตรวจสอบ / พยานกลุ่มเกษตรกร</div>
                <div className="text-slate-400 mt-0.5">วันที่ ........ / ........ / ........</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
