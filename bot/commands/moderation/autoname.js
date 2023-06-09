'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Discord from 'discord.js'
import Mongoose from 'mongoose'


export default {
    permissions: [],
    name: 'autoname',
    description: '```diff\n- ONLY WORKS IF CENSORING IS ENABLED\n```Will automatically rename any person with a censored word in their name to something like \'Renamed(random numbers)\'.',
    permissions: ['MANAGE_NICKNAMES'],
    permissionsBOT: ['MANAGE_NICKNAMES'],
    usage: '=autoname',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!guild.plugins.censoring.enabled)
            return new client.class.error('Censoring isn\'t enabled on the server!', interaction ?? message)

        if (guild.plugins.censoring.renaming) {
            client.save(message.guild.id, { to_change: 'plugins.censoring.renaming', value: false })
            return new client.class.error('Automatic name censoring removed!', interaction ?? message)
        }

        client.save(message.guild.id, { to_change: 'plugins.censoring.renaming', value: true })

        return new client.class.error('Automatic name censoring enabled!', interaction ?? message)
    }
}