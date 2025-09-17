db.chat_messages.aggregate([
  {$project:{
    roomId:1,
    hour: {$dateTrunc:{date:"$ts", unit:"hour"}},
    words: {
      $filter: {
        input: {$split:[{$toString:"$message"}, " "]},
        as: "w",
        cond: {$gt:[{$strLenCP:"$$w"}, 0]}
      }
    }
  }},
  {$unwind:"$words"},
  {$group:{_id:{room:"$roomId", hour:"$hour", word:"$words"}, count:{$sum:1}}},
  {$sort: {count:-1}},
  {$limit: 20}
])
