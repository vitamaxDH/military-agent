import fs from 'fs';
import path from 'path';
import { Company, Job, MatchedJob } from './types';

function normalizeName(name: string): string {
    return name
        .replace(/\(주\)/g, '')
        .replace(/\(유\)/g, '')
        .replace(/주식회사/g, '')
        .replace(/유한회사/g, '')
        .replace(/[㈜㈔]/g, '') // Remove unicode chars
        .replace(/\s+/g, '')
        .trim();
}

async function aggregate() {
    console.log('Aggregating data from multiple sources...');
    const dataDir = path.join(__dirname, '../data');
    const publicDataDir = path.join(__dirname, '../web/public/data');

    if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Load Companies
    const companiesPath = path.join(dataDir, 'companies.json');
    if (!fs.existsSync(companiesPath)) {
        console.error('Error: companies.json missing.');
        return;
    }
    const companies: Company[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
    console.log(`Loaded ${companies.length} designated companies.`);

    // Load Jobs
    let allJobs: Job[] = [];

    // Saramin
    const saraminPath = path.join(dataDir, 'jobs_saramin.json');
    if (fs.existsSync(saraminPath)) {
        const saraminJobs: Job[] = JSON.parse(fs.readFileSync(saraminPath, 'utf-8'));
        console.log(`Loaded ${saraminJobs.length} jobs from Saramin.`);
        allJobs = allJobs.concat(saraminJobs);
    } else {
        console.warn('Warning: jobs_saramin.json missing.');
    }

    // JobKorea
    const jobkoreaPath = path.join(dataDir, 'jobs_jobkorea.json');
    if (fs.existsSync(jobkoreaPath)) {
        const jobkoreaJobs: Job[] = JSON.parse(fs.readFileSync(jobkoreaPath, 'utf-8'));
        console.log(`Loaded ${jobkoreaJobs.length} jobs from JobKorea.`);
        allJobs = allJobs.concat(jobkoreaJobs);
    } else {
        console.warn('Warning: jobs_jobkorea.json missing.');
    }

    // Wanted
    const wantedPath = path.join(dataDir, 'jobs_wanted.json');
    if (fs.existsSync(wantedPath)) {
        const wantedJobs: Job[] = JSON.parse(fs.readFileSync(wantedPath, 'utf-8'));
        console.log(`Loaded ${wantedJobs.length} jobs from Wanted.`);
        allJobs = allJobs.concat(wantedJobs);
    } else {
        console.warn('Warning: jobs_wanted.json missing.');
    } // End Wanted Process Logic matches aggregation logic 


    console.log(`Total jobs to process: ${allJobs.length}`);

    // Build Company Map for O(1) matching
    const companyMap = new Map<string, Company>();
    companies.forEach(c => {
        companyMap.set(normalizeName(c.name), c);
    });

    const matchedJobs: MatchedJob[] = [];

    allJobs.forEach(job => {
        const jobNorm = normalizeName(job.company);
        let match: Company | undefined;

        // Exact normalized match
        if (companyMap.has(jobNorm)) {
            match = companyMap.get(jobNorm);
        }

        if (match) {
            matchedJobs.push({
                ...job,
                isDesignated: true,
                designatedCompanyInfo: match
            });
        }
    });

    console.log(`Matched ${matchedJobs.length} jobs out of ${allJobs.length}.`);

    // Sort by deadline? Or leave sorting to frontend.
    // Frontend does sorting.

    fs.writeFileSync(path.join(publicDataDir, 'matched_jobs.json'), JSON.stringify(matchedJobs, null, 2));
    console.log(`Saved matched jobs to web/public/data/matched_jobs.json`);
}

aggregate();
