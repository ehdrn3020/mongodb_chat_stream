// 방별, 시간대별 메시지 건수
db.chat_messages.aggregate([
  {$project:{
    roomId:1,
    hour: {$dateTrunc:{date:"$ts", unit:"hour"}}
  }},
  {$group:{_id:{room:"$roomId", hour:"$hour"}, cnt:{$sum:1}}},
  {$sort: {"_id.room":1, "_id.hour":1}}
]).forEach(doc => printjson(doc))
