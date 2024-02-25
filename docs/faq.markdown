---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: FAQ
permalink: FAQ
---

## I am unable to upload a file in the app.
If you are running Avast, you may need to add an exception for PostyBirb in it. Avast has been giving the application issues lately and I am unsure why. If this does not describe your situation, please reach out on Discord or through the Contact page.

## I cannot login to Furry Network
Due to some weird way that Furry Network implemented their catpcha at login, it can randomly start failing to login. I do not know of a way to fix this other than for you to wait a day and try again until it finally goes through.

## I logged into a website but PostyBirb does not detect my account.
- If the website is e621, attempt to login with the option of "Enable Roaming" checked when logging in. If this does not work, please report this as a bug.

- Check that the website is actually online. Sometimes a website will go down.

- If the website is online, check that CloudFlare is currently not active by opening a private/incognito browser and hitting the website. If CloudFlare checks your browser then PostyBirb will be unable to post to that website until it is disabled. This is more an issue in v2.X than in v1.X.

## Will scheduled submissions work with the application off?
No. PostyBirb is run entirely on a user's machine, so the application needs to be on to work. However, if a user has scheduled submissions set and closes the primary window, PostyBirb will remain open in the background and attempt to post if the operating system allows. The application will terminate itself when there are no more scheduled submissions.

## Will scheduled submissions work when my computer is in sleep mode?
It seems to work on Linux and Mac/OSX. Users have reported that it does not work well on Windows operating systems.

## Fur Affinity fails to post.
You will need 11 or more submissions in your Fur Affinity gallery before PostyBirb is allowed to post to the website.

## DeviantArt/Twitter/Tumblr was working, but now isn't.
Try re-authenticating. Sometimes the tokens expire. If issues still persist please wait a day and see if it is working then. Sometimes the API for these websites experience hiccups.

## Will PostyBirb come to mobile devices?
No. The framework that PostyBirb is built with currently does not support mobile platforms.

## Will PostyBirb support X website?
Potentially! Feel free to send a request through the contact page. Most websites are at least considered.

## Will PostyBirb support Facebook?
No.

## Will PostyBirb support Instagram?
No.

## Will PostyBirb support ArtStation?
While it is possible, ArtStation is not very compatible with PostyBirb in its current state so it is unlikely to be supported any time soon.
