import React, { useState } from 'react';
import {
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  FamilyMemberId,
  FAMILY_MEMBERS
} from '../types';
import { CATEGORIES, PRESET_ITEMS, PresetItem } from '../data/presets';
import { InAppKeypad } from './InAppKeypad';
import { X, ArrowLeft } from 'lucide-react';
import { getTodayIso } from '../utils/thaiAgUnits';

interface QuickEntryModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  activeMemberId: FamilyMemberId;
  cycleId: string;
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
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<TransactionType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'category' | 'preset' | 'keypad'>('category');
  const [date, setDate] = useState<string>(getTodayIso());

  const currentMember = FAMILY_MEMBERS.find((m) => m.id === activeMemberId);

  // กรองหมวดหมู่ตามประเภท (รายจ่าย 8 หมวด หรือ รายได้ 3 หมวด)
  const availableCategories = CATEGORIES.filter((c) => c.type === type);

  // เลือกหมวดหมู่
  const handleSelectCategory = (catId: ExpenseCategory | IncomeCategory) => {
    setSelectedCategory(catId);
    const presets = PRESET_ITEMS[catId] || [];
    if (presets.length > 0) {
      setStep('preset');
    } else {
      setSelectedItemName(CATEGORIES.find((c) => c.id === catId)?.name || '');
      setStep('keypad');
    }
  };

  // เลือก Preset ย่อย
  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedItemName(preset.name);
    setUnit(preset.defaultUnit);
    setStep('keypad');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header แถบหัวเรื่อง & ผู้บันทึก */}
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
                บันทึกโดย: <span className="font-semibold">{currentMember?.avatar} {currentMember?.name}</span>
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
                  2. แตะเลือกรายการยอดฮิต หรือพิมพ์เอง:
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
                      หน่วย: {preset.defaultUnit}
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
                    setStep('keypad');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl btn-touch-active"
                >
                  ✏️ ระบุชื่อรายการอื่นๆ เอง
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: แป้นตัวเลขขนาดใหญ่ในแอป */}
          {step === 'keypad' && (
            <div className="space-y-2.5">
              {/* แถบสรุปรายการที่กำลังจะบันทึก */}
              <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">รายการที่เลือก:</span>
                  <input
                    type="text"
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none"
                    placeholder="พิมพ์ชื่อรายการ..."
                  />
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">จำนวน/หน่วย:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-12 text-center font-bold bg-white border border-slate-300 rounded px-1 py-0.5 text-xs"
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="หน่วย"
                      className="w-14 text-center font-bold bg-white border border-slate-300 rounded px-1 py-0.5 text-xs"
                    />
                  </div>
                </div>
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
