'use strict'

import Discord from 'discord.js'
import Relaxy from '../../Relaxy.js'
import Request from '../../Blueprints/DataTypes/Request.js'


export default class RequestManager {

    /**
     * Instance of a Relaxy client.
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client
        this.channel = null
        this.RequestList = []

        setInterval(() => {
            return this.Process(this.RequestList.shift())
        }, 10 * 1000)
    }

    /**
     * Process a Relaxy request.
     * @param {Request} request 
     */
    Process(request) {

        if (!request)
            return

        if (!this.channel)
            this.channel = this.client.channels.cache.get('1034514608091828284')

        let RequestEmbed = new Discord.EmbedBuilder().setColor(this.client.data.embedColor).setThumbnail(`https://www.youtube.com/results?search_query=${request.author.id}`).setAuthor({ name: `${request.author.tag} | Request #${request.number}`, iconURL: request.author.displayAvatarURL }).setTimestamp(request.time).setFooter({ text: `Shard #${request.shard_id} - ${request.guild}` })

        let description = ''

        if (request.attachment !== '0')
            RequestEmbed.setImage(request.attachment.url)

        if (request.content.length > 0)
            description += `\n${request.content}`

        RequestEmbed.setDescription(description)

        this.client.send(this.channel, null, [RequestEmbed])
            .then(m => {
                m.react('✅')

                setTimeout(() => { m.react('❌') }, 755)

                return m.createReactionCollector({ filter: (reaction, user) =>
                    (user.id === this.client.config.keys.owner && (reaction.emoji.name === '✅' || reaction.emoji.name === '❌'))
                }).on('collect', async(reaction) => {

                    let flag = false

                    reaction.message.reactions.removeAll()

                    switch (reaction.emoji.name) {
                        case '❌': {
                            return this.client.users.cache.get(this.client.config.keys.owner).send('Reason for denial?').then(async m => {
                                return m.channel.awaitMessages({ filter: m => !m.author.bot, max: 1, time: 300000 }).then(c => {
                                    flag = true

                                    reaction.message.edit('```diff\n- DENIED\n```')

                                    return this.client.cluster.send({
                                        type: 'NOTIF_relaxyRequestComplete',
                                        accepted: false,
                                        authorID: request.author.id,
                                        shardID: request.shard_id,
                                        reason: c.first().content,
                                        attachment: c.first().attachments.first() ? c.first().attachments.first() : null,
                                        number: request.number
                                    })
                                }).catch(() => {
                                    if (flag) return

                                    reaction.message.edit('```diff\n- DENIED\n```')

                                    return this.client.cluster.send({
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
                            return this.client.users.cache.get(this.client.config.keys.owner).send('Reason for accepting?').then(async(m) => {
                                return m.channel.awaitMessages({ filter: m => !m.author.bot, max: 1, time: 300000 }).then(c => {
                                    flag = true

                                    reaction.message.edit('```fix\nACCEPTED!\n```')

                                    return this.client.cluster.send({
                                        type: 'NOTIF_relaxyRequestComplete',
                                        accepted: true,
                                        authorID: request.author.id,
                                        shardID: request.shard_id,
                                        reason: c.first().content,
                                        attachment: c.first().attachments.first() ? c.first().attachments.first() : null,
                                        number: request.number
                                    })
                                }).catch(() => {
                                    if (flag) return

                                    reaction.message.edit('```fix\nACCEPTED!\n```')

                                    return this.client.cluster.send({
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
                    }
                })
            })
    }

    /**
     * Reveive a Relaxy request and push it to the handling queue.
     * @param {Request} request 
     * @returns {Function}
     */
    Receive(request) {
        return this.RequestList.push(request)
    }
}