export interface GlobalState {
  currentDate: string; // e.g. "2026年07月08日"
  currentTime: string; // e.g. "14:30"
  location: string; // e.g. "第一摄影棚"
  streetSecurity: '动荡' | '戒备' | '安定';
  reputation: number;
  economy: {
    balance: number; // 现有余额
    remainingDebt: number; // 总剩余欠债
    nextRepaymentDate: string; // 下次还债日期
    remainingRepayments: number; // 还剩余几次未还
  };
}

export interface ErogenousZones {
  mouth: number; // 口穴开发度 (0-99)
  breasts: number; // 胸部开发度 (0-99)
  vagina: number; // 小穴开发度 (0-99)
  anus: number; // 屁穴开发度 (0-99)
  feet: number; // 足部开发度 (0-99)
}

export interface ActressRealtimeState {
  clothes: {
    top: string; // 上装
    bottom: string; // 下装
    bra: string; // 内衣
    panties: string; // 内裤
    socks: string; // 袜子
    shoes: string; // 鞋子
    accessories: string; // 饰品
  };
  bodyState: {
    mouth: string;
    breasts: string; // 乳房即时描述
    feet: string; // 足部即时描述
    vagina: string; // 小穴即时描述
    anus: string; // 屁穴即时描述
  };
  isPresent: boolean; // 当前是否在场
  currentThought: string; // 当前想法
}

export interface Actress {
  id: string;
  name: string;
  age: number;
  stageName: string; // 艺名
  occupation: string;
  bio: string; // 简介 (~100字)
  isSigned: boolean; // 是否已签约

  // 数值系统
  skill: number; // 演出经验 (0-99)
  affection: number; // 好感度 (0-99)
  corruption: number; // 堕落度 (0-99)
  pleasure: number; // 快感值 (即时，事后衰减/归零)
  stamina: number; // 体力值 (0-100)

  // 身体属性
  isMouthVirgin: boolean;
  isVaginaVirgin: boolean;
  isAnusVirgin: boolean;

  // 性经历
  sexWithUser: number;
  sexWithOthers: number;

  // 敏感点开发度
  zones: ErogenousZones;

  // 实时状态
  realtime: ActressRealtimeState;
  appearanceFee?: number;
}

export interface Actor {
  id: string;
  name: string;
  age: number;
  stageName: string;
  occupation: string;
  bio: string; // ~50字
  stamina: number;
  skill: number;
  clothes: {
    top: string;
    bottom: string;
    shoes: string;
  };
  currentThought: string;
  appearanceFee?: number;
}

export type ItemCategory = 'consumable' | 'toy' | 'clothing' | 'special';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  description: string;
  effects: {
    target: 'actress' | 'actor' | 'global';
    stat: string;
    value: number;
    text: string;
  }[];
}

export type ShopCategory = 'normal' | 'adult' | 'clothing' | 'prop';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  icon: string;
  effects: {
    target: 'actress' | 'actor' | 'global';
    stat: string;
    value: number;
    text: string;
  }[];
}

export interface CreativeServiceConfig {
  baseUrl: string;
  apiKey: string;
  models: string[];
  selectedModel: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface MrfzSettings {
  apiMode: 'single' | 'multi';
  secondApi: CreativeServiceConfig;
  prompts: ApiPromptSettings;
}

export interface ApiPromptSettings {
  variableUpdate: string;
  workReviews: string;
  privateRequests: string;
  blackMarket: string;
  scriptRefresh: string;
  scriptGenerate: string;
  scriptEvaluate: string;
}

export interface PredefinedScript {
  id: string;
  title: string;
  description: string;
  requiredActorsCount: number;
  requiredActressesCount: number;
  baseQuality: number;
  level: ScriptLevel;
  requiredReputation?: number;
  estimatedReward?: number;
  shootingRequirements?: string[];
  source?: 'preset' | 'ai' | 'custom' | 'library' | 'private';
}

export type ScriptLevel = 'D' | 'C' | 'B' | 'A' | 'S';

export const SCRIPT_LEVEL_WEIGHT: Record<ScriptLevel, number> = { D: 1, C: 2, B: 3, A: 4, S: 5 };

export const getScriptLevelForReputation = (reputation: number): ScriptLevel => {
  const normalized = Math.min(1000, Math.max(0, Math.floor(reputation)));
  if (normalized >= 800) return 'S';
  if (normalized >= 600) return 'A';
  if (normalized >= 400) return 'B';
  if (normalized >= 200) return 'C';
  return 'D';
};

export interface ActiveShoot {
  workName: string;
  description: string;
  selectedActors: string[]; // 男优ID
  selectedActresses: string[]; // 女优ID
  estimatedSales: number; // 预计销量
  shootingSummary: string; // 拍摄摘要
  completionRate: number; // 完成度 (0-100)
  scriptId?: string;
}

export interface PastWork {
  id: string;
  workName: string;
  actors: string[];
  actresses: string[];
  rating: number; // 评分 (e.g., 9.2/10)
  profit: number; // 总获利 (金币)
  evaluation: string; // 3-5句话
  releaseDay: number; // 几号发行的，用于判定一周期限
  isProfitWindowActive: boolean; // 是否在上映一周内产生收益
  daysSinceRelease: number;
}
