'use strict'

import fs from 'fs-extra'
import Discord from 'discord.js'
import Relaxy from '../Relaxy.js'
import Recorder from '../VoiceRecorder/Recorder.js'
import { createAudioPlayer, createAudioResource } from '@discordjs/voice'

const path = './logs/recordings/'
const recording_stop_mp3 = './additions/sounds/stoprecord.mp3'
const recording_start_mp3 = './additions/sounds/startrecord.mp3'

export default class VoiceFactory {
    /**
     * Handle voice recordings.
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client
        this.files_to_remove = {}
        this.recorder = new Recorder(undefined, this.client)
    }

    /**
     * Record a user in a voice channel
     * @param {Discord.Message} message 
     */
    async Record(message, interaction) {
        if (!message.member.voice.channel || message.member.voice.channel.type !== Discord.ChannelType.GuildVoice) 
            return new this.client.class.error('Invalid/no vc to connect to!', message)

        const existingQueue = this.client.module.music.getQueue(message.guild.id)
        if (existingQueue &&  (existingQueue?.playing || existingQueue?.state !== 'idle'))
            return new this.client.class.error('ActiveQueue', interaction ?? message)

        const queue = this.client.module.music.createQueue(message, await this.client.module.database.Guild(message.guild.id), { autoSelfDeaf: false })
            
        try {
            await queue.connect(message.member.voice.channel)  
        } catch {
            return new this.client.class.error('Couldn\'t connect to your voice channel!', interaction ?? message)
        }

        if (!queue && message.guild.me.voice.serverDeaf)
            return new this.client.class.error('Cannot record while server deafend!', interaction ?? message)
        
        queue.setState('recording')
        new this.client.class.error(`description Now recording in **${message.member.voice.channel}** bound from ${message.channel}!`, interaction ?? message)
        this.files_to_remove[`${message.guild.id}player`] = createAudioPlayer()

        if (!fs.existsSync(`${path}${message.guild.id}`))
            fs.mkdirSync(`${path}${message.guild.id}`)
        if (!fs.existsSync(`./logs/saved_recordings/${message.guild.id}`))
            fs.mkdirSync(`./logs/saved_recordings/${message.guild.id}`)
        fs.emptyDir(`${path}${message.guild.id}/`, async () => {})

        queue.connection.voiceConnection.subscribe(this.files_to_remove[`${message.guild.id}player`])
        this.files_to_remove[`${message.guild.id}player`].play(createAudioResource(recording_start_mp3))

        if (message?.guild?.me?.voice?.serverDeaf)
            return this.Halt(message, interaction, false, false, true)

        this.recorder.startRecording(queue.connection.voiceConnection, message.guild.id)
    }

    async Halt(message, interaction = null, leftChannel = false, fileSizeTooLarge = false, serverDeafened = false) {
        let queue = this.client.module.music.getQueue(message.guild.id)

        if (!(message?.guild?.me?.voice || !queue.state !== 'recording')) 
            return new this.client.class.error('Nothing\'s being recorded!', interaction ?? message)

        const finalFilePath = `${path}${message.guild.id}/${message.guild.id}.mp3`
        const successfullyRecorded = await this.recorder.getRecordedVoice(fs.createWriteStream(finalFilePath), message.guild.id, 'single', 5)

        this.recorder.stopRecording(queue.connection, message.guild.id)

        if (!successfullyRecorded) {
            try {
                queue.destroy(true)
                delete this.files_to_remove[`${message.guild.id}player`]
            } catch {}

            return new this.client.class.error('Nothing was recorded! Cannot provide a file.', interaction ?? message) 
        }
    
        queue.connection.voiceConnection.subscribe(this.files_to_remove[`${message.guild.id}player`])
        this.files_to_remove[`${message.guild.id}player`].play(createAudioResource(recording_stop_mp3))


        delete this.files_to_remove[`${message.guild.id}player`]
        queue.setState('idle')

        let endReason = serverDeafened ? '\n(I got server deafened, can\'t record!)' : 
            fileSizeTooLarge ? '(The file went over 25mb)' : 
            leftChannel ? '(All of the users left the channel)' : ''

        await this.client.send(message.channel, `Here\'s your recording!${endReason}`, null, [
            new Discord.AttachmentBuilder(finalFilePath, { name: 'recording.mp3' })
        ]).catch(() => {
            new this.client.class.error('Cannot send the file! It\'s too large.', interaction ?? message)
        })

        setTimeout(() => {
            try {
                queue.destroy(true)
                fs.unlinkSync(finalFilePath)
            } catch {}
        }, 2000)
    }
}