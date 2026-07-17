import { ShopCategory, ShopItem } from '../types';
import { callSavedSecondApi, fetchSecondApiModels } from '../secondApiClient';
import { loadMrfzSettings } from '../settings';

export async function fetchAvailableModels(baseUrl: string, apiKey: string): Promise<string[]> {
  return fetchSecondApiModels(baseUrl, apiKey);
}

const parseJsonObject = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(candidate.trim()) as Record<string, unknown>;
};

const isShopCategory = (value: unknown): value is ShopCategory =>
  value === 'normal' || value === 'adult' || value === 'clothing' || value === 'prop';

export async function appraiseCustomItem(request: string): Promise<{ item: ShopItem; basePrice: number }> {
  const prompt = `${loadMrfzSettings().prompts.blackMarket}\nJSON 字段必须是 name、category、basePrice、description、effectText；category 只能是 normal、adult、clothing、prop；basePrice 为 100 到 100000 的整数。\n\n客人的求购暗语：${request}`;
  const data = parseJsonObject(await callSavedSecondApi(prompt, '黑市寻货'));
  const basePrice = Math.min(100000, Math.max(100, Math.round(Number(data.basePrice) || 1000)));
  const category: ShopCategory = isShopCategory(data.category) ? data.category : 'normal';
  const name = String(data.name || request.slice(0, 24) || '黑市货物');
  const description = String(data.description || request);
  const effectText = String(data.effectText || '具体效果将在实际使用时根据情境判定。');

  return {
    basePrice,
    item: {
      id: `custom_${Date.now()}`,
      name,
      category,
      price: Math.ceil((basePrice * 1.5) / 10) * 10,
      description,
      icon: '',
      effects: [{ target: 'global', stat: 'custom_order', value: 0, text: effectText }],
    },
  };
}
