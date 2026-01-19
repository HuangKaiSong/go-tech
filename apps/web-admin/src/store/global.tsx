import { createContext, Dispatch, FC, ReactNode, useContext, useReducer } from "react";

export interface GlobalState {
  theme: 'light' | 'dark';
}

export type GlobalAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }

const initialState: GlobalState = {
  theme: 'light',
}

const GlobalContext = createContext<{
  state: GlobalState;
  dispatch: Dispatch<GlobalAction>
}>({
  state: initialState,
  dispatch: () => null
})

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
  
  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalProvider');
  }
  return context;
};