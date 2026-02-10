
export interface HistorySnapshot {
  timestamp: number;
  netProfit: number;
  participants: number;
}

export type RewardType = 'TOKEN' | 'USDT';

export interface TokenSplashEvent {
  id: string;
  tokenName: string;
  totalTokens: number;      // 奖池代币总数（若奖励类型为USDT，则为USDT总数）
  tokenPrice: number;       // 当前币价 (USDT)
  currentParticipants: number; 
  requiredVolume: number;   // 我的交易额 (USDT)
  lossPer100: number;       // 每100U产生的摩擦损耗 (差价+手续费)
  currentMyReward?: number; // 用户当前预估/最终获得的奖励数量
  rewardType: RewardType;   // 奖励类型：代币或USDT
  endTime: string;          // ISO Date string
  updatedAt: number;
  isSettled: boolean;       // 是否已结算（进入历史）
  historySnapshots?: HistorySnapshot[]; // 收益历史快照
}

export interface CalculationResult {
  rewardPerPerson: number;
  rewardUsdt: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  breakEvenUsers: number;
  safetyMargin: number;
  myShare: number;
  estTotalVolume: number;
  efficiency: number;
  marginalProfit100: number;
  dilutionScale: number;
  recommendation: {
    action: 'HOLD' | 'ADD' | 'STOP' | 'EXIT';
    reason: string;
  };
  status: 'EXCELLENT' | 'GOOD' | 'RISKY' | 'LOSS';
}

export interface GlobalStats {
  totalSpent: number;
  totalEarned: number;
  netPnl: number;
  winRate: number;
}
