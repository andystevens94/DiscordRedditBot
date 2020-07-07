// required the needed files
//const Discord = require('discord.js');
const helpers = require('./../business/helpers');
let https = require('https');

module.exports = { dailyMeme };

function dailyMeme(channel) {
	let limit = 50;
	let int = helpers.getRandomInt(0, limit - 1);
	let url = `https://www.reddit.com/r/ProgrammerHumor/top.json?t=day&limit=${limit}`;
	let jsonResponse;
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
					channel.send(postData.title, { files: [postData.url] });
					break;
				}
			}
		});
	}).on('error', function (e) {
		console.log("Got an error: ", e);
	});
}