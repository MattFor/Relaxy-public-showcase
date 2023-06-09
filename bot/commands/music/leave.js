'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'leave',
    aliases: ['vcleave', 'leave', 'disconnect', 'dc'],
    cooldown: 5,
    usage: '=leave',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Makes Relaxy leave a voice channel.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const queue = client.module.music.getQueue(message.guild.id)

        if (queue.state === 'recording') {
            new this.client.class.error('Stopped recording, you made me leave!', queue.message)
            return this.client.module.recorder.Halt(queue.message)
        }
            
        return queue.destroy(true)
    }
}