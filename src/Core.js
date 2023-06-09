'use strict'


import Fetch from 'request'
import fixer from 'dirty-json'
import Discord from 'discord.js'
import Relaxy from './Relaxy.js'
import Mongoose from 'mongoose'


const MODE_SPECIAL_NORMAL = -1
const MODE_NORMAL = 0
const MODE_DEBUG = 1
const MODE_MAINTENANCE = 2
const MODE_SILENT = 3
const MODE_OFFLINE = 4

Array.prototype.equals = function(array) {
    if (!array || this.length !== array.length)
        return false

    let l = this.length

    for (var i = 0; i < l; i++)
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false
        } else if (this[i] !== array[i])
            return false

    return true
}

Object.defineProperty(Array.prototype, 'equals', { enumerable: false })


const clear_channel_right = async (channel, cache_size) => {
    let flag = true

    channel.bulkDelete(100).catch(() => {
        return flag = false
    }).then((e) => {
        if (!(flag || e.size === 0))
            return setTimeout(() => {
                return clear_channel_right(channel, (cache_size - 100))
            }, 1000)
    })
}


export default class CoreServices {

    /**
     * Handles all major Relaxy interactions.
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client

        this.EVENTS = Object.keys(client.data.modlogEvents)
    }


    /**
     * Censor a message, apply autoban if the server has it enabled.
     * @param {Discord.Message} message 
     * @returns {Discord.Message | Void}
     */
    Censor(message, guild) {
        // Go back if censoring isn't | enabled message.member.roles.highest.position > message.guild.me.roles.highest.position
        if (!guild.plugins.censoring.enabled || this.client.utils.isExempt(guild, message) || message.author.id === this.client.user.id) 
            return false

        for (var i = 0; i < guild.prefixes.length; i++) 
            if (message.content.includes(`${guild.prefixes[i]}censor`)) 
                return false

        let censored = this.client.utils.censorCheck(message.content.split(' '), guild, true)

        if (censored) {
            this.Autoban(message, guild, guild.plugins.censoring.censorPool[censored[0]])
            message.delete()
            return true
        }

        return false
    }


    /**
     * Level the member if leveling's enabled on the server, always level user.
     * @param {Discord.Message} message 
     * @param {Boolean} isCommand
     * @returns {Promise<Discord.Message | Void>}
     */
    async Leveling(message, isCommand, guild) {
        if (message.content.includes('leveling') && guild.plugins.leveling.enabled)
            return

        const timestamp = this.client.collections.levelingCooldowns.get(message.author.id)
        if (timestamp && Date.now() < timestamp + 500)
            return

        this.client.collections.levelingCooldowns.set(message.author.id, Date.now())
        setTimeout(async () => this.client.collections.levelingCooldowns.delete(message.author.id), 500)

        return Promise.all([this.client.module.database.Member(message.author.id, message.guild.id), this.client.module.database.User(message.author.id)]).then(async ([member, user]) => {

            // If it's a bot (that's not Relaxy) just add it's message count and halt
            if (message.author.bot) {

                user.messages += 1
                user.markModified('messages')

                // If user is Relaxy add to command count.
                if (message.author.id === this.client.user.id) {
                    user.commands += 1
                    user.markModified('commands')
                }

                return user.save()
            }

            // Get leveling and recurrent message status.
            let leveling = guild.plugins.leveling.enabled
            let recurrent_message_member = message.content === member.recurrences
            let recurrent_message_user = message.content === user.recurrences

            // Add 1 message to the guild total.
            this.client.save(message.guild.id, {
                to_change: 'messages',
                value: ++guild.messages
            })

            // If it's not a recurrent message, update the current recurrent message.
            if (!recurrent_message_member) {
                member.recurrences = message.content
                member.markModified('recurrences')
            }

            if (!recurrent_message_user) {
                user.recurrences = message.content
                user.markModified('recurrences')
            }

            /*
             * If leveling is enabled on the guild and 
             * the message isn't a repeat, add random experience
             * to the member, always add to user.
             */

            let experience_count = Math.floor(Math.random() * 14 + 5)

            if (message.attachments.size === 0) {

                if (leveling && !recurrent_message_member)
                    member.exp += experience_count

                if (!recurrent_message_user)
                    user.exp += experience_count
            } else {

                experience_count += 10

                if (leveling && !recurrent_message_member)
                    member.exp += experience_count

                if (!recurrent_message_user)
                    user.exp += experience_count
            }

            // If the message includes a command.
            if (isCommand) {

                // Add xp to the user and add 1 to the total command count of the member user and guild.
                member.exp += 10
                user.exp += 10

                user.commands += 1
                member.commands += 1
            }

            user.messages += 1
            member.messages += 1

            user.markModified('exp')
            member.markModified('exp')

            user.markModified('commands')
            member.markModified('commands')

            user.markModified('messages')
            member.markModified('messages')

            let next_lvl_required_exp = this.client.utils.next_level(user.level)
            let cumulative_experience_to_deduct = 0

            while (user.exp >= next_lvl_required_exp) {

                // Add every new level to the xp cut
                cumulative_experience_to_deduct += next_lvl_required_exp

                user.level += 1
                next_lvl_required_exp = this.client.utils.next_level(user.level)
            }

            Promise.all([member.save(), user.save()]).then(async () => {

                next_lvl_required_exp = this.client.utils.next_level(member.level)

                if (leveling && member.exp >= next_lvl_required_exp) {

                    cumulative_experience_to_deduct = 0

                    // Constantly up the level until it's too low to update further.
                    while (member.exp >= next_lvl_required_exp) {

                        // Add every new level to the xp cut
                        cumulative_experience_to_deduct += next_lvl_required_exp

                        member.level += 1
                        next_lvl_required_exp = this.client.utils.next_level(member.level)
                    }

                    member.exp = (member.exp - cumulative_experience_to_deduct)

                    if (member.exp < 0)
                        member.exp = 0

                    member.markModified('exp')
                    member.markModified('level')

                    Promise.all([this.client.module.database.findGuildMembers(message.guild.id), member.save()]).then(([guild_member_database_fetch]) => {

                        const member_guild_rank = this.client.module.profiles._calculateGuildRank(guild_member_database_fetch, member)

                        const rank = new this.client.imports.canvacord.Rank().setAvatar(message.member.displayAvatarURL({
                                extension: 'png',
                                size: 4096
                            }))
                            .setCurrentXP(member.exp).setRequiredXP(next_lvl_required_exp).setLevel(member.level + 1).setLevelColor('#FF69B4').setRank(member_guild_rank, member_guild_rank, true).setRankColor('#FF69B4').setStatus(message.member.presence ? message.member.presence.status : 'offline')
                            .setProgressBar('#FF69B4', 'COLOR').setUsername(this.client.utils.norm(message.member.user.username)).setDiscriminator(message.member.user.tag.slice(-4))

                        // Decode background image string
                        let background = this.client.module.profiles.decodeProfileBackgroundStringArray(user.inventory)

                        if (background !== -1)
                            rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${background[0][0][0]}.png`)

                        // Decode status color string
                        let custom_color = this.client.module.profiles.decodeProfileStatusColorStringArray(user.inventory)

                        if (custom_color !== -1)
                            rank.setCustomStatusColor(custom_color[0][0][0])

                        Promise.all([rank.build(), member.save()]).then(([buffer]) => {

                            // Handle the levelup achievement
                            this.client.module.profiles.Achievement(message, 'lvldup', guild)

                            let lvl_up_embed = null
                            let lvl_up_message = null

                            if ([1, 3].includes(guild.plugins.leveling.type))
                                lvl_up_embed = new Discord.AttachmentBuilder(buffer, { name: 'level_up.png' })

                            if ([1, 2].includes(guild.plugins.leveling.type))
                                lvl_up_message = `Congrats ${message.member} you've reached level **${member.level + 1}!**`

                            if (lvl_up_embed || lvl_up_message) {
                                if (guild.plugins.leveling.channel)
                                    return this.client.send(this.client.channels.cache.get(guild.plugins.leveling.channel), lvl_up_message, null, [lvl_up_embed]).catch(() => {
                                        return this.client.save(guild.id, {
                                            to_change: 'plugins.leveling',
                                            value: {
                                                enabled: false,
                                                type: 0,
                                                channel: ''
                                            }
                                        })
                                    })

                                return this.client.send(message.channel, lvl_up_message, null, [lvl_up_embed]).catch(() => {
                                    return this.client.save(guild.id, {
                                        to_change: 'plugins.leveling',
                                        value: {
                                            enabled: false,
                                            type: 0,
                                            channel: ''
                                        }
                                    })
                                })
                            }

                            return null
                        })
                    })
                }
            })
        })
    }


    /**
     * Clear the channels where it's enabled.
     */
    ClearingChannels() {
        return setInterval(async () => {
            let channels = 0
            let messages = 0
            
            const Guilds = await this.client.module.database.getGuilds({
                $expr: { $gt: [{ $size: { $ifNull: ["$plugins.clearing_channels", []] } }, 0] }
            })
        
            for (const Guild of Guilds) {
                if (Guild.plugins.clearing_channels.length === 0) 
                    continue
        
                for (const Channel of Guild.plugins.clearing_channels) {
                    const channel = this.client.channels.cache.get(Channel);
            
                    if (!channel) 
                        continue
            
                    messages += channel.messages.cache.size;
                    channels += 1;
            
                    clear_channel_right(channel, channel.messages.cache.size);
                }
            }

            if (messages > 0)
                return this.client.log(`Cleared ${messages} messages on ${channels} channels.`);
        }, 3 * 60 * 1000)
    }


    /**
     * Censor the message sent in lockdown mode.
     * @param {Discord.Message} message 
     * @returns {Discord.Message | Void}
     */
    LockdownMessage(message, guild) {
        if (guild.lockeddown && message.author.id !== message.guild.ownerId) 
            return message.delete()
    }


    /**
     * If a message includes a command, handle it here.
     * @param {Discord.Message} message 
     * @param {Array<String>} args
     * @param {String} commandName
     * @param {Object} cmd
     * @returns {Promise | Void}
     */
    async Message(message, args, commandName, cmd, guild) {    
        this.client.save(message.guild.id, {
            to_change: 'messages',
            value: (guild.messages + 1)
        })

        const command = this.client.collections.commands.get(commandName) || this.client.collections.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
        
        const userExempt = this.client.utils.isExempt(guild, message)

        if ([Discord.ChannelType.PublicThread, Discord.ChannelType.PrivateThread].includes(message.channel.type) && !userExempt)
            return

        if (guild.disabedcommands.includes(commandName) && !userExempt) 
            return new this.client.class.error(`${commandName} has been disabled on this server!`, message)

        if (command.undergoingchange)
            new this.client.class.error(`${commandName} is currently undergoing changes, it is unstable if used!`, message)

        if (!userExempt && (command.leaveout || !command))
            return

        if (!userExempt && (command.nsfw && !message.channel.nsfw)) 
            return this.client.send(message.channel, null, [{
                color: this.client.data.embedColor,
                description: `${message.member}, the **${command.name}** command can only be used in nsfw enabled channels!`
            }])

        let command_exception_flag = this.client.config.text.perm_command_exceptions.includes(command.name)
        let permissions_flag = message.author.id !== this.client.config.keys.owner ? this.client.checkPermissions(message, command.permissions, command.permissionsBOT, command_exception_flag ? 1 : false, command_exception_flag ? message.member.voice.channel : null, userExempt) : { bot: false, user: false }

        if (permissions_flag.bot || (!userExempt && permissions_flag.user)) 
            return

        if (command.args && !args.length) 
            return new this.client.class.error('You provided no arguments!', message)

        this.client.save(message.guild.id, {
            to_change: 'commands',
            value: ++guild.commands
        })

        if (!this.client.collections.cooldowns.has(command.name)) 
            this.client.collections.cooldowns.set(command.name, new Discord.Collection())
        
        const timestamps = this.client.collections.cooldowns.get(command.name)
        const cooldownAmount = (command.cooldown || 3) * 1000
        if ((timestamps.has(message.author.id) && !userExempt) && 
        (Date.now() < timestamps.get(message.author.id) + cooldownAmount) && message.author.id !== this.client.config.keys.owner) 
            return this.client.send(message.channel, null, [{
                color: this.client.data.embedColor,
                description: `${message.member}, Please wait **${this.client.imports.time(this.client.collections.cooldowns.get(command.name).get(message.author.id)?cooldownAmount-(new Date()-this.client.collections.cooldowns.get(command.name).get(message.author.id)):0)}** before using \`${commandName}\` again!`
            }])

        timestamps.set(message.author.id, Date.now())
        setTimeout(async () => timestamps.delete(message.author.id), cooldownAmount)

        return cmd.run(this.client, message, args, guild).catch(e => console.log(e))
    }

    /**
     * If someone doesn't have a preset role give it to them immediately
     * @param {Discord.GuildMember} member 
     * @param {Mongoose.Document} guild 
     */
    autoRole(member, guild) {
        for (let i = 0; i < guild.plugins.autoroles.length; i++)
            if (!member.roles.cache.has(guild.plugins.autoroles[i]))
                member.roles.add(member.guild.roles.cache.get(guild.plugins.autoroles[i])).catch(() => {})
    }

    /**
     * Ban someone if the number of warning exceeds the number of tolerable ones 
     * decided by the autoban level of the server.
     * @param {Discord.Message} message 
     * @param {Mongoose.Document} guild
     * @returns {Discord.Message}
     */
    async Autoban(message, guild, word) {
        if (guild.plugins.censoring.autobanning <= 0 ||
            message.member.permissions.has(Discord.PermissionFlagsBits['Administrator']) ||
            message.member.permissions.has(Discord.PermissionFlagsBits['BanMembers']) || message.author.id === this.client.config.keys.owner ||
            message.author.id === message.guild.ownerId || this.client.utils.isExempt(guild, message)) return

        let limit = guild.plugins.censoring.autobanning
        let warns = guild.warnings

        if (!warns[message.author.id])
            warns[message.author.id] = []
        
        let maxThreat = Math.max(
            ...Object.values(guild.warnings)
            .flat()
            .filter(warn => typeof warn === 'object' && warn.author === this.client.user.id)
            .map(warn => warn.tier)
        )

        if (maxThreat < 3)
            maxThreat = 3

        warns[message.author.id].push({ reason: `Saying a censored word. [${word}]`, tier: maxThreat, author: this.client.user.id, tag: message.author.tag })

        this.client.save(message.guild.id, {
            to_change: 'warnings',
            value: warns
        })

        let threat = 0
        for (const warn of warns[message.author.id])
            if (typeof warn === 'string' || typeof warn === 'object' && threat >= Math.ceil(maxThreat / 2) || typeof warn === 'object' && warn.author === this.client.user.id && warn.tier !== -1)
                threat++

        let max_threat_local = 0
        for (const warn of warns[message.author.id]) {
            if (typeof warn === 'object' && warn.tier > max_threat_local)
                max_threat_local = warn.tier
            if (typeof warn === 'string')
                max_threat_local = 3
        }

        let embed = new Discord.EmbedBuilder()
			.setColor(this.client.data.embedColor)
			.setTitle(`Warned ${message.member.nickname ? `${message.member.nickname}#${message.member.user.discriminator}` : `${message.member.user.username}#${message.member.user.discriminator}`}`)
			.addFields([
				{ name: 'By:', value: `**${this.client.user}**` },
				{ name: 'Reason:', value: `Saying a censored word. [${word}]` },
				{ name: 'Tier:', value: `Warning tier: **\`(${maxThreat}/${maxThreat})\`**` }, 
				{ name: 'Additional:', value: `**${message.member}** **\`(${guild.warnings[message.member.user.id].length})\`** **\`[${threat}/${limit}]\`** **\`{${max_threat_local}/${limit}}\`**` }
			])
			.setThumbnail(message.member.displayAvatarURL({
				dynamic: true,
				size: 4096
			}))
			.setFooter({ text: 'Event emitted', iconURL: this.client.config.text.links.relaxyImage })
			.setTimestamp()


		if (guild.plugins.modlog.enabled)
			this.client.data.modlog_posts[guild.id].push(['warning', embed])

        if (threat < limit) {
            return this.client.send(this.client.channels.cache.get(guild.plugins.censoring.channel)??message.channel, `${message.member}, you have received a warning for saying a censored word. **(${threat}/${limit})**`)
        } else {
            for (let i = 0; i < warn_len; i++)
                warns[message.author.id][i] = typeof warns[message.author.id][i] === 'string' ? { reason: warns[message.author.id][i], tier: -1, author: 'Unavailable', tag: 'Unavailable' } : { reason: warns[message.author.id][i].reason, tier: -1, author: warns[message.author.id][i].author, tag: warns[message.author.id][i].tag }

            await this.client.save(message.guild.id, {
                to_change: 'warnings',
                value: warns
            })

            await message.member.ban({ reason: 'Exceeding the Relaxy warn limit.' })

            if (guild.plugins.censoring.channel)
                try {
                    return this.client.send(this.client.channels.cache.get(guild.plugins.censoring.channel), `${message.member} has been banned. **[Case: #${guild.caseCount}]**`)
                } catch {
                    this.client.save(message.guild.id, {
                        to_change: 'plugins.censoring.channel',
                        value: ''
                    })
                }

            return this.client.send(message.channel, `${message.author} has been banned. **[Case: #${guild.caseCount + 1}]**`)
        }
    }


    /**
     * @param {Discord.VoiceState} newMember
     * @returns {Discord.VoiceChannel | Void}
     */
    async LockdownVoice(newMember, guild) {
        if (!newMember || !newMember.channelID || !newMember.guild.members.resolve(this.client.user.id).permissions.has(Discord.PermissionFlagsBits['MoveMembers']) || !guild.lockeddown) return
            return await this.client.getMember(newMember.guild, newMember.id).voice.setChannel(null)
    }


    /**
     * @param {Discord.Guild} guild
     * @returns {Discord.Message}
     */
    async joinNewGuild(guild) {
        if (this.client.data.id === 0)
            this.client.clog(`${guild.name} - \`${guild.id}\``, 'JOINED GUILD', 'good')
        
        await this.client.newGuild(guild)
        
        const messageData = {
            color: this.client.data.embedColor,
            author: {
            name: 'Thanks for getting Relaxy on your server!',
            icon_url: 'https://media.tenor.com/images/822fb670841c6f6582fefbb82e338a50/tenor.gif'
            },
            description: this.client.imports.fs.readFileSync('./bot/configuration/server_join.ini', 'utf8'),
            footer: this.client.data.footer,
            timestamp: new Date()
        }
        
        const acceptableChannelNames = ['general', 'chat', 'general-chat', 'gaming', 'memes', 'main', 'main-chat', 'ogólny', 'ogolny', 'chat-general', 'lounge', 'degeneral']
        
        const channels = guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT')
        const channelToSend = channels.find(channel => acceptableChannelNames.includes(channel.name))
        
        if (channelToSend)
            this.client.send(channelToSend, null, [messageData])
        
        const owner = await this.client.users.fetch(guild.ownerId, { cache: false, limit: 1 })
        return this.client.send(owner, null, [messageData])
    }


    /**
     * @param {Discord.Member} member
     * @param {Mongoose.Document} guild
     * @returns {Discord.Member | Void}
     */
    async LockdownJoin(member, guild) {
        const isAdmin = member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)
        const canBanMembers = member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers)
        const isException = guild.plugins.person_exceptions.includes(member.user.id)
        const isLockedDown = guild.lockeddown
        
        if (isAdmin || canBanMembers || isException || !isLockedDown)
            return
        
        member.ban()
    }


    /**
     * Clear channels every 3 minutes, start operation.
     */
    async Status() {
        setTimeout(() => {
            switch (this.client.data.status) {
                case MODE_NORMAL:
                    return Promise.all([this.client.utils.getUserCount(), this.client.utils.getServerCount()]).then(([users, guilds]) => {
                        let status = this.client.config.text.clientStatus.toString().split('//')[0].replace('{|G|}', guilds).replace('{|U|}', users)
                        return this.client.setActivity(status, this.client.config.text.clientStatus.toString().split('//')[1])
                    })
                case MODE_DEBUG:
                    return this.client.setActivity('DEBUG MODE', 'PLAYING')
                case MODE_MAINTENANCE:
                    return this.client.setActivity('MAINTENANCE MODE', 'PLAYING')
                case MODE_OFFLINE:
                    this.client.config.emojiCache = []

                    this.client.cluster.send({
                        type: 'REQ_updateConfig',
                        config: this.client.config
                    })

                    return this.client.setActivity('SHUTTING DOWN', 'WATCHING')
            }

            this.client.log('Status set.')
        }, 4000)

        return setInterval(async () => {
            return new Promise(async() => {
                if (!this.client.data.refreshStatus)
                    return

                this.client.log('Status set.', 'DATA')

                switch (this.client.data.status) {
                    case MODE_NORMAL:
                        return Promise.all([this.client.utils.getUserCount(), this.client.utils.getServerCount()]).then(([users, guilds]) => {
                            let status = this.client.config.text.clientStatus.toString().split('//')[0].replace('{|G|}', guilds).replace('{|U|}', users)
    
                            return this.client.setActivity(status, this.client.config.text.clientStatus.toString().split('//')[1])
                        })
                    case MODE_DEBUG:
                        return this.client.setActivity('DEBUG MODE', 'PLAYING')
                    case MODE_MAINTENANCE:
                        return this.client.setActivity('MAINTENANCE MODE', 'PLAYING')
                    case MODE_OFFLINE:
                        this.client.config.emojiCache = []
    
                        this.client.cluster.send({
                            type: 'REQ_updateConfig',
                            config: this.client.config
                        })
    
                        return this.client.setActivity('SHUTTING DOWN', 'WATCHING')
                }
            })
        }, 60 * 1000)
    }


    /**
     * Give someone a role according to the emoji specified in the guild Document.
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     * @returns {Discord.Role | Void}
     */
    async ReactionAdd(reaction, user, guild, type) {
        try {
            switch (type) {
                case 1:
                    var member = reaction.message.guild.members.resolve(user.id)

                    if (user.bot || !member) return

                    var Rmessage = guild.reaction_role_messages.find(r => r.id === reaction.message.id)

                    var flag = false

                    let _z = Rmessage.roles.length

                    for (let i = 0; i < _z; i++)
                        if (Rmessage.emojis[i].includes(reaction.emoji.name)) _z = i

                    var roles1 = Object.keys(guild.restrictors1)
                    var roles2 = Object.keys(guild.restrictors2)
                    var roles3 = Object.keys(guild.restrictors3)
                    var roles4 = Object.keys(guild.restrictors4)

                    let _a = roles1.length
                    let guild_restrictors2_length = roles2.length
                    let _c = roles3.length
                    let _d = roles4.length

                    // 1
                    for (let i = 0; i < _a; i++) {
                        if (flag) return

                        guild.restrictors1[roles1[i]].forEach(async r => {
                            if (Rmessage.roles[_z] == roles1[i] && reaction.message.guild.members.resolve(user).roles.cache.has(r) && !this.client.utils.isExempt(guild, reaction.message)) {
                                flag = true
                                return reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                            }
                        })
                    }

                    // 2
                    for (let i = 0; i < guild_restrictors2_length; i++) {
                        if (flag) return

                        guild.restrictors2[roles2[i]].forEach(async r => {
                            if (Rmessage.roles[_z] == r && !reaction.message.guild.members.resolve(user).roles.cache.has(roles2[i]) && !this.client.utils.isExempt(guild, reaction.message)) {
                                flag = true

                                try {
                                    reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                    return reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                } catch {}
                            }
                        })
                    }

                    // 3
                    for (let i = 0; i < _c; i++) {
                        if (flag) return

                        guild.restrictors3[roles3[i]].forEach(async r => {
                            if (Rmessage.roles[_z] == roles3[i] && !reaction.message.guild.members.resolve(user).roles.cache.has(r) && !this.client.utils.isExempt(guild, reaction.message)) {
                                flag = true

                                try {
                                    reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                    return reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                } catch {}
                            }
                        })
                    }

                    // 4
                    for (let i = 0; i < _d; i++) {
                        if (flag) 
                            return

                        guild.restrictors4[roles4[i]].forEach(async r => {
                            if (Rmessage.roles[_z] == roles4[i] && reaction.message.guild.members.resolve(user).roles.cache.has(r) && !this.client.utils.isExempt(guild, reaction.message)) {
                                flag = true

                                try {
                                    reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                    return reaction.message.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).users.remove(user.id)
                                } catch {}
                            }
                        })
                    }

                    return reaction.message.guild.members.resolve(user).roles.add(reaction.message.guild.roles.cache.find(role => role.id === Rmessage.roles[_z]))
                default:
                    if (!reaction || !user || !guild.plugins.welcome_message.enabled || reaction.message.id !== guild.plugins.welcome_message.wmessage_id || user.bot || reaction.message.channel.type === this.client.imports.discord.ChannelType.DM || !guild.plugins.welcome_message.roles) return
                        return reaction.message.guild.members.resolve(user).roles.add(reaction.message.guild.roles.cache.find(role => role.id === guild.plugins.welcome_message.role_roles[guild.plugins.welcome_message.role_emojis.indexOf(reaction.emoji.name)]))
            }
        } catch {}
    }


    /**
     * Remove someone's role according to the emoji specified in the guild Document.
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     * @returns {Discord.Role | Void}
     */
    async ReactionRemove(reaction, user, guild, type) {
        try {
            switch (type) {
                case 1:
                    try {
                        var member = reaction.message.guild.members.resolve(user.id)

                        if (user.bot || !member) 
                            return

                        let reaction_role_message = guild.reaction_role_messages.find(r => r.id === reaction.message.id), 
                            emoji_index = null, guild_restrictors2 = Object.keys(guild.restrictors2), guild_restrictors2_length = guild_restrictors2.length
                        
                        for (let i = 0; i < reaction_role_message.roles.length; i++)
                            if (reaction_role_message.emojis[i].includes(reaction.emoji.name))
                                emoji_index = i

                        for (let i = 0; i < guild_restrictors2_length; i++)
                            if (reaction_role_message.roles[emoji_index] == guild_restrictors2[i])
                                guild.restrictors2[guild_restrictors2[i]].forEach(async role => {
                                    if (member.roles.cache.has(role)) {
                                        member.roles.remove(role)

                                        guild.reaction_role_messages.forEach(async message => {
                                            this.client.channels.cache.get(message.channel).messages.fetch(message.id, { cache: false, limit: 1  }).then(Message => {
                                                if (!Message) return

                                                try {
                                                    Message.reactions.cache.forEach(async reaction => {
                                                        if (reaction_role_message.emojis[emoji_index].includes(reaction.emoji.name))
                                                            return Message.reactions.cache.find(W => W.emoji.name === reaction.emoji.name).users.remove(user.id)
                                                    })
                                                } catch {}
                                            })
                                        })
                                    }
                                })

                        return  member.roles.remove(reaction.message.guild.roles.cache.find(role => role.id === reaction_role_message.roles[emoji_index]))
                    } catch {}
                    default:
                        if (!reaction || !user || !guild.plugins.welcome_message.enabled || reaction.message.id !== guild.plugins.welcome_message.wmessage_id || (user.bot || reaction.message.channel.type === this.client.imports.discord.ChannelType.DM || !guild.plugins.welcome_message.roles)) return
                            return reaction.message.guild.members.resolve(user).roles.remove(reaction.message.guild.roles.cache.find(role => role.id === guild.plugins.welcome_message.role_roles[guild.plugins.welcome_message.role_emojis.indexOf(reaction.emoji.name)]))
            }
        } catch {}
    }


    /**
     * Give someone a role according to the emoji specified in the guild Document.
     * @param {Discord.Message} message
     * @returns {Void}
     */
    ReactionRoles(message, guild, type) {
        try {
            switch (type) {
                case 1: {
                    let reaction_role_message = guild.reaction_role_messages.find(r => r.id === message.id),
                        reaction_emoji_length = reaction_role_message.emojis.length

                    for (let i = 0; i < reaction_emoji_length; i++)
                        message.react(reaction_role_message.emojis[i])
                }
                break
            default: {
                    let temp_array = []

                    message.reactions.cache.forEach(reaction => temp_array.push(reaction.emoji.name))

                    if (temp_array.equals(guild.plugins.welcome_message.role_emojis)) return

                    let reaction_emoji_length = guild.plugins.welcome_message.role_emojis.length

                    for (let i = 0; i < reaction_emoji_length; i++)
                        message.react(guild.plugins.welcome_message.role_emojis[i])

                    this.client.log('Reaction roles applied!', 'DATA')
                }
            }
        } catch {}
    }


    /**
     * Roll the welcome message boards into effect, startup function.
     */
    WelcomeMessage() {
        return setInterval(async() => {
            new Promise(async() => {
                let f = false
                let Guilds = await this.client.module.database.getGuilds({ 'plugins.welcome_message.enabled': true })

                if (f)
                    return

                Guilds.forEach((Guild) => {
                    if (!Guild.plugins.welcome_message.enabled) 
                        return

                    return new Promise(async () => {
                        const channel = await this.client.channels.fetch(Guild.plugins.welcome_message.wmessage_channel).catch(() => { return null })

                        if (!channel || channel === undefined)
                            return this.client.save(Guild.id, {
                                to_change: 'plugins.welcome_message',
                                value: {
                                    enabled: false,
                                    wmessage: '',
                                    wmessage_id: '',
                                    wmessage_channel: '',
                                    status_message_id: '',
                                    roles: false,
                                    role_emojis: [],
                                    role_roles: []
                                }
                            })

                        Promise.all([channel.messages.fetch(Guild.plugins.welcome_message.wmessage_id, { cache: false, limit: 1  }), channel.messages.fetch(Guild.plugins.welcome_message.status_message_id, { cache: false, limit: 1  })]).then(async ([wmsg, wstatus]) => {

                            const status = this.client.config.text.wmStatus.replace('XXX', this.client.config.keys.version)

                            let welcome_message_string = Guild.plugins.welcome_message.wmessage.split('[SPLIT_FLAG]')

                            if (welcome_message_string[0] === 'NULL(0)')
                                welcome_message_string[0] = null

                            if (welcome_message_string[1]) {

                                welcome_message_string[1] = JSON.parse(welcome_message_string[1])

                                try {
                                    welcome_message_string[1] = fixer.parse(JSON.stringify(welcome_message_string[1]).replaceAll('botver', this.client.config.keys.version))
                                } catch {}
                            } else welcome_message_string[1] = null

                            let flag = false

                            if (!wmsg || !wstatus) {
                                await channel.bulkDelete(100)

                                this.client.send(channel, welcome_message_string[0], welcome_message_string[1] ? [welcome_message_string[1]] : []).catch(() => {
                                    return flag = true
                                }).then(async (message) => {
                                    if (flag) 
                                        return 

                                    this.client.save(Guild.id, {
                                        to_change: 'plugins.welcome_message.wmessage_id',
                                        value: message.id
                                    })

                                    if (Guild.plugins.welcome_message.roles)
                                        return this.ReactionRoles(message, Guild, 2)
                                })

                                return this.client.send(channel, null, [{
                                    color: this.client.data.embedColor,
                                    description: status
                                }]).then(async message => {
                                    return this.client.save(Guild.id, {
                                        to_change: 'plugins.welcome_message.status_message_id',
                                        value: message.id
                                    })
                                })
                            }

                            if (wmsg.content !== welcome_message_string[0] || (wmsg.embeds[0] && (JSON.stringify(wmsg.embeds[0]) !== JSON.stringify(welcome_message_string[1])))) {
                                if (wmsg.embeds[0] && wmsg.embeds[0].type && wmsg.embeds[0].type === 'rich') {
                                    let copy = wmsg.embeds[0]
                                    copy.footer.text = `Relaxy! version botver made by MattFor#9884`

                                    this.client.save(Guild.id, {
                                        to_change: 'plugins.welcome_message.wmessage',                                 
                                        value: `${welcome_message_string[0] ? welcome_message_string[0] : 'NULL(0)'}[SPLIT_FLAG]${JSON.stringify(welcome_message_string[1])}`    // Copy??
                                    })

                                    this.client.edit(wmsg, welcome_message_string[0], welcome_message_string[1] ? [welcome_message_string[1]] : [])
                                } else {
                                    let new_embed = new this.client.imports.discord.EmbedBuilder(welcome_message_string[1])

                                    this.client.save(Guild.id, {
                                        to_change: 'plugins.welcome_message.wmessage',                                 
                                        value: `${welcome_message_string[0] ? welcome_message_string[0] : 'NULL(0)'}[SPLIT_FLAG]${JSON.stringify(new_embed)}`    // Copy??
                                    })

                                    this.client.edit(wmsg, welcome_message_string[0], welcome_message_string[1] ? [new_embed] : [])
                                }
                            }

                            if (Guild.plugins.welcome_message.roles)
                                this.ReactionRoles(wmsg, Guild, 2)

                            if (!wstatus.embeds[0] || wstatus.embeds[0].description !== status || wstatus.content !== '') 
                                return this.client.edit(wstatus, null, [{
                                    color: this.client.data.embedColor,
                                    description: status
                                }])
                        })
                    })
                })

                return this.client.log('Checked welcome messages!', 'DATA')
            })
        }, 60 * 1000)
    }


    /**
     * Handle someone giving a reaction to a post/heartboard embed.
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     * @param {String} type
     * @returns {Void | Discord.MessageReaction | Mongoose.Document}
     */
    async HeartBoard(reaction, user, Type, guild) {
        if (!reaction || !user) 
            return

        let message = reaction.message

        if (!message || !message.content && !message.attachments.size > 0)
            try {
                message = await message.channel.messages.fetch(message.id, { cache: false, limit: 1  })
            } catch {
                return
            }

        if (!message.author || (!guild.plugins.heart_board.enabled || user.bot || reaction.emoji.name !== '❤️') ||
            guild.plugins.welcome_message.enabled && guild.plugins.welcome_message.wmessage_channel == message.channel.id) return

        const hbp = message.embeds[0] && message.author.id === '775358898088968202' && (message.embeds[0].footer ? message.embeds[0].footer.text ? message.embeds[0].footer.text.includes('ID:') : false : false) ?
            await this.client.module.database.HeartBoard(true, message.embeds[0].footer.text.split(' ')[1]) :
            await this.client.module.database.HeartBoard(false, message.id)

        const type = guild.plugins.heart_board.type

        if (!type)
            await this.client.save(message.guild.id, {
                to_change: 'plugins.heart_board.type',
                value: 3
            })

        switch (Type) {
            case 'messageReactionAdd':
                if (message.id == hbp.embed_id) {
                    if (hbp.original_reacts.includes(user.id)) {
                        hbp.excludes.push(user.id)
                        hbp.markModified('excludes')
                        await hbp.save()
                        return message.reactions.cache.get('❤️').users.remove(user.id)
                    }

                    hbp.likes += 1
                    hbp.embed_reacts.push(user.id)
                    hbp.markModified('embed_reacts')
                    hbp.markModified('likes')
                    await hbp.save()

                    return this.client.edit(message, message.content.replace(this.client.utils.nums(message.content), hbp.likes).replace(
                        hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d9*/ ? '❤️' :
                        hbp.likes >= (type * 2) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💓' :
                        hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💖' :
                        hbp.likes >= (type * 10) /*d30*/ ? '💞' : '❤️',
                        hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d6*/ ? '💓' :
                        hbp.likes >= (type * 3) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💖' :
                        hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💞' :
                        hbp.likes >= (type * 10) /*d30*/ ? '💗' : '❤️'
                    ), [message.embeds[0]])
                }

                if (hbp.original_id == message.id) {
                    if (hbp.embed_id.length > 2)
                        if (hbp.embed_reacts.includes(user.id)) {
                            hbp.excludes.push(user.id)
                            hbp.markModified('excludes')
                            await hbp.save()
                            return message.reactions.cache.get('❤️').users.remove(user.id)
                        } else {
                            hbp.likes += 1
                            hbp.original_reacts.push(user.id)
                            hbp.markModified('original_reacts')
                            hbp.markModified('likes')
                            await hbp.save()

                            return  this.client.channels.cache.get(guild.plugins.heart_board.channel_id).messages.fetch(hbp.embed_id).then(async (msg) => {
                                return this.client.edit(msg, msg.content.replace(this.client.utils.nums(msg.content), hbp.likes).replace(
                                    hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d9*/ ? '❤️' :
                                    hbp.likes >= (type * 2) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💓' :
                                    hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💖' :
                                    hbp.likes >= (type * 10) /*d30*/ ? '💞' : '❤️',
                                    hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d6*/ ? '💓' :
                                    hbp.likes >= (type * 3) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💖' :
                                    hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💞' :
                                    hbp.likes >= (type * 10) /*d30*/ ? '💗' : '❤️'), [msg.embeds[0]]).catch(() => {})
                            })
                        }
                }

                hbp.channelID = message.channel.id
                hbp.guildID = guild.id
                hbp.markModified('channelID')
                hbp.markModified('guildID')

                if (hbp.likes === 0 && message.reactions.cache.get('❤️').count > 1) {
                    await message.reactions.resolve('❤️').users.fetch()
                        .then(users => {
                            users.forEach(User => {
                                hbp.likes += 1
                                hbp.original_reacts.push(User.id)
                            })
                        })

                } else {
                    hbp.likes += 1
                    hbp.original_reacts.push(user.id)
                }

                hbp.markModified('original_reacts')
                hbp.markModified('likes')
                await hbp.save()

                if (hbp.likes >= type)
                    return this.client.send(this.client.channels.cache.get(guild.plugins.heart_board.channel_id), 
                        `**❤️ ${hbp.likes} |  ${message.channel}**`, 
                        [this.client.class.heartboardpost(message)]
                    ).then(async msg => {
                        hbp.embed_id = msg.id
                        hbp.markModified('embed_id')

                        msg.react('❤️')

                        this.client.module.profiles.Achievement(message, 'got_heart', guild)

                        return  hbp.save()
                    })

                return
            case 'messageReactionRemove':

                if (hbp.excludes.includes(user.id)) {

                    let excludes_length = hbp.excludes.length

                    for (let i = 0; i < excludes_length; i++)
                        if (hbp.excludes[i] == user.id) hbp.excludes.splice(hbp.excludes.indexOf(hbp.excludes[i], 1))

                    hbp.markModified('excludes')
                    return  hbp.save()
                }

                // Embed case
                if (message.embeds[0] && message.id === hbp.embed_id) {

                    hbp.likes -= 1

                    let embed_reacts_length = hbp.embed_reacts.length

                    for (let i = 0; i < embed_reacts_length; i++)
                        if (hbp.embed_reacts[i] === user.id) hbp.embed_reacts.splice(hbp.embed_reacts.indexOf(hbp.embed_reacts[i], 1))

                    hbp.markModified('likes')
                    hbp.markModified('embed_reacts')
                    await hbp.save()

                    if (hbp.likes <= 0) {
                        await this.client.module.database.deleteHeartBoardPost(hbp.original_id)
                        return message.delete()
                    }

                    return this.client.edit(message,
                        message.content.replace(this.client.utils.nums(message.content), hbp.likes).replace(
                            hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d9*/ ? '❤️' :
                            hbp.likes >= (type * 2) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💓' :
                            hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💖' :
                            hbp.likes >= (type * 10) /*d30*/ ? '💞' : '❤️',
                            hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d6*/ ? '💓' :
                            hbp.likes >= (type * 3) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💖' :
                            hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💞' :
                            hbp.likes >= (type * 10) /*d30*/ ? '💗' : '❤️'), [message.embeds[0]])
                }

                if (hbp.original_id === message.id) {

                    hbp.likes -= 1

                    let original_reacts_length = hbp.original_reacts.length

                    for (let i = 0; i < original_reacts_length; i++)
                        if (hbp.original_reacts[i] === user.id) hbp.original_reacts.splice(hbp.original_reacts.indexOf(hbp.original_reacts[i], 1))

                    hbp.markModified('likes')
                    hbp.markModified('original_reacts')
                    await hbp.save()

                    if (hbp.embed_id === '') 
                        return

                    return  this.client.channels.cache.get(guild.plugins.heart_board.channel_id)
                        .messages.fetch(hbp.embed_id, { cache: false, limit: 1  }).then(async (msg) => {
                            if (hbp.likes <= 0) 
                                return msg.delete()

                            return this.client.edit(msg,
                                msg.content.replace(this.client.utils.nums(msg.content), hbp.likes)
                                .replace(
                                    hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d9*/ ? '❤️' :
                                    hbp.likes >= (type * 2) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💓' :
                                    hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💖' :
                                    hbp.likes >= (type * 10) /*d30*/ ? '💞' : '❤️',
                                    hbp.likes >= (type * 2) /*d6*/ && hbp.likes < (type * 3) /*d6*/ ? '💓' :
                                    hbp.likes >= (type * 3) /*d9*/ && hbp.likes < Math.ceil(type * 5.7) /*d17*/ ? '💖' :
                                    hbp.likes >= Math.ceil(type * 5.7) /*d17*/ && hbp.likes < (type * 10) /*d30*/ ? '💞' :
                                    hbp.likes >= (type * 10) /*d30*/ ? '💗' : '❤️'), [msg.embeds[0]])
                        })
                }
        }
    }


    /**
     * Handles reminding people.
     */
    Reminds() {
        setInterval(async() => {
            new Promise(async() => {
                let f = false
                let Users = await this.client.module.database.getUsers({$expr:{$gt:[{$size:{ $ifNull: [ "$reminds", [] ] }}, 0]}}).catch(() => f = true)

                if (f) 
                    return

                Users.forEach(async User => {
                    let reminds_length = User.reminds.length
                    if (reminds_length === 0) 
                        return

                    for (let i = 0; i < reminds_length; i++) {
                        
                        let reminder = User.reminds[i].split('_')
                        let time = Number(reminder[0])
                        let message = reminder[1]

                        if (time - Date.now() <= 0) {

                            User.reminds.splice(i, 1)
                            User.markModified('reminds')
                            
                            User.save().then(async() => {
                                let TIME_PASSED = time - Date.now()

                                _a.push(1)

                                let user = await this.client.users.fetch(User.id)

                                this.client.send(user, `Hey ${user}, here's your reminder! ${TIME_PASSED <= -150000 ? `(Overdue **\`${this.client.imports.time(Number(`${TIME_PASSED}`.slice(1, TIME_PASSED.length)))}\`** due to Relaxy downtime)` : ''}`, [{
                                    color: this.client.data.embedColor,
                                    description: `**${message}**`,
                                }])
                            })
                        }
                    }
                })
            })
        }, 10000)
    }


    /**
     * Handle unmuting all recorded mutes on all servers.
     */
    Mutes() {
        let _a = []

        return setInterval(async() => {
            return new Promise(async() => {
                let f = false
                let Guilds = await this.client.module.database.getGuilds({$expr:{$gt:[{$size:{ $ifNull: [ "$mutes", [] ] }}, 0]}}).catch(() => f = true)

                if (f) 
                    return

                Guilds.forEach(async Guild => {
                    let mute_length = Guild.mutes.length

                    const guild = await this.client.guilds.fetch(Guild.id)

                    if (!guild) 
                        return

                    for (let i = 0; i < mute_length; i++) {
                        let thisMute = Guild.mutes[i]
                        if (thisMute) {

                            let message = thisMute.split('_')
                            let Time = Number(message[0])

                            if (Time - Date.now() <= 0) {
                                let mute_member = await this.client.getMember(guild, message[1])

                                if (!mute_member) {
                                    Guild.mutes.splice(i, 1)

                                    return this.client.save(Guild.id, {
                                        to_change: 'mutes',
                                        value: Guild.mutes
                                    })
                                }

                                if (mute_member.roles.cache.get(Guild.mute_id)) {
                                    mute_member.roles.set(message[4].split('+')).catch(() => {})
                                    Guild.mutes.splice(i, 1)

                                    this.client.save(Guild.id, {
                                        to_change: 'mutes',
                                        value: Guild.mutes
                                    })

                                    mute_member.roles.remove(Guild.mute_id)
                                    _a.push(1)

                                    let mute_author = await this.client.getMember(guild, message[3])

                                    if (Guild.plugins.modlog.enabled)
                                        return this.client.send(this.client.channels.cache.get(Guild.plugins.modlog.events.memberUnmuted.channel), null, [new Discord.EmbedBuilder()
                                            .setColor(65280)
                                            .setThumbnail(mute_member.user.displayAvatarURL({
                                                dynamic: true,
                                                size: 4096
                                            }))
                                            .setTitle('**Event |** `User unmuted`')
                                            .addFields([
                                                { name: 'User:', value: `${mute_member}`, inline: true },
                                                { name: 'User ID:', value: `\`${mute_member.user.id}\``, inline: true },
                                                { name: 'Mute time:', value: `\`${this.client.imports.time(Number(message[2]))}\``},
                                                { name: 'Muted by:', value: `${mute_author} [unmute timeout reached]`}
                                            ])
                                            .setFooter({ text: 'Event emitted', iconURL: this.client.config.text.links.relaxyImage })
                                            .setTimestamp()
                                        ])

                                    return this.client.send(this.client.channels.cache.get(message[5]), null, [new Discord.EmbedBuilder()
                                        .setColor(65280)
                                        .setThumbnail(mute_member.user.displayAvatarURL({
                                            dynamic: true,
                                            size: 4096
                                        }))
                                        .setTitle('**Event |** `User unmuted`')
                                        .addFields([
                                            { name: 'User:', value: `${mute_member}`, inline: true },
                                            { name: 'User ID:', value: `\`${mute_member.user.id}\``, inline: true },
                                            { name: 'Mute time:', value: `\`${this.client.imports.time(Number(message[2]))}\``},
                                            { name: 'Muted by:', value: `${mute_author} [unmute timeout reached]`}
                                        ])
                                        .setFooter({ text: 'Event emitted', iconURL: this.client.config.text.links.relaxyImage })
                                        .setTimestamp()
                                    ])
                                }
                            }
                        }
                    }
                })

                setTimeout(() => {
                    if (_a.length > 0) {
                        this.client.log(`Completed ${_a.length} unmutes.`, 'DATA')
                        return _a = []
                    }
                }, 100)
            })
        }, 5 * 1000)
    }


    Modlogs() {
        setInterval(async () => {
            return new Promise(async() => {
                let f = false
                let Guilds = await this.client.module.database.getGuilds({ 'plugins.modlog.enabled': true })

                if (f)
                    return

                    Guilds.forEach(async Guild => {
                    if (this.client.data.modlog_posts[Guild.id] && this.client.data.modlog_posts[Guild.id].length !== 0) {
                        let W = this.client.data.modlog_posts[Guild.id].shift()

                        for (const part of Object.entries(Guild.plugins.modlog.events))
                            if (this.EVENTS.includes(part[0]) && part[0] === W[0]) {
                                if (Guild.plugins.modlog.events[part[0]].enabled)
                                    if (this.client.channels.cache.get(Guild.plugins.modlog.events[part[0]].channel)) {
                                        this.client.send(this.client.channels.cache.get(Guild.plugins.modlog.events[part[0]].channel), null, [W[1]], W[2]??null)
                                    } else this.client.save(Guild.id, {
                                        to_change: `plugins.modlog.events.${part[0]}`,
                                        value: {
                                            enabled: false,
                                            channel: ''
                                        }
                                    })
                            }
                    }
                })
            })
        }, 2500)

        setInterval(async () => {
            return new Promise(async() => {
                let f = false
                let Guilds = await this.client.module.database.getGuilds({ 'welcome_channel.enabled': true })

                if (f)
                    return

                Guilds.forEach(async Guild => {
                    if (this.client.data.entrance_messages[Guild.id] && this.client.data.entrance_messages[Guild.id].length !== 0) {
                        let _a = this.client.data.entrance_messages[Guild.id].shift()

                        switch (_a[0]) {
                            case 'welcome':
                                if (this.client.channels.cache.get(Guild.welcome_channel.channelWELCOME))
                                    return this.client.send(this.client.channels.cache.get(Guild.welcome_channel.channelWELCOME), _a[1][0], _a[1][1], _a[1][2])
                                else 
                                    return this.client.save(Guild.id, {
                                        to_change: 'welcome_channel.channelWELCOME',
                                        value: ''
                                    })
                            case 'leave':
                                if (this.client.channels.cache.get(Guild.welcome_channel.channelLEAVE))
                                    return this.client.send(this.client.channels.cache.get(Guild.welcome_channel.channelLEAVE), _a[1][0], _a[1][1], _a[1][2])
                                else 
                                    return this.client.save(Guild.id, {
                                        to_change: 'welcome_channel.channelLEAVE',
                                        value: ''
                                    })
                        }
                    }
                })
            })
        }, 10000)
    }

    /**
     * Get the forum post and accept / deny it.
     * @param {Discord.MessageReaction} reaction 
     */
    async ForumPost(reaction, user) {
        if (user.id === this.client.user.id)
            return

        let forum = await this.client.getForum(reaction.message.channel.parentId, reaction.message.guild.id)

        if (!forum)
            return

        try {
            if (reaction.message.channel.appliedTags.includes(forum.approved_tag))
                return
        } catch {}

        let start = await this.client.getMessage(reaction.message.channel, null, true)
        let member = await this.client.getMember(reaction.message.guild, user.id)

        if (reaction.message.id !== start.id)
            return

        let approved_user = false
        for (let i = 0; i < forum.roles.length; i++)
            if (member.roles.cache.has(forum.roles[i]))
                approved_user = true

        if (!approved_user && !member.permissions.has(this.client.imports.discord.PermissionFlagsBits.Administrator))
            return reaction.message.reactions.cache.get(reaction.emoji.name) ? await reaction.message.reactions.cache.get(reaction.emoji.name).users.remove(user.id).catch(() => {}) : null

        const Guild = await this.client.module.database.Guild(reaction.message.guild.id)

        if (reaction.emoji.name === forum.emoji) {
            if (forum.responses.accept.length > 1)
                this.client.send(reaction.message.author, forum.responses.accept.replaceAll('|U|', reaction.message.author).replaceAll('|T|', reaction.message.channel.name).replaceAll('|G|', reaction.message.guild.name))
            
            if (Guild.plugins.modlog?.events?.other?.enabled)
                this.client.data.modlog_posts[reaction.message.guild.id].push(['other', new this.client.class.modlog({
                    color: 'good',
                    event: 'Forum post accepted',
                    description: `${reaction.message.channel} (${reaction.message.channel.name})\nHas been accepted by ${user} ${user.tag}`,
                    thumbnail: reaction.message.guild.iconURL({ dynamic: true, size: 4096 })
                })])

            let promises = [
                reaction.message.reactions.removeAll(),
                reaction.message.react(reaction.message.channel.parent.defaultReactionEmoji??'✅'),
                reaction.message.channel.setArchived(false)
            ]

            let i = 0
            let interval = setInterval(async () => {
                if (i === promises.length - 1) {
                    clearInterval(interval)

                    if (!reaction.message.channel.parent.availableTags.find(t => t.id === forum.approved_tag)) {
                        await reaction.message.channel.parent.setAvailableTags([{ name: 'Pending approval', moderated: true, emoji: '🗃️' }, { name: 'Approved', moderated: true, emoji: '🗃️' }])
                        forum.pending_tag = reaction.message.channel.parent.availableTags.find(t => t.name === 'Pending approval').id
                        forum.approved_tag = reaction.message.channel.parent.availableTags.find(t => t.name === 'Approved').id
                        forum.markModified('pending_tag')
                        forum.markModified('approved_tag')
                        await forum.save()
                    }

                    let tags = reaction.message.channel.appliedTags
                    tags.splice(tags.indexOf(forum.pending_tag), 1)
                    tags.push(forum.approved_tag)

                    return reaction.message.channel.setAppliedTags(tags)
                }

                await promises[i]
                i++
            }, 1500)
            return
        }

        if (reaction.emoji.name === '❌') {
            let channel_name = reaction.message.channel.name
            let author = reaction.message.author
            let guild_name = reaction.message.guild.name

            if (Guild.plugins.modlog?.events?.other?.enabled)
                this.client.data.modlog_posts[reaction.message.guild.id].push(['other', new this.client.class.modlog({
                    color: 'bad',
                    event: 'Forum post denied',
                    description: `${reaction.message.channel} (${reaction.message.channel.name})\nHas been denied by ${user} ${user.tag}`,
                    thumbnail: reaction.message.guild.iconURL({ dynamic: true, size: 4096 })
                })])

            await reaction.message.channel.delete()

            if (forum.promptModerator) {
                let m = await this.client.send(user, 'Write why the post has been denied, if I do not get a reply in 3 minutes I will automatically send a response to the thread author.')

                return setTimeout(async () => {
                    let channel = await user.createDM()
                    if (!channel)
                        return

                    let message = await channel.messages.fetch({ limit: 2, cache: false, around: m.id })

                    if (!message)
                        return

                    message = message.first()

                    if (message.author.bot) {
                        if (forum.responses.reject.length > 0) {
                            this.client.send(author, forum.responses.reject.replaceAll('|U|', author).replaceAll('|T|', channel_name).replaceAll('|G|', guild_name).slice(0, 2048))
                            return this.client.send(user, `Automatic response for **${channel_name}** sent successfully.`)
                        }
                        return
                    }

                    this.client.send(author, `Rejection response for **|T|:**\n${message.content}`.replaceAll('|U|', author).replaceAll('|T|', channel_name).replaceAll('|G|', guild_name).slice(0, 2048)).catch(() => {})
                    return this.client.send(user, `Response for **${channel_name}** sent successfully.`)
                }, 3 * 60 * 1000)
            }

            return forum.responses.reject.length > 0 ?
            this.client.send(author, forum.responses.reject.replaceAll('|U|', author).replaceAll('|T|', channel_name).replaceAll('|G|', guild_name))
            : null
        }

        return reaction.message.reactions.cache.get(reaction.emoji.name).users.remove(user.id)
    }

    /**
     * Handle a message in a review channel.
     * @param {Discord.Message} message 
     */
    async ForumPostMessage(message, guild) {
        let forum = await this.client.getForum(message.channel.parentId, message.guild.id)

        if (!forum || message.channel.appliedTags.includes(forum.approved_tag))
            return 0 

        let start = await this.client.getMessage(message.channel, null, true)

        if (start.id === message.id || !start.reactions.cache.find(r => r.me))
            return 0

        let no_role = true

        message.member.roles.cache.forEach(role => {
            if (forum.roles.includes(role.id))
                no_role = false
        })

        if (no_role && message.author.id !== start.author.id && !forum.roles.includes(message.author.id) && !this.client.utils.isExempt(guild, message)) {
            await message.delete()
        }

        return await message.channel.setArchived(true)
    }

    RaidPrevention() {
        setInterval(async () => {
            const Guilds = await this.client.module.database.getGuilds({ 'plugins.raid.enabled': true })

            for (const Guild of Guilds) {
                // Not enough suspicious users to enable raid protection, terminate execution
                if (!this.client.data.raid_prevention[Guild.id].length >= Guild.plugins.raid.threshhold && !Guild.plugins.raid.on)
                    return

                // Turn on RAID prevention mode
                this.client.save(Guild.id, { to_change: 'plugins.raid.on', value: true })

                const guild = (await this.client.guilds.fetch(Guild.id)).catch(() => {}) ?? null

                if (!guild)
                    return

                // Cache all of the users suspected of being bots
                const suspicious_users = (await guild.members.fetch({ user: this.client.data.raid_prevention[Guild.id] })).catch(() => {}) ?? null

                if (!suspicious_users || suspicious_users.size === 0)
                    return

                await new Promise(resolve => {
                    let users_to_resolve = 0
                    const resolving_users = setInterval(async () => {
                        if (users_to_resolve <= 0) {
                            clearInterval(resolving_users)
                            return resolve()
                        }

                        const suspected_user = suspicious_users.at(users_to_resolve - 1)

                        // Fetch the suspected user's database profile
                        // Then get the last channel id he participated in
                        // After that nuke all of his messages
                        const member = await this.client.module.database.Member(suspected_user.user.id, guild.id)
                        try {
                            const marked_channel = await guild.channels.fetch(member.last_message_channel_id)
                            const messages = await marked_channel.messages.fetch({ limit: 100 })
                            const messages_to_delete = messages.filter((msg) => msg.author.id === suspected_user.user.id)
                            await marked_channel.bulkDelete(messages_to_delete)
                        } catch {}

                        suspicious_users.at(suspected_user)
                                            
                        
                        // Deal with the user according to the chosen option
                        if (Guild.plugins.raid.ban)
                            suspicious_users.at(suspected_user).ban({ reason: 'Suspected of raiding.' }).catch(() => {})
                        else 
                            suspicious_users.at(suspected_user).kick({ reason: 'Suspected of raiding.' }).catch(() => {})

                        users_to_resolve--
                    }, 2500)
                })
            }
        }, 1000 * 5)
    }

    /**
     * Cache an image so that it can be used later.
     * @param {Discord.Message} message 
     */
    async cacheImage(message) {
        const attachment = message.attachments.first()

        if (!attachment || !attachment.contentType.includes('image'))
            return

        if (!this.client.imports.fs.existsSync(`./storage/${message.author.id}`))
            this.client.imports.fs.mkdirSync(`./storage/${message.author.id}`)

        Fetch(attachment.url)
            .pipe(this.client.imports.fs.createWriteStream(
                `./storage/${message.author.id}/${message.id}`
            ))
        
        setTimeout(() => 
            this.client.imports.fs.unlinkSync(
                `./storage/${message.author.id}/${message.id}`,
                () => {} // Do nothing on error
            )
        , 5 * 60 * 60 * 1000)
    }
}