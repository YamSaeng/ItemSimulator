import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { prisma } from '../utils/prisma/prismaClient.js'
import bcrypt from 'bcrypt';
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

// 회원가입
router.post('/sign-up', async (req, res, next) => {
    const { id, password, confirmPassword } = req.body;
    const isExistUser = await prisma.users.findFirst({
        where: {
            id,
        },
    });

    const engNumIdRule = /^(?=[a-za-z])(?=.*[0-9]).{2,10}$/;
    if (!engNumIdRule.test(id)) {
        return res.status(409).json({ message: '소문자 영어와 숫자를 조합해 입력하세요 ( 최소 2글자, 최대 10글자 )' });
    }

    if (confirmPassword === undefined) {
        return res.status(409).json({ message: '비밀번호 확인을 입력하세요' });
    }

    if (password.length < 6) {
        return res.status(409).json({ message: '비밀번호는 최소 6자 이상이 되어야 합니다.' });
    }

    if (password != confirmPassword) {
        return res.status(409).json({ message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
    }

    if (isExistUser) {
        return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: {
            id,
            password: hashedPassword,
        },
    });

    return res.status(201).json({ message: `${id}로 회원가입이 완료되었습니다.` });
});

function CreateAccessToken(id) {
    const accessToken = jwt.sign(
        { id: id },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: '600s' }
    );

    return process.env.TOKEN_TYPE + accessToken;
}

function CreateRefreshToken(id) {
    const refreshToken = jwt.sign(
        { id: id },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: '7d' },
    );

    return process.env.TOKEN_TYPE + refreshToken;
}

export function ValidateToken(token, secretKey) {
    try {
        const payload = jwt.verify(token, secretKey);
        return payload;
    }
    catch (error) {
        return null;
    }
}

// 로그인
router.post('/sign-in', async (req, res, next) => {
    const { id, password } = req.body;
    const user = await prisma.users.findFirst({
        where: { id }
    });

    if (!user) {
        return res.status(401).json({ message: `${id}은 존재하지 않는 아이디 입니다.` });
    }
    else if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: `비밀번호가 일치하지 않습니다.` });
    }

    const c2sAccessToken = req.cookies.accessToken;    

    let s2cAccessToken = 0;
    let s2cRefreshToken = 0;

    let newAccessToken = false;

    if (!c2sAccessToken) // 액세스 토큰이 없음
    {
        // 액세스 토큰 새 발행
        newAccessToken = true;
    }
    else // 액세스 토큰이 있음
    {        
        // 액세스 토큰 유효한지 확인
        // 유효하면 로그인 성공
        const [tokenType, token] = c2sAccessToken.split(' ');

        if (tokenType !== process.env.TOKEN_TYPE_CHECK) {
            return res.status(404).send('not found');
        }

        // 다른 유저의 AccessToken을 가지고 왔을 경우
        const myToken = CreateAccessToken(id);
        if (myToken !== c2sAccessToken)
        {
            newAccessToken = true;
        }
        else
        {
            const payload = ValidateToken(token, process.env.ACCESS_TOKEN_SECRET_KEY);
            if (!payload) // 액세스 토큰이 유효하지 않음
            {
                // 액세스 토큰 새 발행
                newAccessToken = true;
            }
        }        
    }

    // 액세스 토큰 새로 발급
    if (newAccessToken) {
        // DB에서 리프레시 토큰을 읽어옴
        const dbRefreshToken = await prisma.refreshTokens.findFirst({
            where: { userId: id },
            select: {
                token: true
            }
        });        

        // DB에 리프레시 토큰이 없음
        if (dbRefreshToken == null)
        {
            // 액세스 토큰과 리프레시 토큰을 새로 발급
            s2cAccessToken = CreateAccessToken(id);
            s2cRefreshToken = CreateRefreshToken(id);

            // 리프레시 토큰을 DB에 저장
            const newDBRefreshToken = await prisma.refreshTokens.create({
                data: {
                    userId: id,
                    token: s2cRefreshToken
                }
            });   

            // 쿠키 전달
            res.cookie('accessToken', s2cAccessToken);
            res.cookie('refreshToken', s2cRefreshToken);
        }
        else // DB에 리프레시 토큰이 있음
        {
            const [tokenType, token] = dbRefreshToken.token.split(' ');

            // 리프레시 토큰이 유효한지 확인
            const dbRefreshTokenCheck = ValidateToken(token, process.env.REFRESH_TOKEN_SECRET_KEY);
            if (dbRefreshTokenCheck) // 리프레티 토큰이 유효함
            {
                // 액세스 토큰 발급
                s2cAccessToken = CreateAccessToken(id);                

                // 액세스 토큰 전달
                res.cookie('accessToken', s2cAccessToken);
            }
            else // 리프레티 토큰이 유효하지 않음
            {
                // 액세스 토큰과 리프레시 토큰을 새로 발급
                s2cAccessToken = CreateAccessToken(id);
                s2cRefreshToken = CreateRefreshToken(id);

                // 리프레시 토큰을 DB에 업데이트
                const newDBRefreshToken = await prisma.refreshTokens.update({
                    where: { userId: id },
                    data: {                        
                        token: s2cRefreshToken
                    }
                }); 

                // 쿠키 전달
                res.cookie('accessToken', s2cAccessToken);
                res.cookie('refreshToken', s2cRefreshToken);
            }
        }
    }

    return res
        .status(200)
        .json({ message: `로그인 성공` });
});

export default router;