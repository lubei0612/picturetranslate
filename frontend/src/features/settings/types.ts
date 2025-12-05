export interface UserSettings {
  defaultTargetLang: string;
  defaultEngine: string;
  autoInpaint: boolean;
  demoMode: boolean;
}

export interface EngineOption {
  name: string;
  displayName: string;
  available: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}
