// Capability keywords remain local. Evidence comes from the same data.json as the portfolio.
const JD_GRAPH = {
  "dims": [
    {
      "id": "llm-product",
      "name": "AI / 大模型应用产品设计",
      "weight": 2,
      "level": "have",
      "kw": [
        "ai产品",
        "ai 产品",
        "大模型",
        "llm",
        "aigc",
        "生成式",
        "智能体",
        "agent",
        "gpt",
        "多模态",
        "ai应用",
        "ai 应用",
        "aigc产品",
        "人工智能",
        "ai能力",
        "ai 能力",
        "模型能力",
        "大语言模型"
      ],
      "ev": []
    },
    {
      "id": "agent-workflow",
      "name": "Agent 工作流 / 流程编排",
      "weight": 2,
      "level": "have",
      "kw": [
        "工作流",
        "workflow",
        "编排",
        "agent",
        "智能体",
        "自动化",
        "流程设计",
        "rpa",
        "工具链",
        "copilot",
        "智能助手"
      ],
      "ev": []
    },
    {
      "id": "prompt-eval",
      "name": "Prompt 工程与效果评估体系",
      "weight": 2,
      "level": "have",
      "kw": [
        "prompt",
        "提示词",
        "效果评估",
        "评测",
        "评估体系",
        "eval",
        "badcase",
        "bad case",
        "模型效果",
        "质量评估",
        "打分",
        "标注",
        "调优",
        "指标体系",
        "效果度量"
      ],
      "ev": []
    },
    {
      "id": "data-analysis",
      "name": "数据分析 / SQL / 归因",
      "weight": 2,
      "level": "have",
      "kw": [
        "sql",
        "数据分析",
        "埋点",
        "数据驱动",
        "指标",
        "看板",
        "bi",
        "python",
        "归因",
        "漏斗",
        "数据洞察",
        "报表",
        "取数",
        "数据能力",
        "dashboard",
        "用户行为"
      ],
      "ev": []
    },
    {
      "id": "ab-test",
      "name": "A/B 实验与策略验证",
      "weight": 2,
      "level": "have",
      "kw": [
        "a/b",
        "ab test",
        "abtest",
        "ab测试",
        "a/b test",
        "实验",
        "灰度",
        "对照组",
        "策略验证",
        "假设验证",
        "小流量",
        "实验设计"
      ],
      "ev": []
    },
    {
      "id": "growth",
      "name": "用户增长",
      "weight": 2,
      "level": "have",
      "kw": [
        "增长",
        "growth",
        "拉新",
        "留存",
        "转化率",
        "获客",
        "用户增长",
        "活跃",
        "dau",
        "mau",
        "渗透率",
        "召回",
        "促活",
        "裂变",
        "分享率",
        "曝光"
      ],
      "ev": []
    },
    {
      "id": "monetization",
      "name": "商业化 / 订阅付费",
      "weight": 2,
      "level": "have",
      "kw": [
        "商业化",
        "变现",
        "付费",
        "订阅",
        "arpu",
        "ltv",
        "会员",
        "营收",
        "定价",
        "客单价",
        "roi",
        "收入",
        "gmv",
        "付费转化",
        "货币化",
        "monetization",
        "促销",
        "优惠券",
        "补贴"
      ],
      "ev": []
    },
    {
      "id": "user-research",
      "name": "用户研究与需求洞察",
      "weight": 1,
      "level": "have",
      "kw": [
        "用户研究",
        "用户洞察",
        "调研",
        "访谈",
        "用户需求",
        "用户画像",
        "voc",
        "需求挖掘",
        "场景洞察",
        "痛点",
        "用研",
        "走访"
      ],
      "ev": []
    },
    {
      "id": "prd",
      "name": "PRD 与需求落地",
      "weight": 2,
      "level": "have",
      "kw": [
        "prd",
        "需求文档",
        "产品文档",
        "需求梳理",
        "方案设计",
        "原型",
        "流程图",
        "需求拆解",
        "产品设计",
        "功能设计",
        "需求评审",
        "mrd",
        "产品方案"
      ],
      "ev": []
    },
    {
      "id": "cross-team",
      "name": "跨团队协作与项目推进",
      "weight": 1,
      "level": "have",
      "kw": [
        "跨部门",
        "跨团队",
        "协作",
        "推动",
        "落地",
        "项目管理",
        "排期",
        "对齐",
        "沟通",
        "协同",
        "拉通",
        "推进",
        "owner",
        "统筹"
      ],
      "ev": []
    },
    {
      "id": "toc",
      "name": "C 端产品经验",
      "weight": 2,
      "level": "have",
      "kw": [
        "c端",
        "toc",
        "to c",
        "消费者",
        "app",
        "用户体验",
        "社区",
        "内容产品",
        "互联网产品",
        "移动端",
        "客户端",
        "ugc",
        "短视频",
        "小程序"
      ],
      "ev": []
    },
    {
      "id": "content-ops",
      "name": "内容 / 社媒运营",
      "weight": 1,
      "level": "have",
      "kw": [
        "内容运营",
        "社媒",
        "小红书",
        "抖音",
        "kol",
        "mcn",
        "种草",
        "投放",
        "账号矩阵",
        "公域",
        "私域",
        "达人",
        "短视频运营",
        "内容策略",
        "新媒体"
      ],
      "ev": []
    },
    {
      "id": "overseas",
      "name": "海外市场 / 英语工作语言",
      "weight": 1,
      "level": "have",
      "kw": [
        "海外",
        "出海",
        "国际化",
        "英语",
        "english",
        "跨境",
        "全球",
        "多语言",
        "bilingual",
        "外语",
        "本地化",
        "localization",
        "东南亚",
        "中东",
        "欧美"
      ],
      "ev": []
    },
    {
      "id": "tech",
      "name": "技术理解 / 动手能力",
      "weight": 1,
      "level": "have",
      "kw": [
        "技术背景",
        "代码",
        "python",
        "api",
        "算法",
        "工程",
        "技术理解",
        "懂技术",
        "编程",
        "开发",
        "技术方案",
        "架构",
        "写代码"
      ],
      "ev": []
    },
    {
      "id": "finance",
      "name": "金融 / 支付业务理解",
      "weight": 1,
      "level": "have",
      "kw": [
        "金融",
        "支付",
        "fintech",
        "银行",
        "证券",
        "基金",
        "保险",
        "风控",
        "投研",
        "财报",
        "估值",
        "信贷",
        "理财",
        "交易"
      ],
      "ev": []
    },
    {
      "id": "hardware",
      "name": "智能硬件 / 车机座舱",
      "weight": 1,
      "level": "have",
      "kw": [
        "车机",
        "座舱",
        "智能座舱",
        "车载",
        "硬件",
        "iot",
        "物联网",
        "ota",
        "嵌入式",
        "智能设备",
        "语音交互",
        "车企",
        "新能源"
      ],
      "ev": []
    },
    {
      "id": "edu-bg",
      "name": "学历背景要求",
      "weight": 1,
      "level": "have",
      "kw": [
        "硕士",
        "研究生",
        "本科",
        "学历",
        "985",
        "211",
        "qs",
        "海外院校",
        "名校",
        "双一流",
        "统招",
        "master",
        "bachelor"
      ],
      "ev": []
    },
    {
      "id": "tob-saas",
      "name": "B 端 / SaaS 产品",
      "weight": 2,
      "level": "partial",
      "kw": [
        "b端",
        "tob",
        "to b",
        "saas",
        "企业服务",
        "中后台",
        "工作台",
        "内部系统",
        "效率工具",
        "商家端",
        "供给侧",
        "crm",
        "erp",
        "paas"
      ],
      "note": "有企业知识库、智能客服及 ERP/CRM 轻量交付经验；标准化多租户 SaaS 经验未在当前简历中列出。",
      "ev": []
    },
    {
      "id": "algo",
      "name": "算法研发 / 模型训练",
      "weight": 1,
      "level": "gap",
      "kw": [
        "算法工程师",
        "模型训练",
        "微调",
        "finetune",
        "fine-tune",
        "sft",
        "rlhf",
        "预训练",
        "深度学习",
        "pytorch",
        "模型部署",
        "推理优化",
        "强化学习",
        "训练数据"
      ],
      "note": "我是产品侧，不是算法侧。能和算法团队对齐目标、定评估口径、拆 badcase，但不写训练代码。",
      "ev": []
    },
    {
      "id": "ecommerce",
      "name": "电商 / 直播带货",
      "weight": 1,
      "level": "partial",
      "kw": [
        "电商",
        "直播带货",
        "货架",
        "供应链",
        "选品",
        "履约",
        "物流",
        "仓储",
        "店铺",
        "带货",
        "双11",
        "大促"
      ],
      "note": "有选品、竞品比较与小规模测款工具交付，也做过外卖商品供给；大型货架电商、直播带货及履约经验未在当前简历中列出。",
      "ev": []
    },
    {
      "id": "game",
      "name": "游戏产品",
      "weight": 1,
      "level": "gap",
      "kw": [
        "游戏",
        "手游",
        "关卡",
        "数值策划",
        "玩法设计",
        "氪金",
        "抽卡",
        "moba",
        "rpg",
        "游戏化"
      ],
      "note": "做过带玩法属性的娱乐功能（命理馆、人格测试），但没做过真正的游戏产品。",
      "ev": []
    },
    {
      "id": "team-mgmt",
      "name": "团队管理经验",
      "weight": 1,
      "level": "partial",
      "kw": [
        "团队管理",
        "带团队",
        "管理经验",
        "下属",
        "招聘",
        "绩效",
        "leader",
        "团队负责人",
        "管理岗"
      ],
      "note": "带过 8 人内容团队并沉淀 SOP；产品研发团队管理经验未在当前简历中列出。",
      "ev": []
    }
  ],
  "seniority": {
    "fullTimeSince": "2026.06",
    "graduated": "2026.01",
    "internships": 5,
    "text": "2026.06 起从事全职 AI 产品工作，另有 AI 产品、海外增长与智能座舱实习经历。"
  },
  "resumeReady": false
};

function applyResumeEvidence(profile) {
  const catalogue = profile.evidenceCatalog || {};
  const dimensions = profile.jdEvidence || {};
  JD_GRAPH.dims.forEach((dim) => {
    dim.ev = (dimensions[dim.id] || []).map((key) => catalogue[key]).filter(Boolean);
  });
  JD_GRAPH.resumeReady = true;
}
