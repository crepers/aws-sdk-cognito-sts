import { InvokeCommand, LambdaClient, LogType } from '@aws-sdk/client-lambda';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

import { cognitoCredentialsProvider } from './cognito-sts-provider';

const invoke = async (
    id: string,
    identityPoolId : string,
    unAuthRoleArn: string,
    awsId: string,

    functionName: string,
    payload: string,
) => {
    const currentConfiguration = {
        REGION: 'us-east-1',
        ENDPOINT: 'https://evidently.us-east-1.amazonaws.com',
        identityPoolId: identityPoolId,
        unAuthRoleArn: unAuthRoleArn,
        awsId: awsId,
    }; 

    try {
        const client = new LambdaClient({
            region: 'us-east-1',
            credentials: function () {
                return cognitoCredentialsProvider(
                    'dev',
                    currentConfiguration,
                ) as Promise<AwsCredentialIdentity>;
            },
        });

        const buf = new ArrayBuffer(payload.length * 2); 
        let bufView = new Uint8Array(buf);
        for (let i = 0, strLen = payload.length; i < strLen; i++) {
            bufView[i] = payload.charCodeAt(i);
        }

        const command = new InvokeCommand({
            FunctionName: functionName,
            Payload: bufView,
            LogType: LogType.Tail,
        });

        const { response, logResult } = await client.send(command);
        if (response && logResult) {
            const result = new TextDecoder().decode(response); 
            const logs = atob(logResult); 

            console.log(result);
            console.log(logs);

            return { logs, result };
        } else {
            return null;
        }
    } catch (e) {
        console.error(e);
    }
};
