import axios from 'axios';
import fs from 'fs';

const SEARCH_URL = 'https://www.jumpit.co.kr/search';

async function fetchJumpitDebug() {
    console.log('Fetching Jumpit HTML...');
    try {
        const response = await axios.get(SEARCH_URL, {
            params: {
                keyword: '산업기능요원'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 10000 // 10s timeout
        });

        fs.writeFileSync('debug_jumpit.html', response.data as string);
        console.log('Saved debug_jumpit.html');
    } catch (error: any) {
        console.error('Error fetching Jumpit:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

fetchJumpitDebug();
