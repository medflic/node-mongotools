import os from "os";

import { MongoTools, MTOptions, MTCommand } from "./lib/mt.js";
import { CronJob } from 'cron';
async function dumpAndRotate(uri, path){
  var mt = new MongoTools();
  var mtc = new MTCommand();// to reuse log methods
  const dumpResult = await mt.mongodump({ uri, path })
    .catch(mtc.logError.bind(mtc));
  if (dumpResult === undefined) {// error case
    process.exit(1);
  }
  mtc.logSuccess(dumpResult);

  // backups rotation
  const rotationResult = await mt.rotation({path, rotationWindowsDays: 5, rotationMinCount:1})
    .catch(mtc.logError.bind(mtc));
  if (rotationResult === undefined) {// error case
    process.exit(1);
  }
  mtc.logSuccess(rotationResult);
}

const backupPath = process.argv.slice(2)[0] ||  `backup/${os.hostname()}`

  const envs = process.env;
  const sortedEnvs = Object.keys(process.env).sort((a, b) => a - b);
  const mongoURLS = sortedEnvs.filter(e => e.startsWith('MONGO_URI_'));
  if (mongoURLS.length === 0) {
    throw new Error("Nothing to backup");
  }
  
  const backupDirPath = sortedEnvs.filter(e => e.startsWith('BACKUP_DIR_PATH_'));
  const scheduledTimes = sortedEnvs.filter(e => e.startsWith('SCHEDULED_TIME_'));
  
  for (let index = 0; index < mongoURLS.length; index++) {
    const uri = envs[mongoURLS[index]];
    const path = envs[backupDirPath[index]] || backupPath
    const scheduledTime = envs[scheduledTimes[index]] || '0 0 0 * * *';
    if (process.env.SCHEDULED_BACKUP === 'true') {
      new CronJob(scheduledTime, () => dumpAndRotate(uri, path), null, true, 'Asia/Kolkata');
      console.log(`*** SUCCESS BACKUP INITIATED for ${uri.slice(-7)} AND BACKUP TIME IS ${scheduledTime} **** `)
    } else {
      dumpAndRotate(uri, path);
    }
}
