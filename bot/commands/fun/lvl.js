'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'lvl',
    cooldown: 4,
    usage: '=lvl user(optional)',
    description: 'Gives back a card of your or the usered level and rank (level wise) on the current server.\nWorks only if =leveling is enabled.',
    aliases: ['level'],
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const guildMembers = await client.module.database.findGuildMembers(message.guild.id)

        if (!guild.plugins.leveling.enabled)
            return new client.class.error('Leveling is disabled on this server!', interaction ?? message)

        let User = (await client.utils.member(message, args, 0))?.user

        if (!User)
            return Promise.all([client.module.database.Member(message.author.id, message.guild.id), client.module.database.User(message.author.id)]).then(async([member, user]) => {

                const nxtLvl = client.utils.next_level(member.level)
                let result = client.module.profiles._calculateGuildRank(guildMembers, member)         

                const rank = new client.imports.canvacord.Rank()
                    .setAvatar(message.member.displayAvatarURL({ extension: 'png', size: 4096 }))
                    .setCurrentXP(member.exp)
                    .setRequiredXP(nxtLvl)
                    .setLevel(member.level + 1)
                    .setLevelColor('#FF69B4')
                    .setRank(result, result, true)
                    .setRankColor('#FF69B4')
                    .setStatus(message.member.presence ? message.member.presence.status : 'offline')
                    .setProgressBar('#FF69B4', 'COLOR')
                    .setUsername(client.utils.norm(message.member.user.username))
                    .setDiscriminator(message.member.user.tag.slice(-4))

                let getBg = client.module.profiles.decodeProfileBackgroundStringArray(user.inventory)
                if (getBg !== -1)
                    rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${getBg[0][0][0]}.png`)

                let getSclr = client.module.profiles.decodeProfileStatusColorStringArray(user.inventory)
                if (getSclr !== -1)
                    rank.setCustomStatusColor(getSclr[0][0][0])
                    
                return rank.build()
                    .then(async data => {
                        return client.send(message.channel, null, null, [new Discord.AttachmentBuilder(data, { name: 'level.png' })])
                    })
            })

        if (User.bot)
            return new client.class.error('Bots have leveling disabled!', interaction ?? message)

        return Promise.all([client.module.database.User(User.id), client.module.database.Member(User.id, message.guild.id)]).then(async([user, member]) => {

            if (user.levelout)
                return new client.class.error('Cannot display this user\'s level!', interaction ?? message)

            const nxtLvl = client.utils.next_level(member.level)
            let result = client.module.profiles._calculateGuildRank(guildMembers, member)

            const rank = new client.imports.canvacord.Rank()
                .setAvatar(User.displayAvatarURL({ extension: 'png', size: 4096 }))
                .setCurrentXP(member.exp)
                .setRequiredXP(nxtLvl)
                .setLevel(member.level + 1)
                .setLevelColor('#FF69B4')
                .setRank(result, result, true)
                .setRankColor('#FF69B4')
                .setStatus(await client.utils.member(message, args, 0).presence ? await client.utils.member(message, args, 0).presence.status : 'offline')
                .setProgressBar('#FF69B4', 'COLOR')
                .setUsername(client.utils.norm(User.username))
                .setDiscriminator(User.tag.slice(-4))

            let getBg = client.module.profiles.decodeProfileBackgroundStringArray(user.inventory)
            if (getBg !== -1)
                rank.setBackground('IMAGE', `./additions/images/level_up_store_rank_card_backgrounds/${getBg[0][0][0]}.png`)

            let getSclr = client.module.profiles.decodeProfileStatusColorStringArray(user.inventory)
            if (getSclr !== -1)
                rank.setCustomStatusColor(getSclr[0][0][0])

            return rank.build()
                .then(async data => {
                    return client.send(message.channel, null, null, [new Discord.AttachmentBuilder(data, { name: 'level.png' })])
                })
        })
    }
}