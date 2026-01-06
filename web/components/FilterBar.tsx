import React from 'react';
import { Icons } from './Icons';

interface FilterBarProps {
    search: string;
    setSearch: (value: string) => void;
    selectedSource: string;
    setSelectedSource: (value: string) => void;
    selectedRegion: string;
    setSelectedRegion: (value: string) => void;
    regions: string[];
    sortBy: string;
    setSortBy: (value: string) => void;
    onlyIT: boolean;
    setOnlyIT: (value: boolean) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    search, setSearch,
    selectedSource, setSelectedSource,
    selectedRegion, setSelectedRegion, regions,
    sortBy, setSortBy,
    onlyIT, setOnlyIT,
    viewMode, setViewMode,
    totalCount
}) => {
    return (
        <div className="py-4 space-y-4 mb-4 border-b border-gray-800/50">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="기업명, 포지션 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-5 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm backdrop-blur-sm"
                    />
                    <div className="absolute right-4 top-3.5 text-gray-500">
                        <Icons.Search className="h-6 w-6" />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">모든 플랫폼</option>
                        <option value="saramin">사람인</option>
                        <option value="jobkorea">잡코리아</option>
                        <option value="wanted">원티드</option>
                    </select>

                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {regions.map(r => (
                            <option key={r} value={r}>{r === 'All' ? '전체 지역' : r}</option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="deadline">마감임박순</option>
                        <option value="recent">관련도순</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all select-none ${onlyIT ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                        <input
                            type="checkbox"
                            checked={onlyIT}
                            onChange={(e) => setOnlyIT(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm font-semibold">💻 정보처리(IT/SW)만 보기</span>
                    </label>
                </div>

                {/* View Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                        title="카드 보기"
                    >
                        <Icons.Grid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                        title="리스트 보기"
                    >
                        <Icons.List className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Result Count */}
            <div className="flex justify-end text-sm text-gray-400 mb-2">
                총 {totalCount}건
            </div>
        </div>
    );
};
