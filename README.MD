# PUTIO CLONE

## Download Torrent Instantly with just pasting the magnet uri into the website's ui.

----
## GIT COMMANDS
### To execute git pull origin master on a specific directory every hour, you can use a cron job on a Unix-based system (e.g., Linux, macOS). Here's how to set it up:

#### Step-by-step:

###### Open your terminal.

##### Edit the crontab (cron table):
```bash
crontab -e
```
##### Add a cron job to run every hour. To execute the command every hour, add this line to the crontab file:


##### Copy code
```bash
0 * * * * cd /path/to/your/git/repo && git pull origin master >> /path/to/your/logfile.log 2>&1
```

- ###### 0 * * * *: This means the task will run at minute 0 of every hour.

- ###### cd /path/to/your/git/repo: This navigates to the directory where your Git repository is located.

- ###### git pull origin master: This pulls the latest changes from the master branch.

---- 
----

>> /path/to/your/logfile.log 2>&1: This logs the output to a file (optional, but useful for debugging).


### Save and exit.

The cron job will now run every hour and pull the latest changes from the master branch of the repository.
