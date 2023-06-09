'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'free',
    cooldown: 10,
    args: true,
    usage: '=free user/all',
    description: 'Remove all of the specified user\s warnings.\nIf first argument is \'all\' then all server warnings will be removed.',
    permissions: ['MANAGE_MESSAGES', 'BAN_MEMBERS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (args[0].toLowerCase() === 'all') {
            client.save(guild.id, { to_change: 'warnings', value: {} })
            return new client.class.error(`${message.guild.name} has been freed of warnings!`, message)
        }

        const member = await client.utils.member(message, args, 0)??null

        if (!member)
            return new client.class.error('Member doesn\'t exist', message)

        if (guild.warnings[member.user.id]) {
            let number1 = args[1] ? client.utils.nums(args[1]) : null
            let number2 = args[2] ? client.utils.nums(args[2]) : null

            let _f = false

            if (args[1] && number1) {
                if (number1 < 1 || number1 > guild.warnings[member.user.id].length)
                    return new client.class.error('There is no warning with that index!', message)
                
                guild.warnings[member.user.id].splice(number1 - 1, 1)
                new client.class.error(`Warning ${number1} removed successfully.`, message)

                _f = true
                if (guild.warnings[member.user.id].length === 0) {
                    delete guild.warnings[member.user.id]
                    _f = false
                }
            } else if (args[1] && args[2] && number1 && number2) {
                if (number1 < 1 || number1 > guild.warnings[member.user.id].length)
                    return new client.class.error('There is no warning with that index!', message)
                
                if (number2 < 0 || number2 > 30)
                    return new client.class.error('Warning tier out of bounds, please choose 0 - 30!', message)

                guild.warnings[member.user.id][number1 - 1] = 
                    typeof guild.warnings[member.user.id][number1 - 1] === 'string' ?
                        { reason: guild.warnings[member.user.id][number1 - 1], type: number2 } : 
                        { reason: guild.warnings[member.user.id][number1 - 1].reason, type: number2 }

                new client.class.error(`Warning ${number2} tier changed successfully.`, message)
                _f = true
            } else {
                delete guild.warnings[member.user.id]
            }           
 
            client.save(guild.id, { to_change: 'warnings', value: guild.warnings })
            return _f ? null : new client.class.error(`${member.user.username} has been freed of warnings!`, message)
        }

        return new client.class.error('This user does not have any warnings', message)
    }
}