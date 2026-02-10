
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-800 bg-[#0d1117] sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">TokenSplash 智能测算助手</h1>
          <p className="text-xs text-gray-400">Bybit 活动收益分析与 ROI 评估工具</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-400">
        <span className="hover:text-yellow-500 cursor-pointer transition-colors">实时数据</span>
        <span className="hover:text-yellow-500 cursor-pointer transition-colors">风险引擎</span>
        <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-yellow-500 border border-yellow-500/30">AI 实时监控</span>
      </div>
    </header>
  );
};

export default Header;
