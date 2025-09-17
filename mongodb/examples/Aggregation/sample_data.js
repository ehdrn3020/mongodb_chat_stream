use chatdb
db.dropDatabase()

db.users.insertMany([
  {_id: "alice",  nickname: "앨리스",  level: 3},
  {_id: "bob",    nickname: "밥",      level: 1},
  {_id: "carl",   nickname: "칼",      level: 2},
])

// 채팅 메시지 샘플 (room1/room2, 한글/영문 섞음)
db.chat_messages.insertMany([
  {roomId:"room1", userId:"alice", message:"안녕하세요 모두 hi",             ts: ISODate("2025-09-17T12:00:10Z")},
  {roomId:"room1", userId:"bob",   message:"관리자 호출 부탁합니다",         ts: ISODate("2025-09-17T12:00:40Z")},
  {roomId:"room1", userId:"alice", message:"오늘 점검 공지 check please",    ts: ISODate("2025-09-17T12:10:00Z")},
  {roomId:"room1", userId:"carl",  message:"hi hi hi welcome",               ts: ISODate("2025-09-17T12:12:00Z")},
  {roomId:"room2", userId:"alice", message:"room2 에서 테스트 시작",          ts: ISODate("2025-09-17T13:00:00Z")},
  {roomId:"room2", userId:"bob",   message:"테스트 진행 중입니다 hi",        ts: ISODate("2025-09-17T13:05:00Z")},
  {roomId:"room2", userId:"carl",  message:"관리자 호출 필요",               ts: ISODate("2025-09-17T13:06:00Z")},
  {roomId:"room1", userId:"bob",   message:"공지 확인 완료 ok",              ts: ISODate("2025-09-17T13:00:00Z")},
  {roomId:"room1", userId:"alice", message:"hi 확인",                        ts: ISODate("2025-09-17T13:01:00Z")},
  {roomId:"room1", userId:"carl",  message:"점검 완료",                      ts: ISODate("2025-09-17T13:02:00Z")},
])

db.chat_messages.createIndex({roomId:1, ts:-1})
