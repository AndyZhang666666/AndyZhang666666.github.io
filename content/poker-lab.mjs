// Poker Lab's public description. Kept separate so future content regeneration preserves it.
export const pokerLabMetadata = {
  name:'Poker Lab · 手牌与训练', nameEn:'Poker Lab · Equity & Practice',
  description:'按牌面算权益，按位置练开池，把错题留到下次。',
  descriptionEn:'Calculate card equity, practise opening ranges and revisit mistakes.',
  subtitle:'真实算牌、范围训练与错题重练',
  subtitleEn:'Card equity, range practice and mistake review',
  tags:['德州扑克','概率计算','训练与复盘'],
  metrics:['真实牌面 · 加权范围','30 手基础题 · 可改参考','错题快照 · 本机备份'],
  metricsEn:['Real cards & weighted ranges','30 teaching hands & editable charts','Versioned mistakes & local backup'],
  context:'会用一个胜率数字，不等于能解释它的范围假设；练习后的偏离也需要能回到当时的依据。',
  contextEn:'An equity number needs a range assumption, and a practice mistake needs the reference used at the time.',
  approach:[
    '在原 EV 工具上接入牌型评估，加入范围权重、已知牌排除、精确枚举与可复现抽样。',
    '将位置参考、范围编辑和开池练习接成连续流程，按实际两张牌组合生成随机题。',
    '错题保存当时的范围版本，支持重练、归档和备份；修改新参考不会改写旧题。',
  ],
  approachEn:[
    'Extend the existing EV tool with hand evaluation, weighted ranges, card removal, exact enumeration and reproducible sampling.',
    'Connect positional charts, range editing and opening drills, sampling physical two-card holdings.',
    'Keep each mistake tied to its original chart, with review, archiving and backup.',
  ],
  result:'公开版在浏览器本地计算与保存。保留原 EV 沙盘；教学参考、抽样误差和完整策略的区别在界面与方法中说明。牌型引擎使用 phe，矩阵交互参考 Preflop Range Trainer，新增集成与验证记录随源码公开。',
  resultEn:'The public app computes and stores records locally, retains the original EV sandbox and explains its study scope. It uses phe and adapts matrix interaction from Preflop Range Trainer; integration and validation are documented in the source.',
};
