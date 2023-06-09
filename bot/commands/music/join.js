'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'join',
    aliases: ['vcjoin', 'summon', 'join'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=join',
    description: 'Makes Relaxy join a voice channel.',
    permissionsBOT: ['CONNECT'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const  queue = client.module.music.getQueue(message.guild.id)


        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)

        if (queue ? queue.state === 'recording' : false) 
            return new client.class.error('RecordingA', interaction ?? message)

        if (queue) 
            return new client.class.error('Already in the voice channel!', interaction ?? message)

        if (!message.member.voice.channel)
            return new client.class.error('You have to be in a voice channel to initiate this command!', interaction ?? message)

            
        try {
            const new_queue = client.module.music.createQueue(message, await client.module.database.Guild(message.guild.id))
            await new_queue.connect(message.member.voice.channel)
            new_queue.setState('idle')
        } catch {
            return new client.class.error('Can\'t connect!', interaction ?? message)
        }
    }
}