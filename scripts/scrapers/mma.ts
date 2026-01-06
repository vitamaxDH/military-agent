import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Company } from '../types';

// URL for MMA search
const SEARCH_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';
const DETAIL_URL_BASE = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaekView.do';

async function fetchCompanyDetail(name: string, link: string): Promise<Partial<Company>> {
    try {
        // Extract params from link
        // Link format: /caisBYIS/search/byjjecgeomsaekView.do;...?menu_id=m_m6&pageIndex=1&byjjeopche_cd=12345...
        const urlObj = new URL(link, 'https://work.mma.go.kr');
        const byjjeopche_cd = urlObj.searchParams.get('byjjeopche_cd');
        const eopjong_gbcd = urlObj.searchParams.get('eopjong_gbcd') || '1';

        if (!byjjeopche_cd) return {};

        const response = await axios.post(DETAIL_URL_BASE, new URLSearchParams({
            'byjjeopche_cd': byjjeopche_cd,
            'eopjong_gbcd': eopjong_gbcd,
            'menu_id': 'm_m6',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data as string);
        const activePersonnelText = $('th:contains("현역배정인원")').next('td').text().trim();
        const supplementaryPersonnelText = $('th:contains("보충역배정인원")').next('td').text().trim();

        // Parse numbers (e.g., "1명" -> 1)
        const activePersonnel = parseInt(activePersonnelText.replace(/[^0-9]/g, ''), 10) || 0;
        const supplementaryPersonnel = parseInt(supplementaryPersonnelText.replace(/[^0-9]/g, ''), 10) || 0;

        // Also extract sector and phone if available in detail
        const sector = $('th:contains("업종")').next('td').text().trim();
        const phone = $('th:contains("전화번호")').next('td').text().trim();
        const mainProduct = $('th:contains("주생산물")').next('td').text().trim();

        process.stdout.write('.'); // Progress indicator

        return {
            activePersonnel,
            supplementaryPersonnel,
            sector,
            phone,
            mainProduct
        };

    } catch (error) {
        console.error(`Error fetching detail for ${name}:`, error);
        return {};
    }
}

async function fetchCompanies() {
    console.log('Fetching designated companies from MMA...');
    const companies: Company[] = [];

    // Attempt to search
    let pageIndex = 1;
    let hasNext = true;
    const PAGE_UNIT = 1000;
    const MAX_PAGES = 50; // Cover all pages (usually ~20 pages for 20k companies)

    while (hasNext && pageIndex <= MAX_PAGES) {
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
            const items = rows.toArray();
            console.log(`Found ${items.length} companies on page ${pageIndex}. Processing in batches...`);

            // Process in chunks of 20 to improve speed but respect server
            const CHUNK_SIZE = 20;
            for (let i = 0; i < items.length; i += CHUNK_SIZE) {
                const chunk = items.slice(i, i + CHUNK_SIZE);
                const promises = chunk.map(async (element) => {
                    const row = $(element);
                    const titleLink = row.find('th.title a');
                    const name = titleLink.text().trim();
                    const link = titleLink.attr('href');

                    const tds = row.find('td');
                    const region = $(tds[1]).text().trim();

                    if (name && link) {
                        const detail = await fetchCompanyDetail(name, link);
                        return {
                            name: name,
                            sector: detail.sector || '',
                            location: region,
                            phone: detail.phone,
                            mainProduct: detail.mainProduct,
                            activePersonnel: detail.activePersonnel,
                            supplementaryPersonnel: detail.supplementaryPersonnel
                        } as Company;
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                results.forEach(res => {
                    if (res) {
                        companies.push(res);
                        pageCount++;
                    }
                });

                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`\nParsed ${pageCount} companies from page ${pageIndex}.`);

            if (items.length < PAGE_UNIT) {
                hasNext = false;
            }

            pageIndex++;
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

    // Load existing companies to append or merge? 
    // For now, overwrite with test data for validation
    fs.writeFileSync(path.join(dataDir, 'companies.json'), JSON.stringify(companies, null, 2));
    console.log(`Saved ${companies.length} companies to data/companies.json`);
}

fetchCompanies();
