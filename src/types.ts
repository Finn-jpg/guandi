export interface Sign {
  no: number          // 1-100
  ganzhi: string      // 干支,如 "甲甲"
  fortune: string     // 吉凶等级,如 "大吉"/"中吉"/"下下"
  poem: string        // 签诗
  jieyue?: string     // 解曰(白话)
  duanyue?: string    // 断曰(运势/姻缘/财利…分类)
  shengyi?: string    // 圣意
  shiyi?: string      // 释义
  jieqian?: string    // 解签
  dongpo?: string     // 东坡解
  bixian?: string     // 碧仙注
  story?: string      // 相关故事/典故
}

// 掷筊结果:圣筊(应允) / 笑筊(再请) / 阴筊(不允)
export type JiaoResult = 'sheng' | 'xiao' | 'yin'

// 单只筊杯:yang=阳(平面朝上) / yin=阴(隆起朝上)
export type CupFace = 'yang' | 'yin'

// 仪式阶段
export type Stage = 'welcome' | 'ask' | 'draw' | 'confirm' | 'result' | 'closing'
