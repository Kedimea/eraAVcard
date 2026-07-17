import { GlobalState, Actress, Actor, InventoryItem, ShopItem, PredefinedScript, PastWork } from '../types';

export const INITIAL_GLOBAL_STATE: GlobalState = {
  currentDate: '2026年07月08日',
  currentTime: '14:30',
  streetSecurity: '安定',
  location: '新星制作一号摄影棚',
  economy: {
    balance: 500000, // 50万金币
    remainingDebt: 2000000, // 200万债务
    nextRepaymentDate: '2026年07月15日',
    remainingRepayments: 4, // 剩余4次还款
  },
};

export const INITIAL_ACTRESSES: Actress[] = [
  {
    id: 'actress_1',
    name: '星野萌美',
    age: 20,
    stageName: 'Moe星野',
    occupation: '新人演员',
    bio: '业界新晋瞩目的超级新人，有着清澈透明的眼神与白皙娇嫩的肌肤。性格稍微有些保守害羞，但在镜头面前有着惊人的适应力。因为背负巨额家庭医疗债而被迫签署事务所合约。',
    isSigned: true,
    skill: 15,
    affection: 35,
    corruption: 10,
    pleasure: 0,
    stamina: 80,
    isMouthVirgin: true,
    isVaginaVirgin: true,
    isAnusVirgin: true,
    sexWithUser: 0,
    sexWithOthers: 0,
    zones: {
      mouth: 20,
      breasts: 30,
      vagina: 10,
      anus: 5,
      feet: 25,
    },
    specialFetishes: ['制服诱惑', '角色扮演', '温柔轻抚'],
    擅长题材: ['校园纯爱', '新星首秀', '温泉旅馆'],
    realtime: {
      clothes: {
        top: '纯白水手服上衣',
        bottom: '藏青色折褶百褶裙',
        bra: '纯棉浅粉色胸罩',
        panties: '同款浅粉棉质小裤',
        socks: '黑色及膝丝袜',
        shoes: '红棕色圆头皮鞋',
        accessories: '浅红蝴蝶结发卡',
      },
      bodyState: {
        mouth: '正常',
        breasts: '小巧匀称的微隆，顶端如粉红樱桃般娇嫩紧致，由于紧张微微颤抖。',
        feet: '白皙秀气的纤细足裸，足弓弧度优美，粉嫩的脚趾因羞涩而微微蜷缩。',
        vagina: '极其紧窄、娇羞闭合的粉润桃源，尚未经历过任何侵入，正渗出些许紧张的湿润。',
        anus: '紧闭如粉嫩花蕾般的绝对私密处，在薄透的布料下从未向任何人展示。',
      },
      isPresent: true,
      currentThought: '“...监督先生一直盯着我的裙子，是...是要准备开拍了吗？心跳得好厉害...”',
    },
  },
  {
    id: 'actress_2',
    name: '神崎美咲',
    age: 24,
    stageName: '美咲老师',
    occupation: '夜店舞者',
    bio: '曾是小有名气的时尚模特，因向往演艺多样性而主动跨界签约。性格外向热情，深谙男女调情之道。对性感和挑逗性极强的题材游刃有余，但内心深处却渴望遇到能够真正征服自己的监督。',
    isSigned: true,
    skill: 55,
    affection: 20,
    corruption: 45,
    pleasure: 0,
    stamina: 75,
    isMouthVirgin: false,
    isVaginaVirgin: false,
    isAnusVirgin: true,
    sexWithUser: 0,
    sexWithOthers: 12,
    zones: {
      mouth: 45,
      breasts: 50,
      vagina: 55,
      anus: 15,
      feet: 30,
    },
    specialFetishes: ['野外暴露', '逆向支配', '捆绑束缚'],
    擅长题材: ['职场OL', '熟女教调', '深夜私会'],
    realtime: {
      clothes: {
        top: '黑色半透蕾丝衬衫',
        bottom: '包臀包臀紧身一步短裙',
        bra: '黑色聚拢性感蕾丝Bra',
        panties: '配套超薄黑色丁字裤',
        socks: '网格魅惑黑丝吊带袜',
        shoes: '红色漆皮超高跟鞋',
        accessories: '极细水钻流苏项圈',
      },
      bodyState: {
        mouth: '正常',
        breasts: '丰满傲人的双峰，在半透衬衫下呼之欲出，暗红的晕尖随着呼吸高频起伏。',
        feet: '修长且保养得极好的玉足，脚趾甲涂抹着亮丽口红红油，散发着成熟诱人的香气。',
        vagina: '被高度开发、温热潮湿的蜜谷。因穿着丁字裤而摩擦得微红充血，流出粘稠透明的蜜汁。',
        anus: '娇柔纤细的褶皱隐秘地缩合在肥硕的丰臀缝隙，尚未被真正入侵开发。',
      },
      isPresent: false,
      currentThought: '“听说新来的监督手段很厉害？呵，真期待在镜头前被粗暴对待的滋味呢...”',
    },
  },
  {
    id: 'actress_3',
    name: '白川诗织',
    age: 21,
    stageName: 'Shiori诗织',
    occupation: '学生演员',
    bio: '清纯的大二音乐系学生，因被黑心贷款公司套路而被迫出卖演出权。自尊心极高，对成人拍摄有极强的抵触和抗拒感。在镜头前常常因为屈辱和羞耻而流泪，但这种“抗拒的绝美感”反而在市场上极具人气。',
    isSigned: false,
    skill: 0,
    affection: -15,
    corruption: 2,
    pleasure: 0,
    stamina: 90,
    isMouthVirgin: true,
    isVaginaVirgin: true,
    isAnusVirgin: true,
    sexWithUser: 0,
    sexWithOthers: 0,
    zones: {
      mouth: 5,
      breasts: 15,
      vagina: 5,
      anus: 0,
      feet: 40,
    },
    specialFetishes: ['蒙眼感官', '屈辱强制', '拘束放置'],
    擅长题材: ['催眠堕落', '抗拒凌辱', '拘束调教'],
    realtime: {
      clothes: {
        top: '淡蓝色宽松学生针织毛衣',
        bottom: '白色百褶裙',
        bra: '纯白棉质学生无钢圈内衣',
        panties: '边缘带有蕾丝花边的纯白内裤',
        socks: '白色棉质长统袜',
        shoes: '黑色平底制服鞋',
        accessories: '银质精致十字架项链',
      },
      bodyState: {
        mouth: '正常',
        breasts: '含苞待放般娇怯的胸部，小巧挺立，顶端缩成害羞的淡粉浅点。',
        feet: '被白袜紧紧包裹的柔嫩脚底，带有淡淡的茉莉清香。',
        vagina: '不可侵犯的至纯禁地，干燥而瑟瑟发抖地闭合，连周围的耻毛都显得柔顺而怯懦。',
        anus: '紧绷至极、从未遭受外界探求的敏感隐秘。',
      },
      isPresent: true,
      currentThought: '“...不、不要拍我！如果被学校里的同学看到...我、我的整个人生都会完蛋的...求求你放过我...”',
    },
  },
];

export const INITIAL_ACTORS: Actor[] = [
  {
    id: 'actor_1',
    name: '佐藤健一',
    age: 28,
    stageName: '健一老师',
    occupation: '合作男演员',
    bio: '业界金牌男优，号称“绝对不倒的金枪鱼”。为人老练温和，非常懂得在拍摄中照顾女优的感受与配合灯光走位。',
    stamina: 95,
    clothes: {
      top: '灰色休闲纯棉T恤',
      bottom: '运动速干黑色短裤',
      shoes: '黑色运动鞋',
    },
    currentThought: '正在确认现场灯光与走位。',
  },
  {
    id: 'actor_2',
    name: '高桥大介',
    age: 35,
    stageName: '暗黑神龙',
    occupation: '资深男演员',
    bio: '擅长出演狂野、反派、强烈教调题材的粗犷派老手。浑身散发着压迫性的荷尔蒙，能在压迫感极强的戏份中带起女优的堕落快感。',
    stamina: 80,
    clothes: {
      top: '黑色皮夹克无袖衬衫',
      bottom: '深色紧身牛仔裤',
      shoes: '黑色短靴',
    },
    currentThought: '在等待拍摄企划确认。',
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  // 正常商品
  {
    id: 'shop_1',
    name: '功能性维生素饮料',
    category: 'normal',
    price: 300,
    description: '富含电解质与人参提取物的能量饮料。可迅速为脱力的人员恢复体能。',
    icon: '🥤',
    effects: [
      { target: 'actress', stat: 'stamina', value: 30, text: '女优体力值 +30' },
      { target: 'actor', stat: 'stamina', value: 40, text: '男优体力值 +40' },
    ],
  },
  {
    id: 'shop_2',
    name: '高级草莓千层蛋糕',
    category: 'normal',
    price: 1500,
    description: '香甜浓郁的高级甜品，少女最爱。能有效治愈焦虑，提升好感度并舒缓情绪。',
    icon: '🍰',
    effects: [
      { target: 'actress', stat: 'affection', value: 15, text: '女优好感度 +15' },
      { target: 'actress', stat: 'stamina', value: 10, text: '女优体力值 +10' },
    ],
  },
  {
    id: 'shop_3',
    name: '香熏精油洗浴套装',
    category: 'normal',
    price: 3500,
    description: '具有深度放松身心作用的高档精油，可在沐浴时使用，极受女优好评。',
    icon: '🧴',
    effects: [{ target: 'actress', stat: 'affection', value: 20, text: '女优好感度 +20' }],
  },

  // 成人商品
  {
    id: 'shop_4',
    name: '粉红媚药春药香氛',
    category: 'adult',
    price: 6000,
    description: '含有高纯度催情费洛蒙的室内香薰，能让闻到的人呼吸急促、产生强烈的性冲动。',
    icon: '🧪',
    effects: [{ target: 'actress', stat: 'corruption', value: 5, text: '女优堕落度 +5' }],
  },
  {
    id: 'shop_5',
    name: '催情春药果冻(特效)',
    category: 'adult',
    price: 12000,
    description: '黑市特供的高效催情药物，食用后小腹发热、体表泛红、极度渴望身体接触与交欢。',
    icon: '🍮',
    effects: [
      { target: 'actress', stat: 'pleasure', value: 30, text: '当前快感即时值 +30' },
      { target: 'actress', stat: 'corruption', value: 10, text: '女优堕落度 +10' },
    ],
  },

  // 衣服
  {
    id: 'shop_6',
    name: '性感蕾丝女仆装',
    category: 'clothing',
    price: 8000,
    description: '超短设计的法式女仆裙，带有薄透的白色蕾丝荷叶边和低胸剪裁。极适合角色扮演拍摄。',
    icon: '👗',
    effects: [
      { target: 'actress', stat: 'clothing_set', value: 1, text: '解锁女仆装扮 (换上后提升特定题材销量)' },
      { target: 'actress', stat: 'corruption', value: 5, text: '女优堕落度 +5' },
    ],
  },
  {
    id: 'shop_7',
    name: '蕾丝挂脖开档情趣内衣',
    category: 'clothing',
    price: 15000,
    description: '仅遮挡最关键部位的蛛网状紫色情趣内衣，带有透明开档和无缝吊带设计。极度羞耻。',
    icon: '👙',
    effects: [
      { target: 'actress', stat: 'clothing_set_extreme', value: 1, text: '换装后，敏感点开发速度与极度快感大幅提升' },
      { target: 'actress', stat: 'corruption', value: 15, text: '女优堕落度 +15' },
    ],
  },

  // 道具
  {
    id: 'shop_8',
    name: '粉红兔子跳弹(静音振动)',
    category: 'prop',
    price: 4500,
    description: '可以通过手机APP远程精准控制频段和震幅的情趣跳弹，适合现场或外出暴露教调。',
    icon: '🐇',
    effects: [
      { target: 'actress', stat: 'pleasure', value: 15, text: '快感值 +15' },
      { target: 'actress', stat: 'zone_vagina', value: 5, text: '小穴敏感度开发度 +5' },
    ],
  },
  {
    id: 'shop_9',
    name: '双端异形按摩震动棒',
    category: 'prop',
    price: 9000,
    description: '触手状纹路的高仿真硅胶按摩器，两端可同时大振幅震动，能够对敏感带进行深度强烈的摧残式开发。',
    icon: '🍆',
    effects: [
      { target: 'actress', stat: 'pleasure', value: 40, text: '快感值 +40' },
      { target: 'actress', stat: 'corruption', value: 12, text: '堕落度 +12' },
      { target: 'actress', stat: 'zone_vagina', value: 15, text: '小穴敏感度 +15' },
      { target: 'actress', stat: 'zone_anus', value: 10, text: '屁穴敏感度 +10' },
    ],
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item_1',
    name: '功能性维生素饮料',
    category: 'consumable',
    quantity: 3,
    description: '富含电解质与人参提取物的能量饮料。可迅速为脱力的人员恢复体能。',
    effects: [
      { target: 'actress', stat: 'stamina', value: 30, text: '女优体力值 +30' },
      { target: 'actor', stat: 'stamina', value: 40, text: '男优体力值 +40' },
    ],
  },
  {
    id: 'item_2',
    name: '高级草莓千层蛋糕',
    category: 'consumable',
    quantity: 1,
    description: '香甜浓郁的高级甜品，少女最爱。能有效治愈焦虑，提升好感度并舒缓情绪。',
    effects: [
      { target: 'actress', stat: 'affection', value: 15, text: '女优好感度 +15' },
      { target: 'actress', stat: 'stamina', value: 10, text: '女优体力值 +10' },
    ],
  },
  {
    id: 'item_8',
    name: '粉红兔子跳弹(静音振动)',
    category: 'toy',
    quantity: 1,
    description: '可以通过手机APP远程精准控制频段和震幅的情趣跳弹，适合现场或外出暴露教调。',
    effects: [
      { target: 'actress', stat: 'pleasure', value: 15, text: '快感值 +15' },
      { target: 'actress', stat: 'zone_vagina', value: 5, text: '小穴敏感度开发度 +5' },
    ],
  },
];

export const PREDEFINED_SCRIPTS: PredefinedScript[] = [
  {
    id: 'script_1',
    title: '放学后的钢琴教室 · 纯真之吻',
    description:
      '安静的钢琴教室里，暗恋监督的少女正在弹琴。监督在背后抚摸她颤抖的手指，进行第一次轻吻，以及裙摆下不可言说的温柔触碰。纯爱向神作，适合高好感度女优。',
    requiredActorsCount: 1,
    requiredActressesCount: 1,
    matchingThemes: ['校园纯爱', '制服诱惑', '初恋'],
    baseQuality: 85,
  },
  {
    id: 'script_2',
    title: '深夜霸道总裁的绝对命令',
    description:
      '空无一人的深夜办公室里，冷酷的总裁对加班的OL女下属进行职场支配，从解开衬衫扣子开始，一步步突破防线进行羞耻屈辱的侵犯。虐袭支配向，适合高堕落度女优。',
    requiredActorsCount: 1,
    requiredActressesCount: 1,
    matchingThemes: ['职场OL', '逆向支配', '屈辱强制'],
    baseQuality: 78,
  },
  {
    id: 'script_3',
    title: '催眠静止世界里的放纵少女',
    description:
      '获得了神奇催眠手表的男主角，让任性的大小姐陷入静止时间，将原本高高在上的少女彻底开发堕落。时间静止与催眠妄想，属于高堕落题材，在暗黑市场上极受欢迎。',
    requiredActorsCount: 1,
    requiredActressesCount: 1,
    matchingThemes: ['催眠堕落', '时间静止', '大小姐'],
    baseQuality: 90,
  },
];

export const THEME_WORD_BANK = {
  weeklyHot: ['校园纯爱', '职场OL', '催眠堕落', '捆绑教调'],
  privateRequests: [
    { theme: '时间静止', rewardBonus: 1.5, desc: '神秘富豪指名点播：要求有高对比的屈辱挣扎细节，奖励1.5倍资金。' },
    {
      theme: '逆向支配',
      rewardBonus: 1.8,
      desc: '暗黑俱乐部超级贵宾私人委托：需要强悍的女王向男优下达逆教调指令，1.8倍高额佣金！',
    },
  ],
  topSellers: ['职场OL', '制服诱惑', '校园纯爱'],
};

export const INITIAL_PAST_WORKS: PastWork[] = [
  {
    id: 'work_old_1',
    workName: '美咲老师的深夜特别授课',
    actors: ['健一老师'],
    actresses: ['神崎美咲'],
    theme: '深夜私会',
    rating: 8.4,
    profit: 320000,
    evaluation:
      '美咲老师不愧是老手，在办公室里的丝袜挑逗一幕堪称教科书级别的诱惑！画面张力十足，男优健一的精湛演技与女优配合默契。预计首周内票房完美大卖！',
    releaseDay: 1,
    isProfitWindowActive: false,
    daysSinceRelease: 10,
  },
  {
    id: 'work_old_2',
    workName: '星野首秀 · 初次相遇的水手服',
    actors: ['健一老师'],
    actresses: ['星野萌美'],
    theme: '新星首秀',
    rating: 9.1,
    profit: 480000,
    evaluation:
      '星野萌美的羞涩和极度的紧张感简直是艺术品！镜头前她颤抖的指尖与泛红的肌肤彻底戳中了影迷们的保护欲，处女首秀卖点完美引爆！业界一致给予超高评分。',
    releaseDay: 5,
    isProfitWindowActive: true,
    daysSinceRelease: 3,
  },
];
