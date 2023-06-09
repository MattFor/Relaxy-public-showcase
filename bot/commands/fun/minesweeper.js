'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'minesweeper',
    usage: '=minesweeper rows columns mine_count classic_start',
    slash: new Discord.SlashCommandBuilder(),
    description_slash: 'Play a game of minesweeper.',
    description: 'Play a game of minesweeper!\nDefault options:\n- 9 rows,\n- 9 columns,\n- 25 mines,\n- doesn\'t show first cell,\nClassic start reveals the first cell when starting the game.',
    aliases: ['mine'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let settings = {
            rows: 9,
            columns: 9,
            mines: 25,
            spaces: false,
            revealFirstCell: false,
        }

        if (!isNaN(args[0]))
            settings.rows = Number(args[0])

        if (!isNaN(args[1]))
            settings.columns = Number(args[1])

        if (settings.rows + settings.columns > 29)
            return new client.class.error('The collective number of rows and columns has to be 29 or less!', interaction ?? message)

        if (!isNaN(args[2]))
            settings.mines = Number(args[2])

        if (!isNaN(args[2]) > settings.columns * settings.rows)
            return new client.class.error('The number of mines is too big!', interaction ?? message)

        if (args[3])
            if (args[3].toLowerCase() === 'yes')
                settings.revealFirstCell = true

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: 'Minesweeper!',
            description: new client.class.minesweeper(settings).start()
        }])
    }
}