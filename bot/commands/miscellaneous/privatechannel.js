'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'privatechannel',
    description: 'Create a channel with a (Default 2) person limit.\nWhen people join that chat they are given the ability to edit the number of people who can join and the kbps value. You do that by just saying =privatechannel personlimit kbps. Relaxy will autodetect the channel you\'re in and edit it as requested.\nWhen everyone leaves it will reset back to the default value provided.\n\nWhen trying to edit a channel simply # it at the end of the command to edit it.\n**To delete a private channel:**\nEither delete it yourself normally through discord or type =privatechannel channel.\n```diff\n- warning-\n```When selecting the channel name when editing, when it has spaces replace them with `-`.\nF.e when wanting to edit #Private 1, type Private-1\n\nREQUIRED PERMISSION TO CREATE CHANNELS: `MANAGE_CHANNELS`',
    permissionsBOT: ['MANAGE_CHANNELS'],
    usage: '=privatechannel person_limit_number kbps_value channel(Only when editing existing private channels)',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let _b1 = guild.privates.length
        for (let i = 0; i < _b1; i++)
            if (message.member.voice && message.member.voice.channel && guild.privates[i].id === message.member.voice.channel.id) {
                let person_limit = client.utils.nums(args[0])
                let kbps_limit = client.utils.nums(args[1]) * 1000
                let _f = false
                return message.member.voice.channel.edit({
                    bitrate: kbps_limit ? kbps_limit : guild.privates[i].kbps_limit,
                    userLimit: person_limit ? person_limit : guild.privates[i].person_limit
                }).catch(() => { _f = true; return new client.class.error('Unable to edit permissions, error!', interaction ?? message) }).then(() => {
                    if (_f) return
                    return new client.class.error(`description **Permissions successfully edited for ${message.member.voice.channel}!**\nBitrate: \`${ kbps_limit ? kbps_limit : guild.privates[i].kbps_limit}\`\nUser limit: \`${person_limit ? person_limit : guild.privates[i].person_limit}\``, message)
                })
            }

        if (!message.member.permissions.has(Discord.PermissionFlagsBits['ManageChannels'])) 
            return new client.class.error('Missing permission to create private channel!', interaction ?? message)

        let _a = client.utils.channel(message, args)

        if (_a) {
            for (let i = 0; i < _b1; i++)
                if (guild.privates[i].id === _a.id) {
                    guild.privates = guild.privates.splice(i, 1)
                    client.save(guild.id, { to_change: 'privates', value: guild.privates })
                    return new client.class.error(`description **${_a} has been removed from Relaxy private channels!**`, message)
                }
            return new client.class.error('No channel like that found in the Relaxy private channels database!', interaction ?? message)
        }

        let person_limit = client.utils.nums(args[0]) || 2

        let kbps_limit = client.utils.nums(args[1]) * 1000 || 64000
        let _b = client.utils.channel(message, args, 1)

        if (_b) {
            for (let i = 0; i < _b1; i++)
                if (guild.privates[i].id === _b.id) {
                    let _f = false
                    let _z = false
                    guild.privates[i] = {
                        id: _b.id,
                        person_limit: person_limit,
                        kbps_limit: guild.privates[i].kbps_limit
                    }
                    client.channels.cache.get(_b.id).edit({
                        userLimit: guild.privates[i].person_limit,
                        bitrate: guild.privates[i].kbps_limit
                    }).catch(() => { _f = true; return new client.class.error('Error changing actual channel permissions!', interaction ?? message) }).then(() => {
                        if (_f) return new client.class.error('No channel like that found in the Relaxy private channels database!', interaction ?? message)
                        client.save(guild.id, { to_change: 'privates', value: guild.privates })
                        _z = true
                        return new client.class.error(`description **${_b} has been updated!**`, message)
                    })
                    if (_z) return
                }
            return
        }

        let _c = client.utils.channel(message, args, 2)

        try {
            if (!_c)
                _c = message.guild.channels.cache.find(u => u.name.includes(args[2].replaceAll('-', ' '))) || null
        } catch {}

        if (!_c) {
            let _f = false
            return client.guilds.cache.get(guild.id).channels.create({ 
                name: `Private ${_b1+1}`,
                type: client.imports.discord.ChannelType.GuildVoice, userLimit: person_limit, bitrate: kbps_limit 
            }).catch((e) => {
                _f = true;
                if (e.message)
                    if (e.message.toLowerCase().includes('missing')) return new client.class.error('Missing permissions!!! Error creating channel, aborting!', interaction ?? message);
                return new client.class.error('Error creating channel, aborting!', interaction ?? message)
            }).then(async(channel) => {
                if (_f) return
                guild.privates.push({
                    id: channel.id,
                    person_limit: person_limit,
                    kbps_limit: kbps_limit
                })
                channel.permissionOverwrites.create(message.guild.roles.everyone, {
                    'ManageChannels': false
                })
                client.save(guild.id, { to_change: 'privates', value: guild.privates })
                return new client.class.error(`description **${channel} has been added to Relaxy's private channel list!**`, message)
            })
        }

        for (let i = 0; i < _b1; i++)
            if (guild.privates[i].id === _c.id) {
                let _z = false
                let _f = false
                guild.privates[i] = {
                    id: _c.id,
                    person_limit: person_limit,
                    kbps_limit: kbps_limit
                }
                client.channels.cache.get(_c.id).edit({
                    userLimit: person_limit,
                    bitrate: kbps_limit
                }).catch(() => { _f = true; return new client.class.error('Error changing actual channel permissions!', interaction ?? message) }).then(() => {
                    if (_f) return new client.class.error('No channel like that found in the Relaxy private channels database!', interaction ?? message)
                    client.save(guild.id, { to_change: 'privates', value: guild.privates })
                    _z = true
                    return new client.class.error(`description **${_c} has been updated!**`, message)
                })
                if (_z) return
            }
    }
}