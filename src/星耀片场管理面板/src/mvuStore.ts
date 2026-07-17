import { Schema, StudioMvuState } from '../../eraAV/schema';
import { Actress, Actor, GlobalState, InventoryItem, PastWork, PredefinedScript, ShopItem } from './types';

export interface StudioTask {
  id: string;
  title: string;
  rank: string;
  description: string;
  reward: string;
  target: string;
  executors: string[];
  status: '可接取' | '进行中' | '已完成';
  group: '悬赏大厅' | '自选任务' | '进行中' | '已完成';
}

export interface StudioAchievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  unlocked: boolean;
}

export interface StudioViewState {
  raw: StudioMvuState;
  globalState: GlobalState;
  actresses: Actress[];
  actors: Actor[];
  inventory: InventoryItem[];
  shopItems: ShopItem[];
  pastWorks: PastWork[];
  activeProject: {
    isActive: boolean;
    workName: string;
    description: string;
    selectedActresses: string[];
    selectedActors: string[];
    progress: number;
    scriptId: string;
    stepLogs: string[];
  };
  scripts: PredefinedScript[];
  scriptLibrary: PredefinedScript[];
  privateCommissions: PredefinedScript[];
  tasks: StudioTask[];
  achievements: StudioAchievement[];
  theme: 'dark' | 'light';
}

type Listener = (state: StudioViewState) => void;
const listeners = new Set<Listener>();
let transaction: Promise<void> = Promise.resolve();
let mvuListener: { stop: () => void } | null = null;

export const actressId = (name: string) => `actress:${encodeURIComponent(name)}`;
export const actorId = (name: string) => `actor:${encodeURIComponent(name)}`;
const inventoryId = (category: string, name: string) => `inventory:${category}:${encodeURIComponent(name)}`;
const shopId = (category: string, name: string) => `shop:${category}:${encodeURIComponent(name)}`;

export const actressNameFromId = (id: string) => decodeURIComponent(id.replace(/^actress:/, ''));
export const actorNameFromId = (id: string) => decodeURIComponent(id.replace(/^actor:/, ''));

const variableOption = () => ({ type: 'message' as const, message_id: getCurrentMessageId() });

const normalizeEffect = (effect: { 目标: '女优' | '男优' | '全局'; 属性: string; 数值: number; 说明: string }) => ({
  target:
    effect.目标 === '女优' ? ('actress' as const) : effect.目标 === '男优' ? ('actor' as const) : ('global' as const),
  stat: effect.属性,
  value: effect.数值,
  text: effect.说明,
});

const fallbackEffect = (text: string) => {
  const amount = Number(text.match(/-?\d+/)?.[0] ?? 0);
  if (/体力/.test(text)) return [{ target: 'actress' as const, stat: 'stamina', value: amount, text }];
  if (/好感/.test(text)) return [{ target: 'actress' as const, stat: 'affection', value: amount || 1, text }];
  return [];
};

const mapScript = (
  id: string,
  title: string,
  value: string | StudioMvuState['AV拍摄系统']['剧本管理']['剧本库'][string],
): PredefinedScript => {
  if (typeof value === 'string') {
    return {
      id,
      title,
      description: value,
      requiredActorsCount: 1,
      requiredActressesCount: 1,
      baseQuality: 70,
      level: 'D',
      source: 'preset',
    };
  }
  const sourceMap = { 预设: 'preset', AI: 'ai', 自拟: 'custom', 收藏: 'library', 私人委托: 'private' } as const;
  return {
    id: value.ID || id,
    title,
    description: value.简介,
    requiredActorsCount: value.所需男优数,
    requiredActressesCount: value.所需女优数,
    baseQuality: value.基础质量,
    level: value.等级,
    requiredReputation: value.所需知名度,
    estimatedReward: value.预计报酬,
    shootingRequirements: value.拍摄要求,
    source: sourceMap[value.来源],
  };
};

export function toStudioView(rawInput: unknown): StudioViewState {
  const raw = Schema.parse(rawInput);
  const debt = raw.全局状态.经济.欠债系统;
  const globalState: GlobalState = {
    currentDate: raw.全局状态.日期时间.当前日期,
    currentTime: raw.全局状态.日期时间.当前时间,
    location: raw.全局状态.位置.当前所在地点,
    streetSecurity: raw.全局状态.街道治安,
    reputation: raw.全局状态.知名度,
    economy: {
      balance: raw.全局状态.经济.现有余额,
      remainingDebt: debt.剩余欠债总额,
      nextRepaymentDate: debt.下次还款日期,
      remainingRepayments: Math.max(0, debt.总还款次数 - debt.总已还款次数),
    },
  };

  const actresses = Object.entries(raw.女优).map(([key, value]) => {
    const experience = value.性经历 as Record<string, number>;
    return {
      id: actressId(key),
      name: value.基本信息.姓名 || key,
      age: value.基本信息.年龄,
      stageName: value.基本信息.艺名,
      occupation: value.基本信息.当前职业,
      bio: value.基本信息.简介,
      isSigned: value.基本信息.是否已签约,
      skill: value.数值系统.演出经验,
      affection: value.数值系统.好感度,
      corruption: value.数值系统.堕落度,
      pleasure: value.数值系统.快感值,
      stamina: value.数值系统.体力值,
      skill: value.数值系统.演出经验,
      isMouthVirgin: value.身体属性.口是否处女,
      isVaginaVirgin: value.身体属性.小穴是否处女,
      isAnusVirgin: value.身体属性.后穴是否处女,
      sexWithUser:
        experience.与玩家性交次数 ?? Object.entries(experience).find(([name]) => name.startsWith('与'))?.[1] ?? 0,
      sexWithOthers: value.性经历.与其他男性性交次数,
      zones: {
        mouth: value.敏感点开发度.口穴,
        breasts: value.敏感点开发度.胸部,
        vagina: value.敏感点开发度.小穴,
        anus: value.敏感点开发度.屁穴,
        feet: value.敏感点开发度.足部,
      },
      realtime: {
        clothes: {
          top: value.实时状态.上装,
          bottom: value.实时状态.下装,
          bra: value.实时状态.内衣,
          panties: value.实时状态.内裤,
          socks: value.实时状态.袜子,
          shoes: value.实时状态.鞋子,
          accessories: value.实时状态.饰品,
        },
        bodyState: {
          mouth: value.实时状态.身体状态.口穴,
          breasts: value.实时状态.身体状态.胸部,
          feet: value.实时状态.身体状态.足部,
          vagina: value.实时状态.身体状态.小穴,
          anus: value.实时状态.身体状态.屁穴,
        },
        isPresent: value.实时状态.当前是否在场,
        currentThought: value.实时状态.当前想法,
      },
      appearanceFee: value.基本信息.片酬 || undefined,
    } satisfies Actress;
  });

  const actors = Object.entries(raw.男优).map(([key, value]) => {
    return {
      id: actorId(key),
      name: value.基本信息.姓名 || key,
      age: value.基本信息.年龄,
      stageName: value.基本信息.艺名,
      occupation: value.基本信息.当前职业,
      bio: value.基本信息.简介,
      stamina: value.数值系统.体力值,
      clothes: { top: value.实时状态.上装, bottom: value.实时状态.下装, shoes: value.实时状态.鞋子 },
      currentThought: value.实时状态.当前想法,
      appearanceFee: value.基本信息.片酬 || undefined,
    } satisfies Actor;
  });

  const inventoryGroups = [
    ['消耗品', 'consumable'],
    ['情趣用品', 'toy'],
    ['衣物', 'clothing'],
    ['特殊物品', 'special'],
  ] as const;
  const inventory = inventoryGroups.flatMap(([group, category]) =>
    Object.entries(raw.背包管理[group]).map(([name, value]) => ({
      id: inventoryId(group, name),
      name,
      category,
      quantity: value.数量,
      description: value.描述,
      effects: value.效果.length ? value.效果.map(normalizeEffect) : fallbackEffect(value.数值效果),
    })),
  );

  const shopGroups = [
    ['正常商品', 'normal'],
    ['成人商品', 'adult'],
    ['衣服', 'clothing'],
    ['道具', 'prop'],
  ] as const;
  const shopItems = shopGroups.flatMap(([group, category]) =>
    Object.entries(raw.商店[group]).map(([name, value]) => ({
      id: shopId(group, name),
      name,
      category,
      price: value.价格,
      description: value.描述,
      icon: '',
      effects: value.效果.length ? value.效果.map(normalizeEffect) : fallbackEffect(value.数值效果),
    })),
  );

  const pastWorks = Object.entries(raw.AV拍摄系统.过往作品).map(([name, value], index) => ({
    id: `work:${encodeURIComponent(name)}`,
    workName: name,
    actors: value.男优,
    actresses: value.女优,
    rating: value.评分,
    profit: value.总获利,
    evaluation: value.评价,
    releaseDay: Number(value.上映日期.match(/(\d+)日/)?.[1] ?? index + 1),
    isProfitWindowActive: value.上映后天数 <= 7,
    daysSinceRelease: value.上映后天数,
  }));

  const current = raw.AV拍摄系统.当前拍摄;
  const tasks = (['悬赏大厅', '自选任务', '进行中', '已完成'] as const).flatMap(group =>
    Object.entries(raw.任务系统[group]).map(([id, value]) => ({
      id,
      title: value.标题,
      rank: value.Rank,
      description: value.描述,
      reward: value.奖励,
      target: value.指定对象,
      executors: value.执行者,
      status: value.状态,
      group,
    })),
  );

  return {
    raw,
    globalState,
    actresses,
    actors,
    inventory,
    shopItems,
    pastWorks,
    activeProject: {
      isActive: current.是否拍摄中,
      workName: current.当前作品名称,
      description: current.作品简介,
      selectedActresses: current.拍摄者.女优.map(actressId),
      selectedActors: current.拍摄者.男优.map(name => (name === '{{user}}' ? '__user_actor__' : actorId(name))),
      progress: current.作品完成度,
      scriptId: current.选中剧本ID,
      stepLogs: current.步骤日志,
    },
    scripts: Object.entries(raw.AV拍摄系统.剧本管理.可选现成剧本).map(([title, value], index) =>
      mapScript(`mvu-script:${index}:${encodeURIComponent(title)}`, title, value),
    ),
    scriptLibrary: Object.entries(raw.AV拍摄系统.剧本管理.剧本库).map(([title, value], index) =>
      mapScript(`mvu-library:${index}:${encodeURIComponent(title)}`, title, value),
    ),
    privateCommissions: Object.entries(raw.AV拍摄系统.剧本管理.私人委托).map(([title, value], index) =>
      mapScript(`mvu-commission:${index}:${encodeURIComponent(title)}`, title, value),
    ),
    tasks,
    achievements: Object.entries(raw.成就系统).map(([id, value]) => ({
      id,
      name: value.名称,
      description: value.描述,
      progress: value.进度,
      target: value.目标,
      reward: value.奖励,
      unlocked: value.已解锁,
    })),
    theme: raw.界面设置.主题 === '高级会所金色主题' ? 'light' : 'dark',
  };
}

export function readStudioState(): StudioViewState {
  const data = Mvu.getMvuData(variableOption());
  return toStudioView(data.stat_data);
}

const publish = (state = readStudioState()) => listeners.forEach(listener => listener(state));

export function updateStudioState(mutator: (state: StudioMvuState) => void | StudioMvuState): Promise<void> {
  const run = transaction
    .catch(() => undefined)
    .then(async () => {
      const option = variableOption();
      const data = Mvu.getMvuData(option);
      const draft = Schema.parse(_.cloneDeep(data.stat_data));
      const result = mutator(draft) ?? draft;
      const stat_data = Schema.parse(result);
      await Mvu.replaceMvuData({ ...data, stat_data }, option);
      publish(toStudioView(stat_data));
    });
  transaction = run.catch(error => console.error('[MVU Store] 事务写回失败', error));
  return run;
}

export function subscribeStudioState(listener: Listener): () => void {
  listeners.add(listener);
  listener(readStudioState());
  if (!mvuListener) {
    mvuListener = eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => publish());
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      mvuListener?.stop();
      mvuListener = null;
    }
  };
}

export function enqueueMvuAction(
  state: StudioMvuState,
  type: StudioMvuState['操作队列'][number]['类型'],
  detail: string,
) {
  state.操作队列.push({
    id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    类型: type,
    标题: detail,
    详情: detail,
    时间: `${state.全局状态.日期时间.当前日期} ${state.全局状态.日期时间.当前时间}`,
    可撤销: type === '购买',
    商品名: '',
    商品分类: '',
    数量: 0,
    金额: 0,
  });
}
