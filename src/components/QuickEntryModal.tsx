import React, { useState, useEffect } from 'react';
import {
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  FamilyMemberId,
  CropCycle,
  FAMILY_MEMBERS
} from '../types';
import { CATEGORIES, PRESET_ITEMS, PresetItem } from '../data/presets';
import { InAppKeypad } from './InAppKeypad';
import { X, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { getTodayIso, formatMoney } from '../utils/thaiAgUnits';

interface QuickEntryModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  activeMemberId: FamilyMemberId;
  cycleId: string;
  currentCycle?: CropCycle;
  onClose: () => void;
  onSave: (data: {
    cycleId: string;
    type: TransactionType;
    category: ExpenseCategory | IncomeCategory;
    categoryLabel: string;
    title: string;
    amount: number;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    recordedBy: FamilyMemberId;
    date: string;
    notes?: string;
  }) => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  initialType,
  activeMemberId,
  cycleId,
  currentCycle,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const plotAreaRai = currentCycle?.totalAreaRai || 1;

  const [type, setType] = useState<TransactionType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('ไร่');
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'category' | 'preset' | 'keypad'>('category');
  const [date, setDate] = useState<string>(getTodayIso());

  const currentMember = FAMILY_MEMBERS.find((m) => m.id === activeMemberId);

  // กรองหมวดหมู่ตามประเภท (รายจ่าย 8 หมวด หรือ รายได้ 3 หมวด)
  const availableCategories = CATEGORIES.filter((c) => c.type === type);

  // เมื่อเลือกหมวดหมู่
  const handleSelectCategory = (catId: ExpenseCategory | IncomeCategory) => {
    setSelectedCategory(catId);
    const presets = PRESET_ITEMS[catId] || [];
    if (presets.length > 0) {
      setStep('preset');
    } else {
      const catObj = CATEGORIES.find((c) => c.id === catId);
      setSelectedItemName(catObj?.name || '');
      setUnit('ไร่');
      setQuantity(String(plotAreaRai));
      setStep('keypad');
    }
  };

  // เมื่อเลือก Preset ย่อย
  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedItemName(preset.name);
    const defaultUnit = preset.defaultUnit || 'ไร่';
    setUnit(defaultUnit);

    // ✨ ถ้าหน่วยเป็น "ไร่" ให้ใส่จำนวนเท่ากับพื้นที่แปลงอัตโนมัติทันที!
    if (defaultUnit === 'ไร่') {
      setQuantity(String(plotAreaRai));
    } else {
      setQuantity('1');
    }
    setStep('keypad');
  };

  // ปุ่มลัดเปลี่ยนหน่วย
  const handleSelectUnit = (newUnit: string) => {
    setUnit(newUnit);
    if (newUnit === 'ไร่') {
      setQuantity(String(plotAreaRai));
    }
  };

  // คำนวณราคาด่วนจาก "ราคาต่อไร่" เช่น ไถไร่ละ 250 บ. x พื้นที่แปลง
  const handleQuickRatePerRai = (ratePerRai: number) => {
    const qty = parseFloat(quantity) || plotAreaRai;
    const total = Math.round(ratePerRai * qty);
    setAmount(String(total));
  };

  // กดยืนยันบันทึก
  const handleConfirmSave = () => {
    const totalAmount = Number(amount) || 0;
    if (totalAmount <= 0 || !selectedCategory) return;

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const qtyNum = Number(quantity) || 1;

    onSave({
      cycleId,
      type,
      category: selectedCategory,
      categoryLabel: catObj?.name || 'ทั่วไป',
      title: selectedItemName || catObj?.name || 'รายการ',
      amount: totalAmount,
      quantity: qtyNum,
      unit: unit || undefined,
      unitPrice: qtyNum > 0 ? Number((totalAmount / qtyNum).toFixed(1)) : undefined,
      recordedBy: activeMemberId,
      date,
    });

    onClose();
  };

  const qtyNumber = parseFloat(quantity) || 1;
  const numAmount = parseFloat(amount) || 0;
  const ratePerUnit = qtyNumber > 0 && numAmount > 0 ? numAmount / qtyNumber : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header แถบหัวเรื่อง & ข้อมูลแปลง */}
        <div className={`p-3.5 flex items-center justify-between text-white ${
          type === 'expense' ? 'bg-rose-700' : 'bg-emerald-700'
        }`}>
          <div className="flex items-center gap-2">
            {step !== 'category' && (
              <button
                onClick={() => setStep(step === 'keypad' ? 'preset' : 'category')}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 btn-touch-active"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {type === 'expense' ? '🔴 บันทึกรายจ่าย' : '🟢 บันทึกรายรับ'}
              </h2>
              <p className="text-xs text-white/80">
                {currentCycle ? `แปลง: ${currentCycle.name} (${plotAreaRai} ไร่)` : `ผู้บันทึก: ${currentMember?.name}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 btn-touch-active"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">
          
          {/* สลับ รายจ่าย / รายรับ */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => {
                setType('expense');
                setSelectedCategory(null);
                setStep('category');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all btn-touch-active ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔴 จ่ายเงิน (8 หมวด)
            </button>
            <button
              onClick={() => {
                setType('income');
                setSelectedCategory(null);
                setStep('category');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all btn-touch-active ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟢 ได้เงิน (ขายผลผลิต)
            </button>
          </div>

          {/* STEP 1: เลือกหมวดหมู่ (8 หมวดต้นทุน หรือ 3 หมวดรายได้) */}
          {step === 'category' && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                1. แตะเลือกหมวดหมู่ที่ต้องการ:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 text-left transition-all btn-touch-active ${cat.bgLight} ${cat.borderColor} shadow-xs hover:shadow-md`}
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <div className={`text-sm font-bold ${cat.color}`}>{cat.name}</div>
                      <div className="text-[11px] text-slate-500 leading-tight line-clamp-1">
                        {cat.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: เลือก Preset ย่อยที่แตะครั้งเดียวจบ */}
          {step === 'preset' && selectedCategory && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500">
                  2. แตะเลือกรายการยอดฮิต:
                </p>
                <button
                  onClick={() => setStep('category')}
                  className="text-xs text-emerald-700 font-semibold"
                >
                  เปลี่ยนหมวดหมู่
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {(PRESET_ITEMS[selectedCategory] || []).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 flex items-center justify-between shadow-xs btn-touch-active text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className="text-sm font-bold text-slate-800">{preset.name}</span>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      หน่วย: {preset.defaultUnit === 'ไร่' ? `ไร่ (${plotAreaRai} ไร่)` : preset.defaultUnit}
                    </span>
                  </button>
                ))}
              </div>

              {/* หรือกำหนดชื่อรายการเอง */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
                    setSelectedItemName(catObj?.name || 'รายการอื่นๆ');
                    setUnit('ไร่');
                    setQuantity(String(plotAreaRai));
                    setStep('keypad');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl btn-touch-active"
                >
                  ✏️ ระบุชื่อรายการอื่นๆ เอง
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: แป้นตัวเลขขนาดใหญ่ในแอป + ปรับจำนวนและหน่วยให้ตรงกับขนาดแปลง */}
          {step === 'keypad' && (
            <div className="space-y-2.5">
              
              {/* การ์ดรายการ + จำนวนและหน่วย (สอดคล้องกับขนาดแปลง) */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 text-xs">
                
                {/* ชื่อรายการ */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">ชื่อรายการ:</span>
                  <input
                    type="text"
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right focus:outline-emerald-600 max-w-[200px]"
                    placeholder="พิมพ์ชื่อรายการ..."
                  />
                </div>

                {/* จำนวน & หน่วย */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-bold">จำนวน & หน่วย:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-16 text-center font-black text-base bg-white border-2 border-emerald-400 rounded-xl px-1 py-1 text-emerald-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="หน่วย"
                      className="w-16 text-center font-bold text-xs bg-white border border-slate-300 rounded-xl px-1 py-1.5 text-slate-800"
                    />
                  </div>
                </div>

                {/* ปุ่มลัดเลือกหน่วยยอดฮิต (โดยเฉพาะ ไร่ ที่ดึงขนาดแปลงทันที) */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">หน่วย:</span>
                  
                  {/* ปุ่ม ไร่ (ไฮไลต์พิเศษ ดึงจำนวนไร่ของแปลงทันที) */}
                  <button
                    type="button"
                    onClick={() => handleSelectUnit('ไร่')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 transition-all btn-touch-active ${
                      unit === 'ไร่'
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    🌾 ไร่ ({plotAreaRai} ไร่)
                  </button>

                  {['กระสอบ', 'ลิตร', 'วัน', 'เที่ยว', 'กก.', 'ตัน'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all btn-touch-active ${
                        unit === u
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {/* ปุ่มคำนวณราคาต่อไร่ด่วน (เมื่อหน่วยเป็น ไร่) */}
                {unit === 'ไร่' && (
                  <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        ปุ่มด่วนราคาต่อไร่ (x {quantity} ไร่):
                      </span>
                      {ratePerUnit > 0 && (
                        <span className="text-emerald-700 font-black">
                          = {ratePerUnit.toFixed(0)} บ./ไร่
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {[200, 250, 300, 450].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleQuickRatePerRai(rate)}
                          className="py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[10px] font-bold text-emerald-800 btn-touch-active shadow-2xs"
                        >
                          ไร่ละ {rate} บ.
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* In-App Keypad */}
              <InAppKeypad
                value={amount}
                onChange={setAmount}
                onConfirm={handleConfirmSave}
                isIncome={type === 'income'}
                confirmLabel={
                  type === 'income'
                    ? '✅ บันทึกรายรับทันที'
                    : '✅ บันทึกรายจ่ายทันที'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
