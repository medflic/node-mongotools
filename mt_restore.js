import { MongoTools, MTCommand } from "./lib/mt.js";


async function restore(dumpFile){
  var mt = new MongoTools();
  var mtc = new MTCommand();// to reuse log methods
  // mongorestore
  const restoreResult = await mt.mongorestore({
        host: process.env.MONGO_HOST,
        port: process.env.MONGO_PORT,
        username: process.env.MONGO_USER_NAME,
        password: process.env.MONGO_PASSWORD,
        db: process.env.MONGO_DB,
        targetDb: process.env.MONGO_TARGET_DB,
        authDb: 'admin',
        dumpFile,
        dropBeforeRestore: false,
        deleteDumpAfterRestore: false,
        showCommand: true,
    })
    .catch(mtc.logError.bind(mtc));
  if (restoreResult === undefined) {// error case
    process.exit(1);
  }
  mtc.logSuccess(restoreResult);
}

// take first command line argument
if (process.argv.slice(2).length !== 1) {
  console.log("please provide backup full filename as argument");
  process.exit(1);
}
const backupFilePath = process.argv.slice(2)[0];

restore(backupFilePath);
