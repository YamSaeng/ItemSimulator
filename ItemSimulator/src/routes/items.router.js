import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'

const router = express.Router();

// 아이템 생성
router.post('/item-create', async (req, res, next) => {
    const { itemCode, itemName, itemStat, itemPrice } = req.body;

    // 생성할 아이템이 이미 있는지 확인
    const isExistItem = await prisma.items.findFirst({
        where: {
            itemCode: itemCode
        }
    });

    // 생성할 아이템이 이미 있으면 에러 반환
    if (isExistItem) {
        return res
            .status(401)
            .json({ message: `${itemName}은 이미 존재하는 아이템입니다.` });
    }

    // Items 테이블에 아이템 생성
    const dbNewItem = await prisma.items.create({
        data: {
            itemCode: itemCode,
            itemName: itemName,
            itemPrice: itemPrice,
            itemStr: itemStat.itemStr,
            itemDex: itemStat.itemDex,
            itemInt: itemStat.itemInt
        }
    });

    return res
        .status(200)
        .json({ message: `${itemName} 아이템을 만들었습니다.` });
});

// 아이템 수정
router.post('/item-edit/:itemCode', async (req, res, next) => {
    const { itemCode } = req.params;
    const editData = req.body;

    // 아이템을 찾음
    const searchItem = await prisma.items.findFirst({
        where: {
            itemCode: +itemCode
        }
    });

    // 못찾으면 에러 반환
    if (!searchItem) {
        return res
            .status(401)
            .json({ message: `수정할 아이템이 서버에 존재하지 않습니다.` });
    }

    // 가격 속성 삭제해서 가격 수정할 수 없게 함
    delete editData.itemPrice;

    // 아이템 나머지 능력치가 정해지지 않을 경우 각 데이터를 0으로 초기화
    if (editData.itemStr === undefined) {
        editData.itemStr = 0;
    }

    if (editData.itemDex === undefined) {
        editData.itemDex = 0;
    }

    if (editData.itemInt === undefined) {
        editData.itemInt = 0;
    }

    // item 테이블 업데이트
    await prisma.items.update({
        where: {
            itemCode: +itemCode
        },
        data: {
            ...editData           
        }
    });

    return res
        .status(200)
        .json({ message: `${itemCode} 아이템 수정 성공` });
});

export default router;