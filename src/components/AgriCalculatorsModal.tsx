import React, { useState } from 'react';
import { X, Sparkles, Scale, Trees, FlaskConical, ArrowRight } from 'lucide-react';
import {
  calculateMoistureDeduction,
  calculateRubberYield,
  calculateFertilizerMix,
  formatMoney,
  formatNumber
} from '../utils/thaiAgUnits';

interface AgriCalculatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIncome?: (amount: number, harvestWeightKg: number, title: string, notes: string) => void;
}

export const AgriCalculatorsModal: React.FC<AgriCalculatorsModalProps> = ({
  isOpen,
  onClose,
  onApplyIncome
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'moisture' | 'rubber' | 'fertilizer'>('moisture');

  // --- 1. State สำหรับคำนวณความชื้น (ข้าว/ข้าวโพด/มัน) ---
  const [cropKind, setCropKind] = useState<'rice' | 'corn' | 'cassava'>('rice');
  const [grossWeight, setGrossWeight] = useState<string>('5000');
  const [measuredMoisture, setMeasuredMoisture] = useState<string>('25');
  const [standardMoisture, setStandardMoisture] = useState<string>('15');
  const [deductionRate, setDeductionRate] = useState<string>('1.5');
  const [impurity, setImpurity] = useState<string>('2');
  const [pricePerUnit, setPricePerUnit] = useState<string>('14500');
  const [priceUnit, setPriceUnit] = useState<'ton' | 'kg'>('ton');

  // ค่ามาตรฐานเมื่อเปลี่ยนพืช
  const handleSelectCropKind = (kind: 'rice' | 'corn' | 'cassava') => {
    setCropKind(kind);
    if (kind === 'rice') {
      setStandardMoisture('15');
      setDeductionRate('1.5');
      setPricePerUnit('14500');
      setPriceUnit('ton');
    } else if (kind === 'corn') {
      setStandardMoisture('14.5');
      setDeductionRate('1.4');
      setPricePerUnit('9500');
      setPriceUnit('ton');
    } else {
      setStandardMoisture('30');
      setDeductionRate('1.2');
      setPricePerUnit('3.2');
      setPriceUnit('kg');
    }
  };

  const moistureResult = calculateMoistureDeduction({
    grossWeightKg: Number(grossWeight) || 0,
    measuredMoisture: Number(measuredMoisture) || 0,
    standardMoisture: Number(standardMoisture) || 15,
    deductionRatePercent: Number(deductionRate) || 1.5,
    impurityPercent: Number(impurity) || 0,
    pricePerUnit: Number(pricePerUnit) || 0,
    priceUnit
  });

  // --- 2. State สำหรับคำนวณยางพารา (% DRC & ส่วนแบ่งคนกรีด) ---
  const [freshLatex, setFreshLatex] = useState<string>('120');
  const [drcPercent, setDrcPercent] = useState<string>('33');
  const [rubberPrice, setRubberPrice] = useState<string>('72');
  const [ownerSharePct, setOwnerSharePct] = useState<number>(60);

  const rubberResult = calculateRubberYield({
    freshLatexKg: Number(freshLatex) || 0,
    drcPercent: Number(drcPercent) || 0,
    pricePerKgDry: Number(rubberPrice) || 0,
    ownerSharePercent: ownerSharePct
  });

  // --- 3. State สำหรับคำนวณปุ๋ยสั่งตัด N-P-K ---
  const [targetN, setTargetN] = useState<string>('16');
  const [targetP, setTargetP] = useState<string>('16');
  const [targetK, setTargetK] = useState<string>('8');
  const [batchKg, setBatchKg] = useState<string>('100');
  const [ureaPrice, setUreaPrice] = useState<string>('850');
  const [dapPrice, setDapPrice] = useState<string>('1450');
  const [mopPrice, setMopPrice] = useState<string>('950');
  const [readyMadePrice, setReadyMadePrice] = useState<string>('1350');

  const handleSelectFertPreset = (n: number, p: number, k: number) => {
    setTargetN(String(n));
    setTargetP(String(p));
    setTargetK(String(k));
  };

  const fertResult = calculateFertilizerMix({
    targetN: Number(targetN) || 0,
    targetP: Number(targetP) || 0,
    targetK: Number(targetK) || 0,
    batchWeightKg: Number(batchKg) || 100,
    ureaPricePer50Kg: Number(ureaPrice) || 850,
    dapPricePer50Kg: Number(dapPrice) || 1450,
    mopPricePer50Kg: Number(mopPrice) || 950,
    readyMadePricePer50Kg: Number(readyMadePrice) || 1350
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧮</span>
            <div>
              <h2 className="text-base font-bold">เครื่องคิดเลขการเกษตรหน้าลาน</h2>
              <p className="text-xs text-emerald-200">คำนวณแม่นยำ ไม่โดนกดราคาในทุ่งนา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 shrink-0 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('moisture')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 btn-touch-active transition-all ${
              activeTab === 'moisture'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>หักความชื้น/สิ่งเจือปน</span>
          </button>

          <button
            onClick={() => setActiveTab('rubber')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 btn-touch-active transition-all ${
              activeTab === 'rubber'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>น้ำยาง (% DRC & คนกรีด)</span>
          </button>

          <button
            onClick={() => setActiveTab('fertilizer')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 btn-touch-active transition-all ${
              activeTab === 'fertilizer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>ปุ๋ยสั่งตัด (N-P-K)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* TAB 1: คำนวณหักความชื้นและสิ่งเจือปน */}
          {activeTab === 'moisture' && (
            <div className="space-y-3">
              {/* เลือกชนิดพืช */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'rice', label: '🌾 ข้าวเปลือก' },
                  { id: 'corn', label: '🌽 ข้าวโพด' },
                  { id: 'cassava', label: '🥔 มันสำปะหลัง' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCropKind(c.id as any)}
                    className={`py-2 rounded-xl font-bold border btn-touch-active text-center ${
                      cropKind === c.id
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* ฟอร์มกรอกตัวเลขหน้าลาน */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      น้ำหนักชั่งรวม (กก.):
                    </label>
                    <input
                      type="number"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      className="w-full text-base font-black bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      ความชื้นที่วัดได้ (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measuredMoisture}
                      onChange={(e) => setMeasuredMoisture(e.target.value)}
                      className="w-full text-base font-black bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-rose-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div>
                    <label className="text-slate-500 font-bold block mb-0.5">ความชื้นมาตรฐาน:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={standardMoisture}
                      onChange={(e) => setStandardMoisture(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-0.5">อัตราหัก/1% เกิน:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={deductionRate}
                      onChange={(e) => setDeductionRate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-0.5">สิ่งเจือปน (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={impurity}
                      onChange={(e) => setImpurity(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-center font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">ราคาขาย:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        className="w-24 text-right font-black text-sm bg-white border border-slate-300 rounded-lg px-2 py-1"
                      />
                      <select
                        value={priceUnit}
                        onChange={(e) => setPriceUnit(e.target.value as any)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-xs"
                      >
                        <option value="ton">บาท/ตัน</option>
                        <option value="kg">บาท/กก.</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* กล่องสรุปผลลัพธ์สุทธิ */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">สรุปเงินที่ต้องได้รับจริง:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {formatMoney(moistureResult.totalAmount)} บาท
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/80">
                  <div>
                    <span className="text-emerald-800">น้ำหนักชั่งสด:</span>
                    <span className="font-bold ml-1">{formatNumber(Number(grossWeight))} กก.</span>
                  </div>
                  <div>
                    <span className="text-emerald-800">น้ำหนักสุทธิหลังหัก:</span>
                    <span className="font-black text-emerald-900 ml-1">
                      {formatNumber(moistureResult.netWeightKg)} กก. ({moistureResult.netWeightTon} ตัน)
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-700">โดนหักความชื้น:</span>
                    <span className="font-bold text-rose-700 ml-1">
                      -{formatNumber(moistureResult.moistureDeductionWeightKg)} กก. ({moistureResult.moistureExcess}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-700">โดนหักสิ่งเจือปน:</span>
                    <span className="font-bold text-rose-700 ml-1">
                      -{formatNumber(moistureResult.impurityDeductionWeightKg)} กก.
                    </span>
                  </div>
                </div>

                {onApplyIncome && (
                  <button
                    onClick={() => {
                      const cropThai = cropKind === 'rice' ? 'ข้าว' : cropKind === 'corn' ? 'ข้าวโพด' : 'มันสำปะหลัง';
                      onApplyIncome(
                        moistureResult.totalAmount,
                        moistureResult.netWeightKg,
                        `ขาย${cropThai} (หักความชื้น)`,
                        `ชั่งสด ${grossWeight} กก. เหลือสุทธิ ${moistureResult.netWeightKg} กก. (ชื้น ${measuredMoisture}%)`
                      );
                      onClose();
                    }}
                    className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active min-h-[48px]"
                  >
                    <span>🟢 นำยอดเงินนี้เข้าบันทึกรายรับทันที</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: น้ำยางพารา (% DRC & ส่วนแบ่งคนกรีด) */}
          {activeTab === 'rubber' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      น้ำยางสดชั่งได้ (กก.):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={freshLatex}
                      onChange={(e) => setFreshLatex(e.target.value)}
                      className="w-full text-base font-black bg-white border border-slate-300 rounded-xl px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      เปอร์เซ็นต์น้ำยางแห้ง (% DRC):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={drcPercent}
                      onChange={(e) => setDrcPercent(e.target.value)}
                      className="w-full text-base font-black bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-emerald-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ราคาประมูลยางแห้งวันนี้ (บาท/กก.):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rubberPrice}
                    onChange={(e) => setRubberPrice(e.target.value)}
                    className="w-full text-base font-black bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>

                {/* สัดส่วนแบ่งคนกรีดยาง */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    สัดส่วนแบ่งรายได้ (เจ้าของสวน : คนกรีด):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { owner: 60, label: '60 : 40' },
                      { owner: 55, label: '55 : 45' },
                      { owner: 50, label: '50 : 50' },
                      { owner: 100, label: '100% (กรีดเอง)' }
                    ].map((sp) => (
                      <button
                        key={sp.owner}
                        type="button"
                        onClick={() => setOwnerSharePct(sp.owner)}
                        className={`py-1.5 rounded-xl font-bold border btn-touch-active text-center text-xs ${
                          ownerSharePct === sp.owner
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* กล่องผลลัพธ์น้ำยาง */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">เนื้อยางแห้งสุทธิ:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatNumber(rubberResult.dryRubberKg)} กก.
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>เงินรวมทั้งหมด:</span>
                  <span className="font-bold">{formatMoney(rubberResult.totalRevenue)} บาท</span>
                </div>

                <div className="pt-2 border-t border-emerald-200 grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] text-emerald-800 font-bold">
                      เจ้าของสวน ({ownerSharePct}%)
                    </div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      {formatMoney(rubberResult.ownerShare)} บ.
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <div className="text-[10px] text-amber-800 font-bold">
                      คนกรีด ({rubberResult.tapperPercent}%)
                    </div>
                    <div className="text-base font-black text-amber-800 mt-0.5">
                      {formatMoney(rubberResult.tapperShare)} บ.
                    </div>
                  </div>
                </div>

                {onApplyIncome && (
                  <button
                    onClick={() => {
                      onApplyIncome(
                        rubberResult.ownerShare,
                        rubberResult.dryRubberKg,
                        'ขายน้ำยางสด (ส่วนเจ้าของสวน)',
                        `น้ำยางสด ${freshLatex} กก. (DRC ${drcPercent}%) ได้ยางแห้ง ${rubberResult.dryRubberKg} กก. แบ่ง ${ownerSharePct}:${rubberResult.tapperPercent}`
                      );
                      onClose();
                    }}
                    className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm btn-touch-active min-h-[48px]"
                  >
                    <span>🟢 บันทึกเงินเจ้าของสวน ({formatMoney(rubberResult.ownerShare)} บ.) เข้าบัญชี</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ปุ๋ยสั่งตัด N-P-K ผสมเองประหยัดเงิน */}
          {activeTab === 'fertilizer' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    สูตรยอดฮิต (แตะเลือกด่วน):
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { n: 16, p: 16, k: 8, label: '16-16-8' },
                      { n: 15, p: 15, k: 15, label: '15-15-15' },
                      { n: 16, p: 20, k: 0, label: '16-20-0' },
                      { n: 13, p: 13, k: 21, label: '13-13-21' }
                    ].map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => handleSelectFertPreset(f.n, f.p, f.k)}
                        className="py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-center font-bold text-xs btn-touch-active"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">N (ไนโตรเจน):</label>
                    <input
                      type="number"
                      value={targetN}
                      onChange={(e) => setTargetN(e.target.value)}
                      className="w-full text-center font-black bg-white border border-slate-300 rounded-lg p-1.5 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">P (ฟอสฟอรัส):</label>
                    <input
                      type="number"
                      value={targetP}
                      onChange={(e) => setTargetP(e.target.value)}
                      className="w-full text-center font-black bg-white border border-slate-300 rounded-lg p-1.5 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">K (โพแทสเซียม):</label>
                    <input
                      type="number"
                      value={targetK}
                      onChange={(e) => setTargetK(e.target.value)}
                      className="w-full text-center font-black bg-white border border-slate-300 rounded-lg p-1.5 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      น้ำหนักต้องการผสม (กก.):
                    </label>
                    <input
                      type="number"
                      value={batchKg}
                      onChange={(e) => setBatchKg(e.target.value)}
                      className="w-full font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      ราคาปุ๋ยสำเร็จรูป/กระสอบ:
                    </label>
                    <input
                      type="number"
                      value={readyMadePrice}
                      onChange={(e) => setReadyMadePrice(e.target.value)}
                      className="w-full font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* ผลลัพธ์สูตรผสมแม่ปุ๋ย */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">
                    ต้องใช้แม่ปุ๋ยผสมสูตร {targetN}-{targetP}-{targetK} ({batchKg} กก.):
                  </span>
                  <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    ประหยัดได้ {formatMoney(fertResult.savingsVsReadyMade)} บ.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">แม่ปุ๋ย 46-0-0 (ยูเรีย):</span>
                    <span className="font-black text-slate-900 text-sm">{fertResult.ureaKg} กก.</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">แม่ปุ๋ย 18-46-0 (DAP):</span>
                    <span className="font-black text-slate-900 text-sm">{fertResult.dapKg} กก.</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">แม่ปุ๋ย 0-0-60 (MOP):</span>
                    <span className="font-black text-slate-900 text-sm">{fertResult.mopKg} กก.</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">สารตัวเติม (ดิน/รำ/แกลบ):</span>
                    <span className="font-black text-slate-600 text-sm">{fertResult.fillerKg} กก.</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                  <span className="text-slate-700">ต้นทุนผสมเองเฉลี่ย/กระสอบ 50 กก.:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatMoney(fertResult.costPer50Kg)} บาท (สำเร็จรูป {readyMadePrice} บ.)
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดเครื่องคิดเลข
          </button>
        </div>
      </div>
    </div>
  );
};
