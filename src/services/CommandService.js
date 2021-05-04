'use strict';

const { Permissions } = require("discord.js");
const Context = require("../utils/Context");

class CommandService {
    constructor(client) { 
        this.client = client;
    }

    async handle (message) {
        const guild = message.guild;
        const me = guild.members.cache.get(this.client.user.id);

        //Est ce que le bot peut parler ?
        const channelBotPerms = new Permissions(message.channel.permissionsFor(me));

        if (!me.hasPermission("SEND_MESSAGES") || !channelBotPerms.has("SEND_MESSAGES")) return;

        //Si on mentionne le bot il donne le prefix
        const mention = message.content.startsWith(`${"<@!" || "<@"}${this.client.user.id}>`);
        if (mention) return message.channel.send(`My prefix is \`${this.client.prefix}\` on this server.`);
        
        //On attaque la partie si c'est une commande donc si ca commence bien par le préfix 
        if (!message.content.startsWith(this.client.prefix)) return;

        //On récupère les arguments on retire le préfix et crée un tableau en séparant chaque mots 
        const args = message.content.slice(this.client.prefix.length).split(/ +/g);
        //On récupère la commande donc le premier mot args.shift() et on check sur le commandManager
        const command = this.client.commands.findCommand(args.shift());
        
        //Si il y en a pas on fait rien
        if (!command) return;

        //Si la commande est juste pour les créateurs on l'éxecute pas :(
        if (command.ownerOnly && !this.client.config.owners.includes(message.author.id)) {
            if (!command.hidden) return message.channel.send(`You can't use this command, it's for my creator.`);
        }

        //Si la commande demande des permissions aux utilisateurs
        if (command.userPerms.length > 0 && !command.userPerms.some(p => guild.members.cache.get(message.author.id).hasPermission(p) )) {
            return message.channel.send(`You must have \`${command.userPerms.join("`, `")}\` permissions to execute this command.`);
        }

        if (!me.hasPermission("EMBED_LINKS") || !channelBotPerms.has("EMBED_LINKS")) return message.channel.send("The bot must have the `EMBED_LINKS` permissions to work properly !");

        //Si le bot manques de permissions
        if (command.botPerms.length > 0 && !command.botPerms.every(p => me.hasPermission(p) && channelBotPerms.has(p))) {
            return message.channel.send(`The bot must have \`${command.botPerms.join("`, `")}\` permissions to execute this command.`);
        }

        //Si la commande est désactivée
        if(command.disabled && !this.client.config.owners.includes(message.author.id)){
            return message.channel.send(`Sorry but this command was temporarly disabled.`);
        }

        const ctx = new Context(this.client, message, args);

        try {
            await command.run(ctx);
            this.client.logger.info(`Command ${command.name} executed by ${ctx.member.user.username} in ${ctx.guild.name}`);
        } catch (error) {
            //faites quelque chose si il y a une erreur sur une commande
            message.channel.send(`Sorry but, an error was occured.`);
            this.client.logger.error(error);
        }
    }
}

module.exports = CommandService;