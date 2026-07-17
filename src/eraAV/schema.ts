const ItemEffect = z
  .object({
    目标: z.enum(['女优', '男优', '全局']).prefault('女优'),
    属性: z.string().prefault(''),
    数值: z.coerce.number().prefault(0),
    说明: z.string().prefault(''),
  })
  .prefault({});

const InventoryItem = z
  .object({
    数量: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
    描述: z.string().prefault(''),
    数值效果: z.string().prefault(''),
    效果: z.array(ItemEffect).prefault([]),
  })
  .prefault({});

const ShopItem = z
  .object({
    类型: z.string().prefault(''),
    价格: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
    描述: z.string().prefault(''),
    数值效果: z.string().prefault(''),
    效果: z.array(ItemEffect).prefault([]),
  })
  .prefault({});

const ScriptLevel = z
  .preprocess(value => {
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      const legacyLevel = _.clamp(Math.round(Number(value)), 1, 10);
      return ['D', 'C', 'B', 'A', 'S'][Math.ceil(legacyLevel / 2) - 1];
    }
    return typeof value === 'string' ? value.toUpperCase() : value;
  }, z.enum(['D', 'C', 'B', 'A', 'S']))
  .prefault('D');

const Script = z
  .object({
    ID: z.string().prefault(''),
    简介: z.string().prefault(''),
    所需男优数: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(1),
    所需女优数: z.coerce
      .number()
      .transform(value => Math.max(1, value))
      .prefault(1),
    基础质量: z.coerce
      .number()
      .transform(value => _.clamp(value, 0, 100))
      .prefault(70),
    等级: ScriptLevel,
    所需知名度: z.coerce
      .number()
      .transform(value => _.clamp(value, 0, 1000))
      .prefault(0),
    预计报酬: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
    拍摄要求: z.array(z.string()).prefault([]),
    来源: z.enum(['预设', 'AI', '自拟', '收藏', '私人委托']).prefault('预设'),
  })
  .prefault({});

const Task = z
  .object({
    标题: z.string().prefault(''),
    Rank: z.string().prefault('C'),
    描述: z.string().prefault(''),
    奖励: z.string().prefault(''),
    指定对象: z.string().prefault('不限'),
    执行者: z.array(z.string()).prefault([]),
    状态: z.enum(['可接取', '进行中', '已完成']).prefault('可接取'),
  })
  .prefault({});

const Achievement = z
  .object({
    名称: z.string().prefault(''),
    描述: z.string().prefault(''),
    进度: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
    目标: z.coerce
      .number()
      .transform(value => Math.max(1, value))
      .prefault(1),
    奖励: z.string().prefault(''),
    已解锁: z.boolean().prefault(false),
  })
  .prefault({});

const StudioAction = z
  .object({
    id: z.string().prefault(''),
    类型: z
      .enum([
        '购买',
        '撤回购买',
        '使用物品',
        '丢弃物品',
        '还债',
        '接取任务',
        '完成任务',
        '拍摄企划',
        '结束拍摄',
        '日期推进',
        'AI任务生成',
      ])
      .prefault('购买'),
    标题: z.string().prefault(''),
    详情: z.string().prefault(''),
    时间: z.string().prefault(''),
    可撤销: z.boolean().prefault(true),
    商品名: z.string().prefault(''),
    商品分类: z.string().prefault(''),
    数量: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
    金额: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
  })
  .prefault({});

const Actress = z
  .object({
    基本信息: z
      .object({
        姓名: z.string().prefault(''),
        年龄: z.coerce.number().prefault(0),
        艺名: z.string().prefault(''),
        当前职业: z.string().prefault(''),
        简介: z.string().prefault(''),
        是否已签约: z.boolean().prefault(false),
        已拍摄AV部数: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
        片酬: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
      })
      .prefault({}),
    数值系统: z
      .object({
        演出经验: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        好感度: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        堕落度: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        快感值: z.coerce
          .number()
          .transform(value => _.clamp(value, 0, 100))
          .prefault(0),
        体力值: z.coerce
          .number()
          .transform(value => _.clamp(value, 0, 100))
          .prefault(100),
      })
      .prefault({}),
    身体属性: z
      .object({
        口是否处女: z.boolean().prefault(true),
        小穴是否处女: z.boolean().prefault(true),
        后穴是否处女: z.boolean().prefault(true),
      })
      .prefault({}),
    性经历: z
      .looseObject({
        与玩家性交次数: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
        与其他男性性交次数: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
      })
      .prefault({}),
    敏感点开发度: z
      .object({
        口穴: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        胸部: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        小穴: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        屁穴: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        足部: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
      })
      .prefault({}),
    实时状态: z
      .object({
        上装: z.string().prefault(''),
        下装: z.string().prefault(''),
        内衣: z.string().prefault(''),
        内裤: z.string().prefault(''),
        袜子: z.string().prefault(''),
        鞋子: z.string().prefault(''),
        饰品: z.string().prefault(''),
        身体状态: z
          .object({
            口穴: z.string().prefault(''),
            胸部: z.string().prefault(''),
            足部: z.string().prefault(''),
            小穴: z.string().prefault(''),
            屁穴: z.string().prefault(''),
          })
          .prefault({}),
        当前是否在场: z.boolean().prefault(false),
        当前想法: z.string().prefault(''),
      })
      .prefault({}),
  })
  .prefault({});

const Actor = z
  .object({
    基本信息: z
      .object({
        姓名: z.string().prefault(''),
        年龄: z.coerce.number().prefault(0),
        艺名: z.string().prefault(''),
        当前职业: z.string().prefault(''),
        简介: z.string().prefault(''),
        已拍摄AV部数: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
        片酬: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
      })
      .prefault({}),
    数值系统: z
      .object({
        演出经验: z.coerce
          .number()
          .transform(value => _.clamp(value > 0 && value <= 5 ? value * 20 : value, 0, 99))
          .prefault(0),
        体力值: z.coerce
          .number()
          .transform(value => _.clamp(value, 0, 100))
          .prefault(100),
      })
      .prefault({}),
    实时状态: z
      .object({
        上装: z.string().prefault(''),
        下装: z.string().prefault(''),
        鞋子: z.string().prefault(''),
        当前想法: z.string().prefault(''),
      })
      .prefault({}),
  })
  .prefault({});

const PastWork = z
  .object({
    评分: z.coerce
      .number()
      .transform(value => _.clamp(value, 0, 10))
      .prefault(0),
    评价: z.string().prefault(''),
    总获利: z.coerce.number().prefault(0),
    上映日期: z.string().prefault(''),
    简介: z.string().prefault(''),
    观众评价: z.array(z.string()).prefault([]),
    男优: z.array(z.string()).prefault([]),
    女优: z.array(z.string()).prefault([]),
    上映后天数: z.coerce
      .number()
      .transform(value => Math.max(0, value))
      .prefault(0),
  })
  .prefault({});

export const Schema = z
  .object({
    界面设置: z
      .object({
        主题: z.enum(['Galgame粉色主题', '高级会所金色主题']).prefault('Galgame粉色主题'),
        控制台展开: z.boolean().prefault(true),
      })
      .prefault({}),
    制作人: z
      .object({
        名称: z.string().prefault('{{user}}'),
        等级: z.coerce
          .number()
          .transform(value => Math.max(1, value))
          .prefault(1),
        经验值: z.coerce
          .number()
          .transform(value => Math.max(0, value))
          .prefault(0),
        下级所需经验: z.coerce
          .number()
          .transform(value => Math.max(1, value))
          .prefault(120),
      })
      .prefault({}),
    全局状态: z
      .object({
        日期时间: z.object({ 当前日期: z.string().prefault(''), 当前时间: z.string().prefault('') }).prefault({}),
        位置: z.object({ 当前所在地点: z.string().prefault('') }).prefault({}),
        街道治安: z.enum(['动荡', '戒备', '安定']).prefault('安定'),
        知名度: z.coerce.number().transform(value => _.clamp(value, 0, 1000)).prefault(0),
        经济: z
          .object({
            现有余额: z.coerce.number().prefault(0),
            欠债系统: z
              .object({
                总还款次数: z.coerce
                  .number()
                  .transform(() => 52)
                  .prefault(52),
                总阶段数: z.coerce
                  .number()
                  .transform(() => 13)
                  .prefault(13),
                当前所处阶段: z.coerce
                  .number()
                  .transform(value => _.clamp(value, 1, 13))
                  .prefault(1),
                当前阶段已还款次数: z.coerce
                  .number()
                  .transform(value => _.clamp(value, 0, 4))
                  .prefault(0),
                当前阶段每次还款金额: z.coerce
                  .number()
                  .transform(value => Math.max(0, value))
                  .prefault(0),
                下次还款日期: z.string().prefault(''),
                当前欠款逾期次数: z.coerce
                  .number()
                  .transform(value => _.clamp(value, 0, 2))
                  .prefault(0),
                总已还款次数: z.coerce
                  .number()
                  .transform(value => _.clamp(value, 0, 52))
                  .prefault(0),
                总获利: z.coerce
                  .number()
                  .transform(value => Math.max(0, value))
                  .prefault(0),
                剩余欠债总额: z.coerce
                  .number()
                  .transform(value => Math.max(0, value))
                  .prefault(0),
              })
              .prefault({}),
            逾期机制: z
              .object({
                当前逾期女优: z
                  .record(
                    z.string().describe('女优名'),
                    z.object({ 征用日期: z.string().prefault(''), 预计归还日期: z.string().prefault('') }).prefault({}),
                  )
                  .prefault({}),
              })
              .prefault({}),
          })
          .prefault({}),
      })
      .prefault({}),
    女优: z.record(z.string().describe('角色名'), Actress).prefault({}),
    男优: z.record(z.string().describe('角色名'), Actor).prefault({}),
    背包管理: z
      .object({
        消耗品: z
          .record(z.string(), InventoryItem)
          .transform(data => _.pickBy(data, item => item.数量 > 0))
          .prefault({}),
        情趣用品: z
          .record(z.string(), InventoryItem)
          .transform(data => _.pickBy(data, item => item.数量 > 0))
          .prefault({}),
        衣物: z
          .record(z.string(), InventoryItem)
          .transform(data => _.pickBy(data, item => item.数量 > 0))
          .prefault({}),
        特殊物品: z
          .record(z.string(), InventoryItem)
          .transform(data => _.pickBy(data, item => item.数量 > 0))
          .prefault({}),
      })
      .prefault({}),
    商店: z
      .object({
        正常商品: z.record(z.string(), ShopItem).prefault({}),
        成人商品: z.record(z.string(), ShopItem).prefault({}),
        衣服: z.record(z.string(), ShopItem).prefault({}),
        道具: z.record(z.string(), ShopItem).prefault({}),
      })
      .prefault({}),
    AV拍摄系统: z
      .object({
        当前拍摄: z
          .object({
            是否拍摄中: z.boolean().prefault(false),
            当前作品名称: z.string().prefault(''),
            作品简介: z.string().prefault(''),
            选中剧本ID: z.string().prefault(''),
            拍摄者: z
              .object({ 男优: z.array(z.string()).prefault([]), 女优: z.array(z.string()).prefault([]) })
              .prefault({}),
            企划步骤: z
              .object({
                演员: z.array(z.string()).prefault([]),
                情境: z.string().prefault(''),
                地点: z.string().prefault(''),
                服装道具: z.array(z.string()).prefault([]),
                拍摄前准备: z.array(z.string()).prefault([]),
              })
              .prefault({}),
            预计销量: z.coerce
              .number()
              .transform(value => Math.max(0, value))
              .prefault(0),
            预计收入构成: z
              .object({
                演员号召: z.coerce.number().prefault(0),
                道具加成: z.coerce.number().prefault(0),
                风险扣减: z.coerce.number().prefault(0),
              })
              .prefault({}),
            目前拍摄摘要: z.string().prefault(''),
            作品完成度: z.coerce
              .number()
              .transform(value => _.clamp(value, 0, 100))
              .prefault(0),
            步骤日志: z.array(z.string()).prefault([]),
          })
          .prefault({}),
        剧本管理: z
          .object({
            可选现成剧本: z.record(z.string(), z.union([z.string(), Script])).prefault({}),
            私人委托: z.record(z.string(), Script).prefault({}),
            剧本库: z.record(z.string(), Script).prefault({}),
            自行发挥: z.boolean().prefault(false),
          })
          .prefault({}),
        市场数据: z
          .object({
            热门服饰: z.array(z.string()).prefault([]),
            热门角色类型: z.array(z.string()).prefault([]),
          })
          .prefault({}),
        可选项: z
          .object({
            情境设定: z.array(z.string()).prefault([]),
            地点选择: z.array(z.string()).prefault([]),
            服装与道具: z.array(z.string()).prefault([]),
            拍摄前准备: z.array(z.string()).prefault([]),
          })
          .prefault({}),
        过往作品: z
          .record(z.string().describe('作品名'), PastWork)
          .transform(data => _(data).entries().takeRight(8).fromPairs().value())
          .prefault({}),
      })
      .prefault({}),
    任务系统: z
      .object({
        悬赏大厅: z.record(z.string(), Task).prefault({}),
        自选任务: z.record(z.string(), Task).prefault({}),
        进行中: z.record(z.string(), Task).prefault({}),
        已完成: z.record(z.string(), Task).prefault({}),
      })
      .prefault({}),
    成就系统: z.record(z.string(), Achievement).prefault({}),
    操作队列: z
      .array(StudioAction)
      .transform(data => data.slice(-12))
      .prefault([]),
    $前端状态: z
      .object({
        体力道具使用记录: z.record(z.string(), z.boolean()).prefault({}),
        好感道具使用记录: z.record(z.string(), z.boolean()).prefault({}),
        剧本库已迁移: z.boolean().prefault(false),
      })
      .prefault({}),
  })
  .prefault({});

export type StudioMvuState = z.output<typeof Schema>;
