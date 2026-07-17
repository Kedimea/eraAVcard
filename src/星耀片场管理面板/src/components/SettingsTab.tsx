import { useState } from 'react';
import { Settings, Link2, Key, Server, CheckCircle2, Cpu } from 'lucide-react';
import { CreativeServiceConfig, MrfzSettings } from '../types';
import { fetchAvailableModels } from '../services/creativeService';
import { saveMrfzSettings } from '../settings';
import { testSecondApiConnection } from '../secondApiClient';
import { applyWorldbookApiMode } from '../worldbookApiMode';

interface SettingsTabProps {
  statusBarTheme: 'dark' | 'light';
  onSetStatusBarTheme: (theme: 'dark' | 'light') => void;
  settings: MrfzSettings;
  onSettingsChange: (settings: MrfzSettings) => void;
}

export default function SettingsTab({
  statusBarTheme,
  onSetStatusBarTheme,
  settings,
  onSettingsChange,
}: SettingsTabProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [settingsSection, setSettingsSection] = useState<'api' | 'prompts'>('api');
  const secondApi = settings.secondApi;

  const updateSecondApi = (patch: Partial<CreativeServiceConfig>) => {
    const credentialsChanged = patch.baseUrl !== undefined || patch.apiKey !== undefined;
    onSettingsChange({
      ...settings,
      secondApi: {
        ...secondApi,
        ...patch,
        models: credentialsChanged ? [] : secondApi.models,
        selectedModel: credentialsChanged ? '' : (patch.selectedModel ?? secondApi.selectedModel),
      },
    });
    setConnectionStatus('idle');
    setSaveStatus('idle');
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (
      settings.apiMode === 'multi' &&
      (!secondApi.baseUrl.trim() || !secondApi.apiKey.trim() || !secondApi.selectedModel.trim())
    ) {
      alert('请先完成 API 连接并选择模型');
      return;
    }
    try {
      await applyWorldbookApiMode(settings.apiMode);
      saveMrfzSettings(settings);
      setSaveStatus('saved');
    } catch (error) {
      alert(`保存失败：${error instanceof Error ? error.message : '世界书模式同步失败'}`);
    }
  };

  const validateConnectionFields = () => {
    if (!secondApi.baseUrl.trim() || !secondApi.apiKey.trim()) {
      alert('请先填写 API URL 和 API Key');
      return false;
    }
    return true;
  };

  const handleFetchModels = async () => {
    if (!validateConnectionFields()) return;

    setIsConnecting(true);
    setConnectionStatus('idle');
    setErrorMessage('');
    try {
      const models = await fetchAvailableModels(secondApi.baseUrl, secondApi.apiKey);
      onSettingsChange({
        ...settings,
        secondApi: {
          ...secondApi,
          models,
          selectedModel: models.includes(secondApi.selectedModel) ? secondApi.selectedModel : models[0],
        },
      });
      setConnectionStatus('success');
      setConnectionMessage(`模型列表获取成功，共 ${models.length} 个模型。请选择或手动填写模型后保存。`);
      setSaveStatus('idle');
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '未知连接错误');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectionTest = async () => {
    if (!validateConnectionFields()) return;
    if (!secondApi.selectedModel.trim()) {
      alert('请先选择或手动填写模型名');
      return;
    }
    setIsConnecting(true);
    setConnectionStatus('idle');
    setConnectionMessage('');
    setErrorMessage('');
    try {
      const message = await testSecondApiConnection(secondApi);
      setConnectionStatus('success');
      setConnectionMessage(message);
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '未知连接错误');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleModeChange = async (mode: MrfzSettings['apiMode']) => {
    if (mode === settings.apiMode) return;
    setIsSwitchingMode(true);
    try {
      await applyWorldbookApiMode(mode);
      onSettingsChange({ ...settings, apiMode: mode });
      setSaveStatus('idle');
    } catch (error) {
      alert(`API 模式切换失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSwitchingMode(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h3 className="text-sm font-bold dark:text-slate-300 text-slate-700 pb-2 flex items-center gap-2">
        <Settings className="w-4 h-4 text-purple-400" />
        系统设置
      </h3>

      <div className="grid grid-cols-2 gap-2 rounded-xl border dark:border-slate-800 border-slate-200 p-1.5 dark:bg-[#12141C] bg-slate-50">
        <button
          type="button"
          onClick={() => setSettingsSection('api')}
          className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${settingsSection === 'api' ? 'bg-purple-600 text-white' : 'dark:text-slate-400 text-slate-600'}`}
        >
          API 模式
        </button>
        <button
          type="button"
          onClick={() => setSettingsSection('prompts')}
          className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${settingsSection === 'prompts' ? 'bg-purple-600 text-white' : 'dark:text-slate-400 text-slate-600'}`}
        >
          提示词管理
        </button>
      </div>

      {settingsSection === 'api' && (
        <>
          <section className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold dark:text-slate-400 text-slate-600 flex items-center gap-1.5 border-b dark:border-slate-800 border-slate-200/60 pb-2">
              <Cpu className="w-3.5 h-3.5" />
              API 模式
            </h4>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {(['single', 'multi'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  disabled={isSwitchingMode}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    settings.apiMode === mode
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'dark:bg-[#0E1016] bg-white dark:border-slate-700 border-slate-300 dark:text-slate-400 text-slate-600'
                  }`}
                >
                  {mode === 'single' ? '单 API' : '多 API'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
              <div className="rounded-lg border dark:border-slate-800 border-slate-200 p-3 dark:bg-[#0E1016] bg-white">
                <strong className="block text-slate-300 mb-1">单 API 模式</strong>
                <span className="dark:text-slate-500 text-slate-600">一次输出完整生成剧情 + 变量。</span>
              </div>
              <div className="rounded-lg border dark:border-slate-800 border-slate-200 p-3 dark:bg-[#0E1016] bg-white">
                <strong className="block text-purple-300 mb-1">多 API 模式</strong>
                <span className="dark:text-slate-500 text-slate-600">
                  主 API 输出剧情，第二 API 单独处理变量更新和其他更新。
                </span>
              </div>
            </div>
            {settings.apiMode === 'single' && (
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
              >
                {saveStatus === 'saved' ? '单 API 配置已保存' : '保存 API 模式'}
              </button>
            )}
          </section>

          {settings.apiMode === 'multi' && (
            <section className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
              <h4 className="text-xs font-bold dark:text-slate-400 text-slate-600 flex items-center gap-1.5 border-b dark:border-slate-800 border-slate-200/60 pb-2">
                <Server className="w-3.5 h-3.5" />
                第二 API（OpenAI 兼容）
              </h4>

              <div className="space-y-3 max-w-xl">
                <label className="block space-y-1.5">
                  <span className="text-[10px] dark:text-slate-500 text-slate-500 font-bold uppercase">API URL</span>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="url"
                      value={secondApi.baseUrl}
                      onChange={event => updateSecondApi({ baseUrl: event.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="w-full dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs dark:text-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <span className="block text-[9px] dark:text-slate-600 text-slate-500">
                    建议填写 API 基础地址（通常以 /v1 结尾）；若粘贴完整 /chat/completions
                    地址，系统会自动剥离重复路径。
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] dark:text-slate-500 text-slate-500 font-bold uppercase">API Key</span>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="password"
                      value={secondApi.apiKey}
                      onChange={event => updateSecondApi({ apiKey: event.target.value })}
                      placeholder="sk-..."
                      autoComplete="off"
                      className="w-full dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs dark:text-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] dark:text-slate-500 text-slate-500 font-bold uppercase">模型</span>
                  <input
                    type="text"
                    list="second-api-models"
                    value={secondApi.selectedModel}
                    onChange={event => updateSecondApi({ selectedModel: event.target.value })}
                    placeholder="手动输入模型名，或获取列表后选择"
                    className="w-full dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 text-xs dark:text-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <datalist id="second-api-models">
                    {secondApi.models.map(model => (
                      <option key={model} value={model}></option>
                    ))}
                  </datalist>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleConnectionTest}
                    disabled={isConnecting}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                  >
                    {isConnecting ? '测试中...' : '连接测试'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={isConnecting}
                    className="border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50 text-purple-300 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                  >
                    获取可用模型
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] dark:text-slate-500 text-slate-500 font-bold uppercase">
                      超时时间（ms）
                    </span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={secondApi.timeoutMs}
                      onChange={event => updateSecondApi({ timeoutMs: Math.max(1000, Number(event.target.value)) })}
                      className="w-full dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] dark:text-slate-500 text-slate-500 font-bold uppercase">
                      最大重试次数
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={secondApi.maxRetries}
                      onChange={event => updateSecondApi({ maxRetries: Math.max(0, Number(event.target.value)) })}
                      className="w-full dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!secondApi.selectedModel}
                  className="w-full rounded-lg border border-emerald-500/50 bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {saveStatus === 'saved' ? 'API 配置已保存' : '保存 API 配置'}
                </button>
              </div>

              {connectionStatus === 'success' && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {connectionMessage || '第二 API 连接正常。'}
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                  连接失败：{errorMessage}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {settingsSection === 'prompts' && (
        <section className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold dark:text-slate-200 text-slate-800">次 API 提示词管理</h4>
            <p className="mt-1 text-[10px] dark:text-slate-500 text-slate-500">
              修改后点击保存。业务数据会在调用时自动附加，请保留对应 JSON 或变量输出要求。
            </p>
          </div>
          {(
            [
              ['variableUpdate', '变量更新'],
              ['workReviews', '作品评论'],
              ['privateRequests', '私人委托'],
              ['blackMarket', '黑市寻货'],
              ['scriptRefresh', '现成剧本'],
              ['scriptGenerate', 'AI 剧本生成'],
              ['scriptEvaluate', '自拟剧本评估'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1.5">
              <span className="text-[10px] font-bold text-purple-300">{label}</span>
              <textarea
                rows={4}
                value={settings.prompts[key]}
                onChange={event => {
                  onSettingsChange({
                    ...settings,
                    prompts: { ...settings.prompts, [key]: event.target.value },
                  });
                  setSaveStatus('idle');
                }}
                className="w-full resize-y rounded-lg border dark:border-slate-700 border-slate-300 dark:bg-[#0E1016] bg-white p-3 text-xs leading-relaxed dark:text-slate-200 text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
          >
            {saveStatus === 'saved' ? '提示词已保存' : '保存全部提示词'}
          </button>
        </section>
      )}

      <section className="dark:bg-[#12141C] bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold dark:text-slate-400 text-slate-600 border-b dark:border-slate-800 border-slate-200/60 pb-2">
          界面主题
        </h4>
        <div className="grid grid-cols-2 gap-2 max-w-sm">
          {(['dark', 'light'] as const).map(theme => (
            <button
              key={theme}
              type="button"
              onClick={() => onSetStatusBarTheme(theme)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                statusBarTheme === theme
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 font-bold'
                  : 'dark:bg-[#12141C] bg-white dark:border-slate-800 border-slate-300 dark:text-slate-400 text-slate-600'
              }`}
            >
              {theme === 'dark' ? '深色主题' : '浅色主题'}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
