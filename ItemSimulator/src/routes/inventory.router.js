import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'
import authMiddleware from '../../middlewares/auth.middleware.js'

const router = express.Router();

// 인벤토리 아이템 조회
router.get('/inventory/:searchInventoryCharacterCode', authMiddleware, async (req, res, next) => {
    const { searchInventoryCharacterCode } = req.params;

    // 조회하고자 하는 유저의 캐릭터를 찾음
    const searchCharacter = await prisma.characters.findFirst({
        where: {
            characterId: +searchInventoryCharacterCode
        }
    })

    // 캐릭터가 DB에 없으면 에러 반환
    if (!searchCharacter) {
        return res.status(401).json({ message: "조회하려는 캐릭터를 서버에서 찾을 수 없습니다." })
    }

    // 인벤토리를 찾음
    const searchInventory = await prisma.inventory.findFirst({
        where: {
            characterId: searchCharacter.characterId
        }
    })

    // 인벤토리를 못 찾을 경우
    if (!searchInventory) {
        return res.status(401).json({ message: "[inventoryItemSearch] 인벤토리를 찾을수 없습니다." })
    }

    // 인벤토리에 가지고 있는 모든 아이템을 찾음
    const allInventoryItems = await prisma.inventoryItem.findMany({
        select: {
            itemId: true,
            inventoryItemCount: true
        },
        where: {
            inventoryId: searchInventory.inventoryId,
            NOT: {
                itemId: 0
            }
        },
        orderBy: {
            inventoryItemIndex: 'asc'
        }
    })

    return res.status(200).json({ allInventoryItems });
});

export default router;