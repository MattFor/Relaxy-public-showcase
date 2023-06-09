'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import lyrics_importer from 'genius-lyrics'
import Relaxy from '../../../src/Relaxy.js'


const lyrics_importer_client = new lyrics_importer.Client()


export default {
    name: 'lyrics',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    usage: '=lyrics (song name)',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('song_name').setDescription('Name of the song to search.').setRequired(false).setMinLength(2).setMaxLength(800)),
    description_slash: 'Shows current song\'s lyrics or the searched song\'s lyrics.',
    description: 'Tries to show the accurate description of a song\'s lyrics (and some artist info).\nIf a song is playing on Relaxy! and you don\'t provide any title it will autosearch he current song title.\n`DISCLAIMER:` **this usually doesn\'t work as the title\'s too complicated for the search engine.**',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let tries = 0,
            err_flag = false,
            lyrics_final = null,
            lyrics_general = null,
            text = args.join(' '),
            current_time_ms = Date.now(),
            queue = client.module.music.getQueue(message.guild.id)

        if (queue?.state === 'recording' && !args[0])
            return new client.class.error('RecordingA', interaction ?? message)

        if (!args[0] && !queue && !queue.current)
            return new client.class.error('No text given!', interaction ?? message)

        if (queue && queue.current && !args[0])
            text = queue.current.title.toLowerCase()

        if (interaction)
            interaction.reply({ embeds: [{
                color: client.data.embedColor,
                title: 'Finding information....',
                thumbnail: { url: 'attachment://loading.gif' },
            }], files: [{
                attachment: './additions/images/loading.gif',
                name: 'loading.gif',
            }]}).then(message_2 => {
                new Promise((resolve, reject) => {
                    let lyrics_interval = setInterval(async () => {
                        if (tries === 5) {
                            clearInterval(lyrics_interval)

                            message_2.delete().catch(() => {})

                            reject()
                        }

                        try {
                            lyrics_general = await lyrics_importer_client.songs.search(text)
                            lyrics_final = await lyrics_general[0].lyrics()
                        } catch { err_flag = true }

                        if (!lyrics_general || !lyrics_final || err_flag) return tries++

                        clearInterval(lyrics_interval)

                        resolve()
                    }, 1000)
                }).then(async () => {

                    let fields = []

                    if (lyrics_final.length > 2048)
                        fields.push({
                            name: 'Sorry!',
                            value: 'The lyrics were too long so I had to cut them!'
                        })
                    
                    return interaction.editReply({ embeds: [{
                        color: client.data.embedColor,
                        title: lyrics_general[0].fullTitle,
                        description: client.utils.createDescription(lyrics_final, embed),
                        footer: {
                            icon_url: client.config.text.links.relaxyImage,
                            text: `Scraped and combined in ${client.imports.time(Date.now() - current_time_ms)}`
                        },
                        fields: fields,
                        thumbnail: { url: lyrics_general[0].thumbnail },
                        timestamp: new Date(),
                    }], files: [] })
                }).catch(() => {
                    return interaction.editReply({ embeds: [new client.class.error('Sorry! Couldn\'t find the lyrics!', 1)], files: [] })
                })
            })
        else
            client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Finding information....',
                thumbnail: { url: 'attachment://loading.gif' },
            }], [{
                attachment: './additions/images/loading.gif',
                name: 'loading.gif',
            }]).then(message_2 => {
                new Promise((resolve, reject) => {
                    let lyrics_interval = setInterval(async () => {
                        if (tries === 5) {
                            clearInterval(lyrics_interval)

                            reject()
                        }

                        try {
                            lyrics_general = await lyrics_importer_client.songs.search(text)
                            lyrics_final = await lyrics_general[0].lyrics()
                        } catch { err_flag = true }

                        if (!lyrics_general || !lyrics_final || err_flag) return tries++

                        clearInterval(lyrics_interval)

                        resolve()
                    }, 1000)
                }).then(async () => {

                    let fields = []

                    if (lyrics_final.length > 2048)
                        fields.push({
                            name: 'Sorry!',
                            value: 'The lyrics were too long so I had to cut them!'
                        })

                    return client.edit(message_2, null, [{
                        color: client.data.embedColor,
                        title: lyrics_general[0].fullTitle,
                        description: client.utils.createDescription(lyrics_final, embed),
                        footer: {
                            icon_url: client.config.text.links.relaxyImage,
                            text: `Scraped and combined in ${client.imports.time(Date.now() - current_time_ms)}`
                        },
                        fields: fields,
                        thumbnail: { url: lyrics_general[0].thumbnail },
                        timestamp: new Date(),
                    }]).catch(() => {})
                }).catch(() => {
                    return new client.class.error('Sorry! Couldn\'t find the lyrics!', interaction ?? message)
                })
            })
    }
}