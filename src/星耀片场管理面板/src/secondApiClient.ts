import { requireSavedSecondApi } from './settings';
import { CreativeServiceConfig } from './types';

const asText = (result: string | GenerateToolCallResult) => (typeof result === 'string' ? result : result.content);

export function toGenerateRawApiUrl(input: string): string {
  const url = new URL(input.trim());
  const path = url.pathname.replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(path)) url.pathname = path.replace(/\/chat\/completions$/i, '');
  else if (/\/models$/i.test(path)) url.pathname = path.replace(/\/models$/i, '');
  else url.pathname = path;
  return url.toString();
}

export function toModelsUrl(input: string): string {
  const url = new URL(toGenerateRawApiUrl(input));
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/models`;
  return url.toString();
}

class SecondApiTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label}等待超过 ${timeoutMs}ms，请确认聊天补全端点可用或提高超时时间`);
    this.name = 'SecondApiTimeoutError';
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new SecondApiTimeoutError(label, timeoutMs)), timeoutMs);
    }),
  ]);
}

export async function callSecondApiRaw(prompt: string, config: CreativeServiceConfig, label: string): Promise<string> {
  if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.selectedModel.trim()) {
    throw new Error(`${label}失败：API URL、API Key 或模型名不完整`);
  }

  // TavernHelper 会自行在 apiurl 后追加 /chat/completions，因此这里只传 API 基础地址。
  const apiurl = toGenerateRawApiUrl(config.baseUrl);
  const totalAttempts = config.maxRetries + 1;
  let lastError: unknown;
  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const startedAt = performance.now();
    console.info(`[Second API] ${label}开始`, { attempt, totalAttempts, apiurl, model: config.selectedModel });
    try {
      const result = await withTimeout(
        generateRaw({
          ordered_prompts: [{ role: 'user', content: prompt }],
          custom_api: {
            apiurl,
            key: config.apiKey.trim(),
            model: config.selectedModel.trim(),
          },
          should_silence: true,
          should_stream: false,
        }).then(asText),
        config.timeoutMs,
        label,
      );
      if (!result.trim()) throw new Error(`${label}返回内容为空`);
      console.info(`[Second API] ${label}成功`, {
        attempt,
        elapsedMs: Math.round(performance.now() - startedAt),
        responseLength: result.length,
      });
      return result.trim();
    } catch (error) {
      lastError = error;
      console.warn(`[Second API] ${label}失败`, { attempt, apiurl, model: config.selectedModel, error });
      if (error instanceof SecondApiTimeoutError) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label}失败`);
}

export async function callSavedSecondApi(prompt: string, label: string): Promise<string> {
  return callSecondApiRaw(prompt, requireSavedSecondApi(label), label);
}

export async function testSecondApiConnection(config: CreativeServiceConfig): Promise<string> {
  const startedAt = performance.now();
  const response = await callSecondApiRaw(
    '这是连接测试。请只回复：连接成功',
    { ...config, maxRetries: 0 },
    '第二 API 连接测试',
  );
  return `生成连接正常（${Math.round(performance.now() - startedAt)}ms）：${response.slice(0, 80)}`;
}

export async function fetchSecondApiModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const modelsUrl = toModelsUrl(baseUrl);
  console.info('[Second API] 获取模型列表', { modelsUrl });
  const response = await fetch(modelsUrl, {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
  });
  if (!response.ok) throw new Error(`获取模型列表失败：HTTP ${response.status} ${response.statusText}`);
  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const models = (payload.data ?? [])
    .map(item => item.id?.trim() ?? '')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  if (!models.length) throw new Error('接口响应成功，但没有返回可用模型');
  return models;
}
