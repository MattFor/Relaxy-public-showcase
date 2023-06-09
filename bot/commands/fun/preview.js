'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    args: true,
    name: 'preview',
    usage: '=preview',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    description: 'Preview an item from the Relaxy! shop.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (message.mentions.members.first())
            message.author = message.mentions.members.first()

        args.unshift('z')
        let item = null

        try {
            item = args[2] ? client.config.shop.itemPrices[args[1]] ? client.config.shop.itemPrices[args[1]][args[2]] : null : null
        } catch { args.shift();return new client.class.error(`There's no such item as ${args.join(' ')}`, message) }

        if (!item)
            try {
                item = client.config.shop.itemPrices[args[1]]
            } catch {}

        if (!item && args[1] !== 'color')
            return new client.class.error('Item specified doesn\'t exist!', interaction ?? message)

        let user = await client.module.database.User(message.author.id)

        switch (args[1]) {
            case 'color':
                {
                    let hex
                    try {
                        hex = args[2].match(/^#(?:[0-9a-fA-F]{3}){1,2}$/gm)[0]
                    } catch {
                        return new client.class.error('Invalid hex code!', interaction ?? message)
                    }
                    let f = await client.utils.calculateGlobalRank(message, user)
                    let nxtLvl = client.utils.next_level(user.level)
                    let rank = new client.imports.canvacord.Rank()
                        .setAvatar(message.author.displayAvatarURL({

                            extension: 'png',
                            size: 4096
                        }))
                        .setCurrentXP(user.exp)
                        .setRequiredXP(nxtLvl)
                        .setLevel(user.level + 1)
                        .setLevelColor('#FF69B4')
                        .setRankColor('#FF69B4')
                        .setStatus(message.member.presence ? message.member.presence.status : 'offline')
                        .setProgressBar('#FF69B4', 'COLOR')
                        .setRank(f, f, true)
                        .setUsername(client.utils.norm(message.author.username))
                        .setDiscriminator(message.author.tag.slice(-4))
                    let getBg = client.module.profiles.decodeProfileBackgroundStringArray(user.inventory)
                    if (getBg !== -1)
                        rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${getBg[0][0][0]}.png`)
                    rank.setCustomStatusColor(hex)
                    return rank.build().then((buffer) => {
                        return client.send(message.channel, null, null, [new Discord.AttachmentBuilder(buffer, { name: 'rank.png' })])
                    })
                }
            case '2':
                {
                    // Check if invalid
                    if (!args[2])
                        return new client.class.error('No item number given!', interaction ?? message)
                    if (!client.config.shop.itemPrices['2'][args[2]][0])
                        return new client.class.error('That item doesn\'t exist!', interaction ?? message)

                    // Simulate getting the god text (simulate line 591 for loop of ProfileManager.js)
                    let god_text = `${client.config.shop.itemPrices['2'][args[2]][0]}.t.u`
                    let text = god_text ? god_text.split('.') : []

                    // Convert it into a displayable title 
                    let actual_title = text[0]
                    let special_title_addition = text[2] !== 't' ? text[2] : null
                    let color = text[1]
                    let title = `${god_text ? `\`\`\`${color}\n${actual_title}\n\`\`\`${special_title_addition ? special_title_addition === 'nnnn' ? '\n' : special_title_addition : ''}` : ''}`

                    // Get the embed
                    let embed = await client.module.profiles.getProfileEmbed(message, args)
                    embed = embed[0][0]

                    // [Replace / Add] the title
                    embed.description = embed.description.slice(embed.description.indexOf('🗓️'), embed.description.length)
                    embed.description = `${title}${embed.description}`

                    // Send the done thing
                    return client.send(message.channel, null, [embed]).catch(() => new client.class.error('Something went wrong!', interaction ?? message))
                }
                default:
                    {
                        let nxtLvl = client.utils.next_level(user.level)
                        let f = await client.utils.calculateGlobalRank(message, user)
                        let rank = new client.imports.canvacord.Rank()
                            .setAvatar(message.author.displayAvatarURL({
                                extension: 'png',
                                size: 4096
                            }))
                            .setCurrentXP(user.exp)
                            .setRequiredXP(nxtLvl)
                            .setLevel(user.level + 1)
                            .setLevelColor('#FF69B4')
                            .setRankColor('#FF69B4')
                            .setStatus(message.member.presence ? message.member.presence.status : 'offline')
                            .setProgressBar('#FF69B4', 'COLOR')
                            .setUsername(client.utils.norm(message.author.username))
                            .setDiscriminator(message.author.tag.slice(-4))
                            .setRank(f, f, true)

                        rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${item[0].replace(' background', '')}.png`)
                        
                        let getSclr = client.module.profiles.decodeProfileStatusColorStringArray(user.inventory)

                        if (getSclr !== -1)
                            rank.setCustomStatusColor(getSclr[0][0][0])
                        return rank.build().then((buffer) => {
                            return client.send(message.channel, null, null, [new Discord.AttachmentBuilder(buffer, { name: 'rank.png' })])
                        })
                    }
            }
    }
}