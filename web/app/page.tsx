"use client";

import { useEffect, useState, useMemo } from 'react';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FilterBar } from '../components/FilterBar';
import { calculateDDay } from '../utils';

export default function Home() {
  /* State for Pagination & View Mode */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Restore missing state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [onlyIT, setOnlyIT] = useState(false);
  const [sortBy, setSortBy] = useState('deadline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/matched_jobs.json')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load jobs', err);
        setLoading(false);
      });
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRegion, selectedSource, onlyIT, sortBy]);

  const regions = useMemo(() => {
    const unique = new Set(jobs.map(j => j.designatedCompanyInfo?.location).filter(Boolean));
    return ['All', ...Array.from(unique)].sort();
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        (job.designatedCompanyInfo?.location || '').includes(search);

      const matchesRegion = selectedRegion === 'All' || job.designatedCompanyInfo?.location === selectedRegion;
      const matchesSource = selectedSource === 'All' || job.source === selectedSource;

      // IT/SW Filter Logic
      let matchesSector = true;
      if (onlyIT) {
        const sectorLower = (job.sector || '').toLowerCase();
        const titleLower = (job.title || '').toLowerCase();
        const itKeywords = ['sw', '소프트웨어', '개발', 'java', 'web', '앱', '서버', '데이터', 'ai', '딥러닝', '머신러닝', 'it', '정보처리', 'front', 'back', 'full'];
        matchesSector = itKeywords.some(k => sectorLower.includes(k) || titleLower.includes(k));
      }

      return matchesSearch && matchesRegion && matchesSector && matchesSource;
    });

    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        const dA = calculateDDay(a.deadline) ?? 999;
        const dB = calculateDDay(b.deadline) ?? 999;
        return dA - dB;
      });
    }

    return result;
  }, [jobs, search, selectedRegion, selectedSource, sortBy, onlyIT]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedJobs.length / itemsPerPage);
  const currentJobs = filteredAndSortedJobs.slice(
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

        <FilterBar
          search={search} setSearch={setSearch}
          selectedSource={selectedSource} setSelectedSource={setSelectedSource}
          selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
          regions={regions}
          sortBy={sortBy} setSortBy={setSortBy}
          onlyIT={onlyIT} setOnlyIT={setOnlyIT}
          viewMode={viewMode} setViewMode={setViewMode}
          totalCount={filteredAndSortedJobs.length}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

        {!loading && filteredAndSortedJobs.length === 0 && (
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
