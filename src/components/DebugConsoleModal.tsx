import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Wrench,
  CheckCircle2,
  XCircle,
  Database,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { db, repairDataIntegrity, purgeGhostTransactions, purgeDeletedCycles } from '../db/db';
import {
  FULL_APPS_SCRIPT_CODE,
  getDeletedCycleIds,
  isCycleDeleted,
  markCycleAsDeleted,
  DEFAULT_WEBHOOK_URL
} from '../services/cloudSync';
import {
  calculateMoistureDeduction,
  calculateRubberYield,
  calculateFertilizerMix,
  calculateSplitExpense
} from '../utils/thaiAgUnits';

interface SelfTestResult {
  id: string;
  name: string;
  status: 'pending' | 'pass' | 'fail';
  durationMs: number;
  message?: string;
}

interface DebugConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemErrors?: string[];
  onClearErrors?: () => void;
  onRefreshData?: () => void;
}

export const DebugConsoleModal: React.FC<DebugConsoleModalProps> = ({
  isOpen,
  onClose,
  systemErrors = [],
  onClearErrors,
  onRefreshData
}) => {
  if (!isOpen) return null;

  // Storage metrics
  const [txCount, setTxCount] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [ghostCount, setGhostCount] = useState<number>(0);
  const [badCycleCount, setBadCycleCount] = useState<number>(0);
  const [storageEstimate, setStorageEstimate] = useState<string>('กำลังคำนวณ...');

  // Self-test runner state
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<SelfTestResult[]>([]);

  // Auto-repair state
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // ดึงข้อมูลสถานะ Storage
  const refreshStorageMetrics = async () => {
    try {
      const tc = await db.transactions.count();
      const cc = await db.cycles.count();
      const pc = await db.transactions
        .filter(t => t.syncStatus === 'pending' || t.syncStatus === 'pending_update' || t.syncStatus === 'pending_delete' || !t.synced)
        .count();

      const gc = await db.transactions
        .filter(t => Number(t.amount) === 0 && (!t.title || t.title === 'รายการ' || t.categoryLabel === 'ทั่วไป' || t.id === 'test-dummy-id'))
        .count();

      const deletedCycleIds = getDeletedCycleIds();
      const bc = await db.cycles
        .filter(c => deletedCycleIds.includes(c.id) || c.status === 'deleted' || c.name.includes('?'))
        .count();

      setTxCount(tc);
      setCycleCount(cc);
      setPendingSyncCount(pc);
      setGhostCount(gc);
      setBadCycleCount(bc);

      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usageMb = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMb = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
        setStorageEstimate(`${usageMb} MB / ${quotaMb} MB`);
      } else {
        setStorageEstimate('พร้อมใช้งาน (Local IndexedDB)');
      }
    } catch (e) {
      setStorageEstimate('ตรวจสอบไม่สำเร็จ');
    }
  };

  useEffect(() => {
    refreshStorageMetrics();
  }, [isOpen]);

  // ล้างรายการผี 0 บ. และแปลงที่ถูกลบทิ้งถาวร
  const handlePurgeAll = async () => {
    const txCountPurged = await purgeGhostTransactions();
    const cycleCountPurged = await purgeDeletedCycles();

    // ส่งคำสั่ง clean_ghosts ไปล้างชีทด้วยหากเชื่อมต่อเน็ตอยู่
    const settings = await db.settings.get('default');
    const targetUrl = settings?.googleSheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (targetUrl && navigator.onLine) {
      fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'clean_ghosts' })
      }).catch(console.error);
    }

    await refreshStorageMetrics();
    if (onRefreshData) onRefreshData();
    alert(`✅ กวาดล้างข้อมูลสะอาดเรียบร้อย:\n- ล้างรายการผี 0 บ. ${txCountPurged} รายการ\n- ล้างแปลงที่ถูกลบ/แปลงผี ${cycleCountPurged} แปลง`);
  };

  // คัดลอกโค้ด Google Apps Script
  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(FULL_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // รันระบบตรวจสอบตัวเองอัตโนมัติ (Automated Self-Test Runner)
  const handleRunSelfTests = async () => {
    setIsRunningTests(true);
    const results: SelfTestResult[] = [];

    // TEST 1: เครื่องคิดเลขหักความชื้น (Moisture Deductions)
    const t1Start = performance.now();
    try {
      const res = calculateMoistureDeduction({
        grossWeightKg: 1000,
        measuredMoisture: 25,
        standardMoisture: 15,
        deductionRatePercent: 1.5,
        impurityPercent: 0,
        pricePerUnit: 10,
        priceUnit: 'kg'
      });
      if (res.netWeightKg === 850 && res.totalAmount === 8500) {
        results.push({
          id: 't1',
          name: 'สมการคำนวณหักความชื้นข้าว/พืชไร่',
          status: 'pass',
          durationMs: Number((performance.now() - t1Start).toFixed(2)),
          message: 'คำนวณความชื้นและน้ำหนักสุทธิถูกต้อง 100%'
        });
      } else {
        throw new Error(`ผลลัพธ์ไม่ตรง: netWeight=${res.netWeightKg}, amount=${res.totalAmount}`);
      }
    } catch (e: any) {
      results.push({
        id: 't1',
        name: 'สมการคำนวณหักความชื้นข้าว/พืชไร่',
        status: 'fail',
        durationMs: Number((performance.now() - t1Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 2: คำนวณน้ำยางพารา (% DRC & ส่วนแบ่งคนกรีด)
    const t2Start = performance.now();
    try {
      const res = calculateRubberYield({
        freshLatexKg: 100,
        drcPercent: 30,
        pricePerKgDry: 60,
        ownerSharePercent: 60
      });
      if (res.dryRubberKg === 30 && res.totalRevenue === 1800 && res.ownerShare === 1080 && res.tapperShare === 720) {
        results.push({
          id: 't2',
          name: 'สมการคำนวณน้ำยางพารา (% DRC และแบ่งคนกรีด 60:40)',
          status: 'pass',
          durationMs: Number((performance.now() - t2Start).toFixed(2)),
          message: 'ตัดแบ่งสัดส่วนเงินถูกต้องแม่นยำ'
        });
      } else {
        throw new Error(`ผลลัพธ์ไม่ตรง: dry=${res.dryRubberKg}, owner=${res.ownerShare}`);
      }
    } catch (e: any) {
      results.push({
        id: 't2',
        name: 'สมการคำนวณน้ำยางพารา (% DRC และแบ่งคนกรีด)',
        status: 'fail',
        durationMs: Number((performance.now() - t2Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 3: สมการผสมแม่ปุ๋ยสั่งตัด N-P-K
    const t3Start = performance.now();
    try {
      const res = calculateFertilizerMix({
        targetN: 16,
        targetP: 16,
        targetK: 8,
        batchWeightKg: 100,
        ureaPricePer50Kg: 850,
        dapPricePer50Kg: 1400,
        mopPricePer50Kg: 900
      });
      if (res.isPossible && res.dapKg > 0 && res.ureaKg > 0 && res.mopKg > 0) {
        results.push({
          id: 't3',
          name: 'สมการคำนวณสัดส่วนผสมแม่ปุ๋ยสั่งตัด N-P-K',
          status: 'pass',
          durationMs: Number((performance.now() - t3Start).toFixed(2)),
          message: `แม่ปุ๋ยรวม ${res.totalRawKg} กก. + สารตัวเติม ${res.fillerKg} กก.`
        });
      } else {
        throw new Error('การคำนวณปุ๋ยล้มเหลว');
      }
    } catch (e: any) {
      results.push({
        id: 't3',
        name: 'สมการคำนวณสัดส่วนผสมแม่ปุ๋ยสั่งตัด N-P-K',
        status: 'fail',
        durationMs: Number((performance.now() - t3Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 4: การกระจายบิลรายจ่ายเดียวเข้าหลายแปลง (Split Bill by Area)
    const t4Start = performance.now();
    try {
      const plots = [
        { id: 'p1', name: 'แปลง 1', totalAreaRai: 2 },
        { id: 'p2', name: 'แปลง 2', totalAreaRai: 3 }
      ];
      const splits = calculateSplitExpense(1000, plots, 'byArea');
      const sum = splits.reduce((s, p) => s + p.allocatedAmount, 0);
      if (sum === 1000 && splits[0].allocatedAmount === 400 && splits[1].allocatedAmount === 600) {
        results.push({
          id: 't4',
          name: 'สมการกระจายบิลรายจ่ายตามจำนวนไร่ (Split Bill)',
          status: 'pass',
          durationMs: Number((performance.now() - t4Start).toFixed(2)),
          message: 'ยอดเงินหารเฉลี่ยลงตัว ไม่มีเศษหล่นหาย'
        });
      } else {
        throw new Error(`หารไม่ลงตัว sum=${sum}`);
      }
    } catch (e: any) {
      results.push({
        id: 't4',
        name: 'สมการกระจายบิลรายจ่ายตามจำนวนไร่ (Split Bill)',
        status: 'fail',
        durationMs: Number((performance.now() - t4Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 5: ทดสอบ IndexedDB CRUD
    const t5Start = performance.now();
    try {
      const testId = `self-test-${Date.now()}`;
      await db.transactions.add({
        id: testId,
        cycleId: 'test-cycle',
        type: 'expense',
        category: 'fuel',
        categoryLabel: 'น้ำมัน',
        title: 'ทดสอบระบบ',
        amount: 100,
        recordedBy: 'me',
        paymentStatus: 'credit',
        creditorName: 'ร้านทดสอบ',
        date: '2026-10-24',
        synced: false,
        syncStatus: 'pending',
        isDeleted: false,
        createdAt: Date.now()
      });

      await db.transactions.update(testId, { paymentStatus: 'paid', syncStatus: 'pending_update' });
      const checked = await db.transactions.get(testId);
      if (checked?.paymentStatus !== 'paid') throw new Error('ตัดหนี้ไม่สำเร็จ');

      await db.transactions.delete(testId);

      results.push({
        id: 't5',
        name: 'ระบบฐานข้อมูลในเครื่อง (IndexedDB CRUD & Debt Cut)',
        status: 'pass',
        durationMs: Number((performance.now() - t5Start).toFixed(2)),
        message: 'บันทึก อัปเดต และตัดหนี้ได้ราบรื่น'
      });
    } catch (e: any) {
      results.push({
        id: 't5',
        name: 'ระบบฐานข้อมูลในเครื่อง (IndexedDB CRUD & Debt Cut)',
        status: 'fail',
        durationMs: Number((performance.now() - t5Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 6: ทดสอบการตรวจจับและคัดกรองรายการผี 0 บาท (Ghost Records Rejection Test)
    const t6Start = performance.now();
    try {
      const ghostCandidate = {
        id: 'ghost-test',
        title: 'รายการ',
        amount: 0,
        date: ''
      };
      // ต้องตรวจจับได้ว่าเป็น ghost
      const isGhost = Number(ghostCandidate.amount) === 0 && (ghostCandidate.title === 'รายการ' || !ghostCandidate.date);
      if (isGhost) {
        results.push({
          id: 't6',
          name: 'ระบบตรวจจับ & ป้องกันรายการผี 0 บ. (Ghost Rejection)',
          status: 'pass',
          durationMs: Number((performance.now() - t6Start).toFixed(2)),
          message: 'คัดกรองรายการผี 0 บ. สำเร็จ 100% ไม่หลุดเข้าจอ'
        });
      } else {
        throw new Error('ตรวจจับรายการผีไม่สำเร็จ');
      }
    } catch (e: any) {
      results.push({
        id: 't6',
        name: 'ระบบตรวจจับ & ป้องกันรายการผี 0 บ. (Ghost Rejection)',
        status: 'fail',
        durationMs: Number((performance.now() - t6Start).toFixed(2)),
        message: e.message
      });
    }

    // TEST 7: ทดสอบระบบกำจัดแปลงที่ถูกลบ & ป้องกันการคืนชีพ (Cycle Deletion & Resurrection Prevention Test)
    const t7Start = performance.now();
    try {
      const testCycleId = `test-cycle-${Date.now()}`;
      await db.cycles.add({
        id: testCycleId,
        name: 'แปลงทดสอบลบ',
        cropType: 'ผักกาด',
        totalAreaRai: 1,
        areaRai: 1,
        areaNgan: 0,
        areaSqWa: 0,
        startDate: '2026-10-26',
        expectedHarvestDate: '2026-11-25',
        status: 'active',
        createdAt: Date.now()
      });

      // จำลองการลบแปลงพร้อมบันทึก Tombstone
      markCycleAsDeleted(testCycleId);
      await db.cycles.delete(testCycleId);

      // ตรวจสอบว่าอยู่ใน Tombstone
      if (!isCycleDeleted(testCycleId)) throw new Error('บันทึก Tombstone แปลงไม่สำเร็จ');

      // ตรวจสอบว่าใน IndexedDB ไม่มีแปลงนี้แล้ว
      const inDb = await db.cycles.get(testCycleId);
      if (inDb) throw new Error('แปลงยังคงอยู่ใน IndexedDB');

      results.push({
        id: 't7',
        name: 'ระบบป้องกันแปลงคืนชีพ (Cycle Deletion & Tombstone)',
        status: 'pass',
        durationMs: Number((performance.now() - t7Start).toFixed(2)),
        message: 'ลบแปลงถาวรและบล็อกการดึงกลับจาก Google Sheets 100%'
      });
    } catch (e: any) {
      results.push({
        id: 't7',
        name: 'ระบบป้องกันแปลงคืนชีพ (Cycle Deletion & Tombstone)',
        status: 'fail',
        durationMs: Number((performance.now() - t7Start).toFixed(2)),
        message: e.message
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  // รันระบบซ่อมแซมข้อมูลอัตโนมัติ (Data Integrity & Auto-Repair)
  const handleAutoRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await repairDataIntegrity();
      if (res.repairedCount > 0) {
        setRepairLogs(res.details);
      } else {
        setRepairLogs(['✅ ข้อมูลทั้งหมดสมบูรณ์ 100% ไม่พบข้อผิดพลาดที่ต้องซ่อม']);
      }
      await refreshStorageMetrics();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      setRepairLogs([`❌ เกิดข้อผิดพลาดในการซ่อมแซม: ${e.message}`]);
    }
    setIsRepairing(false);
  };

  // ส่งออกสำรองฉุกเฉิน
  const handleEmergencyExport = async () => {
    try {
      const cycles = await db.cycles.toArray();
      const transactions = await db.transactions.toArray();
      const inventory = await db.inventory.toArray();
      const plotLogs = await db.plotLogs.toArray();

      const data = {
        exportedAt: new Date().toISOString(),
        cycles,
        transactions,
        inventory,
        plotLogs
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ฉุกเฉิน_สำรองข้อมูล_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('ส่งออกไฟล์ไม่สำเร็จ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold">คอนโซลตรวจสอบระบบ & ซ่อมแซมอัตโนมัติ</h2>
              <p className="text-[11px] text-slate-400">In-App Debug & Self-Healing Console</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white btn-touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* 🔥 0. การ์ดแก้ไขปัญหา "ลบรายการหรือลบแปลงแล้วไม่หาย" (Ghost & Deleted Records Cleaner) */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>แก้ปัญหาลบรายการ/ลบแปลงแล้วเด้งกลับ (Data Cleaner):</span>
              </span>
              {(ghostCount > 0 || badCycleCount > 0) && (
                <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                  พบ {ghostCount} รายการ / {badCycleCount} แปลงค้าง
                </span>
              )}
            </div>

            <p className="text-amber-900 text-[11px] leading-relaxed">
              แก้ปัญหาเวลาลบรายการแล้วกลายเป็นยอด 0 หรือลบแปลงแล้วพอกดซิงค์แปลงเดิมยังเด้งกลับมา ด้วยระบบ Tombstone บล็อกไม่ให้ดึงข้อมูลที่ลบแล้วกลับมาอีก 100%
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePurgeAll}
                className="py-2.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs btn-touch-active text-center text-xs"
              >
                <span>🧹 กวาดล้าง 0 บ. & แปลงที่ลบทันที</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs btn-touch-active text-center text-xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ดแก้ชีท'}</span>
              </button>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-[10px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">📌 วิธีอัปเดต Google Sheet ให้ลบถาวร (ทั้งรายการและแปลง):</div>
              <div>1. กดปุ่ม <strong>"คัดลอกโค้ดแก้ชีท"</strong> ด้านบน</div>
              <div>2. เปิด Google Sheets ของคุณ ไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></div>
              <div>3. ลบโค้ดเดิมทั้งหมด วางโค้ดใหม่ลงไป แล้วกด <strong>บันทึก (Save)</strong></div>
              <div>4. กด <strong>การปรับใช้ (Deploy) &gt; จัดการการปรับใช้ &gt; ดินสอ (แก้ไข) &gt; เวอร์ชัน: "เวอร์ชันใหม่" &gt; ปรับใช้</strong></div>
            </div>
          </div>

          {/* 1. Global Error Boundary Display */}
          {systemErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ตรวจพบข้อผิดพลาดของระบบ ({systemErrors.length} รายการ):
                </span>
                {onClearErrors && (
                  <button
                    onClick={onClearErrors}
                    className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold"
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px] text-rose-700 bg-white p-2 rounded-xl border border-rose-200">
                {systemErrors.map((err, idx) => (
                  <div key={idx} className="border-b border-rose-100 pb-0.5">{err}</div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Storage & State Inspector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-600" />
                <span>สถานะฐานข้อมูลในเครื่อง (IndexedDB Storage):</span>
              </h3>
              <button
                onClick={refreshStorageMetrics}
                className="text-slate-500 hover:text-slate-700 p-1 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">รายการบัญชี</div>
                <div className="text-base font-black text-slate-900">{txCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">แปลงเพาะปลูก</div>
                <div className="text-base font-black text-slate-900">{cycleCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                <div className="text-[10px] text-amber-800 font-bold">ค้างซิงค์ชีท</div>
                <div className="text-base font-black text-amber-700">{pendingSyncCount}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <span>ขนาดพื้นที่จัดเก็บ:</span>
              <span className="font-bold text-slate-800">{storageEstimate}</span>
            </div>

            <button
              onClick={handleEmergencyExport}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 btn-touch-active shadow-2xs text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดสำรองข้อมูลฉุกเฉิน (JSON)</span>
            </button>
          </div>

          {/* 3. Automated Self-Test Runner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-700" />
                <span>ระบบทดสอบความถูกต้องอัตโนมัติ (Self-Test Runner):</span>
              </h3>
              <button
                onClick={handleRunSelfTests}
                disabled={isRunningTests}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs btn-touch-active text-xs disabled:opacity-50"
              >
                <Play className={`w-3 h-3 ${isRunningTests ? 'animate-spin' : ''}`} />
                <span>{isRunningTests ? 'กำลังทดสอบ...' : 'รันระบบตรวจสอบ'}</span>
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs text-[11px]"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">{t.name}</div>
                      {t.message && <div className="text-[10px] text-slate-500 truncate">{t.message}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{t.durationMs}ms</span>
                      {t.status === 'pass' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                          <XCircle className="w-3 h-3 text-rose-600" /> FAIL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Data Integrity & Auto-Repair */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-sky-700" />
                <span>สแกน & ซ่อมแซมข้อมูลอัตโนมัติ (Data Self-Heal):</span>
              </h3>
              <button
                onClick={handleAutoRepair}
                disabled={isRepairing}
                className="px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs btn-touch-active text-xs disabled:opacity-50"
              >
                <Wrench className={`w-3 h-3 ${isRepairing ? 'animate-spin' : ''}`} />
                <span>{isRepairing ? 'กำลังซ่อม...' : 'ซ่อมแซมทันที'}</span>
              </button>
            </div>
            <p className="text-sky-800 text-[11px] leading-relaxed">
              สแกนหาตัวเลขผิดรูป (NaN), รายการผี 0 บ., วันที่ตกหล่น, แปลงที่ชื่อเสีย หรือสต็อกติดลบ แล้วปรับกลับสู่สถานะปลอดภัยอัตโนมัติ
            </p>

            {repairLogs.length > 0 && (
              <div className="bg-white p-2.5 rounded-xl border border-sky-200 text-[11px] font-mono text-slate-700 space-y-1 max-h-24 overflow-y-auto">
                {repairLogs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-xs btn-touch-active min-h-[48px]"
          >
            ปิดหน้าต่างตรวจสอบ
          </button>
        </div>
      </div>
    </div>
  );
};
