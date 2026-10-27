// Explanations of implemented demo behaviour. These are not user-study results.
const L=(zh,en)=>({zh,en});
export const mechanisms={
  trust:{
    title:L('把分数送回复核','Bring a score back to review'),
    steps:[
      [L('保留原始裁判','Keep the original judge'),L('样本、模型、运行与原始评分一同保留。','Keep the sample, model, run and original scores together.')],
      [L('核对具体依据','Check the evidence'),L('从低分和引句回到原文；定位失败也保留。','Locate a low score’s quotation in the source; keep failed matches visible.')],
      [L('另记人工判断','Record human judgement'),L('同意、不同意或待补充，不覆盖原始结果。','Agree, disagree or ask for more evidence without overwriting the result.')],
    ],
    boundary:L('找到引句，只证明这句话存在；结论是否成立仍需复核。','A located quotation proves the words exist. The conclusion still needs review.'),
  },
  taste:{
    title:L('一次喜欢，怎样成为记忆','From a choice to a memory'),
    steps:[
      [L('一次选择','A choice'),L('先留下偏好线索，不推断整张海报的所有特征。','Save a clue without inferring a preference for every feature.')],
      [L('只改变一项','One variable'),L('相同内容，对照字体、留白或色彩中的一项。','Keep the content and compare just type, spacing or colour.')],
      [L('本人确认范围','A scope the person chooses'),L('决定在哪个场景记住；允许修改、冲突和撤回。','Choose where it applies, with changes, conflicts and undo supported.')],
    ],
    boundary:L('没有确认的线索不变成全局规则；新证据也可能让旧偏好失效。','An unconfirmed clue is not a global rule. New evidence can challenge an old preference.'),
  },
  'shared-choice':{
    title:L('把预演与同意分开','A preview is not consent'),
    steps:[
      [L('各自确认条件','Confirm constraints'),L('预算、距离、忌口由角色本人确认。','Each simulated person confirms budget, distance and dietary limits.')],
      [L('无交集先预演','Preview a conflict'),L('只试本人愿意调整的条件，草稿不会直接生效。','Try only voluntary changes; a draft does not apply itself.')],
      [L('同版逐人确认','Confirm the same version'),L('应用后重新检查；每个角色接受当前版本才形成决定。','Recheck after applying changes; every role accepts the current version.')],
    ],
    boundary:L('条件变化后旧确认不能复用。公开体验是单人扮演多角色，未接入真实多人。','A changed version invalidates old confirmations. The public demo is a single-person role simulation.'),
  },
  bundles:{
    title:L('同一个套餐，两种结论','One bundle, two outcomes'),
    assumptions:L('模型算例：原价 20，套餐价 18，原有平均消费 12；20% 已买齐，食材成本率 40%，既有顾客全领折扣。','Model example: list 20, bundle 18, original spend 12; 20% already buy both, cost ratio 40%, all existing buyers redeem.'),
    scenarios:[
      {adoption:'50%',gain:'1.60',loss:'0.40',net:'+1.20',positive:true},
      {adoption:'5%',gain:'0.16',loss:'0.40',net:'−0.24',positive:false},
    ],
    boundary:L('未买齐者的采纳率改变，净增贡献就会转负；共购强度不能替代这个判断。数值为模型推演，不是真实增长。','Lower adoption among incomplete-basket buyers turns contribution negative. Association cannot replace this calculation. These are model outputs, not observed growth.'),
  },
};

// All entries remain in the static HTML; the rest sit in a native disclosure.
export const libraryPrimary=['taste','suibianju','grounded','eval','filing','bundle'];
