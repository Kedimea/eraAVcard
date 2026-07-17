import { loadMrfzSettings, isSecondApiComplete } from './settings';
import {
  CreativeServiceConfig,
  getScriptLevelForReputation,
  PastWork,
  PredefinedScript,
  SCRIPT_LEVEL_WEIGHT,
} from './types';
import { readNamedWorldbookEntries } from './worldbookApiMode';
import { callSavedSecondApi, callSecondApiRaw } from './secondApiClient';

export interface UnifiedRequestResult {
  message: string;
  maintext: string;
  option: string;
  sum: string;
  mvuData: Mvu.MvuData;
  usedSecondApi: boolean;
}

export interface WorkReview {
  username: string;
  content: string;
  rating: number;
}

const asText = (result: string | GenerateToolCallResult) => (typeof result === 'string' ? result : result.content);

const extractTag = (text: string, tag: string) =>
  text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]?.trim() ?? '';

const extractLastTagBlock = (text: string, tag: string) => {
  const matches = [...text.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))];
  const match = matches.at(-1);
  return match ? { block: match[0].trim(), content: match[1].trim() } : { block: '', content: '' };
};

const extractVariableBlock = (text: string) => {
  const explicit = extractTag(text, 'UpdateVariable');
  if (explicit) return explicit;
  return extractTag(text, 'update') || extractTag(text, 'updatevariable');
};

const replaceVariableBlock = (mainMessage: string, variableContent: string) => {
  const withoutOldBlock = mainMessage
    .replace(/<UpdateVariable[^>]*>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<update(?:variable)?[^>]*>[\s\S]*?<\/update(?:variable)?>/gi, '')
    .trimEnd();
  return `${withoutOldBlock}\n\n<UpdateVariable>\n${variableContent}\n</UpdateVariable>`;
};

const stripVariableBlocks = (message: string) =>
  message
    .replace(/<UpdateVariable[^>]*>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<update(?:variable)?[^>]*>[\s\S]*?<\/update(?:variable)?>/gi, '')
    .trim();

const normalizeVariableTagForMvu = (message: string) =>
  message.replace(/<UpdateVariable[^>]*>/gi, '<update>').replace(/<\/UpdateVariable>/gi, '</update>');

const resolveMessageId = () => {
  try {
    return getCurrentMessageId();
  } catch {
    return 'latest' as const;
  }
};

async function readVariableWorldbookEntries(): Promise<Record<string, string>> {
  const result = await readNamedWorldbookEntries(['变量更新规则', '变量列表', '变量输出格式']);
  const missing = ['变量更新规则', '变量列表', '变量输出格式'].filter(name => !result[name]?.trim());
  if (missing.length) throw new Error(`无法读取变量规范条目：${missing.join('、')}`);
  console.info('[Second API] 已通过函数读取关闭状态下的变量条目', { entries: Object.keys(result) });
  return result;
}

export async function callSecondApiForVariable(
  maintextSource: string,
  currentMvuData: Mvu.MvuData,
  config: CreativeServiceConfig,
): Promise<string> {
  const entries = await readVariableWorldbookEntries();
  const settings = loadMrfzSettings();
  const maintextMatch = extractLastTagBlock(maintextSource, 'maintext');
  const maintextBlock = maintextMatch.block || `<maintext>\n${maintextSource.trim()}\n</maintext>`;
  const prompt = [
    settings.prompts.variableUpdate,
    '【当前正文】',
    maintextBlock,
    '【变量列表】',
    entries.变量列表 ?? '未读取到变量列表，请严格依据当前变量数据。',
    '【变量更新规则】',
    entries.变量更新规则 ?? '未读取到变量更新规则，仅更新剧情中明确变化的字段。',
    '【当前变量数据】',
    JSON.stringify(currentMvuData.stat_data ?? currentMvuData, null, 2),
    '【输出格式】',
    entries.变量输出格式 ?? '使用角色卡支持的变量更新命令。',
    '必须把最终变量更新内容完整包裹在 <UpdateVariable> 与 </UpdateVariable> 标签中。',
  ].join('\n\n');

  const result = await callSecondApiRaw(prompt, config, '变量更新请求');

  const variableContent = extractVariableBlock(result);
  if (!variableContent) {
    throw new Error('第二 API 返回中没有 <UpdateVariable> 标签');
  }
  return variableContent;
}

export async function handleUnifiedRequest(userInput: string): Promise<UnifiedRequestResult> {
  await waitGlobalInitialized('Mvu');
  const messageId = resolveMessageId();
  const currentMvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
  const settings = loadMrfzSettings();

  console.info('[Main API] 开始生成剧情', { apiMode: settings.apiMode, messageId });
  const mainMessage = asText(await generate({ user_input: userInput }));
  const maintextMatch = extractLastTagBlock(mainMessage, 'maintext');
  const maintext = maintextMatch.content || stripVariableBlocks(mainMessage);
  const option = extractTag(mainMessage, 'option');
  const sum = extractTag(mainMessage, 'sum');
  console.info('[Main API] 剧情生成完成', {
    length: mainMessage.length,
    hasVariableUpdate: Boolean(extractVariableBlock(mainMessage)),
  });

  let finalMessage = mainMessage;
  let usedSecondApi = false;

  if (settings.apiMode === 'multi') {
    if (!isSecondApiComplete(settings)) {
      console.warn('[Second API] 配置不完整，降级使用主 API 的变量更新');
    } else {
      try {
        const secondVariable = await callSecondApiForVariable(
          maintextMatch.block || maintext,
          currentMvuData,
          settings.secondApi,
        );
        finalMessage = replaceVariableBlock(mainMessage, secondVariable);
        usedSecondApi = true;
        console.info('[Second API] 已替换主 API 的变量更新内容');
      } catch (error) {
        console.error('[Second API] 调用失败，降级使用主 API 的变量更新', error);
      }
    }
  } else {
    console.info('[Second API] 当前为单 API 模式，跳过变量专用请求');
  }

  const parsedMvuData = await Mvu.parseMessage(normalizeVariableTagForMvu(finalMessage), currentMvuData);
  await Mvu.replaceMvuData(parsedMvuData, { type: 'message', message_id: messageId });
  console.info('[MVU] 最终消息解析与变量回写完成', { usedSecondApi, messageId });

  return { message: finalMessage, maintext, option, sum, mvuData: parsedMvuData, usedSecondApi };
}

const parseJson = (text: string) => {
  const candidate =
    text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ??
    text.match(/\[[\s\S]*\]/)?.[0] ??
    text.match(/\{[\s\S]*\}/)?.[0] ??
    text;
  return JSON.parse(candidate.trim()) as unknown;
};

export interface ScriptApiContext {
  currentDate: string;
  location: string;
  reputation: number;
  actresses: Array<{ name: string; skill: number; stamina: number }>;
  actors: Array<{ name: string; skill: number; stamina: number }>;
  recentWorks: Array<{ title: string; rating: number }>;
}

export interface CustomScriptDraft {
  title: string;
  description: string;
}

const normalizeScript = (
  value: unknown,
  index: number,
  source: PredefinedScript['source'],
  reputationRange?: { min: number; max: number },
): PredefinedScript => {
  const row = value as Record<string, unknown>;
  const min = Math.min(1000, Math.max(0, Math.floor(reputationRange?.min ?? 0)));
  const max = Math.min(1000, Math.max(min, Math.floor(reputationRange?.max ?? 1000)));
  const rawReputation = Number(row.requiredReputation);
  const requiredReputation = Math.min(max, Math.max(min, Number.isFinite(rawReputation) ? rawReputation : min));
  const baseQuality = Math.min(100, Math.max(40, Number(row.baseQuality) || 70));
  const level = getScriptLevelForReputation(requiredReputation);
  const shootingRequirements = Array.isArray(row.shootingRequirements)
    ? row.shootingRequirements.map(String).filter(Boolean).slice(0, 5)
    : [`演员体力不低于 ${Math.min(80, 20 + Math.floor(requiredReputation / 20))}%`];

  return {
    id: `${source}_script_${Date.now()}_${index}`,
    title: String(row.title || `匿名剧本 ${index + 1}`),
    description: String(row.description || '来自渠道编剧的未公开企划。'),
    requiredActorsCount: Math.min(5, Math.max(0, Math.floor(Number(row.requiredActorsCount) || 1))),
    requiredActressesCount: Math.min(5, Math.max(1, Math.floor(Number(row.requiredActressesCount) || 1))),
    baseQuality,
    level,
    requiredReputation,
    estimatedReward: Math.max(
      30000 + SCRIPT_LEVEL_WEIGHT[level] * 40000 + requiredReputation * 400,
      Math.floor(Number(row.estimatedReward) || baseQuality * 1500 * (1 + requiredReputation / 300)),
    ),
    shootingRequirements,
    source,
  };
};

const describeScriptContext = (context: ScriptApiContext) =>
  [
    `日期：${context.currentDate}`,
    `地点：${context.location}`,
    `制作人知名度：${context.reputation}/1000（当前最高可接 ${getScriptLevelForReputation(context.reputation)} 级剧本）`,
    `当前在场女优：${context.actresses.map(item => `${item.name}(演技${item.skill}/体力${item.stamina})`).join('；') || '无'}`,
    `可用男优：${context.actors.map(item => `${item.name}(演出经验${item.skill}/体力${item.stamina})`).join('；') || '无'}`,
    `近期作品：${context.recentWorks.map(item => `《${item.title}》(${item.rating}分)`).join('；') || '无'}`,
  ].join('\n');

export async function generateWorkReviews(work: PastWork): Promise<WorkReview[]> {
  const customPrompt = loadMrfzSettings().prompts.workReviews;
  const prompt = `${customPrompt}\n\n作品：《${work.workName}》\n原评分：${work.rating}/10\n作品评价：${work.evaluation}`;
  const result = await callSavedSecondApi(prompt, '作品评论刷新');

  const parsed = parseJson(result);
  if (!Array.isArray(parsed)) throw new Error('评论区返回格式不是数组');
  const reviews = parsed
    .slice(0, 10)
    .map(item => {
      const row = item as Record<string, unknown>;
      return {
        username: String(row.username || '匿名观众').replace(/^网名[：:]\s*/, ''),
        content: String(row.content || ''),
        rating: Math.min(10, Math.max(1, Number(row.rating) || work.rating)),
      };
    })
    .filter(review => review.content);
  if (reviews.length < 5) throw new Error('评论数量不足 5 条');
  return reviews;
}

export async function generatePrivateCommissions(
  context: ScriptApiContext,
  reputationRange: { min: number; max: number },
): Promise<PredefinedScript[]> {
  const prompt = `${loadMrfzSettings().prompts.privateRequests}\n\n${describeScriptContext(context)}\n生成 2-4 个私人委托。委托可以包含 SM、支配/服从、拘束或角色扮演等更高要求，但必须将要求写成安全、可执行的拍摄条件。知名度要求必须在 ${reputationRange.min}-${reputationRange.max} 之间。剧本等级必须按知名度匹配：D=0-199、C=200-399、B=400-599、A=600-799、S=800-1000；知名度与等级越高，estimatedReward 必须越高。只返回 JSON 数组；每项字段：title、description、requiredActorsCount、requiredActressesCount、baseQuality、level、requiredReputation、estimatedReward、shootingRequirements。`;
  const parsed = parseJson(await callSavedSecondApi(prompt, '私人委托刷新'));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('私人委托返回格式错误');
  return parsed.slice(0, 4).map((item, index) => normalizeScript(item, index, 'private', reputationRange));
}

export async function generatePredefinedScripts(
  context: ScriptApiContext,
  reputationRange: { min: number; max: number },
): Promise<PredefinedScript[]> {
  const prompt = `${loadMrfzSettings().prompts.scriptRefresh}\n\n${describeScriptContext(context)}\n知名度要求必须在 ${reputationRange.min}-${reputationRange.max} 之间。剧本等级必须按知名度匹配：D=0-199、C=200-399、B=400-599、A=600-799、S=800-1000；知名度与等级越高，estimatedReward 必须越高。每项字段：title、description、requiredActorsCount、requiredActressesCount、baseQuality、level、requiredReputation、estimatedReward、shootingRequirements。`;
  const result = await callSavedSecondApi(prompt, '现成剧本刷新');
  const parsed = parseJson(result);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('现成剧本返回格式错误');
  return parsed.slice(0, 6).map((item, index) => normalizeScript(item, index, 'ai', reputationRange));
}

export async function generateContextScript(context: ScriptApiContext): Promise<PredefinedScript> {
  const prompt = `${loadMrfzSettings().prompts.scriptGenerate}\n\n${describeScriptContext(context)}\n返回字段：title、description、requiredActorsCount、requiredActressesCount、baseQuality、level、requiredReputation、estimatedReward、shootingRequirements。剧本必须适配当前在场演员。`;
  const parsed = parseJson(await callSavedSecondApi(prompt, 'AI 剧本生成'));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('AI 剧本返回格式不是对象');
  return normalizeScript(parsed, 0, 'ai', { min: 0, max: context.reputation });
}

export async function evaluateCustomScript(
  draft: CustomScriptDraft,
  context: ScriptApiContext,
): Promise<PredefinedScript> {
  const prompt = `${loadMrfzSettings().prompts.scriptEvaluate}\n\n${describeScriptContext(context)}\n\n用户剧本名称：${draft.title}\n用户剧本内容：${draft.description}\n请保留用户核心创意并返回字段：title、description、requiredActorsCount、requiredActressesCount、baseQuality、level、requiredReputation、estimatedReward、shootingRequirements。`;
  const parsed = parseJson(await callSavedSecondApi(prompt, '自拟剧本评估'));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('剧本评估返回格式不是对象');
  return normalizeScript(parsed, 0, 'custom', { min: 0, max: context.reputation });
}
