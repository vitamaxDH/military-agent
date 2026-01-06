import { Worker } from 'worker_threads'; // Use Bun's compatibility or native Worker? 
// Bun uses 'worker_threads' compatibility internally or new Worker() web API. 
// For better TS support and 'worker_threads' style:
// Actually Bun supports standard Web Workers API: new Worker(url).

import fs from 'fs';
import path from 'path';
import { Company } from '../types';

// Configuration
const MAX_PAGES = 50; // Total pages to scrape (approx 20k items / 1000 per page = 20 pages, but to be safe)
const CONCURRENCY = 2; // Number of parallel workers (Reduced to avoid blocking)

async function main() {
    console.log(`[Scheduler] Starting multi-core scraping with ${CONCURRENCY} workers for max ${MAX_PAGES} pages...`);

    let allCompanies: Company[] = [];
    const queue = Array.from({ length: MAX_PAGES }, (_, i) => i + 1); // [1, 2, ..., 50]
    let activeWorkers = 0;
    let completed = 0;

    // We used 'worker_threads' style in worker file (parentPort), so we should use Worker from 'worker_threads' here or adapt.
    // Bun implements Node's worker_threads. Let's use that for consistency with mma_worker.ts

    // But wait, creating a pool is easier if we just spawn workers.

    const runWorker = (pageIndex: number): Promise<Company[]> => {
        return new Promise((resolve, reject) => {
            // Bun specific: new Worker(path)
            // But mma_worker.ts uses 'worker_threads'. 
            // Let's rewrite mma_worker.ts to be Web Worker compatible? 
            // OR use 'new Worker' but strict Bun style.

            // To be safe and compatible with the code I just wrote (parentPort):
            // We should use:
            // const worker = new Worker('./scripts/scrapers/mma_worker.ts'); 
            // But 'worker_threads' usage implies Node style.

            // Let's stick to Node's worker_threads API which Bun supports.
            // Dynamically import worker_threads? Already imported at top.

            // Re-write: Bun recommends Web Worker API. 
            // But since I already wrote mma_worker.ts with `parentPort`, I should stick to that?
            // "Bun implements the worker_threads module from Node.js." -> So it should work.

            // However, typical Bun worker usage:
            /*
               const worker = new Worker(new URL("worker.ts", import.meta.url));
               worker.postMessage({ pageIndex });
               worker.onmessage = (e) => resolve(e.data);
            */

            // If I use Web Worker API in main, I need to update worker to use self.onmessage (Web API).
            // I did write `self.onmessage = ...` in mma_worker.ts!
            // AND I imported `parentPort`. Mixed styles.
            // `self` is for Web Workers. `parentPort` is for Node workers.
            // I will use Web Worker API here as it's more idiomatic for Bun.

            const worker = new Worker(new URL("./mma_worker.ts", import.meta.url));
            worker.postMessage({ pageIndex });

            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };

            worker.onerror = (err) => {
                console.error("Worker error:", err);
                reject(err);
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
