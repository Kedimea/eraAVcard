export interface StudioAction {
  id: string;
  text: string;
  createdAt: number;
}

const readActions = (): StudioAction[] => {
  try {
    const raw = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() }).stat_data?.操作队列;
    if (!Array.isArray(raw)) return [];
    return raw.map(action => ({
      id: String(action.id || ''),
      text: String(action.详情 || action.标题 || ''),
      createdAt: Number(String(action.id || '').match(/action_(\d+)/)?.[1] ?? Date.now()),
    }));
  } catch {
    return [];
  }
};

export function enqueueStudioAction(text: string): string {
  const id = `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  void updateStudioState(state => {
    enqueueMvuAction(state, 'AI任务生成', text.trim());
    state.操作队列.at(-1)!.id = id;
  });
  return id;
}

export function removeStudioAction(id: string): void {
  void updateStudioState(state => {
    state.操作队列 = state.操作队列.filter(action => action.id !== id);
  });
}

export function clearStudioActions(): void {
  void updateStudioState(state => {
    state.操作队列 = [];
  });
}

export function getStudioActions(): StudioAction[] {
  return readActions();
}

export function subscribeStudioActions(listener: (items: StudioAction[]) => void): () => void {
  listener(readActions());
  const event = eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => listener(readActions()));
  return () => event.stop();
}

export function formatStudioActionsForPrompt(items = readActions()): string {
  if (items.length === 0) return '';
  return `<Zefra>\n${items.map(item => `[片场消息]<user>${item.text}`).join('\n')}\n</Zefra>`;
}
import { enqueueMvuAction, updateStudioState } from './mvuStore';
