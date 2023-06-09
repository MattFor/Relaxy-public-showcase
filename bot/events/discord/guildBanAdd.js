'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a member being banned.
     * @param {Relaxy} client 
     * @param {Discord.GuildBan} ban
     * @returns {Discord.Message}
     */
    async run(client, ban) {
        const Guild = await client.module.database.Guild(ban.guild.id)

        if (!Guild.plugins.modlog.events.guildBanAdd.enabled) 
            return

        client.save(Guild.id, { to_change: 'caseCount', value: ++Guild.caseCount })

        const fetchedBan = await ban.guild.bans.fetch(ban.user)

        return client.data.modlog_posts[Guild.id].push(['guildBanAdd', new client.class.modlog({
            color: 'bad',
            title: `**Event |** \`Ban case\` #${Guild.caseCount}`,
            thumbnail: ban.user.displayAvatarURL({ dynamic: true, size: 4096 }),
            fields: [
                { name: 'User banned:', value: `${ban.user}\n(${ban.user.tag})`, inline: true },
                { name: 'User ID:', value: `\`${ban.user.id}\``, inline: true },
                { name: 'Ban reason:', value: fetchedBan.reason ? fetchedBan.reason : 'No reason given' }
            ]
        })])
    }
}