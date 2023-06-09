'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'welcomemessagereactionroles',
    aliases: ['wmr', 'wmreact'],
    permissions: ['MANAGE_CHANNELS', 'MANAGE_GUILD', 'EMBED_LINKS'],
    permissionsBOT: ['ADD_REACTIONS'],
    usage: '=welcomemessagereactionroles roles',
    description: 'Roles are f.e @mod @admin\nAfter inserting those roles respond with emojis.\nRelaxy is going to assign those to the welcome message shortly after finishing the command.',
    cooldown: 240,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (!guild.plugins.welcome_message.enabled)
            return new client.class.error('Server has no welcome message!', interaction ?? message)

        if (!client.channels.cache.get(guild.plugins.welcome_message.wmessage_channel))
            return new client.class.error('Welcome message channel doesn\'t exist!', interaction ?? message)

        if (!guild.plugins.welcome_message.roles && !args[0])
            return new client.class.error('No roles provided!', interaction ?? message)

        if (guild.plugins.welcome_message.roles && !args[0]) {

            client.save(guild.id, { to_change: 'plugins.welcome_message.roles', value: false }, { to_change: 'plugins.welcome_message.role_roles', value: [] }, { to_change: 'plugins.welcome_message.role_emojis', value: [] })

            await client.channels.cache.get(guild.plugins.welcome_message.wmessage_channel).messages.fetch(guild.plugins.welcome_message.wmessage_id)
                .then(async message => {
                    return message.reactions.removeAll().catch(() => {
                        return new client.class.error('Relaxy cannot remove reactions on the welcome message!', interaction ?? message)
                    })
                })
            return new client.class.error('Reaction roles removed!', interaction ?? message)
        }

        for (const item of args) {
            let i = message.guild.roles.cache.find(role => role.id === client.utils.nums(item))

            if (!i)
                return new client.class.error(`Role: [${item}] is invalid!`, message)
            if (i.managed)
                return new client.class.error(`Role: [${item}] cannot be added as it's managed another service!`, message)
            if (i.position > message.guild.me.roles.highest.position)
                return new client.class.error(`Role: [${item}] is above Relaxy's highest role!`, message)
        }

        new client.class.error('Respond with emojis that correspond to the places or roles.', interaction ?? message)

        message.channel.awaitMessages({ filter: async msg => msg.author.id === message.author.id, max: 1, time: 3000000, errors: ['time'] })
            .then(async collected => {

                const content = collected.first().content

                if (args.length !== client.utils.cleanup(content.split(' ')).length)
                    return new client.class.error('Number of emojis doesn\'t match number of roles!', interaction ?? message)

                const match = client.utils.isValidEmoji(content, message)

                if (match.length !== args.length)
                    return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)

                client.save(guild.id, { to_change: 'plugins.welcome_message.role_emojis', value: match })

                let args_length = args.length

                for (let i = 0; i < args_length; i++)
                    args[i] = client.utils.nums(args[i])

                let text = `Reaction roles ${guild.plugins.welcome_message.roles ? 'updated' : 'activated'}, they should ${guild.plugins.welcome_message.roles ? 'change': 'appear'} shortly!`

                client.save(guild.id, { to_change: 'plugins.welcome_message.roles', value: true }, { to_change: 'plugins.welcome_message.role_roles', value: args })

                return new client.class.error(text, interaction ?? message)
            })
    }
}