'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'remindme',
    cooldown: 4,
    aliases: ['remind'],
    args: true,
    slash: new Discord.SlashCommandBuilder()
        .addStringOption(option => option.setName('time').setDescription('Amount of time after which you will be notified.').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('Message that you will be sent.').setRequired(true)),
    usage: '=remindme 1 [minute / hour / day / week / month / year] about [thing]',
    description: 'Relaxy will remind you about the thing you requested after the specified amount of time.',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return new client.class.error('Temporarily disabled due to database overload. Will be fixed soon.', interaction ?? message)
        const user = await client.module.database.User(message.author.id)

        if (user.reminds.length >= 24)
            return new client.class.error('You can\'t have any more reminds! (max 23)', interaction ?? message)

        if (interaction) {
            let time = client.utils.get_time(args[0])

            if (!time)
                return new client.class.error('Invalid time formatting!', interaction ?? message)
    
            if (time > 315360000000)
                return new client.class.error('Maximum remind time is 10 years!', interaction ?? message)
    
            args.shift()
            args = args.slice(0, 250)
    
            time = Date.now() + time
    
            user.reminds.push(`${time}_${args}`)
            user.markModified('reminds')
            await user.save()
    
            return new client.class.error(`description You will be reminded in **\`${client.imports.time(time+100 - Date.now())}\`** about:\n**${args}.**`, interaction ?? message)
        }
            return new client.class.error('You can\'t have any more reminds! (max 23)', interaction ?? message)

        let remind_string

        try {
            remind_string = client.utils.cleanup(args.join(' ').split('about'))
        } catch {
            return new client.class.error('No \'about\' keyword, invalid formatting!', interaction ?? message)
        }

        if (!remind_string[1])
            return new client.class.error('No \'about\' keyword, invalid formatting!', interaction ?? message)

        let time = client.utils.get_time(remind_string[0])

        if (!time)
            return new client.class.error('Invalid time formatting!', interaction ?? message)

        if (time > 315360000000)
            return new client.class.error('Maximum remind time is 10 years!', interaction ?? message)

        remind_string.shift()
        remind_string = remind_string.join('about').slice(1, 250)

        time = Date.now() + time

        user.reminds.push(`${time}_${remind_string}`)
        user.markModified('reminds')
        await user.save()

        return new client.class.error(`description You will be reminded in **\`${client.imports.time(time+100 - Date.now())}\`** about:\n**${remind_string}.**`, interaction ?? message)
    }
}