"use client";

import { useState, useEffect } from 'react';
import { JobCard } from '../components/JobCard';
import { SkeletonJobCard } from '../components/SkeletonJobCard';
import { StatsDashboard } from '../components/StatsDashboard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FilterBar } from '../components/FilterBar';
import { useJobs } from '../hooks/useJobs';

export default function Home() {
  /* State for Pagination & View Mode */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use Custom Hook for Data & Logic
  const { jobs, loading, regions, filters } = useJobs();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.selectedRegion, filters.selectedSource, filters.onlyIT, filters.sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const currentJobs = jobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-800 via-gray-900 to-black text-gray-100 font-sans relative overflow-hidden">

      {/* Taegeuk Inspired Background Elements (Subtle) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Header />

      <main className="flex-grow pt-24 pb-12 max-w-5xl mx-auto px-4 relative z-1 w-full">
        <div className="mb-10 text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-gray-800/80 text-gray-300 text-xs font-semibold mb-2 border border-gray-700 shadow-sm">
            v2.0 Beta
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-sm">
            병역혜택 + 커리어 성장
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            병무청 지정업체와 <span className="text-blue-400 font-semibold">채용플랫폼</span> 공고를 교차 검증하여 산업기능요원 포지션만 모았습니다.
          </p>
        </div>

        <StatsDashboard jobs={jobs} totalCompanies={0} />

        <FilterBar
          search={filters.search} setSearch={filters.setSearch}
          selectedSource={filters.selectedSource} setSelectedSource={filters.setSelectedSource}
          selectedRegion={filters.selectedRegion} setSelectedRegion={filters.setSelectedRegion}
          regions={regions}
          sortBy={filters.sortBy} setSortBy={filters.setSortBy}
          onlyIT={filters.onlyIT} setOnlyIT={filters.setOnlyIT}
          viewMode={viewMode} setViewMode={setViewMode}
          totalCount={jobs.length}
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonJobCard key={idx} />
            ))}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} viewMode="grid" />
                ))}
              </div>
            ) : (
              // List (Row) View
              <div className="space-y-3">
                {currentJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} viewMode="list" />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
                >
                  이전
                </button>
                <div className="flex items-center px-4 font-bold text-white">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-800/30 rounded-3xl border border-gray-800">
            <p className="text-xl mb-2 font-semibold text-gray-400">검색 결과가 없습니다.</p>
            <p className="text-sm">다른 검색어나 필터를 시도해보세요.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
