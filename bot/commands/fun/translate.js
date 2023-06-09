'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    args: true,
    name: 'translate',
    usage: '=translate (to language) (from language) (text to translate)',
    description: 'Translates text from one language to another.\n**Available languages all use the `language name/ISO 639-1` code**\n',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!args[1] || !args[2]) 
            return new client.class.error('Too few arguments!', interaction ?? message)

        let lang1 = args.shift()
        let lang2 = args.shift()
        let flag = false

        const text = await client.imports.translator(args.join(' '), { from: lang1 , to: lang2 }).catch((e) => { return flag = e.message })

        return client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: 'Translation:',
            description: flag ? `There has been an error translating!\n**${flag}**` : text.text.slice(0, 2048),
        }])
    }
}