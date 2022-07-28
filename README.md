<h1 align="center" style="font-size: 60px">DisCloud</h1>

<p align="center"><strong>Unlimited Cloud Storage using Discord</strong></p>

<p align="center">
  <img alt="Stars" src="https://badgen.net/github/stars/napthedev/discloud">
  <img alt="Forks" src="https://badgen.net/github/forks/napthedev/discloud">
  <img alt="Issues" src="https://badgen.net/github/issues/napthedev/discloud">
  <img alt="Commits" src="https://badgen.net/github/commits/napthedev/discloud">
</p>

## Live demo

Official website: [https://discloud-storage.herokuapp.com/](https://discloud-storage.herokuapp.com/)

## Setup Guide

- Go to [railway.app](https://railway.app/) or [redis.com](https://redis.com/) and create a new redis instance. Copy the connection URL and use as `REDIS_URL` environment variable
- Go to [discord](https://discord.com) and create a new server
- Go to [discord developer](https://discordapp.com/developers/applications/me) to create a bot
  - Go to "Bot" tab and create a new bot
    - Click "Reset token" and copy the new token, use it as `DISCORD_BOT_TOKEN` env
  - Copy the "APPLICATION ID"
- Go to this link to add the bot to your server [https://discordapp.com/oauth2/authorize?client_id={CLIENT_ID}scope=bot&permissions=0](https://discordapp.com/oauth2/authorize?client_id={CLIENT_ID}&scope=bot&permissions=0) (Replace {CLIENT_ID} with the "APPLICATION ID" you have copied earlier)
  - Select the server you want and authorize
- Go to the server and create a new channel, right click and copy the channel id, use it as `DISCORD_CHANNEL_ID` env
- Run `npm i`
- Run `npm run dev`

## Deployments

[![heroku](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy/?template=https://github.com/napthedev/discloud)  
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/Q1KklM?referralCode=YiZaHP)

#### With docker

```bash
docker run -dp 80:5000 --env REDIS_URL={REDIS_URL} --env DISCORD_BOT_TOKEN={DISCORD_BOT_TOKEN} --env DISCORD_CHANNEL_ID={DISCORD_CHANNEL_ID} napthedev/discloud:latest
```
