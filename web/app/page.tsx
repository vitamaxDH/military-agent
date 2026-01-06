"use client";

import { useEffect, useState, useMemo } from 'react';

interface Company {
  name: string;
  sector: string;
  location: string;
}

interface Job {
  company: string;
  title: string;
  link: string;
  deadline: string;
  sector: string;
  source: 'saramin' | 'jobkorea' | 'jumpit' | 'wanted';
  isDesignated?: boolean;
  designatedCompanyInfo?: Company;
}

// Utility to parse deadline and calculate D-Day
const calculateDDay = (deadlineStr: string): number | null => {
  if (!deadlineStr) return null;
  if (deadlineStr.includes("오늘마감")) return 0;
  if (deadlineStr.includes("채용시") || deadlineStr.includes("상시")) return 999;

  const match = deadlineStr.match(/(\d{2})\/(\d{2})/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    let targetDate = new Date(currentYear, month - 1, day);

    if (targetDate < now && (now.getMonth() > month)) {
      targetDate.setFullYear(currentYear + 1);
    }

    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
};

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

        {/* Filters & Search */}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                title="리스트 보기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Result Count */}
          <div className="flex justify-end text-sm text-gray-400 mb-2">
            총 {filteredAndSortedJobs.length}건
          </div>

        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentJobs.map((job, idx) => {
                  const dDay = calculateDDay(job.deadline);
                  return (
                    <a
                      key={idx}
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
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
                          <div className="text-gray-400 text-sm font-medium">
                            {job.company}
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                          <span>{job.deadline}</span>
                          {job.isDesignated && (
                            <div className="flex items-center text-blue-400" title="병역지정업체 검증됨">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              지정업체
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              // List (Row) View
              <div className="space-y-3">
                {currentJobs.map((job, idx) => {
                  const dDay = calculateDDay(job.deadline);
                  return (
                    <a
                      key={idx}
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
                              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              지정
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                          {job.title}
                        </h3>
                        <div className="text-gray-400 text-sm">
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
                })}
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

      <footer className="border-t border-gray-800 py-8 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p className="mb-2">&copy; 2026 Military Job Aggregator. All rights reserved.</p>
          <p className="text-gray-700 text-xs">
            본 서비스는 병무청 공식 서비스가 아니며, 구직 편의를 위해 제공되는 정보입니다.<br />
            채용 공고의 상세 내용은 각 채용 플랫폼에서 확인하시기 바랍니다.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
            <span>Data sourced from MMA, Saramin, JobKorea, and Wanted.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
