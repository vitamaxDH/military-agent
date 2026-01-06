import fs from 'fs';
import path from 'path';
import { Company, Job, MatchedJob } from './types';

// Helper to get current KST date
function getKSTDate(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 60 * 60 * 1000));
}

// Convert "D-Day" or "~ MM/DD(Day)" strings to a Date object (KST)
// Returns null if unparseable, indicating "keep it" safely, or handle strict.
function parseDeadline(deadlineStr: string): Date | null {
    if (!deadlineStr) return null;
    const cleanStr = deadlineStr.replace(/\s+/g, '');
    const nowKST = getKSTDate();
    const currentYear = nowKST.getFullYear();

    // Case 1: "Today" or "D-Today" or "오늘마감"
    if (cleanStr.includes('Today') || cleanStr.includes('오늘마감') || cleanStr.includes('D-0')) {
        // Ends today 23:59:59
        const d = new Date(nowKST);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Case 2: "D-N" (e.g. D-5)
    const dMatch = cleanStr.match(/D-(\d+)/i);
    if (dMatch) {
        const days = parseInt(dMatch[1], 10);
        const d = new Date(nowKST);
        d.setDate(d.getDate() + days);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Case 3: "~ MM/DD(Day)" or "YYYY.MM.DD"
    // Handle "~" prefix if present
    let datePart = cleanStr.replace('~', '').trim();
    // Remove (Day) e.g. (화)
    datePart = datePart.replace(/\(.\)/, '');

    // Check for MM/DD format
    const slashMatch = datePart.match(/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
        const month = parseInt(slashMatch[1], 10) - 1; // 0-indexed
        const day = parseInt(slashMatch[2], 10);

        // Assume current year. If date is in the past, maybe next year? 
        // But usually deadlines are near future.
        // If today is Dec and deadline says 01/05, it's next year.
        let year = currentYear;
        // Simple logic: if deadline month < current month - 1, assume next year.
        if (month < nowKST.getMonth() - 1) {
            year++;
        }

        const d = new Date(year, month, day);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Check for YYYY.MM.DD or YYYY-MM-DD
    const dotMatch = datePart.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
    if (dotMatch) {
        const year = parseInt(dotMatch[1], 10);
        const month = parseInt(dotMatch[2], 10) - 1;
        const day = parseInt(dotMatch[3], 10);
        const d = new Date(year, month, day);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Case 4: "채용시" or "상시" -> No deadline
    if (cleanStr.includes('채용시') || cleanStr.includes('상시')) {
        // Return a far future date
        return new Date(9999, 11, 31);
    }

    return null; // Could not parse
}

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
    }


    console.log(`Total jobs to process: ${allJobs.length}`);

    // Build Company Map for O(1) matching
    const companyMap = new Map<string, Company>();
    companies.forEach(c => {
        companyMap.set(normalizeName(c.name), c);
    });

    const matchedJobs: MatchedJob[] = [];
    const nowKST = getKSTDate();
    let filteredCount = 0;

    allJobs.forEach(job => {
        // Date Logic
        const deadlineDate = parseDeadline(job.deadline);
        if (deadlineDate && deadlineDate < nowKST) {
            // Expired
            // Optimization: Skip adding to matchedJobs completely?
            // Users usually don't want to see expired jobs.
            filteredCount++;
            return;
        }

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
                designatedCompanyInfo: match,
                closed: false // Since we filtered expired ones
            });
        }
    });

    console.log(`Matched ${matchedJobs.length} jobs out of ${allJobs.length}. (Filtered ${filteredCount} expired jobs)`);

    fs.writeFileSync(path.join(publicDataDir, 'matched_jobs.json'), JSON.stringify(matchedJobs, null, 2));
    console.log(`Saved matched jobs to web/public/data/matched_jobs.json`);
}

aggregate();
