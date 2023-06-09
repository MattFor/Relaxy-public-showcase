'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../Relaxy.js'

const ACHIEVEMENT_SIZE = 11

export default class ProfileManager {

    /**
     * Manage the global economy related things
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Get the embed of the current shop.
     * @param {Discord.Message} message 
     * @returns {Discord.EmbedBuilder}
     */
    async getShopEmbed(message) {
        const user = await this.client.module.database.User(message.author.id)

        const backgrounds = Object.values(this.client.config.shop.itemNames[1]).map((background, i) => {
            return `**\`${i + 1}\` - ${background} [\`${this.client.config.shop.itemPrices[1][i + 1][1]}\`]**`
        }).join('\n')
        
        const titles = Object.values(this.client.config.shop.itemNames[2]).map((title, i) => {
            return `\`${i + 1}\` **${title.replace('Title: ', '')} [\`${this.client.config.shop.itemPrices[2][i + 1][1]}\`]**`
        }).join('\n')

        return [[new Discord.EmbedBuilder().setColor('#FF69B4')
        .setTitle('Relaxy! Shop:')
        .addFields([
            { name: '[1] - Profile backgrounds:', value: backgrounds },
            { name: '[2] - Titles:', value: titles }
        ])
        .setThumbnail('attachment://shop.gif')
        .setDescription(`Your money: **${user.money > 10000 ? `${user.money > 1000000 ? `\`${user.money}\`    🤑` : `\`${user.money}\`    💰`}` : `\`${user.money}\`    💵`}**\n**[color]** Change status outline color on profile level image: **\`400\` 💰**`)], 
        [new Discord.AttachmentBuilder('./additions/images/profile/shop.gif', { name: 'shop.gif' })]]
    }

    /**
     * Get a message attachment of a file.
     * @param {Number} number 
     * @returns {Discord.AttachmentBuilder}
     */
    getRankBG(number) {
        return new Discord.AttachmentBuilder(`./additions/images/level_up_store_rank_card_backgrounds/${number}.png`, { name: 'bg.png' })
    }

    /**
     * Give back an achievement embed
     * @param {Discord.Message} message 
     * @param {String} type internal achievement name
     * @param {Mongoose.Schema} user 
     * @param {Number} xpGain 
     * @param {Number} moneyGain 
     * @private
     * @returns {Discord.Message}
     */
    _achievementEmbed(message, type, user, xpGain, moneyGain, guild) {
        if (!message.member) 
            return

        let achievements_user_number = 0
        let first_achievement_flag = false

        for (const [key = null, value] of Object.entries(user.achievements))
            if (value.achieved === true) achievements_user_number++

        if (achievements_user_number === 1) 
            first_achievement_flag = true

        type = this.client.config.text.achievements[type]

        if (guild?.achievements?.channel)
            return this.client.send(this.client.channels.cache.get(guild.achievements.channel), null, [new Discord.EmbedBuilder().setDescription(`Congratulations ${message.member}!\n${first_achievement_flag ? `**You just got your first achievement:** ${type}!` : `**You got another achievement:** ${type}!`}\n**Progress: [${this.client.imports.progressbar.splitBar(ACHIEVEMENT_SIZE, achievements_user_number, ACHIEVEMENT_SIZE, '▬', '⭐')[0]}]  \`${achievements_user_number}\` / \`${ACHIEVEMENT_SIZE}\` **\nMoney gained: **\`${moneyGain}\` 💵**  Experience gained: **\`${xpGain}\` 🔆**`).setThumbnail('attachment://AchievementStar.gif').setColor(this.client.data.embedColor)], [new Discord.AttachmentBuilder('./additions/images/profile/achievement.gif', { name: 'AchievementStar.gif' })])
        return this.client.send(message.channel, null, [new Discord.EmbedBuilder().setDescription(`Congratulations ${message.member}!\n${first_achievement_flag ? `**You just got your first achievement:** ${type}!` : `**You got another achievement:** ${type}!`}\n**Progress: [${this.client.imports.progressbar.splitBar(ACHIEVEMENT_SIZE, achievements_user_number, ACHIEVEMENT_SIZE, '▬', '⭐')[0]}]  \`${achievements_user_number}\` / \`${ACHIEVEMENT_SIZE}\` **\nMoney gained: **\`${moneyGain}\` 💵**  Experience gained: **\`${xpGain}\` 🔆**`).setThumbnail('attachment://AchievementStar.gif').setColor(this.client.data.embedColor)], [new Discord.AttachmentBuilder('./additions/images/profile/achievement.gif', { name: 'AchievementStar.gif' })])
    }

    /**
     * Handle achievements
     * @param {Discord.Message} message 
     * @param {String} type internal achievement name
     * @public
     * @returns {Function}
     */
    async Achievement(message, type, guild) {
        const user = await this.client.module.database.User(message.author.id)
        if (user.achievements[type].achieved) 
            return
      
        let [xpGain, moneyGain] = [0, 0]
        switch (type) {
            case 'playedtrack':
                [xpGain, moneyGain] = [300, 50]
            break
            case 'playedplaylist':
                [xpGain, moneyGain] = [700, 50]
            break
            case 'setwelcome':
                [xpGain, moneyGain] = [4000, 150]
            break
            case 'saved':
            case 'fetched':
                [xpGain, moneyGain] = [2000, 70]
            break
            case 'madepoll':
                [xpGain, moneyGain] = [2000, 100]
            break
            case 'got_heart':
                [xpGain, moneyGain] = [7000, 300]
            break
            case 'madeheartboard':
                [xpGain, moneyGain] = [2000, 100]
            break
            case 'lockeddown':
                [xpGain, moneyGain] = [1000, 90]
            break
            case 'image':
                [xpGain, moneyGain] = [500, 60]
            break
            case 'lvldup':
                [xpGain, moneyGain] = [300, 150]
            break
        }

        user.exp += xpGain
        user.money += moneyGain
        user.lastAchievement = type
        user.achievements[type].achieved = true
      
        let array = ['money', `achievements.${type}.achieved`, 'lastAchievement', 'exp']
        array.forEach(prop => user.markModified(prop))
        await user.save()
      
        return this._achievementEmbed(message, type, user, xpGain, moneyGain, guild)
    }

    /**
     * Turn internal achievement name to human readable achievement name
     * @param {String} string 
     * @private
     * @returns {String}
     */
    getAchievement(string) {
        return this.client.config.text.achievements[string] ? `\`${this.client.config.text.achievements[string]}\`` : ''
    }

    /**
     * Calculate the global rank of a user.
     * @param {Array<Mongoose.Schema>} guildMembers 
     * @param {Mongoose.Document} member 
     * @returns {Number}
     */
    _calculateGuildRank(guildMembers, member) {
        let array = []
        let length = guildMembers.length

        for (let i = 0; i < length; i++)
            array.push(`${guildMembers[i].level}.${guildMembers[i].id}`)

        return this.client.utils.radix(array).indexOf(`${member.level}.${member.id}`) + 1
    }

    /**
     * Calculate the rarest achievement of a user.
     * @param {Mongoose.Schema} User 
     * @returns {String}
     */
    async _calculateRarestAchievement(User) {
        let numberOfAchievements = 0
        const achievements = {}
        
        // Count number of achievements of the user
        Object.entries(User.achievements).forEach(([key, value]) => {
            if (value.achieved)
                numberOfAchievements += 1
            achievements[key] = 0
        })
        
        // Count number of achievements of all users
        const globalUsers = await this.client.module.database.findAllUsers()
        globalUsers.forEach((user) => {
            Object.entries(user.achievements).forEach(([key, value]) => {
                if (value.achieved)
                    achievements[key] += 1
            })
        })
        
        let rarestAchievement = `lvldup_${achievements.lvldup}`
        
        // Find the rarest achievement achieved by the user
        Object.entries(achievements).forEach(([key, value]) => {
            if (value < Number(rarestAchievement.split('_')[1]) && User.achievements[key].achieved)
                rarestAchievement = `${key}_${value}`
        })
        
        return [rarestAchievement, numberOfAchievements]
    }

    /**
     * Process a multishard trade request.
     * @param {Discord.Message} message 
     */
    async ProcessTrade(message, args) {

        let cache_user = await this.client.utils.member(message, args, 0)

        if (!cache_user)
            return new this.client.class.error('Specified user doesn\'t exist on this server!', message)

        cache_user = cache_user.user

        if (cache_user.id === message.author.id)
            return new this.client.class.error('Cannot trade with yourself!', message)

        if (cache_user.bot)
            return new this.client.class.error('Cannot trade with bots!', message)

        // Fetch database users.
        let user_2 = await this.client.module.database.User(cache_user.id)
        let user_1 = await this.client.module.database.User(message.author.id)

        // Get the 2 items
        let item_1 = args[1]
        let item_2 = args[2]

        // If either item is missing, return.
        if (!item_1 || !item_2)
            return new this.client.class.error('One of the items needed for the trade not mentioned!', message)

        let money_flag_1 = false
        let money_flag_2 = false

        let money_1 = 0
        let money_2 = 0

        // Check if either item contains the money flag.
        if (item_1.toLowerCase().includes('money')) {

            money_flag_1 = true
            money_1 = Number(this.client.utils.nums(item_1))

            if (!money_1)
                return new this.client.class.error('No money provided in the first argument!', message)
        }

        if (item_2.toLowerCase().includes('money')) {

            money_flag_2 = true
            money_2 = Number(this.client.utils.nums(item_2))

            if (!money_2)
                return new this.client.class.error('No money provided in the second argument!', message)
        }

        // Get ID values.
        item_1 = this.client.utils.nums(item_1) - 1
        item_2 = this.client.utils.nums(item_2) - 1
        
        if (money_flag_1) {
            if (user_1.money < money_1)
                return new this.client.class.error('You don\'t have enough money that you specified!', message)

        } else if (!user_1.inventory[item_1])
            return new this.client.class.error('There\'s no item with that ID in your inventory!', message)

        if (money_flag_2) {
            if (user_2.money < money_2)
                return new this.client.class.error('The specified user doesn\'t have the amount of money you specified!', message)

        } else if (!user_2.inventory[item_2])
            return new this.client.class.error('There\'s no item with that ID in that user\'s inventory!', message)

        let trade_request_embed = new Discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setTimestamp()
            .setFooter(this.client.data.footer)

        /**
         * @type {String[]}
         */
        let props
        let type

        let ITEM_1
        let ITEM_2

        if (!money_flag_1) {

            props = user_1.inventory[item_1].split('.')
            type = props[props.length - 2]

            switch (type) {
                case 'sclr':
                    ITEM_1 = {
                        type: 'color',
                        content: `Color: **\`${props[0].toLowerCase() === 'null' ? 'Default status color' : props[0].toUpperCase()}\`**`
                    }
                    break
                case 'bg':
                    ITEM_1 = {
                        type: 'bg',
                        content: `**${this.client.config.shop.backgroundNames[props[0]].split('_')[0]},**\n`
                    }
                    break
                case 't':
                    ITEM_1 = {
                        type: 't',
                        content: `\`\`\`${this.client.config.shop.profileTitles[props[0]]}\n${props[0]}\n\`\`\``
                    }
                    break
            }
        }

        if (!money_flag_2) {
            props = user_2.inventory[item_2].split('.')
            type = props[props.length - 2]

            switch (type) {
                case 'sclr':
                    ITEM_2 = {
                        type: 'color',
                        content: `Color: **\`${props[0].toLowerCase() === 'null' ? 'Default status color' : props[0].toUpperCase()}\`**`
                    }
                    break
                case 'bg':
                    ITEM_2 = {
                        type: 'bg',
                        content: `**${this.client.config.shop.backgroundNames[props[0]].split('_')[0]}**`
                    }
                    break
                case 't':
                    ITEM_2 = {
                        type: 't',
                        content: `\`\`\`${this.client.config.shop.profileTitles[props[0]]}\n${props[0]}\n\`\`\``
                    }
                    break
            }
        }

        let abort_flag = false

        trade_request_embed.setDescription(
                `${message.author.tag} will give you his:\n${
            money_flag_1 ? `Money: **\`${money_1}\`**` : 
            ITEM_1.type === 't' ? `Title:${ITEM_1.content}` :
            ITEM_1.type === 'bg' ? `Background:\n**${ITEM_1.content}**` :
            `Color:\n**${ITEM_1.content}**`
        }\nFor your:\n${
            money_flag_2 ? `Money: **\`${money_2}\`**` : 
            ITEM_2.type === 't' ? `Title:${ITEM_2.content}` :
            ITEM_2.type === 'bg' ? `Background:\n**${ITEM_2.content}**` :
            `Color:\n**${ITEM_2.content}**`
        }\nDo you accept, react with ✅ or ❌. Trade expires in 5 minutes.`)

        let r = false
        let doneflag = false

        return this.client.send(message.channel, `${cache_user}!\nYou have received a trade request from ${message.author.tag}!`, [trade_request_embed]).catch(e => abort_flag = true).then(async m => {
            if (abort_flag) return new this.client.class.error('Something went wrong, aborting trade!', message)

            m.react('✅')

            return setTimeout(() => {
                m.react('❌')

                const z = m.createReactionCollector({ filter: (reaction, user) => (user.id === cache_user.id && ['✅', '❌'].includes(reaction.emoji.name)), max: 1, time: 30000, errors: ['time'] })

                z.on('collect', async (reaction, user) => {
                    if (!doneflag) {
                        doneflag = true
                        m.reactions.removeAll()
                        switch (reaction.emoji.name) {
                            case '✅':
                                if (money_flag_1) {
                                    user_1.money -= money_1
                                    user_1.markModified('money')
                                    user_2.money += money_1
                                    user_2.markModified('money')
                                } else {
                                    user_2.inventory.push(user_1.inventory[item_1])
                                    user_2.markModified('inventory')
                                    user_1.inventory.splice(item_1, 1)
                                    user_1.markModified('inventory')
                                }
                                if (money_flag_2) {
                                    user_2.money -= money_2
                                    user_2.markModified('money')
                                    user_1.money += money_2
                                    user_1.markModified('money')
                                } else {
                                    user_1.inventory.push(user_2.inventory[item_2])
                                    user_1.markModified('inventory')
                                    user_2.inventory.splice(item_2, 1)
                                    user_2.markModified('inventory')
                                }
                                
                                await user_1.save()
                                await user_2.save()

                                this.client.send(cache_user, null, [{
                                    color: this.client.data.embedColor,
                                    description: `Hi ${cache_user}!\nYour trade with ${message.author.tag} is successful, the items/money are in your inventory now!`
                                }])

                                m.delete()

                                return this.client.send(message.author, null, [{
                                    color: this.client.data.embedColor,
                                    description: `Hi ${message.author}!\nYour trade with ${cache_user.tag} is successful, the items/money are in your inventory now!`
                                }])

                            case '❌':
                                r = true
                                return
                            default:
                                return abort_flag = true
                        }
                    } 
                    })
                
                    z.on('end', async () => {
                        return this.client.edit(m, null, [{
                            color: this.client.data.embedColor,
                            description: `${r ? `${message.author}!\nIt seems that **${cache_user.tag}** has rejected your trade!` : `**Trade has timed out.**`}`
                        }])
                    })
            }, 755)
        })
    }

    /**
     * Get an embed of someone's inventory.
     * @param {Discord.Message} message 
     */
    async getInventoryEmbed(message, User, user) {
        message.author = User??message.author

        let titles = ''
        let backgrounds = ''
        let color = ''

        let embed = new Discord.EmbedBuilder()
            .setTimestamp()
            .setColor(this.client.data.embedColor)
            .setTitle(message.author.tag)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setFooter(this.client.data.footer)
            .setAuthor({ name: 'Inventory of:', iconURL: 'https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif' })
            
        for (let i = 0; i < user.inventory.length; i++) {
            const props = user.inventory[i].split('.')
            const type = props[props.length - 2]
            const used = props[props.length - 1] === 'u'

            switch (type) {
                case 'sclr':
                    if (used) 
                        color = `**\`${i + 1}:\`** used color: **\`${props[0].toLowerCase() === 'null' ? 'Default status color' : props[0].toUpperCase()}\`**`
                    //else {   // TODO:
                      //   `Used color: **\`${props[0].toLowerCase() === 'null' ? 'Default status color' : props[0].toUpperCase()}\`**`
                      //  }
                break
                case 'bg':
                    backgrounds += `**\`${i + 1}:\`** **${this.client.config.shop.backgroundNames[props[0]]}**\n${used ? '\`     ⬑ currently used.\`\n' : ''}`
                break
                case 't':
                    titles += `**\`${i + 1}:\`** \`\`\`${this.client.config.shop.profileTitles[props[0]]}\n${props[0]}\n\`\`\`\`${used ? '     ⬑ currently used.\`\n' : ''}`
                break
            }
        }

        embed.addFields([
            color ? { name: 'Color used:', value: color } : null,
            backgrounds? { name: 'Backgrounds:', value: backgrounds } : null,
            titles ? { name: 'Titles:', value: titles } : null,
        ].filter(item => item !== null))

        if (!color && !backgrounds && !titles)
            embed = new Discord.EmbedBuilder()
                .setColor(this.client.data.embedColor)
                .setDescription('**There are no items in this inventory!**')

        return embed
    }

    /**
     * Get a Relaxy economy profile of a user
     * @param {Discord.Message} message 
     * @public
     * @returns {Promise<Discord.EmbedBuilder>}
     */
    async getProfileEmbed(message, args) {
        const user = await this.client.utils.member(message, args, 0)

        if (user)
            message.author = user.user
        
        if (message.author.bot && message.author.id !== this.client.user.id)
            return new Discord.EmbedBuilder().setColor(this.client.data.embedColor).setDescription('Bots don\'t have profiles!')
        
        const User = await this.client.module.database.User(message.author.id)
        const god_text = User.inventory.find(t => t.endsWith('.t.u')) || null
        const [actual_title, color, special_title_addition] = god_text ? god_text.split('.') : []
        
        const nxtLvl = this.client.utils.next_level(User.level)
        const result = await this.client.utils.calculateGlobalRank(message, User)

        let rank = new this.client.imports.canvacord.Rank()
            .setAvatar(message.author.displayAvatarURL({ extension: 'png', size: 4096 }))
            .setCurrentXP(User.exp)
            .setRequiredXP(nxtLvl)
            .setLevel(User.level + 1)
            .setLevelColor('#FF69B4')
            .setRankColor('#FF69B4')
            .setStatus(message.member?.presence ? message.member?.presence?.status : 'offline')
            .setProgressBar('#FF69B4', 'COLOR')
            .setUsername(this.client.utils.norm(message.author.username))
            .setDiscriminator(message.author.tag.slice(-4))
            .setRank(result, result, true)

        let getBg = this.decodeProfileBackgroundStringArray(User.inventory)

        if (getBg !== -1)
            rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${getBg[0][0][0]}.png`)

        let getSclr = this.decodeProfileStatusColorStringArray(User.inventory)

        if (getSclr !== -1)
            rank.setCustomStatusColor(getSclr[0][0][0])

        if (!this.client.imports.fs.existsSync(`./storage/${message.author.id}`))
                this.client.imports.fs.mkdirSync(`./storage/${message.author.id}`)

        const count = this.client.imports.fs.readdirSync(`./storage/${message.author.id}`).length
        return Promise.all([rank.build(), this._calculateRarestAchievement(User)]).then(([result1, result3]) => {
            let WwW = Object.keys(this.client.config.text.achievements)
            let k
            for (let z = 0; z < WwW.length; z++)
                if(result3[0].includes(WwW[z])) k = WwW[z]

            let rarest = this.getAchievement(k)
            let achievements_user_number = result3[1]
            let embed = new Discord.AttachmentBuilder(result1, { name: 'rank.png' })

            return [[new Discord.EmbedBuilder().setColor(this.client.data.embedColor).setAuthor({ name: 'Profile of:', iconURL: 'https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif' }).setThumbnail(message.author.displayAvatarURL({
                dynamic: true,
                size: 4096
            }))
            .setTitle(`**${message.author.tag}**`)
            .setDescription(`${god_text ? `\`\`\`${color}\n${actual_title}\n\`\`\`${special_title_addition ? special_title_addition === 'nnnn' ? '\n' : '' : ''}` : ''}🗓️  Registered at **\`${new Date(User.registeredAt).toString().slice(0, 24)}!\`**    🗓️\n**Sent \`${User.messages}\` messages and \`${User.commands}\` commands since!**\nExperience: **\`${User.exp}\`** 🔆\nMoney: **${User.money > 10000 ? `${User.money > 1000000 ? `\`${User.money}\`    🤑` : `\`${User.money}\`    💰`}` : `\`${User.money}\`    💵`}**\nRep: ${User.reputation.length === 0 ? `**\`${User.reputation.length}\`** 😕` : `**\`${User.reputation.length}\`** 😎` }`)
            .addFields([
                { name: 'Achievements:', value: `**Progress: [${this.client.imports.progressbar.splitBar(ACHIEVEMENT_SIZE, achievements_user_number, ACHIEVEMENT_SIZE, '▬', '⭐')[0]}]  \`${achievements_user_number}\` / \`${ACHIEVEMENT_SIZE}\`**${achievements_user_number !== 0 ? `\n**Latest achievement: \`${this.getAchievement(User.lastAchievement)}\`**\n**Rarest achievement: \`${rarest}\`**` : ``}`},
                { name: 'Opted out of leveling?', value: `${User.levelout ? `Yes!` : `No!`}`, inline: true},
                { name: 'Opted out of dm WM/LM?', value: `${User.dmout ? `Yes!` : `No!`}`, inline: true },
                { name: 'Active reminds:', value: `${User.reminds.length === 0 ? '`0`  💤' : `\`${User.reminds.length}\` ⏰`}`, inline: true },
                { name: 'Inventory size:', value: `**\`${User.inventory.length}\`**`, inline: true },
                { name: 'Files stored:', value: `**${count}** ${count > 0 ? '🗃️' : '📂'}`, inline: true }
            ])
            .setImage('attachment://rank.png')
            .setFooter(this.client.data.footer)
            .setTimestamp()], [embed]]
        })
    }

    /**
     * Encode profile background string.
     * @returns {Array}
     */
    encodeProfileBackgroundString(string) {
        return [string.replaceAll(' ', '.').replace('background', 'bg').replace('unused', 'X').replace('used', 'u'), string.indexOf('used')]
    }

    /**
     * Decode profile background string.
     * @param {String} string 
     */
    decodeProfileBackgroundString(string) {
        return [string.replace('bg', 'background').replace('.u', '.used').replace('.X', '.unused').split('.'), string.indexOf('.u')]
    }
        
    /**
     * Decode profile background string array.
     * @param {Array} array 
     */
    decodeProfileBackgroundStringArray(array) {
        let arr_len = array.length
        if (arr_len === 0) return -1

        for (let i = 0; i < arr_len; i++) {
            if (array[i].indexOf('.u') !== -1 && array[i].indexOf('bg') !== -1)
                return [this.decodeProfileBackgroundString(array[i]), i]
        }

        return -1
    }

    /**
     * Encode profile status color string.
     * @param {String} string 
     */
    encodeProfileStatusColorString(string) {
        return [string.replaceAll(' ', '.').replace('statuscolor', 'sclr').replace('used', 'u').replace('unused', 'X'), string.indexOf('used')]
    }

    /**
     * Decode profile background string.
     * @param {String} string 
     */
    decodeProfileStatusColorString(string) {
        return [string.replace('sclr', 'statuscolor').replace('.u', '.used').replace('.X', '.unused').split('.'), string.indexOf('.u')];
    }

    /**
     * Decode profile background string array.
     * @param {Array} array 
     */
    decodeProfileStatusColorStringArray(array) {
        let i = 0
        let arr_len = array.length
        if (arr_len === 0) return -1

        while (i < arr_len) {
            if (array[i].indexOf('.u') !== -1 && array[i].indexOf('sclr') !== -1)
                return [this.decodeProfileBackgroundString(array[i]), i]
            i++
        }

        return -1
    }
}