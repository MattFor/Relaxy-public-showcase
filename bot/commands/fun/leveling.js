'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const types = {
    1: `\nShowing levelup images & messages!`,
    2: `\nShowing only levelup messages!`,
    3: `\nShowing only levelup images!`,
    4: `\nNot showing levelup images or messages!`
}


export default {
    name: 'leveling',
    aliases: ['lvling'],
    cooldown: 30,
    usage: '=leveling type (optional)',
    description: 'Relaxy enabled leveling on the server.\nTypes of leveling are:\n**1** - Shows messages on levelup along with cards,\n**2** - Shows only messages on levelup,\n**3** - Shows only levelup cards,\n**4** - Doesn\'t show anything.\nEnabling leveling gives access to the `=leaderboard` and `=level` commands.',
    permissions: ['MANAGE_GUILD'],
    permissionsBOT: ['ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        const guildName = client.utils.firstLetterUp(message.guild.name)

        const type = Number(args[0])

        if (guild.plugins.leveling.enabled && type) {

            if ([1, 2, 3, 4].includes(type)) {
                client.save(guild.id, { to_change: 'plugins.leveling.type', value: type })
                return new client.class.error(`Setting leveling type ${type} for use in ${guildName}${types[type]}`, message)
            }

            return new client.class.error('Invalid leveling type specified, use 1-4!', interaction ?? message)
        }

        if (guild.plugins.leveling.enabled && !type) {
            client.save(guild.id, { to_change: 'plugins.leveling.enabled', value: false })
            return new client.class.error(`Disabled leveling in ${guildName}!`, message)
        }

        if (!guild.plugins.leveling.enabled && !type) {
            client.save(guild.id, { to_change: 'plugins.leveling.type', value: 1 }, { to_change: 'plugins.leveling.enabled', value: true })
            return new client.class.error(`No type specified for ${guildName}, using type 1!\nShowing levelup images & messages!`, message)
        }

        if ([1, 2, 3, 4].includes(type)) {
            client.save(guild.id, { to_change: 'plugins.leveling.type', value: type }, { to_change: 'plugins.leveling.enabled', value: true })
            return new client.class.error(`Setting leveling type ${type} for use in ${guildName}${types[type]}`, message)
        }

        return new client.class.error('Invalid leveling type specified, use 1-4!', interaction ?? message)
    }
}