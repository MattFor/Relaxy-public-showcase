'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Discord from 'discord.js'
import Mongoose from 'mongoose'


export default {
    name: 'autorole',
    description: 'Input roles to be added (deleted it already present) to a list.\nAll of the roles from this list will be added to anyone joining the server.\nType "off" as the only argument to turn it off.\nType nothing to show current autoroles.',
    permissions: ['MANAGE_ROLES'],
    permissionsBOT: ['MANAGE_ROLES'],
    usage: '=autorole roles',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let result = guild.plugins.autoroles

        let added = []
        let removed = []

        let embed = {
            color: client.data.embedColor,
            title: 'Autoroles:',
            fields: []
        }

        if (args.length === 0)
            return client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Autoroles:',
                description: `${result.map(r => { return `<@&${r}>` }).join(', ') || 'None'}.`
            }])

        if (args[0].toLowerCase() == 'off') {
            client.save(guild.id, { to_change: 'plugins.autoroles', value: [] })
            return client.send(message.channel.id, null, {
                color: client.data.embedColor,
                title: 'Autoroles have been turned off.'
            })
        }

        for (const item of args) {
            let i = message.guild.roles.cache.find(role => role.id === client.utils.nums(item))

            if (!i)
                return new client.class.error(`Role: [${item}] is invalid!`, message)
            if (i.managed)
                return new client.class.error(`Role: [${item}] cannot be added as it's managed another service!`, message)
            if (i.position > message.guild.me.roles.highest.position)
                return new client.class.error(`Role: [${item}] is above Relaxy's highest role!`, message)

            if (guild.plugins.autoroles.includes(i.id)) {
                removed.push(i.id)
                result.splice(result.indexOf(i.id), 1)
            } else {
                added.push(i.id)
                result.push(i.id)
            }
        }

        client.save(guild.id, { to_change: 'plugins.autoroles', value: result })

        if (added.length > 1)
            embed.fields.push({ name: 'Added roles:', value: `${added.map(r => { return `<@&${r}>` }).join(', ')}.`})

        if (removed.length > 1)
            embed.fields.push({ name: 'Removed roles:', value: `${removed.map(r => { return `<@&${r}>` }).join(', ')}.`})

        embed.description = `${result.map(r => { return `<@&${r}>` }).join(', ') || 'None'}.`

        return client.send(message.channel, null, [embed])
    }
}