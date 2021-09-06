import amqp from "amqplib/callback_api";
import mysql from "mysql";
import dotenv from "dotenv";

import makeMessage from "./makeMessage";

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

amqp.connect("amqp://127.0.0.1", function (err, conn) {
  if (err) {
    throw err;
  }

  connection.connect((err) => {
    if (err) console.log(err);
    console.log("connect successfully");
  });

  // General push 관리
  conn.createChannel(function (err1, channel) {
    if (err1) {
      throw err1;
    }
    var exchange = "direct_logs";

    channel.assertExchange(exchange, "direct", {
      durable: false,
    });

    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      function (err2, q) {
        if (err2) {
          throw err2;
        }
        console.log("[General] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "general");

        channel.consume(
          q.queue,
          (msg) => {
            const date = new Date()
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");

            let key = msg.fields.routingKey;
            msg = JSON.parse(msg.content.toString());

            console.log("[General] %s: ", key, msg);

            //PUSH db 삽입
            const query = `INSERT INTO push(pushCode, image, token, createdAt) VALUES(${msg.pushCode}, '${msg.image}', '${msg.token}', '${date}');`;
            connection.query(query, (err, results, field) => {
              if (err) console.log(err);

              const push = makeMessage(msg, results.insertId, date);
              console.log(push);

              // 여기서 firebase-admin 연결해서 전송
            });
          },
          {
            noAck: true,
          }
        );
      }
    );

    // Admin push 관리
    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      function (err2, q) {
        if (err2) {
          throw err2;
        }
        console.log(" [Admin] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "admin");

        channel.consume(
          q.queue,
          (msg) => {
            console.log(
              " [Admin] %s: '%s'",
              msg.fields.routingKey,
              msg.content.toString()
            );
          },
          {
            noAck: true,
          }
        );
      }
    );
  });
});

process.on("SIGINT", function () {
  console.log("Caught interrupt signal");
  connection.end();
  process.exit(0);
});
