'use strict'

import Jimp from 'jimp'
import axios from 'axios'
import ascii_text from 'asciiart-logo'
import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const asciiChars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@']

/**
 * Get the ASCII character that corresponds to a color value.
 * @param {number} r - The red color value (0-255).
 * @param {number} g - The green color value (0-255).
 * @param {number} b - The blue color value (0-255).
 * @returns {string} - The corresponding ASCII character.
 */
const getAsciiCharacter = (r, g, b) => {
    const avgColor = (r + g + b) / 3
    const charIndex = Math.round(avgColor / 25.5)
    return asciiChars[charIndex] || '.'
}

const convertToAsciiArt = async (attachment) => {
    return new Promise(async(resolve, reject) => {
        try {
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            const buffer = response.data;
            
            const image = await Jimp.read(buffer);
            image.resize(100, Jimp.AUTO);
            const { width, height } = image.bitmap;
            const newHeight = Math.floor(height * (100 / width));
            image.resize(100, newHeight);
            
            let asciiArt = '';
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
                    const character = getAsciiCharacter(pixelColor.r, pixelColor.g, pixelColor.b);
                    if (character !== undefined)
                        asciiArt += character
                }
                asciiArt += '\n';
            }
            
            resolve(asciiArt);
        } catch(e) {
            reject(e.message);
        }
    })
}

export default {
    name: 'asciify',
    usage: '=asciify text',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('Text that will be asciified').setRequired(true)),
    description: 'Gives back an asciified version of the input. Input "big" first for bigger text.',
    cooldown: 2,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const attachment = message.attachments.first()

        if (!args[0] && !attachment)
            return new client.class.error('No input!', interaction ?? message)

        if (client.utils.censorCheck(args, guild))
            return

        if (attachment && message.author.id !== client.config.keys.owner)
            return new client.class.error('Cannot convert images!', interaction ?? message)
        
        if (attachment && message.author.id === client.config.keys.owner)
            return client.send(message.channel, null, [{
            color: client.data.embedColor,
            description: (await convertToAsciiArt(attachment)).slice(0, 2048)
        }])

        try {
            let isBig = false
            let font = ''

            if (args[0])
                if (args[0].toLowerCase() === 'big' || args[0].toLowerCase() === 'small') {
                    font = client.utils.firstLetterUp(args.shift())
                    isBig = true
                }

            if (args[0] && !attachment) {
                const renderedText = ascii_text({
                    name: args.join(' '),
                    font: isBig ? font : 'small',
                }).render()

                return client.send(message.channel, `\`\`\`\n${renderedText}\n\`\`\``).catch(e => {
                    return new client.class.error('Something went wrong while trying to send the text!', interaction ?? message);
                })
            }
        } catch {
            return new client.class.error('Something went wrong while trying to send the text!', interaction ?? message)
        }

        return new client.class.error('Critical error, please report whatever you did to the creator at MattFor#9884', interaction ?? message)
    }
}