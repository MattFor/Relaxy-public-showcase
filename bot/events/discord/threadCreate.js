'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.ThreadChannel} thread 
     * @param {Boolean} newlyCreated 
     */
    async run(client, thread, newlyCreated) {  
        if (!newlyCreated) 
            return

        const guild = await client.module.database.Guild(thread.guild.id)

        let message = await thread.fetchStarterMessage().catch(() => {})

        if (!message)
            message = thread.messages.channel.lastMessage

        if (guild.plugins.modlog.events.threadCreate.enabled) 
            if (await client.channels.fetch(guild.plugins.modlog.events.threadCreate.channel).catch(() => {}))
                try {
                    client.data.modlog_posts[thread.guild.id].push(['threadCreate', new client.class.modlog({
                        color: 'good',
                        event: 'Thread created',
                        thumbnail: message.member.displayAvatarURL({ dynamic: true, size: 4096 })??thread.guild.iconURL({ dynamic: true, size: 4096 }),
                        description: `Channel: **${thread} - ${thread.name} - \`${thread.id}\`**\nCreated by: ${message.member??'None.'} ${message?.member?.user.tag??''}`
                    })])
                } catch {}

        if (thread.parent.type !== client.imports.discord.ChannelType.GuildForum)
            return

        await client.utils.sleep(2000)

        Promise.all([
            client.module.database.findForumChannel(thread.parent.id, thread.guild.id),
            thread.fetchStarterMessage()
        ]).then(async ([
            forum, message
        ]) => {
            if (!guild.forum.enabled || !forum || forum.length === 0)
                return

            if (forum.checks.censorPoolCheck && guild.plugins.censoring.enabled) {
                let censor_length = guild.plugins.censoring.censorPool.length
                for (let i = 0; i < censor_length; i++)
                    if (message.content.toLowerCase().includes(guild.plugins.censoring.censorPool[i]) || 
                        message.channel.name.toLowerCase().includes(guild.plugins.censoring.censorPool[i])) {
                            if (forum.responses.censorPoolCheck.length > 0)
                                client.send(message.author, forum.responses['censorPoolCheck'])
                                    .replaceAll('|U|', message.author)
                                    .replaceAll('|G|', message.guild.name)
                                    .replaceAll('|T|', thread.name)
                            return await thread.delete().catch((e) => {console.log(e)})
                        }
            }

            if (forum.checks.attachmentCount > 0 ? 
                message.attachments.size > forum.checks.attachmentCount : 
                message.attachments.size < -forum.checks.attachmentCount) {

                await forum.responses['attachmentCount'].length > 0 ? 
                    client.send(message.author, 
                        forum.responses['attachmentCount']
                            .replaceAll('|U|', message.author)
                            .replaceAll('|G|', message.guild.name)
                            .replaceAll('|T|', thread.name)
                            .replaceAll('{overCase/underCase}',
                                forum.checks.attachmentCount > 0 ? 'many' : 'little' )) :
                    null

                return await thread.delete().catch((e) => {console.log(e)})
            }

            if ((forum.checks.titleLength > 0 ? 
                message.channel.name.length > forum.checks.titleLength : 
                message.channel.name.length < -forum.checks.titleLength) && !(forum.checks.invalidateLengthCheckWhenAttachmentPresent && message.attachments.size !== 0)) {

                await forum.responses['titleLength'].length > 0 ? 
                    client.send(message.author, 
                        forum.responses['titleLength']
                            .replaceAll('|U|', message.author)
                            .replaceAll('|G|', message.guild.name)
                            .replaceAll('|T|', thread.name)
                            .replaceAll('{overCase/underCase}',
                                forum.checks.titleLength > 0 ? 'over' : 'under' )) :
                    null
                    
                return await thread.delete().catch((e) => {console.log(e)})
            }

            if ((forum.checks.bodyLength > 0 ? 
                message.content.length > forum.checks.bodyLength : 
                message.content.length < -forum.checks.bodyLength) && !(forum.checks.invalidateLengthCheckWhenAttachmentPresent && message.attachments.size !== 0)) {

                await forum.responses['bodyLength'].length > 0 ? 
                    client.send(message.author, 
                        forum.responses['bodyLength']
                            .replaceAll('|U|', message.author)
                            .replaceAll('|G|', message.guild.name)
                            .replaceAll('|T|', thread.name)
                            .replaceAll('{overCase/underCase}',
                                forum.checks.bodyLength > 0 ? 'over' : 'under' )) :
                    null

                return await thread.delete().catch((e) => {console.log(e)})
            }

            let _a = forum.checks.matches.length
            let body = forum.checks.variable_case ? message.content.toLowerCase() : message.content
            let title = forum.checks.variable_case ? message.channel.name.toLowerCase() : message.channel.name
            for (let i = 0; i < _a; i++) {
                let check = forum.checks.matches[i].replaceAll('-', ' ')

                if (forum.checks.variable_case)
                    check = check.toLowerCase()

                if (forum.checks.rawMatch && (body.includes(check) || title.includes(check))) {
                    client.send(message.author, forum.responses[forum.checks.matches[i]] ? forum.responses[forum.checks.matches[i]].replaceAll('|U|', message.author).replaceAll('|G|', message.guild.name).replaceAll('|T|', thread.name) : `${message.channel.name} has been automatically rejected for containing invalid phrase: ${forum.checks.matches[i]}`)
                    return message.channel.delete()
                } else {
                    let args = body.split(' ')
                    let args2 = title.split(' ')

                    let fastcheck = []
                    for (let i = 0; i < check.split(' ').length; i++) 
                        fastcheck.push(args[args.length - 1 - i])

                    fastcheck = fastcheck.reverse().join(' ')

                    let fastcheck2 = []
                    for (let i = 0; i < check.split(' ').length; i++) 
                        fastcheck2.push(args2[args2.length - 1 - i])

                    fastcheck2 = fastcheck2.reverse().join(' ')

                    if (fastcheck === check || fastcheck2 === check) {
                        if (forum.responses[forum.checks.matches[i]].length > 0)
                            client.send(message.author, forum.responses[forum.checks.matches[i]]
                                .replaceAll('|U|', message.author)
                                .replaceAll('|G|', message.guild.name)
                                .replaceAll('|T|', thread.name))

                        return await thread.delete().catch((e) => {console.log(e)})
                    }

                    let arg_len = args.length
                    for (let i = 0; i < arg_len; i++) {
                        if (args[i + 1] && `${args[i]} ${args[i + 1]}` === check) {
                            if (forum.checks.cutOff && args[i + 2])
                                continue

                            if (forum.responses[forum.checks.matches[i]].length > 0)
                                client.send(message.author, forum.responses[forum.checks.matches[i]]
                                    .replaceAll('|U|', message.author)
                                    .replaceAll('|G|', message.guild.name)
                                    .replaceAll('|T|', thread.name))

                            return await thread.delete().catch((e) => {console.log(e)})
                        }

                        if (body.includes(check)) {
                            let content = body

                            if (forum.checks.variable_case)
                                content = content.toLowerCase()

                            while(true) {
                                if (!content.includes(check))
                                    break

                                let index = content.indexOf(check)
                                if (index + 1 > content.length)
                                    break

                                if (!content[index + check.length] === ' ') {
                                    if (forum.responses[forum.checks.matches[i]].length > 0)
                                        client.send(message.author, forum.responses[forum.checks.matches[i]]
                                            .replaceAll('|U|', message.author)
                                            .replaceAll('|G|', message.guild.name)
                                            .replaceAll('|T|', thread.name))

                                    return await thread.delete().catch((e) => {console.log(e)})
                                }

                                content = content.slice(0, index)
                            }
                        }
                    }

                    let arg_len2 = args2.length
                    for (let i = 0; i < arg_len2; i++) {
                        if (args2[i + 1] && `${args2[i]} ${args2[i + 1]}` === check) {
                            if (forum.checks.cutOff && args2[i + 2])
                                continue

                            if (forum.responses[forum.checks.matches[i]].length > 0)
                                client.send(message.author, forum.responses[forum.checks.matches[i]]
                                    .replaceAll('|U|', message.author)
                                    .replaceAll('|G|', message.guild.name)
                                    .replaceAll('|T|', thread.name))

                            return await thread.delete().catch((e) => {console.log(e)})
                        }

                        if (title.includes(check)) {
                            let content = title

                            if (forum.checks.variable_case)
                                content = content.toLowerCase()

                            while(true) {
                                if (!content.includes(check))
                                    break

                                let index = content.indexOf(check)
                                if (index + 1 > content.length)
                                    break

                                if (!content[index + check.length] === ' ') {
                                    if (forum.responses[forum.checks.matches[i]].length > 0)
                                        client.send(message.author, forum.responses[forum.checks.matches[i]]
                                            .replaceAll('|U|', message.author)
                                            .replaceAll('|G|', message.guild.name)
                                            .replaceAll('|T|', thread.name))

                                    return await thread.delete().catch((e) => {console.log(e)})
                                }

                                content = content.slice(0, index)
                            }
                        }
                    }
                }
            }

            if (forum.sensitive.enabled) {
                const channel = message.guild.channels.cache.get(forum.sensitive.channel)

                if (!channel) 
                    return thread.delete().catch((e) => {console.log(e)})

                let fields = []

                let embed = {
                    color: client.data.embedColor,
                    title: thread.name,
                    author: { 
                        name: message.author.tag, 
                        icon_url: message.author.displayAvatarURL({ dynamic: true, size: 4096 }) 
                    },
                    description: message.content.slice(0, 2048),
                    fields: fields,
                }

                if (message.content.length > 2048) {
                    embed.description = message.content.slice(0, 2048)

                    let i = 0
                    while (true) {
                        if ((i + 1) * 1024 > message.content.length || embed.fields.length > 6)
                            break
        
                        embed.fields.push({ name: `Continuation #${i + 1}`, value: message.content.slice((i + 1) * 1024, (i + 2) * 1024) })
                        i++
                    }
                }

                embed.fields.push({ name: 'User information:', value: `**${await message.guild.members.fetch(message.author.id)??'Unavailable.'}** - **${message.author.tag}** - **\`${message.author.id}\`**`})

                await client.send(channel, null, [embed]).catch(e => console.log(e))

                return setTimeout(() => {
                    thread.delete().catch((e) => {console.log(e)})
                }, 1000)
            }

            if (!forum.pending_tag || !thread.parent.availableTags.find(tag => tag.id === forum.pending_tag)) {
                await channel.setAvailableTags([{ name: 'Pending approval', moderated: true, emoji: '🗃️' }, { name: 'Approved', moderated: true, emoji: '✅' }])
                forum.pending_tag = reaction.message.channel.parent.availableTags.find(t => t.name === 'Pending approval').id
                forum.approved_tag = reaction.message.channel.parent.availableTags.find(t => t.name === 'Approved').id
                forum.markModified('pending_tag')
                forum.markModified('approved_tag')
                await forum.save()
            }

            let tags = thread.appliedTags
            if (tags.length === 5)
                tags.pop()

            tags.push(forum.pending_tag)

            let promises = [
                message.react(forum.emoji),
                message.react('❌'),
                thread.edit({
                    type: client.imports.discord.ChannelType.PrivateThread
                }),
                thread.setAppliedTags(tags),
                message.pin()
            ]

            let i = 0
            let interval = setInterval(async() => {
                if (i >= promises.length || !thread) {
                    clearInterval(interval)

                    setTimeout(async() => {
                        await thread.setArchived(true).catch(async () => {
                            if (forum.checks.deleteWhenOriginalMessageGone)
                                return await thread.delete().catch((e) => {console.log(e)})
                        })
                    }, 1000)

                    if (forum.automaticDeletionTimeout !== 0)
                        return setTimeout(async() => {
                            if (!thread.appliedTags.includes(forum.approved_tag))
                                return await thread.delete().catch(async () => {
                                    if (forum.checks.deleteWhenOriginalMessageGone)
                                        return await thread.delete().catch((e) => {console.log(e)})
                                })
                        }, forum.automaticDeletionTimeout)

                    return
                }

                await promises[i].catch(async () => {
                    if (forum.checks.deleteWhenOriginalMessageGone)
                        return thread.delete().catch((e) => { console.log(e); clearInterval(interval) })
                })
                i++
            }, 2000)
        }).catch(() => {
            thread.delete().catch((e) => {console.log(e)})
        })
    }
}