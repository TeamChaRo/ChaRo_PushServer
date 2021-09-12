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

//누가 나를 팔로우했을 때(following)
export default async function (fromEmail: string, toEmail: string) {
  // fromEmail : 팔로우를 건 사람 (누가)
  // toEmail : 팔로우를 받은 사람(나)

  const date = new Date().toISOString().slice(0, 19).replace("T", " ");

  const userInfo = `SELECT user.email, user.nickname, user.profileImage, user.fcmToken
    FROM user WHERE email = '${fromEmail}' or email = '${toEmail}' ;`;

  const users = (await promiseQuery(userInfo)) as Object[];

  let fcmToken: string;
  let body: string;
  let image: string;

  for (let user of users) {
    if (user["email"] == fromEmail) {
      body = user["nickname"] + "님이 회원님을 팔로우하기 시작했습니다.";
      image = user["profileImage"];
    } else {
      fcmToken = user["fcmToken"];
    }
  }

  const query = `INSERT INTO push(pushCode, UserEmail, image, token, createdAt, title, body)
        VALUES(2, '${toEmail}', '${image}', '${fromEmail}', '${date}', "팔로잉",  '${body}');`;

  db.query(query, (err, results, field) => {
    if (err) console.log(err);

    const push: pushDTO = {
      data: {
        push_code: "2",
        push_id: results.insertId.toString(),
        image: image,
        token: fromEmail,
        date: date,
        title: "팔로잉",
        body: body,
      },
      token: fcmToken,
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
