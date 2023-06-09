'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'request',
    usage: '=request request',
    args: true,
    description: 'Request a feature to be added to Relaxy! or report a bug.',
    cooldown: 14400,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let flag = false

        let censor_length = client.config.defaultCensoringList.length

        for (let i = 0; i < censor_length; i++)
            if (args.join(' ').includes(client.config.defaultCensoringList[i]))
                flag = true

        let id = Number(client.imports.fs.readFileSync('./bot/configuration/request_number.ini').toString()) + 1

        let request = {
            time: Date.now(),
            number: id,
            shard_id: client.data.id,
            attachment: message.attachments.size > 0 ? message.attachments.first() : '0',
            content: args.join(' ').slice(0, 250),
            author: message.author,
            member: message.member,
            guild: message.guild.name,
            valid: (args.join(' ').length > 0 && args.join(' ').length < 1900 || message.attachments.size > 0) && !flag ? true : false
        }

        if (!request.valid)
            return client.send(message.author, null, [{
                color: client.data.embedColor,
                title: `Hello ${message.author.username}!`,
                description: 'I have received your request, but something went wrong.\nMy automatic validator deemed your request to be invalid in some sort of way.',
                fields: [{
                    name: 'Most common deny reasons:',
                    value: '**- sending a blank message,**\n**- message being too long (limit 1900 characters),**\n**- message containing offensive words.**\n\nThanks for reading, hope you apply again!'
                }],
                footer: client.data.footer,
                thumbnail: {
                    url: 'attachment://response.gif'
                },
            }], [{
                attachment: './additions/images/profile/mail.gif',
                name: 'response.gif'
            }])

        client.imports.fs.writeFileSync('./bot/configuration/request_number.ini', id.toString())

        client.cluster.send({
            type: 'MSG_relaxyRequest',
            request: request
        })

        return new client.class.error(`description Your request [ID: **\`#${id}\`**] has been sent!\nYou're going to get notified when it's accepted/denied.`, message)
    }
}