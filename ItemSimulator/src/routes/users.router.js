import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'
import bcrypt from 'bcrypt';

const router = express.Router();

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

export default router;