import { MrfzSettings } from './types';

export const MRFZ_SETTINGS_KEY = 'mrfz_settings';

export const DEFAULT_MRFZ_SETTINGS: MrfzSettings = {
  apiMode: 'single',
  secondApi: {
    baseUrl: '',
    apiKey: '',
    models: [],
    selectedModel: '',
    timeoutMs: 30000,
    maxRetries: 3,
  },
  prompts: {
    variableUpdate: '你只负责根据最新剧情更新 MVU 变量。不要续写剧情，不要解释任务。',
    workReviews:
      '生成 5-10 条中文观众评论，只返回 JSON 数组。每项字段为 username、content、rating；网名自然且不要添加字段前缀，评分为 1-10，评论观点应有差异。',
    privateRequests:
      '为成人影视片场生成匿名客户委托，只返回 JSON 数组。每项包含标题、简介、演员人数、基础质量、D/C/B/A/S等级、知名度要求、预计报酬和拍摄要求。',
    blackMarket:
      '你是星耀片场地下交易网的黑市商人，消息灵通、谨慎老练。根据求购暗语设计一件货物并估算普通市场基价，只返回 JSON。',
    scriptRefresh:
      '为成人影视片场生成可直接拍摄的现成剧本，只返回 JSON 数组。等级使用D/C/B/A/S并与0-1000知名度要求匹配，人物关系和拍摄难度要有差异。',
    scriptGenerate:
      '根据当前片场环境、近期作品、知名度和当前在场演员，构思一个适合立即拍摄的新剧本。等级使用D/C/B/A/S并与0-1000知名度要求匹配，只返回 JSON 对象。',
    scriptEvaluate:
      '评估用户自行编制的影视剧本，补充D/C/B/A/S等级、0-1000知名度要求、预计报酬和拍摄要求，只返回 JSON 对象。',
  },
};

export function loadMrfzSettings(): MrfzSettings {
  try {
    const raw = localStorage.getItem(MRFZ_SETTINGS_KEY);
    if (!raw) return DEFAULT_MRFZ_SETTINGS;
    const stored = JSON.parse(raw) as Partial<MrfzSettings> & {
      secondApi?: Partial<MrfzSettings['secondApi']>;
    };
    const storedRetries = Number(stored.secondApi?.maxRetries);
    return {
      apiMode: stored.apiMode === 'multi' ? 'multi' : 'single',
      secondApi: {
        ...DEFAULT_MRFZ_SETTINGS.secondApi,
        ...stored.secondApi,
        models: Array.isArray(stored.secondApi?.models) ? stored.secondApi.models : [],
        timeoutMs: Math.max(1000, Number(stored.secondApi?.timeoutMs) || 30000),
        maxRetries: Number.isFinite(storedRetries) ? Math.max(0, Math.floor(storedRetries)) : 3,
      },
      prompts: {
        ...DEFAULT_MRFZ_SETTINGS.prompts,
        ...(stored.prompts ?? {}),
      },
    };
  } catch (error) {
    console.warn('[Settings] 读取 mrfz_settings 失败，使用默认配置', error);
    return DEFAULT_MRFZ_SETTINGS;
  }
}

export function saveMrfzSettings(settings: MrfzSettings): void {
  try {
    localStorage.setItem(MRFZ_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Settings] 保存 mrfz_settings 失败', error);
  }
}

export function isSecondApiComplete(settings: MrfzSettings): boolean {
  const config = settings.secondApi;
  return Boolean(config.baseUrl.trim() && config.apiKey.trim() && config.selectedModel.trim());
}

export function requireSavedSecondApi(purpose: string): MrfzSettings['secondApi'] {
  const settings = loadMrfzSettings();
  if (settings.apiMode !== 'multi') throw new Error(`${purpose}需要在设置中启用“多 API”模式`);
  if (!settings.secondApi.baseUrl.trim() || !settings.secondApi.apiKey.trim()) {
    throw new Error(`${purpose}失败：尚未保存第二 API 地址或访问秘钥`);
  }
  if (!settings.secondApi.selectedModel.trim()) {
    throw new Error(`${purpose}失败：尚未选择或手动填写模型名`);
  }
  return settings.secondApi;
}
