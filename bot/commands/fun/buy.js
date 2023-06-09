'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    args: true,
    name: 'buy',
    usage: '=buy',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    description: 'Buy an item from the Relaxy! shop.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        args.unshift('z')

        let item = null

        try {
            item = args[2] ? client.config.shop.itemPrices[args[1]][args[2]] : null
        } catch { args.shift();return new client.class.error(`There's no such item as ${args.join(' ')}`, message) }
        
        if (!item)
            try {
                item = client.config.shop.itemPrices[args[1]]
            } catch {}

        if (!item)
            return new client.class.error('Item specified doesn\'t exist!', interaction ?? message)

        let a = await client.module.database.User(message.author.id)

        if (a.money < item[1])
            return new client.class.error(`description You don't have enough money to buy:\n**${args[1] === 'color' ? 'Custom profile picture outline.' : client.config.shop.itemNames[args[1]][args[2]]}**\nYour money: **${a.money > 10000 ? `${a.money > 1000000 ? `\`${a.money}\`    🤑` : `\`${a.money}\`    💰`}` : `\`${a.money}\`    💵`}**`, message)

        switch (args[1]) {
            case 'color': {
                let hex

                try {
                    hex = args[2].match(/^#(?:[0-9a-fA-F]{3}){1,2}$/gm)[0].toUpperCase()
                } catch {
                    return new client.class.error('Invalid hex code!', interaction ?? message)
                }

                args.shift()
                a.inventory.push(client.module.profiles.encodeProfileStatusColorString(`${hex} ${item[0]} unused`)[0])
                a.money -= 400

                a.markModified('inventory')
                a.markModified('money')

                await a.save()

                let nxtLvl = client.utils.next_level(a.level)
                let rank = new client.imports.canvacord.Rank()
                    .setAvatar(message.author.displayAvatarURL({
                    
                        extension: 'png', size: 4096
                    }))
                    .setCurrentXP(a.exp)
                    .setRequiredXP(nxtLvl)
                    .setLevel(a.level + 1)
                    .setLevelColor('#FF69B4')
                    .setRankColor('#FF69B4')
                    .setStatus(message.member.presence ? message.member.presence.status : 'offline')
                    .setProgressBar('#FF69B4', 'COLOR')
                    .setUsername(client.utils.norm(message.author.username))
                    .setDiscriminator(message.author.tag.slice(-4))
                let getBg = client.module.profiles.decodeProfileBackgroundStringArray(a.inventory)
                if (getBg !== -1)
                    rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${getBg[0][0][0]}.png`)
                let getSclr = client.module.profiles.decodeProfileStatusColorStringArray(a.inventory)
                if (getSclr !== -1)
                    rank.setCustomStatusColor(hex)
                return rank.build().then((buffer) => {
                    return client.send(message.channel, null, [{
                            color: client.data.embedColor,
                            description: `**Success!**\nYour profile picture outline on \`=profile/=lvl and leveling\` will now be **\`${hex}\`**!\n**Preview:**`,
                            thumbnail: {
                                url: `attachment://done.gif`
                            },
                            image: {
                                url: 'attachment://rank.png'
                            }
                        
                    }], [{
                        attachment: './additions/images/profile/payment_complete.gif',
                        name: 'done.gif'
                    }, {
                        attachment: buffer,
                        name: 'rank.png'
                    }])
                })
            }
            case '2':
                if (!args[2])
                    return new client.class.error('No item number given!', interaction ?? message)
                if (!client.config.shop.itemPrices['2'][args[2]][0])
                    return new client.class.error('That item doesn\'t exist!', interaction ?? message)
                let zzzz = `${client.config.shop.itemPrices['2'][args[2]][0]}.t.X`
                a.inventory.push(zzzz)
                a.markModified('inventory')
                a.money -= client.config.shop.itemPrices['2'][args[2]][1]
                a.markModified('money')
                await a.save()
                let text = zzzz.split('.')
                let www = text[0]
                let color = text[1]
                return client.send(message.channel, null, [{
                        color: client.data.embedColor,
                        description: `**Success!**\nYour =profile now has a title:\n\`\`\`${color}\n${www}\n\`\`\``,
                        thumbnail: {
                            url: 'attachment://done.gif'
                        },
                }], [{
                    attachment: './additions/images/profile/payment_complete.gif',
                    name: 'done.gif'
                }])
            default:
                a.money -= item[1]
                a.inventory.push(client.module.profiles.encodeProfileBackgroundString(`${item[0]} unused`)[0])
                a.markModified('inventory')
                a.markModified('money')
                await a.save()
                return client.send(message.channel, null, [{
                        color: client.data.embedColor,
                        description: `**Success!**\nYour rank card background on \`=profile/=lvl and leveling\` will now be **\`${client.config.shop.itemNames[args[1]][args[2]]}\`**!\n**Preview:**`,
                        thumbnail: {
                            url: `attachment://done.gif`
                        },
                        image: {
                            url: 'attachment://tttt.png'
                        }
                }], [{
                    attachment: './additions/images/profile/payment_complete.gif',
                    name: 'done.gif'
                }, {
                    attachment: Object.entries(client.module.profiles.getRankBG(item[0].replace(' background', '')))[0][1],
                    name: 'tttt.png'
                }])
        }
    }
}