import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { prisma } from '../utils/prisma/prismaClient.js'
import { ValidateToken } from '../routes/users.router.js'
import authMiddleware from '../../middlewares/auth.middleware.js'

const router = express.Router();

// 캐릭터 생성
router.post('/character-create', authMiddleware, async (req, res, next) => {
    const { characterName } = req.body;

    // 생성하고자 하는 캐릭터가 이미 DB에 있는지 확인한다.
    const isExistCharacter = await prisma.characters.findFirst({
        where: { characterName: characterName }
    });

    // 있으면 에러를 반환한다.
    if (isExistCharacter) {
        return res.status(401).json({ message: `${characterName}은 이미 존재하는 캐릭터 이름입니다.` })
    }

    // 캐릭터를 생성해 DB에 저장한다.
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

    // 인벤토리를 생성해 DB에 저장한다.
    const newInventory = await prisma.inventory.create({
        data: {
            characterId: dbNewCharacter.characterId
        }
    });

    // 인벤토리 아이템을 생성해 DB에 저장한다.
    for (let i = 0; i < newInventory.maxInventoryItem; i++) {
        await prisma.inventoryItem.create({
            data: {
                inventoryId: newInventory.inventoryId,
                inventoryItemIndex: i
            }
        });
    }

    return res
        .status(200)
        .json({ message: `${characterName} 캐릭터를 만들었습니다. 캐릭번호 : [${dbNewCharacter.characterId}]` });
});

// 캐릭터 삭제
router.delete('/character-delete/:deleteCharacterId', authMiddleware, async (req, res, next) => {
    const { deleteCharacterId } = req.params;

    // 삭제할 캐릭터를 찾는다.
    const deleteCharacter = await prisma.characters.findFirst({
        where: {
            characterId: +deleteCharacterId
        }
    });

    // 삭제할 캐릭터가 없으면 에러를 받환한다.
    if (!deleteCharacter) {
        return res
            .status(401)
            .json({ message: `삭제할 캐릭터가 서버에 존재하지 않습니다.` });
    }

    // 삭제할 캐릭터의 userId와 요청한 유저의 userId가 다르면 삭제시키지 않는다.
    if (deleteCharacter.userId !== req.user.id) {
        return res
            .status(401)
            .json({ message: `유효한 접근이 아닙니다.` });
    }

    // 클라에게 알려주기 위해 따로 저장한다.
    const deleteCharacterName = deleteCharacter.characterName;

    // 캐릭터를 DB에서 삭제시킨다.
    await prisma.characters.delete({
        where: {
            characterId: +deleteCharacterId
        }
    });

    return res
        .status(200)
        .json({ message: `${deleteCharacterName} 캐릭터가 삭제되었습니다.` });
});

// 캐릭터 조회
router.get('/character-search/:searchCharacterId', authMiddleware, async (req, res, next) => {
    const { searchCharacterId } = req.params;

    // 검색할 캐릭터를 characters DB에서 찾음
    const searchCharacter = await prisma.characters.findFirst({
        where: {
            characterId: +searchCharacterId
        },
        select: {
            userId: true,
            characterName: true,
            hp: true,
            str: true,
            dex: true,
            int: true,
            money: true
        }
    });

    // 못찾으면 에러 반환
    if (!searchCharacter) {
        return res
            .status(401)
            .json({ message: `검색할 캐릭터가 서버에 존재하지 않습니다.` });
    }

    // 찾고자 하는 캐릭이 내캐릭이 아니면 돈 정보를 숨기고
    // 내캐릭이면 돈 정보까지 같이 보여준다.
    if (searchCharacter.userId !== req.user.id) {
        return res
            .status(200)
            .json({
                "name": searchCharacter.characterName,
                "health": searchCharacter.hp,
                "str": searchCharacter.str,
                "dex": searchCharacter.dex,
                "int": searchCharacter.int
            });
    }
    else {
        return res
            .status(200)
            .json({
                "name": searchCharacter.characterName,
                "health": searchCharacter.hp,
                "str": searchCharacter.str,
                "dex": searchCharacter.dex,
                "int": searchCharacter.int,
                "money": searchCharacter.money
            });
    }
});

export default router;