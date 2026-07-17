import React, { useEffect, useState } from 'react';
import {
  Actress,
  Actor,
  PredefinedScript,
  PastWork,
  ActiveShoot,
  getScriptLevelForReputation,
  GlobalState,
  SCRIPT_LEVEL_WEIGHT,
} from '../types';
import { Video, Star, Award, Calendar, Coins, Flame } from 'lucide-react';
import {
  evaluateCustomScript,
  generateContextScript,
  generatePredefinedScripts,
  generatePrivateCommissions,
  generateWorkReviews,
  ScriptApiContext,
  WorkReview,
} from '../requestHandler';

const USER_ACTOR_ID = '__user_actor__';
const USER_ACTOR_MACRO = '{{user}}';
const getUserActorName = () => {
  try {
    return substitudeMacros(USER_ACTOR_MACRO) || USER_ACTOR_MACRO;
  } catch {
    return USER_ACTOR_MACRO;
  }
};

const getCommentsForWork = (work: PastWork) => {
  const score = Math.round(work.rating);
  return [
    { username: '一叶知秋', content: '片场对镜头节奏的掌握很稳，演员之间的配合自然。', rating: score },
    {
      username: '深夜放映室',
      content: '摄影和布景比预期精致，几个关键场面的情绪递进很有说服力。',
      rating: Math.min(10, score + 1),
    },
    {
      username: '胶片收藏家',
      content: '商业完成度不错，剪辑干净，但中段还可以再紧凑一些。',
      rating: Math.max(1, score - 1),
    },
    {
      username: '午夜场常客',
      content: `看得出《${work.workName}》在演员选择上花了心思。`,
      rating: score,
    },
    { username: '匿名试映员', content: '整体值得一看，表演状态在线，希望下一部能把人物关系挖得更深。', rating: score },
    {
      username: '片尾不离席',
      content: '美术风格和音乐氛围加分，结尾收束得比开场更漂亮。',
      rating: Math.min(10, score + 1),
    },
  ];
};

interface ActiveProjectState {
  isActive: boolean;
  workName: string;
  description: string;
  selectedActresses: string[];
  selectedActors: string[];
  progress: number;
  scriptId: string;
  stepLogs: string[];
}

interface ShootingTabProps {
  globalState: GlobalState;
  actresses: Actress[];
  actors: Actor[];
  pastWorks: PastWork[];
  initialScripts: PredefinedScript[];
  initialScriptLibrary: PredefinedScript[];
  initialPrivateCommissions: PredefinedScript[];
  initialWorkReviews: Record<string, WorkReview[]>;
  onSaveScripts: (scripts: PredefinedScript[]) => void;
  onSaveScriptLibrary: (scripts: PredefinedScript[]) => void;
  onSavePrivateCommissions: (scripts: PredefinedScript[]) => void;
  onSaveWorkReviews: (work: PastWork, reviews: WorkReview[]) => void;
  activeProject: ActiveProjectState;
  onUpdateActiveProject: (proj: ActiveProjectState) => void;
  onAddNewWork: (work: PastWork) => void;
  onUpdateGlobalState: (updated: GlobalState) => void;
  onReduceStamina: (castIds: string[]) => void;
  onTriggerStatsUpdate: (
    castIds: string[],
    stats: {
      staminaChange: number;
      pleasureChange: number;
      affectionChange: number;
      corruptionChange: number;
      thought: string;
    },
  ) => void;
  onLogAction: (msg: string) => void;
}

export default function ShootingTab({
  globalState,
  actresses,
  actors,
  pastWorks,
  initialScripts,
  initialScriptLibrary,
  initialPrivateCommissions,
  initialWorkReviews,
  onSaveScripts,
  onSaveScriptLibrary,
  onSavePrivateCommissions,
  onSaveWorkReviews,
  activeProject,
  onUpdateActiveProject,
  onAddNewWork,
  onUpdateGlobalState,
  onReduceStamina,
  onTriggerStatsUpdate,
  onLogAction,
}: ShootingTabProps) {
  // Local drafts (used when activeProject.isActive is false)
  const [draftName, setDraftName] = useState<string>('放学后钢琴室的初夏物语');
  const [draftDesc, setDraftDesc] = useState<string>(
    '在傍晚的钢琴教室中，琴键声伴随着局促不安的呼吸，展开了一段令人脸红心跳的青春物语...',
  );
  const [draftActresses, setDraftActresses] = useState<string[]>([actresses.filter(a => a.isSigned)[0]?.id || '']);
  const [draftActors, setDraftActors] = useState<string[]>([actors[0]?.id || '']);

  const getActressFee = (actress: Actress) => actress.appearanceFee ?? Math.round(15000 + actress.skill * 900);
  const getActorFee = (actor: Actor) => actor.appearanceFee ?? Math.round(10000 + actor.skill * 900);
  const selectedAppearanceFee =
    actresses
      .filter(actress => draftActresses.includes(actress.id))
      .reduce((sum, actress) => sum + getActressFee(actress), 0) +
    actors.filter(actor => draftActors.includes(actor.id)).reduce((sum, actor) => sum + getActorFee(actor), 0);

  const [isPastWorksCollapsed, setIsPastWorksCollapsed] = useState<boolean>(false);
  const [selectedWorkIdForReviews, setSelectedWorkIdForReviews] = useState<string | null>(null);
  const [managementView, setManagementView] = useState<'current' | 'planning' | 'archive'>('current');
  const [workReviews, setWorkReviews] = useState<Record<string, WorkReview[]>>(initialWorkReviews);
  const [refreshingWorkId, setRefreshingWorkId] = useState<string | null>(null);

  const handleRefreshReviews = async (work: PastWork) => {
    setRefreshingWorkId(work.id);
    try {
      const reviews = await generateWorkReviews(work);
      setWorkReviews(previous => ({ ...previous, [work.id]: reviews }));
      onSaveWorkReviews(work, reviews);
    } catch (error) {
      alert(`评论区刷新失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRefreshingWorkId(null);
    }
  };

  const getDisplayedWorkRating = (work: PastWork) => {
    const reviews = workReviews[work.id];
    if (!reviews?.length) return work.rating;
    return Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
  };

  const [availableScripts, setAvailableScripts] = useState<PredefinedScript[]>(initialScripts);
  const [privateCommissions, setPrivateCommissions] = useState<PredefinedScript[]>(initialPrivateCommissions);
  const [scriptSourceTab, setScriptSourceTab] = useState<'scripts' | 'commissions'>('scripts');
  const [isRefreshingScripts, setIsRefreshingScripts] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isEvaluatingScript, setIsEvaluatingScript] = useState(false);
  const normalizedReputation = Math.min(1000, Math.max(0, Math.floor(globalState.reputation)));
  const reputationRange = { min: 0, max: normalizedReputation };
  const currentScriptLevel = getScriptLevelForReputation(normalizedReputation);
  const [scriptLibrary, setScriptLibrary] = useState<PredefinedScript[]>(initialScriptLibrary);
  const [draftEvaluation, setDraftEvaluation] = useState<PredefinedScript | null>(null);
  const [draftScriptId, setDraftScriptId] = useState<string>('');
  const getProjectedReward = (script: PredefinedScript) => script.estimatedReward ?? script.baseQuality * 1500;
  const getFinalRewardEstimate = (script: PredefinedScript) => {
    const selectedActresses = actresses.filter(item => draftActresses.includes(item.id));
    const actressAverage = selectedActresses.reduce((sum, item) => sum + item.skill, 0) / Math.max(1, selectedActresses.length);
    const selectedActors = actors.filter(item => draftActors.includes(item.id));
    const actorExperienceTotal = selectedActors.reduce((sum, item) => sum + item.skill, 0) + (draftActors.includes(USER_ACTOR_ID) ? 50 : 0);
    const actorAverage = actorExperienceTotal / Math.max(1, selectedActors.length + (draftActors.includes(USER_ACTOR_ID) ? 1 : 0));
    return Math.round(30000 + SCRIPT_LEVEL_WEIGHT[script.level] * 40000 + actressAverage * 450 + actorAverage * 350);
  };
  const selectedScriptForProjection = [...availableScripts, ...privateCommissions, ...scriptLibrary].find(
    script => script.id === draftScriptId,
  );
  const projectedIncome = selectedScriptForProjection ? getFinalRewardEstimate(selectedScriptForProjection) : 0;

  useEffect(() => setAvailableScripts(initialScripts), [initialScripts]);
  useEffect(() => setScriptLibrary(initialScriptLibrary), [initialScriptLibrary]);
  useEffect(() => setPrivateCommissions(initialPrivateCommissions), [initialPrivateCommissions]);
  useEffect(() => setWorkReviews(initialWorkReviews), [initialWorkReviews]);

  const buildScriptContext = (): ScriptApiContext => ({
    currentDate: globalState.currentDate,
    location: globalState.location,
    reputation: normalizedReputation,
    actresses: actresses
      .filter(actress => actress.isSigned && actress.realtime.isPresent)
      .map(actress => ({
        name: actress.name,
        skill: actress.skill,
        stamina: actress.stamina,
      })),
    actors: [
      { name: getUserActorName(), skill: 50, stamina: 100 },
      ...actors.map(actor => ({
        name: actor.stageName,
        skill: actor.skill,
        stamina: actor.stamina,
      })),
    ],
    recentWorks: pastWorks.slice(-5).map(work => ({ title: work.workName, rating: work.rating })),
  });

  const saveScriptLibrary = (scripts: PredefinedScript[]) => {
    setScriptLibrary(scripts);
    onSaveScriptLibrary(scripts);
  };

  const addToScriptLibrary = (script: PredefinedScript) => {
    const stored = { ...script, source: 'library' as const };
    saveScriptLibrary([stored, ...scriptLibrary.filter(item => item.id !== script.id && item.title !== script.title)]);
  };

  const handleRefreshScripts = async () => {
    setIsRefreshingScripts(true);
    try {
      const scripts = await generatePredefinedScripts(buildScriptContext(), reputationRange);
      setAvailableScripts(scripts);
      onSaveScripts(scripts);
    } catch (error) {
      alert(error instanceof Error ? error.message : '现成剧本刷新失败');
    } finally {
      setIsRefreshingScripts(false);
    }
  };

  const handleRefreshPrivateCommissions = async () => {
    setIsRefreshingScripts(true);
    try {
      const commissions = await generatePrivateCommissions(buildScriptContext(), reputationRange);
      setPrivateCommissions(commissions);
      onSavePrivateCommissions(commissions);
    } catch (error) {
      alert(error instanceof Error ? error.message : '私人委托刷新失败');
    } finally {
      setIsRefreshingScripts(false);
    }
  };

  const applyScriptToDraft = (script: PredefinedScript) => {
    if (script.source === 'private') {
      setPrivateCommissions(previous => {
        const next = previous.some(item => item.id === script.id) ? previous : [script, ...previous];
        onSavePrivateCommissions(next);
        return next;
      });
    } else {
      setAvailableScripts(previous => {
        const next = previous.some(item => item.id === script.id) ? previous : [script, ...previous];
        onSaveScripts(next);
        return next;
      });
    }
    setDraftScriptId(script.id);
    setDraftName(script.title);
    setDraftDesc(script.description);
    setDraftEvaluation(script);
  };

  const handleGenerateContextScript = async () => {
    setIsGeneratingScript(true);
    try {
      applyScriptToDraft(await generateContextScript(buildScriptContext()));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'AI 剧本生成失败');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleEvaluateCustomScript = async () => {
    if (!draftName.trim() || !draftDesc.trim()) {
      alert('请先填写作品名称和企划简介。');
      return;
    }
    setIsEvaluatingScript(true);
    try {
      applyScriptToDraft(
        await evaluateCustomScript({ title: draftName, description: draftDesc }, buildScriptContext()),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : '自拟剧本评估失败');
    } finally {
      setIsEvaluatingScript(false);
    }
  };

  // Popup feedback on release
  const [shootLog, setShootLog] = useState<{ rating: number; profit: number; text: string } | null>(null);

  const toggleActress = (id: string) => {
    setDraftActresses(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleActor = (id: string) => {
    setDraftActors(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectScript = (script: PredefinedScript) => {
    applyScriptToDraft(script);
  };

  // Launch new filming project
  const handleLaunchProject = () => {
    if (draftActresses.length === 0) {
      alert('本片至少需要选择一名女演员参演！');
      return;
    }
    if (draftActors.length === 0) {
      alert('本片至少需要选择一名协演男优协助拍摄！');
      return;
    }
    if (!draftName.trim()) {
      alert('请填写企划作品名称！');
      return;
    }

    const selectedScript = [...availableScripts, ...privateCommissions, ...scriptLibrary].find(script => script.id === draftScriptId);
    if (selectedScript && globalState.reputation < (selectedScript.requiredReputation ?? 0)) {
      alert(`当前知名度不足，需要 ${selectedScript.requiredReputation}。`);
      return;
    }
    if (selectedScript && draftActresses.length < selectedScript.requiredActressesCount) {
      alert(`该剧本至少需要 ${selectedScript.requiredActressesCount} 名女优。`);
      return;
    }
    if (selectedScript && draftActors.length < selectedScript.requiredActorsCount) {
      alert(`该剧本至少需要 ${selectedScript.requiredActorsCount} 名男优。`);
      return;
    }

    const castActresses = actresses.filter(a => draftActresses.includes(a.id));
    const castActors = actors.filter(a => draftActors.includes(a.id));

    // Check stamina before shooting
    const hasFatiguedActress = castActresses.some(a => a.stamina < 20);
    if (hasFatiguedActress) {
      alert('部分参演女演员体力过低（低于20%），请先通过背包道具恢复体力或度过一天！');
      return;
    }

    if (globalState.economy.balance < selectedAppearanceFee) {
      alert(`片场余额不足以支付演员片酬。本次需要 ${selectedAppearanceFee.toLocaleString()} G。`);
      return;
    }

    onUpdateGlobalState({
      ...globalState,
      economy: {
        ...globalState.economy,
        balance: globalState.economy.balance - selectedAppearanceFee,
      },
    });

    onUpdateActiveProject({
      isActive: true,
      workName: draftName,
      description: draftDesc,
      selectedActresses: draftActresses,
      selectedActors: draftActors,
      progress: 0,
      scriptId: draftScriptId,
      stepLogs: [
        `企划正式启动：成功开启新片企划拍摄：《${draftName}》，导演组与演职人员开始在 [${globalState.location}] 组装布景。`,
      ],
    });

    onLogAction(`启动拍摄企划：《${draftName}》，支付演员片酬 ${selectedAppearanceFee}G。`);
  };

  const [isEnding, setIsEnding] = useState(false);

  // End shooting and call second API
  const handleEndShooting = () => {
    if (!activeProject.isActive) return;

    setIsEnding(true);

    // Simulate 2nd API call to get completion rate
    setTimeout(() => {
      setIsEnding(false);

      const completionRate = Math.floor(Math.random() * 51) + 50;

      const castActresses = actresses.filter(a => activeProject.selectedActresses.includes(a.id));
      const castActors = actors.filter(a => activeProject.selectedActors.includes(a.id));

      const avgSkill = castActresses.reduce((sum, a) => sum + a.skill, 0) / Math.max(1, castActresses.length);
      const selectedScript = [...availableScripts, ...privateCommissions, ...scriptLibrary].find(
        script => script.id === activeProject.scriptId,
      );
      const baseScriptQuality = selectedScript?.baseQuality || 70;
      const scriptLevel = selectedScript?.level || 'D';
      const actorExperienceTotal =
        castActors.reduce((sum, actor) => sum + actor.skill, 0) +
        (activeProject.selectedActors.includes(USER_ACTOR_ID) ? 50 : 0);
      const actorCount = castActors.length + (activeProject.selectedActors.includes(USER_ACTOR_ID) ? 1 : 0);
      const avgActorSkill = actorExperienceTotal / Math.max(1, actorCount);

      // Rating calculation
      let calculatedRating = baseScriptQuality / 10 + avgSkill / 20 + 1.5;
      calculatedRating = calculatedRating * (completionRate / 100);
      calculatedRating = Math.min(10.0, Math.max(2.0, parseFloat(calculatedRating.toFixed(1))));

      // Calculate revenue
      const profit = Math.round(
        30000 + SCRIPT_LEVEL_WEIGHT[scriptLevel] * 40000 + avgSkill * 450 + avgActorSkill * 350,
      );

      const actressJoinedNames = castActresses.map(a => a.name).join('、');
      const actorJoinedNames = [
        ...castActors.map(a => a.stageName),
        ...(activeProject.selectedActors.includes(USER_ACTOR_ID) ? [getUserActorName()] : []),
      ].join('、');

      const evaluationTexts = [
        `这部由新锐导演执导的《${activeProject.workName}》完成了约 ${completionRate}% 的进度便杀青发售。`,
        `参演女演员 ${actressJoinedNames} 与协演男优 ${actorJoinedNames} 的镜头默契度极高，呈现出了稳定的拍摄完成度。`,
        calculatedRating >= 8.0
          ? `特别是在演员神情彻底娇喘沦陷的时刻，展现了无可挑剔的顶级开发品质，票房表现毫无悬念地席卷销量榜前列！`
          : `虽然某些场景在镜头推进上稍微有些生涩，但其整体释放的肉欲张力依然牢牢吸引了大批影迷，市场反响热烈。`,
      ];
      const evaluation = evaluationTexts.join(' ');

      const newWork: PastWork = {
        id: `work_new_${Date.now()}`,
        workName: activeProject.workName,
        actors: [
          ...castActors.map(a => a.stageName),
          ...(activeProject.selectedActors.includes(USER_ACTOR_ID) ? [getUserActorName()] : []),
        ],
        actresses: castActresses.map(a => a.name),
        rating: calculatedRating,
        profit: profit,
        evaluation: evaluation,
        releaseDay: 8,
        isProfitWindowActive: true,
        daysSinceRelease: 0,
      };

      // Apply debt repayments or balance increases
      onAddNewWork(newWork);
      onReduceStamina([
        ...activeProject.selectedActresses,
        ...activeProject.selectedActors.filter(id => id !== USER_ACTOR_ID),
      ]);

      onUpdateGlobalState({
        ...globalState,
        economy: {
          ...globalState.economy,
          balance: globalState.economy.balance + profit,
        },
      });

      setShootLog({
        rating: calculatedRating,
        profit: profit,
        text: `新片《${activeProject.workName}》杀青发售！制片厂评定完成度为: ${completionRate}%。影迷平均评分：${calculatedRating} 星 / 10。共盈利：+${profit.toLocaleString()} G！`,
      });

      // Reset active project state
      onUpdateActiveProject({
        isActive: false,
        workName: '',
        description: '',
        selectedActresses: [],
        selectedActors: [],
        progress: 0,
        scriptId: '',
        stepLogs: [],
      });

      onLogAction(`结束拍摄，进行最终评定：完成度 ${completionRate}%, 评分: ${calculatedRating}, 盈利: +${profit}G`);
    }, 1500);
  };

  const actNamesStr = (ids: string[]) =>
    actresses
      .filter(a => ids.includes(a.id))
      .map(a => a.name)
      .join('、');
  const actrNamesStr = (ids: string[]) =>
    actors
      .filter(a => ids.includes(a.id))
      .map(a => a.stageName)
      .join('、');

  return (
    <div id="shooting-tab" className="space-y-4">
      {/* Release Popup Report */}
      {shootLog && (
        <div className="dark:bg-[#12141C] bg-slate-50 border-2 border-rose-500 rounded-xl p-5 shadow-2xl animate-in zoom-in-95 duration-300 space-y-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <Award className="w-5 h-5" />
            <span>发售结算报告：作品成功上市发售</span>
          </div>
          <p className="text-xs dark:text-slate-200 text-slate-900 leading-relaxed font-sans">{shootLog.text}</p>
          <div className="grid grid-cols-2 gap-4 dark:bg-slate-950/40 bg-slate-100 p-3 rounded-lg text-center font-mono text-xs">
            <div>
              <span className="text-[10px] dark:text-slate-500 text-slate-500 block">票房纯利</span>
              <span className="text-sm font-bold text-emerald-400">+{shootLog.profit.toLocaleString()} G</span>
            </div>
            <div>
              <span className="text-[10px] dark:text-slate-500 text-slate-500 block">影迷评分</span>
              <span className="text-sm font-bold text-rose-500">{shootLog.rating} 星 / 10</span>
            </div>
          </div>
          <button
            onClick={() => setShootLog(null)}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
          >
            确认并继续筹备下一部
          </button>
        </div>
      )}

      <nav className="grid grid-cols-3 gap-1 rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-[#12141C] bg-white p-1.5">
        {[
          { id: 'planning' as const, label: '新片企划拍摄筹备' },
          { id: 'current' as const, label: '当前拍摄进度' },
          { id: 'archive' as const, label: '作品档案' },
        ].map(view => (
          <button
            key={view.id}
            type="button"
            onClick={() => setManagementView(view.id)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              managementView === view.id
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white'
                : 'dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 hover:text-slate-900 cursor-pointer'
            }`}
          >
            {view.label}
          </button>
        ))}
      </nav>

      {managementView !== 'archive' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Formulation or active screen */}
          {(managementView === 'current' || managementView === 'planning') && (
            <div className={`${managementView === 'planning' ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4`}>
              {managementView === 'current' ? (
                /* Current Active Filming Dashboard - Clean & tightly packed */
                <div className="dark:bg-[#12141C] bg-slate-50 border border-rose-950/50 rounded-xl p-5 space-y-4">
                  <div className="border-b dark:border-slate-800 border-slate-200 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-400 font-mono font-bold tracking-widest block uppercase">
                        ACTIVE SHOOTING RUNNING
                      </span>
                      <h3 className="text-md font-bold dark:text-slate-100 text-slate-900 mt-0.5">
                        {activeProject.isActive
                          ? `正在拍摄项目：《${activeProject.workName}》`
                          : '当前没有正在拍摄的作品'}
                      </h3>
                    </div>
                    <span className="text-xs bg-rose-950 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      {activeProject.isActive ? '制作中' : '空闲'}
                    </span>
                  </div>

                  {activeProject.isActive ? (
                    <div className="text-xs dark:text-slate-300 text-slate-700 space-y-2 dark:bg-slate-950/40 bg-slate-100 p-3.5 rounded-lg border dark:border-slate-800 border-slate-200/40 leading-relaxed">
                      <div>
                        演职人员:{' '}
                        <span className="dark:text-slate-200 text-slate-900">
                          女演员 ( {actNamesStr(activeProject.selectedActresses)} ) / 协演男优 ({' '}
                          {actrNamesStr(activeProject.selectedActors)} )
                        </span>
                      </div>
                      <div>
                        剧本设定:{' '}
                        <span className="dark:text-slate-400 text-slate-600">{activeProject.description}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-slate-950/40 bg-slate-100 p-5 text-center text-xs dark:text-slate-500 text-slate-500">
                      摄制组当前处于待命状态。前往“新片企划拍摄筹备”建立下一部作品。
                    </div>
                  )}

                  {activeProject.isActive && (
                    <div className="space-y-2 rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-[#0E1016] bg-white p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold dark:text-slate-400 text-slate-600">当前拍摄进度</span>
                        <span className="font-mono font-bold text-rose-400">{activeProject.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full dark:bg-slate-800 bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-500 transition-all"
                          style={{ width: `${activeProject.progress}%` }}
                        />
                      </div>
                      <div className="space-y-1 text-[10px] dark:text-slate-500 text-slate-500">
                        {activeProject.stepLogs
                          .slice()
                          .reverse()
                          .map((log, index) => (
                            <p key={index}>▶ {log}</p>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Progress and controller steps */}
                  {activeProject.isActive && (
                    <div className="pt-2 space-y-4">
                      <button
                        onClick={handleEndShooting}
                        disabled={isEnding}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs rounded-lg transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEnding ? '制片厂评定完成度中...' : '结束拍摄'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Planning Screen */
                <fieldset
                  disabled={activeProject.isActive}
                  className={`dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 space-y-4 ${activeProject.isActive ? 'opacity-55' : ''}`}
                >
                  <div className="border-b dark:border-slate-800 border-slate-200 pb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold dark:text-slate-200 text-slate-900 flex items-center gap-1.5">
                      新片企划拍摄筹备
                    </h3>
                    <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono tracking-widest uppercase">
                      筹备中心
                    </span>
                  </div>

                  {activeProject.isActive && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300">
                      当前作品正在拍摄，筹备项目已锁定。杀青并完成结算后即可再次操作。
                    </div>
                  )}

                  <div className="space-y-3.5">
                    {/* Work Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold dark:text-slate-400 text-slate-600">作品名称</label>
                      <input
                        type="text"
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        className="w-full text-xs dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 rounded-lg p-2 text-rose-300 font-bold focus:border-rose-500 focus:outline-none"
                        placeholder="请输入企划影片名称..."
                      />
                    </div>

                    {/* Work Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold dark:text-slate-400 text-slate-600">企划简介</label>
                      <textarea
                        value={draftDesc}
                        onChange={e => setDraftDesc(e.target.value)}
                        rows={2}
                        className="w-full text-xs dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 rounded-lg p-2 dark:text-slate-300 text-slate-700 leading-relaxed focus:border-rose-500 focus:outline-none font-sans"
                        placeholder="描述新企划的故事背景、核心卖点和服化道细节..."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleEvaluateCustomScript}
                        disabled={isEvaluatingScript || isGeneratingScript}
                        className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300 disabled:opacity-50 cursor-pointer"
                      >
                        {isEvaluatingScript ? '正在评估...' : '评估自拟剧本'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateContextScript}
                        disabled={isGeneratingScript || isEvaluatingScript}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 disabled:opacity-50 cursor-pointer"
                      >
                        {isGeneratingScript ? '正在构思...' : '根据片场与在场演员生成'}
                      </button>
                    </div>

                    <p className="text-[10px] leading-relaxed dark:text-slate-500 text-slate-500">
                      现成剧本并非必选。自行填写后可交由创意顾问评估标签、报酬与拍摄要求，也可直接生成一份适配当前片场的企划。
                    </p>

                    {draftEvaluation && (
                      <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-[10px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-emerald-300">剧本评估结果</span>
                          <button
                            type="button"
                            onClick={() => addToScriptLibrary(draftEvaluation)}
                            className="rounded border border-emerald-500/30 px-2 py-1 text-emerald-300 cursor-pointer"
                          >
                            收藏到剧本库
                          </button>
                        </div>
                        <p className="dark:text-slate-400 text-slate-600">
                          知名度要求 {draftEvaluation.requiredReputation ?? 0} · 预计报酬 +
                          {(draftEvaluation.estimatedReward ?? draftEvaluation.baseQuality * 1500).toLocaleString()} G
                        </p>
                        <p className="dark:text-slate-400 text-slate-600">
                          拍摄要求：{draftEvaluation.shootingRequirements?.join('；') || '常规片场条件'}
                        </p>
                      </div>
                    )}

                    {/* Cast selections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold dark:text-slate-400 text-slate-600 flex justify-between">
                          <span>参演女优</span>
                        </label>
                        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                          {actresses.filter(act => act.isSigned).map(act => (
                            <label key={act.id} className="flex cursor-pointer items-center justify-between gap-2 text-[10px] dark:text-slate-300">
                              <span className="flex items-center gap-1.5"><input type="checkbox" checked={draftActresses.includes(act.id)} onChange={() => toggleActress(act.id)} />{act.name}</span>
                              <span className="text-slate-500">经验 {act.skill} / {getActressFee(act).toLocaleString()} G</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold dark:text-slate-400 text-slate-600 flex justify-between">
                          <span>参演男优</span>
                        </label>
                        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                          <label className="flex cursor-pointer items-center justify-between gap-2 text-[10px] dark:text-slate-300"><span className="flex items-center gap-1.5"><input type="checkbox" checked={draftActors.includes(USER_ACTOR_ID)} onChange={() => toggleActor(USER_ACTOR_ID)} />{getUserActorName()}</span><span className="text-slate-500">经验 50 / 0 G</span></label>
                          {actors.map(ac => (
                            <label key={ac.id} className="flex cursor-pointer items-center justify-between gap-2 text-[10px] dark:text-slate-300">
                              <span className="flex items-center gap-1.5"><input type="checkbox" checked={draftActors.includes(ac.id)} onChange={() => toggleActor(ac.id)} />{ac.stageName}</span>
                              <span className="text-slate-500">经验 {ac.skill} / {getActorFee(ac).toLocaleString()} G</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-[#0E1016] bg-white px-3 py-2 text-xs">
                      <span className="dark:text-slate-400 text-slate-600">本次演员片酬</span>
                      <span className="font-mono font-bold text-amber-400">
                        -{selectedAppearanceFee.toLocaleString()} G
                      </span>
                    </div>

                    {selectedScriptForProjection && (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">预计收入</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{projectedIncome.toLocaleString()} G
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleLaunchProject}
                      disabled={activeProject.isActive}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:opacity-95 border border-rose-500 rounded-xl text-white font-bold text-xs tracking-wider shadow-lg active:scale-98 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                      立项并启动拍摄企划
                    </button>
                  </div>
                </fieldset>
              )}
            </div>
          )}

          {managementView === 'current' && (
            <aside className="space-y-4">
              <div className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold dark:text-slate-400 text-slate-600 border-b dark:border-slate-800 border-slate-200 pb-2">
                  发行作品概览
                </h4>
                {pastWorks.length === 0 ? (
                  <p className="text-xs dark:text-slate-500 text-slate-500">暂无发行记录，完成首部作品后将在此汇总。</p>
                ) : (
                  <div className="space-y-2">
                    {pastWorks.slice(-4).map(work => (
                      <div
                        key={work.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-[#0E1016]"
                      >
                        <span className="font-bold text-rose-400">《{work.workName}》</span>
                        <span className="font-mono text-amber-400">{getDisplayedWorkRating(work).toFixed(1)} 分</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* 剧本选择已并入新片筹备，拍摄中整体锁定 */}
          {managementView === 'planning' && (
            <fieldset
              disabled={activeProject.isActive}
              className={`lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4 ${activeProject.isActive ? 'opacity-55' : ''}`}
            >
              {/* Presets - no emojis, Expected Earnings instead of Lv */}
              <div className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="flex items-center justify-between text-xs font-bold dark:text-slate-400 text-slate-600 font-mono tracking-wider uppercase border-b dark:border-slate-800 border-slate-200 pb-1.5">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => setScriptSourceTab('scripts')} className={scriptSourceTab === 'scripts' ? 'text-rose-400' : ''}>可选现成剧本</button>
                    <span>/</span>
                    <button type="button" onClick={() => setScriptSourceTab('commissions')} className={scriptSourceTab === 'commissions' ? 'text-rose-400' : ''}>私人委托</button>
                  </span>
                  <button
                    type="button"
                    onClick={scriptSourceTab === 'scripts' ? handleRefreshScripts : handleRefreshPrivateCommissions}
                    disabled={isRefreshingScripts || activeProject.isActive}
                    className="rounded bg-purple-600 px-2 py-1 text-[10px] text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isRefreshingScripts ? '刷新中...' : scriptSourceTab === 'scripts' ? '刷新剧本' : '刷新委托'}
                  </button>
                </h4>
                <div className="grid grid-cols-2 gap-2 rounded-lg border dark:border-slate-800 border-slate-200 p-2">
                  <div className="rounded-md bg-slate-100 p-2 dark:bg-[#0E1016]">
                    <span className="block text-[9px] text-slate-500">当前知名度</span>
                    <strong className="font-mono text-sm text-rose-400">{normalizedReputation} / 1000</strong>
                  </div>
                  <div className="rounded-md bg-slate-100 p-2 dark:bg-[#0E1016]">
                    <span className="block text-[9px] text-slate-500">当前最高剧本等级</span>
                    <strong className="font-mono text-sm text-amber-400">{currentScriptLevel} 级</strong>
                  </div>
                  <p className="col-span-2 text-[9px] leading-relaxed dark:text-slate-500 text-slate-500">
                    刷新只会匹配知名度 0–{normalizedReputation} 范围内可接取的剧本：D 0–199、C 200–399、B 400–599、A 600–799、S 800–1000。
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftScriptId('');
                      setDraftEvaluation(null);
                    }}
                    className={`w-full rounded-lg border p-2.5 text-left text-xs cursor-pointer ${
                      !draftScriptId
                        ? 'border-rose-500/60 bg-rose-950/20 text-rose-300'
                        : 'dark:border-slate-800 border-slate-200 dark:bg-[#0E1016] bg-white dark:text-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="font-bold">不选择现成剧本 · 自行编制</span>
                    <span className="mt-1 block text-[9px] dark:text-slate-500 text-slate-500">
                      保留上方填写内容，不受现成剧本限制。
                    </span>
                  </button>
                  {(scriptSourceTab === 'scripts' ? availableScripts : privateCommissions)
                    .filter(script => {
                      const required = script.requiredReputation ?? 0;
                      return required >= reputationRange.min && required <= reputationRange.max;
                    })
                    .map(script => {
                      const isLocked = globalState.reputation < (script.requiredReputation ?? 0);
                      return (
                        <div
                          key={script.id}
                          onClick={() => !activeProject.isActive && !isLocked && handleSelectScript(script)}
                          className={`p-2.5 rounded-lg border transition-all duration-200 text-left space-y-1 ${
                            activeProject.isActive || isLocked
                              ? 'opacity-40 cursor-not-allowed'
                              : draftScriptId === script.id
                                ? 'bg-rose-950/20 border-rose-500/60 shadow-md'
                                : 'dark:bg-[#0E1016] bg-white dark:border-slate-800 border-slate-200 hover:dark:border-slate-700 border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-xs font-bold dark:text-slate-200 text-slate-900 truncate">
                              {script.title}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold flex-shrink-0">
                              +{getProjectedReward(script).toLocaleString()} G
                            </span>
                          </div>
                          <p className="text-[10px] dark:text-slate-400 text-slate-600 leading-relaxed truncate font-sans">
                            {script.description}
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-1 text-[9px] dark:text-slate-500 text-slate-500">
                            <span className={isLocked ? 'font-bold text-amber-400' : ''}>
                              知名度要求 {script.requiredReputation ?? 0}
                            </span>
                            <span className="font-bold text-amber-400">{script.level} 级</span>
                            <button
                              type="button"
                              onClick={event => {
                                event.stopPropagation();
                                addToScriptLibrary(script);
                              }}
                              className="rounded border dark:border-slate-700 border-slate-300 px-1.5 py-0.5 hover:text-rose-300 cursor-pointer"
                            >
                              收藏
                            </button>
                          </div>
                          <p className="text-[9px] dark:text-slate-500 text-slate-500">
                            拍摄要求：{script.shootingRequirements?.join('；') || '常规片场条件'}
                          </p>
                        </div>
                      );
                    })}
                </div>

                <details className="rounded-lg border dark:border-slate-800 border-slate-200 p-2">
                  <summary className="text-xs font-bold dark:text-slate-300 text-slate-700 cursor-pointer">
                    剧本库（{scriptLibrary.length}）
                  </summary>
                  <div className="mt-2 space-y-2">
                    {scriptLibrary.length === 0 && (
                      <p className="text-[10px] dark:text-slate-500 text-slate-500">尚未收藏剧本。</p>
                    )}
                    {scriptLibrary.map(script => {
                      const isLocked = globalState.reputation < (script.requiredReputation ?? 0);
                      return (
                        <div
                          key={script.id}
                          className="flex items-center gap-2 rounded border dark:border-slate-800 border-slate-200 p-2"
                        >
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScript(script)}
                            className="min-w-0 flex-1 text-left disabled:opacity-40 cursor-pointer"
                          >
                            <span className="block truncate text-xs font-bold dark:text-slate-200 text-slate-800">
                              {script.title}
                            </span>
                            <span className="text-[9px] dark:text-slate-500 text-slate-500">
                              {script.level}级 · 知名度要求 {script.requiredReputation ?? 0} · 预计 +
                              {(script.estimatedReward ?? script.baseQuality * 1500).toLocaleString()} G
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => saveScriptLibrary(scriptLibrary.filter(item => item.id !== script.id))}
                            className="text-[9px] text-rose-400 cursor-pointer"
                          >
                            移除
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            </fieldset>
          )}
        </div>
      )}

      {/* Past Productions */}
      {managementView === 'archive' && (
        <div className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 shadow-xl space-y-3">
          <h3
            onClick={() => setIsPastWorksCollapsed(!isPastWorksCollapsed)}
            className="text-xs font-bold dark:text-slate-300 text-slate-700 border-b dark:border-slate-800 border-slate-200 pb-2 flex items-center justify-between cursor-pointer select-none hover:text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span>过往拍摄发行作品</span>
              <span className="text-[10px] dark:text-slate-500 text-slate-500">
                {isPastWorksCollapsed ? '(已折叠 - 点击展开查看)' : '(已展开 - 点击折叠隐藏)'}
              </span>
            </div>
            <span className="text-[9px] font-normal dark:text-slate-500 text-slate-500">PRODUCTION LIST</span>
          </h3>

          {!isPastWorksCollapsed && (
            <div className="space-y-2.5">
              {pastWorks.length === 0 ? (
                <div className="text-center py-6 text-xs dark:text-slate-500 text-slate-500 font-mono">
                  暂无发行作品记录。立项拍摄第一部影视作品吧！
                </div>
              ) : (
                pastWorks.map(work => (
                  <div
                    key={work.id}
                    onClick={() => setSelectedWorkIdForReviews(selectedWorkIdForReviews === work.id ? null : work.id)}
                    className={`dark:bg-[#0E1016] bg-white border rounded-xl p-3 flex flex-col gap-3 transition-all duration-300 cursor-pointer ${
                      selectedWorkIdForReviews === work.id
                        ? 'border-rose-500/80 shadow-md shadow-rose-950/10'
                        : 'dark:border-slate-800 border-slate-200 hover:dark:border-slate-700 border-slate-300/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold dark:text-slate-200 text-slate-900">{work.workName}</span>
                          <span className="text-[9px] bg-rose-950/60 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                            #{work.theme}
                          </span>
                        </div>

                        <div className="text-[10px] dark:text-slate-500 text-slate-500 font-sans flex items-center gap-2">
                          <span>
                            参演演员:{' '}
                            <strong className="dark:text-slate-300 text-slate-700">
                              {[...work.actresses, ...work.actors].join(' / ')}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            上映时长:{' '}
                            <strong className="dark:text-slate-300 text-slate-700">{work.daysSinceRelease}天</strong>
                          </span>
                        </div>

                        <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-normal font-sans max-w-[620px] dark:bg-slate-950/15 bg-slate-50 p-2 rounded border border-slate-900/60">
                          {work.evaluation}
                        </p>
                      </div>

                      <div className="flex md:flex-col justify-between items-baseline md:items-end w-full md:w-auto border-t md:border-t-0 dark:border-slate-800 border-slate-200/60 pt-2 md:pt-0 gap-1.5 min-w-[120px]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono font-bold">
                            影迷评分:
                          </span>
                          <span className="text-xs font-bold text-rose-400 font-mono flex items-center gap-0.5">
                            {getDisplayedWorkRating(work)} / 10
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono font-bold">
                            获得收益:
                          </span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            +{work.profit.toLocaleString()} G
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] dark:text-slate-500 text-slate-500 text-right font-mono uppercase border-t border-slate-900/60 pt-1">
                      {selectedWorkIdForReviews === work.id ? '▲ 收起评论区' : '▼ 展开评论区'}
                    </div>

                    {selectedWorkIdForReviews === work.id && (
                      <div
                        className="border-t dark:border-slate-800 border-slate-200/60 pt-2.5 mt-1 space-y-2 animate-in fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-rose-400 font-bold">评论区</span>
                          <button
                            type="button"
                            disabled={refreshingWorkId === work.id}
                            onClick={() => handleRefreshReviews(work)}
                            className="rounded border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            {refreshingWorkId === work.id ? '刷新中...' : '刷新评论'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(workReviews[work.id] ?? getCommentsForWork(work)).map((comment, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950/45 p-2 rounded-lg border dark:border-slate-800 border-slate-200/60 space-y-1"
                            >
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-purple-400 font-bold">{comment.username}</span>
                                <span className="text-amber-500 font-mono">打分: {comment.rating}分/10</span>
                              </div>
                              <p className="text-[11px] dark:text-slate-300 text-slate-700 font-sans leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
