'use strict';

//REFERENCE: https://raw.githubusercontent.com/vppillai/VoiceServiceLambdas/master/GoogleAssistant-Smarthome/AlexaIntegration-onOff/lambdaFunction.js

/*
MUST IMPLEMENT THE FOLLOWING:
1. OAUTH SUPPORT (RETRIEVING HEADEER, PLS REFER TO CastFunction)
2. QUERY HANDLING (RETRIEVING ON/OFF STATE OF CAMERA, OPTIONAL)
3. EXECUTE HANDLING (RETRIEVING STREAM LINK, WAS API)
*/

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
console.log('Loading function');
const https = require('https');

/*MAIN HANDLER (OAUTH/USER HANDLING, PASSES TO INTENT HANDLING)*/
exports.handler = (event, context, callback) => {
    
    var options = {
        hostname: 'staging.smcure.net',
        path: '/users/minsu.kim@smc.com/v2',
        headers: {
            //HTML HEADER CONTAINS THE ACCESS TOKEN
            Authorization: 'Basic YWRtaW5Ac21jdXJlLm5ldDp2c3MhdnNzITEyMzQ=',
        }
    };

    //CURRENT SOLUTION: HTTPS -> POSSIBLY REQUEST LIBRARY
    //GET REQUEST TO CALL API FOR USER INFORMATION
    https.get(options, 
    (res) => {
        var body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => 
            getCameraData(event, JSON.parse(body), callback)
            // console.log(JSON.parse(body)),
            // console.log('request: ' + event.body)
        );
    }).on('error', (err) => {
        callback(null, {
            response: err.message,
        });
    });
    
};

/* HANDLES ALL INTENTS (SYNC, QUERY, EXECUTE) */
function getCameraData(event, data, callback)
{
    var path = '/users/'+ data.user_id + '/cameras';
    
    var options = {
        hostname: 'staging.smcure.net',
        path: path,
        headers: {
            //HTML HEADER CONTAINS THE ACCESS TOKEN
            Authorization: 'Basic YWRtaW5Ac21jdXJlLm5ldDp2c3MhdnNzITEyMzQ=',
        }
    };

    var intent = event.inputs[0].intent;
    var cameradata = '';
    
    //GET REQUEST TO CALL API FOR USER INFORMATION
    https.get(options, 
    (res) => {
        
        res.on('data', (chunk) => {
            cameradata += chunk;
        });
        res.on('end', () => 
            handleIntents(intent, callback, JSON.parse(cameradata))
        );
    }).on('error', (err) => {
        callback(null, {
            response: err.message,
        });
    });
    
}

function handleIntents(intent, callback, cameradata){
    if (intent == "action.devices.SYNC") {
        //RECEIVING SYNC INTENT
        handleSync(callback, cameradata);
        cameradata = '';
    }
    else if (intent == "action.devices.QUERY") {
        //handleQuery(event.inputs[0].payload, cameradata, callback);
        //RECEIVING QUERY INTENT
        //NO QUERY AVAILABLE FOR CAMERA STREAM
    }
    else if (intent == "action.devices.EXECUTE") {
        //RECEIVING EXECUTE INTENT
        //handleExec(event.inputs[0].payload.commands, cameradata, callback);
    }
}


/*SYNC HANDLER (PROVIDES DEVICE INFORMATION, ACCESSES DATABASE)*/
function handleSync(callback, data) {
    
    var response = {
        requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
        payload: {
            agentUserId: data[0].owner_id,
            devices: []
        }
    };
    
    for(var i = 0; i<data.length; i++)
    {
        response.payload.devices.push({
            id: data[i].camera_id,
                type: 'action.devices.types.CAMERA',
                traits: [
                    'action.devices.traits.CameraStream',
                    'action.devices.traits.OnOff'
                ],
                name: {
                    defaultNames: ['MyCamera'],
                    name: data[i].camera_title,
                    nicknames: [data[i].camera_title],
                },
                deviceInfo: {
                    manufacturer: 'SMC Networks',
                    model: data[i].camera_model,
                    hwVersion: '1.0',
                    swVersion: '1.0.1',
                },
                attributes : {
                    cameraStreamSupportedProtocols: ['hls', 'dash', 'progressive_mp4'],
                    cameraStreamNeedAuthToken: false,
                    cameraStreamNeedDrmEncryption: false,
                }
        });
    }
    callback(null, response);
    response = {};
}

//NO WAS API AVAILABLE YET (DEVICE ON/OFF STATE)
/*
function handleQuery(payload, data, callback){
    var response = {
        requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
        payload: {
            devices: {}
        }
    };
    
    for(var i = 0; i< data.length; i++){
        //ITERATES THROUGH EACH DEVICE IN EXECUTE REQUEST
        for(var j = 0; j<payload.devices.length; j++){
            if(data[i].camera_id == payload.devices[j].id){
                //ADDED DEVICE STATE TO THE PAYLOAD
                response.payload.devices[payload.devices[j].id] = {
                    'on': data.Item.devices[i].OnOff.isOn,
                };
            }
        }
    }
    console.log(response);
    callback(null, response);
}
*/

//NO WAS API AVAILABLE YET (RETRIEVING STREAM URL/LINK)
//FOR EXEC, RETURN STREAM LINK BY FORMATTING USER AND CAMERAID CORRECTLY TO RETREIVE STREAM
/*
function handleExec(commands, data, callback) {
    
    //TEMPLATE RESPONSE
    var response = {
        requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
        payload: {
            commands: [],
        }
    };
    
    if(commands[0].execution[0].command == "action.devices.commands.GetCameraStream"){
        
        //ITERATES THROUGH EACH CAMERA IN DATABASE
        for(var i = 0; i< data.Item.devices.length; i++)
        {
            //CHECKS IF CAMERA IN DATABASE MATCHES ID IN EXECUTE REQUEST
            if(data.Item.devices[i].cameraid == commands[0].devices[0].id)
            {
                response.payload.commands.push(
                    {
                        ids: [data.Item.devices[i].cameraid],
                        status: 'SUCCESS',
                        states: {
                            cameraStreamAccessUrl: data.Item.devices[i].CameraStream.cameraStreamAccessUrl
                        }
                    }
                );
            }
        }
        callback(null, response);
    }
    else if(commands[0].execution[0].command == "action.devices.commands.OnOff")
    {
        //ITERATES THROUGH EACH CAMERA IN DATABASE
        for(var a = 0; a< data.Item.devices.length; a++){
            
            //ITERATES THROUGH EACH DEVICE IN EXECUTE REQUEST
            for(var b = 0; b<commands[0].devices.length; b++)
            {
                if(data.Item.devices[a].cameraid == commands[0].devices[b].id){
                    response.payload.commands.push({
                            ids: [data.Item.devices[a].cameraid],
                            status: 'SUCCESS',
                            states: {
                                on: commands[0].execution[0].params.on
                            }
                        });
                    if(data.Item.devices[a].OnOff.isOn != commands[0].execution[0].params.on){
                        //UPDATE DATABASE ONLY IF THE VALUE IS NEW
                        var params = {
                            TableName: 'Camera',
                            Key:{
                                id: data.Item.id
                            },
                            
                            UpdateExpression: 'set devices['+a+'].OnOff.isOn = :o',
                            ExpressionAttributeValues:{
                                ':o': commands[0].execution[0].params.on
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        docClient.update(params, function(err, data){
                            if(err){
                                console.error("Unable to update item" + JSON.stringify(err, null, 2));
                            }else{
                                console.error("Update succeeded");   
                            }
                        });
                    }
                }
            }
        }
        callback(null, response);
    }
}
*/
