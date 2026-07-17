import { createRoot } from 'react-dom/client';
import App from '../../../星耀片场管理面板/src/App';
import '../../../星耀片场管理面板/src/index.css';
import {
  clearStudioActions,
  formatStudioActionsForPrompt,
  getStudioActions,
} from '../../../星耀片场管理面板/src/actionQueue';
import {
  callSecondApiForVariable,
  generateWorkReviews,
  handleUnifiedRequest,
} from '../../../星耀片场管理面板/src/requestHandler';

const MVU_READY_TIMEOUT_MS = 12_000;

function showBootState(container: HTMLElement, message: string, detail = '') {
  container.innerHTML = `
    <div style="margin: 8px 0; padding: 14px 16px; border: 1px solid #7c3aed66; border-radius: 12px; background: #111827; color: #e5e7eb; font: 13px/1.6 system-ui, sans-serif;">
      <strong style="display: block; margin-bottom: 4px; color: #f0abfc;">星耀片场管理面板</strong>
      <div>${message}</div>
      ${detail ? `<div style="margin-top: 6px; color: #fda4af;">${detail}</div>` : ''}
    </div>
  `;
}

async function waitForMvu() {
  await Promise.race([
    waitGlobalInitialized('Mvu'),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('等待 MVU 初始化超时')), MVU_READY_TIMEOUT_MS);
    }),
  ]);

  if (typeof Mvu === 'undefined') {
    throw new Error('MVU 全局对象未注册');
  }
}

$(() => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('[星耀片场] 缺少 #root 挂载节点');
    return;
  }

  showBootState(container, '正在连接 MVU 变量系统…');

  void (async () => {
    try {
      await waitForMvu();
      initializeGlobal('StarlightRequestHandler', {
        handleUnifiedRequest,
        callSecondApiForVariable,
        generateWorkReviews,
      });

      const root = createRoot(container);
      root.render(<App />);
      console.info('[星耀片场] 消息楼层界面已挂载');

      const messageSentListener = eventMakeFirst(tavern_events.MESSAGE_SENT, async (messageId: number) => {
        const pendingActions = getStudioActions();
        if (pendingActions.length === 0) return;

        const message = getChatMessages(messageId)[0];
        if (!message || message.role !== 'user') {
          console.error('[片场行动简报] 无法定位刚发送的用户消息，简报已保留', { messageId });
          return;
        }

        const briefing = formatStudioActionsForPrompt(pendingActions);
        if (message.message.includes(briefing)) return;

        try {
          await setChatMessages([{ message_id: messageId, message: `${message.message.trimEnd()}\n\n${briefing}` }], {
            refresh: 'none',
          });
          clearStudioActions();
          console.info('[片场行动简报] 已附加至用户消息并清空待发送行动', {
            messageId,
            count: pendingActions.length,
          });
        } catch (error) {
          console.error('[片场行动简报] 附加失败，简报已保留', error);
        }
      });

      $(window).on('pagehide', () => {
        messageSentListener.stop();
        root.unmount();
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error('[星耀片场] 前端初始化失败', error);
      showBootState(
        container,
        '前端未能启动。请确认角色卡的“MVU”和“MVU ZOD变量结构”脚本均已启用，然后发送一条新消息。',
        `原因：${reason}`,
      );
    }
  })();
});
