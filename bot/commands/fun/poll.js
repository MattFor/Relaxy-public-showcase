'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'poll',
    permissions: ['MANAGE_CHANNELS'],
    permissionsBOT: ['ADD_REACTIONS', 'MANAGE_MESSAGES'],
    usage: '=poll title | options | time/emojis',
    description: 'The arguments in =poll need to be separated by **`|`**\n**Title** - can be separated by spaces until the next **`|`**.\n**Options** - list of things people can choose in the poll f.e Yes No.\n**Time** - time in seconds of how long the poll is going to last. (can also put `hours` / `minutes` etc after)\n**Emoji list** - emojis to replace the default 1-10 emojis on the embed.\n\`\`\`fix\nCaveats:\n\`\`\`\nWhen entering options, and you want to include spaces, replace them with **`-`**.\nInstead of options you can also put in time.\nAfter all of that, you\'ll be asked to input a channel, enter an id of mention a channel to end the poll making process. The results will be returned automatically after it ends.\n\n```fix\nExample command:\n```',
    cooldown: 10,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const poll_options = args.join(' ').split('|')

        /**
         * 0 - Title
         * 1 - Options
         * 2 - Time/emojis
         * 3 - Time/emojis
         */

        let title = 'Do you like pancakes?'
        let options = ['Yes', 'No']
        let time = 0
        let emojis = []

        // TITLE SECTION
        if (poll_options[0]) 
            title = client.utils.cleanup(poll_options[0].split(' ')).join(' ')

        // OPTIONS SECTION
        if (poll_options[1]) 
            options = client.utils.cleanup(poll_options[1].split(' '))

        for (let i = 0; i < options.length; i++)
            if (options[i].includes('-')) 
                options[i] = options[i].replaceAll('-', ' ')

        // console.log(poll_options)

        // TIME / EMOJI LIST SECTION - PART 1 
        if (poll_options[2] && client.utils.isValidEmoji(poll_options[2], message).length === 0 && !!poll_options[2].match(/\d+/g))
            time = client.utils.get_time(poll_options[2])
        else if (poll_options[2] && client.utils.isValidEmoji(poll_options[2], message))
            emojis = client.utils.isValidEmoji(poll_options[2], message)

        // console.log(client.utils.isValidEmoji(poll_options[2], message), poll_options[2].match(/\d+/g), client.utils.get_time(poll_options[2]), '\n')

        // TIME / EMOJI LIST SECTION - PART 2 
        if (poll_options[3] && client.utils.isValidEmoji(poll_options[3], message).length === 0 && !!poll_options[3].match(/\d+/g) && time !== 0)
            time = client.utils.get_time(poll_options[3])
        else if (poll_options[3] && client.utils.isValidEmoji(poll_options[3], message))
            emojis = client.utils.isValidEmoji(poll_options[3], message)
        else 
            time = null

        let abort_flag = false
        if (time > 10800000000)
            return new client.class.error('Time too long!', interaction ?? message)

        // console.log(title, options, time, emojis)

        client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: 'In which channel should the poll be in?'
        }]).catch(() => { abort_flag = true })
        .then(m => {
            if (abort_flag) 
                return new client.class.error('Something went wrong!', interaction ?? message)

            m.channel.awaitMessages({ filter: msg => msg.author.id === message.author.id, 
                max: 1,
                time: 3000000,
                errors: ['time']
            }).then(async c => {
                const channel = client.utils.channel(c.first(), c.first().content.split(' '))

                if (!channel) 
                    return new client.class.error('Channel doesn\'t exist!', interaction ?? message)

                if ([Discord.ChannelType.GuildForum, Discord.ChannelType.GuildVoice, Discord.ChannelType.GuildStageVoice, Discord.ChannelType.GuildDirectory, Discord.ChannelType.GuildCategory].includes(channel.type) || 
                    (channel.id === guild.plugins.welcome_message.wmessage_channel ||
                        channel.id === guild.plugins.heart_board.channel_id ||
                        (await client.utils.modlogChannels(guild)).includes(channel.id) ||
                        guild.plugins.clearing_channels.includes(channel.id) ||
                        guild.plugins.restricted_channels.includes(channel.id)) && !client.utils.isExempt(guild, message)) 
                        return new client.class.error('The poll cannot be in that channel!', interaction ?? message)

                new client.class.poll(client, channel, message, title, options, time, emojis)
            }).catch(() => {
                new client.class.error('Timeout! Please enter the command and try again!', interaction ?? message)
            })
        })
    }
}