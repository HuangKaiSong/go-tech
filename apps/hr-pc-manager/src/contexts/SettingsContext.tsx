import { createContext, useContext, useState, ReactNode } from "react";

export interface GeneralSettings {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  passwordStrength: boolean;
  autoLogout: boolean;
}

export interface NotificationSettings {
  leaveApproval: boolean;
  onboardingReminder: boolean;
  salaryNotification: boolean;
}

export interface SettingsState {
  general: GeneralSettings;
  security: SecuritySettings;
  notification: NotificationSettings;
}

interface SettingsContextType {
  settings: SettingsState;
  updateGeneralSettings: (settings: GeneralSettings) => void;
  updateSecuritySettings: (settings: SecuritySettings) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  general: {
    companyName: "示範科技股份有限公司",
    taxId: "12345678",
    address: "台北市信義區信義路五段7號",
    phone: "02-2345-6789",
  },
  security: {
    twoFactorAuth: false,
    passwordStrength: true,
    autoLogout: true,
  },
  notification: {
    leaveApproval: true,
    onboardingReminder: true,
    salaryNotification: true,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  const updateGeneralSettings = (general: GeneralSettings) => {
    setSettings((prev) => ({ ...prev, general }));
  };

  const updateSecuritySettings = (security: SecuritySettings) => {
    setSettings((prev) => ({ ...prev, security }));
  };

  const updateNotificationSettings = (notification: NotificationSettings) => {
    setSettings((prev) => ({ ...prev, notification }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateGeneralSettings,
        updateSecuritySettings,
        updateNotificationSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
