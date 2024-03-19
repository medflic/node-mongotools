# node-mongo backup and restore

This project provides 2 wrappers :
- **mongodump**,
- **mongorestore**.

This project also include **dropbox** integration feature to 
- dump and upload onto dropbox,
- restore from a dropbox hosted mongo backup.

There is an autonomous feature called **rotation** that provide a backup file rotation mechanism
- remove N oldest deprecated backups.

This readme contains some samples. Other samples are under [examples/](./examples). 

## Command line usage

### Initial setup - first time only
```
# get source code
git clone https://github.com/boly38/node-mongotools.git
# install dependencies
npm install

```
#### Setup the user with role "restore" to Restore the database (this is mandatory when restore from one db to another db)
```bash
use admin;
db.createUser({
    user: 'xxx',
    pwd: 'xxxx',
    roles: ['restore']
});
```


### To Backup and Rotate
```bash
# create a mongo dump and rotate
export SCHEDULED_BACKUP=true # if not true, it will create a backup one time. it will not be scheduled
export MONGO_URI_1=mongodb://user:pass@localhost:27017/db1
export MONGO_URI_2=mongodb://user:pass@localhost:27017/db2
export BACKUP_DIR_PATH_1=backup/db/one
export BACKUP_DIR_PATH_2=backup/db/two
export SCHEDULED_TIME_1="0 0 0 * * *"
export SCHEDULED_TIME_2="0 0 0 * * *"

export DROP_BOX_CLIENT_ID="DROP_BOX_APP_CLIENT_ID"
export DROP_BOX_CLIENT_SECRET="DROP_BOX_APP_CLIENT_SECRET"
export DROP_BOX_REFRESH_TOKEN="DROP_BOX_APP_REFRESH_TOKEN" # this will enable uploading to DROP BOX
export DROP_BOX_BACKUP_PATH_1="backup/db_1"
export DROP_BOX_BACKUP_PATH_2="backup/db_2"
# Environment variable for MONGO_URI format should be  MONGO_URI_1 MONGO_URI_2, MONGO_URI_3...

# Environment variable for BACKUP_DIR_PATH format should be  BACKUP_DIR_PATH_1 BACKUP_DIR_PATH_2, BACKUP_DIR_PATH_3...

# Environment variable for SCHEDULED_TIME format should be  SCHEDULED_TIME_1 SCHEDULED_TIME_2, SCHEDULED_TIME_3...

# Use lib/dropbox to obtain the new DROP_BOX_REFRESH_TOKEN

node mt_backup_and_rotate.js
            OR 
pm2 start mt_backup_and_rotate.js
```

### To Restore
#### PreRequisite
```bash
# Setup the user with role "restore" to Restore the database (this is mandatory when restore from one db to another db)
use admin;
db.createUser({
    user: 'xxx',
    pwd: 'xxxx',
    roles: ['restore']
});
```
#### Restore a mongo local dump
```bash
# please note that mt restore use following options :  
    dropBeforeRestore: false, 
    deleteDumpAfterRestore: false

export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_USER_NAME=user
export MONGO_PASSWORD=pass
export MONGO_DB=backupedDb
export MONGO_TARGET_DB=restoreDb

                                    OR

create a .env file with all the above variables. .env file follows key=value pair format

if MONGO_TARGET_DB is not given it will try to restore it to the same db where the backup has taken

node mt_restore backup/myDatabase__2020-11-08_150102.gz



# Helper : show current options values
node mt options
```


### Dropbox feature
Dropbox limits:
- rotation feature will not apply if dropbox backup target directory content contains more than 2000 files.


### Additional Instructions on Virginia Server. 

- Created a adsbackup user, just need to update the role and db
- Update the .env file on node_mongotools
- start the service with `pm2 start mt_backup_and_rotate.js --interpreter=/home/build-user/.nvm/versions/node/v16.15.1/bin/node`
```
db.updateUser('adsbackup', {
 roles: [
       { role: "read", db: "creaudit_qa_new" },
       { role: "read", db: "ads_locations" },
    ]
})
```
