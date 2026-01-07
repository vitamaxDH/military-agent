import { Worker } from 'worker_threads'; // Use Bun's compatibility or native Worker? 
// Bun uses 'worker_threads' compatibility internally or new Worker() web API. 
// For better TS support and 'worker_threads' style:
// Actually Bun supports standard Web Workers API: new Worker(url).

import fs from 'fs';
import path from 'path';
import { Company } from '../types';

// Parse CLI Arguments
const args = process.argv.slice(2);
const getArg = (key: string, Default: number) => {
    const index = args.indexOf(key);
    return index > -1 ? parseInt(args[index + 1], 10) : Default;
};

// Configuration
const DEFAULT_MAX_PAGES = 50;
const DEFAULT_CONCURRENCY = 5; // Increased from 2 to 5 for better speed (safe on GH Actions for I/O bound)

const MAX_PAGES = getArg('--limit', DEFAULT_MAX_PAGES);
const CONCURRENCY = getArg('--concurrency', DEFAULT_CONCURRENCY);

async function main() {
    console.log(`[Scheduler] Starting multi-core scraping with ${CONCURRENCY} workers for max ${MAX_PAGES} pages...`);

    let allCompanies: Company[] = [];
    const queue = Array.from({ length: MAX_PAGES }, (_, i) => i + 1); // [1, 2, ..., N]
    let activeWorkers = 0;
    let completed = 0;

    const runWorker = (pageIndex: number): Promise<Company[]> => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL("./mma_worker.ts", import.meta.url));
            worker.postMessage({ pageIndex });

            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };

            worker.onerror = (err) => {
                console.error("Worker error:", err);
                // resolve empty to keep going
                resolve([]);
                worker.terminate();
            };
        });
    };

    // Worker Pool Loop
    const results = [];
    const executing = [];

    // Helper to save progress
    const saveProgress = () => {
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        fs.writeFileSync(path.join(dataDir, 'companies.json'), JSON.stringify(allCompanies, null, 2));
        console.log(`[Scheduler] Progress saved. (${allCompanies.length} companies)`);
    };

    // Simple queue processor
    for (const pageIndex of queue) {
        const p = runWorker(pageIndex).then(companies => {
            if (companies.length > 0) {
                allCompanies.push(...companies);
                saveProgress(); // Save incrementally
            }
        });

        results.push(p);

        // Limit concurrency
        const e: Promise<void> = p.then(() => {
            executing.splice(executing.indexOf(e), 1);
        });
        executing.push(e);

        if (executing.length >= CONCURRENCY) {
            await Promise.race(executing);
        }
    }

    await Promise.all(results);

    // Final Save
    saveProgress();
    console.log(`[Scheduler] Complete! Saved ${allCompanies.length} companies to data/companies.json`);
}

main();
