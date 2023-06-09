'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'profile',
    usage: '=profile',
    description: 'View your Relaxy profile.',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const profileEmbed = await client.module.profiles.getProfileEmbed(message, args)
        client.send(message.channel, null, profileEmbed[0], profileEmbed[1])
    }
}