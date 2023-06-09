import Discord from 'discord.js'
import Relaxy from '../../Relaxy.js'


export default class Snake {

    /**
     * Construct a snake game.
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     */
    constructor(client, message, guild) {
        this.guild = guild
        this.client = client
        this.user
        this.member
        this.message = message
        this.snake = [{ x: 5, y: 5 }]
        this.snakeLength = 1
        this.apple = { x: 1, y: 1 }
        this.score = 0
        this.WIDTH = 15
        this.HEIGHT = 10
        this.s = 0
        this.INTERVAL = setInterval(() => {
            this.s++
        }, 1);
        this.gameBoard = []
        this.gameEmbed = null
        for (let y = 0; y < this.HEIGHT; y++)
            for (let x = 0; x < this.WIDTH; x++)
                this.gameBoard[y * this.WIDTH + x] = '🟦'
        this.init(message)
    }

    gameBoardToString() {
        let str = ''
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                if (x == this.apple.x && y == this.apple.y) {
                    str += '🍎'
                    continue
                }
                let flag = true
                for (let s = 0; s < this.snake.length; s++)
                    if (x == this.snake[s].x && y == this.snake[s].y) {
                        str += '🟩'
                        flag = false
                    }
                if (flag)
                    str += this.gameBoard[y * this.WIDTH + x]
            }
            str += '\n'
        }
        return str
    }

    /**
     * Find whether the snake is in itself.
     * @param {Object} pos 
     */
    isLocInSnake(pos) {
        return this.snake.find(sPos => sPos.x == pos.x && sPos.y == pos.y)
    }

    /**
     * Give the apple a new location.
     */
    newAppleLoc() {
        let newApplePos = { x: 0, y: 0 }
        do {
            newApplePos = { x: parseInt(Math.random() * this.WIDTH), y: parseInt(Math.random() * this.HEIGHT) }
        } while (this.isLocInSnake(newApplePos))
        this.apple.x = newApplePos.x
        this.apple.y = newApplePos.y
    }

    /**
     * Initiate a snake game
     * @param {Discord.Message} msg 
     * @returns {Promise}
     */
    async init(msg) {
        if (!this.client.data.snakeGameChannelIds.includes(msg.channel.id))
            this.client.data.snakeGameChannelIds.push(msg.channel.id)
        else 
            return this.client.send(msg.channel, null, [{
                color: this.client.data.embedColor,
                description: `A snake game is already present on ${msg.channel}.\nSnake has been limited to 1 per channel due to Discord's rate limitations.`
            }])

        this.user = await this.client.module.database.User(msg.author.id)

        if (this.guild.plugins.leveling.enabled)
            this.member = await this.client.module.database.Member(msg.author.id, msg.guild.id)

        this.score = 0

        this.snakeLength = 1

        this.snake = [{ x: 5, y: 5 }]

        this.newAppleLoc()

        const embed = new Discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setTitle(`Snake                  Score: ${this.score ? this.score : 0}`)
            .setDescription(this.gameBoardToString())
        this.client.send(msg.channel, null, [embed]).then(emsg => {
            this.gameEmbed = emsg
            let i = 0
            let g = setInterval(() => {
                if (i >= 4) {
                    clearInterval(g)
                    return g = null
                }
                this.gameEmbed.react(this.client.config.emojiCollections.snake[i])
                i++
            }, 755)
            return this.waitForReaction()
        })
    }

    /**
     * Complete a game cycle.
     */
    step() {
        if (this.apple.x == this.snake[0].x && this.apple.y == this.snake[0].y) {
            this.score += 1
            this.snakeLength++
                this.newAppleLoc()
        }
        const editEmbed = new Discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setTitle(`Snake                  Score: ${this.score ? this.score : 0}`)
            .setDescription(this.gameBoardToString())

        this.client.edit(this.gameEmbed, null, [editEmbed]).catch(() =>{})
        return this.waitForReaction()
    }

    /**
     * End this.
     * @returns {Discord.Message}
     */
    async gameOver() {
        this.client.data.snakeGames.splice(this.client.data.snakeGames.indexOf(this.message.author.id), 1)
        this.client.data.snakeGameChannelIds.splice(this.client.data.snakeGameChannelIds.indexOf(this.message.channel.id), 1)
        clearInterval(this.INTERVAL)
        this.INTERVAL = null
        const exp = Math.floor(Math.random() * 12 * this.score)
        const money = Math.floor(Math.random() * 17.5 * this.score)
        const editEmbed = new Discord.EmbedBuilder()
            .setColor(this.client.data.embedColor)
            .setImage('https://cdn.discordapp.com/attachments/778167112380317717/820304957328326656/80.jpg')
            .setTitle(`**Your score is: ${this.score} - earned ${exp} exp and ${money} money!**`)
        this.client.edit(this.gameEmbed, null, [editEmbed]).catch(() =>{})

        this.user.exp += exp
        this.user.money += money

        if (this.guild.plugins.leveling.enabled) {
            this.member.exp += exp
            this.member.markModified('exp')
            await this.member.save()
        }

        this.user.markModified('exp')
        this.user.markModified('money')

        await this.user.save()

        return this.gameEmbed.reactions.removeAll()
    }

    /**
     * See whether the right person reacted and the right reactions were used.
     * @param {Discord.MessageReaction} reaction 
     * @param {Discord.User} user 
     * @returns {Boolean}
     */
    filter(reaction, user) {
        return ['⬅️', '⬆️', '⬇️', '➡️'].includes(reaction.emoji.name) && user.id !== this.gameEmbed.author.id
    }

    /**
     * Wait for a new reaction to the game embed.
     */
    waitForReaction() {
        this.gameEmbed.awaitReactions({ filter: (reaction, user) => this.filter(reaction, user) && user.id === this.message.author.id, max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const Reaction = collected.first()
                if (this.s < 755) {
                    Reaction.users.remove(Reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first().id)
                    return this.waitForReaction()
                }
                const snakeHead = this.snake[0]
                const nextPos = { x: snakeHead.x, y: snakeHead.y }
                switch (Reaction.emoji.name) {
                    case '⬅️':
                        {
                            let nextX = snakeHead.x - 1
                            if (nextX < 0)
                                nextX = this.WIDTH - 1
                            nextPos.x = nextX
                            break
                        }
                    case '⬆️':
                        {
                            let nextY = snakeHead.y - 1
                            if (nextY < 0)
                                nextY = this.HEIGHT - 1
                            nextPos.y = nextY
                            break
                        }
                    case '⬇️':
                        {
                            let nextY = snakeHead.y + 1
                            if (nextY >= this.HEIGHT)
                                nextY = 0
                            nextPos.y = nextY
                            break
                        }
                    case '➡️':
                        {
                            let nextX = snakeHead.x + 1
                            if (nextX >= this.WIDTH)
                                nextX = 0
                            nextPos.x = nextX
                            break
                        }
                }
                Reaction.users.remove(Reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first().id).then(async () => {
                    if (this.isLocInSnake(nextPos))
                        return this.gameOver()
                    else {
                        this.snake.unshift(nextPos)
                        if (this.snake.length > this.snakeLength)
                            this.snake.pop()
                        return this.step()
                    }
                })
            })
            .catch(() => {
                return this.gameOver()
            })
    }
}