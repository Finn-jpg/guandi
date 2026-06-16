// AI 解签 · 问事门类配置(传统关帝灵签问事门类)
// 交互:第 1 题为快捷选项(chips,必答),后两题为选填短文本,降低移动端门槛。
// 注:已去掉「诉讼」门类——预测官司输赢涉法律风险,不引导。

export interface TopicQuestion {
  ask: string
  type: 'chips' | 'text'
  options?: string[] // type 为 chips 时提供
  required?: boolean
}

export interface Topic {
  id: string
  label: string
  questions: TopicQuestion[]
}

export const TOPICS: Topic[] = [
  {
    id: 'yunshi',
    label: '运势',
    questions: [
      {
        ask: '想问哪方面的整体运势?',
        type: 'chips',
        options: ['近期', '今年', '某件事'],
        required: true,
      },
      { ask: '心里隐约担心或期待的是什么?', type: 'text' },
      { ask: '有没有一件最近一直放不下的事?', type: 'text' },
    ],
  },
  {
    id: 'jiating',
    label: '家庭',
    questions: [
      {
        ask: '想问和谁之间的关系?',
        type: 'chips',
        options: ['父母', '伴侣', '子女', '手足'],
        required: true,
      },
      { ask: '最近家里发生了什么让你在意的事?', type: 'text' },
      { ask: '你希望这段关系朝哪个方向变化?', type: 'text' },
    ],
  },
  {
    id: 'caili',
    label: '财利',
    questions: [
      {
        ask: '想问哪类财务?',
        type: 'chips',
        options: ['收入', '投资', '借贷', '偏财'],
        required: true,
      },
      { ask: '正在做或考虑的具体决定是什么?', type: 'text' },
      { ask: '你对这件事的预期和顾虑大概是怎样的?', type: 'text' },
    ],
  },
  {
    id: 'shiye',
    label: '事业',
    questions: [
      {
        ask: '你现在的处境是?',
        type: 'chips',
        options: ['找工作', '在职', '创业', '转行'],
        required: true,
      },
      { ask: '最近遇到的最大瓶颈或选择是什么?', type: 'text' },
      { ask: '理想中半年后的状态是什么样?', type: 'text' },
    ],
  },
  {
    id: 'shengqian',
    label: '升迁',
    questions: [
      {
        ask: '正在争取的是什么机会?',
        type: 'chips',
        options: ['晋升', '调岗', '重要项目'],
        required: true,
      },
      { ask: '最大的不确定来自哪里?(上级 / 竞争者 / 自身)', type: 'text' },
      { ask: '为这次机会你已经做了哪些准备?', type: 'text' },
    ],
  },
  {
    id: 'yinyuan',
    label: '姻缘',
    questions: [
      {
        ask: '你现在的情感状态是?',
        type: 'chips',
        options: ['单身', '暧昧', '恋爱', '婚姻'],
        required: true,
      },
      { ask: '想问某个具体的人,还是整体姻缘走向?', type: 'text' },
      { ask: '这段感情里你最在意或最困惑的是什么?', type: 'text' },
    ],
  },
  {
    id: 'kaoshi',
    label: '考试',
    questions: [
      {
        ask: '要参加的是什么考试?',
        type: 'chips',
        options: ['升学', '资格证', '求职', '公考'],
        required: true,
      },
      { ask: '距离考试还有多久,目前准备得如何?', type: 'text' },
      { ask: '最担心的是哪一部分?', type: 'text' },
    ],
  },
  {
    id: 'jiankang',
    label: '健康',
    questions: [
      {
        ask: '想问的是自己还是身边人的健康?',
        type: 'chips',
        options: ['自己', '身边人'],
        required: true,
      },
      { ask: '最近身体或情绪上有什么让你在意的变化?', type: 'text' },
      { ask: '是已经在面对的状况,还是想问未来的趋势?', type: 'text' },
    ],
  },
  {
    id: 'yuanxing',
    label: '远行',
    questions: [
      {
        ask: '这次远行的目的是?',
        type: 'chips',
        options: ['旅行', '工作', '求学', '移居'],
        required: true,
      },
      { ask: '现在最犹豫或最担心的是什么?', type: 'text' },
      { ask: '出发的时间和方向定下来了吗?', type: 'text' },
    ],
  },
  {
    id: 'shiwu',
    label: '失物',
    questions: [
      { ask: '你遗失的是什么东西?', type: 'text', required: true },
      { ask: '大概在什么时间、什么场合发现不见的?', type: 'text' },
      { ask: '对它的去向有没有一点印象或猜测?', type: 'text' },
    ],
  },
  {
    id: 'zisi',
    label: '子嗣',
    questions: [
      { ask: '想问的是?', type: 'chips', options: ['求子', '孕事', '孩子状况'], required: true },
      { ask: '目前正处在哪个阶段?', type: 'text' },
      { ask: '这件事上你最大的期盼或顾虑是什么?', type: 'text' },
    ],
  },
  {
    id: 'guiren',
    label: '贵人',
    questions: [
      {
        ask: '想问哪段关系?',
        type: 'chips',
        options: ['合作', '朋友', '同事', '长辈'],
        required: true,
      },
      { ask: '最近这段关系里发生了什么?', type: 'text' },
      { ask: '你希望从对方那里得到什么样的回应或帮助?', type: 'text' },
    ],
  },
]

// 全局选填:无论选哪个门类都可补充
export const FREEFORM_PROMPT = '还有什么想对神明说的?写得越具体,解签越贴切。(选填)'
