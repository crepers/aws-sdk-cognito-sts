import { Evidently } from '@aws-sdk/client-evidently';
import type { AwsCredentialIdentity } from '@aws-sdk/types';
import { cognitoCredentialsProvider } from './cognito-sts-provider';

export function evidentlyClientBuilder(
    id: string,
    identityPoolId : string,
    unAuthRoleArn: string,
    awsId: string,
) {
    const currentConfiguration = {
        REGION: 'us-east-1',
        ENDPOINT: 'https://evidently.us-east-1.amazonaws.com',
        identityPoolId: identityPoolId,
        unAuthRoleArn: unAuthRoleArn,
        awsId: awsId,
    }; 

    return new Evidently({
        region: currentConfiguration.REGION,
        endpoint: currentConfiguration.ENDPOINT,
        credentials: function () {
            return cognitoCredentialsProvider(
                id,
                currentConfiguration,
            ) as Promise<AwsCredentialIdentity>;
        },
    });
}