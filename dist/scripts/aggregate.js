// @bun
// scripts/aggregate.ts
import fs from "fs";
import path from "path";
var __dirname = "/Users/daehan/project/personal/military-agent/scripts";
function getKSTDate() {
  const now = new Date;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60 * 1000);
}
function parseDeadline(deadlineStr) {
  if (!deadlineStr)
    return null;
  const cleanStr = deadlineStr.replace(/\s+/g, "");
  const nowKST = getKSTDate();
  const currentYear = nowKST.getFullYear();
  if (cleanStr.includes("Today") || cleanStr.includes("\uC624\uB298\uB9C8\uAC10") || cleanStr.includes("D-0")) {
    const d = new Date(nowKST);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const dMatch = cleanStr.match(/D-(\d+)/i);
  if (dMatch) {
    const days = parseInt(dMatch[1], 10);
    const d = new Date(nowKST);
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  let datePart = cleanStr.replace("~", "").trim();
  datePart = datePart.replace(/\(.\)/, "");
  const slashMatch = datePart.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    let year = currentYear;
    if (month < nowKST.getMonth() - 1) {
      year++;
    }
    const d = new Date(year, month, day);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const dotMatch = datePart.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (dotMatch) {
    const year = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10) - 1;
    const day = parseInt(dotMatch[3], 10);
    const d = new Date(year, month, day);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (cleanStr.includes("\uCC44\uC6A9\uC2DC") || cleanStr.includes("\uC0C1\uC2DC")) {
    return new Date(9999, 11, 31);
  }
  return null;
}
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
  const nowKST = getKSTDate();
  let filteredCount = 0;
  allJobs.forEach((job) => {
    const deadlineDate = parseDeadline(job.deadline);
    if (deadlineDate && deadlineDate < nowKST) {
      filteredCount++;
      return;
    }
    const jobNorm = normalizeName(job.company);
    let match;
    if (companyMap.has(jobNorm)) {
      match = companyMap.get(jobNorm);
    }
    if (match) {
      matchedJobs.push({
        ...job,
        isDesignated: true,
        designatedCompanyInfo: match,
        closed: false
      });
    }
  });
  console.log(`Matched ${matchedJobs.length} jobs out of ${allJobs.length}. (Filtered ${filteredCount} expired jobs)`);
  fs.writeFileSync(path.join(publicDataDir, "matched_jobs.json"), JSON.stringify(matchedJobs, null, 2));
  console.log(`Saved matched jobs to web/public/data/matched_jobs.json`);
}
aggregate();
