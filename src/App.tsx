import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './db/db';
import {
  TransactionType,
  CropCycle,
  Transaction,
  FamilyMember,
  DEFAULT_FAMILY_MEMBERS,
  FontSizeScale
} from './types';
import { FamilyBar } from './components/FamilyBar';
import { CycleCard } from './components/CycleCard';
import { StatSummary } from './components/StatSummary';
import { ActionButtons } from './components/ActionButtons';
import { QuickEntryModal } from './components/QuickEntryModal';
import { TransactionList } from './components/TransactionList';
import { BreakEvenSimulator } from './components/BreakEvenSimulator';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { AgriCalculatorsModal } from './components/AgriCalculatorsModal';
import { DebtManagementModal } from './components/DebtManagementModal';
import { FamilySettlementModal } from './components/FamilySettlementModal';
import { InventoryModal } from './components/InventoryModal';
import { PlotLogsModal } from './components/PlotLogsModal';
import { PlotManageModal } from './components/PlotManageModal';
import { A4PrintReportModal } from './components/A4PrintReportModal';
import { PlotComparisonModal } from './components/PlotComparisonModal';
import { DebugConsoleModal } from './components/DebugConsoleModal';
import {
  calculateCostPerRai,
  getTodayIso,
  generateLineShareText,
  formatMoney
} from './utils/thaiAgUnits';

// Lazy loading modals
const ThaiUnitConverterModal = lazy(() =>
  import('./components/ThaiUnitConverterModal').then((m) => ({ default: m.ThaiUnitConverterModal }))
);
const SyncBackupModal = lazy(() =>
  import('./components/SyncBackupModal').then((m) => ({ default: m.SyncBackupModal }))
);
const AddCycleModal = lazy(() =>
  import('./components/AddCycleModal').then((m) => ({ default: m.AddCycleModal }))
);

import {
  DEFAULT_WEBHOOK_URL,
  syncFromGoogleSheets,
  pushTransactionToGoogleSheets,
  updateTransactionInGoogleSheets,
  deleteTransactionFromGoogleSheets,
  pushCycleToGoogleSheets,
  syncPendingQueue
} from './services/cloudSync';
import { RefreshCw, Wrench } from 'lucide-react';

export function App() {
  const [activeMemberId, setActiveMemberId] = useState<string>('dad');
  const [activeCycleId, setActiveCycleId] = useState<string>('');
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>('normal');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [viewPeriod, setViewPeriod] = useState<'cycle' | 'month' | 'all'>('cycle');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Error Logging for Self-Debugging
  const [systemErrors, setSystemErrors] = useState<string[]>([]);

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryType, setEntryType] = useState<TransactionType>('expense');
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isAgriCalculatorsOpen, setIsAgriCalculatorsOpen] = useState(false);
  const [isA4ReportOpen, setIsA4ReportOpen] = useState(false);
  const [isPlotComparisonOpen, setIsPlotComparisonOpen] = useState(false);
  const [isPlotManageOpen, setIsPlotManageOpen] = useState(false);
  const [isPlotLogsOpen, setIsPlotLogsOpen] = useState(false);
  const [isDebugConsoleOpen, setIsDebugConsoleOpen] = useState(false);

  // Error Boundary & Exception listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const errStr = `[${new Date().toLocaleTimeString()}] ${event.message} (${event.filename}:${event.lineno})`;
      setSystemErrors((prev) => [errStr, ...prev.slice(0, 19)]);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const errStr = `[${new Date().toLocaleTimeString()}] Unhandled Promise: ${event.reason}`;
      setSystemErrors((prev) => [errStr, ...prev.slice(0, 19)]);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // ตรวจจับสัญญาณอินเทอร์เน็ต & Flush Offline Queue อัตโนมัติ
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setToastMessage('📶 เชื่อมต่ออินเทอร์เน็ตแล้ว! กำลังส่งข้อมูลค้างซิงค์...');
      const currentSettings = await db.settings.get('default');
      const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
      if (targetUrl) {
        setIsSyncingQueue(true);
        const res = await syncPendingQueue(targetUrl);
        setIsSyncingQueue(false);
        if (res.syncedCount > 0) {
          setToastMessage(`✅ ซิงค์ข้อมูลเข้า Google Sheets สำเร็จ (${res.syncedCount} รายการ)`);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage('📴 กำลังใช้ออฟไลน์: บันทึกข้อมูลได้ปลอดภัยในเครื่อง ระบบจะส่งขึ้นคลาวด์เมื่อมีเน็ต');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // เคลียร์ Toast อัตโนมัติ
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize DB & Sync on first launch
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('sync');

    initializeDatabase().then(async () => {
      let activeWebhook = '';

      if (syncParam) {
        await db.settings.update('default', { googleSheetWebhookUrl: syncParam });
        activeWebhook = syncParam;
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const currentSettings = await db.settings.get('default');
        if (currentSettings) {
          if (currentSettings.activeMemberId) setActiveMemberId(currentSettings.activeMemberId);
          if (currentSettings.activeCycleId) setActiveCycleId(currentSettings.activeCycleId);
          if (currentSettings.fontSizeScale) {
            setFontSizeScale(currentSettings.fontSizeScale);
            document.documentElement.setAttribute('data-font-scale', currentSettings.fontSizeScale);
          }
          if (currentSettings.googleSheetWebhookUrl) {
            activeWebhook = currentSettings.googleSheetWebhookUrl;
          } else {
            activeWebhook = DEFAULT_WEBHOOK_URL;
            await db.settings.update('default', { googleSheetWebhookUrl: DEFAULT_WEBHOOK_URL });
          }
        }
      }

      if (activeWebhook && navigator.onLine) {
        setIsSyncing(true);
        syncFromGoogleSheets(activeWebhook).finally(() => {
          setIsSyncing(false);
        });
      }
    });
  }, []);

  // Live queries from IndexedDB
  const cycles = useLiveQuery(() => db.cycles.where('status').notEqual('deleted').toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));
  const familyMembers = settings?.familyMembers || DEFAULT_FAMILY_MEMBERS;

  // รายการที่ค้างส่งใน Offline Sync Queue
  const pendingTransactions = useLiveQuery(
    () => db.transactions.filter((t) =>
      t.syncStatus === 'pending' ||
      t.syncStatus === 'pending_update' ||
      t.syncStatus === 'pending_delete' ||
      t.syncStatus === 'failed' ||
      !t.synced
    ).toArray()
  ) || [];

  // Active Cycle
  const currentCycle = cycles.find((c) => c.id === activeCycleId && c.status === 'active') ||
    cycles.find((c) => c.status === 'active') ||
    cycles[0];

  useEffect(() => {
    if (cycles.length > 0) {
      if (!activeCycleId || !cycles.some((c) => c.id === activeCycleId)) {
        const firstActive = cycles.find((c) => c.status === 'active') || cycles[0];
        setActiveCycleId(firstActive.id);
      }
    }
  }, [cycles, activeCycleId]);

  // Transactions filtered by viewPeriod & not deleted
  const today = getTodayIso();
  const currentMonth = today.slice(0, 7);

  const transactions = useLiveQuery(
    async () => {
      const allTx = await db.transactions.filter((t) => !t.isDeleted).toArray();
      if (viewPeriod === 'cycle') {
        if (!currentCycle) return allTx.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return allTx
          .filter((t) => !t.cycleId || t.cycleId === 'default' || t.cycleId === currentCycle.id)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else if (viewPeriod === 'month') {
        return allTx
          .filter((t) => t.date && t.date.startsWith(currentMonth))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else {
        return allTx.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
    },
    [currentCycle?.id, viewPeriod]
  ) || [];

  // Totals & Metrics
  let todayExpense = 0;
  let totalExpense = 0;
  let totalIncome = 0;
  let totalUnpaidDebt = 0;

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      totalExpense += t.amount;
      if (t.date === today) todayExpense += t.amount;
      if (t.paymentStatus === 'credit') totalUnpaidDebt += t.amount;
    } else if (t.type === 'income') {
      totalIncome += t.amount;
    }
  });

  const costPerRai = currentCycle ? calculateCostPerRai(totalExpense, currentCycle.totalAreaRai) : 0;
  const netProfit = totalIncome - totalExpense;

  // Change active family member
  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await db.settings.update('default', { activeMemberId: id });
  };

  // Change font size scale (Senior mode)
  const handleSelectFontSize = async (scale: FontSizeScale) => {
    setFontSizeScale(scale);
    document.documentElement.setAttribute('data-font-scale', scale);
    await db.settings.update('default', { fontSizeScale: scale });
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

    const currentSettings = await db.settings.get('default');
    if (currentSettings?.googleSheetWebhookUrl) {
      pushCycleToGoogleSheets(currentSettings.googleSheetWebhookUrl, newCycle);
    }
    setToastMessage(`✅ สร้างแปลง "${newCycle.name}" เรียบร้อย`);
  };

  // [#1] & [#10] Save Transaction (Create or Edit / Split across plots)
  const handleSaveTransaction = async (data: any) => {
    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;

    // ถ้าเป็นการแก้ไขรายการเดิม
    if (data.id) {
      const updatedTx: Transaction = {
        ...data,
        updatedAt: Date.now(),
        syncStatus: 'pending_update',
        synced: false
      };
      await db.transactions.put(updatedTx);

      if (navigator.onLine && targetUrl) {
        updateTransactionInGoogleSheets(targetUrl, updatedTx);
      }
      setToastMessage('✅ บันทึกการแก้ไขรายการเรียบร้อย');
      setEditingTransaction(null);
      return;
    }

    // [#10] ถ้ามีคำสั่งกระจายบิลเข้าหลายแปลง
    if (data.splitAllocations && data.splitAllocations.length > 0) {
      for (const split of data.splitAllocations) {
        const splitTx: Transaction = {
          ...data,
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          cycleId: split.plotId,
          amount: split.allocatedAmount,
          title: `${data.title} (หารบิล)`,
          splitAllocations: undefined,
          synced: false,
          syncStatus: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await db.transactions.add(splitTx);
        if (navigator.onLine && targetUrl) {
          pushTransactionToGoogleSheets(targetUrl, splitTx);
        }
      }
      setToastMessage(`✅ กระจายบิลเข้า ${data.splitAllocations.length} แปลงเรียบร้อย`);
      return;
    }

    // บันทึกรายการเดี่ยวปกติ
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      synced: false,
      syncStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.transactions.add(newTx);

    if (navigator.onLine && targetUrl) {
      const ok = await pushTransactionToGoogleSheets(targetUrl, newTx);
      if (ok) {
        setToastMessage('✅ บันทึกและส่งเข้า Google Sheets เรียบร้อย');
      } else {
        setToastMessage('🌾 บันทึกในเครื่องแล้ว (รอส่งขึ้นชีท)');
      }
    } else {
      setToastMessage('🌾 บันทึกในเครื่องแล้ว (จะส่งขึ้นชีทอัตโนมัติเมื่อมีเน็ต)');
    }
  };

  // [#1] เปิด Modal เพื่อแก้ไขรายการ
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEntryType(tx.type);
    setIsEntryModalOpen(true);
  };

  // [#2] ลบรายการ (Two-way delete sync)
  const handleDeleteTransaction = async (id: string) => {
    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;

    if (targetUrl) {
      await deleteTransactionFromGoogleSheets(targetUrl, id);
    } else {
      await db.transactions.delete(id);
    }
    setToastMessage('🗑️ ลบรายการเรียบร้อย');
  };

  // [#6] ตัดหนี้ร้านค้า
  const handlePayOffDebt = async (transactionId: string) => {
    const tx = await db.transactions.get(transactionId);
    if (!tx) return;

    const updatedTx: Transaction = {
      ...tx,
      paymentStatus: 'paid',
      notes: tx.notes ? `${tx.notes} (จ่ายสดตัดหนี้แล้ว)` : 'จ่ายสดตัดหนี้แล้ว',
      updatedAt: Date.now(),
      syncStatus: 'pending_update',
      synced: false
    };

    await db.transactions.put(updatedTx);

    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (navigator.onLine && targetUrl) {
      updateTransactionInGoogleSheets(targetUrl, updatedTx);
    }

    setToastMessage('✅ ตัดหนี้เรียบร้อย ปรับสถานะเป็นจ่ายสดแล้ว');
  };

  // [#8 & #9] ส่งยอดจากเครื่องคิดเลขเข้าบัญชีรายรับ
  const handleApplyCalculatedIncome = async (
    amount: number,
    harvestWeightKg: number,
    title: string,
    calcNotes: string
  ) => {
    await handleSaveTransaction({
      cycleId: currentCycle?.id || 'default',
      type: 'income',
      category: 'main_crop',
      categoryLabel: 'ขายผลผลิต',
      title,
      amount,
      quantity: 1,
      unit: 'งวด',
      unitPrice: amount,
      recordedBy: activeMemberId,
      date: getTodayIso(),
      notes: calcNotes,
      harvestWeight: harvestWeightKg
    });
  };

  // [#20] แชร์สรุปบัญชีส่งเข้า LINE ในคลิกเดียว
  const handleShareLine = () => {
    // คำนวณยอดสำรองจ่ายของคนในบ้าน
    const settlementSummary = familyMembers.map((m) => {
      const sum = transactions
        .filter((t) => t.type === 'expense' && (t.paidBy === m.id || (!t.paidBy && t.recordedBy === m.id)))
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: m.name, amount: sum };
    }).filter((s) => s.amount > 0);

    const text = generateLineShareText({
      plotName: currentCycle?.name,
      totalIncome,
      totalExpense,
      profit: netProfit,
      unpaidDebt: totalUnpaidDebt,
      familySettlement: settlementSummary,
      periodLabel: viewPeriod === 'cycle' ? 'รอบแปลงนี้' : viewPeriod === 'month' ? 'เดือนนี้' : 'ภาพรวมทั้งหมด'
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setToastMessage('📋 คัดลอกข้อความสรุปแล้ว! เปิดห้องแชท LINE แล้วกดวางได้ทันที');
    } else {
      alert(text);
    }
  };

  // ส่งคิวออฟไลน์ทันที
  const handleFlushOfflineQueue = async () => {
    if (!navigator.onLine) {
      alert('โทรศัพท์ยังไม่ได้เชื่อมต่ออินเทอร์เน็ต กรุณารอมีสัญญาณเน็ตก่อนครับ');
      return;
    }
    setIsSyncingQueue(true);
    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    const res = await syncPendingQueue(targetUrl);
    setIsSyncingQueue(false);
    setToastMessage(res.message);
  };

  // ดึงข้อมูลชีทลงมา
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      alert('ไม่มีสัญญาณอินเทอร์เน็ต ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ในขณะนี้');
      return;
    }
    setIsSyncing(true);
    const currentSettings = await db.settings.get('default');
    const targetUrl = currentSettings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    await syncPendingQueue(targetUrl);
    const res = await syncFromGoogleSheets(targetUrl);
    setIsSyncing(false);
    alert(res.message);
  };

  const periodLabel = viewPeriod === 'cycle'
    ? 'รอบแปลงนี้'
    : viewPeriod === 'month'
    ? 'เดือนนี้'
    : 'ทั้งหมด';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* 1. ส่วนหัวเลือกสมาชิก & Ribbon เครื่องมือ */}
      <FamilyBar
        activeMemberId={activeMemberId}
        familyMembers={familyMembers}
        fontSizeScale={fontSizeScale}
        isSyncing={isSyncing || isSyncingQueue}
        onSelectMember={handleSelectMember}
        onSelectFontSize={handleSelectFontSize}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUnitConverter={() => setIsConverterOpen(true)}
        onOpenDebtModal={() => setIsDebtModalOpen(true)}
        onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
        onOpenInventoryModal={() => setIsInventoryModalOpen(true)}
        onOpenAgriCalculators={() => setIsAgriCalculatorsOpen(true)}
        onOpenA4Report={() => setIsA4ReportOpen(true)}
        onOpenPlotComparison={() => setIsPlotComparisonOpen(true)}
        onOpenDebugConsole={() => setIsDebugConsoleOpen(true)}
        onShareLine={handleShareLine}
        onSync={handleManualSync}
      />

      {/* แถบแจ้งสถานะคิวออฟไลน์ */}
      {pendingTransactions.length > 0 && (
        <div className="bg-amber-100 border-b border-amber-300 px-3.5 py-2 text-xs text-amber-950 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
            <span>มี {pendingTransactions.length} รายการรอซิงค์เข้า Google Sheet</span>
          </div>
          <button
            type="button"
            onClick={handleFlushOfflineQueue}
            disabled={isSyncingQueue}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs btn-touch-active flex items-center gap-1 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
            <span>{isSyncingQueue ? 'กำลังส่ง...' : 'แตะส่งทันที'}</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xs text-xs font-bold text-center border border-white/20 animate-fade-in flex items-center justify-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-3 py-3 flex-1 pb-16">
        
        {/* 2. การ์ดแปลงและรอบการปลูก + แถบอายุพืช */}
        <CycleCard
          currentCycle={currentCycle}
          cycles={cycles}
          transactions={transactions}
          onSelectCycle={handleSelectCycle}
          onOpenAddCycle={() => setIsAddCycleOpen(true)}
          onOpenManagePlot={() => setIsPlotManageOpen(true)}
          onOpenPlotLogs={() => setIsPlotLogsOpen(true)}
        />

        {/* 3. การ์ดสรุปยอดเงิน พร้อมสลับ รอบนี้ / เดือนนี้ / ทั้งหมด */}
        <StatSummary
          todayExpense={todayExpense}
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          costPerRai={costPerRai}
          totalRai={currentCycle?.totalAreaRai || 0}
          viewPeriod={viewPeriod}
          onSelectPeriod={setViewPeriod}
          periodLabel={periodLabel}
        />

        {/* 4. สองปุ่มยักษ์ บันทึกรายจ่าย / รายรับ */}
        <ActionButtons
          onOpenExpense={() => {
            if (!currentCycle) {
              alert('กรุณาสร้างแปลงเพาะปลูกแรกก่อนเริ่มบันทึกรายการครับ');
              setIsAddCycleOpen(true);
              return;
            }
            setEditingTransaction(null);
            setEntryType('expense');
            setIsEntryModalOpen(true);
          }}
          onOpenIncome={() => {
            if (!currentCycle) {
              alert('กรุณาสร้างแปลงเพาะปลูกแรกก่อนเริ่มบันทึกรายการครับ');
              setIsAddCycleOpen(true);
              return;
            }
            setEditingTransaction(null);
            setEntryType('income');
            setIsEntryModalOpen(true);
          }}
        />

        {/* 5. สัดส่วนต้นทุน 8 หมวด */}
        {totalExpense > 0 && (
          <CostBreakdownChart
            transactions={transactions}
            totalExpense={totalExpense}
          />
        )}

        {/* 6. จุดคุ้มทุน & ตัวจำลองราคาตลาด (What-If) */}
        {currentCycle && totalExpense > 0 && viewPeriod === 'cycle' && (
          <BreakEvenSimulator
            currentCycle={currentCycle}
            totalExpense={totalExpense}
          />
        )}

        {/* 7. รายการประวัติที่คนในบ้านบันทึก (พร้อมปุ่มแก้ไข & กรอง & ค้นหา) */}
        <TransactionList
          transactions={transactions}
          familyMembers={familyMembers}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={handleEditTransaction}
          onRetrySync={(tx) => {
            const targetUrl = settings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
            pushTransactionToGoogleSheets(targetUrl, tx);
          }}
        />
      </main>

      {/* Floating Debug / Diagnostic Button (มุมล่างขวา) */}
      <button
        onClick={() => setIsDebugConsoleOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-slate-900 hover:bg-slate-800 text-amber-400 p-2.5 rounded-full shadow-xl border border-slate-700 flex items-center justify-center btn-touch-active print:hidden"
        title="เปิดคอนโซลตรวจสอบระบบ & ซ่อมแซมอัตโนมัติ"
      >
        <Wrench className="w-5 h-5" />
      </button>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-400 border-t border-slate-200 bg-white no-print">
        🌾 บัญชีฟาร์มครอบครัว • บันทึกในเครื่อง 100% {isOnline ? '🟢 ออนไลน์' : '📴 ออฟไลน์'}
      </footer>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isEntryModalOpen}
        initialType={entryType}
        activeMemberId={activeMemberId}
        currentCycle={currentCycle}
        cycles={cycles}
        familyMembers={familyMembers}
        cycleId={currentCycle?.id || 'default'}
        editingTransaction={editingTransaction}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />

      <AgriCalculatorsModal
        isOpen={isAgriCalculatorsOpen}
        onClose={() => setIsAgriCalculatorsOpen(false)}
        onApplyIncome={handleApplyCalculatedIncome}
      />

      <DebtManagementModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        transactions={transactions}
        onPayOffDebt={handlePayOffDebt}
      />

      <FamilySettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        transactions={transactions}
        familyMembers={familyMembers}
        totalIncome={totalIncome}
      />

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
      />

      {currentCycle && (
        <PlotLogsModal
          isOpen={isPlotLogsOpen}
          onClose={() => setIsPlotLogsOpen(false)}
          currentCycle={currentCycle}
        />
      )}

      {currentCycle && (
        <PlotManageModal
          isOpen={isPlotManageOpen}
          onClose={() => setIsPlotManageOpen(false)}
          currentCycle={currentCycle}
          cycles={cycles}
          transactions={transactions}
          onSelectCycle={handleSelectCycle}
        />
      )}

      <A4PrintReportModal
        isOpen={isA4ReportOpen}
        onClose={() => setIsA4ReportOpen(false)}
        currentCycle={currentCycle}
        cycles={cycles}
        transactions={transactions}
        familyMembers={familyMembers}
      />

      <PlotComparisonModal
        isOpen={isPlotComparisonOpen}
        onClose={() => setIsPlotComparisonOpen(false)}
        cycles={cycles}
        transactions={transactions}
        onSelectCycle={handleSelectCycle}
      />

      <DebugConsoleModal
        isOpen={isDebugConsoleOpen}
        onClose={() => setIsDebugConsoleOpen(false)}
        systemErrors={systemErrors}
        onClearErrors={() => setSystemErrors([])}
      />

      <Suspense fallback={null}>
        {isConverterOpen && (
          <ThaiUnitConverterModal
            isOpen={isConverterOpen}
            onClose={() => setIsConverterOpen(false)}
          />
        )}

        {isSettingsOpen && (
          <SyncBackupModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            googleSheetWebhookUrl={settings?.googleSheetWebhookUrl}
            familyMembers={familyMembers}
            resetPin={settings?.resetPin || '1234'}
            onSaveWebhookUrl={async (url) => {
              await db.settings.update('default', { googleSheetWebhookUrl: url });
            }}
            onUpdateFamilyMembers={async (members) => {
              await db.settings.update('default', { familyMembers: members });
            }}
            onSyncComplete={() => {}}
          />
        )}

        {isAddCycleOpen && (
          <AddCycleModal
            isOpen={isAddCycleOpen}
            onClose={() => setIsAddCycleOpen(false)}
            onAddCycle={handleAddCycle}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
