'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle role creation.
     * @param {Relaxy} client 
     * @param {Discord.Role} role 
     */
    async run(client, role) {
        const guild = await client.module.database.Guild(role.guild.id)

        if (guild.plugins.modlog.events.roleCreate.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.roleCreate.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.roleCreate.enabled', value: false })

            let additional = [
                role.tags?.botId && 'Role managed by a bot.',
                role.tags?.premiumSubscriberRole && 'Nitro booster role.',
                role.tags?.integrationId && 'Role managed by an external integration.',
                role.tags?.subscriptionListingId && 'This role is a SKU subscription.',
                role.tags?.availableForPurchase && 'This role is available for purchase.'
            ].filter(Boolean)

            let audit = (await role.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            return client.data.modlog_posts[role.guild.id].push(['roleCreate', new client.class.modlog({
                color: 'good',
                event: 'Role created',
                fields: [
                    { name: 'New role:', value: `${role} - ${role.name}` },
                    { name: 'Role ID:', value: `\`${role.id}\`` },
                    { name: 'Role HEX color:', value: `#${role.hexColor}` },
                    { name: 'Managed by external service:', value: `${role.managed ? 'Yes.' : 'No.'}` },
                    additional.length !== 0 ? { name: 'Additional information:', value: `${additional.map(a => { return a }).join(', ')}` } : null,
                    audit?.targetType === 'Role' && audit?.actionType === 'Create' && audit.executor ? { name : 'Created by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``, inline: true } : null,
                ].filter(i => i !== null)
            })])
        }
    }
}