import {
    CognitoIdentityClient,
    GetOpenIdTokenCommand,
    GetIdCommand,
} from '@aws-sdk/client-cognito-identity';
import { STS, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts';

export async function cognitoCredentialsProvider(
    id: string,
    configuration: Record<string, string>,
) {
    const stsClient = new STS({ region: configuration.REGION });

    const cognitoIdentityClient = new CognitoIdentityClient({
        region: configuration.REGION,
    });
    const getIdResponse = await cognitoIdentityClient.send(
        new GetIdCommand({
            AccountId: configuration.awsId,
            IdentityPoolId: configuration.identityPoolId,
        }),
    );
    const getOpenIdTokenResponse = await cognitoIdentityClient.send(
        new GetOpenIdTokenCommand({
            IdentityId: getIdResponse.IdentityId,
        }),
    );

    // Reference: https://docs.aws.amazon.com/cli/latest/reference/sts/assume-role-with-web-identity.html
    const assumeRoleResponse = await stsClient.send(
        new AssumeRoleWithWebIdentityCommand({
            RoleArn: configuration.unAuthRoleArn,
            RoleSessionName: 'evidently'.concat(id),
            WebIdentityToken: getOpenIdTokenResponse.Token,
            DurationSeconds: 15 * 60,
        }),
    );

    if (!assumeRoleResponse.Credentials) {
        throw new Error('STS response did not contain credentials.');
    }

    const credentials = {
        accessKeyId: assumeRoleResponse.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey,
        sessionToken: assumeRoleResponse.Credentials.SessionToken,
        expiration: assumeRoleResponse.Credentials.Expiration,
    };

    return credentials;
}
