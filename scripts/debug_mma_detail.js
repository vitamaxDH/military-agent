const axios = require('axios');
const fs = require('fs');

const DETAIL_URL = 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaekView.do';

async function fetchDebugDetailHTML() {
    console.log('Fetching MMA Detail HTML for debugging...');
    try {
        const response = await axios.post(DETAIL_URL, new URLSearchParams({
            'byjjeopche_cd': '120240014', // Example ID
            'menu_id': 'm_m6',
            'eopjong_gbcd': '1',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        const html = response.data;
        fs.writeFileSync('debug_mma_detail.html', html);
        console.log('Saved Detail HTML to debug_mma_detail.html');

    } catch (error) {
        console.error('Error:', error);
    }
}

fetchDebugDetailHTML();
