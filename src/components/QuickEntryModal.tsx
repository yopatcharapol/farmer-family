import React, { useState, useEffect } from 'react';
import {
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  FamilyMember,
  CropCycle,
  DEFAULT_FAMILY_MEMBERS,
  QuickTemplate,
  PaymentStatus,
  Transaction
} from '../types';
import { CATEGORIES, PRESET_ITEMS, PresetItem, QUICK_TEMPLATES } from '../data/presets';
import { InAppKeypad } from './InAppKeypad';
import { X, ArrowLeft, Sparkles, Calendar, Store, Users, SplitSquareVertical, Info } from 'lucide-react';
import { getTodayIso, getYesterdayIso, formatMoney, calculateSplitExpense } from '../utils/thaiAgUnits';

interface QuickEntryModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  activeMemberId: string;
  cycleId: string;
  currentCycle?: CropCycle;
  cycles?: CropCycle[];
  familyMembers?: FamilyMember[];
  editingTransaction?: Transaction | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    cycleId: string;
    type: TransactionType;
    category: ExpenseCategory | IncomeCategory;
    categoryLabel: string;
    title: string;
    amount: number;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    recordedBy: string;
    paidBy?: string;
    paymentStatus?: PaymentStatus;
    creditorName?: string;
    date: string;
    notes?: string;
    harvestWeight?: number;
    splitAllocations?: Array<{ plotId: string; allocatedAmount: number }>;
  }) => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  initialType,
  activeMemberId,
  cycleId,
  currentCycle,
  cycles = [],
  familyMembers = DEFAULT_FAMILY_MEMBERS,
  editingTransaction,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const plotAreaRai = currentCycle?.totalAreaRai || 1;

  const [type, setType] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : initialType
  );
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory | null>(
    editingTransaction ? editingTransaction.category : null
  );
  const [selectedItemName, setSelectedItemName] = useState<string>(
    editingTransaction ? editingTransaction.title : ''
  );
  const [quantity, setQuantity] = useState<string>(
    editingTransaction?.quantity ? String(editingTransaction.quantity) : '1'
  );
  const [unit, setUnit] = useState<string>(
    editingTransaction?.unit || 'ไร่'
  );
  const [amount, setAmount] = useState<string>(
    editingTransaction ? String(editingTransaction.amount) : ''
  );
  const [step, setStep] = useState<'category' | 'preset' | 'keypad'>(
    editingTransaction ? 'keypad' : 'category'
  );

  // [#3] วันที่ย้อนหลัง (วันนี้, เมื่อวาน, เลือกเอง)
  const [date, setDate] = useState<string>(
    editingTransaction ? editingTransaction.date : getTodayIso()
  );
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');

  // [#5] หมายเหตุสั้นๆ
  const [notes, setNotes] = useState<string>(
    editingTransaction?.notes || ''
  );

  // [#6] จ่ายสด vs เงินเชื่อ
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    editingTransaction?.paymentStatus || 'paid'
  );
  const [creditorName, setCreditorName] = useState<string>(
    editingTransaction?.creditorName || ''
  );

  // [#7] ใครควักเงินจ่ายจริง
  const [paidBy, setPaidBy] = useState<string>(
    editingTransaction?.paidBy || activeMemberId || 'dad'
  );

  // [#18] น้ำหนักผลผลิต (กก.)
  const [harvestWeight, setHarvestWeight] = useState<string>(
    editingTransaction?.harvestWeight ? String(editingTransaction.harvestWeight) : ''
  );

  // [#10] แบ่งบิลเข้าหลายแปลง
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [selectedSplitPlots, setSelectedSplitPlots] = useState<string[]>([cycleId]);
  const [splitMethod, setSplitMethod] = useState<'byArea' | 'equal'>('byArea');

  const currentMember = familyMembers.find((m) => m.id === activeMemberId) || familyMembers[0];
  const availableCategories = CATEGORIES.filter((c) => c.type === type);

  // เปลี่ยนวันที่ด่วน
  const handleSetDatePreset = (preset: 'today' | 'yesterday') => {
    setDateMode(preset);
    if (preset === 'today') setDate(getTodayIso());
    else setDate(getYesterdayIso());
  };

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

    if (defaultUnit === 'ไร่') {
      setQuantity(String(plotAreaRai));
    } else {
      setQuantity('1');
    }
    setStep('keypad');
  };

  // ปุ่มลัดเลือกหน่วย
  const handleSelectUnit = (newUnit: string) => {
    setUnit(newUnit);
    if (newUnit === 'ไร่') {
      setQuantity(String(plotAreaRai));
    }
  };

  // คำนวณราคาต่อไร่ด่วน
  const handleQuickRatePerRai = (ratePerRai: number) => {
    const qty = parseFloat(quantity) || plotAreaRai;
    const total = Math.round(ratePerRai * qty);
    setAmount(String(total));
  };

  // เลือกรายการด่วนยอดฮิต
  const handleSelectQuickTemplate = (qt: QuickTemplate) => {
    setType(qt.type);
    setSelectedCategory(qt.category);
    setSelectedItemName(qt.title);
    const defUnit = qt.defaultUnit || 'ไร่';
    setUnit(defUnit);
    if (defUnit === 'ไร่') {
      setQuantity(String(plotAreaRai));
      const rate = qt.defaultAmount || 250;
      setAmount(String(Math.round(rate * plotAreaRai)));
    } else {
      setQuantity(String(qt.defaultQuantity || 1));
      setAmount(String(qt.defaultAmount || ''));
    }
    setStep('keypad');
  };

  // กดยืนยันบันทึก
  const handleConfirmSave = () => {
    const totalAmount = Number(amount) || 0;
    if (totalAmount <= 0 || !selectedCategory) return;

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const qtyNum = Number(quantity) || 1;
    const netHarvestWeight = harvestWeight ? Number(harvestWeight) : undefined;

    // คำนวณหารบิลกรณีติ๊กหลายแปลง
    let splitAllocations: Array<{ plotId: string; allocatedAmount: number }> | undefined = undefined;
    if (isSplitting && selectedSplitPlots.length > 1 && type === 'expense') {
      const activePlots = cycles.filter((c) => selectedSplitPlots.includes(c.id));
      const splits = calculateSplitExpense(totalAmount, activePlots, splitMethod);
      splitAllocations = splits.map((s) => ({
        plotId: s.plotId,
        allocatedAmount: s.allocatedAmount
      }));
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
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
      paidBy: type === 'expense' ? paidBy : undefined,
      paymentStatus: type === 'expense' ? paymentStatus : 'paid',
      creditorName: type === 'expense' && paymentStatus === 'credit' ? creditorName : undefined,
      date,
      notes: notes.trim() || undefined,
      harvestWeight: netHarvestWeight,
      splitAllocations
    });

    onClose();
  };

  const qtyNumber = parseFloat(quantity) || 1;
  const numAmount = parseFloat(amount) || 0;
  const ratePerUnit = qtyNumber > 0 && numAmount > 0 ? numAmount / qtyNumber : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header แถบหัวเรื่อง */}
        <div className={`p-3.5 flex items-center justify-between text-white shrink-0 ${
          type === 'expense' ? 'bg-rose-700' : 'bg-emerald-700'
        }`}>
          <div className="flex items-center gap-2">
            {step !== 'category' && !editingTransaction && (
              <button
                onClick={() => setStep(step === 'keypad' ? 'preset' : 'category')}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 btn-touch-active"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {editingTransaction
                  ? `✏️ แก้ไขรายการ (${type === 'expense' ? 'รายจ่าย' : 'รายรับ'})`
                  : type === 'expense' ? '🔴 บันทึกรายจ่าย' : '🟢 บันทึกรายรับ'}
              </h2>
              <p className="text-xs text-white/85">
                {currentCycle ? `แปลง: ${currentCycle.name}` : `ผู้บันทึก: ${currentMember?.name}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">
          
          {/* สลับ รายจ่าย / รายรับ (ซ่อนถ้าอยู่ในโหมดแก้ไข) */}
          {!editingTransaction && (
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => {
                  setType('expense');
                  setSelectedCategory(null);
                  setStep('category');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all btn-touch-active ${
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
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all btn-touch-active ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🟢 ได้เงิน (ขายผลผลิต)
              </button>
            </div>
          )}

          {/* STEP 1: เลือกหมวดหมู่ */}
          {step === 'category' && (
            <div className="space-y-3">
              {type === 'expense' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      รายการใช้บ่อยยอดฮิต:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_TEMPLATES.map((qt) => (
                      <button
                        key={qt.id}
                        type="button"
                        onClick={() => handleSelectQuickTemplate(qt)}
                        className="p-2 bg-white hover:bg-amber-100/60 border border-amber-300/80 rounded-xl flex items-center gap-2 text-left btn-touch-active shadow-2xs min-h-[48px]"
                      >
                        <span className="text-2xl shrink-0">{qt.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{qt.title}</div>
                          <div className="text-[10px] text-amber-800 font-semibold">
                            {qt.defaultAmount ? `~${qt.defaultAmount} บ.` : ''} ({qt.defaultUnit})
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">
                  {type === 'expense' ? 'เลือกจาก 8 หมวดหมู่ต้นทุน:' : 'เลือกหมวดหมู่รายรับ:'}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 text-left transition-all btn-touch-active ${cat.bgLight} ${cat.borderColor} shadow-xs hover:shadow-md min-h-[54px]`}
                    >
                      <span className="text-2xl shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className={`text-xs sm:text-sm font-bold truncate ${cat.color}`}>{cat.name}</div>
                        <div className="text-[10px] text-slate-500 leading-tight line-clamp-1">
                          {cat.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: เลือก Preset ย่อย */}
          {step === 'preset' && selectedCategory && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500">แตะเลือกรายการยอดฮิต:</p>
                <button
                  onClick={() => setStep('category')}
                  className="text-xs text-emerald-700 font-semibold"
                >
                  เปลี่ยนหมวด
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {(PRESET_ITEMS[selectedCategory] || []).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 flex items-center justify-between shadow-xs btn-touch-active text-left min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">{preset.name}</span>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      หน่วย: {preset.defaultUnit === 'ไร่' ? `ไร่ (${plotAreaRai} ไร่)` : preset.defaultUnit}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
                    setSelectedItemName(catObj?.name || 'รายการอื่นๆ');
                    setUnit('ไร่');
                    setQuantity(String(plotAreaRai));
                    setStep('keypad');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl btn-touch-active min-h-[44px]"
                >
                  ✏️ ระบุชื่อรายการอื่นๆ เอง
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: หน้าคีย์ตัวเลข + ออปชันขั้นสูงครบวงจร */}
          {step === 'keypad' && (
            <div className="space-y-2.5">
              
              {/* การ์ดข้อมูลรายการ */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2.5 text-xs">
                
                {/* 1. ชื่อรายการ */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-bold shrink-0">ชื่อรายการ:</span>
                  <input
                    type="text"
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-right focus:outline-emerald-600 flex-1 max-w-[220px]"
                    placeholder="พิมพ์ชื่อรายการ..."
                  />
                </div>

                {/* 2. [#3] ปุ่มเลือกวันที่ย้อนหลัง (วันนี้ / เมื่อวาน / เลือกเอง) */}
                <div className="pt-1.5 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      วันที่ทำรายการ:
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{date}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('today')}
                      className={`py-1.5 rounded-xl font-bold text-xs btn-touch-active border ${
                        dateMode === 'today'
                          ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      วันนี้
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDatePreset('yesterday')}
                      className={`py-1.5 rounded-xl font-bold text-xs btn-touch-active border ${
                        dateMode === 'yesterday'
                          ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      เมื่อวาน
                    </button>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setDateMode('custom');
                      }}
                      className="bg-white border border-slate-300 rounded-xl px-1 text-center font-bold text-xs"
                    />
                  </div>
                </div>

                {/* 3. [#6] เลือก จ่ายสด vs เงินเชื่อ (เฉพาะรายจ่าย) */}
                {type === 'expense' && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1">การชำระเงิน:</span>
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('paid')}
                        className={`py-1.5 rounded-xl font-bold text-xs btn-touch-active border ${
                          paymentStatus === 'paid'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        💵 จ่ายสดแล้ว
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('credit')}
                        className={`py-1.5 rounded-xl font-bold text-xs btn-touch-active border ${
                          paymentStatus === 'credit'
                            ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                            : 'bg-white text-rose-700 border-rose-300'
                        }`}
                      >
                        💳 แปะหนี้ (เงินเชื่อ)
                      </button>
                    </div>

                    {paymentStatus === 'credit' && (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="ชื่อร้านค้า/เจ้าหนี้ (เช่น ร้านเจ๊หมวยเกษตร)..."
                          value={creditorName}
                          onChange={(e) => setCreditorName(e.target.value)}
                          className="w-full bg-white border border-rose-300 rounded-xl p-1.5 text-xs text-rose-950 font-bold"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. [#7] ใครควักเงินจ่ายจริง (เฉพาะรายจ่ายสด) */}
                {type === 'expense' && paymentStatus === 'paid' && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      ใครควักเงินสดจ่ายรอบนี้:
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {familyMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaidBy(m.id)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 btn-touch-active border ${
                            paidBy === m.id
                              ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{m.avatar}</span>
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. [#18] น้ำหนักผลผลิต (เฉพาะรายรับขายผลผลิต) */}
                {type === 'income' && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">น้ำหนักขายได้ (กก.):</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="เช่น 1500 กก."
                        value={harvestWeight}
                        onChange={(e) => setHarvestWeight(e.target.value)}
                        className="w-32 bg-white border border-emerald-400 rounded-xl p-1 text-right font-black text-sm text-emerald-800"
                      />
                    </div>
                  </div>
                )}

                {/* 6. จำนวน & หน่วย */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
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

                {/* ปุ่มลัดหน่วย */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">หน่วย:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectUnit('ไร่')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 btn-touch-active ${
                      unit === 'ไร่'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    🌾 ไร่ ({plotAreaRai} ไร่)
                  </button>
                  {['กระสอบ', 'ลิตร', 'วัน', 'เที่ยว', 'กก.', 'ตัน'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold shrink-0 btn-touch-active ${
                        unit === u
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {/* ปุ่มราคาต่อไร่ด่วน */}
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

                {/* 7. [#10] แบ่งบิลเข้าหลายแปลง (เฉพาะรายจ่ายและมีมากกว่า 1 แปลง) */}
                {type === 'expense' && cycles.length > 1 && !editingTransaction && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSplitting}
                          onChange={(e) => setIsSplitting(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <SplitSquareVertical className="w-3.5 h-3.5 text-slate-600" />
                        <span>กระจายบิลนี้เข้าหลายแปลง</span>
                      </label>
                      {isSplitting && (
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSplitMethod('byArea')}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              splitMethod === 'byArea' ? 'bg-emerald-700 text-white' : 'bg-slate-200'
                            }`}
                          >
                            หารตามไร่
                          </button>
                          <button
                            type="button"
                            onClick={() => setSplitMethod('equal')}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              splitMethod === 'equal' ? 'bg-emerald-700 text-white' : 'bg-slate-200'
                            }`}
                          >
                            หารเท่ากัน
                          </button>
                        </div>
                      )}
                    </div>

                    {isSplitting && (
                      <div className="space-y-1 mt-1.5 bg-white p-2 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold mb-1">
                          เลือกแปลงที่ใช้ของร่วมกัน:
                        </div>
                        {cycles.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSplitPlots.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSplitPlots([...selectedSplitPlots, c.id]);
                                } else {
                                  setSelectedSplitPlots(selectedSplitPlots.filter((id) => id !== c.id));
                                }
                              }}
                              className="rounded text-emerald-600"
                            />
                            <span className="truncate">{c.name} ({c.totalAreaRai} ไร่)</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. [#5] หมายเหตุสั้นๆ (สูตรปุ๋ย, ร้านค้า, คนงาน) */}
                <div className="pt-1.5 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="จดหมายเหตุสั้นๆ เช่น สูตร 46-0-0, จ้างนายสมชาย..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800"
                  />
                </div>

              </div>

              {/* In-App Keypad */}
              <InAppKeypad
                value={amount}
                onChange={setAmount}
                onConfirm={handleConfirmSave}
                isIncome={type === 'income'}
                confirmLabel={
                  editingTransaction
                    ? '💾 บันทึกการแก้ไข'
                    : type === 'income'
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
