import { useState } from 'react';
import { StudioTask } from '../mvuStore';

interface OperationsTabProps {
  tasks: StudioTask[];
  availableExecutors: string[];
  onAcceptTask: (task: StudioTask, executor: string) => void;
  onCompleteTask: (task: StudioTask) => void;
  onAbandonTask: (task: StudioTask) => void;
}

export default function OperationsTab({
  tasks,
  availableExecutors,
  onAcceptTask,
  onCompleteTask,
  onAbandonTask,
}: OperationsTabProps) {
  const groups = ['悬赏大厅', '自选任务', '进行中', '已完成'] as const;

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="space-y-4">
        {groups.map(group => {
          const items = tasks.filter(task => task.group === group);
          return (
            <details
              key={group}
              open={group === '进行中' || group === '悬赏大厅'}
              className="rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-[#12141C] bg-slate-50 p-4"
            >
              <summary className="cursor-pointer text-sm font-bold dark:text-slate-200 text-slate-800">
                {group}（{items.length}）
              </summary>
              <div className="mt-3 space-y-2">
                {items.length === 0 && <p className="text-xs dark:text-slate-500 text-slate-500">暂无记录。</p>}
                {items.map(task => (
                  <TaskRow
                    key={`${group}:${task.id}`}
                    task={task}
                    executors={availableExecutors}
                    onAccept={onAcceptTask}
                    onComplete={onCompleteTask}
                    onAbandon={onAbandonTask}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function TaskRow({
  task,
  executors,
  onAccept,
  onComplete,
  onAbandon,
}: {
  task: StudioTask;
  executors: string[];
  onAccept: (task: StudioTask, executor: string) => void;
  onComplete: (task: StudioTask) => void;
  onAbandon: (task: StudioTask) => void;
}) {
  const [executor, setExecutor] = useState(executors[0] ?? '');
  return (
    <div className="rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-[#0E1016] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold dark:text-slate-200 text-slate-800">{task.title}</span>
        <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-300">
          Rank {task.rank}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed dark:text-slate-400 text-slate-600">{task.description}</p>
      <p className="mt-1 text-[9px] text-amber-400">奖励：{task.reward}</p>
      {task.status === '可接取' && (
        <div className="mt-2 flex gap-2">
          <select
            value={executor}
            onChange={event => setExecutor(event.target.value)}
            className="min-w-0 flex-1 rounded border dark:border-slate-700 border-slate-300 dark:bg-[#12141C] bg-white px-2 py-1.5 text-[10px]"
          >
            {executors.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!executor}
            onClick={() => onAccept(task, executor)}
            className="rounded bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            接取
          </button>
        </div>
      )}
      {task.status === '进行中' && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onComplete(task)}
            className="cursor-pointer rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white"
          >
            标记完成
          </button>
          <button
            type="button"
            onClick={() => onAbandon(task)}
            className="cursor-pointer rounded border border-rose-500/40 px-3 py-1.5 text-[10px] font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            放弃任务
          </button>
        </div>
      )}
    </div>
  );
}
