'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'disconnect',
    permissions: ['MOVE_MEMBERS'],
    permissionsBOT: ['MOVE_MEMBERS'],
    cooldown: 5,
    args: true,
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('User to disconnect from a voice channel.').setRequired(true)),
    usage: '=disconnect user',
    description: 'Disconnect someone from their voice channel.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let member = await client.utils.member(message, args, 0)

        if (!member)
            return new client.class.error('No user specified to throw!', interaction ?? message)

        if (!member.voice.channel)
            return new client.class.error('Specified user outside of a voice channel!', interaction ?? message)

        return member.voice.setChannel(null).catch(() => {
            return new client.class.error('Cannot throw this user!', interaction ?? message)
        })
    }
}