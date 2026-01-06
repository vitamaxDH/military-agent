import React from 'react';

export const SkeletonJobCard: React.FC = () => {
    return (
        <div className="block p-6 bg-gray-800/50 rounded-2xl border border-gray-700/50 animate-pulse h-full min-h-[160px]">
            <div className="absolute top-0 right-0 p-4">
                <div className="w-12 h-6 bg-gray-700/50 rounded-md"></div>
            </div>

            <div className="flex flex-col h-full">
                <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-12 h-5 bg-gray-700/50 rounded"></div>
                        <div className="w-16 h-5 bg-gray-700/50 rounded"></div>
                    </div>
                    <div className="w-full h-6 bg-gray-700/50 rounded"></div>
                    <div className="w-2/3 h-6 bg-gray-700/50 rounded"></div>
                    <div className="w-1/2 h-4 bg-gray-700/50 rounded mt-2"></div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-700/30 flex items-center justify-between">
                    <div className="w-16 h-4 bg-gray-700/50 rounded"></div>
                    <div className="w-16 h-4 bg-gray-700/50 rounded"></div>
                </div>
            </div>
        </div>
    );
};
