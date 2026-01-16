import { createContext, useContext, ReactNode } from 'react';

interface IframeContextType {
  hasIframe: boolean;
}

const IframeContext = createContext<IframeContextType | undefined>(undefined);

export const IframeProvider: React.FC<{ 
  children: ReactNode; 
  hasIframe: boolean 
}> = ({ children, hasIframe }) => {
  return (
    <IframeContext.Provider value={{ hasIframe }}>
      {children}
    </IframeContext.Provider>
  );
};

export const useIframeContext = () => {
  const context = useContext(IframeContext);
  if (!context) {
    throw new Error('useIframeContext must be used within an IframeProvider');
  }
  return context;
};