import { useEffect, useState } from 'react';
import { GlobalState, InventoryItem, PastWork, PredefinedScript, ShopItem } from './types';
import { loadMrfzSettings } from './settings';

import CastManagementTab from './components/CastManagementTab';
import InventoryTab from './components/InventoryTab';
import ShopTab from './components/ShopTab';
import ShootingTab from './components/ShootingTab';
import SettingsTab from './components/SettingsTab';
import OperationsTab from './components/OperationsTab';
import AchievementsTab from './components/AchievementsTab';
import { WorkReview } from './requestHandler';
import {
  actorNameFromId,
  actressNameFromId,
  enqueueMvuAction,
  StudioViewState,
  subscribeStudioState,
  updateStudioState,
} from './mvuStore';

import { Calendar, Clock, Compass, Coins, Crown, CreditCard } from 'lucide-react';

export interface ActiveProjectState {
  isActive: boolean;
  workName: string;
  description: string;
  selectedActresses: string[];
  selectedActors: string[];
  progress: number;
  scriptId: string;
  stepLogs: string[];
}

const streetSecurityInfo = {
  动荡: {
    description: '街区秩序紧张，夜间行动需格外谨慎。',
    className: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  戒备: {
    description: '巡逻频繁，街面维持着克制的平衡。',
    className: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  安定: {
    description: '街区秩序平稳，片场周边一切如常。',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
} as const;

export default function App() {
  const [studio, setStudio] = useState<StudioViewState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'shoot' | 'cast' | 'inventory' | 'shop' | 'operations' | 'achievements' | 'settings'
  >('shoot');
  const [settings, setSettings] = useState(loadMrfzSettings);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);

  useEffect(() => {
    try {
      return subscribeStudioState(setStudio);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'MVU 变量读取失败');
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!studio || studio.raw.$前端状态.剧本库已迁移) return;
    try {
      const legacy = JSON.parse(localStorage.getItem('starlight_script_library') || '[]') as PredefinedScript[];
      void updateStudioState(state => {
        state.AV拍摄系统.剧本管理.剧本库 = Object.fromEntries(
          legacy.map(script => [script.title, { ...toRawScript(script), 来源: '收藏' as const }]),
        );
        state.$前端状态.剧本库已迁移 = true;
      });
    } catch (error) {
      console.warn('[MVU] 旧剧本库迁移失败，将保留原 localStorage 数据', error);
    }
  }, [studio]);

  const globalState = studio?.globalState;
  const actresses = studio?.actresses ?? [];
  const actors = studio?.actors ?? [];
  const inventory = studio?.inventory ?? [];
  const pastWorks = studio?.pastWorks ?? [];
  const activeProject = studio?.activeProject ?? {
    isActive: false,
    workName: '',
    description: '',
    selectedActresses: [],
    selectedActors: [],
    progress: 0,
    scriptId: '',
    stepLogs: [],
  };
  const statusBarTheme = studio?.theme ?? 'dark';
  const security = streetSecurityInfo[globalState?.streetSecurity ?? '安定'];
  const actionLogs =
    studio?.raw.操作队列.map(action => ({ id: action.id, text: action.详情 || action.标题, createdAt: Date.now() })) ??
    [];
  const initialWorkReviews = Object.fromEntries(
    pastWorks.map(work => [
      work.id,
      (studio?.raw.AV拍摄系统.过往作品[work.workName]?.观众评价 ?? []).map((text, index) => {
        const parts = text.split('｜');
        return parts.length >= 3
          ? { username: parts[0], rating: Number(parts[1]) || work.rating, content: parts.slice(2).join('｜') }
          : { username: `观众${index + 1}`, rating: work.rating, content: text };
      }),
    ]),
  ) as Record<string, WorkReview[]>;

  const logAction = (msg: string) => {
    const id = `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    void updateStudioState(state => {
      const type = msg.includes('购买')
        ? '购买'
        : msg.includes('使用')
          ? '使用物品'
          : msg.includes('丢弃')
            ? '丢弃物品'
            : msg.includes('结束拍摄')
              ? '结束拍摄'
              : msg.includes('拍摄')
                ? '拍摄企划'
                : msg.includes('日期')
                  ? '日期推进'
                  : 'AI任务生成';
      enqueueMvuAction(state, type, msg);
      state.操作队列.at(-1)!.id = id;
    });
    return id;
  };

  const removeAction = (id: string) =>
    void updateStudioState(state => {
      state.操作队列 = state.操作队列.filter(action => action.id !== id);
    });

  const updateActressStageName = (id: string, stageName: string) => {
    const normalized = stageName.trim();
    if (!normalized) return;
    void updateStudioState(state => {
      const actress = state.女优[actressNameFromId(id)];
      if (actress) actress.基本信息.艺名 = normalized;
    });
  };

  const updateActorStageName = (id: string, stageName: string) => {
    const normalized = stageName.trim();
    if (!normalized) return;
    void updateStudioState(state => {
      const actor = state.男优[actorNameFromId(id)];
      if (actor) actor.基本信息.艺名 = normalized;
    });
  };

  const setStatusBarTheme = (theme: 'dark' | 'light') =>
    void updateStudioState(state => {
      state.界面设置.主题 = theme === 'light' ? '高级会所金色主题' : 'Galgame粉色主题';
    });

  const setGlobalState = (updated: GlobalState) =>
    void updateStudioState(state => {
      state.全局状态.日期时间.当前日期 = updated.currentDate;
      state.全局状态.日期时间.当前时间 = updated.currentTime;
      state.全局状态.位置.当前所在地点 = updated.location;
      state.全局状态.街道治安 = updated.streetSecurity;
      state.全局状态.经济.现有余额 = updated.economy.balance;
      state.全局状态.经济.欠债系统.剩余欠债总额 = updated.economy.remainingDebt;
      state.全局状态.经济.欠债系统.下次还款日期 = updated.economy.nextRepaymentDate;
    });

  const setActiveProject = (project: ActiveProjectState) =>
    void updateStudioState(state => {
      const current = state.AV拍摄系统.当前拍摄;
      current.是否拍摄中 = project.isActive;
      current.当前作品名称 = project.workName;
      current.作品简介 = project.description;
      current.拍摄者.女优 = project.selectedActresses.map(actressNameFromId);
      current.拍摄者.男优 = project.selectedActors.map(id =>
        id === '__user_actor__' ? '{{user}}' : actorNameFromId(id),
      );
      current.企划步骤.演员 = [...current.拍摄者.女优, ...current.拍摄者.男优];
      current.作品完成度 = project.progress;
      current.选中剧本ID = project.scriptId;
      current.步骤日志 = project.stepLogs;
      current.目前拍摄摘要 = project.stepLogs.at(-1) ?? current.目前拍摄摘要;
      state.AV拍摄系统.剧本管理.自行发挥 = !project.scriptId;
    });

  const toRawScript = (script: PredefinedScript) => ({
    ID: script.id,
    简介: script.description,
    所需男优数: script.requiredActorsCount,
    所需女优数: script.requiredActressesCount,
    基础质量: script.baseQuality,
    等级: script.level,
    所需知名度: script.requiredReputation ?? 0,
    预计报酬: script.estimatedReward ?? script.baseQuality * 1500,
    拍摄要求: script.shootingRequirements ?? [],
    来源:
      script.source === 'ai'
        ? ('AI' as const)
        : script.source === 'custom'
          ? ('自拟' as const)
          : script.source === 'library'
            ? ('收藏' as const)
            : script.source === 'private'
              ? ('私人委托' as const)
            : ('预设' as const),
  });

  const saveScripts = (scripts: PredefinedScript[]) =>
    void updateStudioState(state => {
      state.AV拍摄系统.剧本管理.可选现成剧本 = Object.fromEntries(
        scripts.map(script => [script.title, toRawScript(script)]),
      );
    });

  const saveScriptLibrary = (scripts: PredefinedScript[]) =>
    void updateStudioState(state => {
      state.AV拍摄系统.剧本管理.剧本库 = Object.fromEntries(
        scripts.map(script => [script.title, { ...toRawScript(script), 来源: '收藏' as const }]),
      );
      state.$前端状态.剧本库已迁移 = true;
    });

  const savePrivateCommissions = (scripts: PredefinedScript[]) =>
    void updateStudioState(state => {
      state.AV拍摄系统.剧本管理.私人委托 = Object.fromEntries(
        scripts.map(script => [script.title, { ...toRawScript(script), 来源: '私人委托' as const }]),
      );
    });

  // Stats updates triggered dynamically during scene progress or AI state simulation
  const handleTriggerStatsUpdate = (
    castIds: string[],
    stats: {
      staminaChange: number;
      pleasureChange: number;
      affectionChange: number;
      corruptionChange: number;
      thought: string;
    },
  ) => {
    void updateStudioState(state => {
      castIds.forEach(id => {
        if (id.startsWith('actress:')) {
          const target = state.女优[actressNameFromId(id)];
          if (!target) return;
          target.数值系统.体力值 += stats.staminaChange;
          target.数值系统.快感值 += stats.pleasureChange;
          target.数值系统.好感度 += stats.affectionChange;
          target.数值系统.堕落度 += stats.corruptionChange;
          target.实时状态.当前想法 = stats.thought;
        } else if (id.startsWith('actor:')) {
          const target = state.男优[actorNameFromId(id)];
          if (target) target.数值系统.体力值 += stats.staminaChange;
        }
      });
    });
  };

  // Purchase shop item
  const handlePurchaseItem = (item: ShopItem) => {
    void updateStudioState(state => {
      if (state.全局状态.经济.现有余额 < item.price) throw new Error('余额不足');
      state.全局状态.经济.现有余额 -= item.price;
      const group =
        item.category === 'normal'
          ? '消耗品'
          : item.category === 'adult'
            ? '情趣用品'
            : item.category === 'clothing'
              ? '衣物'
              : '特殊物品';
      const existing = state.背包管理[group][item.name];
      state.背包管理[group][item.name] = existing
        ? { ...existing, 数量: existing.数量 + 1 }
        : {
            数量: 1,
            描述: item.description,
            数值效果: item.effects.map(effect => effect.text).join('；'),
            效果: item.effects.map(effect => ({
              目标:
                effect.target === 'actress'
                  ? ('女优' as const)
                  : effect.target === 'actor'
                    ? ('男优' as const)
                    : ('全局' as const),
              属性: effect.stat,
              数值: effect.value,
              说明: effect.text,
            })),
          };
    });
  };

  const handleUndoPurchaseItem = (item: ShopItem) => {
    void updateStudioState(state => {
      state.全局状态.经济.现有余额 += item.price;
      for (const group of ['消耗品', '情趣用品', '衣物', '特殊物品'] as const) {
        const existing = state.背包管理[group][item.name];
        if (existing) {
          existing.数量 -= 1;
          break;
        }
      }
    });
  };

  // Use inventory item
  const handleUseItem = (itemId: string, targetId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    void updateStudioState(state => {
      for (const group of ['消耗品', '情趣用品', '衣物', '特殊物品'] as const) {
        const rawItem = state.背包管理[group][item.name];
        if (rawItem) rawItem.数量 -= 1;
      }
      item.effects.forEach(effect => {
        if (targetId.startsWith('actress:')) {
          const target = state.女优[actressNameFromId(targetId)];
          if (!target) return;
          if (effect.stat === 'stamina') target.数值系统.体力值 += effect.value;
          if (effect.stat === 'affection') target.数值系统.好感度 += effect.value;
          if (effect.stat === 'corruption') target.数值系统.堕落度 += effect.value;
          if (effect.stat === 'pleasure') target.数值系统.快感值 += effect.value;
          if (effect.stat === 'zone_vagina') target.敏感点开发度.小穴 += effect.value;
          if (effect.stat === 'zone_anus') target.敏感点开发度.屁穴 += effect.value;
        } else if (targetId.startsWith('actor:') && effect.stat === 'stamina') {
          const target = state.男优[actorNameFromId(targetId)];
          if (target) target.数值系统.体力值 += effect.value;
        }
      });
    });
  };

  const handleUseItems = (itemIds: string[], targetId: string): string => {
    const targetActress = actresses.find(character => character.id === targetId);
    const targetActor = actors.find(character => character.id === targetId);
    if (!targetActress && !targetActor) throw new Error('找不到道具适用对象');
    const items = itemIds
      .map(id => inventory.find(item => item.id === id))
      .filter((item): item is InventoryItem => Boolean(item));
    if (items.length !== itemIds.length) throw new Error('部分道具已不在背包中');
    const applicable = (item: InventoryItem) =>
      item.effects.some(
        effect => effect.target === (targetActress ? 'actress' : 'actor') || effect.target === 'global',
      );
    if (items.some(item => !applicable(item))) throw new Error('所选道具中包含不适用于当前角色的物品');

    const staminaItems = items.filter(item => item.effects.some(effect => effect.stat === 'stamina'));
    const affectionItems = items.filter(item => item.effects.some(effect => effect.stat === 'affection'));
    const staminaKey = `${globalState?.currentDate}:${targetId}`;
    const affectionStage = targetActress ? Math.min(4, Math.max(0, Math.floor(targetActress.affection / 20))) : -1;
    const affectionKey = `${targetId}:stage-${affectionStage}`;
    if (staminaItems.length > 1) throw new Error('补充体力的道具每名角色每天只能使用一次，不能批量选择多个');
    if (staminaItems.length && studio?.raw.$前端状态.体力道具使用记录[staminaKey])
      throw new Error('该角色今天已经使用过补充体力的道具');
    if (affectionItems.length > 1) throw new Error('增加好感度的道具在当前好感阶段只能使用一次');
    if (affectionItems.length && (!targetActress || studio?.raw.$前端状态.好感道具使用记录[affectionKey]))
      throw new Error('该角色当前好感阶段已经使用过增加好感度的道具');

    items.forEach(item => handleUseItem(item.id, targetId));
    void updateStudioState(state => {
      if (staminaItems.length) state.$前端状态.体力道具使用记录[staminaKey] = true;
      if (affectionItems.length) state.$前端状态.好感道具使用记录[affectionKey] = true;
    });
    return `已对 ${targetActress?.name || targetActor?.name} 使用 ${items.length} 件道具。`;
  };

  // Discard inventory item
  const handleDiscardItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    void updateStudioState(state => {
      for (const group of ['消耗品', '情趣用品', '衣物', '特殊物品'] as const) {
        const target = state.背包管理[group][item.name];
        if (target) target.数量 -= 1;
      }
    });
  };

  // Deduct actor stamina after a production release
  const handleReduceStaminaAfterShoot = (castIds: string[]) => {
    void updateStudioState(state => {
      castIds.forEach(id => {
        if (id.startsWith('actress:')) {
          const target = state.女优[actressNameFromId(id)];
          if (target) {
            target.数值系统.体力值 -= Math.floor(Math.random() * 8 + 15);
            target.数值系统.快感值 = 0;
          }
        } else if (id.startsWith('actor:')) {
          const target = state.男优[actorNameFromId(id)];
          if (target) target.数值系统.体力值 -= Math.floor(Math.random() * 8 + 12);
        }
      });
    });
  };

  // Add work to listings
  const handleAddNewWork = (newWork: PastWork) => {
    void updateStudioState(state => {
      state.AV拍摄系统.过往作品[newWork.workName] = {
        评分: newWork.rating,
        评价: newWork.evaluation,
        总获利: newWork.profit,
        上映日期: state.全局状态.日期时间.当前日期,
        简介: state.AV拍摄系统.当前拍摄.作品简介,
        观众评价: [],
        男优: newWork.actors,
        女优: newWork.actresses,
        上映后天数: 0,
      };
    });
  };

  // Pass day - recovers minor stamina, resets pleasure, shifts dates
  const handleSimulateNextDay = () => {
    const datePattern = /(\d{4})年(\d{2})月(\d{2})日/;
    const match = globalState?.currentDate.match(datePattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]) + 1;
      const dateObj = new Date(year, month, day);

      const newY = dateObj.getFullYear();
      const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const newD = String(dateObj.getDate()).padStart(2, '0');

      const nextDateStr = `${newY}年${newM}月${newD}日`;

      void updateStudioState(state => {
        state.全局状态.日期时间.当前日期 = nextDateStr;
        state.全局状态.日期时间.当前时间 = '09:00';
        Object.values(state.女优).forEach(actress => {
          actress.数值系统.体力值 += 20;
          actress.数值系统.快感值 = 0;
        });
        Object.values(state.男优).forEach(actor => (actor.数值系统.体力值 += 25));
        Object.values(state.AV拍摄系统.过往作品).forEach(work => (work.上映后天数 += 1));
        enqueueMvuAction(state, '日期推进', `结束了一天的运作，日期推进至 ${nextDateStr}。演员体力恢复。`);
      });
    }
  };

  // Debt payment
  const handleRepayDebt = () => {
    if (!globalState || !studio) return;
    const repayAmount = studio.raw.全局状态.经济.欠债系统.当前阶段每次还款金额 || 100000;
    if (globalState.economy.balance < repayAmount) {
      alert('还债失败：现金余额不足 500,000 G！请尽快拍摄新作品赚取资金！');
      return;
    }

    if (globalState.economy.remainingDebt <= 0) {
      alert('所有债务已全部归还，片场已恢复完全自由运营！');
      return;
    }

    const remainingBalance = globalState.economy.balance - repayAmount;
    const confirmed = window.confirm(
      `确认偿还一期债务吗？\n\n本次还款：${repayAmount.toLocaleString()} G\n还款后余额：${remainingBalance.toLocaleString()} G`,
    );
    if (!confirmed) return;

    void updateStudioState(state => {
      const debt = state.全局状态.经济.欠债系统;
      state.全局状态.经济.现有余额 -= repayAmount;
      debt.剩余欠债总额 -= repayAmount;
      debt.总已还款次数 += 1;
      debt.当前阶段已还款次数 += 1;
      if (debt.当前阶段已还款次数 >= 4 && debt.当前所处阶段 < debt.总阶段数) {
        debt.当前所处阶段 += 1;
        debt.当前阶段已还款次数 = 0;
      }
      enqueueMvuAction(state, '还债', `偿还了高利债务一期，金额 ${repayAmount}G。`);
    });
  };

  const handleAcceptTask = (task: StudioViewState['tasks'][number], executor: string) =>
    void updateStudioState(state => {
      const source = state.任务系统[task.group][task.id];
      if (!source) return;
      delete state.任务系统[task.group][task.id];
      state.任务系统.进行中[task.id] = { ...source, 状态: '进行中', 执行者: [executor] };
      enqueueMvuAction(state, '接取任务', `由 ${executor} 接取任务【${task.title}】。`);
    });

  const handleCompleteTask = (task: StudioViewState['tasks'][number]) =>
    void updateStudioState(state => {
      const source = state.任务系统.进行中[task.id];
      if (!source) return;
      delete state.任务系统.进行中[task.id];
      state.任务系统.已完成[task.id] = { ...source, 状态: '已完成' };
      enqueueMvuAction(state, '完成任务', `完成任务【${task.title}】，奖励：${task.reward}。`);
    });

  const handleAbandonTask = (task: StudioViewState['tasks'][number]) =>
    void updateStudioState(state => {
      const source = state.任务系统.进行中[task.id];
      if (!source) return;
      delete state.任务系统.进行中[task.id];
      enqueueMvuAction(state, '放弃任务', `放弃了进行中的任务【${task.title}】。`);
    });

  if (!studio || !globalState) {
    return (
      <div className="game-window flex min-h-48 items-center justify-center p-6 text-sm text-slate-300">
        {loadError ? `MVU 载入失败：${loadError}` : '正在读取当前楼层的片场变量...'}
      </div>
    );
  }

  return (
    <div
      className={`game-window w-full overflow-x-hidden font-sans selection:bg-rose-600 selection:text-white pb-6 ${statusBarTheme === 'dark' ? 'dark bg-[#090A0F] text-slate-300' : 'bg-slate-100 text-slate-800'}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 space-y-2">
        {/* ====== COMPACT CONSOLE HEADER ====== */}
        <header
          className={`border rounded-xl p-4 shadow-lg relative overflow-hidden transition-all duration-300 ${
            statusBarTheme === 'light'
              ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-slate-200/50'
              : 'dark:bg-[#12141C] bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-700'
          }`}
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-rose-500"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Logo and Core Identity - Compact & Clean */}
            <div
              className={`space-y-0.5 md:border-r pb-2 md:pb-0 ${statusBarTheme === 'light' ? 'border-slate-200' : 'dark:border-slate-800 border-slate-200'}`}
            >
              <h1 className="text-md font-black tracking-wider bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 bg-clip-text text-transparent uppercase font-mono">
                星耀片场管理面板
              </h1>
              <p className="text-[9px] dark:text-slate-500 text-slate-500 font-mono tracking-widest uppercase">
                FILM PRODUCTION & TALENT SCHEDULER
              </p>
            </div>

            {/* Environmental values */}
            <div
              className={`grid grid-cols-1 gap-2 pb-2 md:pb-0 md:border-r md:px-4 ${statusBarTheme === 'light' ? 'border-slate-200' : 'dark:border-slate-800 border-slate-200'}`}
            >
              <div>
                <span
                  className={`text-[9px] block uppercase font-bold ${statusBarTheme === 'light' ? 'text-slate-600' : 'dark:text-slate-500 text-slate-500'}`}
                >
                  当前日期时间
                </span>
                <span
                  className={`text-xs font-bold ${statusBarTheme === 'light' ? 'text-slate-900' : 'dark:text-slate-200 text-slate-900'}`}
                >
                  {globalState.currentDate} {globalState.currentTime}
                </span>
              </div>

              <div>
                <span
                  className={`text-[9px] block uppercase font-bold ${statusBarTheme === 'light' ? 'text-slate-600' : 'dark:text-slate-500 text-slate-500'}`}
                >
                  当前所在地
                </span>
                <div
                  className={`text-xs font-bold block w-full mt-0.5 ${
                    statusBarTheme === 'light' ? 'text-rose-600 font-black' : 'text-rose-500'
                  }`}
                >
                  {globalState.location}
                </div>
              </div>
            </div>

            {/* Financial Ledger */}
            <div
              className={`pb-2 md:pb-0 md:border-r md:px-4 space-y-2 ${statusBarTheme === 'light' ? 'border-slate-200' : 'dark:border-slate-800 border-slate-200'}`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <span
                    className={`text-[9px] block uppercase font-bold ${statusBarTheme === 'light' ? 'text-slate-600' : 'dark:text-slate-500 text-slate-500'}`}
                  >
                    现有余额
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${statusBarTheme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}
                  >
                    {globalState.economy.balance.toLocaleString()} G
                  </span>
                </div>
              </div>

              <div
                className={`flex items-center justify-between border-t pt-1 ${statusBarTheme === 'light' ? 'border-slate-200' : 'dark:border-slate-800 border-slate-200/60'}`}
              >
                <div className="space-y-0.5">
                  <span
                    className={`text-[8px] block uppercase font-bold ${statusBarTheme === 'light' ? 'text-slate-600' : 'dark:text-slate-500 text-slate-500'}`}
                  >
                    剩余欠债 (还剩 {globalState.economy.remainingRepayments} 期)
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${statusBarTheme === 'light' ? 'text-rose-600' : 'text-rose-400'}`}
                  >
                    {globalState.economy.remainingDebt.toLocaleString()} G
                  </span>
                </div>
                {globalState.economy.remainingDebt > 0 && (
                  <button
                    onClick={handleRepayDebt}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      statusBarTheme === 'light'
                        ? 'bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700'
                        : 'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    偿还一期
                  </button>
                )}
              </div>
            </div>

            <div className="md:pl-1 space-y-2">
              <span
                className={`text-[9px] block uppercase font-bold ${statusBarTheme === 'light' ? 'text-slate-600' : 'dark:text-slate-500 text-slate-500'}`}
              >
                街道治安
              </span>
              <div className="space-y-2">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${security.className}`}>
                  {globalState.streetSecurity}
                </span>
                <p className="text-[10px] leading-relaxed dark:text-slate-500 text-slate-500">{security.description}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ====== UNIFIED COMPACT NAVIGATION TABS ROW (条框设计) ====== */}
        <div className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 p-1.5 rounded-xl grid grid-cols-7 gap-1">
          {[
            { id: 'shoot' as const, label: '作品管理' },
            { id: 'cast' as const, label: '演员管理' },
            { id: 'inventory' as const, label: '道具背包' },
            { id: 'shop' as const, label: '奢华商店' },
            { id: 'operations' as const, label: '经营事务' },
            { id: 'achievements' as const, label: '片场成就' },
            { id: 'settings' as const, label: '设置' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full px-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === tab.id
                  ? tab.id === 'shoot'
                    ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-rose-600 text-white shadow-lg shadow-purple-950/40 ring-1 ring-rose-400/60 scale-[1.03]'
                    : 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md'
                  : tab.id === 'shoot'
                    ? 'border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                    : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ====== RENDER MAIN ACTIVE TAB ====== */}
        <main className="pt-2">
          {activeTab === 'shoot' && (
            <ShootingTab
              globalState={globalState}
              actresses={actresses}
              actors={actors}
              pastWorks={pastWorks}
              initialScripts={studio.scripts}
              initialScriptLibrary={studio.scriptLibrary}
              initialPrivateCommissions={studio.privateCommissions}
              initialWorkReviews={initialWorkReviews}
              onSaveScripts={saveScripts}
              onSaveScriptLibrary={saveScriptLibrary}
              onSavePrivateCommissions={savePrivateCommissions}
              onSaveWorkReviews={(work, reviews) =>
                void updateStudioState(state => {
                  const target = state.AV拍摄系统.过往作品[work.workName];
                  if (target) {
                    target.观众评价 = reviews.map(review => `${review.username}｜${review.rating}｜${review.content}`);
                  }
                })
              }
              activeProject={activeProject}
              onUpdateActiveProject={setActiveProject}
              onAddNewWork={handleAddNewWork}
              onUpdateGlobalState={setGlobalState}
              onReduceStamina={handleReduceStaminaAfterShoot}
              onTriggerStatsUpdate={handleTriggerStatsUpdate}
              onLogAction={logAction}
            />
          )}

          {activeTab === 'cast' && (
            <CastManagementTab
              actresses={actresses}
              actors={actors}
              onUpdateActressStageName={updateActressStageName}
              onUpdateActorStageName={updateActorStageName}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              actresses={actresses}
              actors={actors}
              onUseItems={handleUseItems}
              onDiscardItem={handleDiscardItem}
              onLogAction={logAction}
            />
          )}

          {activeTab === 'shop' && (
            <ShopTab
              globalState={globalState}
              shopItems={studio.shopItems}
              onPurchaseItem={handlePurchaseItem}
              onUndoPurchaseItem={handleUndoPurchaseItem}
              onLogAction={logAction}
              onRemoveAction={removeAction}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              statusBarTheme={statusBarTheme}
              onSetStatusBarTheme={setStatusBarTheme}
              settings={settings}
              onSettingsChange={setSettings}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsTab
              tasks={studio.tasks}
              availableExecutors={actresses
                .filter(actress => actress.isSigned && actress.realtime.isPresent)
                .map(actress => actress.name)}
              onAcceptTask={handleAcceptTask}
              onCompleteTask={handleCompleteTask}
              onAbandonTask={handleAbandonTask}
            />
          )}

          {activeTab === 'achievements' && <AchievementsTab achievements={studio.achievements} />}
        </main>

        {/* ====== STUDIO ACTION BRIEFING ====== */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
          {isLogPanelOpen && (
            <div className="w-80 h-96 dark:bg-[#12141C] bg-white border-2 border-purple-500 rounded-xl p-4 shadow-2xl mb-2 flex flex-col pointer-events-auto">
              <h3 className="text-sm font-bold text-purple-400 mb-2 flex justify-between items-center">
                <span>片场行动简报</span>
                <button
                  onClick={() => setIsLogPanelOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer text-xs"
                >
                  关闭
                </button>
              </h3>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                仅暂存会影响剧情的片场行动；下次发送消息时会自动附在正文末尾，发送成功后清空。
              </p>

              <textarea
                id="sillytavern-action-logs"
                readOnly
                value={
                  actionLogs.length > 0
                    ? actionLogs
                        .map(
                          action =>
                            `[${new Date(action.createdAt).toLocaleTimeString('zh-CN', { hour12: false })}] ${action.text}`,
                        )
                        .join('\n')
                    : '暂无待发送的片场行动...'
                }
                className="flex-1 w-full dark:bg-[#0E1016] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded p-2 text-xs font-mono dark:text-slate-300 text-slate-700 resize-none outline-none mb-3"
              />

              <div className="flex justify-end">
                <button
                  onClick={() =>
                    void updateStudioState(state => {
                      state.操作队列 = [];
                    })
                  }
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded transition-colors cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsLogPanelOpen(!isLogPanelOpen)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer pointer-events-auto"
          >
            <span>行动简报 ({actionLogs.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
