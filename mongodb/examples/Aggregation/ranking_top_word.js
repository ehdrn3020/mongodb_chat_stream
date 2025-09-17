db.chat_messages.aggregate([
  {$project:{
    roomId:1,
    hour: {$dateTrunc:{date:"$ts", unit:"hour"}},
    words: {$split:[{$toString:"$message"}, " "]}
  }},
  {$unwind:"$words"},
  {$group:{_id:{room:"$roomId", hour:"$hour", word:"$words"}, count:{$sum:1}}},
  {$set:{
    room:"$_id.room", hour:"$_id.hour", word:"$_id.word"
  }},
  {$setWindowFields:{
    partitionBy:{room:"$room", hour:"$hour"},
    sortBy:{count:-1},
    output:{ rnk:{$rank:{} } }
  }},
  {$match:{ rnk: {$lte: 3} }},         // 상위 3개
  {$project:{_id:0, room:1, hour:1, word:1, count:1, rnk:1}},
  {$sort:{room:1, hour:1, rnk:1}}
])
