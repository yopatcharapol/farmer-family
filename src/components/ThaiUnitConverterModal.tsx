import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { calculateTotalRai, formatAreaThai, formatMoney } from '../utils/thaiAgUnits';

interface ThaiUnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThaiUnitConverterModal: React.FC<ThaiUnitConverterModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // แถบ 1: พื้นที่
  const [rai, setRai] = useState<string>('1');
  const [ngan, setNgan] = useState<string>('2');
  const [sqWa, setSqWa] = useState<string>('50');

  // แถบ 2: น้ำหนักข้าว
  const [weightKg, setWeightKg] = useState<string>('1000');
  const [kgPerThang, setKgPerThang] = useState<string>('10.5');

  // คำนวณพื้นที่
  const r = parseFloat(rai) || 0;
  const ng = parseFloat(ngan) || 0;
  const w = parseFloat(sqWa) || 0;
  const totalRai = calculateTotalRai(r, ng, w);
  const totalSqm = totalRai * 1600;

  // คำนวณน้ำหนัก
  const kg = parseFloat(weightKg) || 0;
  const kpt = parseFloat(kgPerThang) || 10;
  const ton = kg / 1000;
  const thang = kg / kpt;
  const kwian = ton; // 1 เกวียน ≈ 1 ตัน (1,000 กก. หรือ 100 ถัง)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="text-base font-bold">เครื่องมือแปลงหน่วยเกษตรไทย</h2>
              <p className="text-xs text-emerald-200">ไร่-งาน-ตร.ว. และ ตัน-เกวียน-ถัง-กก.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* หมวดที่ 1: แปลงหน่วยพื้นที่ (ไร่ - งาน - ตารางวา) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🌾</span> แปลงหน่วยพื้นที่ (ไร่ / งาน / ตร.ว.)
            </h3>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">ไร่</label>
                <input
                  type="number"
                  value={rai}
                  onChange={(e) => setRai(e.target.value)}
                  className="w-full text-center font-bold text-base bg-white border border-slate-300 rounded-xl py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">งาน (1 ไร่=4 งาน)</label>
                <input
                  type="number"
                  value={ngan}
                  onChange={(e) => setNgan(e.target.value)}
                  className="w-full text-center font-bold text-base bg-white border border-slate-300 rounded-xl py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">ตร.วา (1 งาน=100 วา)</label>
                <input
                  type="number"
                  value={sqWa}
                  onChange={(e) => setSqWa(e.target.value)}
                  className="w-full text-center font-bold text-base bg-white border border-slate-300 rounded-xl py-2"
                />
              </div>
            </div>

            {/* ผลลัพธ์พื้นที่ */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600">พื้นที่รวม (ไร่ทศนิยม):</span>
                <span className="text-base font-black text-emerald-800">{totalRai} ไร่</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">แปลงเป็นตารางเมตร:</span>
                <span className="font-bold text-slate-900">{formatMoney(totalSqm)} ตร.ม.</span>
              </div>
            </div>
          </div>

          {/* หมวดที่ 2: แปลงหน่วยชั่งตวงผลผลิต (ตัน - เกวียน - ถัง - กิโลกรัม) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🌾</span> แปลงน้ำหนักข้าวเปลือก / พืชผล
            </h3>

            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                ระบุน้ำหนักเป็นกิโลกรัม (กก.):
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full text-center font-black text-xl text-emerald-900 bg-white border-2 border-emerald-300 rounded-xl py-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-2">
                <span className="text-slate-500 block text-[10px]">ตัน</span>
                <span className="font-black text-slate-900 text-sm">{ton.toFixed(2)}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2">
                <span className="text-slate-500 block text-[10px]">เกวียน</span>
                <span className="font-black text-slate-900 text-sm">{kwian.toFixed(2)}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2">
                <span className="text-slate-500 block text-[10px]">ถัง (20 ลิตร)</span>
                <span className="font-black text-slate-900 text-sm">{thang.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-sm btn-touch-active"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
