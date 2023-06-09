'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'censor',
    cooldown: 10,
    permissions: ['MANAGE_GUILD'],
    permissionsBOT: ['MANAGE_MESSAGES'],
    usage: '=censor words',
    description: 'Censor every message that includes any of the words mentioned, unlocks =autoname and =autoban.\nType first argument as \'clear\' to remove all censored words, \'off\' to turn censoring off and type nothing to show the words.\nP.S typing \'default\' after already having it on without the default pool will add it.\nIf you add \'links\' then ALL links will be censored.\nIf you add \'invites\' all discord invites will be censored.\n\nIf an argument is in italics (starts and ends with a \*) then all `-` (dashes) will be checked as if they were spaces.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let censored = guild.plugins.censoring.censorPool

        let added = []
        let removed = []

        let embed = {
            color: client.data.embedColor,
            title: 'Censored words:',
            fields: []
        }

        if (guild.plugins.censoring.enabled) {
            if (args[0]) {
                switch(args[0].toLowerCase()) {
                    case 'clear':
                    {
                        client.save(guild.id, { to_change: 'plugins.censoring.censorPool', value: [] })

                        if (censored.length > 0)
                            embed.fields.push({ name: 'Removed:', value: `${censored.map(r => { return r }).join(', ')}.`.slice(0, 1024) })

                        embed.description = 'None.'

                        return client.send(message.channel, null, [embed])
                    }
                    case 'default':
                    {
                        new client.class.error('Adding default censoring pool.', message)

                        censored = censored.concat(client.config.defaultCensoringList)
                        censored = [...new Set(censored)]

                        embed.fields = null
                        embed.description = `${censored.map(item => { return item }).join(', ') || 'None'}.`.slice(0, 2048)

                        client.save(guild.id, { to_change: 'plugins.censoring.censorPool', value: censored })
                        return client.send(message.channel, null, [embed])
                    }
                    case 'off': 
                    {
                        client.save(guild.id, { to_change: 'plugins.censoring.enabled', value: false })
                        return new client.class.error('Censoring has been turned off.', message)
                    }
                }
            }

            let arg_len = args.length
            for (let i = 0; i < arg_len; i++) {
                if (args.includes('censor'))
                    continue

                if (censored.includes(args[i])) {
                    censored.splice(censored.indexOf(args[i]), 1)
                    removed.push(args[i])
                    continue
                }

                censored.push(args[i])
                added.push(args[i])
            }

            client.save(guild.id, { to_change: 'plugins.censoring.censorPool', value: censored })

            if (added.length > 1) 
                embed.fields.push({ name: 'Added:', value: `${added.map(a => { return a }).join(', ')}.`.slice(0, 1024) })

            if (removed.length > 1) 
                embed.fields.push({ name: 'Removed:', value: `${removed.map(r => { return r }).join(', ')}.`.slice(0, 1024) })

            embed.description = `${censored.map(item => { 
                return ['invites', 'links'].includes(item) ? `**${item}**` : item 
            }).join(', ') || 'None'}.`.slice(0, 2048)

            return client.send(message.channel, null, [embed])
        }

        if (!args[0] && censored.length > 0) {
            new client.class.error('Censoring re-enabled, using old censor pool.', message)
            return client.save(guild.id, { to_change: 'plugins.censoring.enabled', value: true })
        }

        if (!args[0]) {
            new client.class.error('No words to censor specified, using default pool!', message)
            return client.save(guild.id, { to_change: 'plugins.censoring.censorPool', value: client.config.defaultCensoringList }, { to_change: 'plugins.censoring.enabled', value: true })
        }

        new client.class.error(`Added censoring to ${message.guild.name}!`, message)
        client.save(guild.id, { to_change: 'plugins.censoring.censorPool', value: args }, { to_change: 'plugins.censoring.enabled', value: true })
    }
}