'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'ping',
    aliases: ['rtime', 'reactiontime'],
    usage: '=ping',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Show Relaxy\'s current sever shard\'s response time.',
    cooldown: 2,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return new client.class.error(`description Shard **\`${
            message.guild.shardId
        }\`**\nLatency:  **\`${
            client.ws.ping
        }ms\`**.\nShard Uptime: \`${client.imports.time(client.uptime)}\`\nShard process uptime: \`${client.imports.time(process.uptime() * 1000)}\`\nMemory total: \`${process.memoryUsage().heapTotal / 1024 / 1024}mb\`\nMemory used: \`${process.memoryUsage().heapUsed / 1024 / 1024}mb\``, interaction ?? message)
    }
}