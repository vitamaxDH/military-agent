// @bun
// scripts/aggregate.ts
import fs from "fs";
import path from "path";
var __dirname = "/Users/daehan/project/personal/military-agent/scripts";
function normalizeName(name) {
  return name.replace(/\(\uC8FC\)/g, "").replace(/\(\uC720\)/g, "").replace(/\uC8FC\uC2DD\uD68C\uC0AC/g, "").replace(/\uC720\uD55C\uD68C\uC0AC/g, "").replace(/[\u321C\u3214]/g, "").replace(/\s+/g, "").trim();
}
async function aggregate() {
  console.log("Aggregating data from multiple sources...");
  const dataDir = path.join(__dirname, "../data");
  const publicDataDir = path.join(__dirname, "../web/public/data");
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  const companiesPath = path.join(dataDir, "companies.json");
  if (!fs.existsSync(companiesPath)) {
    console.error("Error: companies.json missing.");
    return;
  }
  const companies = JSON.parse(fs.readFileSync(companiesPath, "utf-8"));
  console.log(`Loaded ${companies.length} designated companies.`);
  let allJobs = [];
  const saraminPath = path.join(dataDir, "jobs_saramin.json");
  if (fs.existsSync(saraminPath)) {
    const saraminJobs = JSON.parse(fs.readFileSync(saraminPath, "utf-8"));
    console.log(`Loaded ${saraminJobs.length} jobs from Saramin.`);
    allJobs = allJobs.concat(saraminJobs);
  } else {
    console.warn("Warning: jobs_saramin.json missing.");
  }
  const jobkoreaPath = path.join(dataDir, "jobs_jobkorea.json");
  if (fs.existsSync(jobkoreaPath)) {
    const jobkoreaJobs = JSON.parse(fs.readFileSync(jobkoreaPath, "utf-8"));
    console.log(`Loaded ${jobkoreaJobs.length} jobs from JobKorea.`);
    allJobs = allJobs.concat(jobkoreaJobs);
  } else {
    console.warn("Warning: jobs_jobkorea.json missing.");
  }
  const wantedPath = path.join(dataDir, "jobs_wanted.json");
  if (fs.existsSync(wantedPath)) {
    const wantedJobs = JSON.parse(fs.readFileSync(wantedPath, "utf-8"));
    console.log(`Loaded ${wantedJobs.length} jobs from Wanted.`);
    allJobs = allJobs.concat(wantedJobs);
  } else {
    console.warn("Warning: jobs_wanted.json missing.");
  }
  console.log(`Total jobs to process: ${allJobs.length}`);
  const companyMap = new Map;
  companies.forEach((c) => {
    companyMap.set(normalizeName(c.name), c);
  });
  const matchedJobs = [];
  allJobs.forEach((job) => {
    const jobNorm = normalizeName(job.company);
    let match;
    if (companyMap.has(jobNorm)) {
      match = companyMap.get(jobNorm);
    }
    if (match) {
      matchedJobs.push({
        ...job,
        isDesignated: true,
        designatedCompanyInfo: match
      });
    }
  });
  console.log(`Matched ${matchedJobs.length} jobs out of ${allJobs.length}.`);
  fs.writeFileSync(path.join(publicDataDir, "matched_jobs.json"), JSON.stringify(matchedJobs, null, 2));
  console.log(`Saved matched jobs to web/public/data/matched_jobs.json`);
}
aggregate();
