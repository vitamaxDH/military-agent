import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Job } from '../types';

const SEARCH_URL = 'https://www.jobkorea.co.kr/Search/';

async function fetchJobKorea() {
    console.log('Fetching job postings from JobKorea...');
    const jobs: Job[] = [];
    const processedUrls = new Set<string>();

    let page = 1;
    let hasNext = true;

    while (hasNext && page <= 10) {
        console.log(`Fetching page ${page}...`);
        try {
            const response = await axios.get(SEARCH_URL, {
                params: {
                    stext: '산업기능요원',
                    tabType: 'recruit',
                    Page_No: page
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data as string);

            // Find all links containing GI_Read
            const allLinks = $('a').filter((i, el) => ($(el).attr('href') || '').includes('Recruit/GI_Read'));

            if (allLinks.length === 0) {
                console.log('No more items found.');
                hasNext = false; // Actually JobKorea might return empty list or recommendation
                if (page > 1) break; // Allow page 1 to be strict
            }

            // Group by URL to handle duplicates (Logo, Title, Company)
            const urlGroups = new Map<string, cheerio.Cheerio[]>();

            allLinks.each((i, el) => {
                const linkTag = $(el);
                const href = linkTag.attr('href');
                // Normalize URL
                const url = href?.split('?')[0]; // Remove query params for grouping? 
                // Actually full href might differ by logpath params, but base path /Recruit/GI_Read/XXXX is key.
                const idMatch = href?.match(/GI_Read\/(\d+)/);
                const id = idMatch ? idMatch[1] : href;

                if (id) {
                    if (!urlGroups.has(id)) {
                        urlGroups.set(id, []);
                    }
                    urlGroups.get(id)?.push(linkTag);
                }
            });

            // Iterate over each job group
            for (const [id, links] of urlGroups) {
                // We expect at least Title and Company links usually.
                // Filter out links that contain images (Logo)
                const textLinks = links.filter(l => l.find('img').length === 0 && l.text().trim().length > 0);

                if (textLinks.length >= 2) {
                    // Assumption: First is Title, Second is Company
                    const titleLink = textLinks[0];
                    const companyLink = textLinks[1];

                    const title = titleLink.text().trim();
                    const company = companyLink.text().trim();
                    const link = `https://www.jobkorea.co.kr/Recruit/GI_Read/${id}`;

                    // Find deadline
                    // It is usually in the parent container of the Company Link, or next sibling container.
                    // In debug output: Company link is in a flex container. 
                    // Below it is another flex container with dates.
                    // Let's search in the common ancestor (Grandparent of Company Link).
                    const container = companyLink.parent().parent().parent();
                    const text = container.text();

                    let deadline = '';
                    const dateMatch = text.match(/~ \d{2}\/\d{2}\(.+\)|~ \d{2}\/\d{2}|상시채용|채용시|오늘마감|D-\d+|^\d{2}\/\d{2}\(.+\) 마감/m);
                    // Note: "01/17(토) 마감"
                    if (dateMatch) {
                        deadline = dateMatch[0];
                    } else {
                        // Try searching for "마감" pattern specifically
                        const deadlineMatch = text.match(/\d{2}\/\d{2}\([^\)]+\)\s*마감/);
                        if (deadlineMatch) {
                            deadline = deadlineMatch[0];
                        }
                    }

                    if (company && title) {
                        if (!processedUrls.has(id)) {
                            jobs.push({
                                company,
                                title,
                                link,
                                deadline: deadline || '상시채용',
                                sector: '',
                                source: 'jobkorea'
                            });
                            processedUrls.add(id);
                        }
                    }
                }
            }

            console.log(`Parsed ${jobs.length} unique jobs from page ${page}.`);

            if (allLinks.length < 10) {
                // Optimization: stop if few results
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            hasNext = false;
        }
    }

    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'jobs_jobkorea.json'), JSON.stringify(jobs, null, 2));
    console.log(`Saved ${jobs.length} jobs to data/jobs_jobkorea.json`);
}

fetchJobKorea();
