const puppeteer = require('puppeteer');
const credentials = require('./credentials.json')
const CronJob = require('cron').CronJob;

//url to see class details such as the amount of students signed up and available spots
const classDetailsURL = 'https://sdb.admin.uw.edu/timeschd/uwnetid/sln.asp?QTRYR=AUT+2020&SLN=10227'

//url to sign up for the class; once accessed student is auto-signed up.
const classSignupURL = 'https://sdb.admin.uw.edu/students/UWNetID/register.asp?INPUTFORM=UPDATE&PAC=0&MAXDROPS=0&'
       +'_CW=5df0ad466c6cdc0cd2f42cbc5323bca84ea345ca1bf55dbb5c75b2f8a26b1bf3&_src=mp_reg_preview&QTR=4&YR=2020&sln1=10227&entCode1=&credits1=&gr_sys1='

var cronClose = false;


async function browserConfig() {
    const browser = await puppeteer.launch();
    var classPage = await browser.newPage();
    //to get class details
    await classPage.goto(classDetailsURL)

    //login
    await classPage.type('#weblogin_netid', credentials.username)
    await classPage.type('#weblogin_password', credentials.password)
    await classPage.click('#submit_button')
    await classPage.waitForNavigation()
    console.log('UW NetID login was successful.')

    //getting the cookies; saved login credentials
    const cookies = await classPage.cookies()

    //accessing the class information page with the cookies
    classPage = await browser.newPage()
    await classPage.setCookie(...cookies)
    await classPage.goto(classDetailsURL)

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
               signupPage.goto(classSignupURL); //auto signs up when url is accessed;
               return 'The class you have been waiting for has been signed up for!';
               browser.close();
               cronClose = true; //for the cronjob to stop
            } else {
                return 'The class is still full. Checking again...';
            }

    })
    console.log(res)
}


async function startTracking(cookies, browser, classPage) {
    let job = new CronJob('*/15 * * * *', function() {
        checkClassCapacity(cookies, browser, classPage);
    }, null, true, null, null, true);

    job.start();

    if (cronClose) {
        job.stop();
        console.log('cron job has been stopped')
    }
}

async function bootstrap() {
    let {cookies, browser, classPage} = await browserConfig();
    await startTracking(cookies, browser, classPage);
}

bootstrap();
