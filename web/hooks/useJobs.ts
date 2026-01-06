import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Job, JobSchema } from '../types';
import { calculateDDay } from '../utils';

export const useJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [search, setSearch] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [selectedSource, setSelectedSource] = useState('All');
    const [onlyIT, setOnlyIT] = useState(false);
    const [sortBy, setSortBy] = useState('deadline');

    // Fetch Data
    useEffect(() => {
        fetch('/data/matched_jobs.json')
            .then((res) => res.json())
            .then((data) => {
                // Validate data with Zod
                const result = z.array(JobSchema).safeParse(data);

                if (result.success) {
                    setJobs(result.data);
                } else {
                    console.error("Data validation failed:", result.error);
                    // Fallback or empty state could be handled here
                    setJobs([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load jobs', err);
                setLoading(false);
            });
    }, []);

    // Derived State: Regions
    const regions = useMemo(() => {
        const locations = jobs
            .map(j => j.designatedCompanyInfo?.location)
            .filter((loc): loc is string => !!loc); // Type guard to remove undefined

        // Deduplicate
        const unique = new Set(locations);
        return ['All', ...Array.from(unique)].sort();
    }, [jobs]);

    // Derived State: Filtered & Sorted Jobs
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

    return {
        jobs: filteredAndSortedJobs,
        loading,
        regions,
        filters: {
            search, setSearch,
            selectedRegion, setSelectedRegion,
            selectedSource, setSelectedSource,
            onlyIT, setOnlyIT,
            sortBy, setSortBy,
        }
    };
};
