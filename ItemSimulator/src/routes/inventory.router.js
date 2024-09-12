import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'
import authMiddleware from '../../middlewares/auth.middleware.js'

const router = express.Router();

// �κ��丮 ������ ��ȸ
router.get('/inventory/:searchInventoryCharacterCode', authMiddleware, async (req, res, next) => {
    const { searchInventoryCharacterCode } = req.params;

    // ��ȸ�ϰ��� �ϴ� ������ ĳ���͸� ã��
    const searchCharacter = await prisma.characters.findFirst({
        where: {
            characterId: +searchInventoryCharacterCode
        }
    })

    // ĳ���Ͱ� DB�� ������ ���� ��ȯ
    if (!searchCharacter) {
        return res.status(401).json({ message: "��ȸ�Ϸ��� ĳ���͸� �������� ã�� �� �����ϴ�." })
    }

    // �κ��丮�� ã��
    const searchInventory = await prisma.inventory.findFirst({
        where: {
            characterId: searchCharacter.characterId
        }
    })

    // �κ��丮�� �� ã�� ���
    if (!searchInventory) {
        return res.status(401).json({ message: "[inventoryItemSearch] �κ��丮�� ã���� �����ϴ�." })
    }

    // �κ��丮�� ������ �ִ� ��� �������� ã��
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