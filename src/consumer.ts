import amqp from "amqplib/callback_api";
import db from "./loaders/database";

import connectFirebase from "./loaders/firebase";
import connectDB from "./loaders/connect";

import sendFollow from "./utils/follow";
import sendFollowing from "./utils/following";
import sendLike from "./utils/like";

connectDB();
connectFirebase();

amqp.connect("amqp://127.0.0.1", (err, conn) => {
  if (err) throw err;

  conn.on("error", (error) => {
    if (error.message !== "Connection closing") {
      console.log("[AMQP] conn error", error.message);
    }
  });

  conn.on("close", () => {
    console.log("[AMQP] reconnecting");
    setTimeout(() => {
      amqp.connect((error, connection) => {
        if (error) {
          console.log("[AMQP] reconnecting failed");
        } else {
          console.log("[AMQP] reconnected");
          conn = connection;
        }
      });
    }, 1000);
  });

  /**
   * 1 channel - 4 queues
   */
  conn.createChannel((err1, channel) => {
    if (err1) {
      throw err1;
    }
    const exchange = "direct";

    channel.assertExchange(exchange, "direct", {
      durable: false,
    });

    // 팔로우한 이용자가 게시물을 올렸을 때(follow)
    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      (err2, q) => {
        if (err2) throw err2;

        console.log("[Follow] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "follow");

        channel.consume(
          q.queue,
          (msg) => {
            msg = JSON.parse(msg.content.toString());

            const email = msg.email;
            const postId = msg.token[0];

            sendFollow(email, postId);
          },
          {
            noAck: true,
          }
        );
      }
    );

    //누가 나를 팔로우했을 때(following)
    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      (err2, q) => {
        if (err2) throw err2;

        console.log("[Following] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "following");

        channel.consume(
          q.queue,
          (msg) => {
            msg = JSON.parse(msg.content.toString());

            const fromEmail = msg.email;
            const toEmail = msg.token[0];

            sendFollowing(fromEmail, toEmail);
          },
          {
            noAck: true,
          }
        );
      }
    );

    // 내가 작성한 게시물을 누가 추천(하트)했을 때 알림(like)
    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      (err2, q) => {
        if (err2) throw err2;

        console.log("[Like] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "like");

        channel.consume(
          q.queue,
          (msg) => {
            msg = JSON.parse(msg.content.toString());

            const fromEmail = msg.email;
            const postId = msg.token;

            sendLike(fromEmail, postId);
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
  db.end();
  process.exit(0);
});
