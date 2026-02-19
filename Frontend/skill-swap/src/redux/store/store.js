import { legacy_createStore as createStore } from "redux";
import userReducer from "../reducers/userReducers";

const persistedUser = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

const store = createStore(userReducer, persistedUser);

export default store;
