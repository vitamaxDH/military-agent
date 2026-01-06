import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Job } from '../types';

// Wanted uses an internal API.
const API_URL = 'https://www.wanted.co.kr/api/v4/jobs';

async function fetchWanted() {
    console.log('Fetching job postings from Wanted...');
    const jobs: Job[] = [];

    // Parameters for finding "Industrial Technical Personnel"
    // query: '산업기능요원'
    // country: 'kr'
    // limit: 20
    // sort: 'job.latest_order' 
    const limit = 20;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        try {
            console.log(`Fetching offset ${offset}...`);
            // Minimal params that work generally
            const response = await axios.get(API_URL, {
                params: {
                    country: 'kr',
                    job_sort: 'job.latest_order',
                    locations: 'all',
                    query: '산업기능요원',
                    limit: limit,
                    offset: offset
                },
                headers: {
                    // Important headers for Wanted
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.wanted.co.kr'
                }
            });

            // Cast to any to avoid TS errors
            const data = response.data as any;
            const jobList = data.data;

            if (!jobList || jobList.length === 0) {
                console.log('No more jobs found.');
                hasMore = false;
                break;
            }

            jobList.forEach((item: any) => {
                let deadline = "상시채용";
                // item.due_time
                if (item.due_time) {
                    const date = new Date(item.due_time);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    deadline = `${month}/${day} 마감`;
                }

                jobs.push({
                    company: item.company.name,
                    title: item.position,
                    link: `https://www.wanted.co.kr/wd/${item.id}`,
                    deadline: deadline,
                    sector: 'IT/SW', // Wanted is mostly IT
                    source: 'wanted'
                });
            });

            console.log(`Parsed ${jobList.length} jobs.`);

            offset += limit;
            if (offset > 200) hasMore = false; // Safety limit
            if (jobList.length < limit) hasMore = false;

            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            console.error('Error fetching Wanted jobs:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
            }
            hasMore = false;
        }
    }

    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'jobs_wanted.json'), JSON.stringify(jobs, null, 2));
    console.log(`Saved ${jobs.length} jobs to data/jobs_wanted.json`);
}

fetchWanted();
