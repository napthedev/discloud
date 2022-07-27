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
- Go to [discord](https://discord.com/) and create a new Server. The only member must be you only so that no one can access your files.
  - Create a new text channel
  - Click on the cog icon ⚙️ to "Edit channel"
  - Go to "Integration" tab
  - Click on "View webhooks"
  - "Create a new webhook" and then "Copy Webhook URL". Use that URL as `DISCORD_WEBHOOK_URL` environment variable
- Run `npm i`
- Run `npm run dev`

## Deployments

[![heroku](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy/?template=https://github.com/napthedev/discloud&env[REDIS_URL]=&env[DISCORD_WEBHOOK_URL]=)  
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/swgNkC?referralCode=YiZaHP)
