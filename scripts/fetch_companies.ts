import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// URL for MMA search
const BASE_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';
const SEARCH_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';

interface Company {
    name: string;
    sector: string;
    location: string;
    phone: string;
    mainProduct: string;
}

async function fetchCompanies() {
    console.log('Fetching designated companies...');
    const companies: Company[] = [];

    // We need to handle pagination. 
    // First, let's try to fetch the first page to see the structure and total count if possible.
    // Note: The MMA site might use a form submit for pagination.
    // Inspecting the network requests usually shows form data like `pageIndex=1`.

    // For now, let's assume simple GET/POST mechanism.
    // Getting the main page to check connectivity
    try {
        const initialRes = await axios.get(BASE_URL, {
            params: {
                eopjong_gbcd: 1, // Industrial Technical Personnel
                menu_id: 'm_m6_1'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });
        if (initialRes.status !== 200) {
            console.error('Failed to access main page:', initialRes.status);
            return;
        }
        console.log('Main page accessed successfully.');
    } catch (error) {
        console.error('Error accessing main page:', error);
        return;
    }

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
                // const year = $(tds[0]).text().trim(); // Unused
                const region = $(tds[1]).text().trim();
                // const status = $(tds[2]).text().trim(); // Unused

                if (name) {
                    companies.push({
                        name: name,
                        sector: '', // Sector not available in list view
                        location: region, // Using region as location
                        phone: '',
                        mainProduct: '',
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
            await new Promise(resolve => setTimeout(resolve, 3000)); // Respectful delay (increased to 3s for heavier load)
        } catch (error) {
            console.error(`Error fetching page ${pageIndex}:`, error);
            hasNext = false;
        }
    }

    // Save to file
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'companies.json'), JSON.stringify(companies, null, 2));
    console.log(`Saved ${companies.length} companies to data/companies.json`);
}

fetchCompanies();
