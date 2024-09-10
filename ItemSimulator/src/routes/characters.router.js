import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { prisma } from '../utils/prisma/prismaClient.js'
import { ValidateToken } from '../routes/users.router.js'
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY;
const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY;

router.post('/character-create', async (req, res, next) => {
    const { characterName } = req.body;

    const c2sAccessToken = req.cookies.accessToken;    

    if (c2sAccessToken == undefined) {
        return res.status(404).send('not found');
    }

    const payLoadAccess = ValidateToken(c2sAccessToken, accessTokenSecretKey);
    if (!payLoadAccess) {        
        return res.status(401).json({ message: '세션이 만료되었습니다. 로그인을 다시 하세요.' });
    }

    const isExistCharacter = await prisma.characters.findFirst({
        where: { characterName: characterName }
    });

    if (isExistCharacter) {
        return res.status(401).json({ message: `${characterName}은 이미 존재하는 캐릭터 이름입니다.` })
    }

    const dbNewCharacter = await prisma.characters.create({
        data: {
            userId: payLoadAccess.id, // 요청한 id를 바탕으로 캐릭터를 생성해줌
            characterName: characterName,
            hp: 50,
            str: 4,
            dex: 4,
            int: 4,
            money: 10000
        }
    });

    return res
        .status(200)
        .json({ message: `${characterName} 캐릭터를 만들었습니다.` });
});

export default router;