'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'warnings',
    aliases: ['warns'],
    cooldown: 5,
    usage: '=warnings user',
    permissions: ['MANAGE_MESSAGES'],
    permissionsBOT: ['EMBED_LINKS'],
    description: 'Show a list of users with warnings.\nMention a user to show their warnings in particular.\nIn order, the numbers mean: warning count, critical warning count (contributes to autobanning), threat level',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.warnings.size === 0)
            return new client.class.error(`There's no warnings in ${message.guild.name}!`, message)

        let member = await client.utils.member(message, args, 0)??null
        member = member?.size === 0 ? null : member

        let maxThreat = Math.max(
            ...Object.values(guild.warnings)
            .flat()
            .filter(warn => typeof warn === 'object' && warn.author === client.user.id)
            .map(warn => warn.tier)
        )

        if (maxThreat < 3)
            maxThreat = 3

        let missingTag = 'Unavailable'
        const userId = args.join(' ').match(/[0-9]+/g)?.[0]??null
        if (member || userId) {
            let description = ''
    
            let toRemove = userId ? 1 : member.user.username.split(' ').length
            for (let i = 0; i < toRemove; i++)
                args.shift()

            const key = userId??member.user.id

            // Quicksearch for missing words
            let _f = !args.length === 0
            if (args.length > 0) {
                let combined_warns = guild.warnings[key].filter(w => typeof w !== 'string').map(w => { return w.reason }).join(' ')
                for (const arg of args)
                    if (combined_warns.includes(arg))
                        _f = false
            }

            if (!_f) {
                let threat = 0
                for (const warn of guild.warnings[key])
                    if (typeof warn === 'string' || typeof warn === 'object' && warn.tier >= Math.ceil(maxThreat / 2) || typeof warn === 'object' && warn.author === client.user.id && warn.tier !== -1)
                        threat++

                let max_threat_local = 0
                for (const warn of guild.warnings[key]) {
                    if (typeof warn === 'object' && warn.tier > max_threat_local)
                        max_threat_local = warn.tier
                    if (typeof warn === 'string')
                        max_threat_local = 3
                }

                // Cycle through warnings to check for a valid author tag
                if (!member)
                    for (let i = 0; i < guild.warnings[key].length; i++)
                        if (typeof guild.warnings[key][i] === 'object' && !!guild.warnings[key][i].tag && guild.warnings[key][i]?.tag !== 'Unavailable') {
                            missingTag = guild.warnings[key][i].tag
                            break
                        }

                description += `1. ${member??missingTag} ${member?.tag??''} \`(${guild.warnings[key].length})\`  \`[${threat}/${guild.plugins.censoring.autobanning}]\` \`{${max_threat_local}/${maxThreat}}\`\n`
                                
                for (let i = 0; i < guild.warnings[key].length; i++) {
                    if (args.length > 0 && typeof guild.warnings[key][i] !== 'string') {
                        let flag = true
                        for (const arg of args)
                            if (guild.warnings[key][i].reason.includes(arg))
                                flag = false
                        if (flag)
                            continue
                    }

                    description += ` - ${typeof guild.warnings[key][i] === 'string' ? guild.warnings[key][i] : guild.warnings[key][i].reason} \`[${typeof guild.warnings[key][i] === 'string' ? 3 : guild.warnings[key][i].tier}/${maxThreat}]\` ${typeof guild.warnings[key][i] === 'string' || !guild.warnings[key][i].author === !guild.warnings[key][i].tag && !!guild.warnings[key][i].tag === false || guild.warnings[key][i].author === 'Unavailable' ? 'Legacy warning [No author]' : `<@!${guild.warnings[key][i].author}>`}\n`
                }
            }

            let fields = []
            let desc_copy = description.slice(0, 2048)

            if (description.length > 2048) {
                description = description.slice(2048, description.length - 1)
                let i = 0
                while (true) {
                    if (i * 1024 > description.length || fields.length > 20)
                        break

                    fields.push({ name: 'Continuation:', value: description.slice(i * 1024, (i + 1) * 1024) })
                    i++
                }
            }

            return client.send(message.channel, null, [{ 
                color: client.data.embedColor,
                title: `Warnings for ${member?.user?.username??missingTag}`,
                description: desc_copy.length < 2 ? `There are no warnings for ${member.user.username}!` : desc_copy,
                thumbnail: member ? { url: member.user.displayAvatarURL({ extension: 'png', size: 4096 }) } : null,
                footer: client.data.footer,
                fields: fields.length !== 0 ? fields : null
            }])
        }

        let description = ''
        let users = Object.keys(guild.warnings)
        const userList = await message.guild.members.fetch({ user: users })

        let j = 0
        for (const key of users) {
            let user = userList.get(key)

            if (!user)
                continue

            let _f = true
            if (args.length > 0) {
                let combined_warns = guild.warnings[key].filter(w => typeof w !== 'string').map(w => { return w.reason }).join(' ')
                for (const arg of args)
                    if (combined_warns.includes(arg))
                        _f = false
            } else
                _f = false

            if (_f)
                continue

            let threat = 0
            for (const warn of guild.warnings[key])
                if (typeof warn === 'string' || typeof warn === 'object' && warn.tier >= Math.ceil(maxThreat / 2) || typeof warn === 'object' && warn.author === client.user.id && warn.tier !== -1)
                    threat++
   
            let max_threat_local = 0
            for (const warn of guild.warnings[key]) {
                if (typeof warn === 'object' && warn.tier > max_threat_local)
                    max_threat_local = warn.tier
                if (typeof warn === 'string')
                    max_threat_local = 3
            }

            description += `${++j}. ${user??guild.warnings[key][0].tag??''} ${user?.tag??guild.warnings[key][0].tag??''}  \`(${guild.warnings[key].length})\`  \`[${threat}/${guild.plugins.censoring.autobanning}]\` \`{${max_threat_local}/${maxThreat}}\`\n`
            for (let i = 0; i < guild.warnings[key].length; i++) {
                // if (args.length > 0 && typeof guild.warnings[key][i] !== 'string') {
                //     let flag = true
                //     for (const arg of args)
                //         if (guild.warnings[key][i].reason.includes(arg))
                //             flag = false
                //     if (flag)
                //         continue
                // }

                description += ` - ${typeof guild.warnings[key][i] === 'string' ? guild.warnings[key][i] : guild.warnings[key][i].reason} \`[${typeof guild.warnings[key][i] === 'string' ? 3 : guild.warnings[key][i].tier}/${maxThreat}]\` ${typeof guild.warnings[key][i] === 'string' || !guild.warnings[key][i].author === !guild.warnings[key][i].tag && !!guild.warnings[key][i].tag === false || guild.warnings[key][i].author === 'Unavailable' ? 'Legacy warning [No author]' : `<@!${guild.warnings[key][i].author}>`}\n`
            }
        }

        if (description.length <= 5800) {
            let fields = []
            let desc_copy = description.slice(0, 2048)

            if (description.length > 2048) {
                description = description.slice(2048, description.length - 1)
                let i = 0
                while (true) {
                    if (i * 1024 > description.length || fields.length > 4)
                        break

                    fields.push({ name: 'Continuation:', value: description.slice(i * 1024, (i + 1) * 1024) })
                    i++
                }
            }

            return client.send(message.channel, null, [{ 
                color: client.data.embedColor,
                title: `Warnings for ${message.guild.name}`,
                description: desc_copy.length < 2 ? `There are no warnings ${args.length !== 0 ? 'containing the specified words!' : 'on this server!'}` : desc_copy,
                footer: client.data.footer,
                fields: fields.length !== 0 ? fields : null
            }])
        }

        let fields = []
        let full_description = description
        let desc_copy = description.slice(0, 2048)

        if (description.length > 2048) {
            description = description.slice(2048, 5800)
            let i = 1
            while (true) {
                let overcut = i * 1024 > 5800 ? 5800 - (i - 1) * 1024 < 1024 && 5800 - (i - 1) * 1024 > 0 ? 5800 - (i - 1) * 1024 : null : null
                if ((i + 1) * 1024 > 5800)
                    break

                fields.push({ name: 'Continuation:', value: description.slice((i - 1) * (overcut !== null ? overcut : 1024), i * (overcut !== null ? overcut : 1024)) })
                i++
            }
        }

        let page = 1
        let max_pages = Math.ceil(full_description.length / 5800)

        return client.send(message.channel, null, [{ 
            color: client.data.embedColor,
            title: `Warnings for ${message.guild.name}`,
            description: desc_copy.length < 2 ? 'There are no warnings on this server!' : desc_copy,
            footer: client.data.footer,
            fields: fields.length !== 0 ? fields.filter(f => f.value !== '') : null
        }]).then(async m => {
            await m.react('◀️')
            await m.react('▶️')

            const collector = m.createReactionCollector({ filter: (reaction, user) =>
                user.id === message.author.id && !user.bot && ['◀️', '▶️'].includes(reaction.emoji.name)
            }).on('collect', async (reaction, user) => {
                m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                fields = []

                switch(reaction.emoji.name) {
                    case '◀️':
                        if (page === 1)
                            return

                        page--
                        break
                    case '▶️':
                        if (page === max_pages)
                            return

                        page++
                        break
                }

                let temp_description = full_description.slice((page - 1) * 5800, page * 5800)
                let temp_desc_cut = temp_description.slice(0, 2048)

                let i = 1
                while (true) {
                    temp_description = temp_description.slice(2048, 5800)
                    let overcut = i * 1024 > 5800 ? 5800 - (i - 1) * 1024 < 1024 && 5800 - (i - 1) * 1024 > 0 ? 5800 - (i - 1) * 1024 : null : null

                    if ((i + 1) * 1024 + 2048 > 5800)
                        break
    
                    fields.push({ name: 'Continuation:', value: temp_description.slice((i - 1) * (overcut !== null ? overcut : 1024), i * (overcut !== null ? overcut : 1024)) })
                    i++
                }
                
                return client.edit(m, null, [{ 
                    color: client.data.embedColor,
                    title: `Warnings for ${message.guild.name}`,
                    description: temp_desc_cut,
                    footer: client.data.footer,
                    fields: fields.length !== 0 ? fields.filter(f => f.value !== '') : null
                }])
            })

            setTimeout(async () => {
                m.reactions.removeAll()
                return collector.stop()
            }, 120 * 1000)
        })
    }
}