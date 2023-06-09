'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle role deletion.
     * @param {Relaxy} client 
     * @param {Discord.Role} role 
     */
    async run(client, role) {
        const guild = await client.module.database.Guild(role.guild.id)

        if (guild.mute_id.length > 0 && role === guild.mute_id) {
            client.save(guild.id, { to_change: 'mute_id', value: '' })
        }

        let fcs = await client.module.database.findForumChannels(guild.id)

        fcs.forEach(async fc => {
            if (fc.roles.includes(role.id)) {
                let f = await client.module.database.ForumChannel(fc.id, guild.id)

                let roles = fc.roles
                roles.splice(roles.indexOf(role.id), 1)
                
                f.markModified('roles')
                await f.save()
            }
        })

        if (guild.plugins.modlog.events.roleDelete.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.roleDelete.channel)) 
                return client.save(guild.id, { to_change: 'plugins.modlog.events.roleDelete.enabled', value: false })

            let additional = [
                role.tags?.botId && 'Role managed by a bot.',
                role.tags?.premiumSubscriberRole && 'Nitro booster role.',
                role.tags?.integrationId && 'Role managed by an external integration.',
                role.tags?.subscriptionListingId && 'This role is a SKU subscription.',
                role.tags?.availableForPurchase && 'This role is available for purchase.'
            ].filter(Boolean)

            let audit = (await role.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            return client.data.modlog_posts[role.guild.id].push(['roleDelete', new client.class.modlog({
                color: 'bad',
                event: 'Role deleted',
                fields: [
                    { name: 'Deleted role:', value: `${role} - ${role.name}` },
                    { name: 'Role ID:', value: `\`${role.id}\`` },
                    { name: 'Role HEX color:', value: `#${role.hexColor}` },
                    { name: 'Managed by external service:', value: `${role.managed ? 'Yes.' : 'No.'}` },
                    additional.length !== 0 ? { name: 'Additional information:', value: `${additional.map(a => { return a }).join(', ')}` } : null,
                    audit?.targetType === 'Role' && audit?.actionType === 'Delete' && audit.executor ? { name : 'Deleted by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``, inline: true } : null,
                ].filter(i => i !== null)
            })])
        }
    }
}