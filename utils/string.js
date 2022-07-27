import kebabCase from "lodash/kebabCase.js";
import replaceSpecialCharacters from "replace-special-characters";

export const formatFileName = (str) => {
  const splitted = str.split(".");
  const extension = splitted.slice(-1)[0];
  const name = splitted.slice(0, -1).join(".");

  return `${kebabCase(replaceSpecialCharacters(name))}.${extension}`;
};
