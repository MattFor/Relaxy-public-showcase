'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'reminds',
    cooldown: 4,
    usage: '=reminds',
    description: 'Show all of your active Relaxy reminds! If you want to remove a remind type =erase (remind number from the list).',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        const user = await client.module.database.User(message.author.id)

        if (!user.reminds.length > 0)
            return new client.class.error('You have no active reminds!', interaction ?? message)

        let reminds = new Discord.EmbedBuilder().setColor(client.data.embedColor).setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 4096 }))

        reminds.setTitle(`${message.author.username}'s reminds:`)

        let reminds_length = user.reminds.length

        for (let i = 0; i < reminds_length; i++) {
            let remind = user.reminds[i].split('_')
            reminds.addFields([{ name: `\`${i+1}\`. - In ${client.imports.time(Number(remind[0]) - Date.now())}:`, value: remind[1].slice(0, 250) }])
        }

        return client.send(message.author, null, [reminds]).catch(e => { return flag = true }).then(async m => {
            if (flag) return

            m.channel.awaitMessages({ filter: async msg => msg.author.id === message.author.id, 
                max: 1,
                time: 3000000,
                errors: ['time']
            })
            .then(async collected => {
                let args = collected.first().content.split(' ')
                switch (args.shift()) {
                    case '=erase':
                        if (isNaN(args[0]) || (args[0] - 1) < 0 || (args[0] - 1) > user.reminds.length)
                            return new client.class.error('Number given is invalid!', interaction ?? message)
                        else {
                            user.reminds.splice((args[0] - 1), 1)
                            user.markModified('reminds')
                            await user.save()
                            return new client.class.error(`Remind number ${args[0]} has been successfully removed!`, message)
                        }
                    default:
                        return
                }
            })
        })
    }
}