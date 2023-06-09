'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a member being unbanned.
     * @param {Relaxy} client 
     * @param {Discord.GuildBan} ban
     * @returns {Discord.Message}
     */
    async run(client, ban) {
        const Guild = await client.module.database.Guild(ban.guild.id)

        let audit = await ban.guild.fetchAuditLogs({ limit: 1 }).catch(() => {})??null

        if (audit)
            audit = audit.entries.first()

        if (Guild.plugins.modlog.events.guildBanRemove.enabled)
            return client.data.modlog_posts[Guild.id].push(['guildBanRemove', new client.class.modlog({
                color: 'good',
                title: `**Event |** \`Unban case\` #${Guild.caseCount}`,
                thumbnail: ban.user.displayAvatarURL({ dynamic: true, size: 4096 }),
                fields: [
                    { name: 'User unbanned:', value: `${ban.user}\n(${ban.user.tag})`, inline: true },
                    { name: 'User ID:', value: `\`${ban.user.id}\``, inline: true },
                    audit ? { name: 'Unbanned by:', value: `${audit.executor} - ${audit.executor.tag} **\`${audit.executor.id}\`**`} : null
                ].filter(i => i !== null)
            })])
    }
}