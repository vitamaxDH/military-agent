import React, { useMemo } from 'react';
import { Job } from '../types';

interface StatsDashboardProps {
    jobs: Job[];
    totalCompanies: number;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ jobs, totalCompanies }) => {
    const stats = useMemo(() => {
        const activeJobs = jobs.length;

        // Calculate total available T.O from matched jobs
        // Note: This sums up T.O. for companies that have active job postings
        // It might be more accurate to sum from all designated companies, but we only have matched ones here.
        // Let's rely on unique companies in the job list.
        const uniqueCompanies = new Set<string>();
        let totalActiveTO = 0;
        let totalSupplyTO = 0;

        jobs.forEach(job => {
            if (job.isDesignated && job.designatedCompanyInfo) {
                if (!uniqueCompanies.has(job.designatedCompanyInfo.name)) {
                    uniqueCompanies.add(job.designatedCompanyInfo.name);

                    const active = job.designatedCompanyInfo.activePersonnel || 0;
                    const supply = job.designatedCompanyInfo.supplementaryPersonnel || 0;

                    // Exclude placeholder values (usually 999 or 9999 indicates flexible/pool allocation)
                    if (active < 900) totalActiveTO += active;
                    if (supply < 900) totalSupplyTO += supply;
                }
            }
        });

        return { activeJobs, totalActiveTO, totalSupplyTO };
    }, [jobs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Active Jobs Card */}
            <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-blue-600/20"></div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">현재 채용 중</h3>
                <div className="text-3xl font-extrabold text-white">
                    {stats.activeJobs.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-1">건</span>
                </div>
            </div>

            {/* Active Duty T.O */}
            <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 relative overflow-hidden group hover:border-green-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-600/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-green-600/20"></div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">현역 배정 인원 (매칭 기업)</h3>
                <div className="text-3xl font-extrabold text-white">
                    {stats.totalActiveTO.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-1">명</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    * 통합 배정(999명 표기) 제외 수치입니다.
                </p>
            </div>

            {/* Supplementary Duty T.O */}
            <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-purple-600/20"></div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">보충역 배정 인원 (매칭 기업)</h3>
                <div className="text-3xl font-extrabold text-white">
                    {stats.totalSupplyTO.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-1">명</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    * 통합 배정(999명 표기) 제외 수치입니다.
                </p>
            </div>
        </div>
    );
};
