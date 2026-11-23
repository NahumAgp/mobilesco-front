import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const base = API_PATHS.RH;
export const rhGet = (path = "") => request(`${base}${path}`);
export const rhPost = (path, data) => request(`${base}${path}`, {
  method: "POST", ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const rhPut = (path, data) => request(`${base}${path}`, {
  method: "PUT", body: JSON.stringify(data),
});
