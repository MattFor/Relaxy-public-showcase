'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


let perms = {}
for (const perm of Object.getOwnPropertyNames(Discord.PermissionsBitField.Flags)) 
    perms[perm] = perm

const humanReadablePresence = {
    'dnd': 'Do not disturb',
    'online': 'Online',
    'offline': 'Offline',
    'idle': 'AFK'
}


export default {
    /**
     * 
     * @param {Relaxy} client 
     * @param {Discord.GuildMember} old_member 
     * @param {Discord.GuildMember} new_member 
     */
    async run(client, old_member, new_member) {
        client.module.database.Guild(new_member ? new_member.guild.id : old_member.guild.id).then(async guild => {
            let audit = (await new_member.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            if (guild.plugins?.censoring?.renaming && 
                !(audit?.targetType === 'User' && audit?.actionType === 'Update' && 
                audit.executor && audit?.executor?.id !== audit?.target?.id && audit?.target?.id === new_member?.id) &&
                client.utils.censorCheck([new_member.nickname??new_member.user.username], guild))
                    return new_member.setNickname(`Renamed${Math.floor(Math.random() * 100000000000)}`, `Censoring pool word detected in the ${new_member.nickname ? 'nickname' : 'username'}!`)

            if (guild.plugins.modlog.events.guildMemberUpdate.enabled) {
                if (!client.channels.cache.get(guild.plugins.modlog.events.guildMemberUpdate.channel)) 
                    client.save(guild.id, { to_change: 'plugins.modlog.events.guildMemberUpdate.enabled', value: false })

                const oldPermissions = `${Object.entries(old_member.permissions.serialize()).filter(perm => perm[1]).map(([perm]) => perms[perm]).join(', ')}.`
                const newPermissions = `${Object.entries(new_member.permissions.serialize()).filter(perm => perm[1]).map(([perm]) => perms[perm]).join(', ')}.`

                let forced_change = audit?.changes.length !== 0

                if (forced_change && Date.now() - audit.createdTimestamp < 1000)
                    forced_change = false

                const low_spam = guild.plugins.modlog.lowspam ? !audit?.executor?.bot && audit?.targetType === 'User' && audit?.actionType === 'Update' && Date.now() - audit.createdTimestamp < 1000 : true

                let embed = new client.class.modlog({
                    event: 'Member updated',
                    thumbnail: new_member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
                    fields: [
                        old_member.communicationDisabledUntil !== new_member.communicationDisabledUntil && audit?.changes[0]?.key === 'communication_disabled_until' ? 
                        { name: `${new_member.communicationDisabledUntil === null && old_member.communicationDisabledUntil ? 'Untimeouted' : 'Timeouted'}:`, value: `${
                            new_member.communicationDisabledUntil === null && old_member.communicationDisabledUntil && audit?.changes[0]?.key === 'communication_disabled_until' ? 
                                `Timeout duration passed:${
                                    audit?.changes[0]?.key === 'communication_disabled_until' && audit.executor ? `\nBy user: **${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\`**` : ''}` : 
                                `Timeouted until **\`${
                                    client.utils.formatDate(new_member.communicationDisabledUntil)
                                }\`** **\`[${
                                    client.imports.time(new_member.communicationDisabledUntilTimestamp - Date.now())}]\`**${
                                        audit?.changes[0]?.key === 'communication_disabled_until' && audit.executor ? `\nBy user: **${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\`**` : ''}`
                                }` } : null,
                        old_member.user.username !== new_member.user.username ? { name: 'Name change:', value: `Old name: **\`${old_member.user.username}\`**\nNew name: **\`${new_member.user.username}\`**.` } : null,
                        old_member.nickname !== new_member.nickname ? { name: 'Nickname change:', value: `Old nickname: **\`${old_member.nickname??'Same as normal username. / Unavailable.' }\`**\nNew nickname: **\`${new_member.nickname ? new_member.nickname : new_member.user.username}\`**.` } : null,
                        !guild.plugins.modlog.lowspam && old_member.user.tag !== new_member.user.tag ? { name: 'Tag change:', value: `Old tag: **\`${old_member.user.tag??'Same as normal username. / Unavailable.'}\`**\nNew tag: **\`${new_member.user.tag??'Same as normal username. / Unavailable.'}\`**.` } : null,
                        !guild.plugins.modlog.lowspam && old_member.displayHexColor !== new_member.displayHexColor ? { name: 'Display color change:', value: `Old color hex: **\`${old_member.displayHexColor}\`**\nNew color hex: **\`${new_member.displayHexColor}\`**.` } : null,
                        humanReadablePresence[old_member.presence ? old_member.presence.status : 'offline'] !== humanReadablePresence[new_member.presence ? new_member.presence.status : 'offline'] ? { name: 'Presence change:', value: `Old presence: **${humanReadablePresence[old_member.presence ? old_member.presence.status : 'offline']}**\nNew presence: **${humanReadablePresence[new_member.presence ? new_member.presence.status : 'offline']}**`} : null, 
                        old_member.user.avatarURL({ dynamic: true, size: 4096 }) !== new_member.user.avatarURL({ dynamic: true, size: 4096 }) ? 
                            { name: 'Avatar change:', value: `[Old link](${old_member.user.avatarURL({ dynamic: true, size: 4096 })}) -> [New link](${new_member.user.avatarURL({ dynamic: true, size: 4096 })})  [The new avatar is displayed in the thumbnail]` } : null,
                        low_spam && old_member.permissions.bitfield !== new_member.permissions.bitfield && oldPermissions !== newPermissions ? 
                            { name: 'Permission update:', value: `Old permissions:\n\`${oldPermissions ? oldPermissions.length < 3 ? 'None' : oldPermissions : 'None'}\`\n\nNew permissions:\n\`${newPermissions  ? newPermissions.length < 5 ? 'None' : newPermissions : 'None'}\`` } : null,
                        low_spam && old_member.roles.cache.size !== new_member.roles.cache.size ? 
                            { name: `Role change${new_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `**${roles.name}**`).length - old_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `**${roles.name}**`).length > 1 || new_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `**${roles.name}**`).length - old_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `**${roles.name}**`).length < -1 ? 's' : ''}:`, value: `Old roles: **${old_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `<@&${roles.id}>`).join(' **|** ').slice(0, 1022) || 'No Roles'}**.\nNew roles: **${new_member.roles.cache.filter(r => r.id !== new_member.guild.id).map(roles => `<@&${roles.id}>`).join(' **|** ').slice(0, 1022) || 'No Roles'}**.` } : null,
                    ].filter(item => item !== null),
                    description: `Member:\n**${new_member} - ${old_member.user.tag !== new_member.user.tag ? `${old_member.user.tag} -> ` : ''}${new_member.user.tag} - \`${new_member.id}\`**`
                })

                if (embed.fields.length !== 0) {
                    embed.fields.push({ name: 'Changed by:', value: audit?.targetType === 'User' && audit?.actionType === 'Update' && audit.executor?.id !== new_member.user.id ? `${audit?.executor??'Unavailable'} - ${audit?.executor?.tag??'Unavailable'} - \`${audit?.executor?.id??'Unavailable'}\`` : 'The user himself.' })
                    client.data.modlog_posts[new_member.guild.id].push(['guildMemberUpdate', embed])
                }
            }
        })
    }
}