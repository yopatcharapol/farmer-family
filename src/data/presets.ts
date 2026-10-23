import { ExpenseCategory, IncomeCategory } from '../types';

export interface PresetItem {
  id: string;
  name: string;
  category: ExpenseCategory | IncomeCategory;
  defaultUnit: string;
  suggestedPrices?: number[];
  icon: string;
  description?: string;
}

export interface CategoryInfo {
  id: ExpenseCategory | IncomeCategory;
  type: 'expense' | 'income';
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  // 8 หมวดหมู่ต้นทุน
  {
    id: 'seeds',
    type: 'expense',
    name: 'พันธุ์พืช/กล้า',
    icon: '🌱',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-300',
    description: 'เมล็ดพันธุ์ ต้นกล้า ท่อนพันธุ์'
  },
  {
    id: 'fertilizer',
    type: 'expense',
    name: 'ปุ๋ย/บำรุงดิน',
    icon: '🌾',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-300',
    description: 'ปุ๋ยเคมี ปุ๋ยคอก ปุ๋ยอินทรีย์ ปูนขาว'
  },
  {
    id: 'chemical',
    type: 'expense',
    name: 'ยา/ฮอร์โมน',
    icon: '🧪',
    color: 'text-purple-700',
    bgLight: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-300',
    description: 'ยาคุมหญ้า ยาหนอน ยาเพลี้ย ฮอร์โมน'
  },
  {
    id: 'labor',
    type: 'expense',
    name: 'ค่าแรงคนงาน',
    icon: '👷‍♂️',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-300',
    description: 'ค่าจ้างรายวัน เหมาดายหญ้า ปลูก ตัด'
  },
  {
    id: 'machinery',
    type: 'expense',
    name: 'รถจ้าง/เครื่องจักร',
    icon: '🚜',
    color: 'text-orange-700',
    bgLight: 'bg-orange-50 hover:bg-orange-100',
    borderColor: 'border-orange-300',
    description: 'จ้างรถไถ รถเกี่ยวข้าว โดรนพ่นยา'
  },
  {
    id: 'fuel',
    type: 'expense',
    name: 'น้ำมัน/ไฟฟ้า',
    icon: '⛽',
    color: 'text-rose-700',
    bgLight: 'bg-rose-50 hover:bg-rose-100',
    borderColor: 'border-rose-300',
    description: 'น้ำมันดีเซล เบนซิน ไฟฟ้าปั๊มน้ำ'
  },
  {
    id: 'fixed',
    type: 'expense',
    name: 'ค่าเช่า/ดอกเบี้ย',
    icon: '📑',
    color: 'text-slate-700',
    bgLight: 'bg-slate-100 hover:bg-slate-200',
    borderColor: 'border-slate-300',
    description: 'ค่าเช่าที่นา ดอกเบี้ย ธ.ก.ส.'
  },
  {
    id: 'transport',
    type: 'expense',
    name: 'ขนส่ง/กระสอบ',
    icon: '📦',
    color: 'text-teal-700',
    bgLight: 'bg-teal-50 hover:bg-teal-100',
    borderColor: 'border-teal-300',
    description: 'ค่ารถบรรทุก กระสอบ ลัง ค่าชั่ง'
  },

  // 3 หมวดหมู่รายได้
  {
    id: 'main_crop',
    type: 'income',
    name: 'ขายผลผลิต',
    icon: '💰',
    color: 'text-green-700',
    bgLight: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-300',
    description: 'ขายข้าวเปลือก ข้าวโพด มัน ผลไม้'
  },
  {
    id: 'by_product',
    type: 'income',
    name: 'ขายผลพลอยได้',
    icon: '🌾',
    color: 'text-lime-700',
    bgLight: 'bg-lime-50 hover:bg-lime-100',
    borderColor: 'border-lime-300',
    description: 'ขายฟางข้าว แกลบ กิ่งพันธุ์ มูลสัตว์'
  },
  {
    id: 'subsidy',
    type: 'income',
    name: 'เงินช่วยเหลือรัฐ',
    icon: '🏛️',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50 hover:bg-indigo-100',
    borderColor: 'border-indigo-300',
    description: 'ประกันรายได้ เงินชดเชยภัยแล้ง/น้ำท่วม'
  }
];

// รายการ Preset ปุ่มด่วนสำหรับเกษตรกรไทย (แตะครั้งเดียวขึ้นทันที)
export const PRESET_ITEMS: Record<string, PresetItem[]> = {
  seeds: [
    { id: 's1', name: 'เมล็ดพันธุ์ข้าว กข', category: 'seeds', defaultUnit: 'ถัง', icon: '🌾' },
    { id: 's2', name: 'เมล็ดพันธุ์ข้าวหอมมะลิ', category: 'seeds', defaultUnit: 'ถัง', icon: '🌾' },
    { id: 's3', name: 'เมล็ดข้าวโพด', category: 'seeds', defaultUnit: 'ถุง', icon: '🌽' },
    { id: 's4', name: 'ท่อนพันธุ์มันสำปะหลัง', category: 'seeds', defaultUnit: 'มัด', icon: '🥔' },
    { id: 's5', name: 'ต้นกล้า / กิ่งพันธุ์', category: 'seeds', defaultUnit: 'ต้น', icon: '🌱' },
  ],
  fertilizer: [
    { id: 'f1', name: 'ปุ๋ย 46-0-0 (ยูเรีย)', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '⚪' },
    { id: 'f2', name: 'ปุ๋ย 16-16-16 (เสมอ)', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '🔵' },
    { id: 'f3', name: 'ปุ๋ย 15-15-15', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '🟢' },
    { id: 'f4', name: 'ปุ๋ยสูตรรับรวง (0-0-60)', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '🔴' },
    { id: 'f5', name: 'ปุ๋ยคอก / ขี้วัว / ขี้ไก่', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '🤎' },
    { id: 'f6', name: 'ปูนขาว / โดโลไมท์', category: 'fertilizer', defaultUnit: 'กระสอบ', icon: '⚪' },
  ],
  chemical: [
    { id: 'c1', name: 'ยาคุมหญ้า / ฆ่าหญ้า', category: 'chemical', defaultUnit: 'ขวด', icon: '🌿' },
    { id: 'c2', name: 'ยาฆ่าหนอน / หนอนกอ', category: 'chemical', defaultUnit: 'ขวด', icon: '🐛' },
    { id: 'c3', name: 'ยาเพลี้ยไฟ / เพลี้ยกระโดด', category: 'chemical', defaultUnit: 'ซอง', icon: '🦟' },
    { id: 'c4', name: 'ยาเชื้อรา / โรคไหม้', category: 'chemical', defaultUnit: 'ขวด', icon: '🍄' },
    { id: 'c5', name: 'ฮอร์โมนเร่งรวง / สารจับใบ', category: 'chemical', defaultUnit: 'ขวด', icon: '💧' },
  ],
  labor: [
    { id: 'l1', name: 'ค่าแรงตัดหญ้า / ดายหญ้า', category: 'labor', defaultUnit: 'วัน', icon: '🧑‍🌾' },
    { id: 'l2', name: 'ค่าแรงดำนา / หว่านข้าว', category: 'labor', defaultUnit: 'วัน', icon: '🧑‍🌾' },
    { id: 'l3', name: 'ค่าแรงฉีดพ่นยา / ใส่ปุ๋ย', category: 'labor', defaultUnit: 'วัน', icon: '🧑‍🌾' },
    { id: 'l4', name: 'ค่าแรงเกี่ยว / ขนย้าย', category: 'labor', defaultUnit: 'วัน', icon: '🧑‍🌾' },
    { id: 'l5', name: 'ค่าแรงเหมาแปลง', category: 'labor', defaultUnit: 'ไร่', icon: '👥' },
  ],
  machinery: [
    { id: 'm1', name: 'จ้างรถไถดะ / ไถแปร', category: 'machinery', defaultUnit: 'ไร่', icon: '🚜' },
    { id: 'm2', name: 'จ้างรถปั่นดินเลน / ตีเทือก', category: 'machinery', defaultUnit: 'ไร่', icon: '🚜' },
    { id: 'm3', name: 'จ้างโดรนพ่นยา / หว่านปุ๋ย', category: 'machinery', defaultUnit: 'ไร่', icon: '🚁' },
    { id: 'm4', name: 'จ้างรถเกี่ยวข้าว', category: 'machinery', defaultUnit: 'ไร่', icon: '🌾' },
    { id: 'm5', name: 'จ้างรถขุด / แทรกเตอร์', category: 'machinery', defaultUnit: 'ชั่วโมง', icon: '🚜' },
  ],
  fuel: [
    { id: 'fl1', name: 'น้ำมันดีเซลสูบน้ำ', category: 'fuel', defaultUnit: 'ลิตร', icon: '⛽' },
    { id: 'fl2', name: 'น้ำมันดีเซลรถไถ', category: 'fuel', defaultUnit: 'ลิตร', icon: '⛽' },
    { id: 'fl3', name: 'น้ำมันเบนซินเครื่องพ่นยา', category: 'fuel', defaultUnit: 'ลิตร', icon: '⛽' },
    { id: 'fl4', name: 'ค่าไฟฟ้าปั๊มน้ำบาดาล', category: 'fuel', defaultUnit: 'รอบ', icon: '⚡' },
  ],
  fixed: [
    { id: 'fx1', name: 'ค่าเช่าที่ดินการเกษตร', category: 'fixed', defaultUnit: 'ปี', icon: '📄' },
    { id: 'fx2', name: 'ดอกเบี้ยเงินกู้ ธ.ก.ส.', category: 'fixed', defaultUnit: 'งวด', icon: '🏦' },
    { id: 'fx3', name: 'ค่าบำรุงท่อส่งน้ำ / คลอง', category: 'fixed', defaultUnit: 'รอบ', icon: '💧' },
  ],
  transport: [
    { id: 't1', name: 'ค่ารถบรรทุกขนส่งไปลาน', category: 'transport', defaultUnit: 'เที่ยว', icon: '🚚' },
    { id: 't2', name: 'ค่ากระสอบบรรจุผลผลิต', category: 'transport', defaultUnit: 'ใบ', icon: '📦' },
    { id: 't3', name: 'ค่าชั่งน้ำหนัก / วัดความชื้น', category: 'transport', defaultUnit: 'ครั้ง', icon: '⚖️' },
  ],
  main_crop: [
    { id: 'i1', name: 'ขายข้าวเปลือก (ลานประมูล/ท่าข้าว)', category: 'main_crop', defaultUnit: 'ตัน', icon: '🌾' },
    { id: 'i2', name: 'ขายข้าวเปลือก (สหกรณ์)', category: 'main_crop', defaultUnit: 'ตัน', icon: '🌾' },
    { id: 'i3', name: 'ขายข้าวสาร', category: 'main_crop', defaultUnit: 'กก.', icon: '🍚' },
    { id: 'i4', name: 'ขายข้าวโพดเลี้ยงสัตว์', category: 'main_crop', defaultUnit: 'ตัน', icon: '🌽' },
    { id: 'i5', name: 'ขายมันสำปะหลัง', category: 'main_crop', defaultUnit: 'ตัน', icon: '🥔' },
  ],
  by_product: [
    { id: 'bp1', name: 'ขายฟางข้าวอัดก้อน', category: 'by_product', defaultUnit: 'ก้อน', icon: '🟨' },
    { id: 'bp2', name: 'ขายแกลบ / รำข้าว', category: 'by_product', defaultUnit: 'กระสอบ', icon: '🌾' },
    { id: 'bp3', name: 'ขายมูลสัตว์ / ปุ๋ยคอก', category: 'by_product', defaultUnit: 'กระสอบ', icon: '🤎' },
  ],
  subsidy: [
    { id: 'sub1', name: 'เงินประกันรายได้เกษตรกร', category: 'subsidy', defaultUnit: 'รอบ', icon: '🏛️' },
    { id: 'sub2', name: 'เงินช่วยเหลือค่าเก็บเกี่ยว/ปรับปรุง', category: 'subsidy', defaultUnit: 'ไร่', icon: '💰' },
    { id: 'sub3', name: 'เงินชดเชยภัยพิบัติ/น้ำท่วม/แล้ง', category: 'subsidy', defaultUnit: 'รอบ', icon: '🤝' },
  ]
};
