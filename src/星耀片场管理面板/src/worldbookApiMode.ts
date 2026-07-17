import { MrfzSettings } from './types';

const VARIABLE_ENTRY_NAMES = ['变量更新规则', '变量列表', '变量输出格式'];
const SINGLE_FORMAT_NAME = '单api正文格式';
const MULTI_FORMAT_NAME = '多api正文格式';

export async function getBoundWorldbookNames(): Promise<string[]> {
  const binding = getCharWorldbookNames('current');
  return [binding.primary, ...binding.additional].filter((name): name is string => Boolean(name));
}

export async function readNamedWorldbookEntries(names: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const worldbookNames = await getBoundWorldbookNames();
  const books = await Promise.all(worldbookNames.map(name => getWorldbook(name)));
  books.flat().forEach(entry => {
    const matchedName = names.find(name => entry.name.includes(name));
    if (matchedName && result[matchedName] === undefined) result[matchedName] = entry.content;
  });
  return result;
}

export async function applyWorldbookApiMode(mode: MrfzSettings['apiMode']): Promise<void> {
  const worldbookNames = await getBoundWorldbookNames();
  if (worldbookNames.length === 0) throw new Error('当前角色卡没有绑定世界书，无法切换 API 正文格式');

  const found = new Set<string>();
  await Promise.all(
    worldbookNames.map(worldbookName =>
      updateWorldbookWith(
        worldbookName,
        entries =>
          entries.map(entry => {
            const variableName = VARIABLE_ENTRY_NAMES.find(name => entry.name.includes(name));
            if (variableName) {
              found.add(variableName);
              return { ...entry, enabled: mode === 'single' };
            }
            if (entry.name.includes(SINGLE_FORMAT_NAME)) {
              found.add(SINGLE_FORMAT_NAME);
              return { ...entry, enabled: mode === 'single' };
            }
            if (entry.name.includes(MULTI_FORMAT_NAME)) {
              found.add(MULTI_FORMAT_NAME);
              return { ...entry, enabled: mode === 'multi' };
            }
            return entry;
          }),
        { render: 'immediate' },
      ),
    ),
  );

  const required = [...VARIABLE_ENTRY_NAMES, SINGLE_FORMAT_NAME, MULTI_FORMAT_NAME];
  const missing = required.filter(name => !found.has(name));
  if (missing.length) throw new Error(`世界书缺少条目：${missing.join('、')}`);
  console.info('[API Mode] 世界书条目状态切换完成', { mode, worldbooks: worldbookNames });
}
