'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'files',
    aliases: ['fs'],
    description: 'Get a list of all of your files saved with =save. Use =erase (file) after calling the command to delete a desired file.',
    cooldown: 2,
    usage: '=files',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (!client.imports.fs.existsSync(`./storage/${message.author.id}`))
            return new client.class.error('You don\'t have any files saved!', interaction ?? message)

        let internal_files = []
        let files = []
        let count = 0

        for (const file of client.imports.fs.readdirSync(`./storage/${message.author.id}`)) {
            internal_files.push(file)
            files.push(`\`${count+1}.\`  ▬  **${file}**`)
            count++
        }

        if (files === [])
            return new client.class.error('You don\'t have any files saved!', interaction ?? message)

        let m = await client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: `You have \`${count}\` files!`,
            description: files.join('\n'),
            thumbnail: {
                url: message.author.displayAvatarURL({ dynamic: true, size: 4096 })
            },
            footer: client.data.footer
        }])

        return m.channel.awaitMessages({ filter: async msg => msg.author.id === message.author.id, 
            max: 1,
            time: 3000000,
            errors: ['time']
        }).then(async collected => {
            let args = collected.first().content.split(' ')
            switch (args.shift()) {
                case '=erase':
                    if (internal_files.includes(args[0]))
                        unlink(`./storage/${message.author.id}/${args[0]}`, err => {
                            if (err) return new client.class.error('Something went wrong while deleting the file!', interaction ?? message)
                            return new client.class.error(`${client.utils.firstLetterUp(args[0])} has been deleted!`, message)
                        })
                    else return new client.class.error('You don\'t have any files with that designation saved!', interaction ?? message)
                default:
                    return
            }
        })
    }
}