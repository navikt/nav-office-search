import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccessToken } from '../../fetch/auth';
import jwt, {
    JwtHeader,
    SigningKeyCallback,
    VerifyCallback,
} from 'jsonwebtoken';
import jwks from 'jwks-rsa';

const oneHourInMs = 60 * 60 * 1000;

const jwksClient = jwks({
    jwksUri: process.env.AZURE_OPENID_CONFIG_JWKS_URI as string,
    cache: false,
    // cacheMaxAge: oneHourInMs,
});

const getSigningKey = async (
    header: JwtHeader,
    callback: SigningKeyCallback
) => {
    const key = await jwksClient.getSigningKey(header.kid);
    callback(undefined, key.getPublicKey());
};

const decodeBase64 = (str: string) => Buffer.from(str, 'base64').toString();

export const validateAccessToken = (
    accessToken: string,
    callback: VerifyCallback
) => {
    jwt.verify(
        accessToken,
        getSigningKey,
        {
            algorithms: ['RS256', 'RS384', 'RS512'],
            audience: 'fac85085-57c2-4e97-9ad2-d7553a9fa84d',
        },
        callback
    );
};

const verifyTest = async (req: NextApiRequest, res: NextApiResponse) => {
    // const token =
    //     'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im5PbzNaRHJPRFhFSzFqS1doWHNsSFJfS1hFZyJ9.eyJhdWQiOiIzMzk5ZTU3My0wZDgzLTQ1ODEtOGRiOS03YjY2YzhmNWY3NzUiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTY2YWM1NzItZjViNy00YmJlLWFhODgtYzc2NDE5YzBmODUxL3YyLjAiLCJpYXQiOjE2Mjk5ODA3NDcsIm5iZiI6MTYyOTk4MDc0NywiZXhwIjoxNjI5OTg0NjQ3LCJhaW8iOiJFMlpnWUJCc1hpbXV1YjJncW5yR29qOVRxdVN2QVFBPSIsImF6cCI6ImZhYzg1MDg1LTU3YzItNGU5Ny05YWQyLWQ3NTUzYTlmYTg0ZCIsImF6cGFjciI6IjEiLCJvaWQiOiJmNjI2ODJlNy0yMTI4LTRlYmEtODcyZi1iOWVhODQ3MTMwNDEiLCJyaCI6IjAuQVVjQWNzVnFscmYxdmt1cWlNZGtHY0Q0VVlWUXlQckNWNWRPbXRMWFZUcWZxRTFIQUFBLiIsInJvbGVzIjpbImFjY2Vzc19hc19hcHBsaWNhdGlvbiJdLCJzdWIiOiJmNjI2ODJlNy0yMTI4LTRlYmEtODcyZi1iOWVhODQ3MTMwNDEiLCJ0aWQiOiI5NjZhYzU3Mi1mNWI3LTRiYmUtYWE4OC1jNzY0MTljMGY4NTEiLCJ1dGkiOiJPRXJrLXVLTllFeUhhZ2hNY0JvakFBIiwidmVyIjoiMi4wIn0.GJXhzUxkRXZbHJ3Bx7-i0evhrugPkLdcdksQerAcO25gQF21pRxi28z9-ARfXXWs9khp9qLfCXi3jlVEsjwjBlT_CAla8OIa6Nb6dQuHWjMN7cB4Im6f1MDjaX53gOc8cPyKTu1UATQXaEZh4zoUTTbhWtwMFMD4E_br3NGRHKEyjyKeeUkKA-D92LoVOSP2PK-RrKh4x3I6vjKOqHWd2cYFsle9Es2rZG7sO7UmsSmfn8REjCvWg1NS17hvCLPi1B57oP5OSWNimNDTLufMyOCy_V5iNe1d8K3nG5QTTrkkgItytijKFgbB2Ec7eEtRqrmVFyEYKNtaYvACs1CY1Q';

    const token = await fetchAccessToken();

    if (token) {
        validateAccessToken(token, (err, decoded) => {
            if (err) {
                console.error(err);
                res.status(400).json({ message: 'Could not validate token' });
            }

            console.log(decoded);
            return res.status(200).json(decoded);
        });
    }

    return res.status(400).json({ message: 'Could not fetch token' });
};

export default verifyTest;
