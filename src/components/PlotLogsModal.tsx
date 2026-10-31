import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Plus, Calendar, Droplets, Sprout, Bug, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { db } from '../db/db';
import { PlotLog, PlotEventType, CropCycle } from '../types';
import { getTodayIso, formatDateThai } from '../utils/thaiAgUnits';

interface PlotLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCycle: CropCycle;
}

export const PlotLogsModal: React.FC<PlotLogsModalProps> = ({
  isOpen,
  onClose,
  currentCycle
}) => {
  if (!isOpen) return null;

  const logs = useLiveQuery(
    () => db.plotLogs.where('plotId').equals(currentCycle.id).reverse().sortBy('createdAt'),
    [currentCycle.id]
  ) || [];

  const [date, setDate] = useState<string>(getTodayIso());
  const [eventType, setEventType] = useState<PlotEventType>('general');
  const [note, setNote] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const eventTypes: Array<{ type: PlotEventType; label: string; icon: any; color: string }> = [
    { type: 'watering', label: 'สูบน้ำ/ให้น้ำ', icon: Droplets, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { type: 'fertilizer', label: 'ใส่ปุ๋ย/ฮอร์โมน', icon: Sprout, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { type: 'pest', label: 'พบแมลง/หนอน', icon: Bug, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { type: 'disease', label: 'พบโรคพืช/ใบไหม้', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { type: 'general', label: 'เรื่องทั่วไป/อากาศ', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  ];

  const handleAddLog = async () => {
    if (!note.trim()) return;
    const newLog: PlotLog = {
      id: `log-${Date.now()}`,
      plotId: currentCycle.id,
      date,
      eventType,
      note: note.trim(),
      createdAt: Date.now()
    };

    await db.plotLogs.add(newLog);
    setNote('');
    setIsAdding(false);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('ต้องการลบบันทึกเหตุการณ์นี้หรือไม่?')) {
      await db.plotLogs.delete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-base font-bold">ไดอารี่แปลง: {currentCycle.name}</h2>
              <p className="text-xs text-emerald-200">จดบันทึกเหตุการณ์ น้ำ ฝน แมลง โรคพืช</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* ปุ่มเปิดฟอร์มจดบันทึก */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 text-emerald-800 rounded-2xl font-bold flex items-center justify-center gap-2 btn-touch-active min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกเหตุการณ์ใหม่ในแปลงนี้</span>
            </button>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">จดบันทึกวันนี้:</span>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 text-xs">ยกเลิก</button>
              </div>

              {/* วันที่ */}
              <div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-xs"
                />
              </div>

              {/* ประเภทเหตุการณ์ */}
              <div className="grid grid-cols-2 gap-1.5">
                {eventTypes.map((et) => {
                  const Icon = et.icon;
                  return (
                    <button
                      key={et.type}
                      type="button"
                      onClick={() => setEventType(et.type)}
                      className={`p-2 rounded-xl font-bold border text-left flex items-center gap-1.5 btn-touch-active ${
                        eventType === et.type
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{et.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ข้อความบันทึก */}
              <div>
                <textarea
                  rows={2}
                  placeholder="เช่น วันนี้สูบน้ำเข้านา 3 ชม., พบเพลี้ยไฟเริ่มระบาดที่มุมแปลงทิศใต้..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                />
              </div>

              <button
                onClick={handleAddLog}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs btn-touch-active"
              >
                บันทึกลงไดอารี่
              </button>
            </div>
          )}

          {/* รายการเหตุการณ์ย้อนหลัง (Timeline) */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xs">ประวัติบันทึกในแปลงนี้ ({logs.length}):</h3>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ยังไม่มีบันทึกเหตุการณ์ในแปลงนี้
              </div>
            ) : (
              logs.map((log) => {
                const conf = eventTypes.find((e) => e.type === log.eventType) || eventTypes[4];
                const Icon = conf.icon;
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-start justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl border shrink-0 ${conf.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{conf.label}</span>
                          <span className="text-[10px] text-slate-400">• {formatDateThai(log.date)}</span>
                        </div>
                        <p className="text-slate-700 text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                          {log.note}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg btn-touch-active shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดไดอารี่
          </button>
        </div>
      </div>
    </div>
  );
};
