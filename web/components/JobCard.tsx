import React from 'react';
import { Job } from '../types';
import { calculateDDay } from '../utils';
import { Icons } from './Icons';

interface JobCardProps {
    job: Job;
    viewMode: 'grid' | 'list';
}

const getDDayLabel = (days: number | null) => {
    if (days === null) return "";
    if (days === 999) return "상시";
    if (days === 0) return "D-Today";
    if (days < 0) return "마감";
    return `D-${days}`;
};

const getDDayColor = (days: number | null) => {
    if (days === 0) return "bg-red-500 text-white";
    if (days !== null && days <= 3) return "bg-orange-500 text-white";
    if (days !== null && days <= 7) return "bg-yellow-500 text-black";
    return "bg-gray-700 text-gray-300";
};

const getSourceBadge = (source: string) => {
    switch (source) {
        case 'saramin':
            return <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200">사람인</span>;
        case 'jobkorea':
            return <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200">잡코리아</span>;
        case 'jumpit':
            return <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-bold border border-green-200">점핏</span>;
        case 'wanted':
            return <span className="bg-blue-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-500">원티드</span>;
        default:
            return <span className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 rounded font-bold">기타</span>;
    }
};

export const JobCard: React.FC<JobCardProps> = ({ job, viewMode }) => {
    const dDay = calculateDDay(job.deadline);

    if (viewMode === 'grid') {
        return (
            <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden h-full"
            >
                <div className="absolute top-0 right-0 p-4">
                    {dDay !== 999 && (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${getDDayColor(dDay)} shadow-sm`}>
                            {getDDayLabel(dDay)}
                        </span>
                    )}
                </div>

                <div className="flex flex-col h-full">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            {getSourceBadge(job.source)}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-300 border border-gray-600">
                                {job.designatedCompanyInfo?.location || '지역 미정'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-300 transition-colors mb-1 break-keep">
                            {job.title}
                        </h3>
                        <div className="text-gray-400 text-sm font-medium mb-2">
                            {job.company}
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                        <span>{job.deadline}</span>
                        {job.isDesignated && (
                            <div className="flex items-center text-blue-400" title="병역지정업체 검증됨">
                                <Icons.BadgeCheck className="w-4 h-4 mr-1" />
                                지정업체
                            </div>
                        )}
                    </div>
                </div>
            </a>
        );
    } else {
        return (
            <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800 hover:shadow-lg transition-all duration-200"
            >
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                        {getSourceBadge(job.source)}
                        <span className="text-xs text-gray-400">{job.designatedCompanyInfo?.location || '지역 미정'}</span>
                        {job.isDesignated && (
                            <span className="flex items-center text-blue-400 text-[10px]" title="병역지정업체 검증됨">
                                <Icons.BadgeCheck className="w-3 h-3 mr-0.5" />
                                지정
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                        {job.title}
                    </h3>
                    <div className="text-gray-400 text-sm mt-1">
                        {job.company}
                    </div>
                </div>

                <div className="mt-2 md:mt-0 flex items-center gap-4 text-sm min-w-max">
                    <span className="text-gray-500">{job.deadline}</span>
                    {dDay !== 999 && (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${getDDayColor(dDay)}`}>
                            {getDDayLabel(dDay)}
                        </span>
                    )}
                </div>
            </a>
        );
    }
};
