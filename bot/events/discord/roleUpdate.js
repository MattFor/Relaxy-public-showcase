'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


let perms = {}
for (const perm of Object.getOwnPropertyNames(Discord.PermissionsBitField.Flags)) 
    perms[perm] = perm;


export default {
    /**
     * Handle role edition.
     * @param {Relaxy} client 
     * @param {Discord.Role} oldr 
     * @param {Discord.Role} newr
     */
    async run(client, oldr, newr) {
        let role = newr ? newr : oldr
        const guild = await client.module.database.Guild(newr.guild.id || oldr.guild.id)

        if (guild.mute_id.length > 0 && newr.id === guild.mute_id) {
            const Guild = client.guilds.cache.get(guild.id)
            const mute_role = Guild.roles.cache.find(role => role.id == guild.mute_id)

            Guild.channels.cache.forEach(async(channel) => {
                channel = await Guild.channels.fetch(channel.id)

                if (channel && channel.permissionOverwrites && !channel.permissionOverwrites.cache.get(mute_role.id))
                    return await channel.permissionOverwrites.create(mute_role, {
                        'SendMessages': false,
                        'AddReactions': false,
                        'Speak': false,
                        'Connect': false,
                    }).catch(() => {})
            })
        }

        if (guild.plugins.modlog.events.roleUpdate.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.roleUpdate.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.roleUpdate.enabled', value: false })

            const oldPermissions = `${Object.entries(oldr.permissions.serialize()).filter(perm => perm[1]).map(([perm]) => perms[perm]).join(', ')}.`
            const newPermissions = `${Object.entries(newr.permissions.serialize()).filter(perm => perm[1]).map(([perm]) => perms[perm]).join(', ')}.`

            let audit = (await newr.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            let embed = new client.class.modlog({
                event: 'Role updated',
                thumbnail: (!oldr.icon && newr.icon) || (oldr.icon !== newr.icon) ?  newr.iconURL({ dynamic: true, size: 4096 }) : null,
                fields: [
                    { name: 'Role:', value: `${newr} - \`${newr.name}\``, inline: true },
                    { name : 'Role ID:', value: `\`${newr.id}\``, inline: true },
                    audit?.targetType === 'Channel' && audit?.actionType === 'Update' && audit.executor ? { name : 'Changed by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``, inline: true } : null,
                    ((!oldr.unicodeEmoji && newr.unicodeEmoji) || oldr.unicodeEmoji !== newr.unicodeEmoji) || ((!oldr.icon && newr.icon) || (oldr.icon !== newr.icon)) ?  { name: 'Icon change:', value: `${!oldr.unicodeEmoji && newr.unicodeEmoji || oldr.unicodeEmoji !== newr.unicodeEmoji ? `Emoji changed: ${oldr.unicodeEmoji??'None'} -> ${newr.unicodeEmoji??'None'}.` : 'The new icon is shown in the thumbnail, if there is none it was simply deleted.'}` } : null,
                    oldr.name !== newr.name ? { name: 'Name change:', value: `Old name: **\`${oldr.name}\`**\nNew name: **\`${newr.name}\`**.` } : null,
                    oldr.color !== newr.color ? { name: 'Color change:', value: `Old hex: \`${oldr.hexColor}\`\nNew hex: \`${newr.hexColor}\`.` } : null,
                    oldr.hoist !== newr.hoist ? { name: 'Hoist change:', value: 'The role now displays separately from others.' } : null,
                    oldr.rawPosition !== newr.rawPosition ? { name: 'Position change:', value: `Old position: **\`${oldr.rawPosition}\`**\nNew position: **\`${newr.rawPosition}\`**` } : null,
                    oldr.mentionable !== newr.mentionable ? { name: 'Mentionality change:', value: `Old status: ${oldr.mentionable ? 'Can be mentioned.' : 'Can\'t be mentioned.'}\nNew status: ${newr.mentionable ? 'Can be mentioned.' : 'Can\'t be mentioned.'}.` } : null,
                    oldr.permissions.bitfield !== newr.permissions.bitfield && oldPermissions !== newPermissions ? { name: 'Permission update:', value: `Old permissions:\n\`${oldPermissions.length < 3 ? 'None' : oldPermissions}\`\n\nNew permissions:\n\`${newPermissions || 'None'}\`` } : null
                ].filter(item => item !== null),
            })

            return client.data.modlog_posts[role.guild.id].push(['roleUpdate', embed])
        }
    }
}