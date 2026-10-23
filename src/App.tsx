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
import {
  DEFAULT_WEBHOOK_URL,
  syncFromGoogleSheets,
  pushTransactionToGoogleSheets,
  pushCycleToGoogleSheets
} from './services/cloudSync';

export function App() {
  const [activeMemberId, setActiveMemberId] = useState<FamilyMemberId>('dad');
  const [activeCycleId, setActiveCycleId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<TransactionType>('expense');
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);

  // Initialize DB & Sync on first launch
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('sync');

    initializeDatabase().then(async () => {
      let activeWebhook = '';

      // ถ้าเปิดผ่านลิงก์ที่แชร์มา (?sync=URL) ให้บันทึกตั้งค่าอัตโนมัติทันที
      if (syncParam) {
        await db.settings.update('default', { googleSheetWebhookUrl: syncParam });
        activeWebhook = syncParam;
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const currentSettings = await db.settings.get('default');
        if (currentSettings) {
          if (currentSettings.activeMemberId) setActiveMemberId(currentSettings.activeMemberId);
          if (currentSettings.activeCycleId) setActiveCycleId(currentSettings.activeCycleId);
          if (currentSettings.googleSheetWebhookUrl) {
            activeWebhook = currentSettings.googleSheetWebhookUrl;
          } else {
            activeWebhook = DEFAULT_WEBHOOK_URL;
            await db.settings.update('default', { googleSheetWebhookUrl: DEFAULT_WEBHOOK_URL });
          }
        }
      }

      // ดึงข้อมูลล่าสุดจาก Google Sheets ทันที (เพื่อให้เห็นประวัติของคนอื่น)
      if (activeWebhook) {
        setIsSyncing(true);
        syncFromGoogleSheets(activeWebhook).finally(() => {
          setIsSyncing(false);
        });
      }
    });
  }, []);

  // Live queries from IndexedDB
  const cycles = useLiveQuery(() => db.cycles.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  // Selected current cycle
  const currentCycle = cycles.find((c) => c.id === activeCycleId) || cycles[0];

  // Auto-set activeCycleId if not set or invalid
  useEffect(() => {
    if (cycles.length > 0) {
      if (!activeCycleId || !cycles.some((c) => c.id === activeCycleId)) {
        setActiveCycleId(cycles[0].id);
      }
    }
  }, [cycles, activeCycleId]);

  // Transactions for current cycle
  const transactions = useLiveQuery(
    async () => {
      const allTx = await db.transactions.toArray();
      if (!currentCycle) {
        return allTx.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      return allTx
        .filter((t) => !t.cycleId || t.cycleId === 'default' || t.cycleId === currentCycle.id)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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

    // ยิงแปลงปลูกขึ้น Google Sheets
    const currentSettings = await db.settings.get('default');
    if (currentSettings?.googleSheetWebhookUrl) {
      pushCycleToGoogleSheets(currentSettings.googleSheetWebhookUrl, newCycle);
    }
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

    // ยิงรายการขึ้น Google Sheets
    const currentSettings = await db.settings.get('default');
    if (currentSettings?.googleSheetWebhookUrl) {
      pushTransactionToGoogleSheets(currentSettings.googleSheetWebhookUrl, newTx);
    }
  };

  // Manual sync button
  const handleManualSync = async () => {
    setIsSyncing(true);
    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    const res = await syncFromGoogleSheets(targetUrl);
    setIsSyncing(false);
    alert(res.message);
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  // Save Webhook URL
  const handleSaveWebhookUrl = async (url: string) => {
    await db.settings.update('default', { googleSheetWebhookUrl: url });
    // ทดลองดึงข้อมูลทันทีหลังบันทึก
    if (url) {
      setIsSyncing(true);
      syncFromGoogleSheets(url).finally(() => setIsSyncing(false));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* 1. ส่วนหัวเลือกสมาชิกในครอบครัว & ปุ่มซิงค์ */}
      <FamilyBar
        activeMemberId={activeMemberId}
        isSyncing={isSyncing}
        onSelectMember={handleSelectMember}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUnitConverter={() => setIsConverterOpen(true)}
        onSync={handleManualSync}
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
            if (!currentCycle) {
              alert('กรุณาสร้างแปลงเพาะปลูกแรกก่อนเริ่มบันทึกรายการครับ');
              setIsAddCycleOpen(true);
              return;
            }
            setEntryType('expense');
            setIsEntryModalOpen(true);
          }}
          onOpenIncome={() => {
            if (!currentCycle) {
              alert('กรุณาสร้างแปลงเพาะปลูกแรกก่อนเริ่มบันทึกรายการครับ');
              setIsAddCycleOpen(true);
              return;
            }
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
        🌾 บัญชีฟาร์มครอบครัว • บันทึกในเครื่อง 100% ซิงค์ข้ามเครื่องได้
      </footer>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isEntryModalOpen}
        initialType={entryType}
        activeMemberId={activeMemberId}
        currentCycle={currentCycle}
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
        onSyncComplete={() => {}}
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
