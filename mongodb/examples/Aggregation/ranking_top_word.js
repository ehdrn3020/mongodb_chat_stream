db.chat_messages.aggregate([
  {
    $project: {
      roomId: 1,
      ts: 1,
      words: { $split: [ { $toString: "$message" }, " " ] }
    }
  },
  { $unwind: "$words" },
  {
    $group: {
      _id: {
        room: "$roomId",
        hour: { $dateTrunc: { date: "$ts", unit: "hour" } },
        word: "$words"
      },
      count: { $sum: 1 }
    }
  },
  // window 파티션 키를 최상위로 올림(hoist)
  { $set: { room: "$_id.room", hour: "$_id.hour", word: "$_id.word" } },
  {
    $setWindowFields: {
      partitionBy: { room: "$room", hour: "$hour" },
      sortBy: { count: -1 },
      output: { rnk: { $rank: {} } }
    }
  },
  { $match: { rnk: { $lte: 3 } } },
  // 최종 출력용 프로젝션은 마지막
  { $project: { _id: 0, room: 1, hour: 1, word: 1, count: 1, rnk: 1 } },
  { $sort: { room: 1, hour: 1, rnk: 1 } }
]).forEach(doc => printjson(doc));
