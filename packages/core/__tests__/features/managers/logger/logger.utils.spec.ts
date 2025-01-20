import { getTime, logger } from "managers";

describe("Logger [ Utils ]", () => {
  const logSpy = jest.spyOn(console, "log");
  const groupCollapsedSpy = jest.spyOn(console, "groupCollapsed");
  const groupEndSpy = jest.spyOn(console, "groupEnd");

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("Given using logger utils", () => {
    describe("When getTime util gets triggered", () => {
      it("should allow to format data string", async () => {
        const time = getTime();
        expect(time).toBeString();
      });
    });
    describe("When logger util gets triggered", () => {
      it("should allow to log allowed severity", async () => {
        logger({
          module: "Test",
          type: "system",
          level: "debug",
          title: "Test",
          extra: {},
        });
        expect(logSpy).toHaveBeenCalledTimes(1);
      });
      it("should allow to log additional data", async () => {
        const extra = { data: [{ test: 1 }] };

        logger({
          module: "Test",
          type: "system",
          level: "debug",
          title: "Test",
          extra,
        });
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(groupCollapsedSpy).toHaveBeenCalledTimes(1);
        expect(groupEndSpy).toHaveBeenCalledTimes(1);
      });
      // it("should not allow to log not-matching severity", async () => {
      //   logger({
      //     module: "Test",
      //     type: "system",
      //     level: "debug",
      //     title: "Test",
      //     extra: {},
      //   });
      //   expect(logSpy).toHaveBeenCalledTimes(0);
      // });
    });
  });
});

// // Logger
// export const logger: LoggerFunctionType = (log) => {
//   if (log.enabled && log.severity >= severity[log.level]) {
//     const styles = loggerStyles[log.level];
//     const emoji = loggerIconLevels[log.level];
//     const module = `%c[${log.module}]:[${getTime()}]:`;
//     const message = `${emoji}${module} ${log.message}`;

//     if (log.extra?.length) {
//       console.groupCollapsed(message, styles);
//       log.extra.forEach((data) => {
//         console.log(data);
//       });
//       console.groupEnd();
//     } else {
//       console.log(message, styles);
//     }
//   }
// };
