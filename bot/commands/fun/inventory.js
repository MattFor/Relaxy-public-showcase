'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'inventory',
    usage: '=inventory user (optional)',
    description: 'Shows your or the specified user\'s Relaxy inventory!\nThe numbers in front of the items represent the internal position of the item in the inventory.\nAfter doing **`=inventory`** you can say **equip/unequip/discard/scrap ITEM_ID** to do the action with the item.\nScrapping any item will gain you 100 money!',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const user = (await client.utils.member(message, args, 0))?.user ?? message.author
        const User = await client.module.database.User(user.id)

        if (message.author.id !== user.id || args.length !== 2) 
            return client.send(message.channel, null, [await client.module.profiles.getInventoryEmbed(message, user, User)])

        const actionType = args[0].toLowerCase()

        if (!['equip', 'unequip', 'discard', 'scrap'].includes(actionType))
            return new client.class.error('First argument is invalid, use: equip, unequip, discard, scrap!', interaction ?? message)

        const itemIndex = Number(args[1]) - 1

        if (isNaN(itemIndex) || !User.inventory[itemIndex])
            return new client.class.error('Item with this ID isn\'t present in your inventory!', interaction ?? message)

        const itemSplit = User.inventory[itemIndex].split('.')
        const itemType = itemSplit[itemSplit.length - 2]

        switch (actionType) {
            case 'equip':
                for (let i = 0; i < User.inventory.length; i++) {
                    const tempItemSplit = User.inventory[i].split('.')
                    if (tempItemSplit[tempItemSplit.length - 2] === itemType) 
                        User.inventory[i] = `${User.inventory[i].slice(0, User.inventory[i].length - 1)}X`
                }
                User.inventory[itemIndex] = `${User.inventory[itemIndex].slice(0, User.inventory[itemIndex].length - 1)}u`
                break
            case 'unequip':
                User.inventory[itemIndex] = `${User.inventory[itemIndex].slice(0, User.inventory[itemIndex].length - 1)}X`
                break
            case 'discard':
                User.inventory.splice(itemIndex, 1)
                break
            case 'scrap':
                User.inventory.splice(itemIndex, 1)
                User.money += 100
                User.markModified('money')
                break
        }

        User.markModified('inventory')
        await User.save()

        return client.send(message.channel, null, [await client.module.profiles.getInventoryEmbed(message, user, User)])
    }
}