'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'snake',
    usage: '=snake',
    aliases: ['snek'],
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
    description: 'Get to play a game of snake.\nPlease do not spam the reactions. `(refresh time once per 0.5 seconds)`\nEnds when:\n- You drive the snake into itself,\n- Are idle for some time.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        new client.class.snake(client, message, guild)
    }
}