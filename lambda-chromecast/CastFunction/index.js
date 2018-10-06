'use strict';

//REFERENCE: https://raw.githubusercontent.com/vppillai/VoiceServiceLambdas/master/GoogleAssistant-Smarthome/AlexaIntegration-onOff/lambdaFunction.js

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
console.log('Loading function');
const https = require('https');

/*MAIN HANDLER (OAUTH/USER HANDLING, PASSES TO INTENT HANDLING)*/
exports.handler = (event, context, callback) => {
    
    var options = {
        hostname: 'seichang00.auth0.com',
        path: '/userinfo',
        headers: {
            //HTML HEADER CONTAINS THE ACCESS TOKEN
            Authorization: event.Authorization,
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
            handleIntents(event.body, JSON.parse(body).sub, callback)
        );
    }).on('error', (err) => {
        callback(null, {
            response: err.message,
        });
    });
    
};

/* HANDLES ALL INTENTS (SYNC, QUERY, EXECUTE) */
function handleIntents(body, id, callback)
{
    var intent = body.inputs[0].intent;
    
    //SETTING PARAMETERS FOR DYNAMODB
    var params = {
        TableName: 'Camera',
        Key: {
            id: id
        }
    };
        
    //READ DATA FROM DYNAMODB
    docClient.get(params, function(err, data){
        if(err){
            callback(err, null);
        }else{
            if (intent == "action.devices.SYNC") {
                //RECEIVING SYNC INTENT
                id = "";
                params = "";
                handleSync(callback, data);
            }
            else if (intent == "action.devices.QUERY") {
                handleQuery(body.inputs[0].payload, data, callback);
                //RECEIVING QUERY INTENT
                //NO QUERY AVAILABLE FOR CAMERA STREAM
            }
            else if (intent == "action.devices.EXECUTE") {
                //RECEIVING EXECUTE INTENT
                handleExec(body.inputs[0].payload.commands, data, callback);
                params = "";
                id = "";
            }
        }
    });
}

/*SYNC HANDLER (PROVIDES DEVICE INFORMATION, ACCESSES DATABASE)*/
function handleSync(callback, data) {
    
    var response = {
        requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
        payload: {
            agentUserId: data.Item.id,
            devices: []
        }
    };
    
    for(var i = 0; i<data.Item.devices.length; i++)
    {
        response.payload.devices.push({
            id: data.Item.devices[i].cameraid,
                type: 'action.devices.types.CAMERA',
                traits: [
                    'action.devices.traits.CameraStream',
                    'action.devices.traits.OnOff'
                ],
                name: {
                    defaultNames: ['MyCamera'],
                    name: data.Item.devices[i].Name,
                    nicknames: [data.Item.devices[i].Name],
                },
                deviceInfo: {
                    manufacturer: 'SMC Networks',
                    model: 'Security Camera T1000',
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

function handleQuery(payload, data, callback){
    var response = {
        requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
        payload: {
            devices: {}
        }
    };
    
    for(var i = 0; i< data.Item.devices.length; i++){
        //ITERATES THROUGH EACH DEVICE IN EXECUTE REQUEST
        for(var j = 0; j<payload.devices.length; j++){
            if(data.Item.devices[i].cameraid == payload.devices[j].id){
                
                console.log(data.Item.devices[i].cameraid + "hello" + payload.devices[j].id);
                console.log("is the Alex on: " + data.Item.devices[i].OnOff.isOn);
                response.payload.devices[payload.devices[j].id] = {
                    'on': data.Item.devices[i].OnOff.isOn,
                };
            }
        }
    }
    console.log(response);
    callback(null, response);
}

//EXECUTE HANDLER
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