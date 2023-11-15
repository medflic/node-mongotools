import 'dotenv/config'
import { MongoTools, MTOptions, MTCommand } from "./lib/mt.js";
import { CronJob } from 'cron';
import axios from 'axios';
import qs from 'querystring'

const fetchDropBoxAccessToken = async (dropboxRefreshToken) => {
  let dataQuery = qs.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': dropboxRefreshToken,
    'client_id': process.env.DROP_BOX_CLIENT_ID,
    'client_secret': process.env.DROP_BOX_CLIENT_SECRET
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.dropbox.com/oauth2/token',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : dataQuery
  };
  const { data } = await axios.request(config)
  return data.access_token;
}


async function dumpAndRotate(uri, path, { dropboxRefreshToken, dropBoxPath } = {}) {
  var mt = new MongoTools();
  var mtc = new MTCommand();// to reuse log methods
  let dropboxToken;
  if (dropboxRefreshToken) {
    dropboxToken = await fetchDropBoxAccessToken(dropboxRefreshToken)
  }
  const dumpResult = await mt.mongodump({ uri, path, dropboxToken, dropboxLocalPath: dropBoxPath })
    .catch(mtc.logError.bind(mtc));
  if (dumpResult === undefined) {// error case
    process.exit(1);
  }
  mtc.logSuccess(dumpResult);

  // backups rotation
  const rotationResult = await mt.rotation({path, rotationWindowsDays: 5, rotationMinCount:1, dropboxToken, dropboxLocalPath: dropBoxPath })
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
    
    if (process.env.SCHEDULED_BACKUP === 'true') {
      new CronJob(scheduledTime, () => dumpAndRotate(uri, path, {  dropboxRefreshToken: process.env.DROP_BOX_REFRESH_TOKEN, dropBoxPath }), null, true, 'Asia/Kolkata');
      console.log(`*** SUCCESS BACKUP INITIATED for ${uri.slice(-7)} AND BACKUP TIME IS ${scheduledTime} **** `)
    }
    dumpAndRotate(uri, path, {  dropboxRefreshToken: process.env.DROP_BOX_REFRESH_TOKEN, dropBoxPath });
    
}
