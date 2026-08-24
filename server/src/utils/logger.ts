export const logger = {
  info: (msg: string, ...args: any[]) => console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${msg}`, ...args),
  success: (msg: string, ...args: any[]) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${msg}`, ...args),
  job: (jobName: string, msg: string) => console.log(`\x1b[35m[JOB:${jobName}]\x1b[0m ${new Date().toISOString()} - ${msg}`),
};
