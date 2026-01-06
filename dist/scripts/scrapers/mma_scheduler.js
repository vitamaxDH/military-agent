// @bun
// scripts/scrapers/mma_scheduler.ts
import { Worker } from "worker_threads";
import fs from "fs";
import path from "path";
var __dirname = "/Users/daehan/project/personal/military-agent/scripts/scrapers";
var MAX_PAGES = 50;
var CONCURRENCY = 2;
async function main() {
  console.log(`[Scheduler] Starting multi-core scraping with ${CONCURRENCY} workers for max ${MAX_PAGES} pages...`);
  let allCompanies = [];
  const queue = Array.from({ length: MAX_PAGES }, (_, i) => i + 1);
  let activeWorkers = 0;
  let completed = 0;
  const runWorker = (pageIndex) => {
    return new Promise((resolve, reject) => {
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
  const results = [];
  const executing = [];
  const saveProgress = () => {
    const dataDir = path.join(__dirname, "../../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    fs.writeFileSync(path.join(dataDir, "companies.json"), JSON.stringify(allCompanies, null, 2));
    console.log(`[Scheduler] Progress saved. (${allCompanies.length} companies)`);
  };
  for (const pageIndex of queue) {
    const p = runWorker(pageIndex).then((companies) => {
      if (companies.length > 0) {
        allCompanies.push(...companies);
        saveProgress();
      }
    });
    results.push(p);
    const e = p.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);
    if (executing.length >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(results);
  saveProgress();
  console.log(`[Scheduler] Complete! Saved ${allCompanies.length} companies to data/companies.json`);
}
main();
