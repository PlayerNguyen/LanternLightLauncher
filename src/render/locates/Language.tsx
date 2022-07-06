export interface LanguageInterface {
  [key: string]: {
    [key: string]: any;
  };
}

export function getLanguageOf(language: string): LanguageInterface {
  if (!Language[language]) {
    throw new Error(`Language ${language} not found`);
  }
  return Language[language];
}

export function getStringFromLanguage(language: string, key: string): string {
  // console.log(getLanguageOf(language));
  let currentObject: LanguageInterface | undefined = getLanguageOf(language);
  let nodeList = key.split(".");

  while (nodeList.length > 0) {
    let top = nodeList.shift();
    if (top === undefined) {
      currentObject = undefined;
      break;
    }
    currentObject = currentObject[top];
  }

  return currentObject ? currentObject.toString() : `{${key}}`;
}

const Language: LanguageInterface = {
  en: {
    name: "English",
    flag: "🇺🇸",
    code: "en",
    direction: "ltr",
    locale: "en-US",
    sidebar: {
      home: "Home",
      settings: "Settings",
    },
    home: {
      username: "Username",
      version: "Version",
      usernamePlaceholder: "Who is playing?",
      play: "Play",
    },
  },
};
export default Language;
