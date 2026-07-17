import { useState } from 'react';
import { Actress, Actor, InventoryItem } from '../types';
import { ShoppingBag } from 'lucide-react';

interface InventoryTabProps {
  inventory: InventoryItem[];
  actresses: Actress[];
  actors: Actor[];
  onUseItems: (itemIds: string[], targetId: string) => string;
  onDiscardItem: (itemId: string) => void;
  onLogAction: (msg: string) => void;
}

const categoryLabels: Record<string, string> = {
  consumable: '消耗品',
  toy: '情趣用品',
  clothing: '衣物',
  special: '特殊物品',
};

export default function InventoryTab({
  inventory,
  actresses,
  actors,
  onUseItems,
  onDiscardItem,
  onLogAction,
}: InventoryTabProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTargetId, setSelectedTargetId] = useState(actresses[0]?.id || '');
  const [selectedConsumables, setSelectedConsumables] = useState<string[]>([]);
  const [useLog, setUseLog] = useState<string | null>(null);
  const categories = [
    ['all', '全部物品'],
    ['consumable', '消耗品'],
    ['toy', '情趣用品'],
    ['clothing', '衣服/服装'],
    ['special', '特殊物品'],
  ];
  const filtered = inventory.filter(item => activeCategory === 'all' || item.category === activeCategory);

  const useItems = (ids: string[]) => {
    if (!selectedTargetId || ids.length === 0) return alert('请选择适用对象和道具');
    try {
      const message = onUseItems(ids, selectedTargetId);
      const names = inventory
        .filter(item => ids.includes(item.id))
        .map(item => item.name)
        .join('、');
      const target =
        actresses.find(item => item.id === selectedTargetId) || actors.find(item => item.id === selectedTargetId);
      onLogAction(`对 ${target?.name || '目标'} 使用了道具【${names}】`);
      setUseLog(message);
      setSelectedConsumables([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : '道具使用失败');
    }
  };

  return (
    <div id="inventory-management" className="space-y-5">
      <section className="flex flex-col gap-3 rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-[#12141C] bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-bold dark:text-slate-100 text-slate-800">使用道具</h3>
          <p className="text-[10px] dark:text-slate-500 text-slate-500">
            体力类每名角色每天一次；好感类每名角色每个好感阶段一次。
          </p>
        </div>
        <select
          value={selectedTargetId}
          onChange={event => setSelectedTargetId(event.target.value)}
          className="rounded-lg border dark:border-slate-700 border-slate-300 dark:bg-[#0E1016] bg-white px-3 py-2 text-xs"
        >
          <optgroup label="女演员">
            {actresses.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}（好感 {item.affection}）
              </option>
            ))}
          </optgroup>
          <optgroup label="男演员">
            {actors.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}（体力 {item.stamina}）
              </option>
            ))}
          </optgroup>
        </select>
      </section>

      {useLog && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-400">
          {useLog}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveCategory(id)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold cursor-pointer ${activeCategory === id ? 'border-purple-500 bg-purple-600 text-white' : 'dark:border-slate-800 border-slate-300 dark:text-slate-400 text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedConsumables.length > 0 && (
        <button
          type="button"
          onClick={() => useItems(selectedConsumables)}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          批量使用已选消耗品（{selectedConsumables.length}）
        </button>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border dark:border-slate-800 border-slate-200 p-10 text-center text-xs text-slate-500">
            <ShoppingBag className="mx-auto mb-2 h-7 w-7" />
            该分类暂无道具
          </div>
        ) : (
          filtered.map(item => (
            <details
              key={item.id}
              className="group rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-[#12141C] bg-slate-50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.category === 'consumable' && (
                    <input
                      type="checkbox"
                      checked={selectedConsumables.includes(item.id)}
                      onClick={event => event.stopPropagation()}
                      onChange={() =>
                        setSelectedConsumables(previous =>
                          previous.includes(item.id) ? previous.filter(id => id !== item.id) : [...previous, item.id],
                        )
                      }
                    />
                  )}
                  <strong className="text-sm dark:text-slate-100 text-slate-800">{item.name}</strong>
                  <span className="rounded border dark:border-slate-700 border-slate-300 px-2 py-0.5 text-[9px] text-purple-300">
                    {categoryLabels[item.category] || '其他'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">×{item.quantity} · 详情</span>
              </summary>
              <div className="space-y-3 border-t dark:border-slate-800 border-slate-200 px-4 py-3">
                <p className="text-xs dark:text-slate-400 text-slate-600">{item.description}</p>
                <div>
                  {item.effects.map((effect, index) => (
                    <p key={index} className="text-[11px] dark:text-slate-300 text-slate-700">
                      • {effect.text}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => useItems([item.id])}
                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    立即使用
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm(`确定丢弃一件【${item.name}】吗？`) && onDiscardItem(item.id)}
                    className="rounded-lg border dark:border-slate-700 border-slate-300 px-3 py-2 text-xs text-slate-500 cursor-pointer"
                  >
                    丢弃
                  </button>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
