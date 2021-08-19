import * as fs from 'fs';
import * as readlineSync from 'readline-sync';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client, OAuth2ClientOptions } from 'google-auth-library';
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client';

// If modifying these scopes, delete token.json.
const SCOPES: string[] = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH: string = 'token.json';

const sheets: sheets_v4.Sheets = google.sheets('v4');

const authOptions: OAuth2ClientOptions = getAuthOptions();
const authClient: OAuth2Client = new OAuth2Client(authOptions);

async function main () {
  // Get a new auth client, send the request with the authorized client
  authorize()
    .then(() => {
      sendRequest(buildRequest())
        .then(handleResponse);
    });
}
main();

function handleResponse(response: sheets_v4.Schema$BatchGetValuesResponse) {
  console.log(response);
}

async function sendRequest(request) : Promise<sheets_v4.Params$Resource$Spreadsheets$Values$Batchget> {
  return (await sheets.spreadsheets.values.batchGet(request)).data;
}

function buildRequest() : sheets_v4.Params$Resource$Spreadsheets$Values$Batchget {
  // Build our authorized request
  const request: sheets_v4.Params$Resource$Spreadsheets$Values$Batchget = {
    spreadsheetId: '10jSMRIG9nwRppaXE7Hi8VHVRZe8Cd3p2mBN7ZdfJ_RQ',
    ranges: [
      'Distinctions!A2:C',
      'Passions!A2:C',
      'Adversities!A2:C',
      'Anxieties!A2:C',
    ],
    auth: authClient,
  }
  return request;
}

async function authorize() {
  // Try to get existing authorization token from file
  try {
    let authToken = JSON.parse(fs.readFileSync('token.json').toString());
    authClient.setCredentials(authToken);
  } catch (err) {
    // Try to get a new token
    authClient.setCredentials((await getNewToken()).tokens);
  }
}

async function getNewToken() : Promise<GetTokenResponse> {
  
  const authUrl: string = authClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log(`Authorize this app by visiting this URL: ${authUrl}`);

  let userCode: string = readlineSync.question(`Enter the code here:`);

  const tokenResponse: Promise<GetTokenResponse> = authClient.getToken(userCode)
    .then((tokenResponse) => {
      fs.writeFile(TOKEN_PATH, JSON.stringify(tokenResponse.tokens), (err) => {
        if (err) return console.error(err);
        console.log(`Token stored to '${TOKEN_PATH}'`);
      });
      return tokenResponse;
    })
    .catch((err) => {
      throw new Error(err);
    });

  return tokenResponse;
}

function getAuthOptions() {
  let credentials: any;
  try {
    credentials = JSON.parse(fs.readFileSync('credentials.json').toString());
  } catch (err) {
    throw Error(`Error reading credentials file: ${err}`);
  }
  let opts: OAuth2ClientOptions = {};
  opts.clientId = credentials.installed.client_id;
  opts.clientSecret = credentials.installed.client_secret;
  opts.redirectUri = credentials.installed.redirect_uris[0];
  return opts;
}