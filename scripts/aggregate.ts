import fs from 'fs';
import path from 'path';

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
    // Augmented fields
    isDesignated?: boolean;
    designatedCompanyInfo?: Company;
}

function normalizeName(name: string): string {
    return name
        .replace(/\(주\)/g, '')
        .replace(/\(유\)/g, '')
        .replace(/주식회사/g, '')
        .replace(/유한회사/g, '')
        .replace(/\s+/g, '')
        .trim();
}

async function aggregate() {
    console.log('Aggregating data...');
    const dataDir = path.join(__dirname, '../data');
    const publicDataDir = path.join(__dirname, '../public/data');

    if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Load data
    const companiesPath = path.join(dataDir, 'companies.json');
    const jobsPath = path.join(dataDir, 'jobs.json');

    if (!fs.existsSync(companiesPath) || !fs.existsSync(jobsPath)) {
        console.error('Data files missing. Run fetch scripts first.');
        return;
    }

    const companies: Company[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
    const jobs: Job[] = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));

    console.log(`Loaded ${companies.length} companies and ${jobs.length} jobs.`);

    // Index companies for faster lookup? 
    // Since names might be slightly different, we might need fuzzy match or iteration.
    // Iteration is fine for ~6000 * ~2000 = 12M ops (fast enough relative to scraping).
    // Or we can create a normalized map.

    const companyMap = new Map<string, Company>();
    companies.forEach(c => {
        companyMap.set(normalizeName(c.name), c);
    });

    const matchedJobs: Job[] = [];
    const unmatchedJobs: Job[] = [];

    jobs.forEach(job => {
        const jobNorm = normalizeName(job.company);

        let match: Company | undefined;

        // Exact normalized match
        if (companyMap.has(jobNorm)) {
            match = companyMap.get(jobNorm);
        } else {
            // Partial match? 
            // e.g. Job: "Foobar Inc" -> Norm: "FoobarInc"
            // Company: "Foobar" -> Norm: "Foobar"
            // Start simple: exact normalized match is usually good enough for major mismatches.
            // If job name contains company name (longer contains shorter)
            // But we have to be careful of false positives.
            // Let's stick to normalized exact match or very close match.

            // Try finding if any designated company name is a substring of job company name
            // optimizing: only check if undefined
            // This is O(N*M), slow if N, M are large. 
            // 6000 * 2000 is 12M check, takes ~100ms in Node.

            /* 
            // Optional: Advanced matching if needed
            for (const c of companies) {
                const cNorm = normalizeName(c.name);
                if (cNorm.length > 2 && jobNorm.includes(cNorm)) {
                    match = c;
                    break;
                }
            }
            */
        }

        if (match) {
            matchedJobs.push({
                ...job,
                isDesignated: true,
                designatedCompanyInfo: match
            });
        } else {
            unmatchedJobs.push(job);
        }
    });

    console.log(`Matched ${matchedJobs.length} jobs out of ${jobs.length}.`);

    fs.writeFileSync(path.join(publicDataDir, 'matched_jobs.json'), JSON.stringify(matchedJobs, null, 2));
    console.log(`Saved matched jobs to public/data/matched_jobs.json`);
}

aggregate();
