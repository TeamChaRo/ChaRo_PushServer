import amqp from "amqplib/callback_api";

amqp.connect("amqp://127.0.0.1", function (err, conn) {
  if (err) {
    throw err;
  }

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
        console.log(" [General] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, "general");

        channel.consume(
          q.queue,
          (msg) => {
            console.log(
              " [General] %s: '%s'",
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
