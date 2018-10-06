# PROJECT CHROMECAST: INTEGRATING SMC CAMERAS

## ACTIONS ON GOOGLE REFERENCES

Smart-Home Implementation: [ACTIONS ON GOOGLE DOCS](https://developers.google.com/actions/smarthome/traits/camerastream#response)

Create Actions on Google: [ACTIONS ON GOOGLE CONSOLE](https://console.actions.google.com/)

Tutorial on integrating existing AWS device (-w* lambda) with Google Assistant: [LAMBDA NODE.JS CODE](https://www.embeddedinn.xyz/articles/tutorial/Developing-a-smart-home-application-for-Google-Assistant/)

__________________________________________________________________________________________________

## PROJECT NOTES/GUIDELINES

1. Smart Home Setup (Google Home + Chromecast)
2. Setup Smart Home App (Actions on Google Console, refer to aforementioned docs)
3. Account Linking (Custom OAuth, or Auth0)
4. For Smart Home Action Fulfillment, refer to CastFunction (test) or SMCCastFunction (w WAS)
5. Test Smart Home App with same Google Account

__________________________________________________________________________________________________

### Update (8/2/18)
* Integrated SMC WAS APIs for obtaining camera/user information
* Finished with that version (Full Test Project)
* Only works with SYNC Intent, more WAS APIs available for QUERY, EXECUTE

IDEAS for Work
1. Ask about WD NAS Integration (maybe OAuth)
2. Working on OAuth Server
3. What about the mini camera? (Need work?)
4. DASH Server/work on providing DASH + RTSP?

__________________________________________________________________________________________________


### Update (8/1/18)
* Accepted rtmp stream from public to output dash
```
exec_static ffmpeg -i rtsp://admin:admin@192.168.51.130 -c copy -f flv rtmp://localhost/live/abc
```
* Later restreamed using RTSP Link (output to DASH)
* Actual camera streamed to Chromecast
* Report State: Directly in CastFunction?

Objectives:
* Find ways to update, or better integrate with current cloud
* SMC REST APIs (obtaining user information, returning stream links?)

__________________________________________________________________________________________________

### Update (7/31/18)
* Integrating Dialogflow (NLP Service) with Lambda
* Worked on Gaction Function
	* Handling default welcome intent & custom show intent
	* Show Intent: Returns table with on/off state and camera names from DynamoDB
	* DynamoDB (use promise to turn async to sync process)
	* Actions SDK: not an option, very painful to use...
* Fixed DynamoDB Bug in CastFunction (updating for on & off)

Objectives
* Stream from actual camera (IP Address)

__________________________________________________________________________________________________

### Update (7/30/18)
* After Research, No Public API available (streaming video to Chromecast, showing video) 
* Actions SDK, action.intent.TEXT bug in index.js (Lambda)
* Explore other option: Dialogflow

Objectives
* Fix path bug to allow database updates
* Implement Dialogflow (test with one intent and response through Lambda)

__________________________________________________________________________________________________

### Update (7/27/18)
* Tested using USB-Wifi Adapter (on SMC-Test Network)
* Chromecast able to play locally (same wifi network) via address: 192.168.1.54
* Custom Fulfillment (Instead of Dialogflow) -> using Actions SDK
* Project Gactions! (Node.js -> most likely upload to Lambda)

Objectives
* Fix path bug to allow database updates
* Creating Actions on Google (test with one intent and response through Lambda)

__________________________________________________________________________________________________

### Update (7/26/18)
* Added database.json to show example JSON
* Updated lambda_index.js to support multiple cameras (reading from database)
* Supported QUERY functionality (OnOff trait also added)
* Added code to change database values based on whether camera was On/Off
* Investigate Chomecast playing on local server (*sudo /usr/local/nginx/sbin/nginx*)
* https://obsproject.com/forum/resources/how-to-set-up-your-own-private-rtmp-server-using-nginx.50/

Objectives
* Fix path bug to allow database updates
* Find out how to allow Chromecast to access local server
* Investigate on Request Sync (not a current priority)

__________________________________________________________________________________________________

### Update (7/24/18)
* Tested OAuth to see if devices are distinct
* Note: With 2 different accounts, devices are the same
* Tested Dialogflow, but unsure how to integrate with smart home devices (perhaps unnecessary
* Integrating OAuth Notes
	* Using Auth0 API, called upon scopes (openid, profile, offline_access)
	* openid: authentication, profile: user profile, offline_access: refresh token
	* https://seichang00.auth0.com/userinfo -> used to get profile
	* *The OAuth access token in Step 2 will be added to the Authorization header of the request*
	* https://kennbrodhagen.net/2015/12/02/how-to-access-http-headers-using-aws-api-gateway-and-lambda/
		* above link used to access http header
		* header contains access token, and then form HTTP GET Request to access user info
		* User information returned in JSON format

Objectives
* use DASH server in the cloud to access stream publicly
* Use OAuth Service (Auth0) to modify parameters for each user (Table: Camera, Key: id)

__________________________________________________________________________________________________

### Update (7/23/18)
* Added DynamoDB Database to index.js (Lambda)
* Updated showLiveStream Role in Lambda (modifying permissions to access DynamoDB)
* Successfully read database to retrieve stream URL

Objectives
* use DASH server in the cloud to access stream publicly
* Use OAuth to modify parameters for each user (Table: Camera, Key: id)

Meeting Discussions
* OAuth not complete (a while before that arrives)
* Objectives: testing functionality with just 2 OAuth accounts (Proof-of-concept)
* Dialogflow: Later time used for additional functionality if needed 

__________________________________________________________________________________________________

### Update (7/20/18)
* Integrated player to access DASH Stream
* Reference used: http://developers-club.com/posts/204666/
* Access via http://localhost/videos/abc/index.mpd (stream file)
* Stream play on browser via http://localhost/dash.js/baseline.html (dash.js player on github)
* TEST SUCCESS!

Objectives
* Integrate the server with actual camera footage
* Option: use the existing SMC Cloud Service for accessing stream url
* Directly link the url to Chromecast through AWS Lambda

__________________________________________________________________________________________________ 

### Update (7/17/18)
* Created RTMP Nginx Server
* Edited config file to support DASH
* Used FFMPEG to publish stream to server
* Play video live from VLC (rtmp://localhost/live/abc)

Notes for Server
* FFMPEG used to record from webcam or record desktop (for example, output.mp4)
* Command to Screen Record: 
```
ffmpeg -video_size 1280*720 -framerate 25 -f x11grab -i :0.0+0,0 output.mp4
```
* Command to Stream: 
```
ffmpeg -re -i (FILE NAME HERE) -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/abc 
```

__________________________________________________________________________________________________

### Update (7/16/18)
* Finalized Lambda Code
* Works streaming link, Lambda integrated with API Gateway
* Made Chromecast API
* Future Plans
	1. Create server that would output MPEG-DASH from RTMP (ngnix)
	2. S3 Integration
	3. OAuth temporary solution (Auth0?)

//REFERENCES
1. https://github.com/arut/nginx-rtmp-module
2. http://nginx-rtmp.blogspot.com/2013/11/mpeg-dash-live-streaming-in-nginx-rtmp.html
3. https://github.com/FFmpeg/FFmpeg (webcam footage for server)


__________________________________________________________________________________________________

### Update (7/13/18)

* Wrote AWS Lambda Function Code which successfully handled SYNC, EXECUTE requests 
* Implemented Lambda with API Gateway Trigger (added Post Method to Lambda Function)
* Lambda Function did not work, so switched to original Firebase Cloud Function, but did not work
* AWS Lambda Saved as index_test.js
* Future Plans
	1. Debugging Session all day (Making it work)
	2. Maybe S3 integration (use as JSON database)
	3. Figure out OAuth (probably don't have to do)

__________________________________________________________________________________________________

### Update (7/12/18)

* Managed to get streaming video to Chromecast with custom link to work
* Working streaming types: MPEG-DASH, Progressive-MP4 //issues with HLS
* Notes about Google Assistant Implementation
	1. Must use real-time database (Sample uses Firebase)
	2. index.js file used to handle SYNC, QUERY, EXECUTE (aka RESPONSE)
	3. Device must receive real-time database and update cameraStreamAccessUrl
	4. Next Step: create Web-front with OAuth implementation, find ways to implement with SQL Database
* [SMART HOME WASHER EXAMPLE](https://codelabs.developers.google.com/codelabs/smarthome-washer/)


