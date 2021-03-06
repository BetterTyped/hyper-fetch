const arrayOf = <T>(length: number, mapFunc: (index: number) => T): T[] =>
  Array.from({ length }, (_, index) => mapFunc(index));

const lerp = (min: number, max: number, t: number): number => {
  return min * (1 - t) + max * t;
};

const round = (value: number, decimalPoint = 0): number => {
  if (decimalPoint >= 0) {
    return Math.round(value * 10 ** decimalPoint) / 10 ** decimalPoint;
  }

  const exp = Number(`10e${decimalPoint - 1}`);
  return Math.round(value * exp) * 10 ** Math.abs(decimalPoint);
};

const lerpRounded = (min: number, max: number, t: number, decimalPoint = 0): number =>
  round(lerp(min, max, t), decimalPoint);

const words = [
  "a",
  "ac",
  "accumsan",
  "ad",
  "adipiscing",
  "aenean",
  "aenean",
  "aliquam",
  "aliquam",
  "aliquet",
  "amet",
  "ante",
  "aptent",
  "arcu",
  "at",
  "auctor",
  "augue",
  "bibendum",
  "blandit",
  "class",
  "commodo",
  "condimentum",
  "congue",
  "consectetur",
  "consequat",
  "conubia",
  "convallis",
  "cras",
  "cubilia",
  "curabitur",
  "curabitur",
  "curae",
  "cursus",
  "dapibus",
  "diam",
  "dictum",
  "dictumst",
  "dolor",
  "donec",
  "donec",
  "dui",
  "duis",
  "egestas",
  "eget",
  "eleifend",
  "elementum",
  "elit",
  "enim",
  "erat",
  "eros",
  "est",
  "et",
  "etiam",
  "etiam",
  "eu",
  "euismod",
  "facilisis",
  "fames",
  "faucibus",
  "felis",
  "fermentum",
  "feugiat",
  "fringilla",
  "fusce",
  "gravida",
  "habitant",
  "habitasse",
  "hac",
  "hendrerit",
  "himenaeos",
  "iaculis",
  "id",
  "imperdiet",
  "in",
  "inceptos",
  "integer",
  "interdum",
  "ipsum",
  "justo",
  "lacinia",
  "lacus",
  "laoreet",
  "lectus",
  "leo",
  "libero",
  "ligula",
  "litora",
  "lobortis",
  "lorem",
  "luctus",
  "maecenas",
  "magna",
  "malesuada",
  "massa",
  "mattis",
  "mauris",
  "metus",
  "mi",
  "molestie",
  "mollis",
  "morbi",
  "nam",
  "nec",
  "neque",
  "netus",
  "nibh",
  "nisi",
  "nisl",
  "non",
  "nostra",
  "nulla",
  "nullam",
  "nunc",
  "odio",
  "orci",
  "ornare",
  "pellentesque",
  "per",
  "pharetra",
  "phasellus",
  "placerat",
  "platea",
  "porta",
  "porttitor",
  "posuere",
  "potenti",
  "praesent",
  "pretium",
  "primis",
  "proin",
  "pulvinar",
  "purus",
  "quam",
  "quis",
  "quisque",
  "quisque",
  "rhoncus",
  "risus",
  "rutrum",
  "sagittis",
  "sapien",
  "scelerisque",
  "sed",
  "sem",
  "semper",
  "senectus",
  "sit",
  "sociosqu",
  "sodales",
  "sollicitudin",
  "suscipit",
  "suspendisse",
  "taciti",
  "tellus",
  "tempor",
  "tempus",
  "tincidunt",
  "torquent",
  "tortor",
  "tristique",
  "turpis",
  "ullamcorper",
  "ultrices",
  "ultricies",
  "urna",
  "ut",
  "ut",
  "varius",
  "vehicula",
  "vel",
  "velit",
  "venenatis",
  "vestibulum",
  "vitae",
  "vivamus",
  "viverra",
  "volutpat",
  "vulputate",
];

export const getWord = (): string => words[lerpRounded(0, words.length - 1, Math.random())];

export const getWords = (min: number, max: number): string[] => arrayOf(lerpRounded(min, max, Math.random()), getWord);

export const randomWords = (min = 2, max = 10): string => getWords(min, max).join(" ");

export const randomSentence = (min = 8, max = 20): string => {
  const sentence = getWords(min, max);
  if (sentence.length) {
    sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
    sentence[sentence.length - 1] += ".";
  }
  return sentence.join(" ");
};

export const randomParagraph = (min: number, max: number): string => {
  const sentencesAmount = lerpRounded(min, max, Math.random());
  return arrayOf(sentencesAmount, () => randomSentence()).join(" ");
};
