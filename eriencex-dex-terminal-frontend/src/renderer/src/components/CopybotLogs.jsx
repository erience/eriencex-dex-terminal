import React from 'react';
import { useSelector } from 'react-redux';
import { selectData } from '../redux-toolkit/dataSlice';

const statusColors = {
    BuyOrderPlaced: 'text-green-500',
    SellOrderPlaced: 'text-blue-500',
    BuyOrderSkipped: 'text-yellow-500',
    SellOrderSkipped: 'text-orange-500',
    OrderSkipped: 'text-red-500',
};

const CopybotLogs = () => {
    const copyBotLog = useSelector((state) => selectData(state).copyBotLog);

    return (
        <div className="relative w-full h-60 overflow-y-auto vertical-thin bg-gray-900 rounded-md p-4">
            <h2 className="text-lg font-bold text-white mb-4">Copy Trading Bot Logs</h2>
            <div className="space-y-2">
                {copyBotLog.length > 0 ? (
                    copyBotLog.map((log, index) => (
                        <p
                            key={index}
                            className={`text-sm font-medium ${statusColors[log.status] || 'text-gray-300'}`}
                        >
                            {`Ticker: ${log.ticker} | Action: ${log.status} | Updated status for ${log.ticker} as "${log.status}".`}
                        </p>
                    ))
                ) : (
                    <div className="text-gray-400 text-center py-4">
                        No logs available. The bot hasn't performed any actions yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CopybotLogs;
