import 'dotenv/config'
import { MongoTools, MTOptions, MTCommand } from "./lib/mt.js";
import { CronJob } from 'cron';
async function dumpAndRotate(uri, path, { dropboxToken, dropBoxPath } = {}) {
  var mt = new MongoTools();
  var mtc = new MTCommand();// to reuse log methods
  const dumpResult = await mt.mongodump({ uri, path, dropboxToken, dropboxLocalPath: dropBoxPath })
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



const backupPath = process.argv.slice(2)[0] ||  `backup`

  const envs = process.env;
  const sortedEnvs = Object.keys(process.env).sort((a, b) => a - b);
  const mongoURLS = sortedEnvs.filter(e => e.startsWith('MONGO_URI_')).sort();
  if (mongoURLS.length === 0) {
    throw new Error("Nothing to backup");
  }
  
  const backupDirPath = sortedEnvs.filter(e => e.startsWith('BACKUP_DIR_PATH_')).sort();
  const scheduledTimes = sortedEnvs.filter(e => e.startsWith('SCHEDULED_TIME_')).sort();
  const dropBoxBackupDirPath =  sortedEnvs.filter(e => e.startsWith('DROP_BOX_BACKUP_PATH_')).sort(); 
  for (let index = 0; index < mongoURLS.length; index++) {
    const uri = envs[mongoURLS[index]];
    if(!uri) {
        continue;
    }
    const path = envs[backupDirPath[index]] || backupPath
    const dropBoxPath =  envs[dropBoxBackupDirPath[index]] || backupPath
    const scheduledTime = envs[scheduledTimes[index]] || '0 0 0 * * *';
    
    console.log({ uri, path })
    if (process.env.SCHEDULED_BACKUP === 'true') {
      new CronJob(scheduledTime, () => dumpAndRotate(uri, path, {  dropboxToken: process.env.DROP_BOX_TOKEN, dropBoxPath }), null, true, 'Asia/Kolkata');
      console.log(`*** SUCCESS BACKUP INITIATED for ${uri.slice(-7)} AND BACKUP TIME IS ${scheduledTime} **** `)
    } else {
      dumpAndRotate(uri, path, {  dropboxToken: process.env.DROP_BOX_TOKEN, dropBoxPath });
    }
}
