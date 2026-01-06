import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Company } from '../types';

// URL for MMA search
const BASE_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';
const SEARCH_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';

async function fetchCompanies() {
    console.log('Fetching designated companies from MMA...');
    const companies: Company[] = [];

    // Attempt to search
    let pageIndex = 1;
    let hasNext = true;
    const PAGE_UNIT = 1000;

    while (hasNext && pageIndex <= 20) { // Limit to 20 pages max (covering 20k items)
        console.log(`Fetching page ${pageIndex} with unit ${PAGE_UNIT}...`);
        try {
            const response = await axios.post(SEARCH_URL, new URLSearchParams({
                'pageUnit': PAGE_UNIT.toString(),
                'pageIndex': pageIndex.toString(),
                'eopjong_gbcd': '1',
                'menu_id': 'm_m6_1',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                }
            });

            const html = response.data as string;
            const $ = cheerio.load(html);
            const rows = $('table.brd_list_n tbody tr');

            if (rows.length === 0) {
                console.log('No more rows found.');
                hasNext = false;
                break;
            }

            let pageCount = 0;
            rows.each((_, element) => {
                const row = $(element);
                const name = row.find('th a').text().trim();
                // Columns: Name(th), Year(td0), Region(td1), Status(td2)
                const tds = row.find('td');
                const region = $(tds[1]).text().trim();

                if (name) {
                    companies.push({
                        name: name,
                        sector: '', // Sector not available in list view
                        location: region,
                    });
                    pageCount++;
                }
            });

            console.log(`Parsed ${pageCount} companies from page ${pageIndex}.`);

            // Check if we reached the end (less than page unit fetched)
            if (pageCount < PAGE_UNIT) {
                hasNext = false;
            }

            pageIndex++;
            await new Promise(resolve => setTimeout(resolve, 3000)); // Respectful delay (3s)
        } catch (error) {
            console.error(`Error fetching page ${pageIndex}:`, error);
            hasNext = false;
        }
    }

    // Save to file
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'companies.json'), JSON.stringify(companies, null, 2));
    console.log(`Saved ${companies.length} companies to data/companies.json`);
}

fetchCompanies();
