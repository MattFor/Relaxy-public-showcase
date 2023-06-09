'use strict'


import fixer from 'dirty-json'
import { normalizeWhiteSpaces } from 'normalize-text'
import Relaxy from '../../../Relaxy.js'
import embed from '../../../../bot/commands/miscellaneous/embed.js'


const exceptions = [
    'icon_url',
    'fields',
    'name',
    'description',
    'thumbnail',
    'image',
    'author',
    'url',
    'title',
    'color',
    'footer',
    'timestamp',
    'text'
]


export default class CustomEmbed {
    /**
     * Get data and turn it into an embed
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client

        this.data = null
    }


    async createFromText(args) {
        await new Promise(async(resolve, reject) => {
            this.data = `{${args.join(' ')}}`

            this.data = this.data.replaceAll("'", '"').replaceAll('//', '\/\/').replaceAll("'", '"').replaceAll('\r\n', '').replaceAll('\n', '')
            .replaceAll('~=', '--DOWNSPACE--').replaceAll("[[", "FLAG[").replaceAll("{{", "FLAG{").replaceAll("((", "FLAG(").replaceAll("]]", "FLAG]")
            .replaceAll("}}", "FLAG}").replaceAll("))", "FLAG)")        
            
            let exceptions_matches = this.data.match(/\"(.*?)\"/g)

            if (exceptions_matches) {
                let exceptions_matches_len = exceptions_matches.length
                for (let o = 0; o < exceptions_matches_len; o++)
                    for (let p = 0; p < 13; p++)
                        if (!exceptions_matches[o].includes(exceptions[p]))
                            this.data = this.data.replace(exceptions_matches[o], `${exceptions_matches[o].replaceAll(' ', '+++').replaceAll('|', '888888').replaceAll(';;', '--TTTTewdqccrfqw--')}`)
            }

            let embed_object = await this.objectify()

            if (embed_object === undefined || Object.entries(embed_object) === []) {
                this.data = undefined
                return reject(this.data)
            }

            if (embed_object.color)
                embed_object.color = parseInt(embed_object.color.toLowerCase().replace('#', ''), isNaN(embed_object.color) ? 16 : 10)

            if (embed_object.timestamp)
                embed_object.timestamp = new Date()

            this.data = embed_object

            return resolve(this.data)
        })
    }


    async createFromFile(message) {
        await new Promise((resolve, reject) => {
            if (!this.client.imports.fs.existsSync(`./storage/${message.author.id}`))
                this.client.imports.fs.mkdirSync(`./storage/${message.author.id}`)

            let current_time = Date.now()
            let attachment = message.attachments.first()

            if (!attachment.contentType.includes('text'))
                reject(this.data)

            let stream = this.client.imports.request.get(attachment.url)
                .pipe(this.client.imports.fs.createWriteStream(`./storage/${message.author.id}/${current_time}.txt`))

            let file_watcher = null

            stream.on('finish', () => {
                file_watcher = setInterval(() => {   
                    if (this.client.imports.fs.existsSync(`./storage/${message.author.id}/${current_time}.txt`) && 
                        this.client.imports.fs.statSync(`./storage/${message.author.id}/${current_time}.txt`).size > 15) {

                        clearInterval(file_watcher)
                        
                        setTimeout(() => { 
                            this.client.imports.fs.unlinkSync(`./storage/${message.author.id}/${current_time}.txt`) 
                        }, 10000)

                        this.data = `{${this.client.imports.fs.readFileSync(`./storage/${message.author.id}/${current_time}.txt`, 'utf-8').toString()                            .replaceAll("'", '"').replaceAll('//', '\/\/').replaceAll("'", '"').replaceAll('\r\n', '').replaceAll('\n', '')
                        .replaceAll('~=', '--DOWNSPACE--').replaceAll("[[", "FLAG[").replaceAll("{{", "FLAG{").replaceAll("((", "FLAG(").replaceAll("]]", "FLAG]")
                        .replaceAll("}}", "FLAG}").replaceAll("))", "FLAG)")}}`

                        let exceptions_matches = this.data.match(/\"(.*?)\"/g)

                        if (exceptions_matches) {
                            let exceptions_matches_len = exceptions_matches.length
                            for (let o = 0; o < exceptions_matches_len; o++)
                                for (let p = 0; p < 13; p++)
                                    if (!exceptions_matches[o].includes(exceptions[p]))
                                        this.data = this.data.replace(exceptions_matches[o], `${exceptions_matches[o].replaceAll(' ', '+++').replaceAll('|', '888888').replaceAll(';;', '--TTTTewdqccrfqw--')}`)
                        }

                        this.data = this.data.replaceAll('botver', this.client.config.keys.version)

                        let embed_object = this.objectify()

                        if (!embed_object || Object.entries(embed_object) === []) {
                            this.data = undefined
                            return reject(this.data)
                        }

                        if (embed_object.color)
                            embed_object.color = parseInt(embed_object.color.toLowerCase().replace('#', ''), isNaN(embed_object.color) ? 16 : null)

                        if (embed_object.timestamp)
                            embed_object.timestamp = new Date()

                        this.data = embed_object

                        return resolve(this.data)
                    }
                }, 1000)
            })
        })
    }


    objectify() {
        try {
            let convertedText = normalizeWhiteSpaces(this.data)

            convertedText = normalizeWhiteSpaces(this.data).replace('export default', '').replace(/(\r\n|\n|\r)/gm, '').replace(/ /g, '').replace(/"/g, '').replace(/'/g, '')
            .replace(/{/g, '{"').replace(/}/g, '"}').replace(/:/g, '":"').replace(/,/g, '","')
            .replace(/:"{/g, ':{').replace(/}"}/g, '}}').replace(/}","{/g, '},{').replace(/]"}/g, ']}')
            .replace(/:"\[/g, ':["').replace(/]",/g, '],').replace(/],/g, '"],').replace(/]}/g, '"]}')
            .replace(/\(/g, '("').replace(/\)/g, '")').replace(/"{/g, '{').replace(/}"/g, '}').replaceAll('""', '').replaceAll(',}', '}').replaceAll('"https":"//', '"https://')
            .replaceAll(',]', ']').replaceAll("+++", " ").replaceAll('888888', "'").replaceAll('--TTTTewdqccrfqw--', ':')
            .replaceAll('--DOWNSPACE--', '\n').replaceAll('<>', ',').replaceAll('("', "(").replaceAll('")', ')')
            .replaceAll('FLAG"', 'FLAG').replaceAll('in', '\in').replaceAll('FLAG]}', 'FLAG]').replaceAll('FLAG)}', 'FLAG)').replaceAll('FLAG}}', 'FLAG}')
            .replaceAll('FLAG[', '[').replaceAll('FLAG]', ']').replaceAll('FLAG{', '{').replaceAll('FLAG}', '}').replaceAll('FLAG(', '(').replaceAll('FLAG)', ')')

            return this.data = fixer.parse(convertedText)
        } catch {
            return this.data = undefined 
        }
    }
}