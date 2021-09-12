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

export default async function (fromEmail: string, postId: string) {
  // fromEmail : 좋아요 한 사람(누가)
  // toEmail : 좋아요를 받은 사람(나)
  // 최종적으로 좋아요가 눌린 나의 게시물로 이동
  const date = new Date().toISOString().slice(0, 19).replace("T", " ");

  // 작성자 email 찾기
  const getAuthor = `SELECT UserEmail FROM detail WHERE PostId =${postId}`;

  const author = (await promiseQuery(getAuthor)) as Object[];
  const toEmail = author[0]["UserEmail"];

  const userInfo = `SELECT user.email, user.nickname, user.profileImage, user.fcmToken
    FROM user WHERE email = '${fromEmail}' or email = '${toEmail}';`;

  const users = (await promiseQuery(userInfo)) as Object[];

  let fcmToken: string;
  let body: string;
  let image: string;

  for (let user of users) {
    if (user["email"] == fromEmail) {
      body = user["nickname"] + "님이 회원님의 게시물을 좋아합니다.";
      image = user["profileImage"];
    } else {
      fcmToken = user["fcmToken"];
    }
  }

  const query = `INSERT INTO push(pushCode, UserEmail, image, token, createdAt, title, body)
        VALUES(3, '${toEmail}', '${image}', '${postId}', '${date}', "추천",  '${body}');`;

  db.query(query, (err, results, field) => {
    if (err) console.log(err);

    const push: pushDTO = {
      data: {
        push_code: "3",
        push_id: results.insertId.toString(),
        image: image,
        token: postId.toString(),
        date: date,
        title: "추천",
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
