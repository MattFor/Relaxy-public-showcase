'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import { QueueRepeatMode } from '../../../src/MusicPlayer/internals/QueryTypes.js'


export default {
    name: 'queue',
    aliases: ['showqueue', 'q', 'showq'],
    permissionsBOT: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
    slash: new Discord.SlashCommandBuilder(),
    description_slash: 'Shows and lets you modify the current queue.',
    usage: '=queue',
    description: 'Shows and lets you modify the current song queue\nExplaination of emojis under the message:\n⬅️ - go a page back.\n➡️ - go a page forward.\n⏪ - skips to the last song played.\n⏩ - skips to the next song in queue.\n▶️ - un-pauses the current song if it\'s paused.\n⏸️ - pauses the current song if it\'s playing.\n🔂 - loops the current song.\n🔁 - loops the current queue.\n🔀 - shuffles the song queue.\n:x: - clears the queue, current song won\'t be affected.',
    cooldown: 5,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const queue = client.module.music.getQueue(message.guild.id)

        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (queue ? queue.state === 'recording' : false)
            return new client.class.error('RecordingA', interaction ?? message)

        let page = 1

        let content = queue.tracks.map((track, i) => {
            return `\`${i + 2}.\` - **[${track?.title??'Untitled'}](${track?.url??'Invalid'})** | ${track?.author??'Author not found' === 'Media Attachment' ? `[__${track?.requestedBy??'Unavailable'}__]` : `**${track?.author??'Author not found'}** [__${track?.requestedBy??'Unavailable'}__]`}`
        }).slice(page * 5 - 5, page * 5).join('\n') + `\n\n${queue.tracks.length > 5 ? `\`\`\`fix\nAnd ${queue.tracks.length - page * 5 < 1 ? 1 : queue.tracks.length - page * 5} other songs! (Total: ${client.imports.time(queue.totalTime)})\n\`\`\`` : `\`\`\`fix\nThere are ${queue.tracks.length + queue.current_song ? 1 : 0} songs in the playlist (Total: ${client.imports.time(queue.totalTime)})\n\`\`\``}`

        if (interaction)
            return interaction.reply({ embeds: [{
                color: client.data.embedColor,
                author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
                footer: client.data.footer,
                title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
                url: queue.current.url,
                timestamp: new Date(),
                description: content,
                thumbnail: { url: `attachment://${message.guild.id}.gif` },
            }], files: [{
                attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                name: `${message.guild.id}.gif`
            }]}).then(async m => {
                m = await interaction.fetchReply()
                
                let s = 0
                let emoji_set_interval = setInterval(() => {
                    if (s >= 9) {
                        clearInterval(emoji_set_interval)
                        return emoji_set_interval = null
                    }
                    m.react(client.config.emojiCollections.musicQueue[s])
                    s++
                }, 755)

                const collector = m.createReactionCollector({ filter: (reaction, user) =>
                    (user.id === message.author.id && !user.bot)}
                ).on('collect', async (reaction, user) => {

                    m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                    let q = client.module.music.getQueue(message.guild.id)

                    
                    if (!message.guild.me.voice.channel.members.has(user.id)|| !message.author.id.includes(user.id)) return

                    if (!m || !q) { 
                        client.edit(m, null, [{
                            color: client.data.embedColor,
                            author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nDoesn't exist!` },
                        }])

                        collector.stop()
                        m.reactions.removeAll()
                    }

                    switch(reaction.emoji.name){
                        case '⬅️':
                            if (page !== 1) 
                                page--
                            else 
                                return

                            content = queue.tracks.map((track, i) => {
                                return `\`${i + 2}.\` - **[${track?.title??'Untitled'}](${track?.url??'Invalid'})** | ${track?.author??'Author not found' === 'Media Attachment' ? `[__${track?.requestedBy??'Unavailable'}__]` : `**${track?.author??'Author not found'}** [__${track?.requestedBy??'Unavailable'}__]`}`
                            }).slice(page * 5 - 5, page * 5).join('\n') + `\n\n${queue.tracks.length > 5 ? `\`\`\`fix\nAnd ${queue.tracks.length - page * 5 < 1 ? 1 : queue.tracks.length - page * 5} other songs! (Total: ${client.imports.time(queue.totalTime)})\n\`\`\`` : `\`\`\`fix\nThere are ${queue.tracks.length + queue.current_song ? 1 : 0} songs in the playlist (Total: ${client.imports.time(queue.totalTime)})\n\`\`\``}`

                            return interaction.editReply({ embeds: [{
                                    color: client.data.embedColor,
                                    author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
                                    footer: client.data.footer,
                                    title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
                                    url: queue.current.url,
                                    timestamp: new Date(),
                                    description: content,
                                    thumbnail: { url: `attachment://${message.guild.id}.gif` },
                                }], files: [{
                                    attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                                    name: `${message.guild.id}.gif`
                                }]})
                        case '➡️':
                            if (!((queue.tracks.length - page * 5) < 0)) 
                                page++
                            else 
                                return

                            content = queue.tracks.map((track, i) => {
                                return `\`${i + 2}.\` - **[${track?.title??'Untitled'}](${track?.url??'Invalid'})** | ${track?.author??'Author not found' === 'Media Attachment' ? `[__${track?.requestedBy??'Unavailable'}__]` : `**${track?.author??'Author not found'}** [__${track?.requestedBy??'Unavailable'}__]`}`
                            }).slice(page * 5 - 5, page*  5).join('\n') + `\n\n${queue.tracks.length > 5 ? `\`\`\`fix\nAnd ${queue.tracks.length - page * 5 < 1 ? 1 : queue.tracks.length - page * 5} other songs! (Total: ${client.imports.time(queue.totalTime)})\n\`\`\`` : `\`\`\`fix\nThere are ${queue.tracks.length + queue.current_song ? 1 : 0} songs in the playlist (Total: ${client.imports.time(queue.totalTime)})\n\`\`\``}`

                            return interaction.editReply({ embeds: [{
                                    color: client.data.embedColor,
                                    author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
                                    footer: client.data.footer,
                                    title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
                                    url: queue.current.url,
                                    timestamp: new Date(),
                                    description: content,
                                    thumbnail: { url: `attachment://${message.guild.id}.gif` },
                                }], files: [{
                                    attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                                    name: `${message.guild.id}.gif`
                                }]})
                        case '▶️':
                            return q.setPaused(true)
                        case '⏸️':
                            return q.setPaused(false)
                        case '⏹️':
                            return q.destroy(true)
                        case '🔂':
                            if(q.repeatMode === QueueRepeatMode.TRACK) return queue.setRepeatMode(QueueRepeatMode.TRACK)
                            return queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)
                        case'🔁':
                            if(q.repeatMode === QueueRepeatMode.QUEUE) return queue.setRepeatMode(QueueRepeatMode.QUEUE)
                            return queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)
                        case '🔀':
                            return queue.shuffle()
                        case'⏩':
                            return queue.skip()
                        case '⏪':
                            return queue.back()
                        case'❌':
                            queue.clear()
                        break
                    }
                })

                setTimeout(async () => {
                    let flag = false
                    let thing = await message.channel.messages.fetch(m.id)
                    if (!thing) flag = true
                    if (!flag) m.reactions.removeAll()
                    return collector.stop()
                }, 120 * 1000)
            })

        client.send(message.channel, null, [{
            color: client.data.embedColor,
            author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
            footer: client.data.footer,
            title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
            url: queue.current.url,
            timestamp: new Date(),
            description: content,
            thumbnail: { url: `attachment://${message.guild.id}.gif` },
        }], [{
            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
            name: `${message.guild.id}.gif`
        }]).then(async m => {
            let s = 0

            let emoji_set_interval = setInterval(() => {
                if (s >= 9) {
                    clearInterval(emoji_set_interval)
                    return emoji_set_interval = null
                }
                m.react(client.config.emojiCollections.musicQueue[s])
                s++
            }, 755)

            const collector = m.createReactionCollector({ filter: (reaction, user) =>
                (user.id === message.author.id && !user.bot)}
            ).on('collect', async (reaction, user) => {

                m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                let q = client.module.music.getQueue(message.guild.id)

                
                if (!message.guild.me.voice.channel.members.has(user.id)|| !message.author.id.includes(user.id)) return

                if (!m || !q) { 
                    client.edit(m, null, [{
                    color: client.data.embedColor,
                    author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nDoesn't exist!` },
                }])

                collector.stop()

                m.reactions.removeAll()}
                
                switch(reaction.emoji.name){
                    case '⬅️':
                        if (page !== 1) 
                            page--
                        else 
                            return

                        content = queue.tracks.map((track, i) => {
                            return `\`${i + 2}.\` - **[${track?.title??'Untitled'}](${track?.url??'Invalid'})** | ${track?.author??'Author not found' === 'Media Attachment' ? `[__${track?.requestedBy??'Unavailable'}__]` : `**${track?.author??'Author not found'}** [__${track?.requestedBy??'Unavailable'}__]`}`
                        }).slice(page * 5 - 5, page * 5).join('\n') + `\n\n${queue.tracks.length > 5 ? `\`\`\`fix\nAnd ${queue.tracks.length - page * 5 < 1 ? 1 : queue.tracks.length - page * 5} other songs! (Total: ${client.imports.time(queue.totalTime)})\n\`\`\`` : `\`\`\`fix\nThere are ${queue.tracks.length + queue.current_song ? 1 : 0} songs in the playlist (Total: ${client.imports.time(queue.totalTime)})\n\`\`\``}`

                        return client.edit(m, null, [{
                                color: client.data.embedColor,
                                author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
                                footer: client.data.footer,
                                title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
                                url: queue.current.url,
                                timestamp: new Date(),
                                description: content,
                                thumbnail: { url: `attachment://${message.guild.id}.gif` },
                            }], [{
                                attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                                name: `${message.guild.id}.gif`
                            }])
                    case '➡️':
                        if (!((queue.tracks.length - page * 5) < 0)) 
                            page++
                        else 
                            return

                        content = queue.tracks.map((track, i) => {
                            return `\`${i + 2}.\` - **[${track?.title??'Untitled'}](${track?.url??'Invalid'})** | ${track?.author??'Author not found' === 'Media Attachment' ? `[__${track?.requestedBy??'Unavailable'}__]` : `**${track?.author??'Author not found'}** [__${track?.requestedBy??'Unavailable'}__]`}`
                        }).slice(page * 5 - 5, page*  5).join('\n') + `\n\n${queue.tracks.length > 5 ? `\`\`\`fix\nAnd ${queue.tracks.length - page * 5 < 1 ? 1 : queue.tracks.length - page * 5} other songs! (Total: ${client.imports.time(queue.totalTime)})\n\`\`\`` : `\`\`\`fix\nThere are ${queue.tracks.length} songs in the playlist (Total: ${client.imports.time(queue.totalTime)})\n\`\`\``}`

                        return client.edit(m, null, [{
                                color: client.data.embedColor,
                                author: { name: `Queue for: ${message.guild.name} - ${message.guild.me.voice.channel.name}\nLoop: ${queue.loopMode ? 'ON' : 'OFF'} | Repeater: ${queue.repeatMode ? 'ON' : 'OFF'} | Page: ${page}`, icon_url: client.config.text.links.musicImage },
                                footer: client.data.footer,
                                title: `**Current song:**\n${client.utils.firstLetterUp(queue.current.title)} | ${queue.current.author}`,
                                url: queue.current.url,
                                timestamp: new Date(),
                                description: content,
                                thumbnail: { url: `attachment://${message.guild.id}.gif` },
                            }], [{
                                attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                                name: `${message.guild.id}.gif`
                            }])
                    case '▶️':
                        return q.setPaused(true)
                    case '⏸️':
                        return q.setPaused(false)
                    case '⏹️':
                        return q.destroy(true)
                    case '🔂':
                        if(q.repeatMode === QueueRepeatMode.TRACK) return queue.setRepeatMode(QueueRepeatMode.TRACK)
                        return queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)
                    case'🔁':
                        if(q.repeatMode === QueueRepeatMode.QUEUE) return queue.setRepeatMode(QueueRepeatMode.QUEUE)
                        return queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)
                    case '🔀':
                        return queue.shuffle()
                    case'⏩':
                        return queue.skip()
                    case '⏪':
                        return queue.back()
                    case'❌':
                        queue.clear()
                    break
                }
            })

            setTimeout(async () => {
                if (!m) 
                    return

                let flag = false
                let thing = await message.channel.messages.fetch(m.id)

                if (!thing) 
                    flag = true

                if (!flag) 
                    m.reactions.removeAll()

                return collector.stop()
            }, 120 * 1000)
        })
    }
}