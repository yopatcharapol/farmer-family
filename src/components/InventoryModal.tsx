import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Plus, Minus, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { db } from '../db/db';
import { InventoryItem } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const items = useLiveQuery(() => db.inventory.toArray()) || [];

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'fertilizer' | 'chemical' | 'other'>('fertilizer');
  const [newItemUnit, setNewItemUnit] = useState('กระสอบ');
  const [initialQty, setInitialQty] = useState('5');

  // เพิ่มรายการสินค้าใหม่เข้าคลัง
  const handleAddNewItem = async () => {
    if (!newItemName.trim()) return;
    const qty = Math.max(0, Number(initialQty) || 0);
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      itemName: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit.trim() || 'กระสอบ',
      totalBought: qty,
      totalUsed: 0,
      remaining: qty,
      updatedAt: Date.now()
    };

    await db.inventory.add(newItem);
    setNewItemName('');
    setIsAddingNew(false);
  };

  // เบิกใช้ (-1)
  const handleUseItem = async (item: InventoryItem, delta: number = 1) => {
    if (item.remaining <= 0) return;
    const newUsed = item.totalUsed + delta;
    const newRemaining = Math.max(0, item.remaining - delta);
    await db.inventory.update(item.id, {
      totalUsed: newUsed,
      remaining: newRemaining,
      updatedAt: Date.now()
    });
  };

  // ซื้อเข้า (+1)
  const handleRestockItem = async (item: InventoryItem, delta: number = 1) => {
    const newBought = item.totalBought + delta;
    const newRemaining = item.remaining + delta;
    await db.inventory.update(item.id, {
      totalBought: newBought,
      remaining: newRemaining,
      updatedAt: Date.now()
    });
  };

  // ลบรายการในคลัง
  const handleDeleteItem = async (id: string, name: string) => {
    if (confirm(`ต้องการลบ "${name}" ออกจากคลังสต็อกหรือไม่?`)) {
      await db.inventory.delete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="text-base font-bold">คลังปุ๋ยยา & ของคงเหลือในเล้า</h2>
              <p className="text-xs text-emerald-200">เช็คของคงเหลือ ป้องกันซื้อซ้ำซ้อน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 btn-touch-active text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* ปุ่มเปิดฟอร์มเพิ่มสินค้าใหม่ */}
          {!isAddingNew ? (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 text-emerald-800 rounded-2xl font-bold flex items-center justify-center gap-2 btn-touch-active min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มปุ๋ย/ยาเข้าคลังสต็อก</span>
            </button>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">เพิ่มสินค้าเข้าสต็อกใหม่:</span>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ยกเลิก
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="เช่น ปุ๋ยยูเรีย 46-0-0, ยาคุมหญ้า..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'fertilizer', label: 'ปุ๋ย' },
                  { id: 'chemical', label: 'ยา/เคมี' },
                  { id: 'other', label: 'อื่นๆ' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewItemCategory(c.id as any)}
                    className={`py-1.5 rounded-lg font-bold border text-xs btn-touch-active ${
                      newItemCategory === c.id
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">หน่วยนับ:</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">จำนวนเริ่มต้น:</label>
                  <input
                    type="number"
                    value={initialQty}
                    onChange={(e) => setInitialQty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleAddNewItem}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs btn-touch-active"
              >
                บันทึกลงคลัง
              </button>
            </div>
          )}

          {/* รายการสต็อกทั้งหมด */}
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ยังไม่มีรายการของในคลัง กดปุ่มเพิ่มด้านบนเพื่อเริ่มจด
              </div>
            ) : (
              items.map((item) => {
                const isLow = item.remaining <= 2;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-2xs ${
                      isLow ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {item.itemName}
                        </span>
                        {isLow && (
                          <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            ใกล้หมด
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ซื้อมาทั้งหมด: {item.totalBought} {item.unit} • ใช้ไป: {item.totalUsed} {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* ยอดคงเหลือ */}
                      <div className="text-center px-2 py-1 bg-white border border-slate-200 rounded-xl min-w-[54px] shadow-2xs">
                        <div className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {item.remaining}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{item.unit}</div>
                      </div>

                      {/* ปุ่ม - เบิกใช้ */}
                      <button
                        type="button"
                        onClick={() => handleUseItem(item, 1)}
                        disabled={item.remaining <= 0}
                        className="w-9 h-9 bg-rose-100 hover:bg-rose-200 text-rose-800 disabled:opacity-40 rounded-xl flex items-center justify-center font-bold text-base btn-touch-active shadow-2xs"
                        title="เบิกใช้ 1 หน่วย"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      {/* ปุ่ม + ซื้อเข้า */}
                      <button
                        type="button"
                        onClick={() => handleRestockItem(item, 1)}
                        className="w-9 h-9 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-base btn-touch-active shadow-2xs"
                        title="ซื้อเพิ่ม 1 หน่วย"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.itemName)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg btn-touch-active"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดหน้าต่างคลังสต็อก
          </button>
        </div>
      </div>
    </div>
  );
};
