import {SET_USER} from '../actions/userActions';

const innitialState = null;

const userReducer=(state = innitialState, action) => {
  switch (action.type) {
    case SET_USER:
      return action.payload;
    default:
      return state;
  }
}

export default userReducer;