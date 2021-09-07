export default function (msg: Object, id: number, date: string): Object {
  const code = msg["pushCode"];
  let push = {
    data: {
      push_code: code.toString(),
      push_id: id.toString(),
      image: msg["image"],
      token: msg["token"],
      date: date,
      title: "",
      body: "",
    },
    token: msg["to"],
  };

  if (code == 0) {
    push.data.title = "팔로우한 사람 게시글 올림";
    push.data.body = "게시글 올림 바디";
  } else if (code == 1) {
    push.data.title = "누가 나를 팔로우";
    push.data.body = "누가나를 파로우 바디";
  } else if (code == 2) {
    push.data.title = "내 게시물 좋아여";
    push.data.body = "좋아여 바디";
  }
  return push;
}
