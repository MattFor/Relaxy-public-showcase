'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'song',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    aliases: ['track'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=song',
    description: 'Shows information about the currently playing song.',
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

        const track = queue.nowPlaying()

        let fields = [
            { name: 'Author', value: typeof track.author === 'object' ? `${client.utils.firstLetterUp(track.requestedBy.username)}` : `${client.utils.firstLetterUp(track.author)}`, inline: true },
            { name: 'Requested by', value: `**${track.requestedBy}**`, inline: true },
            { name: 'From playlist?', value: track.fromPlaylist ? 'Yes' : 'No', inline: true },
        ]

        if (track.duration)
            fields.push({ name: 'Progress', value: queue.createProgressBar({ timecodes: true }), inline: true })
        else 
            fields.push({ name: 'Progress', value: typeof track.author === 'object' ? 'Unable to display attachment video length.' : 'Video duration metadata damaged, can\'t display :(' })


        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            author: { name: 'Now playing:', icon_url: client.config.text.links.musicImage },
            title: client.utils.firstLetterUp(track.title),
            url: track.url,
            footer: client.data.footer,
            thumbnail: {
                url: 'attachment://file.gif'
            },
            fields: fields,
            timestamp: new Date(),
        }], [{
            attachment: track.thumbnail === '' ? './additions/images/mp3.gif' : track.thumbnail,
            name: 'file.gif'
        }])
    }
}