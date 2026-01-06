import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="fixed top-0 w-full z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Minimal Taegeuk Icon */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-b from-red-500 to-blue-600 border border-gray-700 shadow-lg" title="대한민국"></div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
                        병역일터 x 채용플랫폼
                    </h1>
                </div>
                <span className="text-sm text-gray-400 font-medium">
                    산업기능요원 Aggregator
                </span>
            </div>
        </header>
    );
};
