'use strict'

import axios from 'axios'
import Mongoose from 'mongoose'
import Discord from 'discord.js'
import mix, { checkSupported } from 'emoji-mixer'
import Relaxy from '../../../src/Relaxy.js'

async function downloadImage(url) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
    });
    
    return response.data;
}

export default {
    name: 'mixemoji',
    aliases: ['emojimix'],
    args: true,
    permissionsBOT: ['EMBED_LINKS'],
    description: '```diff\n- Nitro emojis not supported -\n```Merge multiple emojis into one, some do not work.\nIf you use the \'wand\' emoji, you will the get the \'blob\' version.',
    usage: '=mixemoji emoji1 emoji2',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        for (let i = 0; i < args.length; i++)
            if (!checkSupported(args[i]))
                return new client.class.error(`Emoji ${i + 1} is not supported!`, message)

        const url = mix(args[0], args[1])

        if (!url) 
            return new client.class.error('Something went wrong! These emojis might not be supported', message)

        downloadImage(url).then(buffer => {
            client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Here\'s your emoji',
                url: 'https://www.npmjs.com/package/emoji-mixer',
                image: { url: 'attachment://emoji.png' }
            }], [
                new Discord.AttachmentBuilder( 
                    buffer, { name: 'emoji.png' }
                )
            ])
        })
    }
}