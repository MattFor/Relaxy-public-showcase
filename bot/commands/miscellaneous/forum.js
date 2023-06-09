'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'forum',
    usage: '=forum (roles/emoji) / (#channel sensitive/hide/off/match/response arguments)',
    owner: true,
    description: 'Creates a configurable forum channel where members with a role will either allow or reject posts.\n**Roles** - optional argument to instantly set the roles that will be able to manage posts (without relaxy setting one up himself)\n**Emoji** - the emoji that will be used when creating posts.\nTo check the settings of an already existing forum channel, simply type =forum #channel.\nTo go more in depth, type f.e =forum #channel response/match.\nThings to configure:\n\n```fix\nmatch\n```Type =forum #channel match `(keywords/sentences with spaces replaced by -)`\nThis will make it so that any post with the requested phrase/words will automatically be rejected.\n\n```fix\nsensitive\n```Type =forum #channel sensitive #channel2\nPosts made on the original channel will be instantly deleted and piped onto the second channel.\n\n```fix\nhide\n```Simply will hide the channel for everyone without sufficient permissions when Relaxy is unavailable (useful when paired with the sensitive option)\n\n```fix\nresponse\n```Type =forum #channel response [Match keyword] sentence to reply with, remember that |U| will be replaced with the user, |T| with the thread name and |G| with the guild.\nThere are 3 options you cannot delete, 2 of which are set to default: len, reject, accept.\n\n```fix\nlength\n```Type =forum #channel length number / -number\nIf the number is negative, it will delete posts under the desired length, otherwise it will delete posts over the desired length.\n\nTo turn off Relaxy functionality in a forum channel type =forum #channel off.\timeout - seconds\nattachment_exception - do not count length when attachment is present\nraw_search - crude search algorithm\noriginal_message_deleted - delete thread if original message is gone\nattachment_length / body_length / title_length - if number is negative then check for less than, if positive, check over.',
    permissions: ['MANAGE_GUILD'],
    permissionsBOT: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'ADD_REACTIONS', 'MANAGE_THREADS', 'EMBED_LINKS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.forum.enabled) {
            let channel = client.utils.channel(message, args, 0)

            if (channel) {
                let forumChannel = await client.module.database.findForumChannel(channel.id, guild.id)

                if (!forumChannel || forumChannel.length === 0) 
                    return new client.class.error('Channel is not a Relaxy forum!', message)

                let lookup_table = []

                let response_text = ''
                let response_values = Object.entries(forumChannel.responses)

                for (const item of response_values)
                    lookup_table.push(item[1].length > 0 ? item[1] : 'None.')

                lookup_table = [...new Set(lookup_table)]

                let response_obj = {}

                let _a = response_values.length
                for (let i = 0; i < _a; i++) {
                    let text = response_values[i][1].length > 0 ? lookup_table.indexOf(response_values[i][1]).toString() : '0'
                    if (response_obj[text] && response_obj[text].includes(response_values[i][0]))    
                        continue

                    response_obj[text] = [response_values[i][0]]

                    for (let j = 0; j < _a; j++)
                        if (response_values[i][1] === response_values[j][1] && !response_obj[text].includes(response_values[j][0]))
                            response_obj[text].push(response_values[j][0])
                }

                let responses_formatted = Object.entries(response_obj)
                let _b = responses_formatted.length
                for (let i = 0; i < _b; i++) {
                    let text = responses_formatted[i][1].map(s => { return s }).join(', ')
                    response_text += `${i + 1}. **${text}:**\n${lookup_table[Number(responses_formatted[i][0])]}\n`
                }

                response_text = response_text.slice(0, 1024)

                if (args.length === 1) {
                    let moderators = await client.utils.makeList(forumChannel.roles, message.guild.roles.cache, 0, 'Everyone.')

                    let embed = {
                        color: client.data.embedColor,
                        title: `Settings for #${channel.name}`,
                        description: `ID: \`${forumChannel.id}\`\nEmoji: ${forumChannel.emoji}\nApproved tag ID: \`${forumChannel.approved_tag}\`\nPending tag ID: \`${forumChannel.pending_tag}\`\nHides when Relaxy is off: ${forumChannel.hideWhenUnavailable ? 'Yes.' : 'No.'}\nPromt moderator to write a rejection response: ${forumChannel.promptModerator ? 'Yes.' : 'No.'}\nAutomatic post deletion timeout: ${forumChannel.automaticDeletionTimeout !== 0 ? `Yes - \`${client.imports.time(forumChannel.automaticDeletionTimeout)}\`` : 'None.'}\n`,
                        fields: [{
                            name: 'Moderators:', value: moderators
                        }, {
                            name: 'Checks:', value: `Title length check: **${
                                forumChannel.checks.titleLength === 0 ? 'Off' : `\`${forumChannel.checks.titleLength > 0 ? 'Above ' : forumChannel.checks.titleLength < 0 ? 'Below ' : ''}${forumChannel.checks.titleLength < 0 ? -forumChannel.checks.titleLength : forumChannel.checks.titleLength}\``
                            }**\nPost content length check: **${
                                forumChannel.checks.bodyLength === 0 ? 'Off' : `\`${forumChannel.checks.bodyLength > 0 ? 'Above ' : forumChannel.checks.bodyLength < 0 ? 'Below ' : ''}${forumChannel.checks.bodyLength < 0 ? -forumChannel.checks.bodyLength : forumChannel.checks.bodyLength}\``
                            }**\nAttachment count check: **${
                                forumChannel.checks.attachmentCount === 0 ? 'Off' : `\`${forumChannel.checks.attachmentCount > 0 ? 'Above ' : forumChannel.checks.attachmentCount < 0 ? 'Below ' : ''}${forumChannel.checks.attachmentCount < 0 ? -forumChannel.checks.attachmentCount : forumChannel.checks.attachmentCount}\``
                            }**\nDirect non-smart matching: **${
                                forumChannel.checks.rawMatch ? 'On' : 'Off'
                            }**\nVariable case: **${
                                forumChannel.checks.variable_case ? 'On' : 'Off'
                            }**\nIf the check is found but there's more, do not count: **${
                                forumChannel.checks.cutOff ? 'On' : 'Off'
                            }**\nDelete post if original message is deleted: **${
                                forumChannel.checks.deleteWhenOriginalMessageGone ? 'On' : 'Off'
                            }**\nDo not measure title/body size if there's an attachment: **${
                                forumChannel.checks.invalidateLengthCheckWhenAttachmentPresent ? 'On' : 'Off'
                            }**\nCheck for words in the **${guild.prefixes[0]}censor pool: ${
                                forumChannel.checks.censorPoolCheck ? 'On' : 'Off'
                            }**`
                        }, {
                            name: 'Automatic deletions:', value: `${forumChannel.checks.matches.map(m => { return m.replaceAll('-', ' ') }).join(', ') || 'None'}.`.slice(0, 2048)
                        }, { 
                            name: 'Responses:', value: response_text 
                        }, { 
                            name: 'Note:', value: 'Remember that anything with - will be replaced with a space.' 
                        }]
                    }

                    return client.send(message.channel, null, [embed])
                }

                switch (args[1].toLowerCase()) {
                    case 'timeout': {
                        if (!args[2]) {
                            forumChannel.automaticDeletionTimeout = 0
                            forumChannel.markModified('automaticDeletionTimeout')
                            await forumChannel.save()
                            return new client.class.error('Automatic deletion.', message)
                        }

                        let nums = client.utils.nums(args[2])

                        if (!nums)
                            return new client.class.error('No numbers provided!', message)

                        nums = parseInt(nums)

                        if (nums < 0 || nums > (24 * 60 * 60 * 1000))               // TODO: FIX THIS RETARDED GARBAGE
                            return new client.class.error(`Minimum length is 1, maximum is 24 hours (type in ms)!`, message)

                        forumChannel.automaticDeletionTimeout = parseInt(nums)
                        forumChannel.markModified('automaticDeletionTimeout')
                        await forumChannel.save()
                        return new client.class.error(`Automatic deletion set to ${nums}.`, message)
                    }

                    case 'attachment_exception': {
                        forumChannel.checks.invalidateLengthCheckWhenAttachmentPresent = !forumChannel.checks.invalidateLengthCheckWhenAttachmentPresent
                        forumChannel.markModified('checks.invalidateLengthCheckWhenAttachmentPresent')
                        await forumChannel.save()
                        return new client.class.error(`Do not count length requirements if an attachment is present ${forumChannel.checks.invalidateLengthCheckWhenAttachmentPresent ? 'ON' : 'OFF'}!`, message)
                    }

                    case 'raw_search': {
                        forumChannel.checks.rawMatch = !forumChannel.checks.rawMatch
                        forumChannel.markModified('checks.rawMatch')
                        await forumChannel.save()
                        return new client.class.error(`Direct search for string regardless of spacing turned ${forumChannel.checks.rawMatch ? 'ON' : 'OFF'}!`, message)
                    }

                    case 'original_message_deleted': {
                        forumChannel.checks.deleteWhenOriginalMessageGone = !forumChannel.checks.deleteWhenOriginalMessageGone
                        forumChannel.markModified('checks.deleteWhenOriginalMessageGone')
                        await forumChannel.save()
                        return new client.class.error(`Threads will now be deleted if the original message is gone: ${forumChannel.checks.deleteWhenOriginalMessageGone ? 'ON' : 'OFF'}!`, message)
                    }

                    case 'variable_case': {
                        forumChannel.checks.variable_case = !forumChannel.checks.variable_case
                        forumChannel.markModified('checks.variable_case')
                        await forumChannel.save()
                        return new client.class.error(`Check regardless of letter case (f.e FILE will be triggered for file) ${forumChannel.checks.variable_case ? 'ON' : 'OFF'}!`, message)
                    }

                    case 'censor': {
                        if (!guild.plugins.censoring.enabled)
                            return new client.class.error('Censoring not enabled!', message)
                        if (!guild.plugins.censoring.censorPool.length === 0)
                            return new client.class.error('Censorpool size is 0!', message)

                        forumChannel.checks.censorPoolCheck = !forumChannel.checks.censorPoolCheck
                        forumChannel.markModified('checks.censorPoolCheck')
                        await forumChannel.save()
                        return new client.class.error(`Will censor things using the ${guild.prefixes[0]}censor pool ${forumChannel.checks.censorPoolCheck ? 'ON' : 'OFF'}!`, message)
                    }

                    case 'attachment_length': {
                        if (!args[2]) {
                            forumChannel.checks.attachmentCount = 0
                            forumChannel.markModified('checks.attachmentCount')
                            await forumChannel.save()
                            return new client.class.error('Content length requirement turned off.', message)
                        }

                        let nums = client.utils.nums(args[2])

                        if (!nums)
                            return new client.class.error('No numbers provided!', message)

                        nums = parseInt(nums)

                        if (args[2].includes('-')) {
                            nums = -nums
                        }

                        if (nums < 0 ? nums > -1 || nums < -10 : nums < 1 || nums > 10)
                            return new client.class.error(`Minimum length is ${args[2].includes('-') ? '-' : ''}1, maximum is ${args[2].includes('-') ? '-' : ''}10!`, message)

                        forumChannel.checks.attachmentCount = parseInt(nums)
                        forumChannel.markModified('checks.attachmentCount')
                        await forumChannel.save()
                        return new client.class.error(`Attachment length requirement set to ${nums}.`, message)
                    }

                    case 'body_length': {
                        if (!args[2]) {
                            forumChannel.checks.bodyLength = 0
                            forumChannel.markModified('checks.bodyLength')
                            await forumChannel.save()
                            return new client.class.error('Content length requirement turned off.', message)
                        }

                        let nums = client.utils.nums(args[2])

                        if (!nums)
                            return new client.class.error('No numbers provided!', message)

                        nums = parseInt(nums)

                        if (args[2].includes('-')) {
                            nums = -nums
                        }

                        if (nums < 0 ? nums > -1 || nums < -3995 : nums < 1 || nums > 3995)
                            return new client.class.error(`Minimum length is ${args[2].includes('-') ? '-' : ''}1, maximum is ${args[2].includes('-') ? '-' : ''}3500!`, message)

                        forumChannel.checks.bodyLength = parseInt(nums)
                        forumChannel.markModified('checks.bodyLength')
                        await forumChannel.save()
                        return new client.class.error(`Content length requirement set to ${nums}.`, message)
                    }

                    case 'title_length': {
                        if (!args[2]) {
                            forumChannel.checks.titleLength = 0
                            forumChannel.markModified('checks.titleLength')
                            await forumChannel.save()
                            return new client.class.error('Title length requirement turned off.', message)
                        }

                        let nums = client.utils.nums(args[2])

                        if (!nums)
                            return new client.class.error('No numbers provided!', message)

                        nums = parseInt(nums)

                        if (args[2].includes('-')) {
                            nums = -nums
                        }

                        if (nums < 0 ? nums > -1 || nums < -2048 : nums < 1 || nums > 2048)
                            return new client.class.error(`Minimum length is ${args[2].includes('-') ? '-' : ''}1, maximum is ${args[2].includes('-') ? '-' : ''}2048!`, message)

                        forumChannel.checks.titleLength = parseInt(nums)
                        forumChannel.markModified('checks.titleLength')
                        await forumChannel.save()
                        return new client.class.error(`Title length requirement set to ${nums}.`, message)
                    }

                    case 'cutoff': {
                        forumChannel.checks.cutOff = !forumChannel.checks.cutOff
                        forumChannel.markModified('checks.cutOff')
                        await forumChannel.save()
                        return new client.class.error(`Will not count checks when there still are words after it: ${forumChannel.checks.cutOff ? 'off' : 'on'}!`, message)
                    }

                    case 'response': {
                        let embed = {
                            color: client.data.embedColor,
                            title: 'Responses:',
                            fields: []
                        }

                        if (!args[2]) {
                            embed.description = ''

                            let lookup_table = []

                            let response_text = ''
                            let response_values = Object.entries(forumChannel.responses)

                            for (const item of response_values)
                                lookup_table.push(item[1].length > 0 ? item[1] : 'None.')

                            lookup_table = [...new Set(lookup_table)]

                            let response_obj = {}

                            let _a = response_values.length
                            for (let i = 0; i < _a; i++) {
                                let text = response_values[i][1].length > 0 ? lookup_table.indexOf(response_values[i][1]).toString() : '0'
                                if (response_obj[text] && response_obj[text].includes(response_values[i][0]))    
                                    continue

                                response_obj[text] = [response_values[i][0]]

                                for (let j = 0; j < _a; j++)
                                    if (response_values[i][1] === response_values[j][1] && !response_obj[text].includes(response_values[j][0]))
                                        response_obj[text].push(response_values[j][0])
                            }

                            let responses_formatted = Object.entries(response_obj)
                            let _b = responses_formatted.length
                            for (let i = 0; i < _b; i++) {
                                let text = responses_formatted[i][1].map(s => { return s }).join(', ')
                                response_text += `${i + 1}. **${text}:**:\n${lookup_table[Number(responses_formatted[i][0])]}\n`
                            }

                            embed = client.utils.createDescription(response_text, embed, 5000)

                            embed.fields.push({ name: 'Note:', value: 'Remember that anything with - will be replaced with a space.' })

                            return client.send(message.channel, null, [embed])
                        }

                        args.shift()    // Channel
                        args.shift()    // Type

                        let match = args.shift()

                        if (!forumChannel.checks.matches.includes(match) && !['bodylength', 'titlelength', 'accept', 'reject', 'censorpoolcheck', 'attachmentcount'].includes(match.toLowerCase()))
                            return new client.class.error(`Did not find match case:\n${client.utils.firstLetterUp(match)}`, message)

                        if (!args[3]) {
                            forumChannel.responses[match] = ''
                            forumChannel.markModified(`responses.${match}`)
                            await forumChannel.save()
                            return new client.class.error(`Response for ${match} has been removed!`, message)
                        }

                        embed.description = ''
                        args = args.join(' ')
                        embed.fields = [{ 
                            name: 'Old:', 
                            value: forumChannel.responses[match].length > 1 ? forumChannel.responses[match] : 'None.'
                        }, { name: 'New:', value: args }]

                        forumChannel.responses[match] = args
                        forumChannel.markModified(`responses.${match}`)
                        await forumChannel.save()

                        embed.description = embed.description.slice(0, 2048)

                        embed.fields.push({ name: 'Note:', value: 'Remember that anything with - will be replaced with a space.' })

                        return client.send(message.channel, null, [embed])
                    }

                    case 'match': {
                        let embed = {
                            color: client.data.embedColor,
                            title: 'Automatic deletions:',
                            fields: []
                        }

                        if (!args[2]) {
                            return client.send(message.channel, null, [
                                client.utils.createDescription(`${forumChannel.checks.matches.map(m => { 
                                        return m.replaceAll('-', ' ') }).join(', ') 
                                    }.`, embed, 
                                )])
                        }

                        let added = []
                        let removed = []
                        let censored = forumChannel.checks.matches
                        let responses = forumChannel.responses

                        args.shift()    // Channel
                        args.shift()    // Type

                        let arg_len = args.length
                        for (let i = 0; i < arg_len; i++) {
                            if (censored.includes(args[i])) {
                                censored.splice(censored.indexOf(args[i]), 1)
                                removed.push(args[i])

                                if (!['titleLength', 'accept', 'reject', 'bodyLength', 'attachmentCount', 'censorPoolCheck'].includes(args[i]))
                                    delete responses[args[i]]

                                continue
                            }

                            censored.push(args[i])
                            added.push(args[i])

                            responses[args[i]] = ''
                        }

                        let limit = 5000

                        if (added.length > 1) {
                            limit -= 1024
                            embed.fields.push({ name: 'Added:', value: `${added.map(a => { return a }).join(', ')}.`.slice(0, 1024) })
                        }

                        if (removed.length > 1) {
                            limit -= 1024
                            embed.fields.push({ name: 'Removed:', value: `${removed.map(r => { return r }).join(', ')}.`.slice(0, 1024) })
                        }

                        embed = client.utils.createDescription(`${censored.map(m => { return m }).join(', ') }.`, embed, limit, false)

                        embed.fields.push({ name: 'Note:', value: 'Remember that anything with - will be replaced with a space.' })

                        forumChannel.responses = responses
                        forumChannel.checks.matches = censored

                        forumChannel.markModified('responses')
                        forumChannel.markModified('checks.matches')

                        await forumChannel.save()

                        return client.send(message.channel, null, [embed])
                    }

                    case 'sensitive': {
                        if (forumChannel.sensitive.enabled && !args[2]) {
                            forumChannel.sensitive.enabled = false
                            forumChannel.markModified('sensitive.enabled')
                            await forumChannel.save()
                            return new client.class.error('Sensitive channel setting has been turned off.', message)
                        }

                        if (!args[2])
                            return new client.class.error('Sensitive channel to send information to not provided!', message)

                        let sens_channel = client.utils.channel(message, args, 2)

                        if (forumChannel.sensitive.enabled) {
                            forumChannel.sensitive.channel = sens_channel.id
                            forumChannel.markModified('sensitive.channel')
                            await forumChannel.save()
                            return new client.class.error(`Sensitive channel changed to ${sens_channel.name}.`, message)
                        }

                        if (!sens_channel)
                            return new client.class.error('Channel does not exist!', message)

                        forumChannel.sensitive.channel = sens_channel.id
                        forumChannel.sensitive.enabled = true

                        forumChannel.markModified('sensitive.channel')
                        forumChannel.markModified('sensitive.enabled')

                        await forumChannel.save()

                        return new client.class.error(`Settings saved, sending messages to ${sens_channel.name}`, message)
                    }
                    case 'hide': {
                        forumChannel.hideWhenUnavailable = !forumChannel.hideWhenUnavailable
                        forumChannel.markModified('hideWhenUnavailable')
                        await forumChannel.save()
                        return new client.class.error(forumChannel.hideWhenUnavailable ? `Will not show ${channel.name} when Relaxy is offline.`: `Will still show ${channel.name} when Relaxy is offline.`, message)
                    }
                    case 'off': {
                        await client.module.database.deleteForumChannel(forumChannel.id, guild.id)
                        return new client.class.error('Relaxy channel deleted from the databse.', message)
                    }
                }

                args.shift()

                let emoji = ''
                let roles = forumChannel.roles
                let modified = false

                let arg_len = args.length
                for (let i = 0; i < arg_len; i++) {
                    let role = client.utils.role(message, args, i)
                    let user = (await client.utils.member(message, args, i))?.user
                    let e = Object.keys(client.config.emojis).includes(args[i]) || Object.values(client.config.emojis).includes(args[i])

                    if (e && !emoji)
                        emoji = args[i]

                    if (role && roles.includes(role.id)) {
                        roles.splice(roles.indexOf(role.id), 1)
                        modified = true
                    } else if (role && !roles.includes(role.id)) {
                        roles.push(role.id)
                        modified = true
                    }

                    if (user && roles.includes(user.id)) {
                        roles.splice(roles.indexOf(user.id), 1)
                        modified = true
                    } else if (user && !roles.includes(user.id)) {
                        roles.push(user.id)
                        modified = true
                    }
                }

                if (emoji.length > 0) {
                    forumChannel.emoji = args[1]
                    forumChannel.markModified('emoji')
                    await forumChannel.save()
                    new client.class.error(`Emoji changed to ${args[1]}.`, message)
                }

                if (modified) {
                    forumChannel.roles = roles
                    forumChannel.markModified('roles')
                    await forumChannel.save()
                    new client.class.error('Roles changed.', message)
                }

                let moderators = await client.utils.makeList(forumChannel.roles, message.guild.roles.cache, 0, 'Everyone.')

                let embed = {
                    color: client.data.embedColor,
                    title: `Settings for #${channel.name}`,
                    description: `ID: \`${forumChannel.id}\`\nEmoji: ${forumChannel.emoji}\nApproved tag ID: \`${forumChannel.approved_tag}\`\nPending tag ID: \`${forumChannel.pending_tag}\`\nHides when Relaxy is off: ${forumChannel.hideWhenUnavailable ? 'Yes.' : 'No.'}\nPromt moderator to write a rejection response: ${forumChannel.promptModerator ? 'Yes.' : 'No.'}\nAutomatic post deletion timeout: ${forumChannel.automaticDeletionTimeout !== 0 ? `Yes - \`${client.imports.time(forumChannel.automaticDeletionTimeout)}\`` : 'None.'}\n`,
                    fields: [{
                        name: 'Moderators:', value: moderators
                    }, {
                        name: 'Checks:', value: `Title length check: **${
                            forumChannel.checks.titleLength === 0 ? 'Off' : `\`${forumChannel.checks.titleLength > 0 ? 'Above ' : forumChannel.checks.titleLength < 0 ? 'Below ' : ''}${forumChannel.checks.titleLength < 0 ? -forumChannel.checks.titleLength : forumChannel.checks.titleLength}\``
                        }**\nPost content length check: **${
                            forumChannel.checks.bodyLength === 0 ? 'Off' : `\`${forumChannel.checks.bodyLength > 0 ? 'Above ' : forumChannel.checks.bodyLength < 0 ? 'Below ' : ''}${forumChannel.checks.bodyLength < 0 ? -forumChannel.checks.bodyLength : forumChannel.checks.bodyLength}\``
                        }**\nAttachment count check: **${
                            forumChannel.checks.attachmentCount === 0 ? 'Off' : `\`${forumChannel.checks.attachmentCount > 0 ? 'Above ' : forumChannel.checks.attachmentCount < 0 ? 'Below ' : ''}${forumChannel.checks.attachmentCount < 0 ? -forumChannel.checks.attachmentCount : forumChannel.checks.attachmentCount}\``
                        }**\nDirect non-smart matching: **${
                            forumChannel.checks.rawMatch ? 'On' : 'Off'
                        }**\nVariable case: **${
                            forumChannel.checks.variable_case ? 'On' : 'Off'
                        }**\nIf the check is found but there's more, do not count: **${
                            forumChannel.checks.cutOff ? 'On' : 'Off'
                        }**\nDelete post if original message is deleted: **${
                            forumChannel.checks.deleteWhenOriginalMessageGone ? 'On' : 'Off'
                        }**\nDo not measure title/body size if there's an attachment: **${
                            forumChannel.checks.invalidateLengthCheckWhenAttachmentPresent ? 'On' : 'Off'
                        }**\nCheck for words in the **${guild.prefixes[0]}censor pool: ${
                            forumChannel.checks.censorPoolCheck ? 'On' : 'Off'
                        }**`
                    }, {
                        name: 'Automatic deletions:', value: `${forumChannel.checks.matches.map(m => { return m.replaceAll('-', ' ') }).join(', ') || 'None'}.`.slice(0, 2048)
                    }, { 
                        name: 'Responses:', value: response_text 
                    }, { 
                        name: 'Note:', value: 'Remember that anything with - will be replaced with a space.' 
                    }]
                }

                return client.send(message.channel, null, [embed])
            }
        }


        let emoji = ''
        let roles = []

        let arg_len = args.length
        for (let i = 0; i < arg_len; i++) {
            let role = client.utils.role(message, args, i)
            let user = (await client.utils.member(message, args, i))?.user
            let e = Object.keys(client.config.emojis).includes(args[i]) || Object.values(client.config.emojis).includes(args[i])

            if (e && !emoji)
                emoji = args[i]

            if (role && !roles.includes(role.id))
                roles.push(role.id)

            if (user && !roles.includes(user.id))
                roles.push(user.id)
        }

        let no_role = true
        let fcs = await client.module.database.findForumChannels(guild.id)

        let _fcs = fcs.length
        for (let i = 0; i < _fcs; i++)
            if (fcs[i].roles.length > 0) {
                no_role = false
                break
            }

        let existing_role = message.guild.roles.cache.find(r => r.name === 'Relaxy forum moderator' || r.name === 'Forum moderator')

        if (existing_role) {
            roles.push(existing_role.id)
        } else if (arg_len == 0 && no_role) {
            let create_flag = false

            let forum_role = await message.guild.roles.create().catch(() => create_flag = true)

            if (create_flag) 
                return new client.class.error('Something went wrong while creating the forum moderator role!', interaction ?? message)

            Promise.all([forum_role.setName('Relaxy forum moderator'), forum_role.setColor('#da00ff'), forum_role.setMentionable(false), forum_role.setHoist(false)])

            roles.push(forum_role.id)

            new client.class.error('Successfully created the forum moderator role!', interaction ?? message)
        }

        if (!emoji) {
            emoji = '✅'
            new client.class.error('No emoji found, setting default.', message)
        }

        message.guild.channels.create({
            name: 'forum', 
            type: client.imports.discord.ChannelType.GuildForum,
        }).then(async(channel) => {
            channel.setTopic('Only members with a special role can approve a post on this channel.')

            let channels = guild.forum.channels

            channels.push(channel.id)

            client.save(guild.id, {
                to_change: 'forum',
                value: {
                    enabled: true,
                    channels: channels,
                }
            })

            await channel.setDefaultReactionEmoji('✅')
            await channel.setAvailableTags([{ name: 'Pending approval', moderated: true, emoji: '🗃️' }, { name: 'Approved', moderated: true, emoji: '✅' }])

            await client.module.database.ForumChannel(channel.id, guild.id, emoji, roles, channel.availableTags.find(t => t.name === 'Pending approval').id, channel.availableTags.find(t => t.name === 'Approved').id)

            return new client.class.error('Forum channel successfully created.', interaction ?? message)
        })
    }
}