'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'resume',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=resume',
    description: 'Resumes the currently playing song.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const queue = client.module.music.getQueue(message.guild.id)


        if (!message.member.voice.channel) 
            return new client.class.error('NotConnected', interaction ?? message)

        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (queue ? queue.state === 'recording' : false) 
            return new client.class.error('RecordingA', interaction ?? message)

        if (!queue.paused) 
            return new client.class.error('Cannot resume while not paused!', interaction ?? message)
    
        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)


        queue.setPaused(true)

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: `${client.utils.firstLetterUp(queue.current.title)}`,
            url: `${queue.current.url}`,
            description: `\`\`\`fix\nHas been resumed!\n\`\`\``,
            thumbnail: {
                url: 'attachment://file.gif'
            }
        }], [{
            attachment: queue.current.thumbnail === '' ? './additions/images/mp3.gif' : queue.current.thumbnail,
            name: 'file.gif'
        }])
    }
}