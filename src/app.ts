import * as fs from 'fs';
import * as readline from 'readline';
import {
  google,
  sheets_v4
} from 'googleapis';
import { AuthPlus } from 'googleapis-common';
import { OAuth2Client, OAuth2ClientOptions } from 'google-auth-library';

// If modifying these scopes, delete token.json.
const SCOPES: string[] = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH: string = 'token.json';

const sheets: sheets_v4.Sheets = google.sheets('v4');
const auth: AuthPlus = google.auth;



async function main () {
  // Get a new auth client
  const authClient = getAuthorizedClient();

  // Build our request
  const request: sheets_v4.Params$Resource$Spreadsheets$Values$Batchget = {
    spreadsheetId: '10jSMRIG9nwRppaXE7Hi8VHVRZe8Cd3p2mBN7ZdfJ_RQ',
    ranges: [
      'Distinctions!A2:C',
      'Passions!A2:C',
      'Adversities!A2:C',
      'Anxieties!A2:C',
    ],
    auth: authClient,
  };

  // Try to send our request
  try {
    const response: sheets_v4.Schema$BatchGetValuesResponse = (await sheets.spreadsheets.values.batchGet(request)).data;

    // do some stuff with the response
    console.log(response.valueRanges[0].values[0]);

  } catch (err) {
    console.error(err);
  }
}
main();

function getAuthorizedClient() {
  let authOptions: OAuth2ClientOptions = getAuthOptions();

  const authClient: OAuth2Client = new auth.OAuth2(
    authOptions.clientId,
    authOptions.clientSecret,
    authOptions.redirectUri,
  );
  
  // Try to get existing token from file
  let authToken;
  try {
    authToken = JSON.parse(fs.readFileSync('token.json').toString());
  } catch (err) {
    // Try to get a new token
    authToken = getNewToken(authClient);
  }
  
  authClient.setCredentials(authToken);

  return authClient;
}

function getNewToken(authClient: OAuth2Client) : OAuth2Client {
  const authUrl: string = authClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log(`Authorize this app by visiting this URL: ${authUrl}`);

  const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Enter the code from that page: `, (code) => {
    rl.close();
    authClient.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      authClient.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
  return authClient;
}

function getAuthOptions() {
  let credentials;
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