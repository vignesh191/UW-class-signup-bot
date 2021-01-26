const puppeteer = require('puppeteer');
require('dotenv').config()

// url to see class details such as the amount of students signed up and available spots
const classDetailsURL = process.env.CLASS_DETAILS_URL

// url to sign up for the class; once accessed student is auto-signed up.
const classSignupURL = process.env.CLASS_SIGNUP_URL

var cronClose = false;

const startBot = () => {
    console.log('Welcome to the UW Class Sign-up Bot. Please read the provided')
    console.log('README.md file for instructions on usage and ensure that you')
    console.log('have modified the .env file to your class specific details.')
}

async function browserConfig() {
    const browser = await puppeteer.launch();
    var classPage = await browser.newPage();
    
    //to get class details
    await classPage.goto(classDetailsURL)

    //login
    console.log('Configuring the bot to take in your UW credentials...')
    await classPage.type('#weblogin_netid', process.env.UW_NETID)
    await classPage.type('#weblogin_password', process.env.UW_PASSWORD)
    await classPage.click('#submit_button')
    await classPage.waitForNavigation()
    console.log('UW NetID login was successful.')

    //getting the cookies; saved login credentials
    const cookies = await classPage.cookies()

    //accessing the class information page with the cookies
    classPage = await browser.newPage()
    // await classPage.setCookie(...cookies)
    // await classPage.goto(classDetailsURL)
    console.log('Checking class capacity...')
    return {cookies, browser, classPage};
}


async function checkClassCapacity(cookies, browser, classPage) {
    await classPage.setCookie(...cookies)
    await classPage.goto(classDetailsURL)

    const res = await classPage.evaluate(async () => {
            //webscraping the class capacity data
            let currEnrollment = document.querySelector('body > p:nth-child(6) > table > tbody > tr:nth-child(2) > td:nth-child(1) > tt').innerText;
            let capacity = document.querySelector('body > p:nth-child(6) > table > tbody > tr:nth-child(2) > td:nth-child(2) > tt').innerText;

            //formatting to class capacity data to numerical values
            currEnrollment = Number(currEnrollment.replace(/[^0-9.-]+/g,""));
            capacity = Number(capacity.replace(/[^0-9.-]+/g,""));

            let ratio = currEnrollment / capacity;
            if (ratio < 1) { //class is not full
               classPage.close();
               const signupPage = browser.newPage();
               await signupPage.setCookie(cookies)
               await signupPage.goto(classSignupURL); //auto signs up when url is accessed;
               browser.close();
               cronClose = true; //for the cronjob to stop
               return `${ratio}The class you have been waiting for has been signed up for!`;

            } else {
                return `${ratio}The class is still full. Checking again...`;
            }

    })
    console.log(res)
}


async function startTracking(cookies, browser, classPage) {

    let intervalTask =  setInterval(() => {
        checkClassCapacity(cookies, browser, classPage);        
    }, 15000); // USER PARAM: you can set the time here in ms


    // let job = new CronJob('*/15 * * * *', function() {
    //     checkClassCapacity(cookies, browser, classPage);
    // }, null, true, null, null, true);

    //job.start();

    if (cronClose) {
        //job.stop();
        clearInterval(intervalTask)
        console.log('Checking class capacity task has been terminated.')
    }
}

async function bootstrap() {
    startBot()
    let {cookies, browser, classPage} = await browserConfig();
    await startTracking(cookies, browser, classPage);
}


bootstrap(); 
