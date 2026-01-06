import { parentPort, workerData } from 'worker_threads';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Company } from '../types'; // Ensure this path is correct relative to scripts/scrapers/mma_worker.ts
// scripts/scrapers/mma_worker.ts -> ../../web/types/index.ts OR ../types.ts ?
// types are in scripts/types.ts
// So ../../types is wrong if file is in scripts/scrapers/.
// It should be ../types

// Relative path check:
// scripts/scrapers/mma_worker.ts
// scripts/types.ts
// So import { Company } from '../types'; is correct.

// MMA URLs
const SEARCH_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';
const DETAIL_URL_BASE = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaekView.do';

const PAGE_UNIT = 1000;

async function fetchCompanyDetail(name: string, link: string): Promise<Partial<Company>> {
    try {
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

        const activePersonnel = parseInt(activePersonnelText.replace(/[^0-9]/g, ''), 10) || 0;
        const supplementaryPersonnel = parseInt(supplementaryPersonnelText.replace(/[^0-9]/g, ''), 10) || 0;

        const sector = $('th:contains("업종")').next('td').text().trim();
        const phone = $('th:contains("전화번호")').next('td').text().trim();
        const mainProduct = $('th:contains("주생산물")').next('td').text().trim();

        return {
            activePersonnel,
            supplementaryPersonnel,
            sector,
            phone,
            mainProduct
        };
    } catch (error) {
        // console.error(`Error fetching detail for ${name}:`, error);
        return {};
    }
}

async function processPage(pageIndex: number) {
    const companies: Company[] = [];
    try {
        console.log(`[Worker] Fetching page ${pageIndex}...`);
        const response = await axios.post(SEARCH_URL, new URLSearchParams({
            'pageUnit': PAGE_UNIT.toString(),
            'pageIndex': pageIndex.toString(),
            'eopjong_gbcd': '1',
            'menu_id': 'm_m6_1',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            },
            timeout: 15000 // 15s timeout
        });

        const html = response.data as string;
        const $ = cheerio.load(html);
        const rows = $('table.brd_list_n tbody tr');

        if (rows.length === 0) {
            return [];
        }

        const items = rows.toArray();
        // Process in chunks within the worker
        const CHUNK_SIZE = 10; // Reduced from 50 to 10
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
                if (res) companies.push(res);
            });
        }
        console.log(`[Worker] Page ${pageIndex} done. Found ${companies.length} companies.`);
        return companies;

    } catch (e) {
        console.error(`[Worker] Error on page ${pageIndex}`, e);
        return [];
    }
}

// Bun Worker Interface
declare var self: Worker;

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent) => {
    const { pageIndex } = event.data;
    const result = await processPage(pageIndex);
    self.postMessage(result);
};
