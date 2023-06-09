'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'lockdown',
    permissions: ['BAN_MEMBERS', 'MANAGE_MESSAGES', 'MANAGE_GUILD'],
    permissionsBOT: ['BAN_MEMBERS', 'MANAGE_MESSAGES', 'MOVE_MEMBERS'],
    cooldown: 5,
    usage: '=lockdown',
    description: 'Every message is going to get deleted, noone will be able to join the server and noone will be able to join any voice chat when lockdown mode is activated.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.lockeddown) {
            client.save(guild.id, { to_change: 'lockeddown', value: false })

            if (guild.plugins.modlog.enabled)
                client.data.modlog_posts[channel.guild.id].push(['other', new client.class.modlog({
                    color: 'good',
                    event: 'LOCKDOWN has been lifted!',
                    description: `\`\`\`fix\n${message.guild.name}'s lockdown has been lifted! 🔑🔓\n\`\`\``,
                    thumbnail: channel.guild.iconURL({ dynamic: true, size: 4096 })
                })])

            message.guild.channels.cache.forEach(async channel => {
                channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    'SendMessages': true,
                    'AddReactions': true,
                    'Speak': true,
                    'Connect': true,
                })
            })

            client.log(`${message.guild.name} lifted LOCKDOWN!`, 'ERROR')

            return new client.class.error(`description ${message.guild.name}'s lockdown has been lifted! 🔑🔓`, message)
        }

        new client.class.error(`description ${message.guild.name} has been put into LOCKDOWN! 🔒`, message)
        client.module.profiles.Achievement(message, 'lockeddown', guild)

        return setTimeout(async () => {

            client.save(guild.id, { to_change: 'lockeddown', value: true })

            try {
                message.guild.channels.cache.forEach(async channel => {
                    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        'SendMessages': false,
                        'AddReactions': false,
                        'Speak': false,
                        'Connect': false,
                    })
                })
            } catch { 
                new client.class.error('Missing permissions to overwrite channel permissions.', interaction ?? message);
            }

            client.log(`${message.guild.name} went into LOCKDOWN!`, 'ERROR')

            if (guild.plugins.modlog.enabled)
                client.data.modlog_posts[channel.guild.id].push(['other', new client.class.modlog({
                    color: 'bad',
                    event: 'LOCKDOWN INITIATED!',
                    description: `\`\`\`diff\n- ${message.guild.name}'s has been put into lockdown! 🔒\n\`\`\``,
                    thumbnail: channel.guild.iconURL({ dynamic: true, size: 4096 })
                })])
        }, 1000)
    }
}