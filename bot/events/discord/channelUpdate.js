'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * 
     * @param {Relaxy} client 
     * @param {Discord.GuildChannel} old_channel 
     * @param {Discord.GuildChannel} new_channel 
     */
    async run(client, old_channel, new_channel) {
        client.module.database.Guild(new_channel ? new_channel.guild.id : old_channel.guild.id).then(async guild => {
            if (guild.plugins.modlog.events.channelUpdate.enabled) {
                if (!client.channels.cache.get(guild.plugins.modlog.events.channelUpdate.channel)) client.save(guild.id, { to_change: 'plugins.modlog.events.channelUpdate.enabled', value: false })

                if (old_channel.type === Discord.ChannelType.PublicThread || old_channel.type === Discord.ChannelType.PrivateThread || old_channel.type === Discord.ChannelType.AnnouncementThread)
                    return

                let audit = (await new_channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

                let embed =  new client.class.modlog({
                    event: 'Channel updated',
                    thumbnail: new_channel.guild.iconURL({ dynamic: true, size: 4096 }),
                    fields: [
                        // All channels
                        !guild.plugins.modlog.lowspam ? (!audit?.executor?.bot??true) && old_channel.rawPosition !== new_channel.rawPosition ? { name: 'Position change:', value: `**\`${old_channel.rawPosition}\`** -> **\`${new_channel.rawPosition}\`**` } : null : null,
                        !guild.plugins.modlog.lowspam ? (!audit?.executor?.bot??true) && old_channel.name !== new_channel.name ? { name: 'Name change:', value: `**\`${old_channel.name}\`** -> **\`${new_channel.name}\`**.`} : null : null,
                        old_channel?.parentId !== new_channel?.parentId ? { name: 'Category change:', value: `**${old_channel.parent??'None.'}** -> **${new_channel.parent??'None.'}**`} : null,
                        old_channel?.rateLimitPerUser !== new_channel?.rateLimitPerUser ? { name: 'Slowmode change:', value: `**\`${old_channel.rateLimitPerUser??'None.'}\`** -> **\`${new_channel.rateLimitPerUser??'None.'}\`**.`} : null,
                        new_channel.permissionOverwrites.cache.difference(old_channel.permissionOverwrites.cache).size !== 0 ? { name: 'Permissions change:', value: `Permissions for ${
                            new_channel.permissionOverwrites.cache.difference(old_channel.permissionOverwrites.cache).map(id => { return `<@!${id.id}>` })}` } : null,

                        // Voice channels
                        (old_channel.type === Discord.ChannelType.GuildVoice || old_channel.type === Discord.ChannelType.GuildStageVoice)  && old_channel.userLimit !== new_channel.userLimit ? { name: 'User limit change:', value: `**\`${old_channel.userLimit??'None.'}\`** -> **\`${new_channel.userLimit??'None.'}\`**.`} : null,
                        (old_channel.type === Discord.ChannelType.GuildVoice || old_channel.type === Discord.ChannelType.GuildStageVoice) && old_channel.bitrate !== new_channel.bitrate ? { name: 'Bitrate change:', value: `**\`${old_channel.bitrate}\`** -> **\`${new_channel.bitrate}\`**` } : null,

                        // Forum channels
                        old_channel.type === Discord.ChannelType.GuildForum && old_channel.defaultThreadRateLimitPerUser !== new_channel.defaultThreadRateLimitPerUser ? { name: 'Default thread slomode change:', value: `**\`${old_channel.defaultThreadRateLimitPerUser??'None.'}\`** -> **\`${new_channel.defaultThreadRateLimitPerUser??'None.'}\`**`  } : null,
                        old_channel.type === Discord.ChannelType.GuildForum && old_channel?.defaultReactionEmoji?.name !== new_channel?.defaultReactionEmoji?.name ? { name: 'Default reaction emoji change:', value: `**\`${old_channel?.defaultReactionEmoji?.name??'None.'}\`** -> **\`${new_channel?.defaultReactionEmoji?.name??'None.'}\`**`  } : null,
                        old_channel.type === Discord.ChannelType.GuildForum && old_channel.defaultSortOrder !== new_channel.defaultSortOrder ? { name: 'Sort order change:', value: `**\`${['Latest activity', 'Creation date'][old_channel.defaultSortOrder]??'None.'}\`** -> **\`${['Latest activity', 'Creation date'][new_channel.defaultSortOrder]??'None.'}\`**`  } : null,
                        old_channel.type === Discord.ChannelType.GuildForum && old_channel.defaultForumLayout !== new_channel.defaultForumLayout ? { name: 'Layout change:', value: `**\`${['None.', 'List view', 'Gallery view'][old_channel.defaultForumLayout]??'None.'}\`** -> **\`${['None.', 'List view', 'Gallery view'][new_channel.defaultForumLayout]??'None.'}\`**`  } : null,
                        old_channel.type === Discord.ChannelType.GuildForum && old_channel.defaultAutoArchiveDuration !== new_channel.defaultAutoArchiveDuration ? { name: 'Automatic archive time change:', value: `**\`${old_channel.defaultAutoArchiveDuration??'None.'}\`** -> **\`${new_channel.defaultAutoArchiveDuration??'None.'}\`**`  } : null,                          
                    ].filter(item => item !== null),
                    description: `Channel: **${new_channel} - \`${new_channel.id}\`**`
                })

                if (embed.fields.length !== 0) {
                    if (audit?.targetType === 'Channel' && audit?.actionType === 'Update' && audit.executor)
                        embed.fields.push({ name : 'Changed by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``})

                    return client.data.modlog_posts[new_channel.guild.id].push(['channelUpdate', embed])
                }
            }
        })
    }
}