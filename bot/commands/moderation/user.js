'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
	name: 'user',
	cooldown: 3,
	usage: '=user user/role',
	permissions: ['MANAGE_GUILD'],
	description: 'If there is at least 1 entry on this list. ONLY that user / people with the role will be allowed to use Relaxy.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
	async run(client, message, args, guild, interaction) {
        let allowed = guild.plugins.allowed_people

        let added = []
        let removed = []

        let embed = {
            color: client.data.embedColor,
            title: 'Allowed users:',
            description: '',
            fields: []
        }

        let arg_len = args.length
        for (let i = 0; i < arg_len; i++) {
            let member = await client.utils.member(message, args, i)
            let role = client.utils.role(message, args, i)

            if (!member && !role)
                return new client.class.error(`Item [${i + 1}] is neither a role nor a user!`, message)

            if (member)
                if (allowed.includes(member.user.id)) {
                    removed.push(member.user.id)
                } else {
                    added.push(member.user.id)
                }

            if (role)
                if (allowed.includes(role.id)) {
                    removed.push(role.id)
                } else {
                    added.push(role.id)
                }
        }

        let _a_len = added.length
        for (let i = 0; i < _a_len; i++) {
            allowed.push(added[i])
        }

        let _r_len = removed.length
        for (let i = 0; i < _r_len; i++) {
            if (allowed.includes(removed[i]))
                allowed.splice(allowed.indexOf(removed[i], 1))
        }

        client.save(guild.id, { to_change: 'plugins.allowed_people', value: allowed })

        if (added.length > 1)
            embed.fields.push({ name: 'Added:', value: await client.utils.makeList(added, message.guild.roles.cache, 0) })

        if (removed.length > 1)
            embed.fields.push({ name: 'Removed:', value: await client.utils.makeList(removed, message.guild.roles.cache, 0) }) 

        embed = client.utils.createDescription(await client.utils.makeList(allowed, message.guild.roles.cache, 0), embed)

        return client.send(message.channel, null, [embed])
	}
}