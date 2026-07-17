import React, { useState } from 'react';
import { Actress, Actor } from '../types';

interface CastManagementTabProps {
  actresses: Actress[];
  actors: Actor[];
  onUpdateActressStageName: (id: string, stageName: string) => void;
  onUpdateActorStageName: (id: string, stageName: string) => void;
}

export default function CastManagementTab({
  actresses,
  actors,
  onUpdateActressStageName,
  onUpdateActorStageName,
}: CastManagementTabProps) {
  const [activeGender, setActiveGender] = useState<'female' | 'male'>('female');
  const [selectedFemaleId, setSelectedFemaleId] = useState<string>(actresses[0]?.id || '');
  const [selectedMaleId, setSelectedMaleId] = useState<string>(actors[0]?.id || '');
  const [femaleDetailTab, setFemaleDetailTab] = useState<'clothes' | 'body'>('clothes');
  const [stageNameEditor, setStageNameEditor] = useState<{
    type: 'actress' | 'actor';
    id: string;
  } | null>(null);
  const [stageNameDraft, setStageNameDraft] = useState('');

  const actress = actresses.find(a => a.id === selectedFemaleId) || actresses[0];
  const actor = actors.find(a => a.id === selectedMaleId) || actors[0];

  const openStageNameEditor = (type: 'actress' | 'actor', id: string, stageName: string) => {
    setStageNameDraft(stageName);
    setStageNameEditor({ type, id });
  };

  const saveStageName = () => {
    const normalized = stageNameDraft.trim();
    if (!normalized || !stageNameEditor) return;

    if (stageNameEditor.type === 'actress') {
      onUpdateActressStageName(stageNameEditor.id, normalized);
    } else {
      onUpdateActorStageName(stageNameEditor.id, normalized);
    }
    setStageNameEditor(null);
  };

  const renderProgressBar = (value: number, colorClass: string, max: number = 100) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="w-full space-y-1">
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
          <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  const getFiveStageName = (value: number, stages: readonly string[]) =>
    stages[Math.min(4, Math.max(0, Math.floor(value / 20)))];

  return (
    <div id="cast-management" className="space-y-4">
      {/* Sub-tabs to switch Female vs Male - NO emojis, compact styling */}
      <div className="border-b dark:border-slate-800 border-slate-200 pb-2 flex items-center justify-between">
        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-lg border dark:border-slate-800 border-slate-200">
          <button
            onClick={() => setActiveGender('female')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeGender === 'female'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm'
                : 'dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 text-slate-900'
            }`}
          >
            女优管理
          </button>
          <button
            onClick={() => setActiveGender('male')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeGender === 'male'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm'
                : 'dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 text-slate-900'
            }`}
          >
            男优管理
          </button>
        </div>
        <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono tracking-widest uppercase">
          {activeGender === 'female' ? 'FEMALE ACTRESS' : 'MALE CO-STARS'}
        </span>
      </div>

      {activeGender === 'female' ? (
        <div className="space-y-4">
          {/* Actress Selectors Row */}
          <div className="flex flex-wrap gap-2">
            {actresses.map(act => {
              const isSelected = act.id === selectedFemaleId;
              return (
                <button
                  key={act.id}
                  onClick={() => setSelectedFemaleId(act.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 text-rose-400 shadow-sm'
                      : 'dark:bg-[#12141C] bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 hover:dark:border-slate-700 border-slate-300'
                  }`}
                >
                  <span>{act.name}</span>
                  <span className="text-[10px] font-normal dark:text-slate-500 text-slate-500 ml-1">
                    ({act.stageName})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actress Detail Layout */}
          {actress ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Col 1: Identity */}
              <div className="space-y-4 dark:bg-slate-950/20 bg-slate-50 p-4 border dark:border-slate-800 border-slate-200 rounded-xl">
                <div>
                  <h3 className="flex items-baseline gap-1.5 text-sm font-bold text-slate-100">
                    <span>{actress.name}</span>
                    <button
                      type="button"
                      onClick={() => openStageNameEditor('actress', actress.id, actress.stageName)}
                      className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-400 transition-colors hover:bg-rose-500/20 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      aria-label={`修改${actress.name}的艺名`}
                    >
                      {actress.stageName || '未设定'}
                    </button>
                    <span className="text-xs font-normal text-slate-600 dark:text-slate-400">{actress.age} 岁</span>
                  </h3>
                  <p className="mt-1 text-[10px] font-mono text-slate-500">职业：{actress.occupation || '未设定'}</p>
                </div>
              </div>

              {/* Col 2: Core Attributes & Exp */}
              <div className="space-y-4 dark:bg-slate-950/20 bg-slate-50 p-4 border dark:border-slate-800 border-slate-200 rounded-xl">
                <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono tracking-wider block border-b dark:border-slate-800 border-slate-200 pb-1.5 uppercase font-bold">
                  身体数据
                </span>

                <div className="space-y-3">
                  {/* Skill */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="dark:text-slate-300 text-slate-700">演出经验</span>
                      <span className="text-rose-400 font-bold">
                        {actress.skill} ·{' '}
                        {getFiveStageName(actress.skill, ['初出茅庐', '崭露头角', '渐入佳境', '炉火纯青', '登峰造极'])}
                      </span>
                    </div>
                    {renderProgressBar(actress.skill, 'bg-rose-500', 99)}
                  </div>

                  {/* Affection */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-rose-400">好感度</span>
                      <span className="text-rose-400 font-bold">
                        {actress.affection} ·{' '}
                        {getFiveStageName(actress.affection, [
                          '萍水相逢',
                          '心生好感',
                          '推心置腹',
                          '情投意合',
                          '至死不渝',
                        ])}
                      </span>
                    </div>
                    {renderProgressBar(actress.affection, 'bg-rose-500', 99)}
                  </div>

                  {/* Corruption */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-purple-400">堕落度</span>
                      <span className="text-purple-400 font-bold">
                        {actress.corruption} ·{' '}
                        {getFiveStageName(actress.corruption, [
                          '心存抗拒',
                          '意志动摇',
                          '半推半就',
                          '沉溺其中',
                          '彻底沦陷',
                        ])}
                      </span>
                    </div>
                    {renderProgressBar(actress.corruption, 'bg-purple-500', 99)}
                  </div>

                  {/* Stamina */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-emerald-400">体力值</span>
                      <span className="text-emerald-400 font-bold">
                        {actress.stamina} ·{' '}
                        {getFiveStageName(actress.stamina, [
                          '精疲力竭',
                          '身心疲惫',
                          '略显疲惫',
                          '状态尚佳',
                          '精神饱满',
                        ])}
                      </span>
                    </div>
                    {renderProgressBar(actress.stamina, 'bg-emerald-500')}
                  </div>

                  {/* Pleasure */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-fuchsia-400">快感度</span>
                      <span className="text-fuchsia-400 font-bold">
                        {actress.pleasure} ·{' '}
                        {getFiveStageName(actress.pleasure, [
                          '心如止水',
                          '微起涟漪',
                          '欲念渐生',
                          '意乱情迷',
                          '难以自持',
                        ])}
                      </span>
                    </div>
                    {renderProgressBar(actress.pleasure, 'bg-fuchsia-500')}
                  </div>
                </div>

                {/* Experience Indicators */}
                <div className="pt-3 border-t dark:border-slate-800 border-slate-200/60 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold dark:text-slate-300 text-slate-700">
                    <div className="dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 p-1.5 rounded">
                      <span className="dark:text-slate-500 text-slate-500 block">口穴处女</span>
                      <span className={actress.isMouthVirgin ? 'text-rose-400' : 'dark:text-slate-400 text-slate-600'}>
                        {actress.isMouthVirgin ? '是' : '否'}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 p-1.5 rounded">
                      <span className="dark:text-slate-500 text-slate-500 block">小穴处女</span>
                      <span className={actress.isVaginaVirgin ? 'text-rose-400' : 'dark:text-slate-400 text-slate-600'}>
                        {actress.isVaginaVirgin ? '是' : '否'}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 p-1.5 rounded">
                      <span className="dark:text-slate-500 text-slate-500 block">后穴处女</span>
                      <span className={actress.isAnusVirgin ? 'text-rose-400' : 'dark:text-slate-400 text-slate-600'}>
                        {actress.isAnusVirgin ? '是' : '否'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] dark:text-slate-400 text-slate-600 pt-1">
                    <div className="dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 p-2 rounded flex justify-between items-center">
                      <span>和导演做爱次数</span>
                      <span className="dark:text-slate-200 text-slate-900 font-bold font-mono">
                        {actress.sexWithUser} 次
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white border dark:border-slate-800 border-slate-200 p-2 rounded flex justify-between items-center">
                      <span>和其他演员做爱次数</span>
                      <span className="dark:text-slate-200 text-slate-900 font-bold font-mono">
                        {actress.sexWithOthers} 次
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 3: Sensitivity & Wardrobe */}
              <div className="space-y-4">
                {/* Sensitivity point development */}
                <div className="dark:bg-slate-950/20 bg-slate-50 p-4 border dark:border-slate-800 border-slate-200 rounded-xl space-y-3">
                  <span className="text-[10px] dark:text-slate-500 text-slate-500 font-mono tracking-wider block border-b dark:border-slate-800 border-slate-200 pb-1.5 uppercase font-bold">
                    开发度
                  </span>
                  <div className="space-y-2">
                    {[
                      { label: '口穴', value: actress.zones.mouth, color: 'bg-rose-400' },
                      { label: '胸部', value: actress.zones.breasts, color: 'bg-rose-400' },
                      { label: '小穴', value: actress.zones.vagina, color: 'bg-rose-400' },
                      { label: '屁穴', value: actress.zones.anus, color: 'bg-rose-400' },
                      { label: '足部', value: actress.zones.feet, color: 'bg-rose-400' },
                    ].map((zone, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="dark:text-slate-400 text-slate-600">{zone.label}</span>
                          <span className="text-rose-400 font-bold">{zone.value}</span>
                        </div>
                        {renderProgressBar(zone.value, zone.color, 99)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950/40">
                  {[
                    ['clothes', '当前服饰'],
                    ['body', '当前身体状态'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFemaleDetailTab(id as 'clothes' | 'body')}
                      className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-bold transition-colors ${
                        femaleDetailTab === id
                          ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Wardrobe view (Read-only) */}
                <div
                  className={`${
                    femaleDetailTab === 'clothes' ? 'block' : 'hidden'
                  } dark:bg-slate-950/20 bg-slate-50 p-4 border dark:border-slate-800 border-slate-200 rounded-xl space-y-3`}
                >
                  <div className="grid grid-cols-1 gap-2 text-[11px] dark:text-slate-400 text-slate-600">
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">上装</span>
                      <span className="dark:text-slate-200 text-slate-900 truncate block font-medium">
                        {actress.realtime.clothes.top}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">下装</span>
                      <span className="dark:text-slate-200 text-slate-900 truncate block font-medium">
                        {actress.realtime.clothes.bottom}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">内衣</span>
                      <span className="text-rose-300 truncate block font-medium">{actress.realtime.clothes.bra}</span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">内裤</span>
                      <span className="text-rose-300 truncate block font-medium">
                        {actress.realtime.clothes.panties}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">丝袜</span>
                      <span className="dark:text-slate-200 text-slate-900 truncate block font-medium">
                        {actress.realtime.clothes.socks}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">鞋履</span>
                      <span className="dark:text-slate-200 text-slate-900 truncate block font-medium">
                        {actress.realtime.clothes.shoes}
                      </span>
                    </div>
                    <div className="dark:bg-[#0E1016] bg-white/50 p-1.5 rounded border dark:border-slate-800 border-slate-200/40">
                      <span className="dark:text-slate-500 text-slate-500 block text-[9px] uppercase">配饰挂饰</span>
                      <span className="text-purple-300 truncate block font-medium">
                        {actress.realtime.clothes.accessories}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`${
                    femaleDetailTab === 'body' ? 'block' : 'hidden'
                  } dark:bg-slate-950/20 bg-slate-50 p-4 border dark:border-slate-800 border-slate-200 rounded-xl space-y-3`}
                >
                  <div className="grid grid-cols-1 gap-2 text-[11px] dark:text-slate-400 text-slate-600">
                    {[
                      ['口穴', actress.realtime.bodyState.mouth],
                      ['胸部', actress.realtime.bodyState.breasts],
                      ['小穴', actress.realtime.bodyState.vagina],
                      ['屁穴', actress.realtime.bodyState.anus],
                      ['足部', actress.realtime.bodyState.feet],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded border border-slate-200 bg-white/50 p-1.5 dark:border-slate-800 dark:bg-[#0E1016]"
                      >
                        <span className="block text-[9px] font-bold text-slate-500">{label}</span>
                        <span className="mt-0.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
                          {value || '正常'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 dark:text-slate-500 text-slate-500 text-xs">暂无女演员数据</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Male Selector Row */}
          <div className="flex flex-wrap gap-2">
            {actors.map(ac => {
              const isSelected = ac.id === selectedMaleId;
              return (
                <button
                  key={ac.id}
                  onClick={() => setSelectedMaleId(ac.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 text-rose-400 shadow-sm'
                      : 'dark:bg-[#12141C] bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 hover:dark:border-slate-700 border-slate-300'
                  }`}
                >
                  <span>{ac.name}</span>
                  <span className="text-[10px] font-normal dark:text-slate-500 text-slate-500 ml-1">
                    ({ac.stageName})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Male Detail Card */}
          {actor ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                <div>
                  <h3 className="flex items-baseline gap-1.5 text-sm font-bold text-slate-100">
                    <span>{actor.name}</span>
                    <button
                      type="button"
                      onClick={() => openStageNameEditor('actor', actor.id, actor.stageName)}
                      className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-400 transition-colors hover:bg-rose-500/20 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      aria-label={`修改${actor.name}的艺名`}
                    >
                      {actor.stageName || '未设定'}
                    </button>
                    <span className="text-xs font-normal text-slate-600 dark:text-slate-400">{actor.age} 岁</span>
                  </h3>
                  <p className="mt-1 text-[10px] font-mono text-slate-500">职业：{actor.occupation || '未设定'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                <span className="block border-b border-slate-200 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-500">
                  身体数据
                </span>
                <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0E1016]">
                  <div className="mb-3 flex justify-between text-xs font-mono">
                    <span className="text-slate-700 dark:text-slate-300">演出经验</span>
                    <span className="font-bold text-rose-400">{actor.skill}</span>
                  </div>
                  <div className="mb-1 flex justify-between text-xs font-mono">
                    <span className="text-slate-700 dark:text-slate-300">体力值</span>
                    <span className="font-bold text-emerald-400">
                      {actor.stamina} ·{' '}
                      {getFiveStageName(actor.stamina, ['精疲力竭', '身心疲惫', '略显疲惫', '状态尚佳', '精神饱满'])}
                    </span>
                  </div>
                  {renderProgressBar(actor.stamina, 'bg-emerald-500')}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <span className="block border-b border-slate-200 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-500">
                    当前服饰
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    {[
                      ['上装', actor.clothes.top],
                      ['下装', actor.clothes.bottom],
                      ['鞋子', actor.clothes.shoes],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded border border-slate-200 bg-white/50 p-1.5 dark:border-slate-800 dark:bg-[#0E1016]"
                      >
                        <span className="block text-[9px] font-bold text-slate-500">{label}</span>
                        <span className="mt-0.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
                          {value || '未设定'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-500">当前想法</span>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-[#0E1016] dark:text-slate-300">
                    {actor.currentThought || '暂无特别想法'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 dark:text-slate-500 text-slate-500 text-xs">暂无男演员数据</div>
          )}
        </div>
      )}

      {stageNameEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          role="presentation"
          onMouseDown={() => setStageNameEditor(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stage-name-editor-title"
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-[#12141C] p-5 shadow-2xl"
            onMouseDown={event => event.stopPropagation()}
          >
            <h4 id="stage-name-editor-title" className="text-sm font-bold text-slate-100">
              修改艺名
            </h4>
            <p className="mt-1 text-xs text-slate-500">确认后会保存到当前片场记录。</p>
            <input
              autoFocus
              value={stageNameDraft}
              onChange={event => setStageNameDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') saveStageName();
                if (event.key === 'Escape') setStageNameEditor(null);
              }}
              aria-label="艺名"
              className="mt-4 w-full rounded-lg border border-rose-500/30 bg-slate-950 px-3 py-2 text-sm font-medium text-rose-300 outline-none transition-colors placeholder:text-slate-600 focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              placeholder="输入艺名"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStageNameEditor(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveStageName}
                disabled={!stageNameDraft.trim()}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
