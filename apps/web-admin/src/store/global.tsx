import { type Dispatch, type FC, type ReactNode, createContext, useContext, useReducer } from 'react';

export interface GlobalState {
  theme: 'dark' | 'light';
}

export type GlobalAction = { payload: 'dark' | 'light'; type: 'SET_THEME' };

const initialState: GlobalState = {
  theme: 'light'
};

const GlobalContext = createContext<{
  dispatch: Dispatch<GlobalAction>;
  state: GlobalState;
}>({
  state: initialState,
  dispatch: () => null
});

const globalReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};

export const GlobalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return <GlobalContext.Provider value={{ state, dispatch }}>{children}</GlobalContext.Provider>;
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalProvider');
  }
  return context;
};
