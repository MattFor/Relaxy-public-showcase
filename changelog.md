# Changelog

## [Private_release]

### Goals

- Get the bot to be fully stable and ready for mass publishing around 2022

## [7.4.1] - 2021-09-05

### Added

- All base files

## [7.4.1A1] - 2021-09-05

### Changed

- VoiceFactory.js, replaced instances of string assigned to variable on line 37 with the variable name
- After finishing the recording the saved file is now deleted
- Updated gitignore to ignore logs/ folder

### Changed

- Changed how permissions are displayed to prevent just "." from displaying in the guildMemberUpdate 


## [7.4.1A2] - 2021-09-06

### Fixed

- Fixed Join/Leave logs in `Utilities.js` (line 295)

## [7.4.1A3] - 2021-09-06

### Upgraded

- Getters for channels, members, roles and users in `Utilities.js` (line 133)
### Planned changes

- Remaking leveling in Handler.js (line 97) [COMPLETED]

## [7.4.2] - 2021-09-07

### Rewrote

- Leveling in `Handler.js` (line 97) (Planned from last version [7.4.1A3])

### Updated

- `Devlog.ini` to feature all changes from this file up to this point


## [7.4.2A1] - 2021-09-07 22:23

### Fixed

- `messageUpdate.js` breaking when a message without a previous image had one added (line 25;119)

- `buy.js` (line 49) and `lvl.js` (line 38), removed `this.` before `client` so that it doesn't make the programs not start at all now!

- error in calculating the guild rank caused by using an await in Promise.all() function (line 210;76) in `Handler.js`


## [7.4.2A2] - 2021-09-07 23:49

### Added

- check to see whether first input is a number in `modlogoptions.js` (line 63) so it doesn't error all the time when just typing the command


## [7.4.2A3] - 2021-09-08 18:23

### Changed

- `_calculateGuildRank()` in `ProfileManager.js` (line 233), now uses less input variables

### Fixed

- leveling now correctly displays rank information in Handler.js **(in other files the variable wasnt dynamically changed thus didin't need to be saved before fetching)**


## [7.4.2A4] - 2021-09-09 09:12

### Removed

- Hidden rate limiter in message.js


## [7.4.3] - 2021-09-11 23:59

### Changed

- Heartboard posts now show images and every other file type separately instead of image and video only `Mainfactory.js` - `HeartBoardPostEmbed()`

### Fixed

- The function showing guild rank in `=lvl` and in leveling in `Handler.js`


## [7.5.0] - 2021-09-16-17 00:00

### Added

- `=warn`
- 4 more hug gifs, 1 more pat gif for `=pat` and `=hug`

### Changed

- `Server.js` default player option "safe search" default is now **True** (line 169)
- Static value of 2 in `RelaxyManager.js` now changed to dynamic shard number from `key.ini` (line 641)
- The code of slash command activation in `Client.js` 
- Completely rewrote leveling in `Handler.js`
- The way I make `=devlog` changes made
- All `await client.save` in the code to just `client.save`

### Updated

- The look of `=warnings`
- `=thanks` (credits.ini)
- `server_join.ini` in bot/configuration
- `help_special_exceptions.ini` in bot/configuration

### Optimized

- `_calculateGuildRank()` in `ProfileManager.js`
- The event choosing in for the **voiceStateUpdate** event

### Fixed

- Heartboardpost creation in `Mainfactory.js` (line 37)
- Link in `=invite` to invite Relaxy has added permission for **/** commands
- `=leavevc` has a new *=dc* alias
- `=spank` now works
- Weird file name inaccuracies
-`Handler.js` (line 387) added [0] to the **indexOf(`${user_bans_split[0]}**

### Removed

- Logging of the Relaxy role id in `Handler.js` (line 431) (also in the blueprint of the Guild database Mongoose Document [line 154])
- All remaining logs so they don't clog up the repo in logs/


## [8.0.0A1] - 2021-10-09 23:39

### Fixed

- The ability to play files
- How files are displayed on =song

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request


## [8.0.0A2] - 2021-10-10 21:04

### Fixed

- =cmm usage in =help cmm saying "usage: =cmmm"
- =buy not responding when saying f.e =buy w e
- =privatechannel not working
- relaxy not being able to search spotify songs along with reverbnation, facebook and some more
### Upcoming 
- i will be able to write detailed explanations in the resposes from =request


## [8.0.0A3] - 2021-10-15 10:33

### Upgraded
- =lookup

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request
- i will fix =goto and /goto


## [8.0.0A3] - 2021-10-16 00:04

### Fixed

- =skip (not the slash command) no longer requires a number input to work
- =play and /play now work when adding a track when the queue is already running (lmao)
- Relaxy! no longer emmits "queue ended" and "channel empty" at the same time
- the internal equivalent of the /stats that shows how many users are actively using the bot / memory usage stuff
  and active queues along with the process uptime has been fixed so it works now, lol

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request
- i will fix =goto and /goto


## [8.0.0A4] - 2021-10-19 16:43

### Fixed

- =warn
- some internal console improvements

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request
- i will fix =goto and /goto


## [8.0.1] - 2021-10-23 18:00

### Added

- /goto

### Fixed

- =warn not responding on first warn despite actually logging the warning
- =goto was out of the game but now it's back fully working although the waiting time is still long
- playererror resource ended shouldn't happen now

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request


## [8.0.2] - 2021-11-05 22:00

### Added

- =goto + /goto
- =request now should in big quotes, work properly

### Fixed

- "queue ended" message not showing up
- updated modules causing you to be unable to play music on your bot


## [8.0.3] - 2021-11-13 01:30
### Fixed

- "[PlayerError] Resource has already ended." is gone forever, reduced to atoms, enjoy the music while it is not yet broken!### Security

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request


## [8.0.3A1] - 2021-11-13 02:40

### Added

- full queue time on =queue and /queue
### Fixed

- =p and /play now plays playlists 

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request


## [8.0.3A2] - 2021-11-15 22:58

### Added

- buffering cooldown in relaxy music options, default 1300, how much time before music starts playing after typing the command, gives it time to process correctly, recommended about 2000-3000

### Fixed

- music quality being subpar
- slash commands sometimes failing

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request
- a bugged response "error 503" has been identified and i'm working on resolving that!
- filters being readded
- having a separate version of the bot to work on


## [8.0.4] - 2021-11-16 16:40

### Added

- Total queue time to =queue and /queue
- buffering cooldown in relaxy music options, default 1300, how much time before music starts playing after typing the command, gives it time to process correctly, recommended about 2000-3000

### Changed

- =queue and /queue now shows 6 songs per page (feature not bug i swear)

### Fixed

- /shuffle and =shuffle not actually shuffling the second song in the queue
- resource ended message on music
- /queue and =queue no longer cuts the second track in queue
- music quality being subpar
- slash commands sometimes failing

### Upcoming 
- i will be able to write detailed explanations in the resposes from =request
- a bugged response "error 503" has been identified and i'm working on resolving that!
- filters being readded
- having a separate version of the bot to work on


## [8.0.6A1] - 2021-12-26 04:00

### Fixed

- /volume now works
- /play and =play now properly work with non-youtube playlists :P
- /play and =play now properly play after starting, searchign for 
  a track with no results, then trying to play something else
- =request now fully works, can provide a response
- [A1] =play and /play now correctly plays single songs inside playlist
- [A2] =play and /play now correctly play a single playlist song when added to queue

### Changed

- [Mk3&Mk4] internal code optimizations and changes

### Upcoming

- =graph display a mathematical equation graphically
- voice recording back in the bot

### Known Issues
- sometimes when playing music, after a song ends the bot doesn't play
  another one and dies [Don't know what causes this yet]
- user count keeps ticking up over time for some reason


## [8.0.7] - 2022-01-05 10:47

### Changed

- almost all files in the bot updated to new standard.

### Fixed

- =repeat and /repeat now work properly.
- [Mk1] console command to display servers works properly now.
- [Mk2] Music randomly stopping during playlists should be fixed now.

### Removed

- removed some internal loggers.

### Upcoming

- =graph display a mathematical equation graphically
- voice recording back in the bot

### Known Issues
- sometimes when playing music, after a song ends the bot doesn't play
  another one and dies [~~Don't know what causes this yet~~] (Seemingly fixed)
- user count keeps ticking up over time for some reason (it's like off by 5 from the actual count)


## [8.0.8] - 2022-01-24 00:26

### Progress

- [Mk1] (2022-01-24 11:05) cleaned up voice recording files, preparing to implement it sometime soon

### Updated

- [Mk1] (2022-01-24 11:05) all occurences of setFooter and setAuthor have been updated to new discord.js standards

### Fixed

- optimized welcome message handling
- =mute now works properly

### Upcoming

- =graph display a mathematical equation graphically
- voice recording back in the bot

### Known Issues
- sometimes when playing music, after a song ends the bot doesn't play
  another one and dies [~~Don't know what causes this yet~~] (Seemingly fixed)
- user count keeps ticking up over time for some reason (it's like off by 5 from the actual count)


## [8.0.9] - 2022-02-05 20:49

### Progress

- cleaned up voice recording files, preparing to implement it sometime soon

### Fixed

- [Mk1] (2022-02-06 22:55) =play now works properly when playing attachment from link
- =lyrics now should function properly

### Known Issues
- sometimes when playing music, after a song ends the bot doesn't play
  another one and dies [~~Don't know what causes this yet~~] (Seemingly fixed)
- user count keeps ticking up over time for some reason (it's like off by 5 from the actual count)

## [8.1.0] - 2022-10-27 18:30

### Progress

- Relaxy is alive again!
- Relaxy's support server is also alive again! Get on with =invite!
- Internal files have been renamed to their actual specifications

### Fixed

- Welcome messages constantly changing back and forth after being edited
- Leveling is now completely fixed
- =preview not working with titles
- =play not working has been fixed
- =snake had too much redundant code
- =rep+ now works on Relaxy himself
- =image is now working properly
- Inventory managing has been fixed

### Changed 

- In all embed making commands to have a newline type ~= instead of just = (broke embedded links)

### Upcoming

- Overhaul and general fixing of image related commands
- Fixing =search =lockdown =remindme =reminds as well as =translate
- Adding =graph
- Generally removing and merging redundant commands as well as making more / commands
- Possibly readding voice recording
- Adding permissions that show when doing =roleinfo

### [9.0.0] 2022-11-19 21:00

### Progress

- Now running on the latest nodeJS version v19.0.0
- Relaxy updated to discord.js v14.6.0
- Most commands received a / version
- Music player updated
- =image updated
- Massive refactoring of basically everything
- Standardized time formatting and embed formatting across the code

### Recoded

- Everything to do with custom embeds
- Internal modlog code
- Internal slash command code
- Upgraded the music module

### Added

- error when trying to play live videos
- =reddit | Search Your favourite subreddit for a random post!
- =search | choose the song you want!
- / command options for all music commands commands.

### Removed

- =censoradd (merged with =censor)
- =wmreactedit (merged with =wmreact)
- =removeprefix, =changeprefix (merged with NOW RENAMED =addprefix -> =prefix)
- =rtime renamed to =ping
- "uwu" from =spank description

### Upcoming

- More slash command with the following update each category will 
  receive a full suite of / commands


### [9.1.0] 26-11-2022 23:10

### Fixed

- [9.1.1Mk1] Member Updated modlog event role change / status change fixed
- [Mk2] -> [9.1.1] requests
- [Mk2] Message Edited modlog event
- =disablecommand not displaying a returning message
- =redirect not working
- =leveling not actually saving to the database
- / commands having weird interactions with music
- some internal functions and optimizations
- =request is now working properly

### Removed

- =graph
- =decimate (now =remake)
- =throw (now =disconnect)

### Added

- [Mk1] =mutes
- / command for =throw (now =disconnect)
- some other command I forgot the name of

### Improved

- =request now shows what server the message came from
- all embed making functions will now catch errors better


### [9.2.0] 14-12-2022 1:03

### Progress

- added HOT RELOADING! no more massive Relaxy downtimes when it's being worked on!
- many internal code improvements and more to come 

### Fixes

- =help now can accept upper case command names
- =request fixed and updated
- =leaderboard updated
- =redirect now works
- =remake now works
- =warn now works
- =lyrics now doesn't delete a message, instead it updates the one it sent
- many modlog event improvements and more to come

### Upcoming Changes

- =help will have pages to look through
- =modlogoptions overhaul


### [10.0.0] 04-02-2023 00:00

### Progress

- member/channel/user/role search algorithm *significantly* improved
- every single interaction possible made more clear to the user
- internal code optimizations to the extreme
- most command that had the ability to add people to some sort of list
  now are able to display those people/roles by doing the command with no arguments

### Improved

- Relaxy sharding manager has been significantly improve [+ added console color but that's for me :)]
- music player compression algorithm improved
- =except -> =exempt fixed typo and improved the command
- =redirect fixed it and added forum functionality
- =unmute made easier to use
- =lockdown made easier to use
- =censor works better
- =help command interface improved
- =lovemeter fixed
- =clearchannel works better now
- heartboards now give a link to the original message whenever possible
- Relaxy will not say 2 things at once when leaving the channel after playing music

### Added

- =autorole - add role(s) to a user exactly when they join
- =user - make only selected people/roles able to use Relaxy
- =forum - make your own moderation forum [very sophisticated, check out the help page]
- =getemoji - get any custom emoji/sticker as a gif
- warning when playing age restricted yt videos

### Removed

- =cleanse -> =clean all
- =unbind -> =restrict unbind
- =disablecommand -> =disable

### Internal

- CrashHandler -> EventManager
- debug logging for music player
- improved ChannelDelete

### Upcoming

- merge =reminds and =remindme
- improve music player
- fix every bug that comes up
- making it so age restricted videos are able to be player
- fixing the mysterious 'aborted' error that happens at random when playing music
- whatever is suggested

### [11.0.0] 11-02-2023 02:00

### Progress
- Relaxy is now supported on Patreon and will try to stay up as much as possible 24/7
- ready for mass public use

### Fixed
- all image commands work again
- =user lists not working properly
- completely and utterly fixed =forum
- =purge
- =mute

### Internal
- FileWatchManager fixed, now shows added files and core part updates
- now using complex cluster sharding system reducing memory usage by 90%
- now using sharding for the web manager, highly reducing the music module
- now using fetch-on-the-spot instead of precaching everything
- changed member / user searching algorithms [had to]
- added numerous events to watch out for rate limitations

### Updated
- everything to do with warnings, they now save to the database along with the reason
- =forum expanded to allow for absolute control over the forum you want to have

### Removed
- =log [Noone ever used this]

### [11.2.0] 14-02-2023 21:00

### Progress
- massive database fetching optimizations, no longer fetching everything at once [AVG CPU 30->10]
- denying a forum post now shows the post name in question

### Changed
- internal welcome message refresh timer 20 minutes -> 5 minutes

### Fixed
- =request now works
- =pskip works (better)
- =q displays correct amount of songs in the queue and allocates time more accurately
- Relaxy correctly identifies when it should leave the channel now

### [11.5.0] 18-02-2023 02:00

### Progress
- reorganized the image file structure
- lots of little algorithm optimizations

### Upgraded
- modlogs have been internally overhauled and now have 6 new events and every existing one has been improved
 StickerCreate StickerUpdate StickerDelte
 ChannelPinsUpdate ThreadCreate ThreadDelete
- censoring, autobanning and autorenaming has been improved
- =warn now saves the reason to the database
- autobanning now gives an actual reason when banning / warning
- =pat and =hug will not have missing links anymore
- =censor now accepts 'links' and 'invites' to block those (also works when messages are edited now)
- autorenaming now works not only when people join

### Fixed
- all image commands now work
- welcomechannel fixed
- welcomemessages fixed

### Changes
- autoroles now give a reason and trigger on joining the server, not sending a message


### [12.0.0] 04-05-2023 2:00

### Biggest update so far!

### Improvements
- things to save to the database no longer modified inefficiently 
- no more garbage code inside of the cluster manager
- removed useless garbage code
- #relaxy-log now improved by a lot
- the censoring algorithm is now improved by a lot
- moved administrator commands into their own directory
- all commands now support being converted into / commands over time

### Added
- =rename - change the name of any role, user or channel!
- =raidprotection - =lockdown but more (or less) extreme!
- a lot of new modlog events
- =autorole - give a role to everyone who joins automatically
- =record and =halt - voice recording coming back from the dead after being for for like a year or two!
- low spam mode for modlogs, access it with =modlog lowspam

### Updated
- completely overhauled how things are saved into the database preventing save delay.
- updated user search detection algorithm so that it works like it did before switching to hybrid sharding
- all channels that send messages to different channels to account for new channel types
- =clean -> =free
- =lookup -> =whois
- =lvlout -> =levelout
- UserFileInteractionManager.js -> FileInteractionManager.js 

### Fixed
- modlogs will no longer be turned off after being redirected to another channel while the original is deleted
- Relaxy! will no longer leave channels while music is playing because he detects the channel as empty / music as invalid
- leveling counts even if in a restricted channel
- =help additional information not displaying correctly
- =myman and =drip not working

### Changed
- many more commands will now show the information about their status when put without arguments instead of simply turning those features off. It will be updated for consistency later

### Removed
- the ability for Relaxy to send a message across ALL servers

### Upcoming 
- =warningtier - set your own punishments!
- =appealchannel - now sinners can come back!