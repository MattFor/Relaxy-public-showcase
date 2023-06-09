'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.Invite} invite
     */
    async run(client, invite) {
        if (!invite.guild && invite.inviter.id !== client.id) 
            return

        const guild = await client.module.database.Guild(invite.guild.id)

        if (guild.plugins.modlog.events.inviteDelete.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.inviteDelete.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.inviteDelete.enabled', value: false })

            let invite_expiretime = null

            try {
                invite_expiretime = client.imports.time(invite.expiresAt)
            } catch {}

            client.data.modlog_posts[invite.guild.id].push(['inviteDelete', new client.class.modlog({
                color: 'bad',
                event: 'Invite deleted',
                thumbnail: invite.inviter ? invite.inviter.displayAvatarURL({ dynamic: true, size: 4096 }) : invite.guild.iconURL({ dynamic: true, size: 4096 }),
                description: `User who created the invite:\n${invite.inviter ? `**${invite.inviter} - ${invite.inviter.tag} - \`${invite.inviter.id}\`**` : '**`Unavailable`**'}\nExpiration date: ${invite_expiretime ? `**\`${invite_expiretime}\`**` : '**Doesnt\'t expire.**'}\nMaximum uses: ${invite.maxUses ? `\`${invite.maxUses}\`` : '**`Infinite`**'}\nTemporary: ${invite.temporary ? '**Yes.**' : '**No.**'}\nInvite channel: ${invite.channel ? `${invite.channel}` : '**`Unavailable`**'}`
            })])
        }
    }
}