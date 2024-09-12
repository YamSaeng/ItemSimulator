import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js'
import authMiddleware from '../../middlewares/auth.middleware.js'

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

// 아이템 전체 조회
router.get('/item', async (req, res, next) => {
    // itemCode를 기준값으로 해서 오름차순으로 정렬해 데이터를 가져옴
    const allItems = await prisma.items.findMany({
        select: {
            itemCode: true,
            itemName: true,
            itemPrice: true,
            itemStr: true,
            itemDex: true,
            itemInt: true
        },
        orderBy: {
            itemCode: 'asc'
        }
    });

    // 조회한 전체 아이템 반환
    return res.status(200).json({ allItems });
});

// 특정 아이템 조회
router.get('/item/:itemCode', async (req, res, next) => {
    const { itemCode } = req.params;

    // itemCode로 item 테이블에서 아이템 찾음
    const item = await prisma.items.findFirst({
        where: {
            itemCode: +itemCode
        },
        select: {
            itemCode: true,
            itemName: true,
            itemPrice: true,
            itemStr: true,
            itemDex: true,
            itemInt: true,
        }
    })

    // 아이템을 찾지 못하면 에러 반환
    if (!item) {
        return res
            .status(401)
            .json({ message: '조회하고자 하는 아이템을 찾을 수 없습니다.' });
    }

    // 찾은 아이템 정보 반환
    return res
        .status(200)
        .json({ item });
});

// 아이템 구입
router.post('/item/buyItem/:itemBuyCharacterCode', authMiddleware, async (req, res, next) => {
    const { itemBuyCharacterCode } = req.params;
    const { itemCode, count } = req.body;

    // 구입하고자 하는 유저의 캐릭터를 찾음
    const character = await prisma.characters.findFirst({
        where: {
            characterId: +itemBuyCharacterCode
        }
    })

    // 캐릭터가 DB에 없으면 에러 반환
    if (!character) {
        return res.status(401).json({ message: "아이템을 구매하려는 캐릭터를 서버에서 찾을 수 없습니다." })
    }

    // 캐릭터가 로그인한 유저의 캐릭터인지 확인
    if (character.userId !== req.user.id) {
        return res
            .status(401)
            .json({ message: `유효한 접근이 아닙니다.` });
    }

    // 아이템이 DB에 있는지 확인
    const searchItem = await prisma.items.findFirst({
        where: {
            itemCode: +itemCode
        }
    });

    // 구매하려는 아이템이 DB에 없으면 에러 반환
    if (!searchItem) {
        return res
            .status(401)
            .json({ message: `구매하려는 아이템 코드 ${itemCode}를 찾을 수 없습니다.` });
    }

    // 구입하려는 아이템의 총 비용 계산
    const buyItemSumPrice = searchItem.itemPrice * count;
    if (buyItemSumPrice > character.money) { // 돈이 부족할 경우 에러 반환
        return res
            .status(401)
            .json({ message: `돈이 부족해 아이템을 구입할 수 없습니다.` })
    }
    else {
        // 캐릭터의 인벤토리를 찾는다.
        const chracterInventory = await prisma.inventory.findFirst({
            where: {
                characterId: character.characterId
            }
        });

        // 캐릭터의 인벤토리가 DB에 없으면 에러 반환
        if (!chracterInventory) {
            return res
                .status(401)
                .json({ message: `[itembuy] 인벤토리를 찾을 수 없습니다.` })
        }

        // 인벤토리에 이미 해당 아이템을 가지고 있는지 확인한다.
        const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
                itemId: searchItem.itemId
            }
        });

        // 인벤토리에 아이템이 이미 있으면 개수를 증가시켜준다.
        if (inventoryItem) {
            await prisma.inventoryItem.update({
                where: {
                    inventoryItemIndex: inventoryItem.inventoryItemIndex
                },
                data:{
                    inventoryItemCount: inventoryItem.inventoryItemCount + count
                }
            });
        }
        else { // 인벤토리에 아이템이 없으면 인벤토리에서 빈공간을 찾은 후 아이템을 넣어준다.
            const emptyInventoryItem = await prisma.inventoryItem.findFirst({
                where: {
                    inventoryId: chracterInventory.inventoryId,
                    itemId : null
                }
            });

            await prisma.inventoryItem.update({
                where: {
                    inventoryItemIndex: emptyInventoryItem.inventoryItemIndex
                },
                data: {
                    itemId: searchItem.itemId,
                    inventoryItemCount: count
                }
            })
        }

        // 잔돈을 계산해 character의 momey를 업데이트 한다.
        const change = character.money - buyItemSumPrice;

        const moneyUpdateCharacter = await prisma.characters.update({
            where: {
                characterId: character.characterId
            },
            data: {
                money: change
            }
        });

        return res
            .status(200)
            .json({ message: `아이템 구입 성공! 남은 돈 : ${moneyUpdateCharacter.money}` });
    }
});

export default router;