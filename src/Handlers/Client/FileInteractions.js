'use strict'

import fetch from 'request'
import Discord from 'discord.js'
import Relaxy from '../../Relaxy.js'

export default class PacketManager {
    /**
     * Manages saving and fetching files.
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client
        this.file_save_queue = []
    }

    async save(packet) {
        if (!packet)
            return

        return new Promise(async(resolve, reject) => {
            if (!this.client.imports.fs.existsSync(`./storage/${packet.authorID}`))
                this.client.imports.fs.mkdirSync(`./storage/${packet.authorID}`)

            try {
                if (packet.data.url) {
                    if (this.client.imports.fs.existsSync(`./storage/${packet.authorID}/${packet.convert}`))
                        this.client.imports.fs.unlinkSync(`./storage/${packet.authorID}/${packet.convert}`)

                    let tries = 0
                    let flag = false

                    if (packet.data.size / (1024 * 1024) > 24.95)
                        return reject(this.client.send(packet.return.channel, `**${packet.return.member}!**, **${this.client.utils.firstLetterUp(packet.name)}** failed to be saved, file size too big!`))

                    fetch(`${packet.data.url}`, async () => {}).pipe(this.client.imports.fs.createWriteStream(`./storage/${packet.authorID}/${packet.convert}`))

                    let TEMP_watch_for_file = setInterval(() => {
                        if (this.client.imports.fs.existsSync(`./storage/${packet.authorID}/${packet.convert}`)) {
                            setTimeout(() => {
                                if ((this.client.imports.fs.statSync(`./storage/${packet.authorID}/${packet.convert}`).size / (1024 * 1024)) > 24.95) {
                                    flag = true
                                    this.client.imports.fs.unlinkSync(`./storage/${packet.authorID}/${packet.convert}`)
                                    return reject(this.client.send(packet.return.channel, `**${packet.return.member}!**, **${this.client.utils.firstLetterUp(packet.name)}** failed to be saved, file size too big!`))
                                }
                            }, 1000)
                        }

                        if (tries > 4) {
                            clearInterval(TEMP_watch_for_file)

                            if (flag && this.client.imports.fs.existsSync(`./storage/${packet.authorID}/${packet.convert}`)) 
                                return this.client.imports.fs.unlinkSync(`./storage/${packet.authorID}/${packet.convert}`)

                            return resolve(this.client.send(packet.return.channel, `**${packet.return.member}!**, **${this.client.utils.firstLetterUp(packet.name)}** has been successfully saved!`))
                        }

                        tries++
                    }, 500)
                } else {
                    if (packet.data.length > 1800) 
                        return this.client.send(packet.return.channel, `**${packet.return.member}!**, Too many characters in the file, max (1800)`)

                    return resolve(this.client.send(packet.return.channel, `**${packet.return.member}!**, **${this.client.utils.firstLetterUp(packet.name)}** has been successfully saved!`))
                }
            } catch {
                return reject(await this.client.send(packet.return.channel, `**${packet.return.member}!**, **${this.client.utils.firstLetterUp(packet.name)}** failed to be saved, something went wrong!`))
            }
        }).catch(() => {})
    }

    async fetch(packet) {
        return new Promise(async(resolve, reject) => {
            let same_files = [],
                numbers = [],
                file = null

            if (!this.client.imports.fs.existsSync(`./storage/${packet.authorID}`)) 
                return this.client.send(packet.return.channel, `**${packet.return.member}!**, You do not have anything saved!`)

            for (const file of this.client.imports.fs.readdirSync(`./storage/${packet.authorID}`))
                if (file.includes(`${packet.convert.split('.')[0]}`)) same_files.push(file)

            let same_files_length = same_files.length

            if (same_files.length > 1) {
                let content = ''

                for (let i = 0; i < same_files_length; i++) {
                    content += `**${i+1}** - \`${same_files[i]}\`\n`
                    numbers.push(i + 1)
                }

                content = content.replaceAll('undefined', '')

                let message = await this.client.send(packet.return.channel, null, 
                    [new Discord.EmbedBuilder()
                    .setColor(this.client.data.embedColor)
                    .setTitle('Many files with the same name found!')
                    .setDescription(content)
                    .addFields([{ name: 'Please reply with a number corresponding to the file.', value: `**1 - ${same_files.length}.**`}])])

                await message.channel.awaitMessages({ filter: message => message.author.id === packet.return.author.id &&
                    !isNaN(message.content) && numbers.includes(Number(message.content)), 
                    max: 1,
                    time: 3000000,
                    errors: ['time']
                }).then(async collected => {

                    file = (Number(collected.first().content) - 1)

                    return this.client.send(message.channel, null, [{
                        color: this.client.data.embedColor,
                        title: 'Loading file....',
                        thumbnail: { url: 'attachment://loading.gif' },
                    }], [{
                        attachment: './additions/images/loading.gif',
                        name: 'loading.gif',
                    }]).then(message => message.delete())
                })
            }

            if (same_files.length === 0 && !file) 
                return this.client.send(packet.return.channel, `**${packet.return.member}!**, You don't have anything with that name saved!`)

            this.client.module.profiles.Achievement(packet.return, 'fetched', packet.return.guild)

            if (file ? same_files[file].endsWith('.txt') : same_files[0].endsWith('.txt'))
                return this.client.send(packet.return.channel, `**${packet.return.member}!**, here's your text file!:\n${
                    file ? this.client.imports.fs.readFileSync(`./storage/${packet.authorID}/${same_files[file]}`) : 
                    this.client.imports.fs.readFileSync(`./storage/${packet.authorID}/${same_files[0]}`)}`).catch(async err => {
                        return reject(this.client.send(packet.return.channel, `**${packet.return.member}!**, Something went wrong while fetching the file!`))
                    }).then(async () => {
                        return resolve(packet)
                    })

            this.client.send(packet.return.channel, `**${packet.return.member}!**, here's your file!`, null, [new Discord.AttachmentBuilder(
                `./storage/${packet.authorID}/${file ? same_files[file] : same_files[0]}`, { name: `${file ? same_files[file] : same_files[0]}` } 
            )]).catch(async () => {
                return reject(this.client.send(packet.return.channel, `**${packet.return.member}!**, Something went wrong while fetching the file!`))
            }).then(() => {
                return resolve(packet)
            })
        })
    }

    async give(packet) {
        if (packet.command.toLowerCase() === '=fetch') 
            return this.fetch(packet)

        return this.file_save_queue.push(packet)
    }

    start() {
        return setInterval(() => {
            this.save(this.file_save_queue.shift())
        }, 5 * 1000)
    }
}