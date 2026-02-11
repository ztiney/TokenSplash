
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
  // 如果奖励是USDT，efficiency就是U；如果奖励是币，efficiency * 币价 = U
  const marginalRewardValue = isUsdtReward ? efficiency : efficiency * event.tokenPrice;
  const marginalProfit100 = marginalRewardValue - event.lossPer100;

  // 4. 稀释风险
  const dilutionScale = 10 / 11; 

  // 5. 盈亏平衡与安全边际
  const breakEvenUsers = totalPoolUsdt / (totalCost || 0.0001);
  const safetyMargin = ((breakEvenUsers - event.currentParticipants) / event.currentParticipants) * 100;

  // 6. 科学评估逻辑
  let rec: CalculationResult['recommendation'];
  
  // 优先级修正：如果边际收益是负的，无论当前是否盈利，都必须叫停，因为刷越多亏越多（或赚得越少）
  if (marginalProfit100 < 0) {
    rec = { action: 'STOP', reason: `每刷100U亏损 $${Math.abs(marginalProfit100).toFixed(2)}。再刷会吞噬利润，请立即停手！` };
  } else if (actualNetProfit < 0) {
    rec = { action: 'EXIT', reason: '当前处于净亏损状态，建议止损观望。' };
  } else if (safetyMargin < 15) {
    rec = { action: 'HOLD', reason: '利润空间极窄，建议锁仓不动。' };
  } else if (marginalProfit100 > event.lossPer100 * 1.5) {
    rec = { action: 'ADD', reason: '单位投入产出比优秀，建议增加交易量抢占份额。' };
  } else {
    rec = { action: 'HOLD', reason: '收益结构尚可，建议维持现状。' };
  }

  let status: CalculationResult['status'] = 'LOSS';
  if (actualNetProfit > 0) {
    if (roi > 100 && safetyMargin > 40 && marginalProfit100 > 0) status = 'EXCELLENT';
    else if (roi > 20 && marginalProfit100 > 0) status = 'GOOD';
    else status = 'RISKY';
  } else {
    status = 'LOSS';
  }

  // 再次强制修正：如果边际是负的，状态最多只能是 RISKY，不能是 GOOD
  if (marginalProfit100 < 0 && status !== 'LOSS') {
      status = 'RISKY';
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
