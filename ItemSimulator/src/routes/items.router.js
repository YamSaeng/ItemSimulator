import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'

const router = express.Router();

router.post('/item-create', async (req, res, next) => {
    const { itemCode, itemName, itemStat, itemPrice } = req.body;

    const isExistItem = await prisma.items.findFirst({
        where: {
            itemCode: itemCode
        }
    });

    if (isExistItem) {
        return res
            .status(401)
            .json({ message: `${itemName}은 이미 존재하는 아이템입니다.` });
    }

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

export default router;