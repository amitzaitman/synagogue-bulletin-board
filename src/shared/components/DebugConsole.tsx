import React, { useState, useEffect, useRef } from 'react';

type LogType = 'log' | 'warn' | 'error' | 'info';

interface LogEntry {
    id: string;
    timestamp: Date;
    type: LogType;
    message: string[];
}

interface DebugConsoleProps {
    isOpen: boolean;
    onClose: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filters, setFilters] = useState<Record<LogType, boolean>>({
        log: true,
        info: true,
        warn: true,
        error: true
    });

    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        const addLog = (type: LogType, args: any[]) => {
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            });

            setLogs(prevLogs => [
                ...prevLogs,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date(),
                    type,
                    message
                }
            ].slice(-200)); // Increased limit
        };

        console.log = (...args) => {
            originalLog(...args);
            addLog('log', args);
        };

        console.warn = (...args) => {
            originalWarn(...args);
            addLog('warn', args);
        };

        console.error = (...args) => {
            originalError(...args);
            addLog('error', args);
        };

        console.info = (...args) => {
            originalInfo(...args);
            addLog('info', args);
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.info = originalInfo;
        };
    }, []);

    useEffect(() => {
        if (isOpen && autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen, autoScroll]);

    const filteredLogs = logs.filter(log => filters[log.type]);

    const toggleFilter = (type: LogType) => {
        setFilters(prev => ({ ...prev, [type]: !prev[type] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-1/3 min-h-[300px] bg-gray-900 text-gray-100 z-[9999] flex flex-col shadow-2xl border-t border-gray-700 font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-300">Debug Console ({filteredLogs.length}/{logs.length})</h3>
                    <div className="flex items-center gap-2 text-xs">
                        {(['log', 'info', 'warn', 'error'] as LogType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => toggleFilter(type)}
                                className={`px-2 py-1 rounded border ${filters[type]
                                        ? type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200'
                                            : type === 'warn' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                                                : type === 'info' ? 'bg-blue-900/50 border-blue-500 text-blue-200'
                                                    : 'bg-gray-700 border-gray-500 text-gray-200'
                                        : 'bg-transparent border-gray-700 text-gray-500'
                                    }`}
                            >
                                {type.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={e => setAutoScroll(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600"
                        />
                        Auto-scroll
                    </label>
                    <div className="w-px h-4 bg-gray-700 mx-2" />
                    <button
                        onClick={() => setLogs([])}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 italic text-center mt-4">No logs found...</div>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className={`flex gap-2 break-all ${log.type === 'error' ? 'text-red-400 bg-red-900/10' :
                            log.type === 'warn' ? 'text-yellow-400 bg-yellow-900/10' :
                                log.type === 'info' ? 'text-blue-400' :
                                    'text-gray-300'
                            } p-1 rounded hover:bg-white/5`}>
                            <span className="text-gray-500 shrink-0 select-none w-20 text-xs font-mono opacity-70">
                                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <div className="flex-1">
                                {log.message.map((msg, i) => (
                                    <span key={i} className="mr-2 whitespace-pre-wrap">{msg}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};

export default DebugConsole;
