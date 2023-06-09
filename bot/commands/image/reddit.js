'use strict'

import Reddit from 'justreddit'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'reddit',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    args: true,
    nsfw: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('subreddit').setDescription('Subreddit which a random image will be from.').setRequired(true)),
    usage: '=reddit subreddit name (without r/)',
    description: 'Get a random post from a specified subreddit.',
    cooldown: 2,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (client.utils.censorCheck(args, guild))
            return

        let now = Date.now()
        let m = null

        if (interaction) {
            return interaction.reply({ embeds: [{
                color: client.data.embedColor,
                title: 'Processing image....',
                thumbnail: { url: 'attachment://loading.gif' },
            }], files: [{
                attachment: './additions/images/loading.gif',
                name: 'loading.gif',
            }]}).then(async() => {

                let URL = ''
                let passes = 0

                while (true) {
                    URL = args[1] ? await getImage(args.shift(), args.join(' ')) : await Reddit.randomImageFromSub({
                        reddit: args[0],
                        sortType: args[1] === 'new' ? args[1] : 'top',
                        postGetLimit: 250,
                    })

                    let check1 = !client.data.server_cache[guild.id].hasOwnProperty(URL)
                    let check2 = !(URL.includes('gallery') || URL.includes('.html') || URL.includes('youtube.com') || URL.includes('youtu.be')) // || URL.includes('watch') || URL.includes('ifr')
                    let check3 = (URL.includes('.jpg') || URL.includes('.png')) || URL.includes('.gif') || URL.includes('.redgifs')

                    if ((check1 && check2 && check3) || passes >= 20)
                        break

                    passes++
                }

                if (passes >= 20) {
                    return interaction.editReply({ embeds: [{
                        color: client.data.embedColor,
                        title: 'No results found!'
                    }], files: []})
                }

                client.data.server_cache[guild.id][URL] = 50000

                let bad_gif_flag = (URL.includes('tenor') || URL.includes('giphy') || URL.includes('imgur')) && URL.includes('.gif') || URL.includes('.redgifs')


                return interaction.editReply({ content: bad_gif_flag ? URL : null, embeds: bad_gif_flag ? [] : [{
                    color: client.data.embedColor,
                    title: `From r/${client.utils.firstLetterUp(args[0])}`,
                    image: {
                        url: URL
                    },
                    footer: {
                        icon_url: client.config.text.links.relaxyImage,
                        text: `Scraped and rendered in ${client.imports.time(Date.now() - now)}`
                    },
                }], files: [] })
            }).catch(e => {
                return interaction.editReply({ embeds: [{
                    color: client.data.embedColor,
                    title: client.utils.firstLetterUp(e.message ? (e.message.includes('404') || e.message.includes('403') || e.message.includes('url') ? 'Subreddit not found!' : e.message || null) : e)
                }], files: [] }).catch(e => {
                    return interaction.editReply({ embeds: [{
                        color: client.data.embedColor,
                        title: 'Subreddit not found!'
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
                m = msg

                let URL = ''
                let passes = 0

                while (true) {
                    URL = args[1] ? await getImage(args.shift(), args.join(' ')) : await Reddit.randomImageFromSub({
                        reddit: args[0],
                        sortType: args[1] === 'new' ? args[1] : 'top',
                        postGetLimit: 200,
                    })

                    let check1 = !client.data.server_cache[guild.id].hasOwnProperty(URL)
                    let check2 = !(URL.includes('gallery') || URL.includes('.html') || URL.includes('youtube.com') || URL.includes('youtu.be') || URL.includes('watch'))
                    let check3 = (URL.includes('.jpg') || URL.includes('.png')) || URL.includes('.gif') || URL.includes('.redgifs')

                    if ((check1 && check2 && check3 ) || passes >= 20)
                        break

                    passes++
                }

                if (passes >= 20) {

                    msg.delete()

                    return client.send(interaction ? 1 : message.channel, null, [{
                        color: client.data.embedColor,
                        title: 'No results found!'
                    }]).catch()
                }

                // console.log(await client.utils.nsfw(URL, URL.includes('.gif') || URL.includes('.redgifs')))

                client.data.server_cache[guild.id][URL] = 50000

                let bad_gif_flag = (URL.includes('tenor') || URL.includes('giphy') || URL.includes('imgur')) && URL.includes('.gif')

                client.send(interaction ? 1 : message.channel, bad_gif_flag ? URL : null, bad_gif_flag ? null : [{
                    color: client.data.embedColor,
                    title: `From r/${client.utils.firstLetterUp(args[0])}`,
                    image: {
                        url: URL
                    },
                    footer: {
                        icon_url: client.config.text.links.relaxyImage,
                        text: `Scraped and rendered in ${client.imports.time(Date.now() - now)}`
                    },
                }]).then(() => {
                    return msg.delete()
                })

            }).catch(e => {
                if (m)
                    m.delete()

                client.send(interaction ? 1 : message.channel, null, [{
                    color: client.data.embedColor,
                    title: client.utils.firstLetterUp(e.message ? (e.message.includes('404') || message.includes('403') || e.message.includes('url') ? 'Subreddit not found!' : e.message || null) : e)
                }]).catch()
        })
    }
}