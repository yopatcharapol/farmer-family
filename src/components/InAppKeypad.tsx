import React from 'react';
import { Delete, Check } from 'lucide-react';
import { formatMoney } from '../utils/thaiAgUnits';

interface InAppKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  isIncome?: boolean;
}

// เล่นเสียงบี๊บเบาๆ และสั่น เพื่อให้ผู้ใหญ่กดแล้วมั่นใจว่าติด
function playFeedback() {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(25);
    }
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 650;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Ignore audio error
  }
}

export const InAppKeypad: React.FC<InAppKeypadProps> = ({
  value,
  onChange,
  onConfirm,
  confirmLabel = '✅ บันทึกรายการทันที',
  isIncome = false
}) => {
  const handleDigit = (digit: string) => {
    playFeedback();
    if (value === '0' && digit !== '.') {
      onChange(digit);
    } else if (digit === '.' && value.includes('.')) {
      return;
    } else {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    playFeedback();
    if (value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    playFeedback();
    onChange('');
  };

  const handleQuickAdd = (amount: number) => {
    playFeedback();
    const current = Number(value) || 0;
    onChange(String(current + amount));
  };

  const numVal = Number(value) || 0;

  return (
    <div className="bg-slate-100 rounded-3xl p-3 border border-slate-300 shadow-inner">
      {/* จอแสดงผลตัวเลขยักษ์ */}
      <div className="bg-white rounded-2xl p-3 mb-2.5 border-2 border-slate-300 flex items-center justify-between shadow-xs">
        <span className="text-sm font-semibold text-slate-500">ยอดเงินรวม:</span>
        <div className="text-right">
          <span className={`text-3xl font-black tracking-tight ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
            {value ? formatMoney(numVal) : '0'}
          </span>
          <span className="text-sm font-bold text-slate-600 ml-1">บาท</span>
        </div>
      </div>

      {/* ปุ่มเพิ่มเงินด่วน (+100, +500, +1,000, +5,000) */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[100, 500, 1000, 5000].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleQuickAdd(amt)}
            className="py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs btn-touch-active active:bg-slate-200"
          >
            +{formatMoney(amt)}
          </button>
        ))}
      </div>

      {/* แป้นตัวเลขขนาดใหญ่ 1-9, 0, จุด, ลบ */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-14 bg-white hover:bg-slate-50 active:bg-slate-200 border-b-4 border-slate-300 active:border-b-0 rounded-2xl text-2xl font-bold text-slate-900 shadow-sm flex items-center justify-center btn-touch-active"
          >
            {d}
          </button>
        ))}

        {/* แถวล่างสุด: ล้างค่า, 0, ลบทีละตัว */}
        <button
          type="button"
          onClick={handleClear}
          className="h-14 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border-b-4 border-slate-300 active:border-b-0 rounded-2xl text-sm font-bold text-slate-700 shadow-sm flex items-center justify-center btn-touch-active"
        >
          ล้างค่า
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 bg-white hover:bg-slate-50 active:bg-slate-200 border-b-4 border-slate-300 active:border-b-0 rounded-2xl text-2xl font-bold text-slate-900 shadow-sm flex items-center justify-center btn-touch-active"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="h-14 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 border-b-4 border-rose-300 active:border-b-0 rounded-2xl text-rose-700 shadow-sm flex items-center justify-center btn-touch-active"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* ปุ่มยืนยันขนาดใหญ่พิเศษ */}
      <button
        type="button"
        disabled={numVal <= 0}
        onClick={() => {
          playFeedback();
          onConfirm();
        }}
        className={`w-full h-15 rounded-2xl text-lg font-black text-white shadow-lg flex items-center justify-center gap-2 btn-touch-active transition-all ${
          numVal > 0
            ? isIncome
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 active:scale-98'
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 active:scale-98'
            : 'bg-slate-400 cursor-not-allowed opacity-60'
        }`}
      >
        <Check className="w-6 h-6" />
        <span>{confirmLabel}</span>
      </button>
    </div>
  );
};

