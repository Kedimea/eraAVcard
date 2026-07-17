import { useState } from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { GlobalState, ShopCategory, ShopItem } from '../types';
import { appraiseCustomItem } from '../services/creativeService';

interface ShopTabProps {
  globalState: GlobalState;
  shopItems: ShopItem[];
  onPurchaseItem: (item: ShopItem) => void;
  onUndoPurchaseItem: (item: ShopItem) => void;
  onLogAction: (msg: string) => string;
  onRemoveAction: (id: string) => void;
}

export default function ShopTab({
  globalState,
  shopItems,
  onPurchaseItem,
  onUndoPurchaseItem,
  onLogAction,
  onRemoveAction,
}: ShopTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [purchaseLog, setPurchaseLog] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<{ item: ShopItem; actionId: string } | null>(null);
  const [customRequest, setCustomRequest] = useState('');
  const [isAppraising, setIsAppraising] = useState(false);
  const [appraisalError, setAppraisalError] = useState('');
  const [customItem, setCustomItem] = useState<ShopItem | null>(null);
  const [customBasePrice, setCustomBasePrice] = useState(0);

  const categories = [
    { id: 'all', label: '全部商品' },
    { id: 'normal', label: '消耗品' },
    { id: 'adult', label: '成人商品' },
    { id: 'clothing', label: '高档衣服' },
    { id: 'prop', label: '情趣道具' },
  ];

  const filteredItems = shopItems.filter(item => activeCategory === 'all' || item.category === activeCategory);

  const getCategoryLabel = (category: ShopCategory) => {
    switch (category) {
      case 'normal':
        return '消耗品';
      case 'adult':
        return '催情/成人商品';
      case 'clothing':
        return '衣服装扮';
      case 'prop':
        return '情趣道具';
    }
  };

  const getCategoryBadgeColor = (category: ShopCategory) => {
    switch (category) {
      case 'normal':
        return 'text-sky-400 bg-sky-950/30 border-sky-500/20';
      case 'adult':
        return 'text-rose-400 bg-rose-950/30 border-rose-500/20';
      case 'clothing':
        return 'text-purple-400 bg-purple-950/30 border-purple-500/20';
      case 'prop':
        return 'text-amber-400 bg-amber-950/30 border-amber-500/20';
    }
  };

  const handleBuyItem = (item: ShopItem) => {
    if (globalState.economy.balance < item.price) {
      alert('【交易失败】资金余额不足！请先筹集片场资金。');
      return;
    }

    onPurchaseItem(item);
    const actionId = onLogAction(`购买了道具【${item.name}】，支出 ${item.price.toLocaleString()} G`);
    setLastPurchase({ item, actionId });
    setPurchaseLog(`成功购买【${item.name}】！花费 ${item.price.toLocaleString()} G，已放入背包。`);
  };

  const handleUndoPurchase = () => {
    if (!lastPurchase) return;
    onUndoPurchaseItem(lastPurchase.item);
    onRemoveAction(lastPurchase.actionId);
    setPurchaseLog(`已撤回【${lastPurchase.item.name}】的购买，货款已退回。`);
    setLastPurchase(null);
  };

  const handleCustomAppraisal = async () => {
    if (!customRequest.trim()) {
      alert('请先写下希望黑市商人寻找的物品');
      return;
    }
    setIsAppraising(true);
    setAppraisalError('');
    setCustomItem(null);

    try {
      const result = await appraiseCustomItem(customRequest.trim());
      setCustomItem(result.item);
      setCustomBasePrice(result.basePrice);
    } catch (error) {
      setAppraisalError(error instanceof Error ? error.message : '黑市联络过程中发生未知错误');
    } finally {
      setIsAppraising(false);
    }
  };

  const renderItemCard = (item: ShopItem, specialOrder = false) => {
    const badgeClass = getCategoryBadgeColor(item.category);
    const canAfford = globalState.economy.balance >= item.price;

    return (
      <details
        key={item.id}
        className={`group rounded-lg border dark:bg-[#12141C] bg-slate-50 ${specialOrder ? 'border-amber-500/50' : 'dark:border-slate-800 border-slate-200'}`}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <h4 className="truncate text-sm font-bold dark:text-slate-100 text-slate-900">{item.name}</h4>
            <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold ${badgeClass}`}>
              {getCategoryLabel(item.category)}
            </span>
            {specialOrder && <span className="text-[9px] font-bold text-amber-400">黑市货物</span>}
          </div>
          <span className="text-xs font-bold text-amber-400">{item.price.toLocaleString()} G · 详情</span>
        </summary>
        <div className="space-y-3 border-t dark:border-slate-800 border-slate-200 px-4 py-3">
          <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">{item.description}</p>
          <div className="space-y-1 rounded border dark:border-slate-800 border-slate-200 p-2">
            {item.effects.map((effect, index) => (
              <p key={index} className="text-[11px] dark:text-slate-300 text-slate-700">
                • {effect.text}
              </p>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] dark:text-slate-500 text-slate-500 block">
                {specialOrder ? `地下市价 ${customBasePrice.toLocaleString()} G × 1.5` : '价格'}
              </span>
              <span className="text-base font-bold text-amber-400 font-mono tracking-wide">
                {item.price.toLocaleString()} <span className="text-xs text-amber-500 font-sans">G</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleBuyItem(item)}
              disabled={!canAfford}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-500 text-black shadow-md active:scale-95 cursor-pointer'
                  : 'dark:bg-[#0E1016] bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {canAfford ? '确认购买' : '资金不足'}
            </button>
          </div>
        </div>
      </details>
    );
  };

  return (
    <div id="shop-management" className="space-y-6">
      {purchaseLog && (
        <div className="bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-between gap-3">
          <p className="font-semibold">{purchaseLog}</p>
          {lastPurchase && (
            <button
              type="button"
              onClick={handleUndoPurchase}
              className="shrink-0 rounded-md border border-amber-500/50 px-3 py-1.5 font-bold hover:bg-amber-500/15 cursor-pointer"
            >
              撤回购买
            </button>
          )}
        </div>
      )}

      <section className="dark:bg-[#12141C] bg-slate-50 border border-amber-500/25 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b dark:border-slate-800 border-slate-200 pb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold dark:text-slate-200 text-slate-900">地下黑市联络点</h3>
            <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-0.5">
              留下求购暗语，黑市商人会从隐秘渠道寻找货物并开价。地下交易按正常市价的 1.5 倍结算。
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <textarea
            value={customRequest}
            onChange={event => setCustomRequest(event.target.value)}
            placeholder="写下求购暗语，例如：需要一套不会留下采购记录的雨夜摄影防护设备……"
            rows={3}
            className="flex-1 resize-none dark:bg-[#0E1016] bg-white border dark:border-slate-700 border-slate-300 rounded-lg p-3 text-xs dark:text-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed"
          />
          <button
            type="button"
            onClick={handleCustomAppraisal}
            disabled={isAppraising}
            className="md:w-36 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 cursor-pointer"
          >
            {isAppraising ? '联络中...' : '递交暗语'}
          </button>
        </div>

        {appraisalError && (
          <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg p-3">
            {appraisalError}
          </div>
        )}

        {customItem && <div className="max-w-2xl">{renderItemCard(customItem, true)}</div>}
      </section>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 pb-2 border-b dark:border-slate-800 border-slate-200">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-amber-500 to-[#d97706] border-amber-500 text-black font-bold shadow-md shadow-amber-500/10'
                  : 'dark:bg-[#12141C] bg-slate-50 dark:border-slate-800 border-slate-300 dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 hover:text-slate-900 hover:dark:border-slate-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">{filteredItems.map(item => renderItemCard(item))}</div>
      </div>
    </div>
  );
}
