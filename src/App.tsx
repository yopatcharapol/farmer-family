import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './db/db';
import { FamilyMemberId, TransactionType, CropCycle, Transaction } from './types';
import { FamilyBar } from './components/FamilyBar';
import { CycleCard } from './components/CycleCard';
import { StatSummary } from './components/StatSummary';
import { ActionButtons } from './components/ActionButtons';
import { QuickEntryModal } from './components/QuickEntryModal';
import { TransactionList } from './components/TransactionList';
import { BreakEvenSimulator } from './components/BreakEvenSimulator';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { ThaiUnitConverterModal } from './components/ThaiUnitConverterModal';
import { SyncBackupModal } from './components/SyncBackupModal';
import { AddCycleModal } from './components/AddCycleModal';
import { calculateCostPerRai, getTodayIso } from './utils/thaiAgUnits';

export function App() {
  const [activeMemberId, setActiveMemberId] = useState<FamilyMemberId>('dad');
  const [activeCycleId, setActiveCycleId] = useState<string>('');
  
  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<TransactionType>('expense');
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);

  // Initialize DB on first launch
  useEffect(() => {
    initializeDatabase().then(async () => {
      const settings = await db.settings.get('default');
      if (settings) {
        if (settings.activeMemberId) setActiveMemberId(settings.activeMemberId);
        if (settings.activeCycleId) setActiveCycleId(settings.activeCycleId);
      }
    });
  }, []);

  // Live queries from IndexedDB
  const cycles = useLiveQuery(() => db.cycles.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  // Selected current cycle
  const currentCycle = cycles.find((c) => c.id === activeCycleId) || cycles[0];

  // Auto-set activeCycleId if not set
  useEffect(() => {
    if (!activeCycleId && cycles.length > 0) {
      setActiveCycleId(cycles[0].id);
    }
  }, [cycles, activeCycleId]);

  // Transactions for current cycle
  const transactions = useLiveQuery(
    () => {
      if (!currentCycle) return [];
      return db.transactions
        .where('cycleId')
        .equals(currentCycle.id)
        .reverse()
        .sortBy('createdAt');
    },
    [currentCycle?.id]
  ) || [];

  // Calculate totals
  const today = getTodayIso();
  let todayExpense = 0;
  let totalExpense = 0;
  let totalIncome = 0;

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      totalExpense += t.amount;
      if (t.date === today) todayExpense += t.amount;
    } else if (t.type === 'income') {
      totalIncome += t.amount;
    }
  });

  const costPerRai = currentCycle ? calculateCostPerRai(totalExpense, currentCycle.totalAreaRai) : 0;

  // Change active family member
  const handleSelectMember = async (id: FamilyMemberId) => {
    setActiveMemberId(id);
    await db.settings.update('default', { activeMemberId: id });
  };

  // Change active cycle
  const handleSelectCycle = async (id: string) => {
    setActiveCycleId(id);
    await db.settings.update('default', { activeCycleId: id });
  };

  // Add new cycle
  const handleAddCycle = async (newCycle: CropCycle) => {
    await db.cycles.add(newCycle);
    setActiveCycleId(newCycle.id);
    await db.settings.update('default', { activeCycleId: newCycle.id });
  };

  // Save new transaction + silent sync to Google Sheet
  const handleSaveTransaction = async (data: any) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      ...data,
      synced: false,
      createdAt: Date.now()
    };

    await db.transactions.add(newTx);

    // ถ้ามีการตั้งค่า Google Sheets Webhook URL ให้ยิง sync เงียบๆ ทันที
    const currentSettings = await db.settings.get('default');
    if (currentSettings?.googleSheetWebhookUrl) {
      try {
        fetch(currentSettings.googleSheetWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTx)
        }).then(() => {
          db.transactions.update(newTx.id, { synced: true });
        }).catch(() => {});
      } catch (e) {
        // ออฟไลน์ ทำงานปกติ ข้อมูลอยู่ใน IndexedDB ปลอดภัย
      }
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  // Save Webhook URL
  const handleSaveWebhookUrl = async (url: string) => {
    await db.settings.update('default', { googleSheetWebhookUrl: url });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* 1. ส่วนหัวเลือกสมาชิกในครอบครัว */}
      <FamilyBar
        activeMemberId={activeMemberId}
        onSelectMember={handleSelectMember}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUnitConverter={() => setIsConverterOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-3.5 py-3 flex-1 pb-16">
        
        {/* 2. การ์ดแปลงและรอบการปลูก */}
        <CycleCard
          currentCycle={currentCycle}
          cycles={cycles}
          onSelectCycle={handleSelectCycle}
          onOpenAddCycle={() => setIsAddCycleOpen(true)}
        />

        {/* 3. การ์ดสรุปยอดเงินโตๆ */}
        <StatSummary
          todayExpense={todayExpense}
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          costPerRai={costPerRai}
          totalRai={currentCycle?.totalAreaRai || 0}
        />

        {/* 4. สองปุ่มยักษ์ บันทึกรายจ่าย / รายรับ */}
        <ActionButtons
          onOpenExpense={() => {
            setEntryType('expense');
            setIsEntryModalOpen(true);
          }}
          onOpenIncome={() => {
            setEntryType('income');
            setIsEntryModalOpen(true);
          }}
        />

        {/* 5. สัดส่วนต้นทุน 8 หมวด (ถ้ามีรายจ่าย) */}
        {totalExpense > 0 && (
          <CostBreakdownChart
            transactions={transactions}
            totalExpense={totalExpense}
          />
        )}

        {/* 6. จุดคุ้มทุน & ตัวจำลองราคาตลาด (What-If Simulator) */}
        {currentCycle && totalExpense > 0 && (
          <BreakEvenSimulator
            currentCycle={currentCycle}
            totalExpense={totalExpense}
          />
        )}

        {/* 7. รายการประวัติที่คนในบ้านบันทึก */}
        <TransactionList
          transactions={transactions}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>

      {/* Footer ข้อมูลระบบ */}
      <footer className="text-center py-3 text-[11px] text-slate-400 border-t border-slate-200 bg-white">
        🌾 บัญชีฟาร์มครอบครัว • บันทึกในเครื่อง 100% แม้ไม่มีเน็ต
      </footer>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isEntryModalOpen}
        initialType={entryType}
        activeMemberId={activeMemberId}
        cycleId={currentCycle?.id || 'default'}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      <ThaiUnitConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
      />

      <SyncBackupModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        googleSheetWebhookUrl={settings?.googleSheetWebhookUrl}
        onSaveWebhookUrl={handleSaveWebhookUrl}
      />

      <AddCycleModal
        isOpen={isAddCycleOpen}
        onClose={() => setIsAddCycleOpen(false)}
        onAddCycle={handleAddCycle}
      />
    </div>
  );
}

export default App;

