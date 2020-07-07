let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
'use strict';
let https = require('https');
let filterList = ["day", "week", "month", "year", "all", "hot"];
let helpers = require('./../business/helpers');

module.exports = {
	name: 'reddit',
	aliases: ['meme'],
	description: 'Gets image from reddit',
	usage: "<Subreddit> <Number of posts> <Filter>",
	cooldown: 1,
	help: `You have 3 parameters '**Subreddit**', '**Number of posts**', '**Filter**'
	***Subreddit:*** The page to pull a picture from. e.g 'ProgrammerHumor'.
	***Number of posts:*** The number of posts the bot will choose from. Max 100
	***Filter:*** Choose from 'day/week/month/year/all/hot'. They are all timeframes expect from hot which is a trending filter.
	***Defaults:*** 'ProgrammerHumor', 10, day`,
	execute(message, args) {
		//set variables if arguments have been passed
		let subreddit = args[0] === undefined ? "ProgrammerHumor" : args[0];
		let postCount = args[1] === undefined ? 10 : Number(args[1]);
		let filter = args[2] === undefined ? "day" : args[2];
		//If post count isn't integer send error 
		if (!Number.isInteger(postCount) || postCount < 1 || postCount > 100) {
			return message.channel.send(`Please select an integer from 1-100. ${message.author}!`);
		}

		//Check if subreddit is NSFW if it is then send error message.
		checkSubreddit(subreddit).then(function (resolve, reject) {
			//If filter isn't in list send error
			if (!filterList.includes(filter)) {
				message.channel.send(`Please select a valid filter. ${message.author}!`);
				return message.channel.send(`Fitlers include: day, week, month, year, all, hot`);
			}
			let url;
			if (filter === "hot") {
				url = `https://www.reddit.com/r/${subreddit}/${filter}.json?limit=${postCount}`;
			}
			else {
				url = `https://www.reddit.com/r/${subreddit}/top.json?t=${filter}&limit=${postCount}`;
			}
			let jsonResponse;
			let int = helpers.getRandomInt(0, postCount - 1);

			https.get(url, function (res) {
				let body = '';
				res.on('data', function (chunk) {
					body += chunk;
				});
				res.on('end', function () {
					jsonResponse = JSON.parse(body);
					//update post count with the number of distinct posts from json
					let jsonPostCount = jsonResponse.data.dist;

					for (let i = 0; i < jsonPostCount; i++) {
						let postInt = (int + i) % jsonPostCount;
						let postData = jsonResponse.data.children[postInt].data;
						//only post images that are sfw
						if (postData.post_hint && postData.post_hint === "image" && postData.over_18 === false) {
							message.channel.send(postData.title, { files: [postData.url] });
							break;
						}
						if (i === jsonPostCount - 1) {
							message.channel.send(`There are no images on https://www.reddit.com/r/${subreddit} from top ${postCount} posts!`);
						}
					}
				});

			}).on('error', function (e) {
				message.channel.send("Got an error: ", e);
			});
			//message.channel.send("", { files: [response.data.children[int].data.url] });
		}).catch(function (error) {
			try {
				message.channel.send(error.message);
			} catch (e) {
				console.log(e);
			}
		});
	}
};

function checkSubreddit(subreddit) {
	return new Promise(function (resolve, reject) {
		let reason;
		let url = `https://www.reddit.com/r/${subreddit}/about.json`;
		https.get(url, function (res) {
			let body = '';
			res.on('data', function (chunk) {
				body += chunk;
			});
			res.on('end', function () {
				response = JSON.parse(body);
				if (!response.data.over18 === false) {
					reason = new Error('We dont support NSFW subreddits, please choose a different one.');
					reject(reason);
				}
				else {
					resolve();
				}
			});

		}).on('error', function (e) {
			reason = new Error('Errored getting subreddit data, please make sure that the subreddit exists.');
			reject(reason);
		});
	});
}