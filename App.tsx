
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import { TokenSplashEvent, GlobalStats, HistorySnapshot, RewardType } from './types';
import { calculateMetrics } from './services/geminiService';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Save,
  Coins,
  Activity,
  Zap,
  BrainCircuit,
  Clock,
  History,
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  LineChart as LineChartIcon,
  DollarSign,
  TrendingDown,
  Info,
  Download,
  Upload,
  FileJson,
  Scale,
  Calculator,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

const App: React.FC = () => {
  const STORAGE_KEY = 'splash_events_v12';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [events, setEvents] = useState<TokenSplashEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'active' | 'history'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  // 新增状态：控制哪个卡片展开了模拟器
  const [simulatorExpandedId, setSimulatorExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [countdownInput, setCountdownInput] = useState({ days: 3, hours: 0, minutes: 0 });

  const [formData, setFormData] = useState<Omit<TokenSplashEvent, 'id' | 'updatedAt' | 'isSettled' | 'historySnapshots'>>({
    tokenName: '',
    totalTokens: 100000,
    tokenPrice: 0.5,
    currentParticipants: 1000,
    requiredVolume: 500,
    lossPer100: 0.15,
    currentMyReward: 0,
    rewardType: 'TOKEN',
    endTime: new Date().toISOString(),
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const exportData = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TokenSplash_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm('此操作将覆盖当前所有数据，是否继续？')) {
            setEvents(json);
          }
        }
      } catch (err) {
        alert('导入失败，JSON 格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const globalStats = useMemo((): GlobalStats => {
    const settled = events.filter(e => e.isSettled);
    let totalSpent = 0;
    let totalEarned = 0;
    let wins = 0;

    settled.forEach(e => {
      const cost = (e.requiredVolume / 100) * e.lossPer100;
      const rewardVal = e.rewardType === 'USDT' ? (e.currentMyReward || 0) : (e.currentMyReward || 0) * e.tokenPrice;
      totalSpent += cost;
      totalEarned += rewardVal;
      if (rewardVal > cost) wins++;
    });

    return {
      totalSpent,
      totalEarned,
      netPnl: totalEarned - totalSpent,
      winRate: settled.length > 0 ? (wins / settled.length) * 100 : 0
    };
  }, [events]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = (formData.requiredVolume / 100) * formData.lossPer100;
    const rewardVal = formData.rewardType === 'USDT' ? (formData.currentMyReward || 0) : (formData.currentMyReward || 0) * formData.tokenPrice;
    const netProfit = rewardVal - cost;
    
    const newSnapshot: HistorySnapshot = {
      timestamp: Date.now(),
      netProfit,
      participants: formData.currentParticipants
    };

    if (editingId) {
      setEvents(prev => prev.map(ev => {
        if (ev.id === editingId) {
          const currentSnapshots = ev.historySnapshots || [];
          return { 
            ...ev, 
            ...formData, 
            updatedAt: Date.now(),
            historySnapshots: [...currentSnapshots, newSnapshot].slice(-50)
          };
        }
        return ev;
      }));
      setEditingId(null);
    } else {
      const calculatedEndTime = new Date(
        Date.now() + countdownInput.days * 86400000 + countdownInput.hours * 3600000 + countdownInput.minutes * 60000
      ).toISOString();

      const newEvent: TokenSplashEvent = {
        ...formData,
        endTime: calculatedEndTime,
        id: Math.random().toString(36).substr(2, 9),
        updatedAt: Date.now(),
        isSettled: false,
        historySnapshots: [newSnapshot]
      };
      setEvents(prev => [newEvent, ...prev]);
    }
    setFormData({ ...formData, tokenName: '', currentMyReward: 0 });
    setCountdownInput({ days: 3, hours: 0, minutes: 0 });
  };

  const startEdit = (ev: TokenSplashEvent) => {
    setEditingId(ev.id);
    setFormData({
      tokenName: ev.tokenName,
      totalTokens: ev.totalTokens,
      tokenPrice: ev.tokenPrice,
      currentParticipants: ev.currentParticipants,
      requiredVolume: ev.requiredVolume,
      lossPer100: ev.lossPer100,
      currentMyReward: ev.currentMyReward || 0,
      rewardType: ev.rewardType || 'TOKEN',
      endTime: ev.endTime,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSettled = (id: string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isSettled: !ev.isSettled, updatedAt: Date.now() } : ev));
  };

  const deleteEvent = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm('删除该条记录？')) {
      setEvents(prev => prev.filter(ev => ev.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const getCountdown = (endTime: string) => {
    const diff = new Date(endTime).getTime() - now;
    if (diff <= 0) return "已结束";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
  };

  const activeEvents = events.filter(e => !e.isSettled);
  const historyEvents = events.filter(e => e.isSettled);

  const getStatusTheme = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return { 
          bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', accent: 'bg-emerald-500', 
          text: 'text-emerald-400', label: '极佳机会' 
        };
      case 'GOOD':
        return { 
          bg: 'bg-sky-500/10', border: 'border-sky-500/30', accent: 'bg-sky-500', 
          text: 'text-sky-400', label: '稳健回报' 
        };
      case 'RISKY':
        return { 
          bg: 'bg-amber-500/10', border: 'border-amber-500/30', accent: 'bg-amber-500', 
          text: 'text-amber-400', label: '风险注意' 
        };
      case 'LOSS':
      default:
        return { 
          bg: 'bg-rose-500/10', border: 'border-rose-500/30', accent: 'bg-rose-500', 
          text: 'text-rose-400', label: '当前亏损' 
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <Header />
      
      <main className="max-w-[1440px] mx-auto p-4 md:p-6">
        {/* 全局统计 & 数据导出导入 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <div className="bg-[#161b22] border border-gray-800 p-3 rounded-xl shadow-lg border-b-2 border-b-gray-700">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Wallet className="w-2.5 h-2.5" /> 累计磨损</div>
              <div className="text-lg font-black text-white font-mono">${globalStats.totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 p-3 rounded-xl shadow-lg border-b-2 border-b-yellow-500">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Coins className="w-2.5 h-2.5 text-yellow-500" /> 累计收益</div>
              <div className="text-lg font-black text-yellow-500 font-mono">${globalStats.totalEarned.toFixed(2)}</div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 p-3 rounded-xl shadow-lg border-b-2 border-b-blue-500">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-blue-500" /> 总净盈亏</div>
              <div className={`text-lg font-black font-mono ${globalStats.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {globalStats.netPnl >= 0 ? '+' : ''}${globalStats.netPnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 p-3 rounded-xl shadow-lg border-b-2 border-b-purple-500">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-purple-500" /> 综合胜率</div>
              <div className="text-lg font-black text-purple-400 font-mono">{globalStats.winRate.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="flex md:flex-col gap-2 shrink-0">
            <button onClick={exportData} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-black py-2 px-4 rounded-xl border border-gray-700 transition-all active:scale-95">
              <Download className="w-3.5 h-3.5" /> 导出数据
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-black py-2 px-4 rounded-xl border border-gray-700 transition-all active:scale-95">
              <Upload className="w-3.5 h-3.5" /> 导入数据
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧录入 */}
          <div className="lg:w-[340px] shrink-0">
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 sticky top-24 shadow-2xl">
              <h2 className="text-lg font-black flex items-center gap-2 mb-4 italic text-yellow-500">
                <BrainCircuit className="w-5 h-5" />
                {editingId ? '修改数据点' : '登记新项目'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-1 bg-[#0d1117] p-1 rounded-lg border border-gray-700">
                  <button type="button" onClick={() => setFormData({...formData, rewardType: 'TOKEN'})} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${formData.rewardType === 'TOKEN' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>
                    <Coins className="w-3 h-3" /> 代币奖励
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, rewardType: 'USDT'})} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${formData.rewardType === 'USDT' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>
                    <DollarSign className="w-3 h-3" /> USDT奖励
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1">币名</label>
                    <input required type="text" value={formData.tokenName} onChange={e => setFormData({...formData, tokenName: e.target.value.toUpperCase()})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-sm font-black" placeholder="ETH" />
                  </div>
                  <div className={`space-y-1 ${formData.rewardType === 'USDT' ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="text-[9px] text-gray-500 font-bold ml-1">币价 (U)</label>
                    <input required={formData.rewardType === 'TOKEN'} type="number" step="0.00000001" value={formData.tokenPrice} onChange={e => setFormData({...formData, tokenPrice: Number(e.target.value)})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>

                {!editingId && (
                  <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                    <p className="text-[9px] font-bold text-blue-400 mb-2 uppercase flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> 活动剩余时间</p>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="number" placeholder="天" value={countdownInput.days} onChange={e => setCountdownInput({...countdownInput, days: Number(e.target.value)})} className="bg-[#0d1117] border border-gray-700 rounded-md px-1 py-1 text-center text-xs font-mono" />
                      <input type="number" placeholder="时" value={countdownInput.hours} onChange={e => setCountdownInput({...countdownInput, hours: Number(e.target.value)})} className="bg-[#0d1117] border border-gray-700 rounded-md px-1 py-1 text-center text-xs font-mono" />
                      <input type="number" placeholder="分" value={countdownInput.minutes} onChange={e => setCountdownInput({...countdownInput, minutes: Number(e.target.value)})} className="bg-[#0d1117] border border-gray-700 rounded-md px-1 py-1 text-center text-xs font-mono" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1 flex justify-between">
                      我的总交易量 (U)
                      <div className="group relative">
                        <Info className="w-2.5 h-2.5 text-gray-600 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[8px] text-gray-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-800 shadow-2xl">
                          Bybit 计算总成交额。例：买入 250U 并卖出 250U，此处应填 500U。
                        </div>
                      </div>
                    </label>
                    <input required type="number" value={formData.requiredVolume} onChange={e => setFormData({...formData, requiredVolume: Number(e.target.value)})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1 flex justify-between">
                      每 100U 磨损 (U)
                      <div className="group relative">
                        <Info className="w-2.5 h-2.5 text-gray-600 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[8px] text-gray-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-800 shadow-2xl">
                          每产生 100U 交易量产生的（手续费 + 差价）。
                        </div>
                      </div>
                    </label>
                    <input required type="number" step="0.01" value={formData.lossPer100} onChange={e => setFormData({...formData, lossPer100: Number(e.target.value)})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1">奖池总数 ({formData.rewardType})</label>
                    <input required type="number" value={formData.totalTokens} onChange={e => setFormData({...formData, totalTokens: Number(e.target.value)})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1">当前参与人数</label>
                    <input required type="number" value={formData.currentParticipants} onChange={e => setFormData({...formData, currentParticipants: Number(e.target.value)})} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-2 py-1.5 text-xs font-mono text-yellow-500" />
                  </div>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${formData.rewardType === 'TOKEN' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]' : 'bg-emerald-500/5 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'}`}>
                  <label className={`text-[9px] font-black mb-1 uppercase flex items-center gap-1 ${formData.rewardType === 'TOKEN' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                    <Zap className="w-2.5 h-2.5" /> 我预计分得的奖励 ({formData.rewardType})
                  </label>
                  <input type="number" value={formData.currentMyReward} onChange={e => setFormData({...formData, currentMyReward: Number(e.target.value)})} className={`w-full bg-[#0d1117] border rounded-lg px-2 py-1.5 text-sm font-black focus:outline-none ${formData.rewardType === 'TOKEN' ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`} />
                </div>

                <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? '保存当前状态' : '开启项目监控'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => setEditingId(null)} className="w-full text-[10px] text-gray-500 hover:text-white py-1 transition-colors">取消编辑</button>
                )}
              </form>
            </div>
          </div>

          {/* 右侧卡片列表 */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-6 bg-[#161b22] p-1 rounded-xl border border-gray-800 w-fit shadow-xl">
              <button onClick={() => setView('active')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'active' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
                <LayoutDashboard className="w-3.5 h-3.5" /> 监控队列 ({activeEvents.length})
              </button>
              <button onClick={() => setView('history')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'history' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
                <History className="w-3.5 h-3.5" /> 历史归档 ({historyEvents.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(view === 'active' ? activeEvents : historyEvents).map(ev => {
                const m = calculateMetrics(ev);
                const isEnded = new Date(ev.endTime).getTime() < now;
                const cost = (ev.requiredVolume / 100) * ev.lossPer100;
                const pnl = m.rewardUsdt - cost;
                const snapshots = ev.historySnapshots || [];
                const theme = getStatusTheme(m.status);

                // 计算每 100U 的细项
                const incomePer100 = m.rewardUsdt / (ev.requiredVolume / 100 || 1);
                const profitPer100 = incomePer100 - ev.lossPer100;
                const isSimulatorOpen = simulatorExpandedId === ev.id;
                
                const isNegativeMargin = profitPer100 < 0;

                // 修正后的模拟器档位：500, 700, 1000, 1500
                const scenarios = [
                    { vol: 500, label: '基础' },
                    { vol: 700, label: '进阶' },
                    { vol: 1000, label: '深度' },
                    { vol: 1500, label: '满额' }
                ];

                return (
                  <div key={ev.id} className={`bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all ${ev.isSettled ? 'opacity-75 grayscale-[0.5]' : 'hover:border-gray-600'}`}>
                    
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${ev.rewardType === 'TOKEN' ? (ev.isSettled ? 'bg-gray-800 text-gray-500' : 'bg-yellow-500 text-black') : 'bg-emerald-600 text-white'}`}>
                          {ev.tokenName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{ev.tokenName}</h3>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest ${theme.accent} text-black`}>{theme.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                            <Clock className={`w-2.5 h-2.5 ${isEnded && !ev.isSettled ? 'text-red-500 animate-pulse' : ''}`} /> 
                            {isEnded ? "结算中/已截止" : `倒计时: ${getCountdown(ev.endTime)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setSimulatorExpandedId(isSimulatorOpen ? null : ev.id)} className={`p-1.5 rounded-lg border transition-all ${isSimulatorOpen ? 'bg-purple-500 text-white border-purple-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`} title="策略推演">
                            <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleSettled(ev.id)} className={`p-1.5 rounded-lg border transition-all ${ev.isSettled ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-yellow-500'}`}>
                            <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* 核心面板：收益与对比 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-800/40 flex flex-col justify-center">
                          <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Coins className="w-2.5 h-2.5" /> 预估奖励额</p>
                          <p className="text-sm font-black text-white">{ev.currentMyReward} <span className="text-[8px] opacity-40 uppercase">{ev.rewardType === 'TOKEN' ? ev.tokenName : 'USDT'}</span></p>
                          <p className="text-[10px] text-yellow-500 font-bold font-mono">≈ ${m.rewardUsdt.toFixed(2)}</p>
                        </div>
                        <div className={`p-3 rounded-xl border flex flex-col justify-center ${pnl >= 0 ? 'bg-green-500/5 border-green-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                          <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Scale className="w-2.5 h-2.5" /> 预计净利润</p>
                          <p className={`text-base font-black font-mono ${pnl >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                            {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                          </p>
                          <p className="text-[8px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">ROI: {m.roi.toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* 策略模拟器 */}
                      {isSimulatorOpen ? (
                          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 animate-in slide-in-from-top-2 duration-200">
                             <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                                <h4 className="text-[10px] font-black uppercase flex items-center gap-1.5 text-purple-400">
                                   <Calculator className="w-3 h-3" /> 交易量策略推演
                                </h4>
                                <button onClick={() => setSimulatorExpandedId(null)} className="text-gray-500 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                             </div>
                             
                             <div className={`mb-3 p-2.5 rounded-lg text-[9px] leading-relaxed border flex flex-col gap-1 ${isNegativeMargin ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-gray-900/50 border-gray-800 text-gray-400'}`}>
                                <div className="flex items-center justify-between">
                                  <span>每 100U 收益: <span className="text-white font-mono">${incomePer100.toFixed(2)}</span></span>
                                  <span>成本: <span className="text-white font-mono">-${ev.lossPer100.toFixed(2)}</span></span>
                                </div>
                                <div className="border-t border-dashed border-white/10 pt-1 mt-0.5 flex items-center justify-between font-bold">
                                  <span>净结果:</span>
                                  <span className={profitPer100 > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    {profitPer100 > 0 ? '+' : ''}{profitPer100.toFixed(2)} USD
                                  </span>
                                </div>
                                
                                <span className={`font-bold mt-1 block flex items-center gap-1 ${isNegativeMargin ? 'text-rose-400' : 'text-purple-300'}`}>
                                    {isNegativeMargin ? <AlertTriangle className="w-3 h-3" /> : null}
                                    {isNegativeMargin ? '警告：做多亏多，立即停手！' : '🚀 边际收益为正，建议刷到活动上限。'}
                                </span>
                             </div>

                             <div className="grid grid-cols-4 gap-1 text-center">
                                {scenarios.map(s => {
                                    const simCost = (s.vol / 100) * ev.lossPer100;
                                    const simRevenue = (s.vol / 100) * incomePer100;
                                    const simNet = simRevenue - simCost;
                                    return (
                                        <div key={s.vol} className={`border rounded p-1.5 flex flex-col items-center ${simNet < 0 ? 'bg-rose-900/10 border-rose-900/30' : 'bg-gray-900 border-gray-800'}`}>
                                            <span className="text-[8px] text-gray-500 uppercase font-bold">{s.label}</span>
                                            <span className="text-[9px] text-gray-300 font-mono mb-1">{s.vol}U</span>
                                            <span className={`text-[9px] font-black ${simNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {simNet >= 0 ? '+' : ''}{Math.round(simNet)}
                                            </span>
                                        </div>
                                    )
                                })}
                             </div>
                          </div>
                      ) : (
                          /* 默认显示每 100U 细项对比 */
                          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/60 cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setSimulatorExpandedId(ev.id)}>
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-3 flex items-center justify-between">
                              <span>每产生 100U 交易量之对照</span>
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-gray-500 font-bold">收益:</span>
                                  <span className="text-emerald-400 font-mono">+${incomePer100.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${Math.min((incomePer100 / (incomePer100 + ev.lossPer100)) * 100, 100)}%` }}></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-gray-500 font-bold">成本:</span>
                                  <span className="text-rose-400 font-mono">-${ev.lossPer100.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full" style={{ width: `${Math.min((ev.lossPer100 / (incomePer100 + ev.lossPer100)) * 100, 100)}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                      )}

                      {/* 收益曲线图 */}
                      <div className="bg-gray-900/60 rounded-xl border border-gray-800/40 p-3 overflow-hidden">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[9px] text-gray-400 font-black uppercase flex items-center gap-1.5">
                            <LineChartIcon className="w-3 h-3 text-yellow-500" /> 收益波动曲线
                          </span>
                          <span className="text-[8px] text-gray-600 font-mono bg-black/30 px-2 py-0.5 rounded-full">{snapshots.length} 个观测点</span>
                        </div>
                        <div className="h-[80px] w-full relative">
                           {snapshots.length > 1 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={snapshots}>
                                    <defs>
                                       <linearGradient id={`colorPnl-${ev.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={pnl >= 0 ? "#eab308" : "#f43f5e"} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={pnl >= 0 ? "#eab308" : "#f43f5e"} stopOpacity={0}/>
                                       </linearGradient>
                                    </defs>
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip content={({ active, payload }) => {
                                      if (active && payload?.[0]) {
                                        return (
                                          <div className="bg-[#161b22] border border-gray-700 p-2 rounded shadow-2xl text-[10px]">
                                             <p className="text-gray-500 font-mono">{new Date(payload[0].payload.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                             <p className="text-yellow-500 font-black mt-1">净盈亏: ${Number(payload[0].value).toFixed(2)}</p>
                                          </div>
                                        );
                                      } return null;
                                    }} />
                                    <Area type="monotone" dataKey="netProfit" stroke={pnl >= 0 ? "#eab308" : "#f43f5e"} strokeWidth={2} fillOpacity={1} fill={`url(#colorPnl-${ev.id})`} />
                                 </AreaChart>
                              </ResponsiveContainer>
                           ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 opacity-60">
                               <TrendingDown className="w-5 h-5 mb-1 opacity-20" />
                               <p className="text-[8px] font-black uppercase">等待更多更新点以绘制趋势</p>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* AI 决策建议框（彩色分级） */}
                      {!ev.isSettled && (
                         <div className={`${theme.bg} ${theme.border} p-3 rounded-xl border-l-4 border-l-${theme.accent.split('-')[1]}-500 shadow-inner flex flex-col gap-2`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <BrainCircuit className={`w-3.5 h-3.5 ${theme.text}`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text}`}>AI 策略评估</span>
                              </div>
                              <div className="bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="text-[8px] text-gray-500">边际收益:</span>
                                <span className={`text-[10px] font-black ${m.marginalProfit100 > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${m.marginalProfit100.toFixed(2)}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-300 leading-normal font-medium italic">"{m.recommendation.reason}"</p>
                         </div>
                      )}
                    </div>

                    <div className="mt-auto px-4 py-3 bg-gray-900/40 border-t border-gray-800 flex items-center justify-between">
                       <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 uppercase font-bold">
                          <Activity className="w-3 h-3 text-blue-400" /> 人数: {ev.currentParticipants.toLocaleString()}
                       </span>
                       <div className="flex gap-1">
                         <button onClick={() => startEdit(ev)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-all active:scale-90" title="更新数据点">
                           <Edit3 className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => deleteEvent(e, ev.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-500 hover:text-rose-500 transition-all" title="移除项目">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeEvents.length === 0 && view === 'active' && (
              <div className="h-[400px] border-2 border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center text-gray-700 bg-gray-900/5 mt-4">
                <FileJson className="w-12 h-12 mb-3 opacity-10" />
                <p className="text-sm font-bold opacity-30 tracking-widest uppercase">监控列表空空如也</p>
                <p className="text-xs opacity-20 mt-1">开始登记您的第一个 Token Splash 项目</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-gray-800 text-center opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">TokenSplash AI Pro - Smart Decision Engine</p>
      </footer>
    </div>
  );
};

export default App;
