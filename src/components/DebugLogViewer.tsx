import React, { useState, useEffect } from 'react';
import backIcon from '@/assets/00backbutton-3.png';

interface LogEntry {
  timestamp: string;
  operation?: string;
  action?: string;
  [key: string]: any;
}

interface DebugLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugLogViewer: React.FC<DebugLogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedLogs = JSON.parse(localStorage.getItem('nuron-debug-logs') || '[]');
      setLogs(storedLogs);
    }
  }, [isOpen]);

  const clearLogs = () => {
    localStorage.removeItem('nuron-debug-logs');
    setLogs([]);
  };

  const getActionName = (log: LogEntry): string => {
    return log.operation || log.action || 'unknown';
  };

  const getLogData = (log: LogEntry): string => {
    const filtered = Object.fromEntries(
      Object.entries(log).filter(([key]) => key !== 'operation' && key !== 'action' && key !== 'timestamp')
    );
    return JSON.stringify(filtered, null, 2);
  };

  const copyAllLogs = async () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${getActionName(log)}\n${getLogData(log)}`
    ).join('\n\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      // Fallback for mobile
      const textArea = document.createElement('textarea');
      textArea.value = logText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('success') || action.includes('verified')) return 'text-green-400';
    if (action.includes('error') || action.includes('failed') || action.includes('Mismatch')) return 'text-red-400';
    if (action.includes('start') || action.includes('attempt')) return 'text-blue-400';
    if (action.includes('backup') || action.includes('cache')) return 'text-yellow-400';
    return 'text-white/70';
  };

  const getStatusEmoji = (action: string): string => {
    if (action.includes('success') || action.includes('verified')) return '✅';
    if (action.includes('error') || action.includes('failed') || action.includes('Mismatch')) return '❌';
    if (action.includes('start')) return '🔵';
    if (action.includes('attempt')) return '🔄';
    if (action.includes('backup')) return '💾';
    return '📝';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 bg-[#252525]">
        <button onClick={onClose} className="p-2">
          <img src={backIcon} alt="Back" className="w-[24px] h-[24px]" />
        </button>
        <h1 className="text-white text-[18px] font-outfit font-semibold">Debug Logs</h1>
        <button
          onClick={clearLogs}
          className="text-red-400 text-[14px] font-outfit px-3 py-1"
        >
          Clear
        </button>
      </div>

      {/* Copy All Button */}
      <div className="p-3 bg-[#202020] border-b border-white/10">
        <button
          onClick={copyAllLogs}
          className={`w-full py-3 rounded-lg font-outfit text-[14px] transition-colors ${
            copiedAll 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {copiedAll ? '✓ Copied to Clipboard!' : '📋 Copy All Logs (to send to developer)'}
        </button>
      </div>

      {/* Summary */}
      <div className="p-3 bg-[#202020] border-b border-white/10">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-green-400 text-[20px] font-bold">
              {logs.filter(l => getActionName(l).includes('success')).length}
            </div>
            <div className="text-white/50 text-[11px]">Success</div>
          </div>
          <div>
            <div className="text-red-400 text-[20px] font-bold">
              {logs.filter(l => getActionName(l).includes('error') || getActionName(l).includes('failed')).length}
            </div>
            <div className="text-white/50 text-[11px]">Errors</div>
          </div>
          <div>
            <div className="text-blue-400 text-[20px] font-bold">
              {logs.filter(l => getActionName(l).includes('start')).length}
            </div>
            <div className="text-white/50 text-[11px]">Operations</div>
          </div>
          <div>
            <div className="text-white/70 text-[20px] font-bold">
              {logs.length}
            </div>
            <div className="text-white/50 text-[11px]">Total</div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-3">
        {logs.length === 0 ? (
          <div className="text-center mt-12">
            <p className="text-white/40 text-[16px] font-outfit mb-2">No logs yet</p>
            <p className="text-white/30 text-[13px] font-outfit">
              Create or edit a note to see logs appear here
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const actionName = getActionName(log);
            return (
              <div
                key={index}
                className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{getStatusEmoji(actionName)}</span>
                    <span className={`text-[13px] font-mono font-semibold ${getActionColor(actionName)}`}>
                      {actionName}
                    </span>
                  </div>
                  <span className="text-white/30 text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Data */}
                <div className="bg-black/30 rounded-lg p-2 overflow-x-auto">
                  <pre className="text-white/60 text-[11px] font-mono whitespace-pre-wrap break-all">
                    {getLogData(log)}
                  </pre>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/20 bg-[#202020]">
        <p className="text-white/40 text-[11px] font-outfit text-center">
          Showing last {logs.length} of max 50 entries • Tap "Copy All Logs" to share with developer
        </p>
      </div>
    </div>
  );
};

export default DebugLogViewer;
