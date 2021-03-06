// require the node file system module
const fs = require('fs');
// require the discord.js module
const Discord = require('discord.js');

// include the config
const { prefix, defaultCooldown } = require('./config.json');
const token = process.env.DISCORD_TOKEN;
// create a new Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
// create a list of cooldowns
const cooldowns = new Discord.Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}
let cron = require('./cronFunctions/cronJobs');
let server;
let cronChannel;
// when the client is ready, run this code. This event will only trigger one time after logging in
client.once('ready', () => {
	server = client.guilds.cache.get("725682391682908180");
	cronChannel = server.channels.cache.get('725682391682908183');
	cron.runJobs(cronChannel);
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		return message.channel.send(reply);
	}
	if (command.guildOnly && message.channel.type !== 'text') {
		return message.reply('I can\'t execute that command inside DMs!');
	}
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || defaultCooldown) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

// login to Discord with your app's token
client.login(token);