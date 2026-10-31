import React from 'react';
import { FamilyMember, FontSizeScale } from '../types';
import {
  Settings,
  RefreshCw,
  Scale,
  CreditCard,
  Users,
  Package,
  Calculator,
  Printer,
  Share2,
  Wrench,
  BarChart3
} from 'lucide-react';

interface FamilyBarProps {
  activeMemberId: string;
  familyMembers: FamilyMember[];
  fontSizeScale: FontSizeScale;
  isSyncing?: boolean;
  onSelectMember: (id: string) => void;
  onSelectFontSize: (scale: FontSizeScale) => void;
  onOpenSettings: () => void;
  onOpenUnitConverter: () => void;
  onOpenDebtModal: () => void;
  onOpenSettlementModal: () => void;
  onOpenInventoryModal: () => void;
  onOpenAgriCalculators: () => void;
  onOpenA4Report: () => void;
  onOpenPlotComparison: () => void;
  onOpenDebugConsole: () => void;
  onShareLine: () => void;
  onSync?: () => void;
}

export const FamilyBar: React.FC<FamilyBarProps> = ({
  activeMemberId,
  familyMembers,
  fontSizeScale,
  isSyncing = false,
  onSelectMember,
  onSelectFontSize,
  onOpenSettings,
  onOpenUnitConverter,
  onOpenDebtModal,
  onOpenSettlementModal,
  onOpenInventoryModal,
  onOpenAgriCalculators,
  onOpenA4Report,
  onOpenPlotComparison,
  onOpenDebugConsole,
  onShareLine,
  onSync
}) => {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-20 font-sans">
      {/* 1. ส่วนหัวชื่อฟาร์ม & ปุ่มระบบ */}
      <div className="max-w-md mx-auto px-3 pt-2.5 pb-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">สมุดบัญชีฟาร์ม</h1>
            <p className="text-[11px] text-emerald-200">บันทึกง่าย ซิงค์ร่วมกันทั้งบ้าน</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* [#14] ปุ่มสลับขนาดตัวหนังสือสำหรับผู้สูงอายุ (Senior Mode) */}
          <div className="flex bg-emerald-950/60 rounded-xl p-0.5 border border-emerald-700/60 text-[11px] font-bold">
            <button
              onClick={() => onSelectFontSize('normal')}
              className={`px-2 py-1 rounded-lg btn-touch-active ${
                fontSizeScale === 'normal' ? 'bg-amber-400 text-slate-900 shadow-2xs' : 'text-emerald-200'
              }`}
              title="ขนาดตัวหนังสือปกติ"
            >
              ปกติ
            </button>
            <button
              onClick={() => onSelectFontSize('large')}
              className={`px-2 py-1 rounded-lg btn-touch-active ${
                fontSizeScale === 'large' ? 'bg-amber-400 text-slate-900 shadow-2xs' : 'text-emerald-200'
              }`}
              title="ขนาดตัวหนังสือใหญ่ (พ่อแม่)"
            >
              ใหญ่
            </button>
            <button
              onClick={() => onSelectFontSize('extra-large')}
              className={`px-2 py-1 rounded-lg btn-touch-active ${
                fontSizeScale === 'extra-large' ? 'bg-amber-400 text-slate-900 shadow-2xs' : 'text-emerald-200'
              }`}
              title="ขนาดตัวหนังสือใหญ่พิเศษ"
            >
              ใหญ่+
            </button>
          </div>

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 flex items-center gap-1 text-xs font-bold btn-touch-active shadow-2xs ${
                isSyncing ? 'animate-pulse opacity-70' : ''
              }`}
              title="ดึงข้อมูลล่าสุดจาก Google Sheets (ซิงค์ข้ามเครื่อง)"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 btn-touch-active"
            title="สำรองข้อมูล & ตั้งค่า"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. แถบเครื่องมือเกษตรกรไทย (Quick Tools Ribbon) */}
      <div className="bg-emerald-900/90 border-t border-emerald-700/60 px-2 py-1.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-[11px] font-bold">
          <button
            onClick={onOpenAgriCalculators}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-300" />
            <span>คิดหน้าลาน</span>
          </button>

          <button
            onClick={onOpenDebtModal}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <CreditCard className="w-3.5 h-3.5 text-rose-300" />
            <span>หนี้ปุ๋ยยา</span>
          </button>

          <button
            onClick={onOpenSettlementModal}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>เคลียร์เงิน</span>
          </button>

          <button
            onClick={onOpenInventoryModal}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <Package className="w-3.5 h-3.5 text-sky-300" />
            <span>สต็อกของ</span>
          </button>

          <button
            onClick={onOpenPlotComparison}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
            <span>เทียบแปลง</span>
          </button>

          <button
            onClick={onOpenA4Report}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-700/60"
          >
            <Printer className="w-3.5 h-3.5 text-slate-200" />
            <span>ใบ A4</span>
          </button>

          <button
            onClick={onShareLine}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shrink-0 flex items-center gap-1 btn-touch-active border border-emerald-500 shadow-2xs"
            title="ส่งสรุปเข้า LINE ครอบครัว"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>แชร์ LINE</span>
          </button>

          <button
            onClick={onOpenDebugConsole}
            className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 shrink-0 flex items-center gap-1 btn-touch-active border border-slate-700"
            title="ตรวจสอบระบบ & ซ่อมแซมอัตโนมัติ"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Debug</span>
          </button>
        </div>
      </div>

      {/* 3. แถบเลือกสมาชิก: พ่อ / แม่ / พี่ / เรา */}
      <div className="bg-emerald-950/70 px-3 py-2 border-t border-emerald-800/80">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-[11px] text-emerald-200 mb-1 font-medium">
            <span>👤 เครื่องนี้ใครกำลังใช้งาน? (แตะเลือกครั้งเดียว):</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {familyMembers.map((member) => {
              const isActive = activeMemberId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all btn-touch-active ${
                    isActive
                      ? 'bg-amber-400 text-slate-900 font-bold shadow-lg ring-2 ring-amber-300'
                      : 'bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80'
                  }`}
                >
                  <span className="text-2xl mb-0.5">{member.avatar}</span>
                  <span className="text-xs truncate max-w-full">{member.name}</span>
                  {isActive && (
                    <span className="text-[9px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded-full mt-0.5 font-bold">
                      ใช้งานอยู่
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
