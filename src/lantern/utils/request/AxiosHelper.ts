import axios from "axios";

export const AxiosStreamLoader = axios.create({
  responseType: "stream",
});

export const AxiosJsonLoader = axios.create({ responseType: "json" });
