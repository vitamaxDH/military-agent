const axios = require('axios');
const fs = require('fs');

const SEARCH_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do';

async function fetchDebugHTML() {
    console.log('Fetching MMA HTML for debugging...');
    try {
        const response = await axios.post(SEARCH_URL, new URLSearchParams({
            'pageUnit': '10',
            'pageIndex': '1',
            'eopjong_gbcd': '1',
            'menu_id': 'm_m6_1',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        const html = response.data;
        fs.writeFileSync('debug_mma.html', html);
        console.log('Saved HTML to debug_mma.html');

    } catch (error) {
        console.error('Error:', error);
    }
}

fetchDebugHTML();
