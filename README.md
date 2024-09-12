아이템 시뮬레이터 

회원 가입 POST ItemSimulator/sign-up
 
-  id, password, passwordConfirm을 json으로 입력받음

예시)

	"id":"a1",
	"password":"aaaa4321",
	"confirmPassword":"aaaa4321"
 

------------------------------------------
로그인 POST ItemSimulator/sign-in

-  id, password를 json으로 입력받음

예시)

	"id":"a1",
	"password":"aaaa4321"

------------------------------------------
캐릭터 생성 POST ItemSimulator/character-create

-  생성할 캐릭터 이름 characterName을 json으로 입력받음

예시)

	"characterName":"얌생"

------------------------------------------
캐릭터 삭제 DELETE ItemSimulator/character-delete/:deleteCharacterId

-  삭제할 캐릭터의 코드를 params로 받음
 
예시) ItemSimulator/ItemSimulator/character-delete/1

-------------------------------------------------
캐릭터 조회 GET ItemSimulator/character-search/:searchCharacterId

- 조회할 캐릭터의 코드를 params로 받음
 
예시) /ItemSimulator/character-search/1

-------------------------------------------------
아이템 생성 POST ItemSimulator/item-create

 - 생성할 아이템의 정보를 Json으로 입력받음
   
예시)

	"itemCode":1,
	"itemName":"검",
	"itemStat":{"itemStr":10, "itemDex":5, "itemInt":1},
	"itemPrice":50	

-----------------------------------------------------
아이템 수정 POST ItemSimulator/item-edit/:itemCode

 - 수정할 아이템의 코드를 params로 받음
 - 수정할 아이템의 내용을 Json으로 입력받음
   
예시) ItemSimulator/ItemSimulator/item-edit/1

	"itemName":"수정된검",
	"itemStr":15

-------------------------------------------------------
아이템 전체 조회 GET /item

-  DB에 기록중인 아이템 전체 조회

-------------------------------------------------------
특정 아이템 조회 GET ItemSimulator/item/:itemCode

 - 조회할 아이템의 코드를 params로 받음
   
예시) ItemSimulator/ItemSimulator/item/1

----------------------------------------------------------------
아이템 구입 POST ItemSimulator/item/buyItem/:itemBuyCharacterCode

-  아이템 구입하고자 하는 캐릭터의 코드를 params로 받음
-  구입하고자 하는 아이템의 코드와 개수를 Json으로 입력받음
  
예시) ItemSimulator/ItemSimulator/item/buyItem/1

  	"itemCode": 1,
 	"count": 1

------------------------------------------------------------------
아이템 판매 POST ItemSimulator/item/sellItem/:itemSellCharacterCode

-  아이템 판매하고자 하는 캐릭터의 코드를 params로 받음
-  판매하고자 하는 아이템의 코드와 개수를 Json으로 입력받음
  
예시) ItemSimulator/ItemSimulator/item/sellItem/1

  	"itemCode": 1,
 	"count": 1
