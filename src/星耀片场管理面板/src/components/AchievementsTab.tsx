import { StudioAchievement } from '../mvuStore';

interface AchievementsTabProps {
  achievements: StudioAchievement[];
}

export default function AchievementsTab({ achievements }: AchievementsTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#12141C]">
      <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">片场成就</h2>
          <p className="mt-1 text-[10px] text-slate-500">记录片场在经营、拍摄与人脉上的里程碑。</p>
        </div>
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
          已解锁 {achievements.filter(achievement => achievement.unlocked).length}/{achievements.length}
        </span>
      </div>

      {achievements.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-500">暂无成就记录。</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map(achievement => {
            const percentage = Math.min(100, (achievement.progress / Math.max(1, achievement.target)) * 100);
            return (
              <article
                key={achievement.id}
                className={`rounded-lg border p-3 ${
                  achievement.unlocked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0E1016]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{achievement.name}</h3>
                  <span
                    className={achievement.unlocked ? 'text-[10px] text-emerald-400' : 'text-[10px] text-slate-500'}
                  >
                    {achievement.unlocked ? '已解锁' : `${achievement.progress}/${achievement.target}`}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{achievement.description}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-rose-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-[9px] text-amber-400">奖励：{achievement.reward}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
