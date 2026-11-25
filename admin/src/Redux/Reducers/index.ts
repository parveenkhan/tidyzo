import { combineReducers } from '@reduxjs/toolkit';
import auth from './Auth.Reducer';
import workspace from './Workspace.Reducer';

const rootReducer = combineReducers({ auth, workspace });
export default rootReducer;
