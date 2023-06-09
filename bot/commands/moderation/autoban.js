'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'autoban',
    cooldown: 20,
    permissions: ['BAN_MEMBERS', 'MANAGE_MESSAGES'],
    permissionsBOT: ['BAN_MEMBERS', 'MANAGE_MESSAGES'],
    usage: '=autoban number',
    description: 'Sets autobanning for the server (works only if **`=censor`** is enabled)\nThe number specified is how many warnings a person gets before being banned.\n```fix\nDoesn\'t affect admins and people with permissions to ban.\n```(Max autoban number is 100)',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!guild.plugins.censoring.enabled)
            return new client.class.error(`Cannot enable autobanning without censoring first!`, message)

        if (guild.plugins.censoring.autobanning && !args[0]) {
            client.save(guild.id, { to_change: 'plugins.censoring.autobanning', value: 0 }, { to_change: 'warnings', value: {} })
            return new client.class.error(`Autobans deactivated for ${message.guild.name}!`, message)
        }

        if (!args[0]) {
            client.save(guild.id, { to_change: 'plugins.censoring.autobanning', value: 3 })
            return new client.class.error(`No warning number specified, using default preset - 3!`, message)
        }

        let num = Number(args[0])

        if (isNaN(num) || num <= 0 || num > 100)
            return new client.class.error('Input is not a number/invalid', message)

        new client.class.error(`Autobans changed to ${args[0]} for ${message.guild.name}!`, message)

        return client.save(guild.id, { to_change: 'plugins.censoring.autobanning', value: num })
    }
}