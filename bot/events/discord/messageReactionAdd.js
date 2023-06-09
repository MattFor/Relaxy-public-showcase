'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle adding a reaction
     * @param {Relaxy} client 
     * @param {Discord.MessageReaction} reaction 
     * @param {Discord.User} user 
     */
    async run(client, reaction, user) {
        try {
            reaction.message = await client.channels.cache.get(reaction.channelId).messages.fetch(reaction.id).catch(() => {})
        } catch {}

        if (!reaction.message.guild || (!reaction.message.channel.id === '1034514608091828284' && (reaction.message.channel.type === client.imports.discord.ChannelType.DM || reaction.message.channel.type === client.imports.discord.ChannelType.GroupDM))) 
            return

        if (user.id === client.config.keys.owner && reaction.message.channel.id === '1034514608091828284') {
            reaction.message = await client.guilds.cache.get('1034514185922564106').channels.cache.get('1034514608091828284').messages.fetch(reaction.message.id)
            
            if (new Date(reaction.message.embeds[0].data.timestamp).getTime() > client.data.startTime) 
                return

            let footer_text = reaction.message.embeds[0].data.footer.text.split('-')

            let guild_name = footer_text[1].slice(1, footer_text[1].length)

            let member = reaction.message.embeds[0].data.author.name.split('|')[0] 

            member = member.slice(0, -1)

            let shard_id = Number(client.utils.nums(footer_text[0]))

            let user_info = await client.cluster.broadcastEval(async (c, a) => {
                if (c.data.id == a.s_id) {
                    let user = await c.users.fetch(a.u_id)
                    return [user, await c.getMember(c.guilds.cache.find(g => g.name.includes(a.g_name)), user.id)]
                }
            }, { context: { s_id: shard_id, u_id: reaction.message.embeds[0].data.thumbnail.url.split('=')[1], g_name: guild_name } })

            user_info = user_info.filter(i => i !== null)

            if (!user_info)
                return reaction.message.delete()

            member = user_info[0][1]
            let user = user_info[0][0]

            const request = {
                time: reaction.message.createdAt.getMilliseconds(),
                number: Number(reaction.message.embeds[0].data.author.name.split('|')[1].split('#')[1]),
                shard_id: shard_id,
                attachment: reaction.message.embeds[0].data.image ? reaction.message.embeds[0].data.image ? reaction.message.embeds[0].data.image : 
                    reaction.message.attachments.size > 0 ? reaction.message.attachments.first() : null : null,
                content: reaction.message.embeds[0].data.description,
                author: user,
                member: member,
                guild: guild_name,
                valid: true
            }

            let flag = false

            reaction.message.reactions.removeAll()

            switch (reaction.emoji.name) {
                case '❌': {
                    let channel = await (await client.getUser(client.config.keys.owner)).createDM()
                    return channel.send('Reason for denial?').then(async m => {
                        return m.channel.awaitMessages({ filter: m => !m.author.bot, max: 1, time: 300000 }).then(c => {
                            flag = true

                            client.edit(reaction.message, '```diff\n- DENIED\n```', [reaction.message.embeds[0].data])

                            const message_cought = c.first()

                            return client.cluster.send({
                                type: 'NOTIF_relaxyRequestComplete',
                                accepted: false,
                                authorID: request.author.id,
                                shardID: request.shard_id,
                                reason: message_cought.content,
                                attachment: message_cought.attachments.size > 0 ? message_cought.attachments.first() : null,
                                number: request.number
                            })
                        }).catch(() => {
                            if (flag) return

                            client.edit(reaction.message, '```diff\n- DENIED\n```', [reaction.message.embeds[0].data])

                            return client.cluster.send({
                                type: 'NOTIF_relaxyRequestComplete',
                                accepted: false,
                                authorID: request.author.id,
                                shardID: request.shard_id,
                                reason: 'Your request has been denied, MattFor#9884 hasn\'t provided any response, this is an automated message.',
                                number: request.number
                            })
                        })
                    })
                }

                case '✅': {
                    let channel = await (await client.getUser(client.config.keys.owner)).createDM()
                    return channel.send('Reason for accepting?').then(async(m) => {
                        return  m.channel.awaitMessages({ filter: m => !m.author.bot, max: 1, time: 300000 }).then(c => {
                            flag = true

                            client.edit(reaction.message, '```fix\nACCEPTED!\n```', [reaction.message.embeds[0].data])

                            const message_cought = c.first()

                            return client.cluster.send({
                                type: 'NOTIF_relaxyRequestComplete',
                                accepted: true,
                                authorID: request.author.id,
                                shardID: request.shard_id,
                                reason: message_cought.content,
                                attachment: message_cought.attachments.size > 0 ? message_cought.attachments.first() : null,
                                number: request.number
                            })
                        }).catch(() => {
                            if (flag) return

                            client.edit(reaction.message, '```fix\nACCEPTED!\n```', [reaction.message.embeds[0].data])

                            return client.cluster.send({
                                type: 'NOTIF_relaxyRequestComplete',
                                accepted: true,
                                authorID: request.author.id,
                                shardID: request.shard_id,
                                reason: 'Your request has been accepted! MattFor#9884 hasn\'t provided any response, this is an automated message.',
                                number: request.number
                            })
                        })
                    })
                }
                default:
            }
        }

        const guild = await client.module.database.Guild(reaction.message.guild.id)

        if (guild.forum.enabled && reaction.message.channel.parent && guild.forum.channels.includes(reaction.message.channel.parent.id)) {
            return client.core.ForumPost(reaction, user).catch(() => {})
        }

        client.core.ReactionAdd(reaction, user, guild, reaction.message.id === guild.plugins.welcome_message.wmessage_id ? 2 : 1)

        return client.core.HeartBoard(reaction, user, 'messageReactionAdd', guild)
    }
}