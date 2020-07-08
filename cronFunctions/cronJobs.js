// require cron for timed messages and custom cron based functions
const cron = require('cron');
const cronFuncs = require('./dailyMeme');

module.exports = { runJobs };

function runJobs(channel) {
	// send meme on weekdays at 9am
	let scheduledMessage = new cron.CronJob('0 9 * * 1-5', () => {
		cronFuncs.dailyMeme(channel);
	}, undefined, true, "Europe/London");

	// When you want to start it, use:
	scheduledMessage.start();
}


