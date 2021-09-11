export default interface pushDTO {
  data: {
    push_code: string;
    push_id: string;
    image: string;
    token: string;
    date: string;
    title: string;
    body: string;
  };
  token: string;
}
