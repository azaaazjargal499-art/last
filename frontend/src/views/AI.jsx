// smart-inventory/frontend/src/pages/AI.jsx
import { Brain } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AIAssistantChat from '@/components/ai/AIAssistantChat';

export default function AI() {
  const location = useLocation();
  const chartCapture = location.state?.chartCapture;

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-white">AI Signal Chat</h1>
          <p className="text-sm font-semibold text-slate-400">Chart зураг явуулаад BUY / SELL / WAIT шинжилгээ авна.</p>
        </div>
      </div>

      <AIAssistantChat
        initialImage={chartCapture?.image}
        initialPair={chartCapture?.pair}
        initialTimeframe={chartCapture?.timeframe}
        initialPrompt={chartCapture?.prompt}
      />
    </div>
  );
}
