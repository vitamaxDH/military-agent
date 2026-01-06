import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Job } from '../types';

// Search URL for Saramin
const SEARCH_URL = 'https://www.saramin.co.kr/zf_user/search/recruit';

async function fetchJobs() {
    console.log('Fetching job postings from Saramin...');
    const jobs: Job[] = [];

    // Search query: "산업기능요원"
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= 20) { // Limit to 20 pages (approx 2000 jobs max)
        console.log(`Fetching page ${page}...`);
        try {
            const response = await axios.get(SEARCH_URL, {
                params: {
                    searchType: 'search',
                    searchword: '산업기능요원',
                    recruitPage: page,
                    recruitSort: 'relation', // Relevance sort
                    recruitPageCount: 100 // Try fetching 100 items per page
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data as string);
            const items = $('.item_recruit');

            if (items.length === 0) {
                console.log('No more items found.');
                hasNext = false;
                break;
            }

            items.each((_, element) => {
                const item = $(element);
                const company = item.find('.area_corp .corp_name a').text().trim();
                const title = item.find('.area_job .job_tit a').text().trim();
                const linkPath = item.find('.area_job .job_tit a').attr('href');
                const link = linkPath ? `https://www.saramin.co.kr${linkPath}` : '';
                const deadline = item.find('.area_job .job_date .date').text().trim();
                const sector = item.find('.area_job .job_sector').text().trim();
                const salary = item.find('.area_job .job_condition span').filter((_, el) => {
                    const t = $(el).text();
                    return t.includes('연봉') || t.includes('만원') || t.includes('면접') || t.includes('내규');
                }).text().trim();

                if (company && title) {
                    jobs.push({
                        company,
                        title,
                        link,
                        deadline,
                        sector,
                        source: 'saramin',
                        salary: salary || undefined,
                    });
                }
            });

            console.log(`Parsed ${items.length} jobs from page ${page}.`);

            page++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            hasNext = false;
        }
    }

    // Save to file
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'jobs_saramin.json'), JSON.stringify(jobs, null, 2));
    console.log(`Saved ${jobs.length} jobs to data/jobs_saramin.json`);
}

fetchJobs();
