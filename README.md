# UW-class-signup-bot
A bot that can be ran throughout the day and can be used to automatically sign up for University of Washington classes.

## Instructions
1. Make sure to have node installed along with npm.
2. `cd` to the parent folder of this repo locally and run `npm i` to install all dependencies
<<<<<<< HEAD
3. `app.js` has the src code for this bot. Feel free to add or contribute or drop suggestions 
4. The `.env` file is where you will need to provide two URL links and your UW NetID credentials. Sample data is provided as an example.
5. In the `async function startTracking(cookies, browser, classPage)` method you have the ability to change the frequency of how often you check for the class availability. 
=======
3. In this Node.js script there are two urls you will need to provide: `const classDetailsURL` and `const classSignupURL`. Example URLs are provided so you will know how they look.
4. In `credentials.json` provide your UW NetID login credentials.
5. In the `async function startTracking(cookies, browser, classPage)` method you have the ability to change the frequency of the `CronJob`. 
>>>>>>> cdce5991d224d51ea4f6f3481a59b224ab29f61e
6. After these parameters are set, let the script run in the background, and you should have your class signed up for in no time!


