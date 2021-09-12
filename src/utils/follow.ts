import db from "../loaders/database";
import admin from "firebase-admin";

import pushDTO from "../interface/pushDTO";
function promiseQuery(query: string) {
  return new Promise(function (resolve, reject) {
    db.query(query, (err, results, field) => {
      if (err) console.log(err);
      resolve(results);
    });
  });
}

export default async function (email: string, postId: number) {
  // follow 목록 정보 불러오기
  const followList = `SELECT user.email, user.fcmToken
    FROM user JOIN follow
    WHERE follow.followed = '${email}' and follow.follower = user.email;`;

  const userInfo = `SELECT user.nickname, user.profileImage
    FROM user WHERE email = '${email}';`;

  await Promise.all([promiseQuery(followList), promiseQuery(userInfo)])
    .then((result) => {
      const date = new Date().toISOString().slice(0, 19).replace("T", " ");
      const body =
        result[1][0]["nickname"] + "님의 새로운 드라이브 코스를 확인하세요!";
      const image = result[1][0]["profileImage"];

      // DB속 push 에 insert하면서,, message만들고 전송
      const followers = result[0] as Object[];

      for (let follower of followers) {
        const query = `INSERT INTO push(pushCode, UserEmail, image, token, createdAt, title, body)
        VALUES(1, '${follower["email"]}', '${image}', ${postId}, '${date}', "팔로우",  '${body}');`;

        db.query(query, (err, results, field) => {
          if (err) console.log(err);

          const push: pushDTO = {
            data: {
              push_code: "1",
              push_id: results.insertId.toString(),
              image: image,
              token: postId.toString(),
              date: date,
              title: "팔로우",
              body: body,
            },
            token: follower["fcmToken"],
          };

          // 전송
          admin
            .messaging()
            .send(push)
            .then((response) => {
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              console.log("Error sending message:", error);
            });
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
