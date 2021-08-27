import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccessToken } from '../../fetch/auth';
import jwt, {
    JwtHeader,
    SigningKeyCallback,
    VerifyCallback,
} from 'jsonwebtoken';
import jwks from 'jwks-rsa';

const jwksClient = jwks({
    jwksUri: process.env.AZURE_OPENID_CONFIG_JWKS_URI as string,
    cache: false,
});

const getSigningKey = async (
    header: JwtHeader,
    callback: SigningKeyCallback
) => {
    const key = await jwksClient.getSigningKey(header.kid);
    callback(undefined, key.getPublicKey());
};

export const validateAccessToken = (
    accessToken: string,
    callback: VerifyCallback
) => {
    jwt.verify(
        accessToken,
        getSigningKey,
        {
            algorithms: ['RS256', 'RS384', 'RS512'],
            audience: process.env.API_CLIENT_ID,
        },
        callback
    );
};

const verifyTest = async (req: NextApiRequest, res: NextApiResponse) => {
    const token = await fetchAccessToken();

    if (token) {
        validateAccessToken(token.access_token, (err, decoded) => {
            if (err) {
                console.error(err);
                res.status(400).json({ message: 'Could not validate token' });
            }

            console.log(decoded);
            return res.status(200).json(decoded);
        });
    } else {
        return res.status(400).json({ message: 'Could not fetch token' });
    }
};

export default verifyTest;
