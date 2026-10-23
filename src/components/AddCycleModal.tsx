import React, { useState } from 'react';
import { CropCycle } from '../types';
import { calculateTotalRai, getTodayIso } from '../utils/thaiAgUnits';
import { X, Check } from 'lucide-react';

interface AddCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCycle: (cycle: CropCycle) => void;
}

export const AddCycleModal: React.FC<AddCycleModalProps> = ({
  isOpen,
  onClose,
  onAddCycle
}) => {
  if (!isOpen) return null;

  const today = getTodayIso();
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('ข้าว');
  const [areaRai, setAreaRai] = useState('10');
  const [areaNgan, setAreaNgan] = useState('0');
  const [areaSqWa, setAreaSqWa] = useState('0');
  const [startDate, setStartDate] = useState(today);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [expectedYieldKg, setExpectedYieldKg] = useState('4000');
  const [targetPricePerKg, setTargetPricePerKg] = useState('14');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อแปลงหรือรอบปลูก');
      return;
    }

    const r = parseFloat(areaRai) || 0;
    const ng = parseFloat(areaNgan) || 0;
    const w = parseFloat(areaSqWa) || 0;
    const totalRai = calculateTotalRai(r, ng, w);

    const newCycle: CropCycle = {
      id: `cycle-${Date.now()}`,
      name: name.trim(),
      cropType,
      areaRai: r,
      areaNgan: ng,
      areaSqWa: w,
      totalAreaRai: totalRai > 0 ? totalRai : 1,
      startDate: startDate || today,
      expectedHarvestDate: expectedHarvestDate || today,
      expectedYieldKg: parseFloat(expectedYieldKg) || 0,
      targetPricePerKg: parseFloat(targetPricePerKg) || 0,
      status: 'active',
      createdAt: Date.now()
    };

    onAddCycle(newCycle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h2 className="text-base font-bold">เพิ่มแปลง / รอบการปลูกใหม่</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs max-h-[85vh] overflow-y-auto">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อแปลง / รอบการปลูก <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น แปลงทุ่งใหญ่ - ข้าวหอมมะลิ 69"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชนิดพืช</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
              >
                <option value="ข้าว">🌾 ข้าวนาปี / นาปรัง</option>
                <option value="ข้าวโพด">🌽 ข้าวโพด</option>
                <option value="มันสำปะหลัง">🥔 มันสำปะหลัง</option>
                <option value="อ้อย">🎋 อ้อย</option>
                <option value="ยางพารา">🌲 ยางพารา / ปาล์ม</option>
                <option value="ไม้ผล">🥭 ไม้ผล / ทุเรียน</option>
                <option value="พืชผัก">🥬 พืชผักสวนครัว</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">วันที่เริ่มปลูก</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          {/* พื้นที่แปลง (ไร่-งาน-วา) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
            <label className="font-bold text-slate-700 block mb-1">ขนาดพื้นที่แปลง</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block">ไร่</span>
                <input
                  type="number"
                  value={areaRai}
                  onChange={(e) => setAreaRai(e.target.value)}
                  className="w-full text-center font-bold bg-white border border-slate-300 rounded-lg py-1.5 text-sm"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">งาน</span>
                <input
                  type="number"
                  value={areaNgan}
                  onChange={(e) => setAreaNgan(e.target.value)}
                  className="w-full text-center font-bold bg-white border border-slate-300 rounded-lg py-1.5 text-sm"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ตร.วา</span>
                <input
                  type="number"
                  value={areaSqWa}
                  onChange={(e) => setAreaSqWa(e.target.value)}
                  className="w-full text-center font-bold bg-white border border-slate-300 rounded-lg py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* คาดการณ์เก็บเกี่ยว & ผลผลิต */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">วันที่คาดจะเก็บเกี่ยว</label>
              <input
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">คาดผลผลิตรวม (กก.)</label>
              <input
                type="number"
                placeholder="เช่น 6000 (6 ตัน)"
                value={expectedYieldKg}
                onChange={(e) => setExpectedYieldKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-base shadow-md flex items-center justify-center gap-1.5 btn-touch-active mt-2"
          >
            <Check className="w-5 h-5" />
            <span>สร้างแปลงเพาะปลูก</span>
          </button>
        </form>
      </div>
    </div>
  );
};
