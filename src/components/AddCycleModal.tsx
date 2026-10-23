import React, { useState, useEffect } from 'react';
import { CropCycle } from '../types';
import {
  calculateTotalRai,
  getTodayIso,
  CROP_CONFIGS,
  calculateHarvestDate,
  formatDateThai,
  formatDateSlashThai
} from '../utils/thaiAgUnits';
import { X, Check, Calendar, Sparkles } from 'lucide-react';

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
  const [expectedYieldKg, setExpectedYieldKg] = useState('5000');
  const [targetPricePerKg, setTargetPricePerKg] = useState('14.5');
  const [isManuallyEditedDate, setIsManuallyEditedDate] = useState(false);

  // คำนวณวันเก็บเกี่ยวอัตโนมัติตามชนิดพืชและวันเริ่มปลูก
  useEffect(() => {
    const config = CROP_CONFIGS[cropType];
    if (config && startDate && !isManuallyEditedDate) {
      const autoDate = calculateHarvestDate(startDate, config.daysToHarvest);
      setExpectedHarvestDate(autoDate);

      // คำนวณผลผลิตและราคาแนะนำตามพื้นที่
      const r = parseFloat(areaRai) || 0;
      const ng = parseFloat(areaNgan) || 0;
      const w = parseFloat(areaSqWa) || 0;
      const totalRai = calculateTotalRai(r, ng, w) || 1;

      setExpectedYieldKg(String(Math.round(totalRai * config.defaultYieldKgPerRai)));
      setTargetPricePerKg(String(config.defaultPricePerKg));

      // ถ้าชื่อยังว่าง ให้ตั้งชื่อแนะนำให้อัตโนมัติ เช่น "แปลงนา - ข้าว (เริ่ม 23/10/2569)"
      if (!name || name.includes('รอบ') || name.includes('แปลง')) {
        setName(`แปลง - ${cropType} (${formatDateSlashThai(startDate)})`);
      }
    }
  }, [cropType, startDate, areaRai, areaNgan, areaSqWa]);

  // สลับชนิดพืช
  const handleCropChange = (newType: string) => {
    setCropType(newType);
    setIsManuallyEditedDate(false); // รีเซ็ตเพื่อให้ระบบคำนวณวันเก็บเกี่ยวให้ใหม่ทันที
    const config = CROP_CONFIGS[newType];
    if (config) {
      const autoDate = calculateHarvestDate(startDate, config.daysToHarvest);
      setExpectedHarvestDate(autoDate);
    }
  };

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

  const currentCropConfig = CROP_CONFIGS[cropType] || CROP_CONFIGS['ข้าว'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentCropConfig.icon}</span>
            <div>
              <h2 className="text-base font-bold">เพิ่มแปลง / รอบการปลูกใหม่</h2>
              <p className="text-xs text-emerald-200">คำนวณวันเก็บเกี่ยวอัตโนมัติตามพืชที่ปลูก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs max-h-[85vh] overflow-y-auto">
          
          {/* 1. เลือกชนิดพืช (ยางพารา, ผักกาด, ข้าว, ข้าวโพด, มันสำปะหลัง, อ้อย) */}
          <div>
            <label className="font-bold text-slate-800 text-sm block mb-1.5">
              1. เลือกชนิดพืชที่ปลูก <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(CROP_CONFIGS).map((cfg) => {
                const isSelected = cropType === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => handleCropChange(cfg.id)}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all btn-touch-active ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cfg.icon}</span>
                    <span className="text-xs leading-tight">{cfg.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ชื่อแปลง */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              2. ชื่อแปลง / รอบปลูก:
            </label>
            <input
              type="text"
              required
              placeholder="เช่น แปลงผักกาดสวนหลังบ้าน, แปลงนายางพารา 10 ไร่"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:bg-white focus:outline-emerald-600"
            />
          </div>

          {/* 3. ขนาดพื้นที่แปลง (ไร่-งาน-วา) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
            <label className="font-bold text-slate-700 block mb-1">3. ขนาดพื้นที่แปลง:</label>
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

          {/* 4. วันที่เริ่มปลูก & วันคาดว่าจะเก็บเกี่ยว (คำนวณอัตโนมัติ!) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>รอบระยะเวลาการเพาะปลูก:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  🌱 วันที่เริ่มปลูก:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setIsManuallyEditedDate(false);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ({formatDateSlashThai(startDate)})
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  🌾 คาดเก็บเกี่ยว:
                </label>
                <input
                  type="date"
                  value={expectedHarvestDate}
                  onChange={(e) => {
                    setExpectedHarvestDate(e.target.value);
                    setIsManuallyEditedDate(true);
                  }}
                  className="w-full bg-white border-2 border-emerald-500 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-900"
                />
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  ({formatDateSlashThai(expectedHarvestDate)})
                </span>
              </div>
            </div>

            {/* การ์ดแจ้งอายุการเก็บเกี่ยวอัตโนมัติ */}
            <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-start gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-700">
                <span>พืช: <strong>{currentCropConfig.name}</strong> มีอายุเก็บเกี่ยว <strong>{currentCropConfig.durationLabel}</strong></span>
                <br />
                <span className="text-emerald-800 font-semibold">
                  👉 ปลูก {formatDateSlashThai(startDate)} จะพร้อมเก็บเกี่ยวประมาณ <strong>{formatDateSlashThai(expectedHarvestDate)} ({formatDateThai(expectedHarvestDate)})</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 5. คาดการณ์ผลผลิตรวม (กก.) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                คาดผลผลิตรวม (กก.):
              </label>
              <input
                type="number"
                value={expectedYieldKg}
                onChange={(e) => setExpectedYieldKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ราคาเป้าหมาย (บ./กก.):
              </label>
              <input
                type="number"
                step="0.1"
                value={targetPricePerKg}
                onChange={(e) => setTargetPricePerKg(e.target.value)}
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
