'use strict'

import Relaxy from '../../../Relaxy.js'


export default class Poll {

    /**
     * Makes a poll.
     * @param {Relaxy} client 
     * @param {Relaxy.imports.discord.Message} Message 
     * @param {String} Title 
     * @param {Array<String>} Options 
     * @param {Number} Time 
     * @param {Array<String>} EmojiList 
     * @param {String} ForceEndEmoji 
     * @param {Relaxy.imports.discord.Channel} Channel 
     */
    constructor(client, Channel, Message, Title, Options, Time, EmojiList, ForceEndEmoji) {
        // start set
        this.client = client
        this.guildID = Message.guild.id
        this.authorAvatar = Message.author.displayAvatarURL({ dynamic: true, size: 4096 }) ? Message.author.displayAvatarURL({ dynamic: true, size: 4096 }) : client.imports.fs.readFileSync('./additions/r_info/serverImage.r_info').toString()
        this.authorTag = Message.author.tag
        this.authorID = Message.author.id
        this.time = Time ? Time : 30000
        this.channel = Channel
        this.title = Title ? Title : 'Do you like pancakes?'
        this.message = Message
        this.options = Options ? Options : ['Yes', 'No']
        this.emojiList = EmojiList.length > 0 ? EmojiList : client.config.emojiCollections.numbers.slice()
        this.force = ForceEndEmoji ? ForceEndEmoji : '\ud83d\uded1'

        this.replica = this.emojiList

        // to set
        this.emojiNAMES = []
        this.TOOKDOWN = false
        this.TakeDownMessage = {}
        this.TIMECREATE = Date.now()
        this.description = ''
        this.pollID = 0
        this.builtPoll = {}
        this.reactionCollector = {}
        this.usedEmojis = []
        this.voterInfo = new Map()
        this.emojiInfo = {}

        // create
        return this.construct()
    }

    getOptions() {
        for (const option of this.options) {
            let emoji = this.emojiList.shift()
            this.description += `${emoji} : **${this.client.utils.firstLetterUp(option.replaceAll('*', '\*'))}**\n`
            this.emojiInfo[emoji] = { option: option, votes: 0 }
        }
    }

    async buildPoll() {
        this.usedEmojis = Object.keys(this.emojiInfo)
        for (const [key, value] of Object.entries(this.emojiInfo)) {
            if (key.match(/^(:[^:\s]+:|<:[^:\s]+:[0-9]+>|<a:[^:\s]+:[0-9]+>)+$/)) this.replica[key.split(':')[1]] = value
            else this.replica[key] = value
        }
        this.TakeDownMessage.react(this.force)
        this.title = this.client.utils.firstLetterUp(this.title)
        this.builtPoll = await this.client.send(this.channel, `**📊  ${this.title}  \`(${this.client.imports.time(this.time)})\`**`,
            [new this.client.imports.discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setDescription(this.description)]
        )
        this.pollID = this.builtPoll.id
        let used_emoji_length = this.usedEmojis.length
        let i = 0
        let emoji_set_interval = setInterval(() => {
            if (i >= used_emoji_length) {
                clearInterval(emoji_set_interval)
                emoji_set_interval = null
                return this.usedEmojis.forEach(emoji => {
                    if (emoji.match(/^(:[^:\s]+:|<:[^:\s]+:[0-9]+>|<a:[^:\s]+:[0-9]+>)+$/))
                        this.emojiNAMES.push(emoji.split(':')[1])
                    else this.emojiNAMES.push(emoji)
                })
            }
            this.builtPoll.react(this.usedEmojis[i])
            return i++
        }, 755)
    }

    createReactionCollector() {
        this.takedownCollector = this.TakeDownMessage.createReactionCollector({
            filter: async(reaction, user) => (reaction.emoji.name === this.force && !user.bot),
        time: this.time === 0 ? {} : this.time})

        this.reactionCollector = this.builtPoll.createReactionCollector({
            filter: async(reaction, user) => (this.emojiNAMES.includes(reaction.emoji.name) && !user.bot),
        time: this.time === 0 ? {} : this.time })

        this.takedownCollector.on('collect', async(reaction, user) => {
            return this.onCollect(reaction, user, 1)
        })

        this.reactionCollector.on('collect', (reaction, user) => {
            return this.onCollect(reaction, user)
        })

        this.reactionCollector.on('dispose', (reaction, user) => {
            return this.onDispose(reaction, user)
        })

        this.reactionCollector.on('end', () => {
            return this.onEnd()
        })
    }

    async construct() {
        await new this.client.class.error(`description **The vote will end in \`${this.client.imports.time(this.time)}!\`**\n**${this.message.member} can end the poll by reacting with ${this.force}.**`, this.message)
            .then((m) => { this.TakeDownMessage = m })
        this.getOptions()
        this.description = this.description.replaceAll('undefined', '')
        await this.buildPoll()
        return this.createReactionCollector()
    }

    onCollect(reaction, user, type) {
        switch (type) {
            case 1:
                this.TOOKDOWN = user
                return this.reactionCollector.stop()
            default:
                if (this.emojiNAMES.includes(reaction.emoji.name)) {
                    if (!this.voterInfo.has(user.id)) this.voterInfo.set(user.id, { emoji: reaction.emoji.name })
                    const votedEmoji = this.voterInfo.get(user.id).emoji
                    if (votedEmoji !== reaction.emoji.name) {
                        const lastVote = this.builtPoll.reactions.cache.get(votedEmoji)
                        lastVote.count -= 1
                        lastVote.users.remove(user.id)
                        this.replica[votedEmoji].votes -= 1
                        this.voterInfo.set(user.id, { emoji: reaction.emoji.name })
                    }
                    return this.replica[reaction.emoji.name] ? this.replica[reaction.emoji.name].votes += 1 : null
                }
        }
    }

    /**
     * Remove votes saved on reaction removal.
     * @param {Discord.MessageReaction} reaction 
     * @param {Discord.User} user 
     * @returns {Void}
     */
    onDispose(reaction, user) {
        if (this.emojiNAMES.includes(reaction.emoji.name)) {
            this.voterInfo.delete(user.id)
            return this.replica[reaction.emoji.name].votes -= 1
        }
        return
    }

    onEnd() {
        this.description = ''
        for (const emoji in this.replica) try { this.replica[emoji].votes !== undefined ? this.description += `**${this.client.utils.firstLetterUp(this.replica[emoji].option)}** - **\`${this.replica[emoji].votes}\`**\n` : null } catch {}
        this.builtPoll.delete()
        this.TakeDownMessage.delete()
        let text = `**📊  ${this.title} \`(Lasted: ${this.client.imports.time(Date.now() - this.TIMECREATE)})\`**`
        if (this.TOOKDOWN)
            text += `\n**[Ended early by ${this.TOOKDOWN}]**`
        return this.client.send(this.channel, text,
            [new this.client.imports.discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setTitle('Here are the results:')
            .setDescription(`${this.description.slice(0, -3)}**`)]
        )
    }

}