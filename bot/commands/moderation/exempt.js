'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'exempt',
    usage: '=exempt users / roles',
    description: 'Disables ALL danger checks for ALL Relaxy commands for a specified user / role.\nDon\'t input anything to show current excepmtions.',
    permissions: ['MANAGE_GUILD'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let exemptions = guild.plugins.person_exceptions

        let added = []
        let removed = []

        let embed = {
            color: client.data.embedColor,
            title: 'Exemptions:',
            fields: []
        }

        let arg_len = args.length
        for (let i = 0; i < arg_len; i++) {
            let user = (await client.utils.member(message, args, i))?.user
            let role = client.utils.role(message, args, i)

            if (!user && !role)
                return new client.class.error(`Item [${i + 1}] is neither a role nor a user!`, message)

            if (user)
                if (exemptions.includes(user.id)) {
                    removed.push(user.id)
                    exemptions.splice(exemptions.indexOf(user.id), 1)
                } else {
                    added.push(user.id)
                    exemptions.push(user.id)
                }

            if (role)
                if (exemptions.includes(role.id)) {
                    removed.push(role.id)
                    exemptions.splice(exemptions.indexOf(role.id), 1)
                } else {
                    added.push(role.id)
                    exemptions.push(role.id)
                }
        }

        client.save(guild.id, { to_change: 'plugins.person_exceptions', value: exemptions })

        if (added.length > 0)
            embed.fields.push({ name: 'Added:', value: await client.utils.makeList(added, message.guild.roles.cache, 0) })

        if (removed.length > 0)
            embed.fields.push({ name: 'Removed:', value: await client.utils.makeList(removed, message.guild.roles.cache, 0) }) 

        embed = client.utils.createDescription(await client.utils.makeList(exemptions, message.guild.roles.cache, 0), embed)

        return client.send(message.channel, null, [embed])
    }
}