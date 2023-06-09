'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'musicoptions',
    usage: '=musicoptions',
    permissions: ['MANAGE_GUILD'],
    aliases: ['rmo'],
    description: 'Shows the Relaxy! music options in a given server, you can type =change (1 - 3) to change the corresponding options.\n**(Should you want to change music buffer time, after the initial command type \'3 (buffer time(time in ms [min 0, max 60000 (1 min)])**',
    cooldown: 5,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
    return client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: `${message.guild.name}'s music options:`,
            description: `\`1.\` Leave after calling =stop: **\`${guild.music_options.leaveOnStop ? 'YES' : 'NO'}\`**\n\`2.\` Leave after music ends: **\`${guild.music_options.leaveOnEnd ? 'YES' : 'NO'}\`**\n\`3.\` Music buffer timeout: **\`${client.imports.time(guild.music_options.bufferingTimeout)}\`**`,
            thumbnail: { url: `attachment://${message.guild.id}.gif` },
        }], [{
            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
            name: `${message.guild.id}.gif`
        }]).then(m => {
        m.channel.awaitMessages({ filter: async msg => msg.author.id === message.author.id && msg.content.startsWith('=change'),
                max: 1,
                time: 3000000,
                errors: ['time']
            })
            .then(async collected => {
                let cargs = collected.first().content.split(' ')
                cargs.shift()
                switch (cargs[0]) {
                    case '1':
                        if (guild.music_options.leaveOnStop) {
                            client.save(guild.id, { to_change: 'music_options.leaveOnStop', value: false })
                            return new client.class.error('Relaxy will now stay in the channel, even after =stop is called!', interaction ?? message)
                        }
                        client.save(guild.id, { to_change: 'music_options.leaveOnStop', value: true })
                        return new client.class.error('Relaxy will leave the channel when =stop is called!', interaction ?? message)
                    case '2':
                        if (guild.music_options.leaveOnEnd) {
                            client.save(guild.id, { to_change: 'music_options.leaveOnEnd', value: false })
                            return new client.class.error('Relaxy will now stay in channels, even after the music ends!', interaction ?? message)
                        }
                        client.save(guild.id, { to_change: 'music_options.leaveOnEnd', value: true })
                        return new client.class.error('Relaxy will now leave channels when music ends!', interaction ?? message)
                    case '3':
                        if (!cargs[1]) return new client.class.error('You haven\'t set the millisecond timeout number!', interaction ?? message)
                        cargs[1] = Number(cargs[1])
                        if (cargs[1] < 0 || cargs[1] > 60000)
                            return new client.class.error('Time is invalid!', interaction ?? message)
                        client.save(guild.id, { to_change: 'music_options.bufferingTimeout', value: Number(cargs[1]) })
                        
                        return new client.class.error(`Buffering time set to ${client.imports.time(cargs[1])}!`, message)
                    default:
                        return new client.class.error('Invalid option chosen!', interaction ?? message)
                }
            }).catch(() => { 
                return new client.class.error('Timeout! Try typing the command again to change options', interaction ?? message) 
            })
        })
    }
}