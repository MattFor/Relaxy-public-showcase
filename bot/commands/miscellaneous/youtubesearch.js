'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import { YouTube } from 'youtube-sr'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'youtubesearch',
    aliases: ['yts'],
    args: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('video_name').setDescription('Name of what video to search.').setRequired(true)),
    usage: '=youtubesearch song title',
    description: 'Gives back a video url from the keyowrds.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const i = await YouTube.search(args.join(' '))

        if (!i) 
            return new client.class.error('No video found!', interaction ?? message)

        return interaction ? { content: `https://www.youtube.com/watch?v=${i[0].id}` } : client.send(message.channel, `https://www.youtube.com/watch?v=${i[0].id}`)
    }
}