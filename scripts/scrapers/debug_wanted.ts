import axios from 'axios';

// Wanted Search API (v4)
// Need to find the correct parameters for "산업기능요원".
// Usually: https://www.wanted.co.kr/api/v4/jobs?country=kr&tag_type_ids=&job_sort=job.latest_order&locations=all&years=-1&query=산업기능요원&limit=20&offset=0

async function testWanted() {
    const url = 'https://www.wanted.co.kr/api/v4/jobs';
    const params = {
        country: 'kr',
        job_sort: 'job.latest_order',
        locations: 'all',
        years: '-1',
        query: '산업기능요원',
        limit: 10,
        offset: 0
    };

    console.log(`Testing Wanted API: ${url}`);

    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.wanted.co.kr'
            }
        });

        console.log('Status:', response.status);
        console.log('Data Preview:', JSON.stringify(response.data, null, 2).slice(0, 500));

        if (response.data.data) {
            console.log(`Found ${response.data.data.length} jobs.`);
        }

    } catch (error: any) {
        console.error('Error fetching Wanted:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testWanted();
