
import { TokenSplashEvent, CalculationResult } from "../types";

export function calculateMetrics(event: TokenSplashEvent): CalculationResult {
  const isUsdtReward = event.rewardType === 'USDT';
  
  // 奖池总价值 (USDT)
  const totalPoolUsdt = isUsdtReward ? event.totalTokens : event.totalTokens * event.tokenPrice;
  const totalCost = (event.requiredVolume / 100) * event.lossPer100;

  // 1. 基础平均逻辑 (作为保底参考)
  const rewardPerPerson = event.totalTokens / Math.max(event.currentParticipants, 1);
  const rewardUsdt = isUsdtReward ? rewardPerPerson : rewardPerPerson * event.tokenPrice;
  
  // 2. 比例反推
  const myRewardCount = event.currentMyReward || rewardPerPerson;
  const myRewardUsdt = isUsdtReward ? myRewardCount : myRewardCount * event.tokenPrice;
  
  const myShare = (myRewardCount / event.totalTokens) * 100;
  const efficiency = myRewardCount / (event.requiredVolume / 100 || 1); // 每100U换多少奖励(币或U)
  
  const actualNetProfit = myRewardUsdt - totalCost;
  const roi = (actualNetProfit / (totalCost || 0.01)) * 100;
  
  // 3. 核心：边际收益 (再刷100U赚多少)
  const marginalRewardValue = isUsdtReward ? efficiency : efficiency * event.tokenPrice;
  const marginalProfit100 = marginalRewardValue - event.lossPer100;

  // 4. 稀释风险
  const dilutionScale = 10 / 11; 

  // 5. 盈亏平衡与安全边际
  const breakEvenUsers = totalPoolUsdt / (totalCost || 0.0001);
  const safetyMargin = ((breakEvenUsers - event.currentParticipants) / event.currentParticipants) * 100;

  // 6. 科学评估逻辑
  let rec: CalculationResult['recommendation'];
  if (marginalProfit100 < 0) {
    rec = { action: 'STOP', reason: '边际负收益！增加交易量只会让亏损扩大，建议立即停止刷量。' };
  } else if (actualNetProfit < 0) {
    rec = { action: 'EXIT', reason: '当前预估处于亏损状态，且人数可能继续增长，建议止损或密切观察。' };
  } else if (safetyMargin < 15) {
    rec = { action: 'HOLD', reason: '利润空间非常窄，人数稍微增加就会变亏损，不建议继续投入。' };
  } else if (marginalProfit100 > event.lossPer100 * 1.5) {
    rec = { action: 'ADD', reason: '边际回报健康，可以考虑适当增加交易额以抢占更多份额。' };
  } else {
    rec = { action: 'HOLD', reason: '目前收益结构稳定，建议维持现状，注意观察人数变动。' };
  }

  let status: CalculationResult['status'] = 'LOSS';
  if (actualNetProfit > 0) {
    if (roi > 100 && safetyMargin > 40) status = 'EXCELLENT';
    else if (roi > 20) status = 'GOOD';
    else status = 'RISKY';
  } else {
    status = 'LOSS';
  }

  return {
    rewardPerPerson,
    rewardUsdt: myRewardUsdt,
    totalCost,
    netProfit: actualNetProfit,
    roi,
    breakEvenUsers,
    safetyMargin,
    myShare,
    estTotalVolume: event.requiredVolume / (myShare / 100 || 0.0001),
    efficiency,
    marginalProfit100,
    dilutionScale,
    recommendation: rec,
    status
  };
}
