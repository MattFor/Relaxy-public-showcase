'use strict'

import Relaxy from '../../../src/Relaxy.js'
import { GOOGLE_IMG_SCRAP , GOOGLE_QUERY } from 'google-img-scrap'
import Discord from 'discord.js'


export default {
    name: 'picture',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    aliases: ['pic'],
    nsfw: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('Search for an image with this description on google.').setRequired(true)),
    args: true,
    usage: '=picture keywords',
    description: 'Search a gif/image on google with the keywords specified.',
    cooldown: 3,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let now = Date.now()
        let query = args.join(' ').slice(0, 239)

        if (client.utils.censorCheck(args, guild))
            return

        if (interaction) {
            return interaction.reply({ embeds: [{
                color: client.data.embedColor,
                title: 'Processing image....',
                thumbnail: { url: 'attachment://loading.gif' },
            }], files: [{
                attachment: './additions/images/loading.gif',
                name: 'loading.gif',
            }]}).then(async() => {
                client.module.profiles.Achievement(message, 'image', guild)
                let gif = query.toLowerCase().includes('gif')

                GOOGLE_IMG_SCRAP({
                    search: query, safeSearch: false, query: { TYPE: gif ? GOOGLE_QUERY.TYPE.GIF : GOOGLE_QUERY.TYPE.CLIPART},
                    execute: (element) => { if (!element.url.match('gstatic.com') && !client.data.server_cache.hasOwnProperty(element.url)) return element }})
                .then(results => {
                        if (results.result.length === 0)
                            return interaction.editReply({ embeds: [{
                                color: client.data.embedColor,
                                title: `Nothing found for ${client.utils.firstLetterUp(query)}`,
                            }], files: [] })

                        let w = results.result[Math.floor(Math.random() * results.result.length)].url

                        client.data.server_cache[guild.id][w] = 30000

                        interaction.editReply({ embeds: [{
                            color: client.data.embedColor,
                            title: client.utils.firstLetterUp(query),
                            image: {
                                url: w
                            },
                            footer: {
                                icon_url: client.config.text.links.relaxyImage,
                                text: `Scraped and rendered in ${client.imports.time(Date.now() - now)}`
                            },
                    }], files: [] })
                }).catch(e => {
                    return interaction.editReply({ embeds: [{
                        color: client.data.embedColor,
                        title: client.utils.firstLetterUp(e.message || e)
                    }], files: [] })
                })
            })
        }

        return client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Processing image....',
                thumbnail: { url: 'attachment://loading.gif' },
            }], [{
                attachment: './additions/images/loading.gif',
                name: 'loading.gif',
            }]).then(async(msg) => {
                client.module.profiles.Achievement(message, 'image', guild)
                let gif = query.toLowerCase().includes('gif')

                GOOGLE_IMG_SCRAP({
                    search: query, safeSearch: false, query: { TYPE: gif ? GOOGLE_QUERY.TYPE.GIF : GOOGLE_QUERY.TYPE.CLIPART},
                    execute: (element) => { if (!element.url.match('gstatic.com') && !client.data.server_cache.hasOwnProperty(element.url)) return element }})
                .then(results => {
                    if (results.result.length === 0)
                        return client.send(interaction ? 1 : message.channel, null, [{
                            color: client.data.embedColor,
                            title: `Nothing found for ${client.utils.firstLetterUp(query)}`,
                        }]).then(() => {
                            return msg.delete()
                        })
                    let w = results.result[Math.floor(Math.random() * results.result.length)].url
                    client.send(interaction ? 1 : message.channel, null, [{
                        color: client.data.embedColor,
                        title: client.utils.firstLetterUp(query),
                        image: {
                            url: w
                        },
                        footer: {
                            icon_url: client.config.text.links.relaxyImage,
                            text: `Scraped and rendered in ${client.imports.time(Date.now() - now)}`
                        },
                }]).then(() => {
                    return msg.delete()
                })
            }).catch(e => {
                msg.delete()

                client.send(interaction ? 1 : message.channel, null, [{
                    color: client.data.embedColor,
                    title: client.utils.firstLetterUp(e.message || e)
                }]).catch()
            })
        })
    }
}