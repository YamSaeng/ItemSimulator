import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { prisma } from '../utils/prisma/prismaClient.js'
import { ValidateToken } from '../routes/users.router.js'
import authMiddleware from '../../middlewares/auth.middleware.js'
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY;
const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY;

router.post('/character-create', authMiddleware, async (req, res, next) => {
    const { characterName } = req.body;       

    const isExistCharacter = await prisma.characters.findFirst({
        where: { characterName: characterName }
    });

    if (isExistCharacter) {
        return res.status(401).json({ message: `${characterName}은 이미 존재하는 캐릭터 이름입니다.` })
    }

    const dbNewCharacter = await prisma.characters.create({
        data: {
            userId: req.user.id, // 요청한 id를 바탕으로 캐릭터를 생성해줌
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

router.delete('/character-delete/:characterId', authMiddleware, async (req, res, next) => {
    const { characterId } = req.params;

    const deleteCharacter = await prisma.characters.findFirst({
        where: {
            characterId: +characterId
        }
    });

    if (!deleteCharacter) {
        return res
            .status(401)
            .json({ message: `삭제할 캐릭터가 서버에 존재하지 않습니다.` });
    }

    // 삭제할 캐릭터의 userId와 요청한 유저의 userId가 다르면 삭제시키지 않는다.
    if (deleteCharacter.userId !== req.user.id) {
        return res
            .status(401)
            .json({ message: `${deleteCharacter.characterName}은 내 계정의 캐릭터가 아닙니다.` });
    }    

    const deleteCharacterName = deleteCharacter.characterName;

    await prisma.characters.delete({
        where: {
            characterId: +characterId
        }
    });    

    
    return res
        .status(200)
        .json({ message: `${deleteCharacterName} 캐릭터가 삭제되었습니다.` });
});

export default router;