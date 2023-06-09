'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'prefix',
    permissions: ['MANAGE_GUILD'],
    aliases: ['prefixadd', 'aprefix'],
    usage: '=prefix new prefix(es)',
    description: 'Add a prefix (or multiple) to Relaxy! on this server! (Type =prefix set (prefix) to erase all others and have only 1)]\nType \'set\' as the first argument and the desired prefix as the second to remove all other prefixes and set it to the desired one.',
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (args.length === 2 && args[0] === 'set') {

            if (args[0].startsWith('/'))
                return new client.class.error('Prefix cannot start with /', interaction ?? message)

            client.save(guild.id, { to_change: 'prefixes', value: [args[1]] })

            return new client.class.error(`Set ${args[1]} as the only prefix!`, interaction ?? message)
        }

        if (guild.prefixes.length >= 10 || guild.prefixes.length + args.length > 10)
            return new client.class.error('Cannot have more than 10 prefixes!', interaction ?? message)

        let flag = false, guild_prefixes = guild.prefixes

        args.forEach(arg => {
            if (flag) return

            if (arg.length > 10) {
                flag = true
                return new client.class.error('Max prefix length is 10 characters!', interaction ?? message)
            }

            if (arg.includes('/')) {
                flag = true
                return new client.class.error('Prefix cannot start with /', interaction ?? message)
            }

            return guild_prefixes.push(arg)
        })

        client.save(guild.id, { to_change: 'prefixes', value: guild_prefixes })
        
        return new client.class.error(`description ${args.map((arg) => { 
            return `**${arg}` }).join(',** ') 
        }** has been added to **${client.utils.firstLetterUp(message.guild.name)}**'s prefixes!`, interaction ?? message)
    },
}