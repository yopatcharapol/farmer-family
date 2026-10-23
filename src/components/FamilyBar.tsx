import React from 'react';
import { FamilyMemberId, FAMILY_MEMBERS } from '../types';
import { Settings, RefreshCw, Smartphone } from 'lucide-react';

interface FamilyBarProps {
  activeMemberId: FamilyMemberId;
  onSelectMember: (id: FamilyMemberId) => void;
  onOpenSettings: () => void;
  onOpenUnitConverter: () => void;
}

export const FamilyBar: React.FC<FamilyBarProps> = ({
  activeMemberId,
  onSelectMember,
  onOpenSettings,
  onOpenUnitConverter
}) => {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-20">
      {/* ส่วนหัวชื่อฟาร์ม & ปุ่มลัดเครื่องมือ */}
      <div className="max-w-md mx-auto px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">สมุดบัญชีฟาร์ม</h1>
            <p className="text-xs text-emerald-200">บันทึกง่าย ใช้ร่วมกันทั้งบ้าน</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenUnitConverter}
            className="p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 flex items-center gap-1 text-xs font-medium btn-touch-active"
            title="แปลงหน่วย ไร่-งาน / ถัง-เกวียน"
          >
            <span>⚖️ แปลงหน่วย</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 btn-touch-active"
            title="สำรองข้อมูล & ตั้งค่า"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* แถบเลือกสมาชิก: พ่อ / แม่ / พี่ / เรา */}
      <div className="bg-emerald-900/60 px-3 py-2 border-t border-emerald-700/50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-1.5 font-medium">
            <span>👤 เครื่องนี้ใครกำลังใช้งาน? (แตะเลือกครั้งเดียว):</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FAMILY_MEMBERS.map((member) => {
              const isActive = activeMemberId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all btn-touch-active ${
                    isActive
                      ? 'bg-amber-400 text-slate-900 font-bold shadow-lg ring-2 ring-amber-300 scale-102'
                      : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700/80'
                  }`}
                >
                  <span className="text-2xl mb-0.5">{member.avatar}</span>
                  <span className="text-sm">{member.name}</span>
                  {isActive && (
                    <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded-full mt-0.5 font-semibold">
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
