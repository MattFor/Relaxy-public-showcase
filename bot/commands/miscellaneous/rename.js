'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'rename',
    usage: '=rename channel/user/role',
    description: 'Give a new name to whatever you want.',
    permissions: ['MANAGE_NICKNAMES', 'MANAGE_CHANNELS', 'MANAGE_ROLES'],
    permissionsBOT: ['MANAGE_NICKNAMES', 'MANAGE_CHANNELS', 'MANAGE_ROLES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let channel = client.utils.channel(message, args, 0)??null
        let member = client.utils.member(message, args, 0)??null
        let role = client.utils.role(message, args, 0)??null
        let rename = ''


        if (member) {
            for (const s of (member.nickname??member.user.username).split(' '))
                args.shift()

            let _f = false
            member.setNickname(args.join(' ')).catch(() => { return _f = true })

            if (_f)
                return new client.class.error('An error has occured while changing the name!', message)

            return client.send(message.channel, `${member} has been renamed to ${rename}!`)
        }

        if (channel) {
            for (const s of channel.name.split(' '))
                args.shift()

            let _f = false
            channel.setName(args.join(' ')).catch(() => { return _f = true })

            if (_f)
                return new client.class.error('An error has occured while changing the name!', message)

            return client.send(message.channel, `${channel} has been renamed to ${rename}!`)
        }

        if (role) {
            for (const s of role.name.split(' '))
                args.shift()

            let _f = false
            role.setName(args.join(' ')).catch(() => { return _f = true })

            if (_f)
                return new client.class.error('An error has occured while changing the name!', message)

            return client.send(message.channel, `${role} has been renamed to ${rename}!`)
        }

        return new client.class.error('Error whatver you searched for doesn\'t exist!', message)
    }
}